if(typeof org == "undefined") org = new Object();
if(typeof org.sarsoft == "undefined") org.sarsoft = new Object();

if(typeof org.sarsoft.EnhancedGMap == "undefined") org.sarsoft.EnhancedGMap = function() {}

org.sarsoft.EnhancedGMap.prototype.createMapType = function(config) {
	if(config.type == "NATIVE") return eval(config.template);
	var layers = this.createTileLayers(config);
    var type = new GMapType(layers, G_SATELLITE_MAP.getProjection(), config.name, { errorMessage: "error w topo", tileSize: config.tilesize ? config.tilesize : 256 } );
    if(config.alphaOverlay) type._alphaOverlay = true;
    type._info = config.info;
    return type;
}

org.sarsoft.EnhancedGMap.prototype.createTileLayers = function(config) {
	var that = this;
	var layer;
	if(config.type == "TILE") {
		layer = new GTileLayer(new GCopyrightCollection(config.copyright), config.minresolution, config.maxresolution, { isPng: config.png, tileUrlTemplate: config.template });
		return [layer];
	} else if(config.type == "WMS") {
		layer = new GTileLayer(new GCopyrightCollection(config.copyright), config.minresolution, config.maxresolution, { isPng: config.png });
		layer.getTileUrl = function(tile, zoom) { return that._getWMSTileUrl(tile, zoom, config) };
		layer.wmstemplate = config.template;
		return [layer];
	} else if(config.type == "NATIVE") {
		return eval(config.template+'.getTileLayers()');
	}
}

org.sarsoft.EnhancedGMap.prototype._getWMSTileUrl = function(tile, zoom, config) {
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
}

org.sarsoft.EnhancedGMap.prototype.createMap = function(element) {
	if(GBrowserIsCompatible()) {
		var map = new GMap2(element);
		this.map = map;

		this.mapTypes = this.setMapTypes(org.sarsoft.EnhancedGMap.defaultMapTypes);
		this.geoRefImages = this.setGeoRefImages(org.sarsoft.EnhancedGMap.geoRefImages);

		map.setCenter(new GLatLng(org.sarsoft.map._default.lat, org.sarsoft.map._default.lng), org.sarsoft.map._default.zoom);
		if(typeof G_PHYSICAL_MAP != "undefined") {
			map.addMapType(G_PHYSICAL_MAP);
			map.setMapType(G_PHYSICAL_MAP);
		}
		var odmc = new OverlayDropdownMapControl();
		map.addControl(odmc);
		map._overlaydropdownmapcontrol = odmc;
		map.addControl(new GLargeMapControl3D());
		map.addControl(new GScaleControl());
		return map;
	}
}

org.sarsoft.EnhancedGMap.prototype.setMapTypes = function(types) {
	var mapTypes = new Array();
	for(var i = 0; i < types.length; i++) {
		var type = this.createMapType(types[i]);
		mapTypes.push(type);
		this.map.addMapType(type);
	}
	return mapTypes;
}

org.sarsoft.EnhancedGMap.prototype.setGeoRefImages = function(images) {
	var geoRefImages = new Array();
	for(var i = 0; i < images.length; i++) {
		geoRefImages[i] = images[i];
	}
	this.map.geoRefImages = geoRefImages;
	return geoRefImages;
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
		var option = document.createElement("option");
		option.value=i;
		option.appendChild(document.createTextNode(types[i].getName()));
		select.appendChild(option);
	}
	return select;
}

OverlayDropdownMapControl.prototype.initialize = function(map) {
	var that = this;
	var mapTypes = map.getMapTypes();
	this.types = new Array();
	var transparentTypes = new Array();
	var baseTypes = new Array();
	// georef images get added to this list; need to shallow cop
	for(var i = 0; i < mapTypes.length; i++) {
		this.types[i] = mapTypes[i];
		if(this.types[i]._alphaOverlay) {
			transparentTypes.push(this.types[i]);
		} else {
			baseTypes.push(this.types[i]);
		}
	}
	this.typeSelect = this._createSelect(baseTypes);
	if(transparentTypes.length > 0) {
		this.hasAlphaOverlays=true;
		this.overlaySelect = this._createSelect(baseTypes);
	} else {
		this.hasAlphaOverlays=false;
		this.overlaySelect = this._createSelect(this.types);
	}
	for(var i = 0; i < map.geoRefImages.length; i++) {
		var option = document.createElement("option");
		option.value=this.types.length;
		option.appendChild(document.createTextNode(map.geoRefImages[i].name));
		this.overlaySelect.appendChild(option);
		this.types.push(map.geoRefImages[i]);
	}
		
	this.map = map;
	this.map._overlaydropdownmapcontrol = this;

	this.opacityInput = document.createElement("input");
	this.opacityInput.size=2;
	this.opacityInput.value=0;
	
	var tPlus = null;
	var tDivOverlay = null;
	var tDiv = null;
	var div = document.createElement("div");
	if(this.hasAlphaOverlays) {
		this.alphaOverlayBoxes = new Array();
		this.alphaOverlayTypes = transparentTypes;
		tPlus = document.createElement("span");
		tPlus.style.position="relative";
		var tps = document.createElement("span");
		tps.style.cursor="pointer";
		tps.innerHTML="+";
		this.alphaOverlayPlus = tps;
		tPlus.appendChild(tps);

		tDiv = document.createElement("div");
		tDiv.style.visibility="hidden";
		tDiv.style.backgroundColor="white";
		tDiv.style.position="absolute";
		tDiv.style.right="0";
		tDiv.style.top="1.5em";
		tDiv.style.width="16em";
		tDivOverlay = document.createElement("div");
		tDivOverlay.style.color="black";
		tDivOverlay.style.fontWeight="normal";
		tDiv.appendChild(tDivOverlay);
		for(var i = 0; i < transparentTypes.length; i++) {
			var cb = document.createElement("input");
			cb.type="checkbox";
			cb.value=i;
			cb.name = transparentTypes[i].getName();
			this.alphaOverlayBoxes[i] = cb;
			tDiv.appendChild(cb);
			tDiv.appendChild(document.createTextNode(transparentTypes[i].getName()));
			if(i < transparentTypes.length - 1) tDiv.appendChild(document.createElement("br"));
		}
		tPlus.appendChild(tDiv);
		GEvent.addDomListener(tps, "click", function() {
			if(tDiv.style.visibility=="hidden") {
				tDiv.style.visibility="visible";
				div.style.zIndex="1001";
			} else {
				tDiv.style.visibility="hidden";
			}
			});
	}
	
	div.style.color="red";
	div.style.background="white";
	div.style.fontWeight="bold";
	div.style.zIndex="1001";
	div.appendChild(this.extras);
	div.appendChild(document.createTextNode("base: "));
	div.appendChild(this.typeSelect);
	if(tDivOverlay != null) {
		tDivOverlay.appendChild(this.overlaySelect);
		tDivOverlay.appendChild(document.createTextNode("@"));
		tDivOverlay.appendChild(this.opacityInput);
		tDivOverlay.appendChild(document.createTextNode("%"));
	} else {
		div.appendChild(document.createTextNode("overlay: "));
		div.appendChild(this.overlaySelect);
		div.appendChild(this.opacityInput);		
	}
	if(tPlus != null) div.appendChild(tPlus);
	var go = document.createElement("button");
	go.appendChild(document.createTextNode("GO"));
	div.appendChild(go);
	map.getContainer().appendChild(div);
	
	GEvent.addDomListener(go, "click", function() {
		if(tDiv != null) tDiv.style.visibility="hidden";
		var base = that.types[that.typeSelect.value];
		var overlay = that.types[that.overlaySelect.value];
		var opacity = that.opacityInput.value;
		if(opacity < 0) opacity = 0;
		if(opacity > 100) opacity = 100;
		opacity = opacity / 100;
		var tt = new Array();
		if(that.alphaOverlayBoxes != null) for(var i = 0; i < that.alphaOverlayBoxes.length; i++) {
			if(that.alphaOverlayBoxes[i].checked) tt.push(that.alphaOverlayTypes[i]);
		}
		that.updateMap(base, overlay, opacity, tt.length > 0 ? tt : null);
	});
	this._go = go;
	return div;
}

OverlayDropdownMapControl.prototype.updateMap = function(base, overlay, opacity, alphaOverlays) {
		this.opacityInput.value=Math.round(opacity*100);
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
		if(overlay.getMaximumResolution != null && base.getMaximumResolution() > overlay.getMaximumResolution() && !overlay._alphaOverlay && opacity > 0) {
			// google maps doesn't seem to check the overlays' min and max resolutions
			// null check overlay to handle georef'd imagery
			var tmp = overlay;
			overlay = base;
			base = tmp;
			opacity = 1-opacity;
		}
		var infoString = "";
		this.map.setMapType(base);
		if(base._info != null && base._info.length > 0) infoString += base._info + ". ";
		if(overlay._info != null && overlay._info.length > 0 && base != overlay && opacity > 0) infoString += overlay._info + ". ";
		if(typeof this._overlays != "undefined") {
			for(var i = 0; i < this._overlays.length; i++) {
				this.map.removeOverlay(this._overlays[i]);
			}
		}
		this._overlays = new Array();
		if(overlay.angle != null) {
			this._overlays[0] = new GeoRefImageOverlay(new GPoint(1*overlay.originx, 1*overlay.originy), new GLatLng(1*overlay.originlat, 1*overlay.originlng), overlay.angle, overlay.scale, overlay.id, new GSize(1*overlay.width, 1*overlay.height), opacity);
			this.map.addOverlay(this._overlays[0]);
			this.map._sarsoft_overlay_name = overlay.name;
			this.map._sarsoft_overlay_opacity = opacity;
		} else {
			var layers = overlay.getTileLayers();
			for(var i = 0; i < layers.length; i++) {
				this._overlays[i] = new GTileLayerOverlay(new org.sarsoft.GAlphaTileLayerWrapper(overlay.getTileLayers()[i], opacity));
				this.map.addOverlay(this._overlays[i]);
				this.map._sarsoft_overlay_name = overlay.getName();
				this.map._sarsoft_overlay_opacity = opacity;
			}
		}
		if(alphaOverlays != null) {
			var anames = "";
			for(var i = 0; i < alphaOverlays.length; i++) {
				var layer = new GTileLayerOverlay(alphaOverlays[i].getTileLayers()[0]);
				this._overlays[this._overlays.length] = layer;
				this.map.addOverlay(layer)
				anames = anames + alphaOverlays[i].getName();
				if(i < alphaOverlays.length - 1) anames = anames + ",";
				if(alphaOverlays[i]._info != null && alphaOverlays[i]._info.length > 0) infoString += alphaOverlays[i]._info + ". ";
			}
			this.map._sarsoft_alpha_overlays=anames;
		}
		var extras = 0;
		if(alphaOverlays != null) extras = extras + alphaOverlays.length;
		if(this.hasAlphaOverlays) {
			if(opacity > 0) extras++;
			this.alphaOverlayPlus.innerHTML = "+" + ((extras == 0) ? "" : extras);
		}
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
	var dlg = document.createElement("div");
	dlg.style.position="absolute";
	dlg.style.zIndex="200";
	dlg.style.top="100px";
	dlg.style.left="100px";
	dlg.style.width="350px";
	var hd = document.createElement("div");
	hd.appendChild(document.createTextNode("Map Size"));
	hd.className = "hd";
	dlg.appendChild(hd);
	var bd = document.createElement("div");
	bd.className = "bd";
	dlg.appendChild(bd);
	var d = document.createElement("div");
	d.style.paddingBottom="10px";
	bd.appendChild(d);
	d.innerHTML = "Adjust the page size for printing.  Remember to specify units (e.g. 11in, 20cm) and account for margins.  Restore map to original size by setting width and height to 100%";
	bd.appendChild(document.createTextNode("Width: "));
	this.widthInput = document.createElement("input");
	this.widthInput.type="text";
	this.widthInput.size=8;
	bd.appendChild(this.widthInput);
	bd.appendChild(document.createTextNode("   Height: "));
	this.heightInput = document.createElement("input");
	this.heightInput.type="text";
	this.heightInput.size=8;
	bd.appendChild(this.heightInput);
	this.dialog = new YAHOO.widget.Dialog(dlg, {zIndex: "2500", width: "350px"});
	var buttons = [ { text : "Update", handler: function() {
		that.dialog.hide();
		var center = that.map.getCenter();
		var width = that.widthInput.value;
		var height = that.heightInput.value;
		that.map.getContainer().style.width=width;
		that.map.getContainer().style.height=height;
		that.map.checkResize();
		that.map.setCenter(center);
	}, isDefault: true}, {text : "Cancel", handler : function() { that.dialog.hide(); }}];
	this.dialog.cfg.queueProperty("buttons", buttons);
	this._rendered = false;
	this.dialog.render(document.body);
	this.dialog.hide();
}

org.sarsoft.view.MapSizeDlg.prototype.show = function() {
	this.widthInput.value=this.map.getContainer().style.width;
	this.heightInput.value=this.map.getContainer().style.height;
	this.dialog.show();
}

org.sarsoft.MapDeclinationWidget = function(imap) {
	var that = this;
	this.imap = imap;
	GEvent.addListener(imap.map, "moveend", function() { that.refresh(); });
	GEvent.addListener(imap.map, "zoomend", function(foo, bar) { that.refresh(); });
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

	var datumControl = document.createElement("div");
	datumControl.style.zIndex=2000;
	datumControl.style.position="absolute";
	datumControl.style.bottom="0px";
	datumControl.style.left="0px";
	datumControl.style.backgroundColor="white";
	this.datumDisplay = document.createElement("span");
	datumControl.appendChild(this.datumDisplay);
	this.datumDisplay.innerHTML = org.sarsoft.map.datum;
	this.datumControl = datumControl;
	imap.map.getContainer().appendChild(datumControl);
	
	if(switchable) {
		var datumSwitcher = document.createElement("a");
		datumSwitcher.style.cursor="pointer";
		datumSwitcher.innerHTML = "+";
		datumSwitcher.className="noprint";
		this.datumControl.appendChild(datumSwitcher);
		this.datumSwitcher = datumSwitcher;
		
		var id = "ContextMenu_" + org.sarsoft.view.ContextMenu._idx++;		
		var datumMenu = new YAHOO.widget.Menu(id, {hidedelay : 800, zIndex : "1000", context : [datumSwitcher, "bl", "tr"]});
		var fn = function(d) {
			return function() {
				org.sarsoft.map.datum = d;
				GeoUtil.datum = org.sarsoft.map.datums[org.sarsoft.map.datum];
				datumMenu.hide();
				that.datumDisplay.innerHTML = d;
				that.imap.updateDatum();
			}
		}
		for(var datum in org.sarsoft.map.datums) {
			datumMenu.addItem(new YAHOO.widget.MenuItem(datum,  { onclick : { fn : fn(datum) }}));
		}
		datumMenu.render(document.body);
		
		GEvent.addDomListener(datumSwitcher, "click", function() {
			datumMenu.cfg.setProperty("context", [datumSwitcher, "bl", "tr"]);
			datumMenu.show();
		});
	}
}


org.sarsoft.UTMGridControl = function(imap) {
	var that = this;
	this._showUTM = true;
	this.utmgridlines = new Array();
	this.text = new Array();
	this.utminitialized = false;
	if(imap != null) {
			this._UTMToggle = new org.sarsoft.ToggleControl("UTM", "Enable/disable UTM gridlines", function(value) {
				that._showUTM = value;
				that._drawUTMGrid(true);
			}, [{value : true, style : ""},
			 {value : "tickmark", style : "color: white; background-color: red"},
			 {value : false, style : "text-decoration: line-through"}]);
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

	GEvent.addListener(map, "tilesloaded", function() {
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
	});
	
	var div = document.createElement("div");
	map.getContainer().appendChild(div);
	return div;
}

org.sarsoft.UTMGridControl.prototype.setConfig = function(config) {
	if(config.UTMGridControl == null) return;
	this._showUTM = config.UTMGridControl.showUTM;
	this._UTMToggle.setValue(this._showUTM);
	this._drawUTMGrid(true);
}

org.sarsoft.UTMGridControl.prototype.getConfig = function(config) {
	if(config.UTMGridControl == null) config.UTMGridControl = new Object();
	config.UTMGridControl.showUTM = this._showUTM;
	return config;
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
	
	var overlay = new GPolyline(vertices, "#0000FF", primary ? 0.8 : 0.5, primary ? 1 : 0.7);
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
		return "<div style=\"color:#0000FF; background: #FFFFFF\"><b>" + Math.round(meters/1000) + "</b><span style=\"font-size: smaller\">000</span></div>";
	}

	var easting = Math.round(sw.e / spacing)  * spacing;
	var pxmax = this.map.fromLatLngToContainerPixel(bounds.getNorthEast()).x;
	var pymax = this.map.fromLatLngToContainerPixel(bounds.getSouthWest()).y;
	while(easting < ne.e) {
		var start = GeoUtil.toWGS84(GeoUtil.UTMToGLatLng({e: easting, n: sw.n, zone: zone}));

		if(west < start.lng() && start.lng() < east) {
			if(this._showUTM == true) {
				this._drawGridLine(new UTM(easting, sw.n, zone), new UTM(easting, ne.n, zone), (easting % 1000 == 0));
			} else {
				var northing = Math.round(sw.n / spacing) * spacing;
				while(northing < ne.n) {
					this._drawGridLine(new UTM(easting, northing-(spacing/10), zone), new UTM(easting, northing+(spacing/10), zone), true);
					this._drawGridLine(new UTM(easting-(spacing/10), northing, zone), new UTM(easting+(spacing/10), northing, zone), true);
					northing = northing + spacing;
				}
			}

			var offset = this.map.fromLatLngToContainerPixel(GeoUtil.toWGS84(GeoUtil.UTMToGLatLng({e: easting, n: screenSW.n, zone: zone}))).x;
			if(0 < offset && offset < pxmax && easting % 1000 == 0) {
				var point = new GPoint(offset, pymax-15);
				var label = new ELabel(this.map.fromContainerPixelToLatLng(point), createText(easting), "-webkit-transform: rotate(270deg); -moz-transform: rotate(270deg); filter: progid:DXImageTransform.Microsoft.BasicImage(rotation=3);", null, new GSize(-0.5,-1));
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

org.sarsoft.PositionInfoControl = function() {
}

org.sarsoft.PositionInfoControl.prototype = new GControl();
org.sarsoft.PositionInfoControl.prototype.printable = function() { return false; }
org.sarsoft.PositionInfoControl.prototype.selectable = function() { return false; }
org.sarsoft.PositionInfoControl.prototype.getDefaultPosition = function() { return new GControlPosition(G_ANCHOR_TOP_RIGHT, new GSize(0, 25)); }

org.sarsoft.PositionInfoControl.prototype.initialize = function(map) {
	var that = this;
	this.map = map;
	
	var div = document.createElement("div");
	div.style.backgroundColor="white";
	div.style.fontWeight="bold";
	div.style.textAlign="right";
	div.className="noprint";

	GEvent.addListener(map, "mousemove", function(latlng) {
		var datumll = GeoUtil.fromWGS84(latlng);
		var utm = GeoUtil.GLatLngToUTM(datumll);
		var e = "" + Math.round(utm.e);
		var n = "" + Math.round(utm.n);
		var e1 = e.substring(0, e.length-3);
		var e2 = e.substring(e.length-3, e.length);
		var n1 = n.substring(0, n.length-3);
		var n2 = n.substring(n.length-3, n.length);

		var message = utm.toHTMLString() + "<br/>";
		message = message + GeoUtil.formatDDMMHH(datumll.lat()) + ", " + GeoUtil.formatDDMMHH(datumll.lng());
		div.innerHTML = message;
	});

	map.getContainer().appendChild(div);
	return div;
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

org.sarsoft.MapFindWidget = function(imap) {
	var that = this;
	var that = this;
	this.imap = imap;
	
	var dlg = document.createElement("div");
	dlg.style.position="absolute";
	dlg.style.zIndex="200";
	dlg.style.top="100px";
	dlg.style.left="100px";
	dlg.style.width="450px";
	var hd = document.createElement("div");
	hd.appendChild(document.createTextNode("Find"));
	hd.className = "hd";
	dlg.appendChild(hd);
	var bd = document.createElement("div");
	bd.className = "bd";
	dlg.appendChild(bd);
	var d = document.createElement("div");
	bd.appendChild(d);
	this.bd = bd;
	
	this.locationEntryForm = new org.sarsoft.LocationEntryForm();
	this.locationEntryForm.create(d);
	
	this.dialog = new YAHOO.widget.Dialog(dlg, {zIndex: "2500", width: "450px"});
	var buttons = [ { text : "Find", handler: function() {
		that.dialog.hide();
		var entry = that.locationEntryForm.read(function(gll) { that.imap.map.setCenter(gll, 14);});
		if(!entry) that.checkBlocks();
	}, isDefault: true}, {text : "Cancel", handler : function() { that.dialog.hide(); }}];
	this.dialog.cfg.queueProperty("buttons", buttons);
	this.dialog.render(document.body);
	this.dialog.hide();

	var find = document.createElement("img");
	find.src="/static/images/find.png";
	find.style.cursor="pointer";
	find.style.verticalAlign="middle";
	find.title = "Find a coordinate";
	GEvent.addDomListener(find, "click", function() {
		that.locationEntryForm.clear();
		that.initializeDlg();
		that.dialog.show();
	});
	imap.addMenuItem(find, 26);
}

org.sarsoft.MapFindWidget.prototype.initializeDlg = function() {
	var blocks = new Array();
	if(this._container != null) this.bd.removeChild(this._container);
	this._container = document.createElement("div");
	this.bd.appendChild(this._container);

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

	this.map._imap = this;
	this.mapMessageControl = new org.sarsoft.MapMessageControl();
	this.map.addControl(this.mapMessageControl);
	
	if(options == null) options = {};
	if(options.positionWindow || options.standardControls) {
		this.map.addControl(new org.sarsoft.PositionInfoControl());
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
	config.base = this.map.getCurrentMapType().getName();
	config.overlay = this.map._sarsoft_overlay_name;
	config.opacity = this.map._sarsoft_overlay_opacity;
	if(this.map._sarsoft_alpha_overlays != null) config.alphaOverlays = this.map._sarsoft_alpha_overlays;
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
	var poly = new GPolygon(vertices, color, 2, Math.max(Math.min(config.opacity/100, 1), 0), color, config.fill/100);
	this.map.addOverlay(poly);
	return poly;
}

org.sarsoft.InteractiveMap.prototype._createPolyline = function(vertices, config) {
	if(config.opacity == null) config.opacity = 100;
	var poly = new GPolyline(vertices, config.color, 3, Math.max(Math.min(config.opacity/100, 1), 0));
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
	var label = new ELabel(GeoUtil.UTMToGLatLng(labelUTM), "<span class='maplabel'>" + radius + "m</span>", new GSize(-6, -4));
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
		this.map.setCenter(gll, 15);
	} else {
		var bounds = this.map.getBounds();
		bounds.extend(gll);
		this.map.setCenter(bounds.getCenter(), this.map.getBoundsZoomLevel(bounds, true));
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

	this.ctrl = document.createElement("span");
	this.ctrl.style.background = "white";
	this.ctrl.className = "noprint";
	this.min = document.createElement("img");
	this.min.style.cursor = "pointer";
	this.min.style.width="12px";
	this.min.style.height="12px";
	this.min.src = "/static/images/right.png";
	GEvent.addDomListener(this.min, "click", function() {
		that.minmax();
	});
	this.ctrl.appendChild(this.min);
		
	this.msg = document.createElement("span");
	this.msg.style.background = "white";
	
	this.div.appendChild(this.ctrl);
	this.div.appendChild(this.msg);
	
	map.getContainer().appendChild(this.div);
	
	return this.div;
}

org.sarsoft.MapInfoControl.prototype.minmax = function() {
	if(this.minimized) {
		this.ctrl.style.paddingRight = "0";
		this.msg.style.display = "inline";
		this.min.src = "/static/images/right.png";
		this.minimized = false;
	} else {
		this.ctrl.style.paddingRight = "1em";
		this.msg.style.display = "none";
		this.min.src = "/static/images/left.png";
		this.minimized = true;
	}
}

org.sarsoft.MapInfoControl.prototype.setMessage = function(message) {
	this.msg.innerHTML = message;
}

org.sarsoft.UTMEditForm = function() {	
}

org.sarsoft.UTMEditForm.prototype.create = function(container) {
	this.zone = document.createElement("input");
	this.zone.type="text";
	this.zone.size=2;
	container.appendChild(this.zone);
	var label = document.createElement("span");
	label.className="hint";
	label.innerHTML = "zone";
	container.appendChild(label);
	container.appendChild(document.createTextNode(" "));
	
	this.e = document.createElement("input");
	this.e.type="text";
	this.e.size=9;
	container.appendChild(this.e);
	label = document.createElement("span");
	label.className="hint";
	label.innerHTML = "E";
	container.appendChild(label);
	container.appendChild(document.createTextNode(" "));

	this.n = document.createElement("input");
	this.n.type="text";
	this.n.size=9;
	container.appendChild(this.n);
	label = document.createElement("span");
	label.className="hint";
	label.innerHTML = "N";
	container.appendChild(label);
}

org.sarsoft.UTMEditForm.prototype.write = function(utm) {
	if(utm == null) utm = {zone : null, e: null, n : null};
	this.zone.value = utm.zone;
	this.e.value = utm.e;
	this.n.value = utm.n;
}

org.sarsoft.UTMEditForm.prototype.read = function() {
	var zone = this.zone.value;	
	if(zone == null || zone.length == 0) return null;
	if(zone.length > 2) zone = zone.substring(0, 2);
	return new UTM(this.e.value*1, this.n.value*1, zone*1);
}

org.sarsoft.LocationEntryForm = function() {
}

org.sarsoft.LocationEntryForm.prototype.create = function(container) {
	var table = document.createElement("table");
	table.border=0;
	var tbody = document.createElement("tbody");
	table.appendChild(tbody);
	var tr = document.createElement("tr");
	var td = document.createElement("td");
	td.vAlign="top";
	td.innerHTML = "UTM";
	tr.appendChild(td);
	td = document.createElement("td");
	this.utmcontainer = td;
	tr.appendChild(td);
	tbody.appendChild(tr);
	this.utmform = new org.sarsoft.UTMEditForm();
	this.utmform.create(this.utmcontainer);
	
	tr = document.createElement("tr");
	td = document.createElement("td");
	td.vAlign="top";
	td.innerHTML = "Lat/Lng";
	tr.appendChild(td);
	td = document.createElement("td");
	this.lat = document.createElement("input");
	this.lat.type="text";
	this.lat.size="8";
	td.appendChild(this.lat);
	td.appendChild(document.createTextNode(", "));
	this.lng = document.createElement("input");
	this.lng.type="text";
	this.lng.size="9";
	td.appendChild(this.lng);
	td.appendChild(document.createElement("br"));
	var span = document.createElement("span");
	span.className="hint";
	span.innerHTML="WGS84 decimal degrees, e.g. 39.3422, -120.2036";
	td.appendChild(span);
	tr.appendChild(td);
	tbody.appendChild(tr);
	
	tr = document.createElement("tr");
	td = document.createElement("td");
	td.vAlign="top";
	td.innerHTML = "Address";
	tr.appendChild(td);
	td = document.createElement("td");
	this.address = document.createElement("input");
	this.address.type="text";
	this.address.size="16";
	td.appendChild(this.address);
	td.appendChild(document.createElement("br"));
	span = document.createElement("span");
	span.className="hint";
	span.innerHTML="e.g. 'Truckee, CA'.  Requires a working internet connection.";
	td.appendChild(span);
	tr.appendChild(td);
	if(typeof GClientGeocoder == 'undefined') {
		tr.style.display = "none";
	}
	tbody.appendChild(tr);
	
	container.appendChild(table);
}

org.sarsoft.LocationEntryForm.prototype.read = function(callback) {
	var utm = this.utmform.read();
	var addr = this.address.value;
	if(utm != null) {
		callback(GeoUtil.UTMToGLatLng(utm));
	} else if(addr != null && addr.length > 0 && typeof GClientGeocoder != 'undefined') {
		var gcg = new GClientGeocoder();
		gcg.getLatLng(addr, callback);
	} else if(this.lat.value != null && this.lat.value.length > 0 && this.lng.value != null && this.lng.value.length > 0) {
		callback(new GLatLng(this.lat.value, this.lng.value));
	} else {
		return false;
	}
	return true;
}

org.sarsoft.LocationEntryForm.prototype.clear = function() {
	this.utmform.write({zone : "", e : "", n : ""});
	this.address.value="";
	this.lat.value="";
	this.lng.value="";
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
  this.div.style.height = this.size.height*scaling;
  this.div.style.width = this.size.width*scaling;
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


