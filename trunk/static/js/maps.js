if(typeof org == "undefined") org = new Object();
if(typeof org.sarsoft == "undefined") org.sarsoft = new Object();

org.sarsoft.EScaleControl = function() {
	GScaleControl.call(this);
}

org.sarsoft.EScaleControl.prototype = new GScaleControl();

org.sarsoft.EScaleControl.prototype.getDefaultPosition = function() {
	var position = GScaleControl.prototype.getDefaultPosition.call(this);
	return new GControlPosition(position.anchor, new GSize(120,position.offset.height));
}

org.sarsoft.EScaleControl.prototype.printable = function() {
	return true;
}

if(typeof org.sarsoft.EnhancedGMap == "undefined") org.sarsoft.EnhancedGMap = new Object();

org.sarsoft.EnhancedGMap._createTileLayers = function(config) {
	var that = this;
	var layer;
	if(config.type == "TILE") {
		if(org.sarsoft.map.overzoom.enabled) {
			layer = new GTileLayer(new GCopyrightCollection(config.copyright), config.minresolution, config.maxresolution, { isPng: config.png });
			layer.getTileUrl = function(tile, zoom) { 
				var url = config.template;
				if(zoom > config.maxresolution) {
					url = '/resource/imagery/tilecache/' + config.name + '/{Z}/' + '/{X}/' + '{Y}.png';
				}
				return url.replace(/{Z}/, zoom).replace(/{X}/, tile.x).replace(/{Y}/, tile.y);
			}
			layer.maxResolution = function() {
				if(org.sarsoft.EnhancedGMap._overzoom) return org.sarsoft.map.overzoom.level;
				return config.maxresolution;
			}
			return [layer];
		} else {
			return [new GTileLayer(new GCopyrightCollection(config.copyright), config.minresolution, config.maxresolution, { isPng: config.png, tileUrlTemplate: config.template })];
		}
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

org.sarsoft.EnhancedGMap.createMapType = function(config) {
	if(config.type == "NATIVE") {
		var type = eval(config.template);
		type.getName = function() { return config.name }
		return type;
	} else {
		var layers = org.sarsoft.EnhancedGMap._createTileLayers(config);
	    var type = new GMapType(layers, G_SATELLITE_MAP.getProjection(), config.name, { errorMessage: "", tileSize: config.tilesize ? config.tilesize : 256 } );
	    if(config.alphaOverlay) type._alphaOverlay = true;
	    type._info = config.info;
	    type._alias = config.alias;
	    if(org.sarsoft.map.overzoom.enabled) type.getMaximumResolution = function() { return layers[0].maxResolution();}
	    return type;
	}
}

org.sarsoft.EnhancedGMap.createMap = function(element, center, zoom) {
	if(org.sarsoft.EnhancedGMap.visibleMapTypes.indexOf == null) {
		org.sarsoft.EnhancedGMap.visibleMapTypes.indexOf = function(elt) {
			for(var i = 0; i < this.length; i++) {
				if(this[i] == elt) return i;
			}
			return -1;
		}
	}

	if(GBrowserIsCompatible()) {
		var map = new GMap2(element);
		$(element).css({"z-index": 0, overflow: "hidden"});
		jQuery(map.getPane(G_MAP_MARKER_MOUSE_TARGET_PANE)).bind('contextmenu', function() { return false;});

		var mapTypes = new Array(), type = null, bkgset = false;
		for(var i = 0; i < org.sarsoft.EnhancedGMap.defaultMapTypes.length; i++) {
			var config = org.sarsoft.EnhancedGMap.defaultMapTypes[i];
			type = org.sarsoft.EnhancedGMap.createMapType(config);
			mapTypes.push(type);
			map.addMapType(type);
			if(bkgset == false) {
				map.setMapType(type);
				bkgset = true;
			}
		}
		
		map.geoRefImages = org.sarsoft.EnhancedGMap.geoRefImages.slice(0);

		if(center == null) center = new GLatLng(org.sarsoft.map._default.lat, org.sarsoft.map._default.lng);
		if(zoom == null) zoom = org.sarsoft.map._default.zoom;
		map.setCenter(center, zoom);
		map.addControl(new OverlayDropdownMapControl());
		map.addControl(new GLargeMapControl3D());
		map._zoomControl = $(map.getContainer()).children().last();
		return map;
	}
}
 
OverlayDropdownMapControl = function() {
	var that = this;
	this.types = new Array();  // georef images get added to this list; need to shallow copy
	this.alphaOverlayBoxes = new Array();
	this.alphaOverlayTypes = new Array();

	this.extras = document.createElement("span");
	this.typeSelect = document.createElement("select");
	this.typeDM = new org.sarsoft.view.DropMenu();
	this.overlaySelect = document.createElement("select");
	this.overlayDM = new org.sarsoft.view.DropMenu();
	$(this.overlaySelect).css("margin-left", "3px");
	$(this.overlaySelect).css("margin-right", "3px");
	this.opacityInput = jQuery('<input style="margin-left: 5px" size="2" value="0"></input>');

	var sliderContainer = jQuery('<div style="float: left; margin-left: 2px"><span style="float: left">Enter % or:</span></div>');
	this.opacitySlider = org.sarsoft.view.CreateSlider(sliderContainer);
	this.opacitySlider.subscribe('change', function() {
		if(!that._inSliderSet) {
			that._inSliderHandler = true;
			that.opacityInput.val(that.opacitySlider.getValue());
			that.handleLayerChange();
			that._inSliderHandler = false;
		}
	});

	var tps = jQuery('<span style="cursor: pointer; padding-right: 3px; padding-left: 3px" title="Additional Layers">+</span>');
	var dd = new org.sarsoft.view.MenuDropdown(tps, 'width: 20em');
	this.alphaOverlayPlus = tps[0];

	this.div = jQuery('<div style="color: red; background: white; font-weight: bold; z-index: 1001"></div>');
	this.div.append(this.extras, this.typeDM.container, dd.container);

	this.opacityInput.change(function() { that.handleLayerChange() });
//	$(this.typeSelect).change(function() { that.handleLayerChange() });
	this.typeDM.change(function() { that.handleLayerChange() });
//	$(this.overlaySelect).change(function() { that.handleLayerChange() });
	this.overlayDM.change(function() { that.handleLayerChange() });

	dd.div.append(jQuery('<div></div>').append(
			jQuery('<div style="float: left; padding-top: 2px; padding-bottom: 2px"></div>').append(this.overlayDM.container, "@", this.opacityInput, "%")).append(
		jQuery('<div style="clear: both; height: 15px"></div>').append(
				sliderContainer)));
	
	this.aDiv = jQuery('<div style="clear: both; margin-top: 5px; padding-top: 5px; border-top: 1px dashed #808080"></div>').appendTo(dd.div);
}

OverlayDropdownMapControl.prototype = new GControl();
OverlayDropdownMapControl.prototype.printable = function() { return false; }
OverlayDropdownMapControl.prototype.selectable = function() { return false; }
OverlayDropdownMapControl.prototype.getDefaultPosition = function() { return new GControlPosition(G_ANCHOR_TOP_RIGHT, new GSize(0, 0)); }

OverlayDropdownMapControl.prototype.addBaseType = function(type, group) {
	var idx = this.types.length;
	jQuery('<option value="' + idx + '">' + type.getName() + '</option>').appendTo(this.typeSelect);
	jQuery('<option value="' + idx + '">' + type.getName() + '</option>').appendTo(this.overlaySelect);
	this.typeDM.addItem(type.getName(), idx, group);
	this.overlayDM.addItem(type.getName(), idx, group);
	this.types[idx] = type;
}

OverlayDropdownMapControl.prototype.addOverlayType = function(type) {
	var idx = this.types.length;
	jQuery('<option value="' + idx + '">' + type.getName() + '</option>').appendTo(this.overlaySelect);
	this.overlayDM.addItem(type.getName(), idx, group);
	this.types[idx] = type;
}

OverlayDropdownMapControl.prototype.addAlphaType = function(type) {
	var that = this;
	var idx = this.alphaOverlayBoxes.length;
	if(idx > 0) this.aDiv.append(document.createElement("br"));
	this.alphaOverlayBoxes[idx] = jQuery('<input type="checkbox" value="' + idx + '" name="' + type.getName() + '"/>').appendTo(this.aDiv)[0];
	this.aDiv.append(type.getName());
	if(type._alias != null && type._alias.indexOf("slp") == 0) {
		var hazards = [1, 1, 1, 1, 1, 1, 1, 1];
		var elements = [];
		var colors = ['white', '#00FF09', '#F5FF0A', '#FE9900', '#FF0000'];
		var slpcolors = ['none', "url('/static/images/ok.png')"];
		var cfg = jQuery('<table style="color: black; display: none" border="0"></table>').appendTo(this.aDiv);
		var tb = jQuery('<tbody></tbody').appendTo(cfg);
		var tr = jQuery('<tr></tr>').appendTo(tb);
		elements[7] = jQuery('<td style="cursor: pointer; width: 2em; height: 2em; text-align: center; background-repeat: no-repeat">NW</td>').appendTo(tr);
		elements[0] = jQuery('<td style="cursor: pointer; width: 2em; height: 2em; text-align: center; background-repeat: no-repeat">N</td>').appendTo(tr);
		elements[1] = jQuery('<td style="cursor: pointer; width: 2em; height: 2em; text-align: center; background-repeat: no-repeat">NE</td>').appendTo(tr);
		var dataset = jQuery('<select><option value="s">Slope</option><option value="a">Aspect</option></select>').appendTo(
				jQuery('<span>Color By: </span>').appendTo(jQuery('<td rowspan="2" valign="top" style="font-weight: normal"></td>').appendTo(tr)));
		var tr = jQuery('<tr></tr>').appendTo(tb);
		elements[6] = jQuery('<td style="cursor: pointer; width: 2em; height: 2em; text-align: center; background-repeat: no-repeat">W</td>').appendTo(tr);
		var boostAll = jQuery('<td style="cursor: pointer; width: 2em; height: 2em; text-align: center; background-repeat: no-repeat">&uarr;</td>').appendTo(tr);
		elements[2] = jQuery('<td style="cursor: pointer; width: 2em; height: 2em; text-align: center; background-repeat: no-repeat">E</td>').appendTo(tr);
		var tr = jQuery('<tr></tr>').appendTo(tb);
		elements[5] = jQuery('<td style="cursor: pointer; width: 2em; height: 2em; text-align: center; background-repeat: no-repeat">SW</td>').appendTo(tr);
		elements[4] = jQuery('<td style="cursor: pointer; width: 2em; height: 2em; text-align: center; background-repeat: no-repeat">S</td>').appendTo(tr);
		elements[3] = jQuery('<td style="cursor: pointer; width: 2em; height: 2em; text-align: center; background-repeat: no-repeat">SE</td>').appendTo(tr);
		jQuery('<td valign="middle" style="font-weight: normal; text-align: right"><a href="http://caltopo.blogspot.com/2012/02/avalanche-slope-analysis.html" target="_new">please read</a></td>').appendTo(tr);
		var swapLayer = function() {
			that.swapConfigurableAlphaLayer(idx, dataset.val() + "-" + hazards.join(""));
			that.handleLayerChange();
		}
		var setBackground = function(aspect) {
			var hazard = hazards[aspect];
			if(dataset.val() == "s") {
				elements[aspect].css('background-image', slpcolors[hazard]);
				elements[aspect].css('background-color', '#FFFFFF');
			} else {
				elements[aspect].css('background-image', 'none');
				elements[aspect].css('background-color', colors[hazard]);
			}
		}
		var incrementAspect = function(aspect) {
			var hazard = hazards[aspect]+1;
			if(hazard > 4) hazard = 0;
			if(dataset.val() == "s" && hazard > 1) hazard = 0;
			hazards[aspect] = hazard;
			setBackground(aspect);
		}
		boostAll.click(function() {
			var min = 5;
			for(var i = 0; i < 8; i++) {
				min = Math.min(min, hazards[i]);
			}
			for(var i = 0; i < 8; i++) {
				if(hazards[i] == min) incrementAspect(i);
			}
			swapLayer();
		});
		dataset.change(function() {
			var total = 0;
			for(var i = 0; i < 8; i++) {
				total = total + hazards[i];
			}
			for(var i = 0; i < 8; i++) {
				if((dataset.val() == "s" && hazards[i] > 1) || total == 0) hazards[i] = 1;
				setBackground(i);
			}
			swapLayer();
		});
		cfg.readCfgValue = function(hazard) {
			dataset.val(hazard.split("-")[0]);
			newHazards = hazard.split("-")[1].split("");
			for(var i = 0; i < 8; i++) {
				hazards[i] = 1*newHazards[i];
				setBackground(i);
			}
		}
		for(var i = 0; i < 8; i++) {
			elements[i].click((function(j) { return function() { incrementAspect(j); swapLayer();}})(i));
		}
		this.alphaOverlayBoxes[idx]._cfg = cfg;
	}
	$(this.alphaOverlayBoxes[idx]).change(function() { that.handleLayerChange() });
	this.alphaOverlayTypes[idx] = type;
	this.hasAlphaOverlays = true;
	if(type._alias != null && type._alias.indexOf("slp") == 0) this.swapConfigurableAlphaLayer(idx, "s-11111111");
}

OverlayDropdownMapControl.prototype.swapConfigurableAlphaLayer = function(idx, cfgstr) {
	this.map.removeMapType(this.alphaOverlayTypes[idx]);
	for(i = 0; i < org.sarsoft.EnhancedGMap.defaultMapTypes.length; i++) {
		if(org.sarsoft.EnhancedGMap.defaultMapTypes[i].alias == this.alphaOverlayTypes[idx]._alias) {
			var type = org.sarsoft.EnhancedGMap.defaultMapTypes[i];
			var cfg = {alias: type.alias, alphaOverlay: true, copyright: type.copyright, info: type.info, maxresolution: type.maxresolution, minresolution: type.minresolution, name: type.name, png: type.png, type: type.type}
			cfg.template = type.template.replace(/{V}/,cfgstr);
			var atype = org.sarsoft.EnhancedGMap.createMapType(cfg);
			atype._cfgvalue = cfgstr;
			this.map.addMapType(atype);
			this.alphaOverlayTypes[idx] = atype;
		}
	}
}

OverlayDropdownMapControl.prototype.handleLayerChange = function() {
//	var base = this.types[this.typeSelect.value];
	var base = this.types[this.typeDM.val()];
//	var overlay = this.types[this.overlaySelect.value];
	var overlay = this.types[this.overlayDM.val()];
	opacity = Math.min(100, Math.max(0, this.opacityInput.val())) / 100;
	var tt = new Array();
	if(this.alphaOverlayBoxes != null) for(var i = 0; i < this.alphaOverlayBoxes.length; i++) {
		var cfg = this.alphaOverlayBoxes[i]._cfg;
		if(this.alphaOverlayBoxes[i].checked) {
			tt.push(this.alphaOverlayTypes[i]);
			if(cfg != null) cfg.css('display','block');
		} else {
			if(cfg != null) cfg.css('display','none');
		}
	}
	this.updateMap(this.types[this.typeDM.val()], this.types[this.overlayDM.val()], opacity, tt.length > 0 ? tt : null);
}

OverlayDropdownMapControl.prototype.resetMapTypes = function(type) {
	this.types = new Array();
	this.alphaOverlayBoxes = new Array();
	this.alphaOverlayTypes = new Array();
	$(this.typeSelect).empty();
	$(this.overlaySelect).empty();
	this.typeDM.empty();
	this.overlayDM.empty();
	this.aDiv.empty();

	var alphaTypes = new Array();
	var baseTypes = new Array();

	var grouping = {};
	if(org.sarsoft.EnhancedGMap.mapTypeGrouping != null) {
		var groups = org.sarsoft.EnhancedGMap.mapTypeGrouping.split(';');
		for(i = 0; i < groups.length; i++) {
			var name = groups[i].split('=')[0];
			var types = groups[i].split('=')[1].split(',');
			for(var j = 0; j < types.length; j++) {
				grouping[types[j]] = name;
			}
		}
	}
	
	var mapTypes = this.map.getMapTypes();	
	// use defaultMapTypes ordering for consistency if map layers change
	for(var i = 0; i < org.sarsoft.EnhancedGMap.defaultMapTypes.length; i++) {
		var config = org.sarsoft.EnhancedGMap.defaultMapTypes[i];
		if(org.sarsoft.EnhancedGMap.visibleMapTypes.indexOf(config.name) >= 0) {
			for(var j = 0; j < mapTypes.length; j++) {
				if(mapTypes[j].getName()==config.name) {
					if(mapTypes[j]._alphaOverlay) {
						this.addAlphaType(mapTypes[j]);
					} else {
						this.addBaseType(mapTypes[j], grouping[config.alias]);
					}
				}
			}
		}
	}

	for(var i = 0; i < this.map.geoRefImages.length; i++) {
		this.addOverlayType(this.map.geoRefImages[i]);
	}
	
	this.hasAlphaOverlays = false;
	this.updateMap(this.map.getCurrentMapType(), this.types[0], 0);
}


OverlayDropdownMapControl.prototype.initialize = function(map) {
	var that = this;
	map._overlaydropdownmapcontrol = this;
	this.map = map;
	
	this.div.appendTo(map.getContainer());	
	this.resetMapTypes();
	return this.div[0];
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
		this.alphaOverlays = null;

		var infoString = "";
		if(base._info != null && base._info.length > 0) infoString += base._info + ". ";
		
		if(realOpacity > 0) {
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
		}
		if(alphaOverlays != null) {
			this.alphaOverlays="";
			for(var i = 0; i < alphaOverlays.length; i++) {
				var layer = new GTileLayerOverlay(alphaOverlays[i].getTileLayers()[0]);
				this._overlays[this._overlays.length] = layer;
				this.map.addOverlay(layer)
				this.alphaOverlays = this.alphaOverlays + alphaOverlays[i].getName() + ((i < alphaOverlays.length - 1) ? "," : "");
				if(alphaOverlays[i]._info != null && alphaOverlays[i]._info.length > 0) {
					if(alphaOverlays[i]._alias == "slp") {
						if(alphaOverlays[i]._cfgvalue != null && alphaOverlays[i]._cfgvalue.indexOf("s") == 0) {
							infoString += '<span style="color: green; margin-left: 5px">20&deg;-27&deg;</span><span style="background-color: #F5FF0A; margin-left: 5px">28&deg;-34&deg;</span><span style="color: #FF0000; margin-left: 5px">35&deg;-45&deg;</span><span style="color: #0000FF; margin-left: 5px">46&deg;+</span>';
						} else {
							infoString += "Shading 28&deg;-59&deg;.  Dots 35&deg;-45&deg;";
						}
					} else {
						infoString += alphaOverlays[i]._info + ". ";
					}
				}
			}
		}
		
		// update visual controls
		this.opacityInput.val(Math.round(opacity*100));
		this._inSliderSet = true;
		if(!this._inSliderHandler) this.opacitySlider.setValue(opacity*100);
		this._inSliderSet = false;
		for(var i = 0; i < this.types.length; i++) {
//			if(this.types[i] == base) this.typeSelect.value = i;
			if(this.types[i] == base) this.typeDM.val(i);
//			if(this.types[i] == overlay) this.overlaySelect.value = i;
			if(this.types[i] == overlay) this.overlayDM.val(i);
		}
		if(alphaOverlays != null) for(var i = 0; i < this.alphaOverlayTypes.length; i++) {
			var cfg = this.alphaOverlayBoxes[i]._cfg;
			this.alphaOverlayBoxes[i].checked=false;
			if(cfg != null) cfg.css('display','none');
			for(var j = 0; j < alphaOverlays.length; j++) {
				if(this.alphaOverlayTypes[i] == alphaOverlays[j]) {
					this.alphaOverlayBoxes[i].checked=true;
					if(cfg != null) {
						cfg.css('display', 'block');
						cfg.readCfgValue(this.alphaOverlayTypes[i]._cfgvalue)
					}
				}
			}
		}
		var extras = 0;
		if(alphaOverlays != null) extras = extras + alphaOverlays.length;
		if(opacity > 0) extras++;
		this.alphaOverlayPlus.innerHTML = "+" + ((extras == 0) ? "" : extras);
		if(infoString.length > 0 && this.map._imap != null)  {
			this.map._imap.setMapInfo("org.sarsoft.OverlayDropdownMapControl", 0, infoString);
		} else if(this.map._imap != null) {
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

org.sarsoft.view.MapSizeForm = function(map, container) {
	var that = this;
	this.map = map;
	this.container = container;

	this.presets = [{name: "letter", description: "Letter", width: "8.5in", height: "11in", margin: "0.25in"}, 
	                {name: "1393", description: "Super B", width: "13in", height: "19in", margin: "0.25in"}
	                ];

	this.updateToPreset = function() {
		var presetName = that.presetInput.val();
		if(presetName == "Custom") {
			that.widthInput.removeAttr("disabled");
			that.heightInput.removeAttr("disabled");
			that.marginInput.removeAttr("disabled");
			that.cborientation.attr("disabled", "disabled");
			that.cbmargin.attr("disabled", "disabled");
			that.cborientation[0].checked=false;
			that.cbmargin[0].checked=false;
			return;
		}
		that.cbmargin.removeAttr("disabled");
		that.cborientation.removeAttr("disabled");
		that.widthInput.attr("disabled", "disabled");
		that.heightInput.attr("disabled", "disabled");
		that.marginInput.attr("disabled", "disabled");

		for(var i = 0; i < that.presets.length; i++) {
			var preset = that.presets[i];
			if(presetName == preset.name) {
				var width = preset.width;
				var height = preset.height;
				if(that.cborientation[0].checked) {
					width = preset.height;
					height = preset.width;
				}
				that.widthInput.val(width);
				that.heightInput.val(height);
				var margin = preset.margin;
				if(that.cbmargin[0].checked) margin = "0";
				that.marginInput.val(margin);
				that.write();
			}
		}
	}

	var div = jQuery('<div></div>').appendTo(container);
	div.append(document.createTextNode("Page Size: "));
	this.presetInput = jQuery('<select><option value="Custom">Custom</option></select>').appendTo(div).change(this.updateToPreset);
	for(var i = 0; i < this.presets.length; i++) {
		jQuery('<option value="' + this.presets[i].name + '">' + this.presets[i].description + '</option>').appendTo(this.presetInput);
	}
	this.cborientation = jQuery('<input type="checkbox"/>').appendTo(div).change(this.updateToPreset);
	div.append('<span>Landscape</span>');
	this.cbmargin = jQuery('<input style="margin-left: 5px" type="checkbox"/>').appendTo(div).change(this.updateToPreset);
	div.append('<span>Borderless</span>');
	this.cbscale = jQuery('<input style="margin-left: 5px" type="checkbox" checked="checked"/>').appendTo(div).change(function() {that.write();});
	div.append('<span>Shrink To Screen</span>');
	jQuery('<button style="margin-left: 20px">Cancel</button>').appendTo(div).click(function() {
		container.css('display', 'none');
		that.fullscreen();
	});
	

	var div = jQuery('<div style="padding-top: 5px"></div>').appendTo(container);
	div.append(document.createTextNode("Width: "));
	this.widthInput = jQuery('<input type="text" size="6"/>').appendTo(div).change(function() {that.write()});
	div.append(document.createTextNode("   Height: "));
	this.heightInput = jQuery('<input type="text" size="6"/>').appendTo(div).change(function() {that.write()});
	div.append(document.createTextNode("   Margin: "));
	if($.browser.mozilla) {
		div.append(document.createTextNode(" Not Supported on Firefox"));
		this.marginInput = jQuery('<input type="text" size="6"/>');
		
	} else {
		this.marginInput = jQuery('<input type="text" size="6"/>').appendTo(div).change(function() {that.write()});
	}
}

org.sarsoft.view.MapSizeForm.prototype.fullscreen = function() {
	var center = this.map.getCenter();

	this.map.getContainer().style.width="100%";
	this.map.getContainer().style.height="100%";
	this.map.getContainer()._margin=0;
	
	$(this.map.getContainer()).css('-webkit-transform', 'none').css('-moz-transform', 'none').css('-ms-transform', 'none');
	if(this.map._zoomControl != null) this.map._zoomControl.css('-webkit-transform', 'none').css('-moz-transform', 'none').css('-ms-transform', 'none');

	this.map.checkResize();
	this.map.setCenter(center);	
}

org.sarsoft.view.MapSizeForm.prototype.write = function() {
	var center = this.map.getCenter();
	var width = this.widthInput.val().replace(' ', '');
	var height = this.heightInput.val().replace(' ', '');
	var margin = this.marginInput.val().replace(' ', '')
	var rule = this._getMarginRule();
	
	if(rule != null && width.indexOf("in") > 0 && height.indexOf("in") > 0) {
		var nWidth = width.replace("in", "");
		var nHeight = height.replace("in", "");
		var nMargin = 0;
		if(margin.indexOf("in") > 0) {
			nMargin = margin.replace("in", "");
		} else if(margin.indexOf("cm") > 0) {
			nMargin = 2.54*margin.replace("cm", "");
		}
		width = (1*nWidth - nMargin*2) + "in";
		height = (1*nHeight - nMargin*2) + "in";
	}
	
	if(rule != null && width.indexOf("cm") > 0 && height.indexOf("cm") > 0) {
		var nWidth = width.replace("cm", "");
		var nHeight = height.replace("cm", "");
		var nMargin = 0;
		if(margin.indexOf("cm") > 0) {
			nMargin = margin.replace("cm", "");
		} else if(margin.indexOf("in") > 0) {
			nMargin = margin.replace("in", "")/2.54;
		}
		width = (1*nWidth - nMargin*2) + "cm";
		height = (1*nHeight - nMargin*2) + "cm";
	}
	
	var container = $(map.getContainer());

	this.map.getContainer().style.width=width;
	this.map.getContainer().style.height=height;
	this.map.getContainer()._margin=margin;
	
	this.border=this.container.height()+30;
	
	var scale = Math.min((container.parent().width()-40)/container.width(), (container.parent().height()-(this.container.height()+30))/container.height());
	
	if(scale < 1 && this.cbscale[0].checked) {
		var offset = (-50)*(1-scale);
		var transform = 'translate(20px, 10px) translate(' + offset + '%, ' + offset + '%) scale(' + scale + ', ' + scale + ')';
		container.css('-webkit-transform', transform).css('-moz-transform', transform).css('-ms-transform', transform);
		var zscale = 1/scale;
		var zoffset = (-50)*(1-zscale);
		var ztransform = 'translate(' + zoffset + '%, ' + zoffset + '%) scale(' + zscale + ', ' + zscale + ')';
		if(this.map._zoomControl != null) this.map._zoomControl.css('-webkit-transform', ztransform).css('-moz-transform', ztransform).css('-ms-transform', ztransform);
	} else {
		container.css('-webkit-transform', 'none').css('-moz-transform', 'none').css('-ms-transform', 'none');
		if(this.map._zoomControl != null) this.map._zoomControl.css('-webkit-transform', 'none').css('-moz-transform', 'none').css('-ms-transform', 'none');
	}
	if(rule != null) rule.style.setProperty('margin', margin);
	this.map.checkResize();
	this.map.setCenter(center);
}

org.sarsoft.view.MapSizeForm.prototype._getMarginRule = function() {
	for(var i = 0; i < document.styleSheets.length; i++) {
		var sheet = document.styleSheets[i];
		var rules = sheet.cssRules;
		if(rules == null) rules = sheet.rules;
		for(var j = 0; j < rules.length; j++) {
			if(rules[j].cssText != null && rules[j].cssText.indexOf("@page") >= 0 && rules[j].cssText.indexOf("margin") >= 0) return rules[j];
		}
	}
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
	this.imap.setMapInfo("org.sarsoft.MapDeclinationWidget", 1, "N<span style='font-size: smaller; vertical-align: top'>\u2191</span>. MN " + declination + "\u00B0 " + dir);
}

org.sarsoft.MapDatumWidget = function(imap, switchable) {
	var that = this;
	this.imap = imap;
	imap.register("org.sarsoft.MapDatumWidget", this);

	this.datumControl = jQuery('<div style="z-index: 2000; position: absolute; bottom: 0px; left: 0px; background: white"></div>').appendTo(imap.map.getContainer());
	this.datumDisplay = jQuery('<span class="noprint">' + org.sarsoft.map.datum + '</span>').appendTo(this.datumControl);
	
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
	this._showUTM = false;
	this.style = {major : 0.8, minor : 0.4, crosshatch : 100, latlng : "DD", scale : false}

	this.utmgridlines = new Array();
	this.text = new Array();
	this.utminitialized = false;
	this.imap = imap;
	if(imap != null) {
			this._UTMToggle = new org.sarsoft.ToggleControl("UTM", "Toggle UTM grid", function(value) {
				that.setValue(value);
			});
			this._UTMToggle.setValue(this._showUTM);
			imap.addMenuItem(this._UTMToggle.node, 10);

			this._UTMConfig = new org.sarsoft.view.MenuDropdown('&darr;', 'left: 0; width: 100%', imap.map._overlaydropdownmapcontrol.div);

			var crosshatchContainer = jQuery('<div style="float: left; padding-right: 1em">Show grid as</div>').appendTo(this._UTMConfig.div)
			this.crosshatchSelect = jQuery('<select style="margin-left: 1em"><option value="0">Tickmarks</option><option value="20">Crosshatches</option><option value="100">Lines</option></select>').appendTo(crosshatchContainer);
			this.crosshatchSelect.change(function() {
				that.style.crosshatch = that.crosshatchSelect.val();
				that._drawUTMGrid(true);
			});
			this.crosshatchSelect.val(this.style.crosshatch);

			var llContainer = jQuery('<div style="float: left">Show lat/long as</div>').appendTo(this._UTMConfig.div)
			this.llSelect = jQuery('<select style="margin-left: 1em"><option value="DD">DD</option><option value="DDMMHH">DMH</option><option value="DDMMSS">DMS</option></select>').appendTo(llContainer);
			this.llSelect.change(function() {
				that.style.latlng = that.llSelect.val();
				that._drawUTMGrid(true);
			});
			this.llSelect.val(this.style.latlng);

			var div = jQuery('<div style="width: 100%; clear: both; padding-top: 5px"></div>').appendTo(this._UTMConfig.div);
			var majorContainer = jQuery('<div style="width: 250px; clear: both"><div style="float: left">1km grid</div></div>').appendTo(div);
			var subContainer = jQuery('<div style="float: right"></div>').appendTo(majorContainer);
			this.majorSlider = org.sarsoft.view.CreateSlider(subContainer);
			this.majorSlider.subscribe('slideEnd', function() {
				that.style.major = that.majorSlider.getValue()/100;
				that._drawUTMGrid(true);
			});

			var minorContainer = jQuery('<div style="width: 250px; clear: both"><div style="float: left">100m grid</div></div>').appendTo(div);
			var subContainer = jQuery('<div style="float: right"></div>').appendTo(minorContainer);
			this.minorSlider = org.sarsoft.view.CreateSlider(subContainer);
			this.minorSlider.subscribe('slideEnd', function() {
				that.style.minor = that.minorSlider.getValue()/100;
				that._drawUTMGrid(true);
			});
						
			imap.addMenuItem(this._UTMConfig.container, 10);
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
			that.majorSlider.setValue(that.style.major*100);
			that.minorSlider.setValue(that.style.minor*100);
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
	if(config.UTMGridControl.major != null) {
		this.style.major = config.UTMGridControl.major;
		this.majorSlider.setValue(this.style.major*100);
	}
	if(config.UTMGridControl.minor != null) {
		this.style.minor = config.UTMGridControl.minor;
		this.minorSlider.setValue(this.style.minor*100);
	}
	if(config.UTMGridControl.crosshatch != null) {
		this.style.crosshatch = config.UTMGridControl.crosshatch;
		this.crosshatchSelect.val(this.style.crosshatch);
	}
	if(config.UTMGridControl.latlng != null) {
		this.style.latlng = config.UTMGridControl.latlng;
		this.llSelect.val(this.style.latlng);
	}
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
	if(this.style.crosshatch < 100) spacing = 1000;
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
			if(this.style.crosshatch == 100) {
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
		if(this.style.crosshatch == 100) {
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

org.sarsoft.DNTree = function(container, label) {
	var that = this;
	this.label = label;
	this.container = container;
	
	this.block = jQuery('<div></div>').appendTo(container);
	this.header = jQuery('<div style="cursor: pointer; white-space: nowrap; overflow: hidden; width: 100%">' + label + '</div>').appendTo(this.block);
	this.body = jQuery('<div></div>').appendTo(this.block);
	
	this.header.click(function() {
		if(that.body.css('display')=='none') {
			that.body.css('display', 'block');
		} else {
			that.body.css('display', 'none');
		}
	});
}

org.sarsoft.DataNavigator = function(imap) {
	this.imap = imap;
	imap.register("org.sarsoft.DataNavigator", this);

	this.defaults = new Object();

	var username = (org.sarsoft.username == null) ? "Not Signed In" : org.sarsoft.username;
	this.account = new org.sarsoft.DNTree(imap.container.left, username);
	this.account.header.css({"padding-top": "3px", "font-weight": "bold", color: "white", "background-color": "#666666", "padding-bottom": "3px"});
	this.account.header.prepend(jQuery('<img style="vertical-align: text-bottom; margin-right: 2px" src="' + org.sarsoft.imgPrefix + '/folder.png"/>'));
	this.account.body.css('padding-left', '2px');
	
	if(org.sarsoft.tenantid != null) {
		this.defaults.tenant = new org.sarsoft.DNTree(imap.container.left, org.sarsoft.tenantid)
		this.defaults.tenant.header.prepend('<img style="margin-right: 2px; vertical-align: text-top" src="' + org.sarsoft.imgPrefix + '/favicon.png"/>');
		this.defaults.tenant.header.css({"padding-top": "3px", "font-weight": "bold", color: "white", "background-color": "#666666", "padding-bottom": "3px"});
		this.defaults.tenant.body.css('padding-left', '2px');
		this.defaults.settings = jQuery('<div style="margin-bottom: 3px; margin-top: 3px; font-weight: bold; color: #5a8ed7; cursor: pointer; margin-left: 2px"><img style="vertical-align: text-bottom; margin-right: 2px" src="' + org.sarsoft.imgPrefix + '/config.png"/>Settings</div>').appendTo(this.defaults.tenant.body);
		this.defaults.layers = jQuery('<div style="margin-bottom: 3px; margin-top: 3px; font-weight: bold; color: #5a8ed7; cursor: pointer; margin-left: 2px"><img style="vertical-align: text-bottom; margin-right: 2px" src="' + org.sarsoft.imgPrefix + '/layers.png"/>Map Layers</div>').appendTo(this.defaults.tenant.body);
		this.defaults.io = jQuery('<div style="margin-bottom: 3px; margin-top: 3px; font-weight: bold; color: #5a8ed7; cursor: pointer; margin-right: 2px"><img style="vertical-align: text-bottom; margin-right: 2px" src="' + org.sarsoft.imgPrefix + '/gps.png"/>Data Transfer</div>').appendTo(this.defaults.tenant.body);

		jQuery('<div style="float: right; color: red; cursor: pointer; margin-right: 2px">X</div>').prependTo(this.defaults.tenant.header).click(function() {
			window.location="/map.html";
		});
	} else {
		this.defaults.layers = jQuery('<div style="margin-bottom: 3px; margin-top: 3px; font-weight: bold; color: #5a8ed7; cursor: pointer; margin-left: 2px"><img style="vertical-align: text-bottom; margin-right: 2px" src="' + org.sarsoft.imgPrefix + '/layers.png"/>Map Layers</div>').appendTo(this.account.body);
	}
	
	this.container = jQuery('<div style="padding-left: 2px"></div>').appendTo(imap.container.left);
	this.titleblocks = new Object();

	var bn = jQuery('<div></div>');
	var layerpane = new org.sarsoft.view.MapRightPane(imap, bn);
	var header = jQuery('<div style="float: left; padding-right: 50px"></div>').appendTo(bn);
	jQuery('<div style="font-size: 150%; font-weight: bold">Set Visible Map Layers</div>').appendTo(header);


	var cbcontainer = jQuery('<div style="padding-top: 5px; padding-bottom: 5px"></div>').appendTo(header);
	var swz = jQuery('<input type="checkbox"/>').prependTo(jQuery('<span style="white-space: nowrap; margin-right: 40px">Enable Scroll Wheel Zoom</span>').appendTo(cbcontainer));
	var sb = jQuery('<input type="checkbox"/>').prependTo(jQuery('<span style="white-space: nowrap; margin-right: 40px">Show Scale Bar</span>').appendTo(cbcontainer));
	var overzoomcb = jQuery('<input type="checkbox"/>').prependTo(jQuery('<span style="white-space: nowrap; margin-right: 40px">Enable zooming beyond native map resolutions.</span>').appendTo(cbcontainer));
	var ok1 = jQuery('<button style="float: right; margin-right: 50px; font-size: 150%">Save Changes</button>').appendTo(bn);
	var groupedbaselayers = jQuery('<div style="width: 100%; clear: both"></div>').appendTo(bn);
	var ungroupedbaselayers = jQuery('<div style="width: 100%; clear: both"><div style="width: 100%; font-size: 150%; font-weight: bold">Other Layers</div></div>').appendTo(bn);
	var aolayers = jQuery('<div style="width: 100%; clear: both"><div style="font-size: 150%">Overlays</div></div>').appendTo(bn);
	var checkboxes = new Object();
	var divs = new Object();
	
	var grouping = {};
	if(org.sarsoft.EnhancedGMap.mapTypeGrouping != null) {
		var groups = org.sarsoft.EnhancedGMap.mapTypeGrouping.split(';');
		for(i = 0; i < groups.length; i++) {
			var name = groups[i].split('=')[0];
			var types = groups[i].split('=')[1].split(',');
			for(var j = 0; j < types.length; j++) {
				grouping[types[j]] = name;
			}
		}
	}
	var headers = {}
	
	for(var i = 0; i < org.sarsoft.EnhancedGMap.defaultMapTypes.length; i++) {
		var type = org.sarsoft.EnhancedGMap.defaultMapTypes[i];
		var div = jQuery('<div style="position: relative; float: left; cursor: pointer; width: 320px; margin-bottom: 10px; margin-right: 10px"></div>').appendTo(type.alphaOverlay ? aolayers : ungroupedbaselayers);
		var bg = jQuery('<div style="position: absolute; z-index: -1; background-color: #5a8ed7; opacity: 0.2; width: 100%; height: 100%">&nbsp;</div>').appendTo(div);
		if(grouping[type.alias] != null) {
			var group = grouping[type.alias]
			if(headers[group] == null) {
				headers[group] = jQuery('<div style="clear: both"><div style="width: 100%; font-size: 150%; font-weight: bold; padding-top: 1em">' + group + '</div></div>').appendTo(groupedbaselayers);
			}
			headers[group].append(div);
		}
		var url = type.template;
		if(type.type == "TILE") {
			if(url.indexOf("http") == 0) {
				url = "http://s3-us-west-1.amazonaws.com/caltopo/web/" + type.alias + ".jpg";
			} else {
				url = url.replace(/\{Z\}/, 12).replace(/\{X\}/, 657).replace(/\{Y\}/, 1529).replace(/\{V\}/, 's-11111111');
			}
		} else if(type.type == "WMS") {
			url = "http://s3-us-west-1.amazonaws.com/caltopo/web/" + type.alias + ".jpg";
		} else if(type.type == "NATIVE") {
			url = "http://s3-us-west-1.amazonaws.com/caltopo/web/" + url + ".jpg";
		}
		var img = jQuery('<img style="width: 100px; height: 100px; cursor: pointer; float: left" src="' + url + '"/>').appendTo(div);
		var d2 = jQuery('<div style="float: left; width: 220px"></div>').appendTo(div);
		var cb = jQuery('<input type="checkbox" style="vertical-align: text-top"/>');
		checkboxes[type.name] = cb;
		var devnull = function(c, d) {
			div.click(function() { c[0].checked = !c[0].checked; c.change(); });
			$(c).change(function() {
				d.children().first().css('opacity', c[0].checked ? '0.2' : '0');
			});
		}(cb, div);
		cb.click(function(evt) { evt.stopPropagation(); });
		d2.append(jQuery('<div style="font-size: 120%; font-weight: bold"></div>').append(checkboxes[type.name]).append(type.name));
		d2.append('<div>' + type.description + '</div>');
	}
	var ok2 = jQuery('<button style="font-size: 150%">Save Changes</button>').appendTo(bn);
	var okhandler = function() {
		org.sarsoft.EnhancedGMap.visibleMapTypes = [];
		for(var i = 0; i < org.sarsoft.EnhancedGMap.defaultMapTypes.length; i++) {
			var type = org.sarsoft.EnhancedGMap.defaultMapTypes[i];
			if(checkboxes[type.name][0].checked==true) org.sarsoft.EnhancedGMap.visibleMapTypes.push(type.name);
		}
		imap.map._overlaydropdownmapcontrol.resetMapTypes();
		org.sarsoft.EnhancedGMap._overzoom = overzoomcb[0].checked;
		layerpane.hide();

		var config = new Object();
		config.scrollwheelzoom = swz[0].checked;
		config.scalebar = sb[0].checked;
		YAHOO.util.Cookie.set("org.sarsoft.browsersettings", YAHOO.lang.JSON.stringify(config));
		imap.loadBrowserSettings();
	}
	ok1.click(okhandler);
	ok2.click(okhandler);
	this.defaults.layers.click(function() {
		if(layerpane.visible()) {
			layerpane.hide();
			if(this.layerHandler != null) this.layerHandler();
		} else {
			for(var key in checkboxes) {
				checkboxes[key][0].checked = (org.sarsoft.EnhancedGMap.visibleMapTypes.indexOf(key) >= 0) ? true : false;
				checkboxes[key].change();
			}
			var config = {}
			if(YAHOO.util.Cookie.exists("org.sarsoft.browsersettings")) {
				config = YAHOO.lang.JSON.parse(YAHOO.util.Cookie.get("org.sarsoft.browsersettings"));
			}
			swz[0].checked = config.scrollwheelzoom;
			sb[0].checked = config.scalebar;
			overzoomcb[0].checked = org.sarsoft.EnhancedGMap._overzoom;
			layerpane.show();
		}
	});
	
	var bn = jQuery('<div></div>');
	var setuppane = new org.sarsoft.view.MapRightPane(imap, bn);	
	this.settings_tenant = jQuery('<div style="display: none"></div>').appendTo(bn).append('<div style="font-size: 150%; font-weight: bold; margin-bottom: 1ex">Sharing and Permissions</div>');

	if(this.defaults.settings != null) this.defaults.settings.click(function() {
		if(setuppane.visible()) {
			setuppane.hide();
		} else {
			setuppane.show();
		}
	});
	
	this.defaults.account = new org.sarsoft.DNTree(this.account.body, 'Account');
	var urlcomp = encodeURIComponent(window.location);
	if(org.sarsoft.username != null) {
		this.defaults.account.header.css({"margin-bottom": "3px", "margin-top": "3px", "font-weight": "bold", color: "#5a8ed7", cursor: "pointer"});
		this.defaults.account.body.css({'display': 'none', 'padding-left': '10px'}).append('<div><a style="font-weight: bold" href="/app/logout">logout</a></div>');
		var diffuser = new org.sarsoft.DNTree(this.defaults.account.body, 'Sign In as a Different User');
		diffuser.header.css({"margin-bottom": "3px", "margin-top": "3px", "font-weight": "bold", color: "#5a8ed7", cursor: "pointer"});
		diffuser.body.css('display', 'none');
		diffuser.body.append('<div style="padding-top: 5px"><a style="margin-left: 10px" href="/app/openidrequest?domain=yahoo&dest=' + urlcomp + '"><img style="vertical-align: middle" src="http://l.yimg.com/a/i/reg/openid/buttons/14.png"/></a></div>').append(
				'<div style="padding-top: 5px"><a style="margin-left: 10px" href="/app/openidrequest?domain=google&dest=' + urlcomp + '"><span style="font-weight: bold; color: #1F47B2">Sign in through G<span style="color:#C61800">o</span><span style="color:#BC2900">o</span>g<span style="color:#1BA221">l</span><span style="color:#C61800">e</span></span></a></div>');

		this.defaults.maps = new org.sarsoft.DNTree(this.account.body, 'Your Maps');
		this.defaults.maps.header.css({"margin-bottom": "3px", "margin-top": "3px", "font-weight": "bold", color: "#5a8ed7", cursor: "pointer"});
		if(org.sarsoft.tenantid != null) this.defaults.maps.body.css('display', 'none');

		var tenantDAO = new org.sarsoft.TenantDAO();
		var yourTable = new org.sarsoft.view.TenantTable({owner : false, comments : false, sharing : false, actions : false});
		yourTable.create(this.defaults.maps.body[0]);

		tenantDAO.loadByClassName("org.sarsoft.markup.model.CollaborativeMap", function(rows) {
			yourTable.update(rows);
		});
		
		this.defaults.newmap = new org.sarsoft.DNTree(this.account.body, 'New Map');
		this.defaults.newmap.header.css({"margin-bottom": "3px", "margin-top": "3px", "font-weight": "bold", color: "#5a8ed7", cursor: "pointer"});
		this.defaults.newmap.body.css('display', 'none');
		
		var newform = jQuery('<form action="/map" method="post" id="newmapform">Map will be centered on current location' +
		'<table border="0"><tbody>' +
		'<tr><td valign="top">Name</td><td><input type="text" id="name" name="name"/></td></tr>' +
		'</tbody></table><input type="hidden" name="comments" value=""/></form>').appendTo(this.defaults.newmap.body);
		
		var newlat = jQuery('<input type="hidden" name="lat"/>').appendTo(newform);
		var newlng = jQuery('<input type="hidden" name="lng"/>').appendTo(newform);

		jQuery('<button>Create Map</button>').appendTo(newform).click(function() {
			var center = imap.map.getCenter();
			newlat.val(center.lat());
			newlng.val(center.lng());
			newform.submit();
		});
	} else {
		this.defaults.account.header.css({"margin-bottom": "3px", "margin-top": "3px", "font-weight": "bold", color: "#5a8ed7", cursor: "pointer"});
		this.defaults.account.body.css('display', 'none').append('<div><a style="margin-left: 10px" href="/app/openidrequest?domain=yahoo&dest=' + urlcomp + '"><img style="vertical-align: middle" src="http://l.yimg.com/a/i/reg/openid/buttons/14.png"/></a></div>').append(
				'<div style="padding-top: 5px"><a style="margin-left: 10px" href="/app/openidrequest?domain=google&dest=' + urlcomp + '"><span style="font-weight: bold; color: #1F47B2">Sign in through G<span style="color:#C61800">o</span><span style="color:#BC2900">o</span>g<span style="color:#1BA221">l</span><span style="color:#C61800">e</span></span></a></div>');

		this.defaults.maps = jQuery('<div style="margin-bottom: 3px; margin-top: 3px; font-weight: bold; color: #5a8ed7; cursor: pointer">Shared Maps</div>').appendTo(this.account.body);
		var bn = jQuery('<div></div>');
		var mapspane = new org.sarsoft.view.MapRightPane(imap, bn);
		var header = jQuery('<div style="float: left; padding-right: 50px"></div>').appendTo(bn);
		header.append('<div style="font-size: 150%; font-weight: bold; margin-bottom: 1ex; margin-top: 20px">Shared Maps</div>');
		bn.append('<div>The following maps have been shared by other users.</div>');

		var tenantDAO = new org.sarsoft.TenantDAO();
		var sharedTable = new org.sarsoft.view.TenantTable({owner : true, comments : true, sharing : false, actions : false});
		sharedTable.create(jQuery('<div style="clear: both;" class="growYUITable"></div>').appendTo(bn)[0]);

		tenantDAO.loadShared(function(rows) {
			sharedTable.update(rows);
		});
		this.defaults.maps.click(function() {
			if(mapspane.visible()) {
				mapspane.hide();
			} else {
				mapspane.show();
			}
		});
	}
	
	if(org.sarsoft.tenantid == null) {
		this.defaults.layers.appendTo(this.account.body);
	}

}

org.sarsoft.DataNavigator.prototype.addDataType = function(title) {
	return new org.sarsoft.DNTree(this.defaults.tenant.body, title);
}

org.sarsoft.DataNavigatorToggleControl = function(imap) {
	if(imap != null) {
		this.imap = imap;
		imap.register("org.sarsoft.DataNavigatorToggleControl", this);
	}
	this.offset = 250;
	this.state = false;
	if(YAHOO.util.Cookie.exists("org.sarsoft.browsersettings")) {
		var config = YAHOO.lang.JSON.parse(YAHOO.util.Cookie.get("org.sarsoft.browsersettings"))
		if(config.datanavstate != null) {
			this.state = config.datanavstate;
			this.offset = config.datanavoffset;
		}
	}
}

org.sarsoft.DataNavigatorToggleControl.prototype = new GControl();
org.sarsoft.DataNavigatorToggleControl.prototype.printable = function() { return false; }
org.sarsoft.DataNavigatorToggleControl.prototype.selectable = function() { return false; }
org.sarsoft.DataNavigatorToggleControl.prototype.getDefaultPosition = function() { return new GControlPosition(G_ANCHOR_TOP_LEFT, new GSize(0, $(this.imap.map.getContainer()).height()/2)); }

org.sarsoft.DataNavigatorToggleControl.prototype.initialize = function(map) {
	var that = this;
	this.map = map;
	this._show = true;

	this.minmax = jQuery('<img src="' + org.sarsoft.imgPrefix + '/right.png" title="Show Data Navigator" style="cursor: pointer; z-index: 1001" class="noprint"/>');
	this.dragbar = jQuery('<div style="visibility: hidden; top: 0; left: 0; position: absolute; z-index: 2000; height: 100%; width: 8px; background-color: black; opacity: 0.4; filter: alpha(opacity=40)"></div>').appendTo(this.imap.container.top);

	this.minmax.bind('drag', function(evt) {
		if(that.state) that.dragbar.css({visibility : 'visible', left : Math.max(that.offset + evt.offsetX - 8, 150) + "px"});
	});
	
	this.minmax.bind('dragend', function(evt) {
		if(that.state) {
			that.dragbar.css({visibility: 'hidden', left: '0px'});
			that.offset = Math.max(that.offset + evt.offsetX, 150);
			that.showDataNavigator();
		}
	});
	
	this.minmax.click(function(event) {
		that._show = !that._show;
		if(that._show) {
			that.showDataNavigator();
		} else {
			that.hideDataNavigator();
		}
	});
		
	if(this.imap.container != null) {
		this.imap.container.right.append(this.minmax);
	} else {
		map.getContainer().appendChild(this.minmax[0]);
	}

	return this.minmax[0];

}

org.sarsoft.DataNavigatorToggleControl.prototype.setCookie = function() {
	var config = (YAHOO.util.Cookie.exists("org.sarsoft.browsersettings") ? YAHOO.lang.JSON.parse(YAHOO.util.Cookie.get("org.sarsoft.browsersettings")) : {});
	config.datanavstate = this.state;
	config.datanavoffset = this.offset;
	YAHOO.util.Cookie.set("org.sarsoft.browsersettings", YAHOO.lang.JSON.stringify(config));
}

org.sarsoft.DataNavigatorToggleControl.prototype.showDataNavigator = function() {
	this.minmax[0].src = org.sarsoft.imgPrefix + '/left.png';
	this.minmax[0].title = "Hide Data Navigator";
	var center = this.map.getCenter();
	var width = this.offset + "px"
	this.imap.container.top.css({"padding-left": width});
	this.imap.container.left.css({width: width, display : "block", "margin-left": "-" + width});
	this.imap.container.right.css({float : "left"});
	this.map.checkResize();
	this.map.setCenter(center);
	this.state = true;
	this.setCookie();
}

org.sarsoft.DataNavigatorToggleControl.prototype.hideDataNavigator = function() {
	this.minmax[0].src = org.sarsoft.imgPrefix + '/right.png';
	this.minmax[0].title = "Show Data Navigator";
	var center = this.map.getCenter();
	this.imap.container.top.css({"padding-left": "0"});
	this.imap.container.left.css({width: "0", "margin-left": "0", display: "none", height: "100%"});
	this.imap.container.right.css({float : "none"});
	this.map.checkResize();
	this.map.setCenter(center);
	this.state = false;
	this.setCookie();
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
	this.minmax = jQuery('<img src="' + org.sarsoft.imgPrefix + '/left.png" title="Show Coordinates" style="display: none"/>').appendTo(div);
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
		if(that.imap != null && that.imap.registered["org.sarsoft.UTMGridControl"] != null) {
			if(that.imap.registered["org.sarsoft.UTMGridControl"].style.latlng == "DD") {
				message = message + GeoUtil.formatDD(datumll.lat()) + ", " + GeoUtil.formatDD(datumll.lng());
			} else if(that.imap.registered["org.sarsoft.UTMGridControl"].style.latlng == "DDMMHH") {
				message = message + GeoUtil.formatDDMMHH(datumll.lat()) + ", " + GeoUtil.formatDDMMHH(datumll.lng());
			} else {
				message = message + GeoUtil.formatDDMMSS(datumll.lat()) + ", " + GeoUtil.formatDDMMSS(datumll.lng());
			}
		}
		that.display.html(message);
	});

	map.getContainer().appendChild(div[0]);
	this.div = div;
	
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
	this.label = "backlit";
	this.toggle = new org.sarsoft.ToggleControl("LBL", "Toggle label display", function(value) {
			that.label = value;
			that.handleConfigChange();
		},
		[{value : "normal", style : ""},
		 {value : "backlit", style : "color: white; background-color: red"},
		 {value : "hidden", style : "text-decoration: line-through"}]);
	this.toggle.setValue(this.label);
	this.handleConfigChange();
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
	var img = jQuery('<img style="cursor: pointer; vertical-align: middle" title="Print" src="' + org.sarsoft.imgPrefix + "/print.png"+ '"/>');
	var div = jQuery('<div style="display: none; padding-left: 20px" class="noprint"></div>').prependTo($(imap.map.getContainer()).parent());
	this.pageSizeForm = new org.sarsoft.view.MapSizeForm(imap.map, div);

	img.click(function() {
		if(div.css('display')=='none') {
			div.css('display', 'block');
			that.pageSizeForm.presetInput.val("letter");
			that.pageSizeForm.updateToPreset();
		} else {
			div.css('display', 'none');
			that.pageSizeForm.fullscreen();
		}
	});

	imap.addMenuItem(img[0], 30);
}

org.sarsoft.MapPermissionWidget = function(imap) {
	if(org.sarsoft.userPermissionLevel == "READ" || org.sarsoft.userPermissionLevel == "NONE") {
		var passwordDlg = new org.sarsoft.PasswordDialog();	
		imap.addContextMenuItems([{text : "Enter password for write access", applicable : function(obj) { return obj == null }, handler: function(data) { passwordDlg.show();}}]);
	}
}

org.sarsoft.MapFindWidget = function(imap) {
	var that = this;
	this.imap = imap;
	this.state = false;
	
	imap.register("org.sarsoft.MapFindWidget", this);

	this.find = jQuery('<img src="' + org.sarsoft.imgPrefix + '/find.png" style="cursor: pointer; vertical-align: middle" title="Find a coordinate"/>');
	var container = jQuery('<span style="white-space: nowrap; color: black"></span>').append(this.find);

	this.find.click(function() {
		that.setState(!that.state);
	});

	this.locationEntryForm = new org.sarsoft.ThinLocationForm();
	this.locationEntryForm.create(container, function() {
		that.locationEntryForm.read(function (gll) {that.imap.setCenter(gll, 14);});
	});
	
	var go = jQuery('<button>GO</button>').appendTo(container)
	go.click(function() {
		var entry = that.locationEntryForm.read(function(gll) { that.imap.setCenter(gll, 14);});
		if(!entry) that.checkBlocks();
	});
	
	this.container = container;
	this.setState(false);

	imap.addMenuItem(container[0], 25);
}

org.sarsoft.MapFindWidget.prototype.setState = function(state) {
	this.state = state;
	if(this.state) {
		this.container.children().css('display', 'inline');
		this.locationEntryForm.clear();
		if(typeof GClientGeocoder != 'undefined') {
			this.locationEntryForm.address.focus();
		}
	} else {
		this.container.children().css('display', 'none');
		this.find.css('display', 'inline');
	}
}

org.sarsoft.view.MapSetupWidget = function(imap) {
	var that = this;
	this.imap = imap;

	this._body = document.createElement("div");
	var style = {position : "absolute", "z-index" : "2500", top : "100px", left : "100px", width : "500px"};
	this._dialog = org.sarsoft.view.CreateDialog("Map Setup", this._body, "Update", "Cancel", function() { that.handleSetupChange() }, style);
	
	var setup = jQuery('<img src="' + org.sarsoft.imgPrefix + '/config.png" style="cursor: pointer; vertical-align: middle" title="Map Setup"/>')[0];
	GEvent.addDomListener(setup, "click", function() {
		that.showDlg();
	});
	imap.addMenuItem(setup, 26);

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

org.sarsoft.view.BaseConfigWidget = function(imap, persist, message) {
	var that = this;
	this.hasConfig = false;
	if(imap != null) {
		if(message == null) message = "Save map settings (e.g. visible layers, UTM grid) for future page loads?  Data is automatically saved as you work on it.";
		this.imap = imap;
		if(persist) {
			var img = jQuery('<img src="' + org.sarsoft.imgPrefix + '/save.png" style="cursor: pointer; vertical-align: middle" title="Save Map Settings."/>')
			var dropdown = new org.sarsoft.view.MenuDropdown(img, 'left: 0; width: 100%', imap.map._overlaydropdownmapcontrol.div);
			jQuery('<div style="padding-top: 5px"></div>').append(message).appendTo(dropdown.div);
			var ok = jQuery('<button>Save Map Settings</button>').appendTo(jQuery('<div style="padding-top: 5px"></div>').appendTo(dropdown.div));
			ok.click(function() {
				that.saveConfig();
				dropdown.hide();
			});
			imap.addMenuItem(dropdown.container, 34);
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

org.sarsoft.view.PersistedConfigWidget = function(imap, persist, saveCenter) {
	org.sarsoft.view.BaseConfigWidget.call(this, imap, persist);
	this.tenantDAO = new org.sarsoft.TenantDAO(function() { that.imap.message("Server Communication Error!"); });
	this.saveCenter = saveCenter;
}

org.sarsoft.view.PersistedConfigWidget.prototype = new org.sarsoft.view.BaseConfigWidget();

org.sarsoft.view.PersistedConfigWidget.prototype.saveConfig = function(handler) {
	var that = this;
	this.hasConfig = true;

	var layers = [];
	for(var i = 0; i < org.sarsoft.EnhancedGMap.defaultMapTypes.length; i++) {
		var type = org.sarsoft.EnhancedGMap.defaultMapTypes[i];
		if(org.sarsoft.EnhancedGMap.visibleMapTypes.indexOf(type.name) >= 0) layers.push(type.alias);
	}

	this.tenantDAO.save("layers", { value: YAHOO.lang.JSON.stringify(layers.join(","))}, function() {

		var saveHandler = function() {
			if(that.saveCenter) {
				var center = that.imap.map.getCenter();
				that.tenantDAO.saveCenter({lat: center.lat(), lng: center.lng()}, handler != null ? handler : function() {});
			} else if(handler != null) {
				handler();
			}
		}

		that.tenantDAO.load(function(cfg) {
			var config = {};
			if(cfg.value != null) {
				config = YAHOO.lang.JSON.parse(cfg.value);
			}
			that._toConfigObj(config);
			
			that.tenantDAO.save("mapConfig", { value: YAHOO.lang.JSON.stringify(config)}, saveHandler);				
		}, "mapConfig");
	});

}

org.sarsoft.view.PersistedConfigWidget.prototype.loadConfig = function(overrides) {
	var that = this;
	this.tenantDAO.load(function(cfg) {
		var config = {};
		if(cfg.value != null) {
			config = YAHOO.lang.JSON.parse(cfg.value);
			that.hasConfig = true;
		}
		if(typeof(overrides) != "undefined") for(var key in overrides) {
			config[key] = overrides[key];
		}
		that._fromConfigObj(config);
	}, "mapConfig");
}


org.sarsoft.view.CookieConfigWidget = function(imap, saveCenter) {
	org.sarsoft.view.BaseConfigWidget.call(this, imap, true, "Save map settings for future page loads?");
	this.saveCenter = saveCenter;
}

org.sarsoft.view.CookieConfigWidget.prototype = new org.sarsoft.view.BaseConfigWidget();

org.sarsoft.view.CookieConfigWidget.prototype.saveConfig = function() {
	var config = {};
	if(YAHOO.util.Cookie.exists("org.sarsoft.mapConfig")) config = YAHOO.lang.JSON.parse(YAHOO.util.Cookie.get("org.sarsoft.mapConfig"));
	if(config.base == null) config = {}; // keep mis-set cookies from screwing everything up
	this._toConfigObj(config);
	YAHOO.util.Cookie.set("org.sarsoft.mapConfig", YAHOO.lang.JSON.stringify(config));
	if(this.saveCenter) {
		var center = this.imap.map.getCenter();
		var zoom = this.imap.map.getZoom();
		YAHOO.util.Cookie.set("org.sarsoft.mapCenter", YAHOO.lang.JSON.stringify({center: {lat: center.lat(), lng: center.lng()}, zoom: zoom}));
	}

	var layers = [];
	for(var i = 0; i < org.sarsoft.EnhancedGMap.defaultMapTypes.length; i++) {
		var type = org.sarsoft.EnhancedGMap.defaultMapTypes[i];
		if(org.sarsoft.EnhancedGMap.visibleMapTypes.indexOf(type.name) >= 0) layers.push(type.alias);
	}

	YAHOO.util.Cookie.set("org.sarsoft.mapLayers", layers.join(","));	
}

org.sarsoft.view.CookieConfigWidget.prototype.loadConfig = function(overrides) {
	if(YAHOO.util.Cookie.exists("org.sarsoft.mapConfig")) {
		var config = YAHOO.lang.JSON.parse(YAHOO.util.Cookie.get("org.sarsoft.mapConfig"));
		if(typeof(overrides) != "undefined") for(var key in overrides) {
			config[key] = overrides[key];
		}
		this._fromConfigObj(config);
	}
	if(YAHOO.util.Cookie.exists("org.sarsoft.mapCenter")) {
		var config = YAHOO.lang.JSON.parse(YAHOO.util.Cookie.get("org.sarsoft.mapCenter"));
		if(typeof(overrides) != "undefined") for(var key in overrides) {
			config[key] = overrides[key];
		}
		this.imap.map.setCenter(new GLatLng(config.center.lat, config.center.lng), config.zoom);
	}
	if(YAHOO.util.Cookie.exists("org.sarsoft.mapLayers")) {
		var layers = YAHOO.util.Cookie.get("org.sarsoft.mapLayers").split(",");
		org.sarsoft.EnhancedGMap.visibleMapTypes = [];
		for(var i = 0; i < org.sarsoft.EnhancedGMap.defaultMapTypes.length; i++) {
			for(var j = 0; j < layers.length; j++) {
				var type = org.sarsoft.EnhancedGMap.defaultMapTypes[i];
				if(layers[j] == type.alias) org.sarsoft.EnhancedGMap.visibleMapTypes.push(type.name);
			}
		}
		imap.map._overlaydropdownmapcontrol.resetMapTypes();
	}
}

org.sarsoft.view.MenuDropdown = function(html, css, parent, onShow) {
	var that = this;
	this.onShow = onShow;
	var container = jQuery('<span style="position: relative"></span>');
	var trigger = jQuery('<span style="cursor: pointer"></span>').append(html).appendTo(container);
	
	this.isArrow = (html == "&darr;");

	var div = jQuery('<div style="color: black; font-weight: normal; visibility: hidden; background: white; position: absolute; right: 0; ' + ($.browser.msie ? 'top: 0em; padding-top: 1.6em ' : 'top: 0em; padding-top: 1.5em; z-index: -1; ') + css + '"></div>');
	div.appendTo(parent != null ? parent : container);
	trigger.click(function() {
		if(div.css("visibility")=="hidden") {
			that.show();
		} else {
			that.hide();
		}
	});
		
	this.content = jQuery('<div style="padding-top: 2px"></div>').appendTo(div);
	var upArrow = jQuery('<span style="color: red; font-weight: bold; cursor: pointer; float: right; margin-right: 5px; font-size: larger">&uarr;</span>').appendTo(this.content);
	upArrow.click(function() {that.hide()});

	this.trigger = trigger;
	this.container = container[0];
	this.div = div;	
}

org.sarsoft.view.MenuDropdown.prototype.show = function() {
	// TODO: need to be able to send a callback to the menu div in order to reset
	// its z-index to 1001
	this.div.css("visibility", "visible");
	if(this.isArrow) this.trigger.html('&uarr;');
	if(this.onShow != null) this.onShow();
}

org.sarsoft.view.MenuDropdown.prototype.hide = function() {
	this.div.css("visibility", "hidden");
	if(this.isArrow) this.trigger.html('&darr;');
}

org.sarsoft.view.MapEntityDialog = function(imap, title, entityform, handler, okButton) {
	if(okButton == null) okButton = "Create";
	var that = this;
	this.handler = handler;
	this.entityform = entityform;
	this.body = document.createElement("div");
	entityform.create(this.body);
	this.dialog = new org.sarsoft.view.MapDialog(imap, title, this.body, okButton, "Cancel", function() {
		var obj = that.entityform.read();
		that.entityform.write(new Object());
		handler(obj);
	});
}

org.sarsoft.view.MapEntityDialog.prototype.show = function(obj) {
	if(obj != null) this.entityform.write(obj);
	this.dialog.show();
}


org.sarsoft.view.MapDialog = function(imap, title, bodynode, yes, no, handler, style) {
	var that = this;
	this.imap = imap;
	var dlgStyle = {width: "300px", position: "absolute", top: "0px", left: "0px", "z-index": "2500"};
	if(style != null) for(var key in style) {
		dlgStyle[key] = style[key];
	}
	
	if(typeof(bodynode)=="string") bodynode = jQuery('<div>' + bodynode + '</div>')[0];
	
	var dlg = jQuery('<div></div>');
	dlg.css(dlgStyle);
	this.hd = jQuery('<div class="hd">' + title + '</div>').appendTo(dlg);
	this.bd = jQuery('<div class="bd"></div>').appendTo(dlg);
	this.bd.append(bodynode);
	this.ft = jQuery('<div class="ft"></div>').appendTo(dlg);

	var ok = function() {
		that.dialog.hide();
		handler();
	}

	var buttons = [ { text : yes, handler: ok, isDefault: true}, {text : no, handler : function() { that.dialog.hide(); }}];
	this.dialog = new YAHOO.widget.Dialog(dlg[0], {buttons: buttons});
	this.dialog.render(document.body);
	this.dialog.hide();
	this.dialog.ok = ok;
	this.dlg = dlg;
	
	this.dialog.hideEvent.subscribe(function() {
		that.imap.map.getContainer().style.height = that._originalContainerHeight;
		that.imap.map.checkResize();
		that.imap.registered["org.sarsoft.view.MapDialog"] = null;
	});
}

org.sarsoft.view.MapDialog.prototype.show = function() {
	if(this.imap.registered["org.sarsoft.view.MapDialog"] != null) this.imap.registered["org.sarsoft.view.MapDialog"].dialog.hide();
	this.imap.register("org.sarsoft.view.MapDialog", this);
	this._originalContainerHeight = this.imap.map.getContainer().style.height;
	var container = $(this.imap.map.getContainer());
	this.dlg.css({left: '0px', top: '0px', 'width': (container.width()-2) + "px"});
	var dlgHeight = this.hd.outerHeight()+this.bd.outerHeight()+this.ft.outerHeight()+2;
	this.dlg.css({left: (container.offset().left+1) + "px", top: (container.height()-dlgHeight) + "px"});
	this.dialog.show();
	if(this.imap.container != null) {
		container.css('height', container.height() - dlgHeight);
		this.imap.map.checkResize();
	}
}

org.sarsoft.view.MapRightPane = function(imap, bodynode) {
	var that = this;
	this.imap = imap;
	var pane = jQuery('<div style="width: 100%; height: 100%; background-color: white; z-index: 2000; display: none; position: absolute; top: 0px; left: 0px; overflow-y: if-needed"></div>').appendTo(imap.container.right);
	var close = jQuery('<div style="cursor: pointer; float: right; font-size: 200%; font-weight: bold; color: red; padding-right: 5px">X</div>').appendTo(pane);
	jQuery('<div style="height: 100%; margin-left: 10px; padding-left: 10px; border-left: 1px dashed black"></div>').appendTo(pane).append(bodynode);
	this.pane = pane;
	close.click(function() {
		pane.css('display', 'none');
	});
}

org.sarsoft.view.MapRightPane.prototype.visible = function() {
	return this.pane.css('display') == 'block';
}

org.sarsoft.view.MapRightPane.prototype.show = function() {
	this.pane.css('display', 'block');
}

org.sarsoft.view.MapRightPane.prototype.hide = function() {
	this.pane.css('display', 'none');
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
	this._menuItemsOverride = null;
	this.registered = new Object();
	this._mapInfoMessages = new Object();
	
	if(typeof map == undefined) return;
	GEvent.addListener(map, "singlerightclick", function(point, src, overlay) {
		var obj = null;
		if(overlay != null && that.markers[overlay.id] != null) {
			obj = that.markers[overlay.id].waypoint;
		} else if(that._selected != null) {
			obj = that._selected;
		} else if(overlay != null && that.polys[overlay.id] != null) {
			obj = that.polys[overlay.id].way;
		}
		if(that._menuItems.length > 0  && that._menuItemsOverride == null) {
			that._contextMenu.setItems(that._menuItems)
			var offset = $(that.map.getContainer()).offset();
			that._contextMenu.show(point, obj, new GPoint(point.x + offset.left, point.y + offset.top));
		}
		if(typeof that._handlers["singlerightclick"] != "undefined") {
			for(var i = 0; i < that._handlers["singlerightclick"].length; i++) {
				that._handlers["singlerightclick"][i](point, obj);
				}
		}
	});

	this.loadBrowserSettings();
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
	if(options.standardControls || options.UTM) {
		 this.map.addControl(new org.sarsoft.UTMGridControl(this));
	} else {
		this.map.addControl(new org.sarsoft.UTMGridControl());
	}
	if(options.standardControls || options.size) var sc = new org.sarsoft.MapSizeWidget(this);
	if(options.standardControls || options.find) var fc = new org.sarsoft.MapFindWidget(this);
	if(options.standardControls || options.label) var lc = new org.sarsoft.MapLabelWidget(this);
	if(options.standardControls || options.separators) {
		this.addMenuItem(jQuery('<span>&nbsp;<span style="border-left: 1px dashed #CCCCCC">&nbsp;</span></span>')[0], 20);
		this.addMenuItem(jQuery('<span>&nbsp;<span style="border-left: 1px dashed #CCCCCC">&nbsp;</span></span>')[0], 100);
	}
	
	$(map.getContainer()).addClass("printnotransform");

	if(options.container != null) {
		this.container = new Object();
		this.container.top = $(options.container);
		this.container.left = $(this.container.top.children()[0]);
		this.container.right = $(this.container.top.children()[1]);
		this.container.canvas = $(this.container.right[0]);

		this.container.top.addClass("printnooffset");
		this.container.top.css({height : "100%"});
		this.container.left.css({position : "relative", float : "left", height: "100%", display : "none", "overflow-y" : "auto"});
		this.container.right.css({position : "relative", width : "100%", height: "100%"});
		
		map._overlaydropdownmapcontrol.div.prependTo(this.container.right);
		if(this.positionInfoControl != null) {
			this.positionInfoControl.div.prependTo(this.container.right).css('z-index', '1001');
		}
		
		var dn = new org.sarsoft.DataNavigator(this);
		var dnc = new org.sarsoft.DataNavigatorToggleControl(this);
		this.map.addControl(dnc);
		dnc.showDataNavigator();
	}

}

org.sarsoft.InteractiveMap.prototype.loadBrowserSettings = function() {
	if(YAHOO.util.Cookie.exists("org.sarsoft.browsersettings")) {
		var config = YAHOO.lang.JSON.parse(YAHOO.util.Cookie.get("org.sarsoft.browsersettings"));
		if(config.scrollwheelzoom) {
			this.map.enableScrollWheelZoom();
		} else {
			this.map.disableScrollWheelZoom();
		}
		if(this._scaleControl != null) {
			this.map.removeControl(this._scaleControl);
			this._scaleControl = null;
		}
		if(config.scalebar) {
			this._scaleControl = new org.sarsoft.EScaleControl(true);
			this.map.addControl(this._scaleControl);
		}
	}
}

org.sarsoft.InteractiveMap.prototype.updateDatum = function() {
	for(var key in this.markers) {
		var m = this.markers[key];
		this.addWaypoint(m.waypoint, m.config, m.tooltip, m.label);
	}
	if(this.registered["org.sarsoft.UTMGridControl"] != null) this.registered["org.sarsoft.UTMGridControl"]._drawUTMGrid(true);
}


org.sarsoft.InteractiveMap.prototype.nameToAlias = function(name) {
	for(var i = 0; i < org.sarsoft.EnhancedGMap.defaultMapTypes.length; i++) {
		if(name == org.sarsoft.EnhancedGMap.defaultMapTypes[i].name) return org.sarsoft.EnhancedGMap.defaultMapTypes[i].alias;
	}
	return name;
}

org.sarsoft.InteractiveMap.prototype.aliasToName = function(alias) {
	if(alias == null) return null;
	for(var i = 0; i < org.sarsoft.EnhancedGMap.defaultMapTypes.length; i++) {
		if(alias == org.sarsoft.EnhancedGMap.defaultMapTypes[i].alias) return org.sarsoft.EnhancedGMap.defaultMapTypes[i].name;
	}
	for(var i = 0; i < org.sarsoft.EnhancedGMap.defaultMapTypes.length; i++) {
		if(alias.replace(/ \(.*\)/, "") == org.sarsoft.EnhancedGMap.defaultMapTypes[i].name.replace(/ \(.*\)/, "")) return org.sarsoft.EnhancedGMap.defaultMapTypes[i].name;
	}
	return alias;
}

org.sarsoft.InteractiveMap.prototype.getConfig = function(config) {
	if(config == null) config = new Object();
	config.base = this.nameToAlias(this.map._overlaydropdownmapcontrol.baseName);
	if(this.map._overlaydropdownmapcontrol != null) {
		config.overlay = this.nameToAlias(this.map._overlaydropdownmapcontrol.overlayName);
		config.opacity = this.map._overlaydropdownmapcontrol.opacity;
		if(this.map._overlaydropdownmapcontrol.alphaOverlays != null) {
			var ao = this.map._overlaydropdownmapcontrol.alphaOverlays.split(',');
			for(var i = 0; i < ao.length; i++) {
				ao[i] = this.nameToAlias(ao[i]);
				var atypes = this.map._overlaydropdownmapcontrol.alphaOverlayTypes;
				for(var j = 0; j < atypes.length; j++) {
					if(atypes[j].getName != null && this.nameToAlias(atypes[j].getName()) == ao[i]) {
						if(atypes[j]._cfgvalue != null) ao[i] = ao[i] + "_" + atypes[j]._cfgvalue; 
					}
				}
			}
			config.alphaOverlays = ao.join(",");
		} else {
			config.alphaOverlays = null;
		}
	}
	config.overzoom = org.sarsoft.EnhancedGMap._overzoom;
	return config;
}

org.sarsoft.InteractiveMap.prototype.setConfig = function(config) {
	if(config == null) return;
	var alphaOverlays = null;
	if(config.alphaOverlays != null && config.alphaOverlays.length > 0) {
		var ao = config.alphaOverlays.split(',');
		for(var i = 0; i < ao.length; i++) ao[i] = this.aliasToName(ao[i]);
		alphaOverlays = ao.join(",");
	}
	this.setMapLayers(this.aliasToName(config.base), this.aliasToName(config.overlay), config.opacity, alphaOverlays);
	org.sarsoft.EnhancedGMap._overzoom = config.overzoom;
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
		var atypes = this.map._overlaydropdownmapcontrol.alphaOverlayTypes;
		var names = alphaOverlays.split(",");
		for (var j = 0; j < names.length; j++) {
			var name = names[j];
			if(name.indexOf("_") >= 0) {
				var parts = names[j].split("_");
				for(var i = 0; i < atypes.length; i++) {
					if(atypes[i].getName != null && this.nameToAlias(atypes[i].getName()).indexOf(parts[0]) == 0) {
						this.map._overlaydropdownmapcontrol.swapConfigurableAlphaLayer(i, parts[1]);
						alphaTypes.push(atypes[i]);
					}
				}
			} else {
				for (var i = 0; i < atypes.length; i++) {
					if(atypes[i].getName != null && names[j] == atypes[i].getName()) alphaTypes.push(atypes[i]);
				}
			}
		}
	}
	if(base == null) {
		for(i = 0; i < org.sarsoft.EnhancedGMap.defaultMapTypes.length; i++) {
			if(org.sarsoft.EnhancedGMap.defaultMapTypes[i].name == baseName) {
				var type = org.sarsoft.EnhancedGMap.createMapType(org.sarsoft.EnhancedGMap.defaultMapTypes[i]);
				this.map.addMapType(type);
				this.map._overlaydropdownmapcontrol.addBaseType(type);
				base = type;
			}
		}
		for(var i = 0; i < types.length; i++) {
			if(types[i].getName != null && types[i].getName() == overlayName) overlay = types[i];
			if(types[i].name == overlayName) overlay = types[i];
		}
	}
	if(overlay == null) {
		for(i = 0; i < org.sarsoft.EnhancedGMap.defaultMapTypes.length; i++) {
			if(org.sarsoft.EnhancedGMap.defaultMapTypes[i].name == overlayName) {
				var type = org.sarsoft.EnhancedGMap.createMapType(org.sarsoft.EnhancedGMap.defaultMapTypes[i]);
				this.map.addMapType(type);
				this.map._overlaydropdownmapcontrol.addBaseType(type);
				overlay = type;
			}
		}
	}
	if(overlay == null) overlay = base;
	if(base != null) this.map._overlaydropdownmapcontrol.updateMap(base, overlay, opacity, (alphaTypes.length > 0) ? alphaTypes : null);
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
	this.unselect(way);
	var overlay = this.polys[way.id].overlay;
	GEvent.clearListeners(overlay, "mouseover");
	GEvent.clearListeners(overlay, "mouseout");
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
		if(config.clickable) that.select(way);
		if(way.displayMessage == null) {
			that._infomessage(way.name);
		} else {
			that._infomessage(way.displayMessage);
		}
	});
	GEvent.addListener(poly, "mouseout", function() {
		if(config.clickable) that.unselect(way);
	});
	return poly;
}

org.sarsoft.InteractiveMap.prototype.select = function(obj) {
	if(this._selected != null && this._selected.lat != null) {
		// if users mouseovers a way while still over a marker, cache it
		this._cachedWaySelection = obj;
		return;
	}
	var oldSelection = this._selected;
	if(this._selected != null) this.unselect(this._selected);
	if(obj.lat != null) {
		// can't select icons, but cache way for mouseout
		this._selected = obj;
		this._cachedWaySelection = oldSelection;
	} else {
		var overlay = this.polys[obj.id].overlay;
		var config = this.polys[obj.id].config;
		this._selected = obj;
		this._cachedWaySelection = null;
		overlay.setStrokeStyle({weight: (config.weight != null) ? config.weight + 1 : 4});
	}
}

org.sarsoft.InteractiveMap.prototype.unselect = function(obj) {
	if(obj.lat != null && obj == this._selected) {
		// if unselecting a marker, check if we were also over a way
		this._selected = null;
		if(this._cachedWaySelection != null) this.select(this._cachedWaySelection);
	} else if(this.polys[obj.id] != null) {
		var overlay = this.polys[obj.id].overlay;
		var config = this.polys[obj.id].config;
		if(this._selected != null && (obj == this._selected || obj.id == this._selected.id)) this._selected = null;
		if(this._cachedWaySelection != null && (obj == this._cachedWaySelection || obj.id == this._cachedWaySelection.id)) this._cachedWaySelection = null;
		overlay.setStrokeStyle({weight: (config.weight != null) ? config.weight : 3});
	}
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
	this.unselect(waypoint);
	var marker = this.markers[waypoint.id].marker;
	GEvent.clearListeners(marker, "mouseover");
	GEvent.clearListeners(marker, "mouseout");
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
	var marker = new GMarker(gll, { title : tt, icon : icon, draggable : (config.drag != null)});
	this.map.addOverlay(marker);
	if(config.drag != null) {
		marker.enableDragging();
		GEvent.addListener(marker, "dragend", function() { config.drag(marker.getLatLng())});
	}
	GEvent.addListener(marker, "mouseover", function() {
		if(waypoint.displayMessage == null) {
			that._infomessage(label);
		} else {
			that._infomessage(waypoint.displayMessage);
		}
	});
	marker.id = waypoint.id;
	if(label != null && config.drag == null) {
		labelOverlay = new ELabel(gll, "<span class='maplabel'>" + label + "</span>", "width: 8em", new GSize(icon.iconSize.width*0.5, icon.iconSize.height*-0.5));
		this.map.addOverlay(labelOverlay);
		marker.label = labelOverlay;
	}
	if(config.clickable)  {
		GEvent.addListener(marker, "mouseover", function() {
			that.select(waypoint);
		});
		GEvent.addListener(marker, "mouseout", function() {
			that.unselect(waypoint);
		});
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

org.sarsoft.InteractiveMap.prototype.drag = function(waypoint, callback) {
	var that = this;
	var objs = this.markers[waypoint.id];
	this._removeMarker(waypoint);
	objs.config.drag = function(gll) {
		GEvent.clearListeners(objs.marker, "drag");
		that._removeMarker(waypoint);
		waypoint.lat=gll.lat();
		waypoint.lng=gll.lng();
		objs.config.drag = null;
		that._addMarker(waypoint, objs.config, objs.tooltip, objs.label);
		callback(gll);
	}
	this._addMarker(waypoint, objs.config, objs.tooltip, objs.label);
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

org.sarsoft.InteractiveMap.prototype.lockContextMenu = function(items) {
	if(items == null) items = true;
	this._menuItemsOverride = items;
}

org.sarsoft.InteractiveMap.prototype.unlockContextMenu = function() {
	this._menuItemsOverride = null;
}

org.sarsoft.InteractiveMap.prototype.redraw = function(id, onEnd, onCancel) {
	var that = this;
	var label = this.polys[id].overlay.label;
	this._removeOverlay(this.polys[id].overlay);	
	this.polys[id].overlay = this._addOverlay({id : id, polygon: this.polys[id].way.polygon}, this.polys[id].config);
	this.polys[id].overlay.label = label;
	this.polys[id].overlay.enableDrawing();
	if(onEnd == null) onEnd = function() { that.edit(id); }
	if(onCancel == null) onCancel = function() { that.discard(id); }
	this.lockContextMenu();
	
	this.fn = function(e) {
		if(e.which == 27) {
			$(document).unbind("keydown", that.fn);
			var overlay = that.polys[id].overlay;
			overlay.disableEditing();
			if((that.polys[id].way.polygon && overlay.getVertexCount() < 3) || overlay.getVertexCount() < 2) {
				GEvent.trigger(overlay, "cancelline");
			} else {
				if(that.polys[id].way.polygon) overlay.insertVertex(overlay.getVertexCount(), overlay.getVertex(0));
				GEvent.trigger(overlay, "endline");
			}
		}
	}
	$(document).bind("keydown", this.fn);

	GEvent.addListener(this.polys[id].overlay, "endline", function() {
		$(document).unbind("keydown", that.fn);
		that.unlockContextMenu();
		window.setTimeout(onEnd, 200);
	});
	GEvent.addListener(this.polys[id].overlay, "cancelline", function() {
		$(document).unbind("keydown", that.fn);
		that.unlockContextMenu();
		window.setTimeout(onCancel, 200);
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
	this.map.setCenter(center, Math.min(this.map.getCurrentMapType().getMaximumResolution(), zoom));
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

org.sarsoft.MapURLHashWidget = function(imap, readonce) {
	var that = this;
	this.imap = imap;
	this.ignorehash = false;
	this.lasthash = "";
	this.track = true;
	
	if(!readonce) {
		imap.register("org.sarsoft.MapURLHashWidget", this);
	
		this.toggle = new org.sarsoft.ToggleControl("URL", "Toggle URL updates as map changes", function(value) {
			that.track = value;
			if(!that.track) {
				window.location.hash="";
			} else {
				that.saveMap();
			}
		});
		this.toggle.setValue(this.track);
		imap.addMenuItem(this.toggle.node, 18);
			
		GEvent.addListener(imap.map, "moveend", function() {
			if(!that.ignorehash && that.track) that.saveMap();
			});
		GEvent.addListener(imap.map, "zoomend", function() {
			if(!that.ignorehash && that.track) that.saveMap();
		});
	}
	this.checkhashupdate();
	if(!readonce) {
		window.setInterval(function() {that.checkhashupdate()}, 500);
	}
}

org.sarsoft.MapURLHashWidget.prototype.saveMap = function() {
	var center = this.imap.map.getCenter();
	var hash = "ll=" + Math.round(center.lat()*100000)/100000 + "," + Math.round(center.lng()*100000)/100000 + "&z=" + map.getZoom();
	var config = this.imap.getConfig();
	hash = hash + "&b=" + encodeURIComponent(config.base);
	if(config.opacity != null  && config.opacity > 0) {
		hash = hash + "&n=" + config.opacity;
		if(config.overlay != null) hash = hash + "&o=" + encodeURIComponent(config.overlay);
	}
	if(config.alphaOverlays != null) hash = hash + "&a=" + encodeURIComponent(config.alphaOverlays);
	this.ignorehash=true;
	window.location.hash=hash;
	this.lasthash=window.location.hash
	this.ignorehash=false;
}

org.sarsoft.MapURLHashWidget.prototype.loadMap = function() {
	this.ignorehash=true;
	this.lasthash = window.location.hash;
	var hash = this.lasthash.slice(1);
	var props = hash.split("&");
	var config = new Object();
	for(var i = 0; i < props.length; i++) {
		var prop = props[i].split("=");
		if(prop[0] == "center" || prop[0] == "ll") {
			var latlng = prop[1].split(",");
			map.setCenter(new GLatLng(latlng[0], latlng[1]));
		}
		if(prop[0] == "zoom" || prop[0] == "z") this.imap.map.setZoom(1*prop[1]);
		if(prop[0] == "base" || prop[0] == "b") config.base = decodeURIComponent(prop[1]);
		if(prop[0] == "overlay" || prop[0] == "o") config.overlay = decodeURIComponent(prop[1]);
		if(prop[0] == "opacity" || prop[0] == "n") config.opacity = prop[1];
		if(prop[0] == "alphaOverlays" || prop[0] == "a") config.alphaOverlays = decodeURIComponent(prop[1]);
	}
	if(config.overlay == null) config.overlay = config.base;
	if(config.opacity == null) config.opacity = 0;
	if(config.base != null) this.imap.setConfig(config);
	this.config = config;
	this.ignorehash=false;
}

org.sarsoft.MapURLHashWidget.prototype.checkhashupdate = function() {
	if(this.lasthash != window.location.hash) {
		this.loadMap();
	}
}

org.sarsoft.MapURLHashWidget.prototype.setConfig = function(config) {
	if(config.MapURLHashWidget == null) return;
	this.track = config.MapURLHashWidget.track;
	this.toggle.setValue(this.track);
}

org.sarsoft.MapURLHashWidget.prototype.getConfig = function(config) {
	if(config.MapURLHashWidget == null) config.MapURLHashWidget = new Object();
	config.MapURLHashWidget.track = this.track;
	return config;
}

org.sarsoft.MapCollaborationWidget = function(imap) {
	var that = this;
	this.imap = imap;
	this.collaborate = false;
	
	this.dlg = new org.sarsoft.view.AlertDialog("Sync Enabled", "This page will automatically sync with changes made by other users for the next hour.");
	
	if(org.sarsoft.map.autoRefresh) {
		this.timer = setInterval(function() {imap.timer();}, org.sarsoft.map.refreshInterval);
	} else {
		this.toggle = new org.sarsoft.ToggleControl("SYNC", "Sync to changes made by others.", function(value) {
			that.collaborate = value;
			if(that.timer != null) {
				clearInterval(that.timer);
				that.timer = null;
			}
			if(that.killswitch != null) {
				clearTimeout(that.killswitch);
				that.killswitch = null;
			}
			if(that.collaborate) {
				that.dlg.show();
				that.timer = setInterval(function() {that.imap.timer();}, 10000);
				that.killswitch = setTimeout(function() { that.toggle.setValue(false); clearInterval(that.timer); that.timer = null; that.killswitch = null}, 3600000)
			}
		});
		this.toggle.setValue(this.collaborate);
		this.imap.addMenuItem(this.toggle.node, 19);
	}
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
	this.min = jQuery('<img style="cursor: pointer; width: 12px; height: 12px" src="' + org.sarsoft.imgPrefix + '/right.png"/>').appendTo(this.ctrl);
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
		this.min.attr("src", org.sarsoft.imgPrefix + "/right.png");
		this.minimized = false;
	} else {
		this.ctrl.css("padding-right", "1em");
		this.msg.css("display", "none");
		this.min.attr("src", org.sarsoft.imgPrefix + "/left.png");
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

org.sarsoft.LocationEntryForm.prototype.create = function(container, handler, noLookup) {
	var that = this;
	var table = jQuery('<table border="0"></table>').appendTo(container);
	var tbody = jQuery('<tbody></tbody>').appendTo(table);
	
	var tr = jQuery('<tr><td valign="top">UTM</td></tr>').appendTo(tbody);
	this.utmcontainer = document.createElement("td");
	tr.append(this.utmcontainer);
	this.utmform = new org.sarsoft.UTMEditForm();
	this.utmform.create(this.utmcontainer);
	
	tr = jQuery('<tr></tr>').appendTo(tbody);
	var td = jQuery('<td valign="top"></td>').appendTo(tr);
	this.select = jQuery('<select><option value="DD" selected="selected">Degrees</option><option value="DDMMHH">DMH</option><option value="DDMMSS">DMS</option></select').appendTo(td);
	
	td = jQuery("<td/>").appendTo(tr);
	var dd = jQuery('<div></div>').appendTo(td);
	this.lat = jQuery('<input type="text" size="8"/>').appendTo(dd);
	dd.append(", ");
	this.lng = jQuery('<input type="text" size="8"/>').appendTo(dd);
	if(typeof(navigator.geolocation) != "undefined") {
		this.geoloc = jQuery('<button style="margin-left: 10px">My Location</button>').appendTo(dd);
		this.geoloc.click(function() {
			navigator.geolocation.getCurrentPosition(function(pos) {
				that.lat.val(pos.coords.latitude);
				that.lng.val(pos.coords.longitude);
		}, function() { alert("Unable to determine your location.")});
		});
	}
	dd.append('<br/><span class="hint">WGS84 decimal degrees, e.g. 39.3422, -120.2036</span>');
	
	var ddmmhh = jQuery('<div style="display: none"></div>').appendTo(td);
	this.DDMMHH = new Object();
	this.DDMMHH.latDD = jQuery('<input type="text" size="4"/>').appendTo(ddmmhh);
	ddmmhh.append("\u00B0");
	this.DDMMHH.latMM = jQuery('<input type="text" size="5"/>').appendTo(ddmmhh);
	ddmmhh.append("', ");
	this.DDMMHH.lngDD = jQuery('<input type="text" size="4"/>').appendTo(ddmmhh);
	ddmmhh.append("\u00B0");
	this.DDMMHH.lngMM = jQuery('<input type="text" size="5"/>').appendTo(ddmmhh);
	ddmmhh.append('\'<br/><span class="hint">WGS84 degree minutes, e.g. 39\u00B020.66\', -120\u00B012.32\'</span>');

	var ddmmss = jQuery('<div style="display: none"></div>').appendTo(td);
	this.DDMMSS = new Object();
	this.DDMMSS.latDD = jQuery('<input type="text" size="4"/>').appendTo(ddmmss);
	ddmmss.append("\u00B0");
	this.DDMMSS.latMM = jQuery('<input type="text" size="2"/>').appendTo(ddmmss);
	ddmmss.append("'");
	this.DDMMSS.latSS = jQuery('<input type="text" size="2"/>').appendTo(ddmmss);
	ddmmss.append("'', ");
	this.DDMMSS.lngDD = jQuery('<input type="text" size="4"/>').appendTo(ddmmss);
	ddmmss.append("\u00B0");
	this.DDMMSS.lngMM = jQuery('<input type="text" size="2"/>').appendTo(ddmmss);
	ddmmss.append("'");
	this.DDMMSS.lngSS = jQuery('<input type="text" size="2"/>').appendTo(ddmmss);
	ddmmss.append('\'\'<br/><span class="hint">WGS84 degree minute seconds, e.g. 39\u00B020\'39\'\', -120\u00B012\'19\'\'</span>');

	this.select.change(function() {
		var type = that.select.val();
		if(type == "DD") {
			dd.css("display", "block");
			ddmmhh.css("display", "none");
			ddmmss.css("display", "none");
		} else if(type == "DDMMHH"){
			dd.css("display", "none");
			ddmmhh.css("display", "block");
			ddmmss.css("display", "none");
		} else {
			dd.css("display", "none");
			ddmmhh.css("display", "none");
			ddmmss.css("display", "block");
		}
	});
	
	tr = jQuery('<tr><td valign="top">Name</td></tr>').appendTo(tbody);
	td = jQuery("<td/>").appendTo(tr);
	this.address = jQuery('<input type="text" size="16"/>').appendTo(td);
	td.append('<span class="hint">e.g. "Mount Rainier" or "Castle Peak near Truckee, CA".</span>');
	if(typeof GClientGeocoder == 'undefined' || noLookup) {
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
	var type = this.select.val();
	if(utm != null) {
		callback(GeoUtil.UTMToGLatLng(utm));
	} else if(addr != null && addr.length > 0 && typeof GClientGeocoder != 'undefined') {
		var gcg = new GClientGeocoder();
		gcg.getLatLng(addr, callback);
	} else if(type == "DD"){
		var lat = this.lat.val();
		var lng = this.lng.val();
		if(lat != null && lat.length > 0 && lng != null && lng.length > 0) {
			callback(new GLatLng(1*lat, 1*lng));
		} else {
			return false;
		}
	} else if(type == "DDMMHH") {
		var latdd = this.DDMMHH.latDD.val();
		var lngdd = this.DDMMHH.lngDD.val();
		if(latdd == null || latdd.length == 0 || lngdd == null || lngdd.length == 0) return false; 

		var latneg = (1*latdd < 0) ? true : false;
		var lngneg = (1*lngdd < 0) ? true : false;		
		var lat = Math.abs(latdd) + (this.DDMMHH.latMM.val()/60);
		var lng = Math.abs(lngdd) + (this.DDMMHH.lngMM.val()/60);
		if(isNaN(lat) || isNaN(lng)) return false;
		if(latneg) lat = -1*lat;
		if(lngneg) lng = -1*lng;
		callback(new GLatLng(lat, lng));
	} else {
		var latdd = this.DDMMSS.latDD.val();
		var lngdd = this.DDMMSS.lngDD.val();
		if(latdd == null || latdd.length == 0 || lngdd == null || lngdd.length == 0) return false; 

		var latneg = (1*latdd < 0) ? true : false;
		var lngneg = (1*lngdd < 0) ? true : false;

		var lat = Math.abs(latdd) + (this.DDMMSS.latMM.val()/60) + (this.DDMMSS.latSS.val()/3600);
		var lng = Math.abs(lngdd) + (this.DDMMSS.lngMM.val()/60) + (this.DDMMSS.lngSS.val()/3600);
		if(isNaN(lat) || isNaN(lng)) return false;
		if(latneg) lat = -1*lat;
		if(lngneg) lng = -1*lng;
		callback(new GLatLng(lat, lng));
	}
	return true;
}

org.sarsoft.LocationEntryForm.prototype.clear = function() {
	this.utmform.write({zone : "", e : "", n : ""});
	this.address.val("");
	this.lat.val("");
	this.lng.val("");
	this.DDMMHH.latDD.val("");
	this.DDMMHH.latMM.val("");
	this.DDMMHH.lngDD.val("");
	this.DDMMHH.lngMM.val("");
	this.DDMMSS.latDD.val("");
	this.DDMMSS.latMM.val("");
	this.DDMMSS.latSS.val("");
	this.DDMMSS.lngDD.val("");
	this.DDMMSS.lngMM.val("");
	this.DDMMSS.lngSS.val("");
}

org.sarsoft.ThinLocationForm = function() {
}

org.sarsoft.ThinLocationForm.prototype.create = function(container, handler, noLookup) {
	var that = this;

	var geocode = !(typeof GClientGeocoder == 'undefined' || noLookup);
	this.select = jQuery('<select style="margin-left: 5px">' + (geocode ? '<option value="name">Place Name</option>' : '') + '<option value="UTM">UTM</option><option value="DD">DD</option><option value="DMS">DMS</option><option value="DMH">DMH</option></select>');
	this.select.appendTo(container);
	this.containers = {
			name : jQuery('<span' + (geocode ? '' : ' style="display: none"') + '></span>').appendTo(container),
			UTM : jQuery('<span' + (geocode ? ' style="display: none"' : '') + '></span>').appendTo(container),
			DD : jQuery('<span style="display: none"></span>').appendTo(container),
			DMH : jQuery('<span style="display: none"></span>').appendTo(container),
			DMS : jQuery('<span style="display: none"></span>').appendTo(container),
	}
	
	var hints = {
		name : 'e.g. "Mount Rainier" or "Castle Peak near Truckee, CA"',
		UTM : 'UTM',
		DD : 'WGS84 decimal degrees, e.g. 39.3422, -120.2036',
		DMH : 'WGS84 degree minutes, e.g. 39\u00B020.66\', -120\u00B012.32\'',
		DMS : 'WGS84 degree minute seconds, e.g. 39\u00B020\'39\'\', -120\u00B012\'19\'\''
	}
	
	this.select.change(function() {
		var type = that.select.val();
		for (var key in that.containers) {
			that.containers[key].css("display", "none");
		}
		that.containers[type].css("display", "inline");
		container.attr("title", hints[type]);
	});

	this.utmform = new org.sarsoft.UTMEditForm();
	this.utmform.create(this.containers["UTM"]);

	var dd = this.containers["DD"];
	this.lat = jQuery('<input type="text" size="8"/>').appendTo(dd);
	dd.append(", ");
	this.lng = jQuery('<input type="text" size="8"/>').appendTo(dd);
	if(typeof(navigator.geolocation) != "undefined") {
		this.geoloc = jQuery('<button style="margin-left: 10px">My Location</button>').appendTo(dd);
		this.geoloc.click(function() {
			navigator.geolocation.getCurrentPosition(function(pos) {
				that.lat.val(pos.coords.latitude);
				that.lng.val(pos.coords.longitude);
		}, function() { alert("Unable to determine your location.")});
		});
	}
	
	var ddmmhh = this.containers["DMH"];
	this.DDMMHH = new Object();
	this.DDMMHH.latDD = jQuery('<input type="text" size="4"/>').appendTo(ddmmhh);
	ddmmhh.append("\u00B0");
	this.DDMMHH.latMM = jQuery('<input type="text" size="5"/>').appendTo(ddmmhh);
	ddmmhh.append("', ");
	this.DDMMHH.lngDD = jQuery('<input type="text" size="4"/>').appendTo(ddmmhh);
	ddmmhh.append("\u00B0");
	this.DDMMHH.lngMM = jQuery('<input type="text" size="5"/>').appendTo(ddmmhh);

	var ddmmss = this.containers["DMS"];
	this.DDMMSS = new Object();
	this.DDMMSS.latDD = jQuery('<input type="text" size="4"/>').appendTo(ddmmss);
	ddmmss.append("\u00B0");
	this.DDMMSS.latMM = jQuery('<input type="text" size="2"/>').appendTo(ddmmss);
	ddmmss.append("'");
	this.DDMMSS.latSS = jQuery('<input type="text" size="2"/>').appendTo(ddmmss);
	ddmmss.append("'', ");
	this.DDMMSS.lngDD = jQuery('<input type="text" size="4"/>').appendTo(ddmmss);
	ddmmss.append("\u00B0");
	this.DDMMSS.lngMM = jQuery('<input type="text" size="2"/>').appendTo(ddmmss);
	ddmmss.append("'");
	this.DDMMSS.lngSS = jQuery('<input type="text" size="2"/>').appendTo(ddmmss);
	
	var name = this.containers["name"];
	this.address = jQuery('<input type="text" size="16"/>').appendTo(name);
	
	if(handler != null) {
		this.lng.keydown(function(event) {
			if(event.keyCode == 13 && that.lat.val() != null) handler();
		});
		this.address.keydown(function(event) {
			if(event.keyCode == 13) handler();
		});
	}
}

org.sarsoft.ThinLocationForm.prototype.read = function(callback) {
	var type = this.select.val();
	if(type == "UTM") {
		callback(GeoUtil.UTMToGLatLng(utm));
	} else if(type == "name") {
		var gcg = new GClientGeocoder();
		gcg.getLatLng(this.address.val(), callback);
	} else if(type == "DD") {
		var lat = this.lat.val();
		var lng = this.lng.val();
		if(lat != null && lat.length > 0 && lng != null && lng.length > 0) {
			callback(new GLatLng(1*lat, 1*lng));
		} else {
			return false;
		}
	} else if(type == "DDMMHH") {
		var latdd = this.DDMMHH.latDD.val();
		var lngdd = this.DDMMHH.lngDD.val();
		if(latdd == null || latdd.length == 0 || lngdd == null || lngdd.length == 0) return false; 

		var latneg = (1*latdd < 0) ? true : false;
		var lngneg = (1*lngdd < 0) ? true : false;		
		var lat = Math.abs(latdd) + (this.DDMMHH.latMM.val()/60);
		var lng = Math.abs(lngdd) + (this.DDMMHH.lngMM.val()/60);
		if(isNaN(lat) || isNaN(lng)) return false;
		if(latneg) lat = -1*lat;
		if(lngneg) lng = -1*lng;
		callback(new GLatLng(lat, lng));
	} else {
		var latdd = this.DDMMSS.latDD.val();
		var lngdd = this.DDMMSS.lngDD.val();
		if(latdd == null || latdd.length == 0 || lngdd == null || lngdd.length == 0) return false; 

		var latneg = (1*latdd < 0) ? true : false;
		var lngneg = (1*lngdd < 0) ? true : false;

		var lat = Math.abs(latdd) + (this.DDMMSS.latMM.val()/60) + (this.DDMMSS.latSS.val()/3600);
		var lng = Math.abs(lngdd) + (this.DDMMSS.lngMM.val()/60) + (this.DDMMSS.lngSS.val()/3600);
		if(isNaN(lat) || isNaN(lng)) return false;
		if(latneg) lat = -1*lat;
		if(lngneg) lng = -1*lng;
		callback(new GLatLng(lat, lng));
	}
	return true;
}

org.sarsoft.ThinLocationForm.prototype.clear = function() {
	this.select.val('UTM').val('name').change();
	this.utmform.write({zone : "", e : "", n : ""});
	this.address.val("");
	this.lat.val("");
	this.lng.val("");
	this.DDMMHH.latDD.val("");
	this.DDMMHH.latMM.val("");
	this.DDMMHH.lngDD.val("");
	this.DDMMHH.lngMM.val("");
	this.DDMMSS.latDD.val("");
	this.DDMMSS.latMM.val("");
	this.DDMMSS.latSS.val("");
	this.DDMMSS.lngDD.val("");
	this.DDMMSS.lngMM.val("");
	this.DDMMSS.lngSS.val("");
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

GeoUtil.formatDD = function(deg) {
	return deg.toFixed(4);
}

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
	if(m == 60) {
		m = 0;
		d = d + 1;
	}
	return (neg ? "-" : "") + d+"\u00B0"+m+"."+((h < 10) ? "0" + h : h) +"'";
}

GeoUtil.formatDDMMSS = function(deg) {
	var neg = false;
	if(deg < 0) {
		neg = true;
		deg = deg*-1;
	}
	var d=Math.floor(deg);
	var m=Math.floor((deg-d)*60);
	var s=Math.round(((deg-d)*60-m)*60);
	if(s == 60) {
		s = 0;
		m = m + 1;
	}
	if(m == 60) {
		m = 0;
		d = d + 1;
	}
	return (neg ? "-" : "") + d+"\u00B0"+m+"'"+ s +"''";
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


