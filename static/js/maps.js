if(typeof org == "undefined") org = new Object();
if(typeof org.sarsoft == "undefined") org.sarsoft = new Object();

if(typeof org.sarsoft.EnhancedGMap == "undefined") org.sarsoft.EnhancedGMap = new Object();

org.sarsoft.EnhancedGMap._createTileLayers = function(config) {
	var that = this;
	var layer;
	if(config.type == "TILE") {
		return [new GTileLayer(new GCopyrightCollection(config.copyright), config.minresolution, config.maxresolution, { isPng: config.png, tileUrlTemplate: config.template })];
	} else if(config.type == "WMS") {
		layer = new GTileLayer(new GCopyrightCollection(config.copyright), config.minresolution, config.maxresolution, { isPng: config.png });
		layer.getTileUrl = function(tile, zoom) { 
			var size = config.tilesize ? config.tilesize : 256;
		    var southWestPixel = new GPoint( tile.x * size, ( tile.y + 1 ) * size);
		    var northEastPixel = new GPoint( ( tile.x + 1 ) * size, tile.y * size);
		    var southWestCoords = G_SATELLITE_MAP.getProjection().fromPixelToLatLng( southWestPixel, zoom );
		    var northEastCoords = G_SATELLITE_MAP.getProjection().fromPixelToLatLng( northEastPixel, zoom );
		    var url = config.template;
		    url = url.replace(/\{left\}/g, southWestCoords.lng());
		    url = url.replace(/\{bottom\}/g, southWestCoords.lat());
		    url = url.replace(/\{right\}/g, northEastCoords.lng());
		    url = url.replace(/\{top\}/g, northEastCoords.lat());
		    url = url.replace(/\{tilesize\}/g, size);
		    return url;
		};
		layer.wmstemplate = config.template;
		return [layer];
	} else if(config.type == "NATIVE") {
		return eval(config.template+'.getTileLayers()');
	}
}

org.sarsoft.EnhancedGMap.createMap = function(element, center, zoom) {
	if(GBrowserIsCompatible()) {
		var map = new GMap2(element);
		$(element).css({"z-index": 0, overflow: "hidden"});

		if(typeof G_PHYSICAL_MAP != "undefined") {
			map.addMapType(G_PHYSICAL_MAP);
		}

		var mapTypes = new Array(), type = null;
		for(var i = 0; i < org.sarsoft.EnhancedGMap.defaultMapTypes.length; i++) {
			var config = org.sarsoft.EnhancedGMap.defaultMapTypes[i];
			if(config.type == "NATIVE") {
				type = eval(config.template);
			} else {
				var layers = org.sarsoft.EnhancedGMap._createTileLayers(config);
			    type = new GMapType(layers, G_SATELLITE_MAP.getProjection(), config.name, { errorMessage: "", tileSize: config.tilesize ? config.tilesize : 256 } );
			    if(config.alphaOverlay) type._alphaOverlay = true;
			    type._info = config.info;
			}
			mapTypes.push(type);
			map.addMapType(type);
		}

		map.geoRefImages = org.sarsoft.EnhancedGMap.geoRefImages.slice(0);

		if(center == null) center = new GLatLng(org.sarsoft.map._default.lat, org.sarsoft.map._default.lng);
		if(zoom == null) zoom = org.sarsoft.map._default.zoom;
		map.setCenter(center, zoom);
		map.addControl(new OverlayDropdownMapControl());
		map.addControl(new GLargeMapControl3D());
		map.addControl(new GScaleControl());
		return map;
	}
}
 
OverlayDropdownMapControl = function() {
	this.extras = document.createElement("span");
}

OverlayDropdownMapControl.prototype = new GControl();
OverlayDropdownMapControl.prototype.printable = function() { return false; }
OverlayDropdownMapControl.prototype.selectable = function() { return false; }
OverlayDropdownMapControl.prototype.getDefaultPosition = function() { return new GControlPosition(G_ANCHOR_TOP_RIGHT, new GSize(0, 0)); }

OverlayDropdownMapControl.prototype._createSelect = function(types) {
	var select = document.createElement("select");
	for(var i = 0; i < types.length; i++) {
		jQuery('<option value="' + i + '">' + types[i].getName() + '</option>').appendTo(select);
	}
	return select;
}

OverlayDropdownMapControl.prototype.initialize = function(map) {
	var that = this;
	map._overlaydropdownmapcontrol = this;
	this.map = map;

	this.types = new Array();  // georef images get added to this list; need to shallow copy
	var alphaTypes = new Array();
	var baseTypes = new Array();
	
	for(var i = 0; i < map.getMapTypes().length; i++) {
		this.types[i] = map.getMapTypes()[i];
		if(this.types[i]._alphaOverlay) {
			alphaTypes.push(this.types[i]);
		} else {
			baseTypes.push(this.types[i]);
		}
	}
	this.typeSelect = this._createSelect(baseTypes);
	if(alphaTypes.length > 0) {
		this.overlaySelect = this._createSelect(baseTypes);
	} else {
		this.overlaySelect = this._createSelect(this.types);
	}
	
	for(var i = 0; i < map.geoRefImages.length; i++) {
		jQuery('<option value="' + this.types.length + '">' + map.geoRefImages[i].name + '</option>').appendTo(this.overlaySelect);
		this.types.push(map.geoRefImages[i]);
	}
	
	var tDivOverlay = null;
	var tDiv = null;
	this.opacityInput = jQuery('<input size="2" value="0"></input>');
	var div = jQuery('<div style="color: red; background: white; font-weight: bold; z-index: 1001"></div>').appendTo(map.getContainer());
	div.append(this.extras, "base: ", this.typeSelect);

	function handleLayerChange() {
		var base = that.types[that.typeSelect.value];
		var overlay = that.types[that.overlaySelect.value];
		opacity = Math.min(100, Math.max(0, that.opacityInput.val())) / 100;
		var tt = new Array();
		if(that.alphaOverlayBoxes != null) for(var i = 0; i < that.alphaOverlayBoxes.length; i++) {
			if(that.alphaOverlayBoxes[i].checked) tt.push(that.alphaOverlayTypes[i]);
		}
		that.updateMap(that.types[that.typeSelect.value], that.types[that.overlaySelect.value], opacity, tt.length > 0 ? tt : null);
	}
	
	this.opacityInput.change(handleLayerChange);
	$(this.typeSelect).change(handleLayerChange);
	$(this.overlaySelect).change(handleLayerChange);
	this.opacityInput.keydown(function(event) {
		if(event.keyCode == 13) if(tDiv != null) tDiv.css("visibility","hidden");
	});
	
	this.alphaOverlayBoxes = new Array();
	this.alphaOverlayTypes = alphaTypes;
	var tPlus = jQuery('<span style="position: relative"></span>').appendTo(div);
	var tps = jQuery('<span style="cursor: pointer">+</span>').appendTo(tPlus);
	this.alphaOverlayPlus = tps[0];

	tDiv = jQuery('<div style="visibility: hidden; background: white; position: absolute; right: 0; ' + ($.browser.msie ? 'top: 0.6em; ' : 'top: 0.5em; padding-top: 1em; z-index: -1; ') + 'width: 18em"></div>').appendTo(tPlus);
	tDivOverlay = jQuery('<div style="color: black; font-weight: normal"></div>').appendTo(tDiv);

	for(var i = 0; i < alphaTypes.length; i++) {
		this.alphaOverlayBoxes[i] = jQuery('<input type="checkbox" value="' + i + '" name="' + alphaTypes[i].getName() + '"/>').appendTo(tDiv)[0];
		tDiv.append(alphaTypes[i].getName());
		$(this.alphaOverlayBoxes[i]).change(handleLayerChange);
		if(i < alphaTypes.length - 1) tDiv.append(document.createElement("br"));
	}
	
	GEvent.addDomListener(tps[0], "click", function() {
		if(tDiv.css("visibility")=="hidden") {
			tDiv.css("visibility","visible");
			div.css("z-index", 1001); // z-index gets overwritten by OpenLayers
		} else {
			tDiv.css("visibility", "hidden");
		}
		});
	tDivOverlay.append(this.overlaySelect, "@", this.opacityInput, "%");
	var upArrow = jQuery('<span style="color: red; font-weight: bold; cursor: pointer; float: right">&uarr;</span>').appendTo(tDivOverlay);
	upArrow.click(function() {tDiv.css("visibility", "hidden");});

	this.hasAlphaOverlays = (alphaTypes.length > 0);
	return div[0];
}

OverlayDropdownMapControl.prototype.updateMap = function(base, overlay, opacity, alphaOverlays) {
		// clear existing overlays
		if(typeof this._overlays != "undefined") {
			for(var i = 0; i < this._overlays.length; i++) {
				this.map.removeOverlay(this._overlays[i]);
			}
		}

		var realBase = base;
		var realOverlay = overlay;
		var realOpacity = opacity;
		if(overlay.getMaximumResolution != null && base.getMaximumResolution() > overlay.getMaximumResolution() && !overlay._alphaOverlay && opacity > 0) {
			// google maps doesn't seem to check the overlays' min and max resolutions
			realOverlay = base;
			realBase = overlay;
			realOpacity = 1-opacity;
		}

		// set base type and create new overlays
		this.map.setMapType(realBase);
		this._overlays = new Array();
		this.baseName = base.getName();
		this.opacity = opacity;

		var infoString = "";
		if(base._info != null && base._info.length > 0) infoString += base._info + ". ";
		if(overlay._info != null && overlay._info.length > 0 && base != overlay && opacity > 0) infoString += overlay._info + ". ";		
		
		if(overlay.angle != null) {
			this._overlays[0] = new GeoRefImageOverlay(new GPoint(1*overlay.originx, 1*overlay.originy), new GLatLng(1*overlay.originlat, 1*overlay.originlng), overlay.angle, overlay.scale, overlay.id, new GSize(1*overlay.width, 1*overlay.height), opacity);
			this.map.addOverlay(this._overlays[0]);
			this.overlayName = overlay.name;
		} else {
			var layers = realOverlay.getTileLayers();
			for(var i = 0; i < layers.length; i++) {
				this._overlays[i] = new GTileLayerOverlay(new org.sarsoft.GAlphaTileLayerWrapper(realOverlay.getTileLayers()[i], realOpacity));
				this.map.addOverlay(this._overlays[i]);
			}
			this.overlayName = overlay.getName();
		}
		if(alphaOverlays != null) {
			this.alphaOverlays="";
			for(var i = 0; i < alphaOverlays.length; i++) {
				var layer = new GTileLayerOverlay(alphaOverlays[i].getTileLayers()[0]);
				this._overlays[this._overlays.length] = layer;
				this.map.addOverlay(layer)
				this.alphaOverlays = this.alphaOverlays + alphaOverlays[i].getName() + ((i < this.alphaOverlays.length - 1) ? "," : "");
				if(alphaOverlays[i]._info != null && alphaOverlays[i]._info.length > 0) infoString += alphaOverlays[i]._info + ". ";
			}
		}
		
		// update visual controls
		this.opacityInput.val(Math.round(opacity*100));
		for(var i = 0; i < this.types.length; i++) {
			if(this.types[i] == base) this.typeSelect.value = i;
			if(this.types[i] == overlay) this.overlaySelect.value = i;
		}
		if(alphaOverlays != null) for(var i = 0; i < this.alphaOverlayTypes.length; i++) {
			this.alphaOverlayBoxes[i].checked=false;
			for(var j = 0; j < alphaOverlays.length; j++) {
				if(this.alphaOverlayTypes[i] == alphaOverlays[j]) this.alphaOverlayBoxes[i].checked=true;
			}
		}
		var extras = 0;
		if(alphaOverlays != null) extras = extras + alphaOverlays.length;
		if(opacity > 0) extras++;
		this.alphaOverlayPlus.innerHTML = "+" + ((extras == 0) ? "" : extras);
		if(infoString.length > 0 && this.map._imap != null)  {
			this.map._imap.setMapInfo("org.sarsoft.OverlayDropdownMapControl", 0, infoString);
		} else {
			this.map._imap.setMapInfo("org.sarsoft.OverlayDropdownMapControl", 0, null);
		}

}

org.sarsoft.GAlphaTileLayerWrapper = function(tileLayer, opacity) {
	this.tileLayer = tileLayer;
	this.opacity = opacity;
	GTileLayer.call(this, new GCopyrightCollection("NA"), tileLayer.minResolution(), tileLayer.maxResolution(), {});
	if(tileLayer.wmstemplate != null) this.wmstemplate = tileLayer.wmstemplate;
}

function TMP() {
}
TMP.prototype = GTileLayer.prototype;
org.sarsoft.GAlphaTileLayerWrapper.prototype = new TMP();

org.sarsoft.GAlphaTileLayerWrapper.prototype.minResolution = function() { return this.tileLayer.minResolution(); }
org.sarsoft.GAlphaTileLayerWrapper.prototype.maxResolution = function() { return this.tileLayer.maxResolution(); }
org.sarsoft.GAlphaTileLayerWrapper.prototype.getTileUrl = function(tile, zoom) { return this.tileLayer.getTileUrl(tile, zoom); }
org.sarsoft.GAlphaTileLayerWrapper.prototype.isPng = function() { return this.tileLayer.isPng(); }
org.sarsoft.GAlphaTileLayerWrapper.prototype.getOpacity = function() { return this.opacity; }
org.sarsoft.GAlphaTileLayerWrapper.prototype.getCopyright = function(bounds, zoom) { return this.tileLayer.getCopyright(bounds, zoom) };

org.sarsoft.MapMessageControl = function() {
}

org.sarsoft.MapMessageControl.prototype = new GControl();
org.sarsoft.MapMessageControl.prototype.printable = function() { return false; }
org.sarsoft.MapMessageControl.prototype.selectable = function() { return false; }
org.sarsoft.MapMessageControl.prototype.getDefaultPosition = function() { return new GControlPosition(G_ANCHOR_TOP_LEFT, new GSize(70, 0)); }

org.sarsoft.MapMessageControl.prototype.initialize = function(map) {
	this.div = document.createElement("div");
	map.getContainer().appendChild(this.div);
	return this.div;
}

org.sarsoft.MapMessageControl.prototype.redraw = function(str, delay) {
	if(delay == null) delay = 10000;
	var that = this;
	if(this.timeout != null) clearTimeout(this.timeout);
	this.div.innerHTML = "<span style='background: white; border: 1px solid black'>" + str + "</span>";
	this.timeout = setTimeout(function() {that.clear();}, delay);
}

org.sarsoft.MapMessageControl.prototype.clear = function() {
	this.div.innerHTML = "";
	this.timeout = null;
}

org.sarsoft.view.MapSizeDlg = function(map) {
	var that = this;
	this.map = map;

	var bd = jQuery('<div class="bd"><div style="padding-bottom: 10px">Adjust the page size for printing.  Remember to specify units (e.g. 11in, 20cm); sizes do not include margins.  Restore map to original size by setting width and height to 100%.</div></div>');
	bd.append(document.createTextNode("Width: "));
	this.widthInput = jQuery('<input type="text" size="8"/>').appendTo(bd).keydown(function(event) { if(event.keyCode == 13) that.dialog.ok();});
	bd.append(document.createTextNode("   Height: "));
	this.heightInput = jQuery('<input type="text" size="8"/>').appendTo(bd).keydown(function(event) { if(event.keyCode == 13) that.dialog.ok();});
	bd.append(document.createElement("br"));
	bd.append(document.createElement("br"));
	bd.append(document.createTextNode("Margin: ")).keydown(function(event) { if(event.keyCode == 13) that.dialog.ok();});
	this.marginInput = jQuery('<input type="text" size="8"/>').appendTo(bd);
	bd.append(document.createTextNode(" (not supported on Firefox)"));

	this.dialog = org.sarsoft.view.CreateDialog("Map Size", bd[0], "Update", "Cancel", function() {
		var center = that.map.getCenter();
		that.map.getContainer().style.width=that.widthInput.val();
		that.map.getContainer().style.height=that.heightInput.val();
		var rule = that._getMarginRule();
		if(rule != null) rule.style.setProperty('margin',that.marginInput.val());
		that.map.checkResize();
		that.map.setCenter(center);
		}, {width: "350px"});
}

org.sarsoft.view.MapSizeDlg.prototype._getMarginRule = function() {
	for(var i = 0; i < document.styleSheets.length; i++) {
		var sheet = document.styleSheets[i];
		var rules = sheet.cssRules;
		if(rules == null) rules = sheet.rules;
		for(var j = 0; j < rules.length; j++) {
			if(rules[j].cssText != null && rules[j].cssText.indexOf("@page") >= 0 && rules[j].cssText.indexOf("margin") >= 0) return rules[j];
		}
	}
}

org.sarsoft.view.MapSizeDlg.prototype.show = function() {
	this.widthInput.val(this.map.getContainer().style.width);
	this.heightInput.val(this.map.getContainer().style.height);
	var rule = this._getMarginRule();
	if(rule != null) this.marginInput.val(rule.style.getPropertyValue('margin'));
	this.dialog.show();
}

org.sarsoft.MapDeclinationWidget = function(imap) {
	var that = this;
	this.imap = imap;
	GEvent.addListener(imap.map, "moveend", function() { that.refresh(); });
	GEvent.addListener(imap.map, "zoomend", function(foo, bar) { that.refresh(); });

	if(imap.map.isLoaded()) {
		this.refresh();
	} else {
		GEvent.addListener(imap.map, "tilesloaded", function() {that.refresh();});
	}
}

org.sarsoft.MapDeclinationWidget.prototype.refresh = function() {
	var declination = GeoUtil.Declination.compute(this.imap.map.getCenter());
	var dir = "E";
	if(declination < 0) {
		declination = declination*-1;
		dir = "W";
	}
	declination = Math.round(declination);
	this.imap.setMapInfo("org.sarsoft.MapDeclinationWidget", 1, "MN " + declination + "\u00B0 " + dir);
}

org.sarsoft.MapDatumWidget = function(imap, switchable) {
	var that = this;
	this.imap = imap;
	imap.register("org.sarsoft.MapDatumWidget", this);

	this.datumControl = jQuery('<div style="z-index: 2000; position: absolute; bottom: 0px; left: 0px; background: white"></div>').appendTo(imap.map.getContainer());
	this.datumDisplay = jQuery('<span>' + org.sarsoft.map.datum + '</span>').appendTo(this.datumControl);
	
	if(switchable) {
		this.datumSwitcher = jQuery('<a style="cursor: pointer" class="noprint">+</a>').appendTo(this.datumControl)[0];
		
		var id = "ContextMenu_" + org.sarsoft.view.ContextMenu._idx++;		
		this.datumMenu = new YAHOO.widget.Menu(id, {hidedelay : 800, zIndex : "1000", context : [this.datumSwitcher, "bl", "tr"]});
		var fn = function(d) {
			return function() {
				that.setDatum(d);
			}
		}
		for(var datum in org.sarsoft.map.datums) {
			this.datumMenu.addItem(new YAHOO.widget.MenuItem(datum,  { onclick : { fn : fn(datum) }}));
		}
		this.datumMenu.render(document.body);
		
		GEvent.addDomListener(this.datumSwitcher, "click", function() {
			that.datumMenu.cfg.setProperty("context", [this.datumSwitcher, "bl", "tr"]);
			that.datumMenu.show();
		});
	}
}

org.sarsoft.MapDatumWidget.prototype.setDatum = function(datum) {
	org.sarsoft.map.datum = datum;
	GeoUtil.datum = org.sarsoft.map.datums[org.sarsoft.map.datum];
	if(this.datumMenu != null) this.datumMenu.hide();
	this.datumDisplay.html(datum);
	this.imap.updateDatum();
}

org.sarsoft.MapDatumWidget.prototype.setConfig = function(config) {
	if(config.MapDatumWidget == null) return;
	this.setDatum(config.MapDatumWidget.datum);
}

org.sarsoft.MapDatumWidget.prototype.getConfig = function(config) {
	if(config.MapDatumWidget == null) config.MapDatumWidget = new Object();
	config.MapDatumWidget.datum = org.sarsoft.map.datum;
	return config;
}

org.sarsoft.UTMGridControl = function(imap) {
	var that = this;
	this._showUTM = "tickmark";
	this.style = {major : 0.8, minor : 0.4, crosshatch : 0, latlng : "DDMMHH"}

	this.utmgridlines = new Array();
	this.text = new Array();
	this.utminitialized = false;
	this.imap = imap;
	if(imap != null) {
			this._UTMToggle = new org.sarsoft.ToggleControl("UTM", "Toggle UTM grid", function(value) {
				that.setValue(value);
			}, [{value : true, style : ""},
			 {value : "tickmark", style : "color: white; background-color: red"},
			 {value : false, style : "text-decoration: line-through"}]);
			this._UTMToggle.setValue(this._showUTM);
			imap.addMenuItem(this._UTMToggle.node, 10);
			imap.register("org.sarsoft.UTMGridControl", this);
	}
}

org.sarsoft.UTMGridControl.prototype = new GControl();
org.sarsoft.UTMGridControl.prototype.printable = function() { return false; }
org.sarsoft.UTMGridControl.prototype.selectable = function() { return false; }
org.sarsoft.UTMGridControl.prototype.getDefaultPosition = function() { return new GControlPosition(G_ANCHOR_TOP_LEFT, new GSize(0, 0)); }

org.sarsoft.UTMGridControl.prototype.initialize = function(map) {
	var that = this;
	this.map = map;
	
	var fn = function() {
		if(that.utminitialized == false) {
			that._drawUTMGrid();
			GEvent.addListener(map, "moveend", function() { that._drawUTMGrid(); });
			GEvent.addListener(map, "zoomend", function(foo, bar) { that._drawUTMGrid(); });
			GEvent.addListener(map, "dragstart", function() {
				for(var i = 0; i < that.text.length; i++) {
					that.map.removeOverlay(that.text[i]);
				}
				that.text = new Array();
			});
			that.utminitialized=true;
		}
	}
	
	if(map.isLoaded()) {
		fn();
	} else {
		GEvent.addListener(map, "tilesloaded", fn);
	}
	
	var div = document.createElement("div");
	map.getContainer().appendChild(div);
	return div;
}

org.sarsoft.UTMGridControl.prototype.setValue = function(value) {
	this._showUTM = value;
	this._drawUTMGrid(true);
	this._UTMToggle.setValue(this._showUTM);
	var mdw = this.imap.registered["org.sarsoft.MapDatumWidget"];
	if(mdw != null) {
		if(!value) { mdw.datumDisplay.addClass("noprint"); }
		else { mdw.datumDisplay.removeClass("noprint"); }
	}
}

org.sarsoft.UTMGridControl.prototype.setConfig = function(config) {
	if(config.UTMGridControl == null) return;
	this.setValue(config.UTMGridControl.showUTM);
	if(config.UTMGridControl.major != null) this.style.major = config.UTMGridControl.major;
	if(config.UTMGridControl.minor != null) this.style.minor = config.UTMGridControl.minor;
	if(config.UTMGridControl.crosshatch != null) this.style.crosshatch = config.UTMGridControl.crosshatch;
	if(config.UTMGridControl.latlng != null) this.style.latlng = config.UTMGridControl.latlng;
	this._drawUTMGrid(true);
}

org.sarsoft.UTMGridControl.prototype.getConfig = function(config) {
	if(config.UTMGridControl == null) config.UTMGridControl = new Object();
	config.UTMGridControl.showUTM = this._showUTM;
	config.UTMGridControl.major = this.style.major;
	config.UTMGridControl.minor = this.style.minor;
	config.UTMGridControl.crosshatch = this.style.crosshatch;
	config.UTMGridControl.latlng = this.style.latlng;
	return config;
}

org.sarsoft.UTMGridControl.prototype.getSetupBlock = function() {
	var that = this;
	if(this._mapForm == null) {
		this._mapForm = new org.sarsoft.view.EntityForm([
		    {name : "major", label: "1km Gridlines", type: ["100%","90%","80%","70%","60%","50%","40%","30%","20%","10%"]},
		    {name : "minor", label: "Minor Gridlines", type: ["100%","90%","80%","70%","60%","50%","40%","30%","20%","10%","None"]},
		    {name : "crosshatch", label: "Crosshatch Size", type : ["Edge Tickmarks Only","20px"]},
		    {name : "latlng", label: "Lat/Long", type : ["Decimal Degree","DDMMHH"]}
		]);
		var node = jQuery('<div style="margin-top: 10px"><span style="font-weight: bold; text-decoration: underline">UTM Grid</span></div>')[0];
		this._mapForm.create(node);
		this._setupBlock = {order : 10, node : node, handler : function() {
			var obj = that._mapForm.read();
			that.style.major = obj.major.substring(0, obj.major.length - 1)/100;
			that.style.minor = (obj.minor == "None") ? 0 : obj.minor.substring(0, obj.minor.length - 1)/100;
			that.style.latlng = (obj.latlng == "DDMMHH") ? "DDMMHH" : "DD";
			if(obj.crosshatch == "20px") {
				that.style.crosshatch = 20;
			} else {
				that.style.crosshatch = 0;
			}
			that._drawUTMGrid(true);
		}};
	}

	this._mapForm.write({
		major : (this.style.major*100) + "%",
		minor : (this.style.minor == 0) ? "None" : (this.style.minor*100) + "%",
		crosshatch : (this.style.crosshatch == 0) ? "Edge Tickmarks Only" : "20px",
		latlng : (this.style.latlng == "DDMMHH") ? "DDMMHH" : "Decimal Degree"
	});
	return this._setupBlock;
}

org.sarsoft.UTMGridControl.prototype._drawUTMGrid = function(force) {
	if(force != true && typeof this.utmgridcoverage != "undefined" && this.utmgridcoverage.getSouthWest().distanceFrom(this.map.getBounds().getSouthWest()) == 0 &&
		this.utmgridcoverage.getNorthEast().distanceFrom(this.map.getBounds().getNorthEast()) == 0) return;

	this.utmgridcoverage = this.map.getBounds();

	for(var i = 0; i < this.utmgridlines.length; i++) {
		this.map.removeOverlay(this.utmgridlines[i]);
	}
	this.utmgridlines = new Array();
	for(var i = 0; i < this.text.length; i++) {
//		this.map.getContainer().removeChild(this.text[i]);
		this.map.removeOverlay(this.text[i]);
	}
	this.text = new Array();
	
	if(this._showUTM == false) return;
	
	var bounds = this.map.getBounds();
	var span = bounds.getSouthWest().distanceFrom(bounds.getNorthEast());
	var px1 = this.map.fromLatLngToContainerPixel(bounds.getSouthWest());
	var px2 = this.map.fromLatLngToContainerPixel(bounds.getNorthEast());
	var pxspan = Math.sqrt(Math.pow(px1.x-px2.x, 2) + Math.pow(px1.y-px2.y, 2));
	scale = span/pxspan;
	var spacing = 100;
	if(this._showUTM != true) spacing = 1000;
	if(scale > 2) spacing = 1000;
	if(scale > 20) spacing = 10000;
	if(scale > 200) spacing = 100000;
	
	var sw = GeoUtil.GLatLngToUTM(GeoUtil.fromWGS84(bounds.getSouthWest()));
	var ne = GeoUtil.GLatLngToUTM(GeoUtil.fromWGS84(bounds.getNorthEast()));
	if(ne.zone - sw.zone > 1) return;
	this._drawUTMGridForZone(sw.zone, spacing, false);
	if(sw.zone != ne.zone)  this._drawUTMGridForZone(ne.zone, spacing, true);
	
	this._drawLatLongGrid();	
}

org.sarsoft.UTMGridControl.prototype._drawLatLongGrid = function() {
	var that = this;
	var bounds = this.map.getBounds();
	var pxmax = this.map.fromLatLngToContainerPixel(bounds.getNorthEast()).x;
	var pymax = this.map.fromLatLngToContainerPixel(bounds.getSouthWest()).y;
	
	function createText(deg) {
		if(that.style.latlng == "DD") {
			deg = Math.abs(deg);
			return "<div style=\"font-size: smaller; color: #000000; background: #FFFFFF\"><b>" + (Math.round(deg*100)/100) + "\u00B0</b></div>";
		}
		var neg = false;
		if(deg < 0) {
			neg = true;
			deg = deg*-1;
		}
		var d=Math.floor(deg);
		var m=Math.floor((deg-d)*60);
		var h=Math.round(((deg-d)*60-m)*100);
		if(h == 100) {
			h = 0;
			m = m + 1;
		}		
		return "<div style=\"font-size: smaller; color:#000000; background: #FFFFFF\"><b>" + d+"\u00B0"+m + (h == 50 ? ".5'" : "'") + "</b></div>";
	}
	
	function computeSpacing(span, multiplier) {
		if(multiplier == 6000) {
			var spacing = 6000;
			if(span < 80) spacing = 2000;
			if(span < 50) spacing = 500;
			if(span < 8) spacing = 100;
			if(span  < 2) spacing = 50;
			return spacing;
		} else {
			var spacing = 1000;
			if(span < 80) spacing = 200;
			if(span < 65) spacing = 100;
			if(span < 8) spacing = 50;
			if(span  < 5) spacing = 20;
			return spacing;
		}
	}

	var multiplier = 6000;
	if(this.style.latlng == "DD") multiplier = 1000;
	var span = (bounds.getNorthEast().lng() - bounds.getSouthWest().lng())*60;	
	var spacing = computeSpacing(span, multiplier);
	var lat = GeoUtil.fromWGS84(bounds.getSouthWest()).lat();
	var lng = Math.round(GeoUtil.fromWGS84(bounds.getSouthWest()).lng()*multiplier/spacing)*spacing;
	var east = GeoUtil.fromWGS84(bounds.getNorthEast()).lng()*multiplier;
	while(lng < east) {
		var offset = this.map.fromLatLngToContainerPixel(GeoUtil.toWGS84(new GLatLng(lat, lng/multiplier))).x;
		var point = new GPoint(offset, pymax-2);
		var label = new ELabel(this.map.fromContainerPixelToLatLng(point), createText(lng/multiplier), "-webkit-transform: rotate(270deg); -moz-transform: rotate(270deg); filter: progid:DXImageTransform.Microsoft.BasicImage(rotation=3);", null, new GSize(-0.5,-0.5));
		this.map.addOverlay(label);
		this.text.push(label);
		lng = lng + spacing;
	}

	var span = (bounds.getNorthEast().lat() - bounds.getSouthWest().lat())*60;
	var spacing = computeSpacing(span, multiplier);
	var lng = GeoUtil.fromWGS84(bounds.getSouthWest()).lng();
	var lat = Math.round(GeoUtil.fromWGS84(bounds.getSouthWest()).lat()*multiplier/spacing)*spacing;
	var north = GeoUtil.fromWGS84(bounds.getNorthEast()).lat()*multiplier;
	while(lat < north) {
		var offset = this.map.fromLatLngToContainerPixel(GeoUtil.toWGS84(new GLatLng(lat/multiplier, lng))).y;
		var point = new GPoint(0, offset);
		var label = new ELabel(this.map.fromContainerPixelToLatLng(point), createText(lat/multiplier), null, null, new GSize(0,-0.5));
		this.map.addOverlay(label);
		this.text.push(label);
		lat = lat + spacing;
	}
}

org.sarsoft.UTMGridControl.prototype._drawGridLine = function(start_utm, end_utm, primary, zone) {
	var vertices = new Array();
	var start_ll = GeoUtil.toWGS84(GeoUtil.UTMToGLatLng(start_utm));
	var end_ll = GeoUtil.toWGS84(GeoUtil.UTMToGLatLng(end_utm));
	
	if(start_ll.lng() > end_ll.lng()) {
		var tmp = start_ll;
		start_ll = end_ll;
		end_ll = tmp;
		tmp = start_utm;
		start_utm = end_utm;
		end_utm = tmp;
	}
	
	if(zone != null && start_ll.lng() < GeoUtil.getWestBorder(zone)) {
		start_ll = GeoUtil.toWGS84(GeoUtil.UTMToGLatLng({e: GeoUtil.GLatLngToUTM(new GLatLng(start_ll.lat(), GeoUtil.getWestBorder(zone)), zone).e, n: start_utm.n, zone: zone}));
	}
	if(zone != null && end_ll.lng() > GeoUtil.getEastBorder(zone)) {
		end_ll = GeoUtil.toWGS84(GeoUtil.UTMToGLatLng({e: GeoUtil.GLatLngToUTM(new GLatLng(end_ll.lat(), GeoUtil.getEastBorder(zone)), zone).e, n: end_utm.n, zone: zone}));
	}
	vertices.push(start_ll);
	vertices.push(end_ll);
	
	var overlay = new GPolyline(vertices, "#0000FF", 1, primary ? this.style.major : this.style.minor);
	this.utmgridlines.push(overlay);
	this.map.addOverlay(overlay);
}

org.sarsoft.UTMGridControl.prototype._drawUTMGridForZone = function(zone, spacing, right) {
	var bounds = this.map.getBounds();
	var screenSW = GeoUtil.GLatLngToUTM(GeoUtil.fromWGS84(bounds.getSouthWest()), zone);
	var screenNE = GeoUtil.GLatLngToUTM(GeoUtil.fromWGS84(bounds.getNorthEast()), zone);
	var sw = new UTM(screenSW.e-spacing, screenSW.n-spacing, screenSW.zone);
	var ne = new UTM(screenNE.e+spacing, screenNE.n+spacing, screenNE.zone);

	var east = GeoUtil.getEastBorder(zone);
	var west = GeoUtil.getWestBorder(zone);

	function createText(meters) {
		return "<div style=\"font-size: smaller; color:#0000FF; background: #FFFFFF\"><b>" + Math.round(meters/1000) + "</b><span style=\"font-size: smaller\">000</span></div>";
	}

	var easting = Math.round(sw.e / spacing)  * spacing;
	var pxmax = this.map.fromLatLngToContainerPixel(bounds.getNorthEast()).x;
	var pymax = this.map.fromLatLngToContainerPixel(bounds.getSouthWest()).y;
	
	var scale = (screenNE.n - screenSW.n)/pymax;
	var crossHatchSize = Math.min(spacing/10, scale*this.style.crosshatch);
	
	while(easting < ne.e) {
		var start = GeoUtil.toWGS84(GeoUtil.UTMToGLatLng({e: easting, n: sw.n, zone: zone}));

		if(west < start.lng() && start.lng() < east) {
			if(this._showUTM == true) {
				this._drawGridLine(new UTM(easting, sw.n, zone), new UTM(easting, ne.n, zone), (easting % 1000 == 0));
			} else if(this.style.crosshatch > 0) {
				var northing = Math.round(sw.n / spacing) * spacing;
				while(northing < ne.n) {
					this._drawGridLine(new UTM(easting, northing-crossHatchSize, zone), new UTM(easting, northing+crossHatchSize, zone), true);
					this._drawGridLine(new UTM(easting-crossHatchSize, northing, zone), new UTM(easting+crossHatchSize, northing, zone), true);
					northing = northing + spacing;
				}
			}

			var offset = this.map.fromLatLngToContainerPixel(GeoUtil.toWGS84(GeoUtil.UTMToGLatLng({e: easting, n: screenSW.n, zone: zone}))).x;
			if(0 < offset && offset < pxmax && easting % 1000 == 0) {
				var point = new GPoint(offset, pymax-2);
				var label = new ELabel(this.map.fromContainerPixelToLatLng(point), createText(easting), "-webkit-transform: rotate(270deg); -moz-transform: rotate(270deg); filter: progid:DXImageTransform.Microsoft.BasicImage(rotation=3);", null, new GSize(-0.5,-0.5));
				this.map.addOverlay(label);
				this.text.push(label);
			}
		}
		easting = easting + spacing;
	}
	
	var northing = Math.round(sw.n / spacing) * spacing;
	while(northing < ne.n) {
		if(this._showUTM == true) {
			this._drawGridLine(new UTM(sw.e, northing, zone), new UTM(ne.e, northing, zone), (northing % 1000 == 0), zone);
		}

		var offset = this.map.fromLatLngToContainerPixel(GeoUtil.toWGS84(GeoUtil.UTMToGLatLng({e: screenSW.e, n: northing, zone: zone}))).y;
		if(0 < offset && offset < pymax && northing % 1000 == 0 && !right) {
			var point = new GPoint(0, offset);
			var label = new ELabel(this.map.fromContainerPixelToLatLng(point), createText(northing), null, null, new GSize(0,-0.5));
			this.map.addOverlay(label);
			this.text.push(label);
		}
		northing = northing + spacing;
	}
}

org.sarsoft.PositionInfoControl = function(imap) {
	if(imap != null) {
		this.imap = imap;
		imap.register("org.sarsoft.PositionInfoControl", this);
	}
}

org.sarsoft.PositionInfoControl.prototype = new GControl();
org.sarsoft.PositionInfoControl.prototype.printable = function() { return false; }
org.sarsoft.PositionInfoControl.prototype.selectable = function() { return false; }
org.sarsoft.PositionInfoControl.prototype.getDefaultPosition = function() { return new GControlPosition(G_ANCHOR_TOP_RIGHT, new GSize(0, 25)); }

org.sarsoft.PositionInfoControl.prototype.initialize = function(map) {
	var that = this;
	this.map = map;
	this._show = true;
	
	var div = jQuery('<div style="text-align: right; cursor: pointer" class="noprint"></div>');
	this.minmax = jQuery('<img src="/static/images/left.png" title="Show Coordinates" style="display: none"/>').appendTo(div);
	this.display = jQuery('<div style="background-color: white; font-weight: bold" title="Hide Coordinates"></div>').appendTo(div);

	div.click(function(event) {
		that._show = !that._show;
		if(that._show) {
			that.minmax.css("display", "none");
			that.display.css("display", "block");
		} else {
			that.minmax.css("display", "inline");
			that.display.css("display", "none");
		}
	});

	GEvent.addListener(map, "mousemove", function(latlng) {
		var datumll = GeoUtil.fromWGS84(latlng);
		var utm = GeoUtil.GLatLngToUTM(datumll);
		var message = utm.toHTMLString() + "<br/>";
		if(that.imap != null && that.imap.registered["org.sarsoft.UTMGridControl"] != null && that.imap.registered["org.sarsoft.UTMGridControl"].style.latlng == "DD") {
			var dlat = Math.abs(datumll.lat());
			var dlng = Math.abs(datumll.lng());
			var lat = Math.floor(dlat);
			lat = "" + lat + ("." + Math.round((dlat-lat)*10000) + "00000").substring(0, 5);
			var lng = Math.floor(dlng);
			lng = "" + lng + ("." + Math.round((dlng-lng)*10000) + "00000").substring(0, 5);
			if(datumll.lat() < 0) lat = "-" + lat;
			if(datumll.lng() < 0) lng = "-" + lng;
			message = message + lat + ", " + lng;
		} else {
			message = message + GeoUtil.formatDDMMHH(datumll.lat()) + ", " + GeoUtil.formatDDMMHH(datumll.lng());
		}
		that.display.html(message);
	});

	map.getContainer().appendChild(div[0]);
	return div[0];
}

org.sarsoft.PositionInfoControl.prototype.setConfig = function(config) {
	if(config.PositionInfoControl == null) return;
	this._show = config.PositionInfoControl.showPosition;
	if(this._show) {
		this.minmax.css("display", "none");
		this.display.css("display", "block");
	} else {
		this.minmax.css("display", "inline");
		this.display.css("display", "none");
	}
}

org.sarsoft.PositionInfoControl.prototype.getConfig = function(config) {
	if(config.PositionInfoControl == null) config.PositionInfoControl = new Object();
	config.PositionInfoControl.showPosition = this._show;
	return config;
}

org.sarsoft.MapLabelWidget = function(imap) {
	var that = this;
	this.imap = imap;
	this.label = "normal";
	this.toggle = new org.sarsoft.ToggleControl("LBL", "Toggle label display", function(value) {
			that.label = value;
			that.handleConfigChange();
		},
		[{value : "normal", style : ""},
		 {value : "backlit", style : "color: white; background-color: red"},
		 {value : "hidden", style : "text-decoration: line-through"}]);
	imap.addMenuItem(this.toggle.node, 15);
	imap.register("org.sarsoft.MapLabelWidget", this);
}

org.sarsoft.MapLabelWidget.prototype.handleConfigChange = function() {
	var container = this.imap.map.getContainer();
	YAHOO.util.Dom.removeClass(container, "maplabelnormal");
	YAHOO.util.Dom.removeClass(container, "maplabelbacklit");
	YAHOO.util.Dom.removeClass(container, "maplabelhidden");
	YAHOO.util.Dom.addClass(container, "maplabel" + this.label);
}

org.sarsoft.MapLabelWidget.prototype.setConfig = function(config) {
	if(config.MapLabelWidget == null) return;
	this.label = config.MapLabelWidget.label;
	this.toggle.setValue(this.label);
	this.handleConfigChange();
}

org.sarsoft.MapLabelWidget.prototype.getConfig = function(config) {
	if(config.MapLabelWidget == null) config.MapLabelWidget = new Object();
	config.MapLabelWidget.label = this.label;
	return config;
}


org.sarsoft.MapSizeWidget = function(imap) {
	var that = this;
	this.pageSizeDlg = new org.sarsoft.view.MapSizeDlg(imap.map);
	var pagesetup = document.createElement("img");
	pagesetup.src="/static/images/print.png";
	pagesetup.style.cursor="pointer";
	pagesetup.style.verticalAlign="middle";
	pagesetup.title = "Adjust page size for printing";
	GEvent.addDomListener(pagesetup, "click", function() {
		that.pageSizeDlg.show();
	});
	imap.addMenuItem(pagesetup, 30);
}

org.sarsoft.MapPermissionWidget = function(imap) {
	if(org.sarsoft.userPermissionLevel == "READ" || org.sarsoft.userPermissionLevel == "NONE") {
		var passwordDlg = new org.sarsoft.PasswordDialog();	
		imap.addContextMenuItems([{text : "Enter password for write access", applicable : function(obj) { return obj == null }, handler: function(data) { passwordDlg.show();}}]);
	}
}


org.sarsoft.MapFindWidget = function(imap) {
	var that = this;
	var that = this;
	this.imap = imap;

	this.body = document.createElement("div");
	this.dialog = org.sarsoft.view.CreateDialog("Find", this.body, "Find", "Cancel", function() {
		var entry = that.locationEntryForm.read(function(gll) { that.imap.map.setCenter(gll, 14);});
		if(!entry) that.checkBlocks();
		}, {width: "450px"});

	this.locationEntryForm = new org.sarsoft.LocationEntryForm();
	this.locationEntryForm.create(this.body, function() {
		that.dialog.hide();
		that.locationEntryForm.read(function (gll) {that.imap.map.setCenter(gll, 14);});
	});
	
	var find = jQuery('<img src="/static/images/find.png" style="cursor: pointer; vertical-align: middle" title="Find a coordinate"/>')[0];
	GEvent.addDomListener(find, "click", function() {
		that.locationEntryForm.clear();
		that.initializeDlg();
		that.dialog.show();
	});
	imap.addMenuItem(find, 26);
}

org.sarsoft.MapFindWidget.prototype.initializeDlg = function() {
	var blocks = new Array();
	if(this._container != null) $(this._container).remove();
	this._container = document.createElement("div");
	this.body.appendChild(this._container);

	for(var key in this.imap.registered) {
		if(this.imap.registered[key].getFindBlock != null) {
			var block = this.imap.registered[key].getFindBlock();
			while(blocks[block.order] != null) block.order++;
			blocks[block.order] = block;
		}
	}
	
	for(var i = 0; i < blocks.length; i++) {
		if(blocks[i] != null) {
			this._container.appendChild(blocks[i].node);
		}
	}
	this.blocks = blocks;
}

org.sarsoft.MapFindWidget.prototype.checkBlocks = function() {
	for(var i = 0; i < this.blocks.length; i++) {
		if(this.blocks[i] != null) {
			if(this.blocks[i].handler()) return;
		}
	}
}

org.sarsoft.view.MapSetupWidget = function(imap) {
	var that = this;
	this.imap = imap;

	this._body = document.createElement("div");
	var style = {position : "absolute", "z-index" : "2500", top : "100px", left : "100px", width : "500px"};
	this._dialog = org.sarsoft.view.CreateDialog("Map Setup", this._body, "Update", "Cancel", function() { that.handleSetupChange() }, style);
	
	var setup = jQuery('<img src="/static/images/config.png" style="cursor: pointer; vertical-align: middle" title="Map Setup"/>')[0];
	GEvent.addDomListener(setup, "click", function() {
		that.showDlg();
	});
	imap.addMenuItem(setup, 25);

}

org.sarsoft.view.MapSetupWidget.prototype.showDlg = function() {
	var blocks = new Array();
	if(this._container != null) this._body.removeChild(this._container);
	this._container = document.createElement("div");
	this._body.appendChild(this._container);

	for(var key in this.imap.registered) {
		if(this.imap.registered[key].getSetupBlock != null) {
			var block = this.imap.registered[key].getSetupBlock();
			while(blocks[block.order] != null) block.order++;
			blocks[block.order] = block;
		}
	}
	
	for(var i = 0; i < blocks.length; i++) {
		if(blocks[i] != null) {
			this._container.appendChild(blocks[i].node);
		}
	}
	this._dialog.show();
	this.blocks = blocks;
}

org.sarsoft.view.MapSetupWidget.prototype.handleSetupChange = function() {
	for(var i = 0; i < this.blocks.length; i++) {
		if(this.blocks[i] != null) {
			this.blocks[i].handler();
		}
	}
	this.blocks = null;
}

org.sarsoft.view.BaseConfigWidget = function(imap, persist) {
	var that = this;
	if(imap != null) {
		this.imap = imap;
		if(persist) {
			var saveDlg = org.sarsoft.view.CreateDialog("Save Map Settings", "Save map settings?  Data is saved as you work on it; this only affects UTM gridlines, visible layers and such.", "Save", "Cancel", function() {
				that.saveConfig();
			});
			var save = jQuery('<img src="/static/images/save.png" style="cursor: pointer; vertical-align: middle" title="Save Map Settings."/>')[0];
			GEvent.addDomListener(save, "click", function() {
				saveDlg.show();
			});
			imap.addMenuItem(save, 34);
		}
	}
}

org.sarsoft.view.BaseConfigWidget.prototype._toConfigObj = function(config) {
	if(config == null) config = {};
	this.imap.getConfig(config);
	for(var key in this.imap.registered) {
		var val = this.imap.registered[key];
		if(val != null && val.getConfig != null) {
			val.getConfig(config);
		}
	}
	return config;
}

org.sarsoft.view.BaseConfigWidget.prototype._fromConfigObj = function(config) {
	this.imap.setConfig(config);
	for(var key in this.imap.registered) {
		var val = this.imap.registered[key];
		if(val != null && val.setConfig != null) {
			val.setConfig(config);
		}
	}
}

org.sarsoft.view.PersistedConfigWidget = function(imap, persist) {
	org.sarsoft.view.BaseConfigWidget.call(this, imap, persist);
	this.tenantDAO = new org.sarsoft.TenantDAO(function() { that.imap.message("Server Communication Error!"); });
}
org.sarsoft.view.PersistedConfigWidget.prototype = new org.sarsoft.view.BaseConfigWidget();

org.sarsoft.view.PersistedConfigWidget.prototype.saveConfig = function() {
	var that = this;
	this.tenantDAO.load(function(cfg) {
		var config = {};
		if(cfg.value != null) {
			config = YAHOO.lang.JSON.parse(cfg.value);
		}
		that._toConfigObj(config);
		that.tenantDAO.save("mapConfig", { value: YAHOO.lang.JSON.stringify(config)});				
	}, "mapConfig");
}

org.sarsoft.view.PersistedConfigWidget.prototype.loadConfig = function(overrides) {
	var that = this;
	this.tenantDAO.load(function(cfg) {
		var config = {};
		if(cfg.value != null) {
			config = YAHOO.lang.JSON.parse(cfg.value);			
		}
		if(typeof(overrides) != "undefined") for(var key in overrides) {
			config[key] = overrides[key];
		}
		that._fromConfigObj(config);
	}, "mapConfig");
}


org.sarsoft.view.CookieConfigWidget = function(imap) {
	org.sarsoft.view.BaseConfigWidget.call(this, imap, true);
}
org.sarsoft.view.CookieConfigWidget.prototype = new org.sarsoft.view.BaseConfigWidget();

org.sarsoft.view.CookieConfigWidget.prototype.saveConfig = function() {
	var config = {};
	if(YAHOO.util.Cookie.exists("org.sarsoft.mapConfig")) config = YAHOO.lang.JSON.parse(YAHOO.util.Cookie.get("org.sarsoft.mapConfig"));
	if(config.base == null) config = {}; // keep mis-set cookies from screwing everything up
	this._toConfigObj(config);
	YAHOO.util.Cookie.set("org.sarsoft.mapConfig", YAHOO.lang.JSON.stringify(config));
}

org.sarsoft.view.CookieConfigWidget.prototype.loadConfig = function() {
	if(YAHOO.util.Cookie.exists("org.sarsoft.mapConfig")) {
		var config = YAHOO.lang.JSON.parse(YAHOO.util.Cookie.get("org.sarsoft.mapConfig"));
		this._fromConfigObj(config);
	}
}


org.sarsoft.InteractiveMap = function(map, options) {
	var that = this;
	this.map = map;
	this.options = options;
	this.polys = new Object();
	this.overlays = new Array();
	this.rangerings = new Array();
	this.text = new Array();
	this.markers = new Array();
	this._handlers = new Object();
	this._contextMenu = new org.sarsoft.view.ContextMenu();
	this._menuItems = [];
	this.registered = new Object();
	this._mapInfoMessages = new Object();
	
	if(typeof map == undefined) return;
	GEvent.addListener(map, "singlerightclick", function(point, src, overlay) {
		var obj = null;
		if(overlay != null) {
			if(that.polys[overlay.id] != null) obj = that.polys[overlay.id].way;
			if(that.markers[overlay.id] != null) obj = that.markers[overlay.id].waypoint;
		}
		if(that._menuItems.length > 0) {
			that._contextMenu.setItems(that._menuItems)
			that._contextMenu.show(point, obj);
		}
		if(typeof that._handlers["singlerightclick"] != "undefined") {
			for(var i = 0; i < that._handlers["singlerightclick"].length; i++) {
				that._handlers["singlerightclick"][i](point, obj);
				}
		}
	});

	this.map.enableScrollWheelZoom();
	this.map._imap = this;
	this.mapMessageControl = new org.sarsoft.MapMessageControl();
	this.map.addControl(this.mapMessageControl);
	
	if(options == null) options = {};
	if(options.positionWindow || options.standardControls) {
		this.positionInfoControl = new org.sarsoft.PositionInfoControl(this);
		this.map.addControl(this.positionInfoControl);
	}
	if(!options.suppressPermissionWidget) {
		new org.sarsoft.MapPermissionWidget(this);
	}
	var dc = new org.sarsoft.MapDatumWidget(this, options.switchableDatum);
	var mn = new org.sarsoft.MapDeclinationWidget(this);
	if(options.standardControls) {
		this.map.addControl(new org.sarsoft.UTMGridControl(this));
		var sc = new org.sarsoft.MapSizeWidget(this);
		var fc = new org.sarsoft.MapFindWidget(this);
		var lc = new org.sarsoft.MapLabelWidget(this);
		this.addMenuItem(document.createTextNode(" | "), 20);
		this.addMenuItem(document.createTextNode(" | "), 100);
	} else {
		this.map.addControl(new org.sarsoft.UTMGridControl());
	}

}

org.sarsoft.InteractiveMap.prototype.updateDatum = function() {
	for(var key in this.markers) {
		var m = this.markers[key];
		this.addWaypoint(m.waypoint, m.config, m.tooltip, m.label);
	}
	if(this.registered["org.sarsoft.UTMGridControl"] != null) this.registered["org.sarsoft.UTMGridControl"]._drawUTMGrid(true);
}


org.sarsoft.InteractiveMap.prototype.getConfig = function(config) {
	if(config == null) config = new Object();
	config.base = this.map._overlaydropdownmapcontrol.baseName;
	if(this.map._overlaydropdownmapcontrol != null) {
		config.overlay = this.map._overlaydropdownmapcontrol.overlayName;
		config.opacity = this.map._overlaydropdownmapcontrol.opacity;
		if(this.map._overlaydropdownmapcontrol.alphaOverlays != null) config.alphaOverlays = this.map._overlaydropdownmapcontrol.alphaOverlays;
	}
	return config;
}

org.sarsoft.InteractiveMap.prototype.setConfig = function(config) {
	if(config == null) return;
	this.setMapLayers(config.base, config.overlay, config.opacity, config.alphaOverlays);
}

org.sarsoft.InteractiveMap.prototype.setMapLayers = function(baseName, overlayName, opacity, alphaOverlays) {
	var types = this.map._overlaydropdownmapcontrol.types;
	var base = null;
	var overlay = null;
	opacity = opacity ? opacity : 0;
	for(var i = 0; i < types.length; i++) {
		if(types[i].getName != null && types[i].getName() == baseName) base = types[i];
		if(types[i].getName != null && types[i].getName() == overlayName) overlay = types[i];
		if(types[i].name == overlayName) overlay = types[i];
	}
	var alphaTypes = new Array();
	if(alphaOverlays != null) {
		var names = alphaOverlays.split(",");
		for (var i = 0; i < types.length; i++) {
			for(var j = 0; j < names.length; j++) {
				if(types[i].getName != null && names[j] == types[i].getName()) alphaTypes.push(types[i]);
			}
		}
	}
	if(base != null && overlay != null) this.map._overlaydropdownmapcontrol.updateMap(base, overlay, opacity, (alphaTypes.length > 0) ? alphaTypes : null);
}


org.sarsoft.InteractiveMap.prototype._createPolygon = function(vertices, config) {
	var that = this;
	var color = config.color;
	if(config.opacity == null) config.opacity = 100;
	if(config.fill == null) config.fill = 35
	if(config.weight == null) config.weight = 2;
	var poly = new GPolygon(vertices, color, Math.max(config.weight, 1), Math.max(Math.min(config.opacity/100, 1), 0), color, config.fill/100);
	this.map.addOverlay(poly);
	return poly;
}

org.sarsoft.InteractiveMap.prototype._createPolyline = function(vertices, config) {
	if(config.opacity == null) config.opacity = 100;
	if(config.weight == null) config.weight = 3;
	var poly = new GPolyline(vertices, config.color, config.weight, Math.max(Math.min(config.opacity/100, 1), 0));
	this.map.addOverlay(poly);
	return poly;
}

org.sarsoft.InteractiveMap.prototype._removeOverlay = function(way) {
	var overlay = this.polys[way.id].overlay;
	this.map.removeOverlay(overlay);
	if(overlay.label != null) this.map.removeOverlay(overlay.label);
}

org.sarsoft.InteractiveMap.prototype._addOverlay = function(way, config, label) {
	var that = this;
	var id = way.id;
	var vertices = new Array();
	var labelOverlay = null;
	if(config == null) config = new Object();
	if(typeof way.waypoints != "undefined" && way.waypoints != null) {
		// all this sw/labelwpt/distance junk is simply to place the label on the bottom-right waypoint
		var sw = new GLatLng(way.boundingBox[0].lat, way.boundingBox[0].lng);
		var labelwpt = way.waypoints[0];
		var distance = 0;
		for(var i = 0; i < way.waypoints.length; i++) {
			var wpt = way.waypoints[i];
			var gll = new GLatLng(wpt.lat, wpt.lng);
			vertices.push(gll);
			if(sw.distanceFrom(gll) > distance) {
				distance = sw.distanceFrom(gll);
				labelwpt = wpt;
			}
		}
		if(label != null) {
			labelOverlay = new ELabel(new GLatLng(labelwpt.lat, labelwpt.lng), "<span class='maplabel'>" + label + "</span>", "width: 8em");
			this.map.addOverlay(labelOverlay);
		}
	}
	var poly;
	if(config.color == null) config.color = org.sarsoft.Constants.colorsById[id%org.sarsoft.Constants.colorsById.length];
	if(way.polygon) {
		poly = this._createPolygon(vertices, config);
	} else {
		poly = this._createPolyline(vertices, config);
	}
	poly.id = id;
	poly.label = labelOverlay;
	GEvent.addListener(poly, "mouseover", function() {
		if(way.displayMessage == null) {
			that._infomessage(way.name);
		} else {
			that._infomessage(way.displayMessage);
		}
	});
	return poly;
}

org.sarsoft.InteractiveMap.prototype.removeWay = function(way) {
	var id = way.id;
	if(typeof this.polys[id] != "undefined") {
		this._removeOverlay(way);
		delete this.polys[id];
	}
}


org.sarsoft.InteractiveMap.prototype.addWay = function(way, config, label) {
	this.removeWay(way);
	this.polys[way.id] = { way: way, overlay: this._addOverlay(way, config, label), config: config};
}

org.sarsoft.InteractiveMap.prototype.addRangeRing = function(center, radius, vertices) {
	var glls = new Array();
	var centerUTM = GeoUtil.GLatLngToUTM(new GLatLng(center.lat, center.lng));
	for(var i = 0; i <= vertices; i++) {
		var vertexUTM = new UTM(centerUTM.e + radius*Math.sin(i*2*Math.PI/vertices), centerUTM.n + radius*Math.cos(i*2*Math.PI/vertices), centerUTM.zone);
		glls.push(GeoUtil.UTMToGLatLng(vertexUTM));
	}
	var poly = new GPolyline(glls, "#000000", 1, 1);
	this.map.addOverlay(poly);
	this.rangerings.push(poly);

	var labelUTM = new UTM(centerUTM.e, 1*centerUTM.n + 1*radius, centerUTM.zone);
	var label = new ELabel(GeoUtil.UTMToGLatLng(labelUTM), "<span class='maplabel'>" + radius + "m</span>", "", new GSize(-6, -4));
	this.rangerings.push(label);
	this.map.addOverlay(label);
}

org.sarsoft.InteractiveMap.prototype.removeRangeRings = function() {
	for(var i = 0; i < this.rangerings.length; i++) {
		this.map.removeOverlay(this.rangerings[i]);
	}
	this.rangerings = new Array();
}

org.sarsoft.InteractiveMap.prototype._removeMarker = function(waypoint) {
	var marker = this.markers[waypoint.id].marker;
	this.map.removeOverlay(marker);
	if(marker.label != null) this.map.removeOverlay(marker.label);
}

org.sarsoft.InteractiveMap.prototype._addMarker = function(waypoint, config, tooltip, label) {
	var that = this;
	var id = waypoint.id;
	var gll = new GLatLng(waypoint.lat, waypoint.lng);
	var icon = (config.icon) ? config.icon : org.sarsoft.MapUtil.createFlatCircleIcon(12, config.color);
	var tt = tooltip;
	if(typeof tt == "undefined") tt = waypoint.name;
	tt = tt +  "  (" + GeoUtil.GLatLngToUTM(GeoUtil.fromWGS84(new GLatLng(waypoint.lat, waypoint.lng))).toString() + ")";
	var marker = new GMarker(gll, { title : tt, icon : icon});
	this.map.addOverlay(marker);
	GEvent.addListener(marker, "mouseover", function() {
		if(waypoint.displayMessage == null) {
			that._infomessage(label);
		} else {
			that._infomessage(waypoint.displayMessage);
		}
	});
	marker.id = waypoint.id;
	if(label != null) {
		labelOverlay = new ELabel(gll, "<span class='maplabel'>" + label + "</span>", "width: 8em", new GSize(4, -4));
		this.map.addOverlay(labelOverlay);
		marker.label = labelOverlay;
	}
	this.markers[waypoint.id] = { waypoint: waypoint, marker: marker, config: config, tooltip : tooltip, label : label};
	return marker;
}

org.sarsoft.InteractiveMap.prototype.removeWaypoint = function(waypoint) {
	var id = waypoint.id;
	if(typeof this.markers[id] != "undefined") {
		this._removeMarker(waypoint);
		delete this.markers[id];
	}
}

org.sarsoft.InteractiveMap.prototype.addWaypoint = function(waypoint, config, tooltip, label) {
	this.removeWaypoint(waypoint);
	this._addMarker(waypoint, config, tooltip, label);
}

org.sarsoft.InteractiveMap.prototype._infomessage = function(message, timeout) {
	this.mapMessageControl.redraw(message, timeout);
}

org.sarsoft.InteractiveMap.prototype.getNewWaypoints = function(point, polygon) {
	var that = this;
	var vertices;
	if(polygon) {
		vertices = [
			that.map.fromContainerPixelToLatLng(new GPoint(point.x - 25, point.y - 25)),
			that.map.fromContainerPixelToLatLng(new GPoint(point.x + 25, point.y - 25)),
			that.map.fromContainerPixelToLatLng(new GPoint(point.x + 25, point.y + 25)),
			that.map.fromContainerPixelToLatLng(new GPoint(point.x - 25, point.y + 25)),
			that.map.fromContainerPixelToLatLng(new GPoint(point.x - 25, point.y - 25))
			];
	} else {
		vertices = [
			that.map.fromContainerPixelToLatLng(new GPoint(point.x - 40, point.y)),
			that.map.fromContainerPixelToLatLng(new GPoint(point.x + 40, point.y))
		];
	}
	return this._GLatLngListToWpt(vertices);
}

org.sarsoft.InteractiveMap.prototype._buildGLatLngListFromOverlay = function(overlay) {
	var vertices = new Array();
	var count = overlay.getVertexCount();
	for(var i = 0; i < count; i++) {
		vertices.push(overlay.getVertex(i));
	}
	return vertices;
}

org.sarsoft.InteractiveMap.prototype._GLatLngListToWpt = function(glls) {
	var waypoints = new Array();
	for(var i = 0; i < glls.length; i++) {
		var gll = glls[i];
		waypoints.push({lat: gll.lat(), lng: gll.lng()});
	}
	return waypoints;
}

org.sarsoft.InteractiveMap.prototype.edit = function(id) {
	this.polys[id].overlay.enableEditing();
}

org.sarsoft.InteractiveMap.prototype.redraw = function(id) {
	var that = this;
	var label = this.polys[id].overlay.label;
	this._removeOverlay(this.polys[id].overlay);
	this.polys[id].overlay = this._addOverlay({id : id, polygon: this.polys[id].way.polygon}, this.polys[id].config);
	this.polys[id].overlay.label = label;
	this.polys[id].overlay.enableDrawing();
	GEvent.addListener(this.polys[id].overlay, "endline", function() {
		window.setTimeout(function() { that.edit(id);}, 200);
	});
	GEvent.addListener(this.polys[id], "cancelline", function() {
		that.discard(id);
	});
}

org.sarsoft.InteractiveMap.prototype.save = function(id) {
	var poly = this.polys[id];
	poly.overlay.disableEditing();
	return this._GLatLngListToWpt(this._buildGLatLngListFromOverlay(poly.overlay));
}

org.sarsoft.InteractiveMap.prototype.discard = function(id) {
	var label = this.polys[id].overlay.label;
	this._removeOverlay(this.polys[id].overlay);
	this.polys[id].overlay = this._addOverlay(this.polys[id].way, this.polys[id].config);
	this.polys[id].overlay.label = label;
	if(label != null) this.map.addOverlay(label);
}

org.sarsoft.InteractiveMap.prototype.addListener = function(event, handler) {
	if(typeof this._handlers[event] == "undefined") this._handlers[event] = new Array();
	this._handlers[event].push(handler);
}

org.sarsoft.InteractiveMap.prototype.addContextMenuItems = function(items) {
	this._menuItems = this._menuItems.concat(items);
}

org.sarsoft.InteractiveMap.prototype.setBounds = function(bounds) {
	this.map.setCenter(bounds.getCenter(), this.map.getBoundsZoomLevel(bounds));
	this._boundsInitialized = true;
}

org.sarsoft.InteractiveMap.prototype.growMap = function(gll) {
	var bounds = this.map.getBounds();
	bounds.extend(gll);
	this.map.setCenter(bounds.getCenter(), this.map.getBoundsZoomLevel(bounds));
}

org.sarsoft.InteractiveMap.prototype.setCenter = function(center, zoom) {
	this.map.setCenter(center, zoom);
	this._boundsInitialized = true;
}

org.sarsoft.InteractiveMap.prototype.growInitialMap = function(gll) {
	if(this._boundsInitialized) return;
	if(typeof this._boundsInitialized == "undefined") {
		this._boundsInitialized = false;
		this._bounds = new GLatLngBounds(gll, gll);
		this.map.setCenter(gll, 15);
	} else {
		this._bounds.extend(gll);
		this.map.setCenter(this._bounds.getCenter(), this.map.getBoundsZoomLevel(this._bounds));
	}
}

org.sarsoft.InteractiveMap.prototype.message = function(msg, delay) {
	this._infomessage(msg, delay);
}

org.sarsoft.InteractiveMap.prototype.register = function(type, controller) {
	this.registered[type] = controller;
}

org.sarsoft.InteractiveMap.prototype.addMenuItem = function(item, order) {
	if(order == null) order = 10000;
	try { item.menuOrder = order; } catch (e) {
		var span = document.createElement("span");
		span.appendChild(item);
		span.menuOrder=order;
		item=span;
	}
	var extras = this.map._overlaydropdownmapcontrol.extras;
	for(var i = 0; i < extras.childNodes.length; i++) {
		if(extras.childNodes[i] != null && extras.childNodes[i].menuOrder != null && extras.childNodes[i].menuOrder > order) {
			var n = extras.childNodes[i];
			extras.insertBefore(item, n);
			extras.insertBefore(document.createTextNode(" "), n);
			return;
		}
	}
	extras.appendChild(item);
	extras.appendChild(document.createTextNode(" "));
}

org.sarsoft.InteractiveMap.prototype.timer = function() {
	for(var key in this.registered) {
		var val = this.registered[key];
		if(val.timer != null) val.timer();
	}
}

org.sarsoft.InteractiveMap.prototype.setMapInfo = function(classname, order, message) {
	if(this._mapInfoControl == null) {
		this._mapInfoControl = new org.sarsoft.MapInfoControl();
		this.map.addControl(this._mapInfoControl);
	}
	
	if(message == null) {
		delete this._mapInfoMessages[classname];
	} else {
		this._mapInfoMessages[classname] = { order: order, message : message};
	}

	var messages = new Array();
	for(var key in this._mapInfoMessages) {
		var val = this._mapInfoMessages[key];
		var order = val.order;
		var message = val.message;
		while(messages[order] != null) order++;
		messages[order] = message;
	}
	
	var info = "";
	for(var i = 0; i < messages.length; i++) {
		if(messages[i] != null) info = info + "  " + messages[i];
	}
	
	this._mapInfoControl.setMessage(info);
}


org.sarsoft.MapInfoControl = function() {
}

org.sarsoft.MapInfoControl.prototype = new GControl();
org.sarsoft.MapInfoControl.prototype.printable = function() { return true; }
org.sarsoft.MapInfoControl.prototype.selectable = function() { return false; }
org.sarsoft.MapInfoControl.prototype.getDefaultPosition = function() { return new GControlPosition(G_ANCHOR_BOTTOM_RIGHT, new GSize(0, 0)); }

org.sarsoft.MapInfoControl.prototype.initialize = function(map) {
	var that = this;
	this.minimized = false;
	this.div = document.createElement("div");
	this.ctrl = jQuery('<span style="background: white" class="noprint"></span>').appendTo(this.div);
	this.min = jQuery('<img style="cursor: pointer; width: 12px; height: 12px" src="/static/images/right.png"/>').appendTo(this.ctrl);
	GEvent.addDomListener(this.min[0], "click", function() {
		that.minmax();
	});

	this.msg = jQuery('<span style="background: white"></span>').appendTo(this.div);
	map.getContainer().appendChild(this.div);
	return this.div;
}

org.sarsoft.MapInfoControl.prototype.minmax = function() {
	if(this.minimized) {
		this.ctrl.css("padding-right", "0");
		this.msg.css("display", "inline");
		this.min.attr("src", "/static/images/right.png");
		this.minimized = false;
	} else {
		this.ctrl.css("padding-right", "1em");
		this.msg.css("display", "none");
		this.min.attr("src", "/static/images/left.png");
		this.minimized = true;
	}
}

org.sarsoft.MapInfoControl.prototype.setMessage = function(message) {
	this.msg.html(message);
}

org.sarsoft.UTMEditForm = function() {	
}

org.sarsoft.UTMEditForm.prototype.create = function(container) {
	this.zone = jQuery('<input type="text" size="2"/>').appendTo(container);
	jQuery('<span class="hint">zone</span>').appendTo(container);
	$(container).append(" ");
	
	this.e = jQuery('<input type="text" size="9"/>').appendTo(container);
	jQuery('<span class="hint">E</span>').appendTo(container);
	$(container).append(" ");

	this.n = jQuery('<input type="text" size="9"/>').appendTo(container);
	jQuery('<span class="hint">N</span>').appendTo(container);
}

org.sarsoft.UTMEditForm.prototype.write = function(utm) {
	if(utm == null) utm = {zone : null, e: null, n : null};
	this.zone.val(utm.zone);
	this.e.val(utm.e);
	this.n.val(utm.n);
}

org.sarsoft.UTMEditForm.prototype.read = function() {
	var zone = this.zone.val();	
	if(zone == null || zone.length == 0) return null;
	if(zone.length > 2) zone = zone.substring(0, 2);
	return new UTM(this.e.val()*1, this.n.val()*1, zone*1);
}

org.sarsoft.LocationEntryForm = function() {
}

org.sarsoft.LocationEntryForm.prototype.create = function(container, handler) {
	var that = this;
	var table = jQuery('<table border="0"></table>').appendTo(container);
	var tbody = jQuery('<tbody></tbody>').appendTo(table);
	
	var tr = jQuery('<tr><td valign="top">UTM</td></tr>').appendTo(tbody);
	this.utmcontainer = document.createElement("td");
	tr.append(this.utmcontainer);
	this.utmform = new org.sarsoft.UTMEditForm();
	this.utmform.create(this.utmcontainer);
	
	tr = jQuery('<tr><td valign="top">Lat/Lng</td></tr>').appendTo(tbody);
	var td = jQuery("<td/>").appendTo(tr);
	this.lat = jQuery('<input type="text" size="8"/>').appendTo(td);
	td.append(", ");
	this.lng = jQuery('<input type="text" size="8"/>').appendTo(td);
	td.append('<br/><span class="hint">WGS84 decimal degrees, e.g. 39.3422, -120.2036</span>');
	
	tr = jQuery('<tr><td valign="top">Address</td></tr>').appendTo(tbody);
	td = jQuery("<td/>").appendTo(tr);
	this.address = jQuery('<input type="text" size="16"/>').appendTo(td);
	td.append('<br/><span class="hint">e.g. "Truckee, CA".</span>');
	if(typeof GClientGeocoder == 'undefined') {
		tr.css("display", "none");
	}
	
	if(handler != null) {
		this.lng.keydown(function(event) {
			if(event.keyCode == 13 && that.lat.val() != null) handler();
		});
		this.address.keydown(function(event) {
			if(event.keyCode == 13) handler();
		});
	}
}

org.sarsoft.LocationEntryForm.prototype.read = function(callback) {
	var utm = this.utmform.read();
	var addr = this.address.val();
	var lat = this.lat.val();
	var lng = this.lng.val();
	if(utm != null) {
		callback(GeoUtil.UTMToGLatLng(utm));
	} else if(addr != null && addr.length > 0 && typeof GClientGeocoder != 'undefined') {
		var gcg = new GClientGeocoder();
		gcg.getLatLng(addr, callback);
	} else if(lat != null && lat.length > 0 && lng != null && lng.length > 0) {
		callback(new GLatLng(1*lat, 1*lng));
	} else {
		return false;
	}
	return true;
}

org.sarsoft.LocationEntryForm.prototype.clear = function() {
	this.utmform.write({zone : "", e : "", n : ""});
	this.address.val("");
	this.lat.val("");
	this.lng.val("");
}

function UTM(e, n, zone) {
	this.e = Math.round(e);
	this.n = Math.round(n);
	this.zone = zone;
}

UTM.prototype.distanceFrom = function(other) {
	var dx = this.e - other.e;
	var dy = this.n - other.n;
	return Math.sqrt(dx*dx+dy*dy);
}

UTM.prototype.toString = function() {
	return this.zone + " " + Math.round(this.e) + "E  " + Math.round(this.n) + "N";
}

UTM.prototype.toHTMLString = function() {
	var e = "" + Math.round(this.e);
	var n = "" + Math.round(this.n);
	var e1 = e.substring(0, e.length-3);
	var e2 = e.substring(e.length-3, e.length);
	var n1 = n.substring(0, n.length-3);
	var n2 = n.substring(n.length-3, n.length);

	return this.zone + " " + e1 + "<span style=\"font-size: smaller\">" + e2 + "E</span> " + n1 + "<span style=\"font-size: smaller\">" + n2 + "N</span>";
}

GeoUtil = new Object();

GeoUtil.formatDDMMHH = function(deg) {
	var neg = false;
	if(deg < 0) {
		neg = true;
		deg = deg*-1;
	}
	var d=Math.floor(deg);
	var m=Math.floor((deg-d)*60);
	var h=Math.round(((deg-d)*60-m)*100);
	if(h == 100) {
		h = 0;
		m = m + 1;
	}
	return (neg ? "-" : "") + d+"\u00B0"+m+"."+((h < 10) ? "0" + h : h) +"'";
}

GeoUtil.UTMToGLatLng = function(utm) {
	var ll = new Object();
	GeoUtil.UTMXYToLatLon(utm.e, utm.n, utm.zone, false, ll);
	return new GLatLng(GeoUtil.RadToDeg(ll[0]),GeoUtil.RadToDeg(ll[1]));
}

GeoUtil.GLatLngToUTM = function(gll, zone) {
	var xy = new Object();
	if(typeof zone == "undefined") zone = Math.floor ((gll.lng() + 180.0) / 6) + 1;
	var zone = GeoUtil.LatLonToUTMXY (GeoUtil.DegToRad(gll.lat()), GeoUtil.DegToRad(gll.lng()), zone, xy);
	return new UTM(xy[0], xy[1], zone);
}

GeoUtil.getWestBorder = function(zone) {
	return (zone - 1)*6 - 180;
}

GeoUtil.getEastBorder = function(zone) {
	return GeoUtil.getWestBorder(zone + 1);
}

GeoUtil.datum = org.sarsoft.map.datums[org.sarsoft.map.datum];

GeoUtil.toWGS84 = function(gll) {
	var wgs84 = org.sarsoft.map.datums["WGS84"];
	if(GeoUtil.datum == wgs84) return gll;
	return GeoUtil.convertDatum(gll, GeoUtil.datum, wgs84);
}

GeoUtil.fromWGS84 = function(gll) {
	var wgs84 = org.sarsoft.map.datums["WGS84"];
	if(GeoUtil.datum == wgs84) return gll;
	return GeoUtil.convertDatum(gll, wgs84, GeoUtil.datum);
}

GeoUtil.convertDatum = function(gll, from, to) {
	var lat = GeoUtil.DegToRad(gll.lat());
	var lng = GeoUtil.DegToRad(gll.lng());
	var da = to.a - from.a;
	var bda = 1 - from.f;
	var df = to.f - from.f;
	var fromEs = 2*from.f-from.f*from.f;
	var dx = from.x-to.x;
	var dy = from.y-to.y;
	var dz = from.z-to.z;
	
	var Rn = from.a/Math.sqrt(1-fromEs*Math.sin(lat));
	var Rm = from.a*(1-fromEs)/Math.pow(1 - fromEs*Math.sin(lat), 1.5);
	
	var dLat = ((-1*dx*Math.sin(lat)*Math.cos(lng) - dy*Math.sin(lat)*Math.sin(lng) + dz*Math.cos(lat)) + 
			(da*Rn*fromEs*Math.sin(lat)*Math.cos(lat)/from.a) + df*(Rm/bda+Rn*bda)*Math.sin(lat)*Math.cos(lat))/Rm;
	var dLng = (-1*dx*Math.sin(lng) + dy*Math.cos(lng))/(Rn * Math.cos(lat));
	
	return new GLatLng(GeoUtil.RadToDeg(lat+dLat), GeoUtil.RadToDeg(lng+dLng));
}

GeoUtil.UTMScaleFactor = 0.9996;

GeoUtil.DegToRad = function(deg) { return (deg / 180.0 * Math.PI) }
GeoUtil.RadToDeg = function(rad) { return (rad / Math.PI * 180.0) }

GeoUtil.ArcLengthOfMeridian = function(phi) {
	var datum = GeoUtil.datum;

    var n = (datum.a - datum.b) / (datum.a + datum.b);

    var alpha = ((datum.a + datum.b) / 2.0) * (1.0 + (Math.pow (n, 2.0) / 4.0) + (Math.pow (n, 4.0) / 64.0));
    var beta = (-3.0 * n / 2.0) + (9.0 * Math.pow (n, 3.0) / 16.0) + (-3.0 * Math.pow (n, 5.0) / 32.0);
    var gamma = (15.0 * Math.pow (n, 2.0) / 16.0) + (-15.0 * Math.pow (n, 4.0) / 32.0);
    var delta = (-35.0 * Math.pow (n, 3.0) / 48.0) + (105.0 * Math.pow (n, 5.0) / 256.0);
    var epsilon = (315.0 * Math.pow (n, 4.0) / 512.0);

    return alpha * (phi + (beta * Math.sin (2.0 * phi))
            + (gamma * Math.sin (4.0 * phi))
            + (delta * Math.sin (6.0 * phi))
            + (epsilon * Math.sin (8.0 * phi)));

}

GeoUtil.UTMCentralMeridian = function(zone) { return GeoUtil.DegToRad (-183.0 + (zone * 6.0)); }

GeoUtil.FootpointLatitude = function(y) {
	var datum = GeoUtil.datum;
	
    var n = (datum.a - datum.b) / (datum.a + datum.b);

    var alpha_ = ((datum.a + datum.b) / 2.0) * (1 + (Math.pow (n, 2.0) / 4) + (Math.pow (n, 4.0) / 64));
    var y_ = y / alpha_;
    var beta_ = (3.0 * n / 2.0) + (-27.0 * Math.pow (n, 3.0) / 32.0) + (269.0 * Math.pow (n, 5.0) / 512.0);
    var gamma_ = (21.0 * Math.pow (n, 2.0) / 16.0) + (-55.0 * Math.pow (n, 4.0) / 32.0);
    var delta_ = (151.0 * Math.pow (n, 3.0) / 96.0) + (-417.0 * Math.pow (n, 5.0) / 128.0);
    var epsilon_ = (1097.0 * Math.pow (n, 4.0) / 512.0);

    return y_ + (beta_ * Math.sin (2.0 * y_))
            + (gamma_ * Math.sin (4.0 * y_))
            + (delta_ * Math.sin (6.0 * y_))
            + (epsilon_ * Math.sin (8.0 * y_));
}

GeoUtil.MapLatLonToXY = function(phi, lambda, lambda0, xy) {
    var datum = GeoUtil.datum;    
	
	var ep2 = (Math.pow (datum.a, 2.0) - Math.pow (datum.b, 2.0)) / Math.pow (datum.b, 2.0);
	var nu2 = ep2 * Math.pow (Math.cos (phi), 2.0);
	var N = Math.pow (datum.a, 2.0) / (datum.b * Math.sqrt (1 + nu2));
	var t = Math.tan (phi);
	var t2 = t * t;
	var tmp = (t2 * t2 * t2) - Math.pow (t, 6.0);
	var l = lambda - lambda0;
        
	var l3coef = 1.0 - t2 + nu2;
	var l4coef = 5.0 - t2 + 9 * nu2 + 4.0 * (nu2 * nu2);
	var l5coef = 5.0 - 18.0 * t2 + (t2 * t2) + 14.0 * nu2
            - 58.0 * t2 * nu2;
	var l6coef = 61.0 - 58.0 * t2 + (t2 * t2) + 270.0 * nu2
            - 330.0 * t2 * nu2;
	var l7coef = 61.0 - 479.0 * t2 + 179.0 * (t2 * t2) - (t2 * t2 * t2);
	var l8coef = 1385.0 - 3111.0 * t2 + 543.0 * (t2 * t2) - (t2 * t2 * t2);

	xy[0] = N * Math.cos (phi) * l
            + (N / 6.0 * Math.pow (Math.cos (phi), 3.0) * l3coef * Math.pow (l, 3.0))
            + (N / 120.0 * Math.pow (Math.cos (phi), 5.0) * l5coef * Math.pow (l, 5.0))
            + (N / 5040.0 * Math.pow (Math.cos (phi), 7.0) * l7coef * Math.pow (l, 7.0));

    xy[1] = GeoUtil.ArcLengthOfMeridian (phi)
            + (t / 2.0 * N * Math.pow (Math.cos (phi), 2.0) * Math.pow (l, 2.0))
            + (t / 24.0 * N * Math.pow (Math.cos (phi), 4.0) * l4coef * Math.pow (l, 4.0))
            + (t / 720.0 * N * Math.pow (Math.cos (phi), 6.0) * l6coef * Math.pow (l, 6.0))
            + (t / 40320.0 * N * Math.pow (Math.cos (phi), 8.0) * l8coef * Math.pow (l, 8.0));

   return;
}

GeoUtil.MapXYToLatLon = function(x, y, lambda0, philambda) {
    var datum = GeoUtil.datum;
	var phif = GeoUtil.FootpointLatitude(y);

	var ep2 = (Math.pow (datum.a, 2.0) - Math.pow (datum.b, 2.0)) / Math.pow (datum.b, 2.0);
    var cf = Math.cos (phif);
    var nuf2 = ep2 * Math.pow (cf, 2.0);
    var Nf = Math.pow (datum.a, 2.0) / (datum.b * Math.sqrt (1 + nuf2));
    var Nfpow = Nf;
    var tf = Math.tan (phif);
    var tf2 = tf * tf;
    var tf4 = tf2 * tf2;

    var x1frac = 1.0 / (Nfpow * cf);
    Nfpow *= Nf;   /* now equals Nf**2) */
    var x2frac = tf / (2.0 * Nfpow);
    Nfpow *= Nf;   /* now equals Nf**3) */
    var x3frac = 1.0 / (6.0 * Nfpow * cf);
    Nfpow *= Nf;   /* now equals Nf**4) */
    var x4frac = tf / (24.0 * Nfpow);
    Nfpow *= Nf;   /* now equals Nf**5) */
    var x5frac = 1.0 / (120.0 * Nfpow * cf);
    Nfpow *= Nf;   /* now equals Nf**6) */
    var x6frac = tf / (720.0 * Nfpow);
    Nfpow *= Nf;   /* now equals Nf**7) */
    var x7frac = 1.0 / (5040.0 * Nfpow * cf);
    Nfpow *= Nf;   /* now equals Nf**8) */
    var x8frac = tf / (40320.0 * Nfpow);

    var x2poly = -1.0 - nuf2;
    var x3poly = -1.0 - 2 * tf2 - nuf2;
    var x4poly = 5.0 + 3.0 * tf2 + 6.0 * nuf2 - 6.0 * tf2 * nuf2 - 3.0 * (nuf2 *nuf2) - 9.0 * tf2 * (nuf2 * nuf2);
    var x5poly = 5.0 + 28.0 * tf2 + 24.0 * tf4 + 6.0 * nuf2 + 8.0 * tf2 * nuf2;
    var x6poly = -61.0 - 90.0 * tf2 - 45.0 * tf4 - 107.0 * nuf2 + 162.0 * tf2 * nuf2;
    var x7poly = -61.0 - 662.0 * tf2 - 1320.0 * tf4 - 720.0 * (tf4 * tf2);
    var x8poly = 1385.0 + 3633.0 * tf2 + 4095.0 * tf4 + 1575 * (tf4 * tf2);

    philambda[0] = phif + x2frac * x2poly * (x * x)
    	+ x4frac * x4poly * Math.pow (x, 4.0)
    	+ x6frac * x6poly * Math.pow (x, 6.0)
    	+ x8frac * x8poly * Math.pow (x, 8.0);

    philambda[1] = lambda0 + x1frac * x
    	+ x3frac * x3poly * Math.pow (x, 3.0)
    	+ x5frac * x5poly * Math.pow (x, 5.0)
    	+ x7frac * x7poly * Math.pow (x, 7.0);

   return;
}


GeoUtil.LatLonToUTMXY = function(lat, lon, zone, xy) {
	GeoUtil.MapLatLonToXY (lat, lon, GeoUtil.UTMCentralMeridian (zone), xy);

	xy[0] = xy[0] * GeoUtil.UTMScaleFactor + 500000.0;
	xy[1] = xy[1] * GeoUtil.UTMScaleFactor;
	if (xy[1] < 0.0)
		xy[1] = xy[1] + 10000000.0;
	return zone;
}


GeoUtil.UTMXYToLatLon = function(x, y, zone, southhemi, latlon) {
    var cmeridian;

    x -= 500000.0;
    x /= GeoUtil.UTMScaleFactor;

    if (southhemi)
    	y -= 10000000.0;

    y /= GeoUtil.UTMScaleFactor;

    cmeridian = GeoUtil.UTMCentralMeridian(zone);
    GeoUtil.MapXYToLatLon (x, y, cmeridian, latlon);
    return;
}


GeoUtil.Declination = new Object();
GeoUtil.Declination.G_COEFF = [
	[0.0],
	[-29496.6, -1586.3],
	[-2396.6, 3026.1, 1668.6],
	[1340.1, -2326.2, 1231.9, 634.0],
	[912.6, 808.9, 166.7, -357.1, 89.4],
	[-230.9, 357.2, 200.3, -141.1, -163.0, -7.8],
	[72.8, 68.6, 76.0, -141.4, -22.8, 13.2, -77.9],
	[80.5, -75.1, -4.7, 45.3, 13.9, 10.4, 1.7, 4.9],
	[24.4, 8.1, -14.5, -5.6, -19.3, 11.5, 10.9, -14.1, -3.7],
	[5.4, 9.4, 3.4, -5.2, 3.1, -12.4, -0.7, 8.4, -8.5, -10.1],
	[-2.0, -6.3, 0.9, -1.1, -0.2, 2.5, -0.3, 2.2, 3.1, -1.0, -2.8],
	[3.0, -1.5, -2.1, 1.7, -0.5, 0.5, -0.8, 0.4, 1.8, 0.1, 0.7, 3.8],
	[-2.2, -0.2, 0.3, 1.0, -0.6, 0.9, -0.1, 0.5, -0.4, -0.4, 0.2, -0.8, 0.0]];

GeoUtil.Declination.H_COEFF = [
	[0.0],
	[0.0, 4944.4],
	[0.0, -2707.7, -576.1],
	[0.0, -160.2, 251.9, -536.6],
	[0.0, 286.4, -211.2, 164.3, -309.1],
	[0.0, 44.6, 188.9, -118.2, 0.0, 100.9],
	[0.0, -20.8, 44.1, 61.5, -66.3, 3.1, 55.0],
	[0.0, -57.9, -21.1, 6.5, 24.9, 7.0, -27.7, -3.3],
	[0.0, 11.0, -20.0, 11.9, -17.4, 16.7, 7.0, -10.8, 1.7],
	[0.0, -20.5, 11.5, 12.8, -7.2, -7.4, 8.0, 2.1, -6.1, 7.0],
	[0.0, 2.8, -0.1, 4.7, 4.4, -7.2, -1.0, -3.9, -2.0, -2.0, -8.3],
	[0.0, 0.2, 1.7, -0.6, -1.8, 0.9, -0.4, -2.5, -1.3, -2.1, -1.9, -1.8],
	[0.0, -0.9, 0.3, 2.1, -2.5, 0.5, 0.6, 0.0, 0.1, 0.3, -0.9, -0.2, 0.9]];

GeoUtil.Declination.DELTA_G = [
	[0.0],
	[11.6, 16.5],
	[-12.1, -4.4, 1.9],
	[0.4, -4.1, -2.9, -7.7],
	[-1.8, 2.3, -8.7, 4.6, -2.1],
	[-1.0, 0.6, -1.8, -1.0, 0.9, 1.0],
	[-0.2, -0.2, -0.1, 2.0, -1.7, -0.3, 1.7],
	[0.1, -0.1, -0.6, 1.3, 0.4, 0.3, -0.7, 0.6],
	[-0.1, 0.1, -0.6, 0.2, -0.2, 0.3, 0.3, -0.6, 0.2],
	[0.0, -0.1, 0.0, 0.3, -0.4, -0.3, 0.1, -0.1, -0.4, -0.2],
	[0.0, 0.0, -0.1, 0.2, 0.0, -0.1, -0.2, 0.0, -0.1, -0.2, -0.2],
	[0.0, 0.0, 0.0, 0.1, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, -0.1, 0.0],
	[0.0, 0.0, 0.1, 0.1, -0.1, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, -0.1, 0.1]];

GeoUtil.Declination.DELTA_H = [
	[0.0],
	[0.0, -25.9],
	[0.0, -22.5, -11.8],
	[0.0, 7.3, -3.9, -2.6],
	[0.0, 1.1, 2.7, 3.9, -0.8],
	[0.0, 0.4, 1.8, 1.2, 4.0, -0.6],
	[0.0, -0.2, -2.1, -0.4, -0.6, 0.5, 0.9],
	[0.0, 0.7, 0.3, -0.1, -0.1, -0.8, -0.3, 0.3],
	[0.0, -0.1, 0.2, 0.4, 0.4, 0.1, -0.1, 0.4, 0.3],
	[0.0, 0.0, -0.2, 0.0, -0.1, 0.1, 0.0, -0.2, 0.3, 0.2],
	[0.0, 0.1, -0.1, 0.0, -0.1, -0.1, 0.0, -0.1, -0.2, 0.0, -0.1],
	[0.0, 0.0, 0.1, 0.0, 0.1, 0.0, 0.1, 0.0, -0.1, -0.1, 0.0, -0.1],
	[0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.1, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]];


GeoUtil.Declination.SCHMIDT_QUASI_NORM_FACTORS = function(maxN) {
	var schmidtQuasiNorm = new Array();
    schmidtQuasiNorm[0] = [1.0];
    for (var n = 1; n <= maxN; n++) {
        schmidtQuasiNorm[n] = new Array();
        schmidtQuasiNorm[n][0] = schmidtQuasiNorm[n - 1][0] * (2 * n - 1) / n;
        for (var m = 1; m <= n; m++) {
        	schmidtQuasiNorm[n][m] = schmidtQuasiNorm[n][m - 1] * Math.sqrt((n - m + 1) * (m == 1 ? 2 : 1) / (n + m));
        }
    }
    return schmidtQuasiNorm;
}(13);

GeoUtil.Declination.BASE_TIME = new Date(2010, 1, 1).getTime();


GeoUtil.Declination.LegendreTable = function(maxN, theta) {
	var mP = new Array();
	var mPDeriv = new Array();
	mP[0] = [1];
	mPDeriv[0] = [0];
	for(var n = 1; n <= maxN; n++) {
		mP[n] = new Array();
		mPDeriv[n] = new Array();
		for(var m = 0; m <= n; m++) {
			if(n == m) {
				mP[n][m] = Math.sin(theta) * mP[n - 1][m - 1];
                mPDeriv[n][m] = Math.cos(theta) * mP[n - 1][m - 1] + Math.sin(theta) * mPDeriv[n - 1][m - 1];
            } else if (n == 1 || m == n - 1) {
                mP[n][m] = Math.cos(theta) * mP[n - 1][m];
                mPDeriv[n][m] = -1*Math.sin(theta) * mP[n - 1][m] + Math.cos(theta) * mPDeriv[n - 1][m];
            } else {
                var k = ((n - 1) * (n - 1) - m * m) / ((2 * n - 1) * (2 * n - 3));
                mP[n][m] = Math.cos(theta) * mP[n - 1][m] - k * mP[n - 2][m];
                mPDeriv[n][m] = -1*Math.sin(theta) * mP[n - 1][m] + Math.cos(theta) * mPDeriv[n - 1][m] - k * mPDeriv[n - 2][m];
            }
        }
	}
	var obj = new Object();
	obj.mP = mP;
	obj.mPDeriv = mPDeriv;
	return obj;
}

GeoUtil.Declination.compute = function(gll) {
	var lat = gll.lat();
	var lng = gll.lng();
	if(lat > 89.9) lat = 89.9;
	if(lat < -89.9) lat = -89.9;
	
	var a2 = (org.sarsoft.map.datums["WGS84"].a/1000)*(org.sarsoft.map.datums["WGS84"].a/1000);
	var b2 = (org.sarsoft.map.datums["WGS84"].b/1000)*(org.sarsoft.map.datums["WGS84"].b/1000);

	var latr = GeoUtil.DegToRad(lat);
    var clat = Math.cos(latr);
    var slat = Math.sin(latr);
    var tlat = slat / clat;

	var latRad = Math.sqrt(a2 * clat * clat + b2 * slat * slat);
	
	var mLatRad = Math.atan(tlat * b2 / a2);
	var mLngRad = GeoUtil.DegToRad(lng);
	
	var radius = Math.sqrt((a2 * a2 * clat * clat + b2 * b2 * slat * slat) / (a2 * clat * clat + b2 * slat * slat));

	var legendre = GeoUtil.Declination.LegendreTable(13 - 1, (Math.PI / 2 - mLatRad));

    var relativeRadiusPower = new Array();
    relativeRadiusPower[0] = 1;
    relativeRadiusPower[1] = 6371.2 / radius;
    for (var i = 2; i < 15; ++i) {
        relativeRadiusPower[i] = relativeRadiusPower[i - 1] * relativeRadiusPower[1];
    }

    var sinMLon = new Array();
    var cosMLon = new Array();
    sinMLon[0] = 0;
    cosMLon[0] = 1;
    sinMLon[1] = Math.sin(mLngRad);
    cosMLon[1] = Math.cos(mLngRad);

    for (var m = 2; m < 13; ++m) {
        // Standard expansions for sin((m-x)*theta + x*theta) and
        // cos((m-x)*theta + x*theta).
        var x = m >> 1;
        sinMLon[m] = sinMLon[m - x] * cosMLon[x] + cosMLon[m - x] * sinMLon[x];
        cosMLon[m] = cosMLon[m - x] * cosMLon[x] - sinMLon[m - x] * sinMLon[x];
    }

    var inverseCosLatitude = 1 / Math.cos(mLatRad);
    var yearsSinceBase = (new Date().getTime() - GeoUtil.Declination.BASE_TIME) / (365 * 24 * 60 * 60 * 1000);

    // We now compute the magnetic field strength given the geocentric
    // location. The magnetic field is the derivative of the potential
    // function defined by the model. See NOAA Technical Report: The US/UK
    // World Magnetic Model for 2010-2015 for the derivation.
    var gcX = 0.0; // Geocentric northwards component.
    var gcY = 0.0; // Geocentric eastwards component.
    var gcZ = 0.0; // Geocentric downwards component.

    for (var n = 1; n < 13; n++) {
        for (var m = 0; m <= n; m++) {
            // Adjust the coefficients for the current date.
            var g = GeoUtil.Declination.G_COEFF[n][m] + yearsSinceBase * GeoUtil.Declination.DELTA_G[n][m];
            var h = GeoUtil.Declination.H_COEFF[n][m] + yearsSinceBase * GeoUtil.Declination.DELTA_H[n][m];

            // Negative derivative with respect to latitude, divided by
            // radius.  This looks like the negation of the version in the
            // NOAA Techincal report because that report used
            // P_n^m(sin(theta)) and we use P_n^m(cos(90 - theta)), so the
            // derivative with respect to theta is negated.
            gcX += relativeRadiusPower[n + 2] * (g * cosMLon[m] + h * sinMLon[m]) * legendre.mPDeriv[n][m] * GeoUtil.Declination.SCHMIDT_QUASI_NORM_FACTORS[n][m];

            // Negative derivative with respect to longitude, divided by
            // radius.
            gcY += relativeRadiusPower[n + 2] * m * (g * sinMLon[m] - h * cosMLon[m]) * legendre.mP[n][m] * GeoUtil.Declination.SCHMIDT_QUASI_NORM_FACTORS[n][m] * inverseCosLatitude;

            // Negative derivative with respect to radius.
            gcZ -= (n + 1) * relativeRadiusPower[n + 2] * (g * cosMLon[m] + h * sinMLon[m]) * legendre.mP[n][m] * GeoUtil.Declination.SCHMIDT_QUASI_NORM_FACTORS[n][m];
        }
    }

    // Convert back to geodetic coordinates.  This is basically just a
    // rotation around the Y-axis by the difference in latitudes between the
    // geocentric frame and the geodetic frame.
    var latDiffRad = GeoUtil.DegToRad(lat) - mLatRad;
    var mX = (gcX * Math.cos(latDiffRad) + gcZ * Math.sin(latDiffRad));
    var mY = gcY;
    var mZ = (-gcX * Math.sin(latDiffRad) + gcZ * Math.cos(latDiffRad));
    
    return GeoUtil.RadToDeg(Math.atan2(mY, mX));
}



org.sarsoft.MapUtil = new Object();

org.sarsoft.MapUtil.createIcon = function(size, url) {
  var icon = new GIcon(G_DEFAULT_ICON);
  icon.image = url;
  icon.iconSize = new GSize(size, size);
  icon.shadowSize = new GSize(0, 0);
  icon.iconAnchor = new GPoint(size / 2, size / 2);
  icon.infoWindowAnchor = new GPoint(size / 2, size / 2);
  icon.printImage = url;
  icon.mozPrintImage = url;
  icon.transparent = url;
  return icon;
	
}

org.sarsoft.MapUtil.createFlatCircleIcon = function (size, color) {
  if(color.indexOf('#') == 0) color = color.substring(1);
  var url = "/resource/imagery/icons/circle/" + color + ".png";
  var icon = new GIcon(G_DEFAULT_ICON);
  icon.image = url;
  icon.iconSize = new GSize(size, size);
  icon.shadowSize = new GSize(0, 0);
  icon.iconAnchor = new GPoint(size / 2, size / 2);
  icon.infoWindowAnchor = new GPoint(size / 2, size / 2);
  icon.printImage = url;
  icon.mozPrintImage = url;
  icon.transparent = url;
  icon.imageMap = [];
  var polyNumSides = 8;
  var polySideLength = 360 / polyNumSides;
  var polyRadius = size / 2;
  for (var a = 0; a < (polyNumSides + 1); a++) {
      var aRad = polySideLength * a * (Math.PI / 180);
      var pixelX = polyRadius + polyRadius * Math.cos(aRad);
      var pixelY = polyRadius + polyRadius * Math.sin(aRad);
      icon.imageMap.push(parseInt(pixelX), parseInt(pixelY));
  }

  return icon;
}


function ELabel(point, html, style, pixelOffset, centerOffset) {
  this._olcapable = true;
  // Mandatory parameters
  this.point = point;
  this.html = html;

  // Optional parameters
  this.style = style||"";
  this.pixelOffset = pixelOffset||new GSize(0,0);
  this.centerOffset = centerOffset||new GSize(0,-1);
  this.hidden = false;
}

ELabel.prototype = new GOverlay();

ELabel.prototype.initialize = function(map) {
  var div = document.createElement("div");
  div.style.position = "absolute";
  div.innerHTML = '<div style="' + this.style + '" class="olAlphaImage">' + this.html + '</div>' ;
  map.getPane(G_MAP_FLOAT_SHADOW_PANE).appendChild(div);
  this.map_ = map;
  this.div_ = div;
  this.div2_ = div.childNodes[0];
  this.div2_.style.position = "relative";
  if (this.hidden) {
    this.hide();
  }
}

ELabel.prototype.remove = function() {
  this.div_.parentNode.removeChild(this.div_);
}

ELabel.prototype.copy = function() {
  return new ELabel(this.point, this.html, this.classname, this.pixelOffset, this.percentOpacity, this.overlap);
}

ELabel.prototype.redraw = function(force) {
  var p = this.map_.fromLatLngToDivPixel(this.point);
  var h = parseInt(this.div_.clientHeight);
  var w = parseInt(this.div_.clientWidth);
  if(typeof(this.style.indexOf)=="undefined") alert(this.html);
  if(this.style.indexOf("rotate(270") > 0 || this.style.indexOf("rotate(90") > 0) {
	  if($.browser.msie) {
		  var tmp = w;
		  w=h;
		  h=tmp*2;
	  } else {
		  h = w+h;  
	  }	  
  }
  this.div2_.style.left = Math.round(p.x + this.pixelOffset.width + w * this.centerOffset.width) + "px";
  this.div2_.style.top = Math.round(p.y +this.pixelOffset.height + h * this.centerOffset.height) + "px";
}

ELabel.prototype.show = function() {
  if (this.div_) {
    this.div_.style.display="";
    this.redraw();
  }
  this.hidden = false;
}

ELabel.prototype.hide = function() {
  if (this.div_) {
    this.div_.style.display="none";
  }
  this.hidden = true;
}

ELabel.prototype.isHidden = function() {
  return this.hidden;
}

ELabel.prototype.supportsHide = function() {
  return true;
}

ELabel.prototype.setContents = function(html) {
  this.html = html;
  this.div_.innerHTML = '<div class="' + this.classname + '">' + this.html + '</div>' ;
  this.redraw(true);
}

ELabel.prototype.setPoint = function(point) {
  this.point = point;
  if (this.overlap) {
    var z = GOverlay.getZIndex(this.point.lat());
    this.div_.style.zIndex = z;
  }
  this.redraw(true);
}

ELabel.prototype.getPoint = function() {
  return this.point;
}


function GeoRefImageOverlay(point, latlng, angle, scale, id, size, opacity) {
	this._olcapable = true;
	this.point = point;
	this.latlng = latlng;
	this.angle=angle;
	this.scale = scale;
	this.id = id;
	this.size = size;
	this.opacity = opacity;
}

GeoRefImageOverlay.prototype = new GOverlay();

GeoRefImageOverlay.prototype.initialize = function(map) {
	var div = document.createElement("img");
	div.style.position = "absolute";
	div.src= '/resource/imagery/georef/' +  this.id + '.png?originx=' + this.point.x + '&originy=' + this.point.y + '&angle=' + this.angle;
	div.style.zIndex=2;
	map.getPane(G_MAP_MAP_PANE).appendChild(div);
	this._map = map;
	this.div = div;
    if(typeof(div.style.filter)=='string'){div.style.filter='alpha(opacity:'+this.opacity*100+')';}
    if(typeof(div.style.KHTMLOpacity)=='string'){div.style.KHTMLOpacity=this.opacity;}
    if(typeof(div.style.MozOpacity)=='string'){div.style.MozOpacity=this.opacity;}
    if(typeof(div.style.opacity)=='string'){div.style.opacity=this.opacity;}
}

GeoRefImageOverlay.prototype.remove = function() {
	this.div.parentNode.removeChild(this.div);
}

GeoRefImageOverlay.prototype.redraw = function(force) {
  var pixel = this._map.fromLatLngToDivPixel(this.latlng);
  var ne = this._map.fromDivPixelToLatLng(new GPoint(pixel.x-this.point.x, pixel.y-this.point.y));
  var pxDistance = Math.sqrt(Math.pow(this.point.x, 2) + Math.pow(this.point.y, 2));
  var scaling = this.scale / (ne.distanceFrom(this.latlng) / pxDistance);
  
  this.div.style.left = pixel.x-this.point.x*scaling + "px";
  this.div.style.top = pixel.y-this.point.y*scaling + "px";
  this.div.style.height = this.size.height*scaling + "px";
  this.div.style.width = this.size.width*scaling + "px";
}

GeoRefImageOverlay.prototype.show = function() {
  if (this.div) {
    this.div.style.display="";
    this.redraw();
  }
  this.hidden = false;
}

GeoRefImageOverlay.prototype.hide = function() {
  if (this.div) {
    this.div.style.display="none";
  }
  this.hidden = true;
}


