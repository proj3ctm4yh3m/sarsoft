if(typeof org == "undefined") org = new Object();
if(typeof org.sarsoft == "undefined") org.sarsoft = new Object();
if(typeof org.sarsoft.controller == "undefined") org.sarsoft.controller = new Object();

if(typeof org.sarsoft.EnhancedGMap == "undefined") org.sarsoft.EnhancedGMap = new Object();
org.sarsoft.EnhancedGMap._coordinates = "DD";
org.sarsoft.EnhancedGMap.nativeAliases = {};

sarsoft.map.layers_configured = sarsoft.map.layers_configured || [];
sarsoft.map.layers_georef = sarsoft.map.layers_georef || [];

org.sarsoft.EnhancedGMap.createMapType = function(config, map) {
	var ts = config.tilesize ? config.tilesize : 256;
	if(config.type == "TILE"){
		var template = config.template;
		var type = new google.maps.ImageMapType({alt: "", maxZoom: 21, minZoom: config.minresolution, name: config.name, opacity: config.opacity == null ? 1 : config.opacity/100, tileSize: new google.maps.Size(ts,ts), getTileUrl: function(point, zoom) {
			return (zoom > config.maxresolution ? '/resource/imagery/tilecache/' + config.alias + '/{Z}/{X}/{Y}.png' : template).replace(/{Z}/, zoom).replace(/{X}/, point.x).replace(/{Y}/, point.y);
		}});
	    if(config.alphaOverlay) type._alphaOverlay = true;
	    type._info = config.info;
	    type._alias = config.alias;
	    type._maxZoom = config.maxresolution;
	    return type;
	} else if(config.type == "WMS") {
		var wm = new org.sarsoft.WebMercator();
		var type = new google.maps.ImageMapType({alt: "", maxZoom: config.maxresolution, minZoom: config.minresolution, name: config.name, opacity: 1, tileSize: new google.maps.Size(ts,ts), getTileUrl: function(point, zoom) {
			var bounds = wm.tileLatLngBounds(point.x, wm.tileY(point.y, zoom), zoom);
		    var url = config.template;
		    url = url.replace(/\{left\}/g, bounds[1]);
		    url = url.replace(/\{bottom\}/g, bounds[0]);
		    url = url.replace(/\{right\}/g, bounds[3]);
		    url = url.replace(/\{top\}/g, bounds[2]);
		    url = url.replace(/\{tilesize\}/g, config.tilesize ? config.tilesize : 256);
		    return url;
		}});
	    if(config.alphaOverlay) type._alphaOverlay = true;
	    type._info = config.info;
	    type._alias = config.alias;
	    type._maxZoom = config.maxresolution;
	    return type;
	}
}

org.sarsoft.EnhancedGMap.createMap = function(element, center, zoom) {
	var map = new google.maps.Map(element, {mapTypeControl: false, streetViewControl: false, maxZoom: null});
	$(element).css({"z-index": 0, overflow: "hidden"});

	var bkgset = false;
	for(var i = 0; i < sarsoft.map.layers.length; i++) {
		var config = sarsoft.map.layers[i];
		if(config.type == "NATIVE") {
			// default google layers are loaded asynchronously, not available yet
			org.sarsoft.EnhancedGMap.nativeAliases[config.alias] = eval(config.template);
		} else {
			var type = org.sarsoft.EnhancedGMap.createMapType(config, map);
			map.mapTypes.set(config.alias, type);
		}
		if(bkgset == false) {
			map.setMapTypeId(config.alias);
			bkgset = true;
		}
	}
	
	if(center == null) center = new google.maps.LatLng(sarsoft.map.default_lat, sarsoft.map.default_lng);
	if(zoom == null) zoom = sarsoft.map.default_zoom;
	map.setCenter(center);
	map.setZoom(zoom);
	var manager = new org.sarsoft.MapOverlayManager(map);
	var controller = new org.sarsoft.MapOverlayControl(map, manager);
	return map;
}

org.sarsoft.MapOverlayManager = function(map) {
	this.map = map;
	this.map._overlaymanager = this;
	this.types = new Object();
	this.layers = [];
	this.opacity = [];
	this.alphas = [];
}

org.sarsoft.MapOverlayManager.prototype.addType = function(id, type) {
	if(type && type.getMap) this.types[id] = type;
}

org.sarsoft.MapOverlayManager.prototype.getType = function(id) {	
	if(this.types[id]) return this.types[id];
	return this.map.mapTypes.get(id);
}

org.sarsoft.MapOverlayManager.prototype.addBaseOverlay = function(id) {
	var type = this.getType(id);
	if(type && type.setMap) {
		type.setMap(this.map);
	} else {
		this.map.overlayMapTypes.insertAt(this.bo_count, type);
		this.bo_count++;
	}
}

org.sarsoft.MapOverlayManager.prototype.addAlphaOverlay = function(id) {
	this.addCfgTypeIfNecessary(id);
	this.map.overlayMapTypes.push(this.map.mapTypes.get(id));
}

org.sarsoft.MapOverlayManager.prototype.addCfgTypeIfNecessary = function(id) {
	if(id.indexOf("_") < 0 || this.map.mapTypes.get(id) != null) return;
	var parts = id.split("_");
	
	var cfg = null;
	for(var i = 0; i < sarsoft.map.layers.length; i++) {
		var config = sarsoft.map.layers[i];
		if(config.alias == parts[0]) cfg = config;
	}
	
	if(cfg != null) {
		cfg._vtemplate = cfg.template;
		cfg.template = cfg.template.replace(/{V}/,parts[1]);
		this.map.mapTypes.set(id, org.sarsoft.EnhancedGMap.createMapType(cfg, map));
		cfg.template = cfg._vtemplate;
		delete cfg._vtemplate;
	}
}

org.sarsoft.MapOverlayManager.prototype.removeOverlay = function(id) {
	var type = this.getType(id);
	if(type && type.setMap) {
		type.setMap(null);
	} else {
		for(var i = 0; i < this.map.overlayMapTypes.length; i++) {
			if(this.map.overlayMapTypes.getAt(i) == type) {
				this.map.overlayMapTypes.removeAt(i);
				this.bo_count--;
				return;
			}
		}
	}
}

org.sarsoft.MapOverlayManager.prototype.getConfigFromAlias = function(alias) {
	if(alias.indexOf("_") > 0) alias = alias.split("_")[0];
	for(i = 0; i < sarsoft.map.layers.length; i++) {
		var cfg = sarsoft.map.layers[i];
		if(cfg.alias == alias) {
			return cfg;
		}
	}
}

org.sarsoft.MapOverlayManager.prototype.updateMap = function(base, layers, opacity, alphas) {
	// TODO pull base and duplicates from layers array, as it will cause confusion when calling setOpacity
	var that = this;
	layers = (layers == null ? [] : layers.slice(0, layers.length));
	opacity = (opacity == null ? [] : opacity.slice(0, opacity.length));
	alphas = (alphas == null ? [] : alphas.slice(0, alphas.length));
	
	// Reset base iff changed
	if(this.base != base) {
		var type = this.map.mapTypes.get(base);
		if(type != null && type.setOpacity != null) type.setOpacity(1);
		this.map.setMapTypeId(base);
		this.base = base;
	}
	
	// Handle overlay layers
	while(layers.indexOf(base) >= 0) {
		opacity.splice(layers.indexOf(base), 1);
		layers.splice(layers.indexOf(base), 1);
	}
	
	for(var i = 0; i < layers.length; i++) {
		if(opacity[i] == 0) {
			layers.splice(i, 1);
			opacity.splice(i, 1);
			i--;
			continue;
		}
		while(layers.lastIndexOf(layers[i]) > i) {
			opacity[i] = 1-((1-opacity[i])*(1-opacity[layers.lastIndexOf(layers[i])]));
			opacity.splice(layers.lastIndexOf(layers[i]), 1);
			layers.splice(layers.lastIndexOf(layers[i]), 1);
		}
	}
	
	if(layers.length == 0 && this.layers.length == 0) {
		// pass
	} else if(layers.join(",") == this.layers.join(",")) {
		$.each(layers, function(i, name) { 
			var type = that.getType(name);
			if(type && type.setOpacity) type.setOpacity(Number(opacity[i]))
		});
	} else {
		$.each(this.layers, function(i, name) {
			that.removeOverlay(name);
		});
		that.bo_count = 0;
		$.each(layers, function(i, name) {
			var type = that.getType(name);
			if(type && type.setOpacity) type.setOpacity(Number(opacity[i]));
			that.addBaseOverlay(name);
		});
	}
	this.layers = layers;
	this.opacity = opacity;
	
	// AlphaOverlays
	if(alphas.length == 0 && this.alphas.length == 0) {
		// pass
	} else if(alphas.join(",") == this.alphas.join(",")) {
		// pass
	} else {
		$.each(this.alphas, function(i, name) {
			that.removeOverlay(name);
		});
		$.each(alphas, function(i, name) {
			that.addAlphaOverlay(name);
		});
	}
	this.alphas = alphas;
	
	$(this).trigger('update', {base : base, layers : layers, opacity : opacity, alphas : alphas});
}

org.sarsoft.MapOverlayControl = function(map, manager) {
	var that = this;
	this.map = map;
	this.manager = manager;
	
	this.baseOverlayControls = new Array();
	this.alphaOverlayBoxes = new Array();

	this.typeDM = new org.sarsoft.view.DropMenu(110);
	this.typeDM.change(function() { that.handleLayerChange() });

	this.alphaOverlayPlus = $('<span style="font-size: 110%; color: red; cursor: pointer; padding-left: 3px; padding-right: 3px" title="Add More Layers to Map">+0</span>');
	this.dd = new org.sarsoft.view.MenuDropdown(this.alphaOverlayPlus, 'width: 20em');

	this.div = jQuery('<div style="color: #5a8ed7; background-color: white; font-weight: bold; z-index: 1001; position: absolute; right: 0; top: 0" class="noprint"><img src="' + $.img('blank.gif') + '" style="vertical-align: middle; width: 1px; height: 1.7em"/></div>');
	this.div.append(this.extras = document.createElement("span"), this.typeDM.container, this.dd.container);

	this.baseOverlayContainer = jQuery('<div></div>').appendTo(this.dd.div);
	this.addLayerDiv = jQuery('<div style="font-weight: bold; padding-left: 3px; padding-top: 3px; padding-right: 3px"></div>').appendTo(this.dd.div);
	this.addLayer = $('<span style="color: red; cursor: pointer">+ Add Layer</span>').appendTo(this.addLayerDiv);
	this.aDiv = jQuery('<div style="clear: both; margin-top: 5px; padding-top: 5px; border-top: 1px dashed #808080"></div>').appendTo(this.dd.div);

	this.addLayer.click(function() {
		that.addOverlayControl();
	});
	this.dd.onShow = function() {
		for(var i = 0; i < that.baseOverlayControls.length; i++) {
			if(that.baseOverlayControls[i].slider.getValue()==0) {
				that.baseOverlayControls[i].remove();
				i--;
				continue;
			}
			that.baseOverlayControls[i].dm.checkContainerWidth();
		}
	}
	
	map._overlaycontrol = this;
	this.div.appendTo(map.getDiv());	
	this.resetMapTypes();
}

org.sarsoft.MapOverlayControl.prototype.addOverlayControl = function() {
	var that = this;
	var control = {}

	control.dm = new org.sarsoft.view.DropMenu();
	control.input = jQuery('<input style="margin-left: 5px" size="2" value="0"></input>');

	control.sliderContainer = jQuery('<div style="float: left;"><span style="float: left">Enter % or:</span></div>');
	control.slider = org.sarsoft.view.CreateSlider(control.sliderContainer);
	control.slider.subscribe('change', function() {
		if(!that._inSliderSet) {
			that._inSliderHandler = true;
			control.input.val(control.slider.getValue());
			that.handleLayerChange();
			that._inSliderHandler = false;
		}
	});

	control.input.change(function() { that.handleLayerChange() });
	control.dm.change(function() { that._inSliderHandler = true; that.handleLayerChange(); that._inSliderHandler = false; });

	control.div = $('<div style="clear: both"></div>').append($('<div style="float: left; padding-top: 2px; padding-bottom: 2px"></div>').append(control.dm.container, "@", control.input, "%")).append(
		$('<div style="clear: both; height: 15px; padding-left: 16px"></div>').append(control.sliderContainer)).appendTo(this.baseOverlayContainer);

	$('<div style="cursor: pointer; float: left; font-weight: bold; color: red; width: 16px; text-align: center; padding-top: 7px">X</div>').prependTo(control.div).click(function() {
		control.remove();
	});

	this.resetDM(control.dm, false);

	control.dm.checkContainerWidth();
	
	control.remove = function() {
		control.div.remove();
		that.baseOverlayControls.splice(that.baseOverlayControls.indexOf(control), 1);
		that.checkControls();
		that.handleLayerChange();
	}
	
	this.baseOverlayControls.push(control);
	that.checkControls();
}

org.sarsoft.MapOverlayControl.prototype.checkControls = function() {
	if(this.baseOverlayControls.length > 0) this.baseOverlayControls[0].div.css('clear', 'none');
	for(var i = 1; i < this.baseOverlayControls.length; i++) {
		this.baseOverlayControls[i].div.css('clear', 'both');
	}
	
	this.addLayerDiv.css('display', this.baseOverlayControls.length < 3 ? 'block' : 'none');
}

org.sarsoft.MapOverlayControl.prototype.handleLayerChange = function() {
	var layers = []
	var opacity = []
	$.each(this.baseOverlayControls, function(i, control) {
		layers.push(control.dm.val());
		opacity.push(Math.min(100, Math.max(0, control.input.val())) / 100)
	});
	
	var tt = new Array();
	if(this.alphaOverlayBoxes != null) for(var i = 0; i < this.alphaOverlayBoxes.length; i++) {
		var cfg = this.alphaOverlayBoxes[i]._cfg;
		var div = this.alphaOverlayBoxes[i]._div;
		if(this.alphaOverlayBoxes[i].checked) {
			tt.push(this.alphaOverlayTypes[i]);
			if(div != null) div.css('display','block');
		} else {
			if(div != null) div.css('display','none');
		}
	}
	this.updateMap(this.typeDM.val(), layers, opacity, tt.length > 0 ? tt : null);
}

org.sarsoft.MapOverlayControl.prototype.addAlphaType = function(alias) {
	var that = this;
	if(sarsoft.map.layers_visible.indexOf(alias) < 0) sarsoft.map.layers_visible.push(alias);
	var idx = this.alphaOverlayBoxes.length;
	this.alphaOverlayTypes[idx] = alias;
	if(idx > 0) this.aDiv.append(document.createElement("br"));
	var config = this.manager.getConfigFromAlias(alias);
	var name = config.name;
	if(config.template.indexOf("{V}") > 0) {
		for(var i = 0; i < sarsoft.map.layers_configured.length; i++) {
			var layer = sarsoft.map.layers_configured[i];
			if(layer.alias == alias && (layer.name || "").length > 0) name = layer.name;
		}
	}
	
	this.alphaOverlayBoxes[idx] = jQuery('<input type="checkbox" value="' + idx + '" name="' + name + '"/>').appendTo(this.aDiv)[0];
	this.aDiv.append(name);
	
	$(this.alphaOverlayBoxes[idx]).change(function() { that.handleLayerChange() });
	this.hasAlphaOverlays = true;
}

org.sarsoft.MapOverlayControl.prototype.addBaseTypeIfNecessary = function(alias) {
	if(sarsoft.map.layers_visible.indexOf(alias) >= 0) return;

	var mycfg = null;
	for(var i = 0; i < sarsoft.map.layers.length; i++) {
		var config = sarsoft.map.layers[i];
		if(config.alias == alias) mycfg = config;
	}

	if(mycfg == null) return;
	sarsoft.map.layers_visible.push(alias);
	
	this.typeDM.addItem(mycfg.name, org.sarsoft.EnhancedGMap.nativeAliases[alias] || alias, this.grouping[alias], mycfg.description);
	
	if(mycfg.type == "NATIVE") return;
	
	for(var i = 0; i < this.baseOverlayControls.length; i++) {
		this.baseOverlayControls[i].dm.addItem(mycfg.name, alias, this.grouping[alias], mycfg.description);
	}
}

org.sarsoft.MapOverlayControl.prototype.resetDM = function(dm, base) {
	dm.empty();
	for(var i = 0; i < sarsoft.map.layers.length; i++) {
		var config = sarsoft.map.layers[i];
		if(sarsoft.map.layers_visible.indexOf(config.alias) >= 0) {
			if(!config.alphaOverlay && (config.type != "NATIVE" || base)) {
				dm.addItem(config.name, org.sarsoft.EnhancedGMap.nativeAliases[config.alias] || config.alias, this.grouping[config.alias], config.description);
			}
		}
	}
	
	if(base) return;
	for(var i = 0; i < sarsoft.map.layers_georef.length; i++) {
		var gr = sarsoft.map.layers_georef[i];
		dm.addItem(gr.name, "_gr" + gr.id);
	}
}

org.sarsoft.MapOverlayControl.prototype.resetMapTypes = function(maintain_config) {
	this.alphaOverlayBoxes = new Array();
	this.alphaOverlayTypes = new Array();
	this.aDiv.empty()

	if(maintain_config) var mapconfig = this.getConfig();
	this.grouping = {};
	if(sarsoft.map.layers_grouping != null) {
		var groups = sarsoft.map.layers_grouping.split(';');
		for(i = 0; i < groups.length; i++) {
			var name = groups[i].split('=')[0];
			var types = groups[i].split('=')[1].split(',');
			for(var j = 0; j < types.length; j++) {
				this.grouping[types[j]] = name;
			}
		}
	}
	
	this.resetDM(this.typeDM, true);
	for(var i = 0; i < this.baseOverlayControls.length; i++) {
		this.resetDM(this.baseOverlayControls[i].dm, false);
	}

	for(var i = 0; i < sarsoft.map.layers.length; i++) {
		var config = sarsoft.map.layers[i];
		if(sarsoft.map.layers_visible.indexOf(config.alias) >= 0) {
			if(config.alphaOverlay && config.template.indexOf("{V}") < 0) this.addAlphaType(config.alias);
		}
	}
	
	for(var i = 0; i < sarsoft.map.layers_configured.length; i++) {
		this.addAlphaType(sarsoft.map.layers_configured[i].alias);
	}

	for(var i = 0; i < sarsoft.map.layers_georef.length; i++) {
		var gr = sarsoft.map.layers_georef[i];
		var alias = "_gr" + gr.id;
		this.manager.removeOverlay(alias);
		this.manager.addType(alias, new org.sarsoft.GeoRefImageOverlay(null, gr.name, gr.url, new google.maps.Point(gr.x1, gr.y1), new google.maps.Point(gr.x2, gr.y2), new google.maps.LatLng(gr.lat1, gr.lng1), new google.maps.LatLng(gr.lat2, gr.lng2), 1));
	}
	
	this.hasAlphaOverlays = false;
	this.updateMap(this.map.getMapTypeId(), [], []);
	if(mapconfig) this.setConfig(mapconfig);
}

org.sarsoft.MapOverlayControl.prototype.appendInfoStr = function(str, name) {
	var type = this.manager.getType(name);
	if(type && type._info && type._info.length > 0) return str + type._info + ". ";
	return str;
}

org.sarsoft.MapOverlayControl.prototype.getConfig = function(config) {
	if(config == null) config = new Object();
	config.base = this.manager.base;
	for(var key in org.sarsoft.EnhancedGMap.nativeAliases) {
		if(org.sarsoft.EnhancedGMap.nativeAliases[key] == config.base) config.base = key;
	}
	config.layers = this.manager.layers.slice(0, this.manager.layers.length);
	config.opacity = this.manager.opacity.slice(0, this.manager.layers.length);
	var ao = this.manager.alphas.slice(0, this.manager.alphas.length);
	if(ao.length > 0) {
		for(var i = 0; i < ao.length; i++) {
			var type = this.map.mapTypes.get(ao[i]);
			if(type._cfgvalue != null) ao[i] = ao[i] + "_" + type._cfgvalue;
		}
	}
	config.alphas = (ao.length > 0 ? ao : null);
	return config;
}

org.sarsoft.MapOverlayControl.prototype.setConfig = function(config) {
	if(config == null) return;
	if(config.overlay != null && config.layers == null) {
		config.layers = [config.overlay];
		config.opacity = [config.opacity];
	}
	if(config.alphaOverlays != null && config.alphas == null) config.alphas = config.alphaOverlays.split(",");

	if(config.alphas != null) {
		for (var i = 0; i < config.alphas.length; i++) {
			if(config.alphas[i] == "slp_s-11111111") config.alphas[i] = "sf";
		}
	}
	if(config.base == null) return;
	this.updateMap(config.base, config.layers, config.opacity, config.alphas);
}


org.sarsoft.MapOverlayControl.prototype.updateMap = function(base, layers, opacity, alphas) {
	layers = (layers || []);
	opacity = (opacity || []);
	alphas = (alphas || []);
	var _overlayNative = false;
	var _baseNative = false;
	
	// Add layers if necessary
	this.addBaseTypeIfNecessary(base);
	for(var i = 0; i < layers.length; i++) { this.addBaseTypeIfNecessary(layers[i]) }
	
	// Reference native alias changes, re-call updateMap if necessary
	if(org.sarsoft.EnhancedGMap.nativeAliases[base] != null) {
		_baseNative = true;
		base = org.sarsoft.EnhancedGMap.nativeAliases[base];
	}
	if(layers.length > 0 && org.sarsoft.EnhancedGMap.nativeAliases[layers[0]] != null) {
		_overlayNative = true;
		layers[0] = org.sarsoft.EnhancedGMap.nativeAliases[layers[0]];
	}
	if(_overlayNative && !_baseNative) {
		var tmp = layers[0];
		layers[0] = base;
		opacity[0] = 1-opacity[0];
		base = tmp;
		this.updateMap(base, layers, opacity, alphas);
		return;
	}
	
	if(this._updating) return;
	this._updating = true;

	// Change the actual layers
	this.manager.updateMap(base, layers, opacity, alphas);

	// Build Info String
	var infoStr = this.appendInfoStr("", base);
	for(var i = 0; i < layers.length; i++) {
		infoStr = this.appendInfoStr(infoStr, layers[i]);
	}
	
	if(alphas != null) {
		for(var i = 0; i < alphas.length; i++) {
			infoStr = this.appendInfoStr(infoStr, alphas[i]);
		}
	}
	
	// Update visual controls
	if(!this._inSliderHandler) this.dd.onShow();
	this.typeDM.val(base);
	while(layers.length > this.baseOverlayControls.length) {
		this.addOverlayControl();
	}
	while(layers.length < this.baseOverlayControls.length) {
		this.baseOverlayControls[this.baseOverlayControls.length-1].remove();
	}

	for(var i = 0; i < layers.length; i++) {
		var control = this.baseOverlayControls[i];
		control.input.val(Math.round(opacity[i]*100));
		this._inSliderSet = true;
		if(!this._inSliderHandler) control.slider.setValue(opacity[i]*100);
		this._inSliderSet = false;
		control.dm.val(layers[i]);
	}
	
	for(var i = 0; i < alphas.length; i++) {
		if(this.alphaOverlayTypes.indexOf(alphas[i]) < 0) this.addAlphaType(alphas[i]);
	}

	if(alphas != null) for(var i = 0; i < this.alphaOverlayTypes.length; i++) {
		var cfg = this.alphaOverlayBoxes[i]._cfg;
		var div = this.alphaOverlayBoxes[i]._div;
		this.alphaOverlayBoxes[i].checked=false;
		if(cfg != null) div.css('display','none');
		for(var j = 0; j < alphas.length; j++) {
			if(this.alphaOverlayTypes[i] == alphas[j]) {
				this.alphaOverlayBoxes[i].checked=true;
				if(cfg != null) {
					div.css('display', 'block');
					cfg.readCfgValue(this.map.mapTypes.get(this.alphaOverlayTypes[i])._cfgvalue);
				}
			}
		}
	}
	this.alphaOverlayPlus.html("+" + (this.manager.layers.length + this.manager.alphas.length));
	if(infoStr.length > 0 && this.map._imap != null)  {
		this.map._imap.setMapInfo("org.sarsoft.MapOverlayControl", 0, infoStr);
	} else if(this.map._imap != null) {
		this.map._imap.setMapInfo("org.sarsoft.MapOverlayControl", 0, null);
	}

	this._updating = false;
}

org.sarsoft.MapMessageControl = function(map) {
	this.map = map;
	this.div = document.createElement("div");
	
	if(!org.sarsoft.mobile) map.controls[google.maps.ControlPosition.TOP_LEFT].push(this.div);
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

org.sarsoft.MapDeclinationWidget = function(imap) {
	var that = this;
	this.imap = imap;
	google.maps.event.addListener(imap.map, "center_changed", function() { that.refresh(); });
	this.refresh();
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

	this.datumControl = jQuery('<span style="padding-left: 3px"></span>').appendTo(imap._mapInfoControl.premsg);
	this.datumDisplay = jQuery('<span>' + sarsoft.map.datum + '.</span>').appendTo(this.datumControl);
	
	if(switchable) {
		this.datumSwitcher = jQuery('<a class="underlineOnHover" title="Click to Change Datum" style="cursor: pointer"></a>').appendTo(this.datumControl).append(this.datumDisplay);
		this.datumList = jQuery('<span style="display: none"><span style="margin-right: 10px">Set Datum:</span></span>').appendTo(this.datumControl);
		
		var fn = function(d) {
			return function() {
				that.datumList.css('display', 'none');
				that.datumDisplay.css('display', 'inline');
				that.setDatum(d);
			}
		}
		for(var datum in org.sarsoft.map.datums) {
			jQuery('<span style="margin-right: 10px; color: #5a8ed7; cursor: pointer">' + datum + '</span>').appendTo(this.datumList).click(fn(datum));
		}
		
		this.datumSwitcher.click(function() {
			if(that.datumList.css('display') == "none") {
				that.datumList.css('display', 'inline');
				that.datumDisplay.css('display', 'none');
			} else {
				that.datumList.css('display', 'none');
				that.datumDisplay.css('display', 'inline');
			}
		})
	}
}

org.sarsoft.MapDatumWidget.prototype.setDatum = function(datum) {
	sarsoft.map.datum = datum;
	GeoUtil.datum = org.sarsoft.map.datums[sarsoft.map.datum];
	this.datumDisplay.html(datum + '.');
	this.imap.updateDatum();
}

org.sarsoft.MapDatumWidget.prototype.setConfig = function(config) {
	if(config.MapDatumWidget == null) return;
	this.setDatum(config.MapDatumWidget.datum);
}

org.sarsoft.MapDatumWidget.prototype.getConfig = function(config) {
	if(config.MapDatumWidget == null) config.MapDatumWidget = new Object();
	config.MapDatumWidget.datum = sarsoft.map.datum;
	return config;
}

org.sarsoft.UTMGridControl = function(imap) {
	var that = this;
	this._showUTM = false;
	this.style = {major : 0.8, minor : 0.4, crosshatch : 100, latlng : "DD", scale : false}

	this.utmgridlines = new Array();
	this.text = new Array();
	this.utminitialized = false;
	this.showborder = false;
	this.imap = imap;
	if(imap != null) {
		var div = $('<div></div>').appendTo(imap.controls.settings);
		var line = $('<div></div>').appendTo(div);
		this.cb = $('<input style="float: left" type="checkbox"/>').prependTo(line).change(function() { that.setValue(that.cb[0].checked) });
		var line = $('<div style="float: left" title="Univeral Transverse Mercator grid.  One grid unit = 1 meter.">Show UTM Grid</div>').appendTo(line);
		var line = $('<div><div style="float: left">Intensity:</div></div>').appendTo(line);
		this.slider = org.sarsoft.view.CreateSlider($('<div style="float: left"></div>').appendTo(line), 50);
		this.slider.subscribe('slideEnd', function() {
			that.style.major = that.slider.getValue()/50;
			that.style.minor = that.style.major*0.5;
			that._drawUTMGrid(true);
		});
		$('<div style="clear: both"></div>').appendTo(div);
		
		this.cb[0].checked = this._showUTM;
		
		imap.register("org.sarsoft.UTMGridControl", this);
		this.map = imap.map;
		this.borders = [];
		
		var fn = function() {
			if(that.utminitialized == false) {
				that._drawUTMGrid();
				google.maps.event.addListener(imap.map, "idle", function() { that._drawUTMGrid(); });
				google.maps.event.addListener(imap.map, "dragstart", function() {
					for(var i = 0; i < that.text.length; i++) {
						that.text[i].setMap(null);
					}
					that.text = new Array();
					for(var i = 0; i < 4; i++) that.borders[i].clear();
				});
				that.utminitialized=true;
				that.slider.setValue(that.style.major*50);
			}
		}
	
		for(var i = 0; i < 4; i++) {
			this.borders[i] = new org.sarsoft.MapBorderControl(imap.map, i);
			this.borders[i].div.css('display', 'none');
		}
	
		fn();
	}
}

org.sarsoft.UTMGridControl.prototype.showPrintBorder = function() {
	this.showborder = true;
	for(var i = 0; i < 4; i++) this.borders[i].div.css('display', 'block');
	this._drawUTMGrid(true);
}

org.sarsoft.UTMGridControl.prototype.hidePrintBorder = function() {
	this.showborder = false;
	for(var i = 0; i < 4; i++) this.borders[i].div.css('display', 'none');
	this._drawUTMGrid(true);
}

org.sarsoft.UTMGridControl.prototype.setValue = function(value) {
	this._showUTM = value;
	this._drawUTMGrid(true);
	this.cb[0].checked = this._showUTM;
}

org.sarsoft.UTMGridControl.prototype.setConfig = function(config) {
	if(config.UTMGridControl == null) return;
	this.setValue(config.UTMGridControl.showUTM);
	if(config.UTMGridControl.major != null) {
		this.style.major = config.UTMGridControl.major;
		this.slider.setValue(this.style.major*50);
	}
	this.style.crosshatch = 100;
	if(config.UTMGridControl.minor != null) {
		this.style.minor = config.UTMGridControl.minor;
	}
	this._drawUTMGrid(true);
}

org.sarsoft.UTMGridControl.prototype.getConfig = function(config) {
	if(config.UTMGridControl == null) config.UTMGridControl = new Object();
	config.UTMGridControl.showUTM = this._showUTM;
	config.UTMGridControl.major = this.style.major;
	config.UTMGridControl.minor = this.style.minor;
	config.UTMGridControl.crosshatch = this.style.crosshatch;
	return config;
}

org.sarsoft.UTMGridControl.prototype._drawUTMGrid = function(force) {
	if(!this.imap.projection) return;
	if(force != true && typeof this.utmgridcoverage != "undefined" && google.maps.geometry.spherical.computeDistanceBetween(this.utmgridcoverage.getSouthWest(), this.map.getBounds().getSouthWest()) == 0 &&
		google.maps.geometry.spherical.computeDistanceBetween(this.utmgridcoverage.getNorthEast(), this.map.getBounds().getNorthEast()) == 0) return;

	for(var i = 0; i < 4; i++) this.borders[i].clear();

	this.utmgridcoverage = this.map.getBounds();

	for(var i = 0; i < this.utmgridlines.length; i++) {
		this.utmgridlines[i].setMap(null);
	}
	this.utmgridlines = new Array();
	for(var i = 0; i < this.text.length; i++) {
		this.text[i].setMap(null);
	}
	this.text = new Array();
	
	if(this.showborder) this._drawLatLongGrid();	

	if(this._showUTM == false) return;
	
	var bounds = this.map.getBounds();
	var span = google.maps.geometry.spherical.computeDistanceBetween(bounds.getSouthWest(), bounds.getNorthEast());
	var px1 = this.imap.projection.fromLatLngToContainerPixel(bounds.getSouthWest());
	var px2 = this.imap.projection.fromLatLngToContainerPixel(bounds.getNorthEast());
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
	this._drawUTMGridForZone(sw.zone, spacing, false, sw.zone == ne.zone);
	if(sw.zone != ne.zone)  this._drawUTMGridForZone(ne.zone, spacing, true, false);
	
}

org.sarsoft.UTMGridControl.prototype._computeRotationalOffset = function(element) {
	return Math.ceil((element.width()/2)-(element.height()/2));
}

org.sarsoft.UTMGridControl.prototype._drawLatLongGrid = function() {
	var that = this;
	var bounds = this.map.getBounds();
	var pxmax = this.imap.projection.fromLatLngToContainerPixel(bounds.getNorthEast()).x;
	var pymax = this.imap.projection.fromLatLngToContainerPixel(bounds.getSouthWest()).y;
	
	function createDDText(deg) {
		deg = Math.abs(deg);
		return "<div style=\"font-size: 12px; height: 12px; color: #000000; background: #FFFFFF\">" + (Math.round(deg*100)/100) + "\u00B0</div>";
	}
	function createDMText(deg) {
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
		return "<div style=\"font-size: 12px; height: 12px; color:#000000; background: #FFFFFF\">" + d+"\u00B0"+m + (h == 50 ? ".5'" : "'") + "</div>";
	}
	
	if(org.sarsoft.EnhancedGMap._coordinates == "DD") {
		// spacing is in degrees
		var span = (bounds.getNorthEast().lng() - bounds.getSouthWest().lng());
		var spacing = 0.01;
		while(spacing*pxmax/200 < span) spacing=spacing*10;
		if(span/spacing < 2 && spacing > 0.01) spacing = spacing/10;
		var lng = Math.round(GeoUtil.fromWGS84(bounds.getSouthWest()).lng()/spacing)*spacing;
		var east = GeoUtil.fromWGS84(bounds.getNorthEast()).lng();
		while(lng < east) {
			var offset = this.imap.projection.fromLatLngToContainerPixel(GeoUtil.toWGS84(new google.maps.LatLng(lat, lng))).x;
			if(offset > 26 && offset < pymax - 26) {
				var blabel = jQuery('<div style="position: absolute; bottom: 14px">' + createDDText(lng) + '</div>');
				this.borders[1].div.append(blabel);
				blabel.css({left: Math.round(offset - blabel.width()/2) + "px"});
				var btick = jQuery('<div style="position: absolute; bottom: 0; height: 14px; border-left: 1px solid black"></div>');
				this.borders[1].div.append(btick);
				btick.css({left: offset + "px"});
	
				var blabel = jQuery('<div style="position: absolute; top: 14px">' + createDDText(lng) + '</div>');
				this.borders[3].div.append(blabel);
				blabel.css({left: Math.round(offset - blabel.width()/2) + "px"});
				var btick = jQuery('<div style="position: absolute; top: 0; height: 14px; border-left: 1px solid black"></div>');
				this.borders[3].div.append(btick);
				btick.css({left: offset + "px"});
			}
			lng = lng + spacing;
		}
	} else {
		// spacing is in minutes
		var span = (bounds.getNorthEast().lng() - bounds.getSouthWest().lng())*60;
		var spacing = 0.5;
		if(spacing*pxmax/200 < span) spacing = 1;
		if(spacing*pxmax/200 < span) spacing = 2;
		if(spacing*pxmax/200 < span) spacing = 5;
		if(spacing*pxmax/200 < span) spacing = 10;
		if(spacing*pxmax/200 < span) spacing = 20;
		if(spacing*pxmax/200 < span) spacing = 60;
		if(spacing*pxmax/200 < span) spacing = 300;
		var decDMSpacing = {300: 60, 60: 20, 20: 10, 10: 5, 5: 2, 2: 1, 1: 0.5};
		if(span/spacing < 2 && spacing > 0.5) spacing = decDMSpacing[spacing];

		var lng = Math.round(GeoUtil.fromWGS84(bounds.getSouthWest()).lng()*60/spacing)*spacing;
		var east = GeoUtil.fromWGS84(bounds.getNorthEast()).lng()*60;
		while(lng < east) {
			var rlng = lng/60;
			var offset = this.imap.projection.fromLatLngToContainerPixel(GeoUtil.toWGS84(new google.maps.LatLng(lat, rlng))).x;
			if(offset > 26 && offset < pymax - 26) {
				var blabel = jQuery('<div style="position: absolute; bottom: 14px">' + createDMText(rlng) + '</div>');
				this.borders[1].div.append(blabel);
				blabel.css({left: Math.round(offset - blabel.width()/2) + "px"});			
				var btick = jQuery('<div style="position: absolute; bottom: 0; height: 14px; border-left: 1px solid black"></div>');
				this.borders[1].div.append(btick);
				btick.css({left: offset + "px"});
	
				var blabel = jQuery('<div style="position: absolute; top: 14px">' + createDMText(rlng) + '</div>');
				this.borders[3].div.append(blabel);
				blabel.css({left: Math.round(offset - blabel.width()/2) + "px"});			
				var btick = jQuery('<div style="position: absolute; top: 0; height: 14px; border-left: 1px solid black"></div>');
				this.borders[3].div.append(btick);
				btick.css({left: offset + "px"});
				}
			
			lng = lng + spacing;
		}
	}
	

	var span = (bounds.getNorthEast().lat() - bounds.getSouthWest().lat())*60;
	if(org.sarsoft.EnhancedGMap._coordinates == "DD") {
		// spacing is in degrees
		var span = (bounds.getNorthEast().lng() - bounds.getSouthWest().lng());
		var spacing = 0.01;
		while(spacing*pxmax/200 < span) spacing=spacing*10;
		if(span/spacing < 2 && spacing > 0.01) spacing = spacing/10;
		var lat = Math.round(GeoUtil.fromWGS84(bounds.getSouthWest()).lat()/spacing)*spacing;
		var north = GeoUtil.fromWGS84(bounds.getNorthEast()).lat();
		while(lat < north) {
			lat = lat + spacing;
			var offset = this.imap.projection.fromLatLngToContainerPixel(GeoUtil.toWGS84(new google.maps.LatLng(lat, lng))).y;
			if(offset > 26 && offset < pymax - 26) {

				var blabel = jQuery('<div style="position: absolute; right: 0px; -webkit-transform: rotate(270deg); -moz-transform: rotate(90deg); filter: progid:DXImageTransform.Microsoft.BasicImage(rotation=1)">' + createDDText(lat) + '</div>');
				this.borders[0].div.append(blabel);
				blabel.css({top: Math.round(offset - blabel.height()/2) + "px", right: -1*(this._computeRotationalOffset(blabel) - 14) + "px"});
				var btick = jQuery('<div style="position: absolute; top: 0; right: 0px; width: 12px; border-top: 1px solid black"></div>');
				this.borders[0].div.append(btick);
				btick.css({top: offset + "px"});
	
				var blabel = jQuery('<div style="position: absolute; left: 0px; -webkit-transform: rotate(90deg); -moz-transform: rotate(90deg); filter: progid:DXImageTransform.Microsoft.BasicImage(rotation=1)">' + createDDText(lat) + '</div>');
				this.borders[2].div.append(blabel);
				blabel.css({top: Math.round(offset - blabel.height()/2) + "px", left: -1*(this._computeRotationalOffset(blabel) - 14) + "px"});
				var btick = jQuery('<div style="position: absolute; top: 0; left: 0px; width: 12px; border-top: 1px solid black"></div>');
				this.borders[2].div.append(btick);
				btick.css({top: offset + "px"});
			}
		}
	} else {
		// spacing is in minutes
		var span = (bounds.getNorthEast().lng() - bounds.getSouthWest().lng())*60;
		var spacing = 0.5;
		if(spacing*pxmax/200 < span) spacing = 1;
		if(spacing*pxmax/200 < span) spacing = 2;
		if(spacing*pxmax/200 < span) spacing = 5;
		if(spacing*pxmax/200 < span) spacing = 10;
		if(spacing*pxmax/200 < span) spacing = 20;
		if(spacing*pxmax/200 < span) spacing = 60;
		if(spacing*pxmax/200 < span) spacing = 300;
		var decDMSpacing = {300: 60, 60: 20, 20: 10, 10: 5, 5: 2, 2: 1, 1: 0.5};
		if(span/spacing < 2 && spacing > 0.5) spacing = decDMSpacing[spacing];

		var lat = Math.round(GeoUtil.fromWGS84(bounds.getSouthWest()).lat()*60/spacing)*spacing;
		var north = GeoUtil.fromWGS84(bounds.getNorthEast()).lat()*60;
		while(lat < north) {
			var rlat = lat/60;
			var offset = this.imap.projection.fromLatLngToContainerPixel(GeoUtil.toWGS84(new google.maps.LatLng(rlat, lng))).y;

			if(offset > 26 && offset < pxmax - 26) {
				var blabel = jQuery('<div style="position: absolute; right: 0px; -webkit-transform: rotate(270deg); -moz-transform: rotate(90deg); filter: progid:DXImageTransform.Microsoft.BasicImage(rotation=1)">' + createDMText(rlat) + '</div>');
				this.borders[0].div.append(blabel);
				blabel.css({top: Math.round(offset - blabel.height()/2) + "px", right: -1*(this._computeRotationalOffset(blabel) - 14) + "px"});
				var btick = jQuery('<div style="position: absolute; top: 0; right: 0px; width: 12px; border-top: 1px solid black"></div>');
				this.borders[0].div.append(btick);
				btick.css({top: offset + "px"});

				var blabel = jQuery('<div style="position: absolute; left: 0px; -webkit-transform: rotate(90deg); -moz-transform: rotate(90deg); filter: progid:DXImageTransform.Microsoft.BasicImage(rotation=1)">' + createDMText(rlat) + '</div>');
				this.borders[2].div.append(blabel);
				blabel.css({top: Math.round(offset - blabel.height()/2) + "px", left: -1*(this._computeRotationalOffset(blabel) - 14) + "px"});
				var btick = jQuery('<div style="position: absolute; top: 0; left: 0px; width: 12px; border-top: 1px solid black"></div>');
				this.borders[2].div.append(btick);
				btick.css({top: offset + "px"});
			}
			lat = lat + spacing;
		}
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
		start_ll = GeoUtil.toWGS84(GeoUtil.UTMToGLatLng({e: GeoUtil.GLatLngToUTM(new google.maps.LatLng(start_ll.lat(), GeoUtil.getWestBorder(zone)), zone).e, n: start_utm.n, zone: zone}));
	}
	if(zone != null && end_ll.lng() > GeoUtil.getEastBorder(zone)) {
		end_ll = GeoUtil.toWGS84(GeoUtil.UTMToGLatLng({e: GeoUtil.GLatLngToUTM(new google.maps.LatLng(end_ll.lat(), GeoUtil.getEastBorder(zone)), zone).e, n: end_utm.n, zone: zone}));
	}
	vertices.push(start_ll);
	vertices.push(end_ll);
	
	var overlay = new google.maps.Polyline({map: this.map, path: vertices, strokeColor: "#0000FF", strokeOpacity: 1, strokeWeight: primary ? this.style.major : this.style.minor});
	this.utmgridlines.push(overlay);
}

org.sarsoft.UTMGridControl.prototype._drawUTMGridForZone = function(zone, spacing, right, markboth) {
	var bounds = this.map.getBounds();
	var screenSW = GeoUtil.GLatLngToUTM(GeoUtil.fromWGS84(bounds.getSouthWest()), zone);
	var screenNE = GeoUtil.GLatLngToUTM(GeoUtil.fromWGS84(bounds.getNorthEast()), zone);
	var sw = new UTM(screenSW.e-spacing, screenSW.n-spacing, screenSW.zone);
	var ne = new UTM(screenNE.e+spacing, screenNE.n+spacing, screenNE.zone);

	var east = GeoUtil.getEastBorder(zone);
	var west = GeoUtil.getWestBorder(zone);

	function createText(meters) {
		var major = Math.floor(meters/1000);
		var minor = meters - major*1000;
		if(minor == 0) minor = "000";
		var top = Math.floor(major/100);
		var bottom = major - top*100;
		if(bottom < 10) bottom = "0" + bottom;
		return "<div style=\"height: 12px; font-size: 12px; color:#0000FF; background-color: white\"><span style=\"font-size: 10px\">" + top + "</span>" + bottom + "<span style=\"font-size: 10px\">" + minor + "</span></div>";
	}

	var easting = Math.round(sw.e / spacing)  * spacing;
	var pxmax = this.imap.projection.fromLatLngToContainerPixel(bounds.getNorthEast()).x;
	var pymax = this.imap.projection.fromLatLngToContainerPixel(bounds.getSouthWest()).y;
	
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

			var offset = this.imap.projection.fromLatLngToContainerPixel(GeoUtil.toWGS84(GeoUtil.UTMToGLatLng({e: easting, n: screenSW.n, zone: zone}))).x;
			if(26 < offset && offset < pxmax -26 && easting % 200 == 0) {
				if(this.showborder) {
					var blabel = jQuery('<div style="position: absolute; top: 0; z-index: 1">' + createText(easting) + '</div>');
					this.borders[3].div.append(blabel);
					blabel.css({left: Math.round(offset - blabel.width()/2) + "px"});
				} else {
					var point = new google.maps.Point(offset, pymax-2);
					var label = new Label(this.map, this.imap.projection.fromContainerPixelToLatLng(point), createText(easting), "-webkit-transform: rotate(270deg); -moz-transform: rotate(270deg); filter: progid:DXImageTransform.Microsoft.BasicImage(rotation=3);", null, new google.maps.Size(-0.5,-0.5));
					this.text.push(label);
				}
			}

			var offset = this.imap.projection.fromLatLngToContainerPixel(GeoUtil.toWGS84(GeoUtil.UTMToGLatLng({e: easting, n: screenNE.n, zone: zone}))).x;
			if(0 < offset && offset < pxmax && easting % 200 == 0 && this.showborder) {
				var blabel = jQuery('<div style="position: absolute; bottom: 0; z-index: 1">' + createText(easting) + '</div>');
				this.borders[1].div.append(blabel);
				blabel.css({left: Math.round(offset - blabel.width()/2) + "px"});
			}
			
		}
		easting = easting + spacing;
	}
	
	var northing = Math.round(sw.n / spacing) * spacing;
	while(northing < ne.n) {
		if(this.style.crosshatch == 100) {
			this._drawGridLine(new UTM(sw.e, northing, zone), new UTM(ne.e, northing, zone), (northing % 1000 == 0), zone);
		}

		if(!right) {
			var offset = this.imap.projection.fromLatLngToContainerPixel(GeoUtil.toWGS84(GeoUtil.UTMToGLatLng({e: screenSW.e, n: northing, zone: zone}))).y;
			if(26 < offset && offset < pymax - 26 && northing % 200 == 0) {
				if(this.showborder) {
					var blabel = jQuery('<div style="position: absolute; right: 0px; z-index: 1; -webkit-transform: rotate(270deg); -moz-transform: rotate(270deg); filter: progid:DXImageTransform.Microsoft.BasicImage(rotation=3)">' + createText(northing) + '</div>');
					this.borders[0].div.append(blabel);
					blabel.css({top: Math.round(offset - blabel.height()/2) + "px", right: -1*(this._computeRotationalOffset(blabel) - 2) + "px"});
				} else {
					var point = new google.maps.Point(0, offset);
					var label = new Label(this.map, this.imap.projection.fromContainerPixelToLatLng(point), createText(northing), null, null, new google.maps.Size(0,-0.5));
					this.text.push(label);
				}				
			}
		}
		if((right || markboth) && this.showborder) {
			var offset = this.imap.projection.fromLatLngToContainerPixel(GeoUtil.toWGS84(GeoUtil.UTMToGLatLng({e: screenNE.e, n: northing, zone: zone}))).y;
			if(26 < offset && offset < pymax - 26 && northing % 200 == 0 && this.showborder) {
				var blabel = jQuery('<div style="position: absolute; left: 0px; z-index: 1; -webkit-transform: rotate(90deg); -moz-transform: rotate(90deg); filter: progid:DXImageTransform.Microsoft.BasicImage(rotation=1)">' + createText(northing) + '</div>');
				this.borders[2].div.append(blabel);
				blabel.css({top: Math.round(offset - blabel.height()/2) + "px", left: -1*(this._computeRotationalOffset(blabel) - 2) + "px"});
			}
		}
		northing = northing + spacing;
	}
}


org.sarsoft.MapBorderControl = function(map, edge) {
	var that = this;
	this.map = map;
	this.edge = edge;
	var size = '26px';

	this.div = jQuery('<div style="background-color: white; position: absolute; z-index: 999"></div>').appendTo(map.getDiv());
	if(this.edge == 0) this.div.css({left: 0, top: 0, width: size, height: '100%'});
	if(this.edge == 1) this.div.css({left: 0, top: 0, width: '100%', height: size});
	if(this.edge == 2) this.div.css({right: 0, top: 0, width: size, height: '100%'});
	if(this.edge == 3) this.div.css({left: 0, bottom: 0, width: '100%', height: size});
}

org.sarsoft.MapBorderControl.prototype.clear = function() {
	this.div.empty();
}

org.sarsoft.DNTree = function(container, label) {
	var that = this;
	this.label = label;
	this.container = container;
	this.lock = false;
	
	this.block = jQuery('<div class="dntree"></div>').appendTo(container);
	this.header = jQuery('<div class="dntree-header">' + label + '</div>').appendTo(this.block);
	this.body = jQuery('<div class="dntree-body"></div>').appendTo(this.block);
	$('<div style="clear: both"></div>').appendTo(this.block);

	this.header.click(function() {
		if(that.lock) return;
		if(that.body.css('display')=='none') {
			that.body.css('display', 'block');
			if(that.tool != null) that.tool.css('display', 'block');
		} else {
			that.body.css('display', 'none');
			if(that.tool != null) that.tool.css('display', 'none');
		}
	});
}

org.sarsoft.DNTree.prototype.getTool = function() {
	if(this.tool != null) return this.tool;
	return this.tool = $('<div class="dntool">Save</div>').css('display', this.body.css('display')).prependTo(this.header);
}

org.sarsoft.DataNavigator = function(imap) {
	var that = this;
	this.imap = imap;
	if(imap == null) return;

	this.left = $('<div style="width: 100%; padding-bottom: 1.5em"></div>').appendTo($('<div style="width: 100%; height: 100%; overflow-y: auto" class="cs"></div>').appendTo(imap.container.left));	
	$('<div style="width: 100%; background-color: white; position: absolute; bottom: 0px; font-size: 120%; font-weight: normal; z-index: 100; padding-bottom: 2px; padding-top: 2px"><a style="padding-left: 2px; color: red" href="/about.html" target="_blank">About ' + sarsoft.version + '</a></div>').appendTo(imap.container.left);
	imap.container.left.css('overflow-y', 'hidden');
	
	this.body = this.left;
}

org.sarsoft.DataNavigator.prototype.addDataType = function(title) {
	var tree = new org.sarsoft.DNTree(this.body, title);
	tree.block.addClass('l2');
	return tree;
}

org.sarsoft.DataNavigator.prototype.addHeader = function(title, icon) {
	var tree = new org.sarsoft.DNTree(this.left, title);
	tree.lock = true;
	tree.block.addClass('l1');
	tree.header.prepend(jQuery('<img src="' + $.img(icon) + '"/>'));
	
	tree.addClose = function(title, handler) {
		$('<div style="float: right; color: red; cursor: pointer; font-size: 140%; position: absolute; top: 0; right: 2px; font-weight: normal">X</div>').prependTo(tree.header).attr("title", title)
		.click(handler).hover(function(evt) { $(evt.target).css('font-weight', 'bold') }, function(evt) { $(evt.target).css('font-weight', 'normal')});
	}

	return tree;
}

org.sarsoft.DataNavigator.prototype.addNewOption = function(idx, text, handler) {
}

org.sarsoft.DataNavigatorToggleControl = function(imap) {
	var that = this;
	this.imap = imap;
	this.map = imap.map;
	this.offset = 220;
	this.min_offset = 200;
	this.mobile = org.sarsoft.mobile;
	this.state = !this.mobile;
	
	this.minmax = jQuery('<img src="' + $.img('draghandle.png') + '" title="Show Left Bar" style="cursor: pointer; z-index: 1001; position: absolute; left: 0; top:' + Math.round($(this.imap.map.getDiv()).height()/2-24) + 'px" class="noprint"/>');
	$(window).resize(function() {
		 var h = $(that.imap.map.getDiv()).height();
		 if(h > 100) {
			 that.minmax.css('top', Math.round(h/2-24) + 'px');
		 }
	});

	if(this.mobile) {
		var closer = jQuery('<div style="font-size: 150%; color: red; cursor: pointer; font-weight: bold"></div>').prependTo(imap.container.left).click(function() {
			that.hideDataNavigator();
		});
		closer.append('<div style="float: right">X</div>').append('<div style="float: left">X</div>').append('<div style="text-align: center">Close</div>');
	} else {
		if(YAHOO.util.Cookie.exists("org.sarsoft.browsersettings")) {
			var config = YAHOO.lang.JSON.parse(YAHOO.util.Cookie.get("org.sarsoft.browsersettings"))
			if(config.datanavstate != null) {
				this.state = config.datanavstate;
				this.offset = config.datanavoffset || this.offset;
			}
		}

		this.dragbar = jQuery('<div style="visibility: hidden; top: 0; left: 0; position: absolute; z-index: 2000; height: 100%; width: 8px; background-color: black; opacity: 0.4; filter: alpha(opacity=40)"></div>').appendTo(this.imap.container.top);

		this.minmax.bind('drag', function(evt) {
			if(that.state) that.dragbar.css({visibility : 'visible', left : Math.max(evt.offsetX - 8, that.min_offset) + "px"});
		});
		
		this.minmax.bind('dragend', function(evt) {
			if(that.state) {
				that.dragbar.css({visibility: 'hidden', left: '0px'});
				that.offset = Math.max(evt.offsetX, that.min_offset);
				that.showDataNavigator();
			}
		});
	}
	
	this.minmax.click(function(event) {
		that.state = !that.state;
		if(that.state) {
			that.showDataNavigator();
		} else {
			that.hideDataNavigator();
		}
	});

	this.imap.container.right.append(this.minmax);

	if(this.state) {
		this.showDataNavigator();
	} else {
		this.hideDataNavigator();
	}

}

org.sarsoft.DataNavigatorToggleControl.prototype.setCookie = function() {
	if(this.mobile) return;
	var config = (YAHOO.util.Cookie.exists("org.sarsoft.browsersettings") ? YAHOO.lang.JSON.parse(YAHOO.util.Cookie.get("org.sarsoft.browsersettings")) : {});
	config.datanavstate = this.state;
	config.datanavoffset = this.offset;
	YAHOO.util.Cookie.set("org.sarsoft.browsersettings", YAHOO.lang.JSON.stringify(config));
}

org.sarsoft.DataNavigatorToggleControl.prototype.showDataNavigator = function(skipCookie) {
	this.minmax[0].title = "Hide Left Bar";
	var center = this.map.getCenter();
	if(this.mobile) {
		this.imap.container.top.css("padding-left", "0");
		this.imap.container.right.css({display: "none"});
		this.imap.container.left.css({width: "100%", position: "absolute", display : "block", "margin-left": "0"});
		if(this.imap.registered["org.sarsoft.view.MapDialog"] != null) this.imap.registered["org.sarsoft.view.MapDialog"].hide();
		this.imap.register("org.sarsoft.view.MapDialog", this);
	} else {
		var width = this.offset + "px"
		this.imap.container.top.css({"padding-left": width});
		this.imap.container.left.css({width: width, display : "block", "margin-left": "-" + width});
		this.imap.container.right.css({float : "left"});
	}
	google.maps.event.trigger(this.map, 'resize');
	this.map.setCenter(center);
	this.state = true;
	if(!skipCookie) this.setCookie();
}

org.sarsoft.DataNavigatorToggleControl.prototype.hideDataNavigator = function() {
	this.minmax[0].title = "Show Left Bar";
	var center = this.map.getCenter();
	if(this.mobile) {
		this.imap.container.left.css({display: "none"});
		this.imap.container.right.css({display: "block"});
		delete this.imap.registered["org.sarsoft.view.MapDialog"];
	} else {
		this.imap.container.top.css({"padding-left": "0"});
		this.imap.container.left.css({width: "0", "margin-left": "0", display: "none", height: "100%"});
		this.imap.container.right.css({float : "none"});
	}
	google.maps.event.trigger(this.map, 'resize');
	this.map.setCenter(center);
	this.state = false;
	this.setCookie();
}

org.sarsoft.DataNavigatorToggleControl.prototype.hide = function() {
	this.hideDataNavigator();
}

org.sarsoft.PositionInfoControl = function(imap, container) {
	if(imap != null) {
		this.imap = imap;
		imap.register("org.sarsoft.PositionInfoControl", this);
		this.value = (org.sarsoft.touch ? org.sarsoft.PositionInfoControl.CENTER : org.sarsoft.PositionInfoControl.CURSOR);
		this._restoreto = this.value;

		var that = this;
		this.map = imap.map;
		this._show = true;
		
		this.crosshair = jQuery('<img class="noprint" style="visibility: hidden; z-index: 999; position: absolute" src="' + $.img('crosshair.png') + '"/>').appendTo(this.map.getDiv());
		var div = this.div = jQuery('<div style="position: absolute; right: 0; top: ' + imap.map._overlaycontrol.div.height() + 'px; z-index: 1001" class="noprint"></div>').prependTo(container || this.map.getDiv());
		var imgholder = $('<div style="position: absolute; right: 0; top; 0; width: 16px"><img style="position: absolute; right: 0; top: 0" src="' + $.img('left.png') + '"/></div>').appendTo(div);
		this.display = jQuery('<div style="text-align: right; background-color: white; padding-top: 3px; font-weight: bold; white-space: nowrap"></div>').appendTo(div);
				
		this.minmax = $(imgholder.children()[0]).css({'cursor': 'pointer', 'display': 'none'}).attr("title", "click to show coordinates").click(function() {
			that.setValue(that._restoreto);
		});
		this.display.css('cursor', 'pointer').attr("title", "Click to Hide, Right-Click to Configure").click(function(evt) {
			that.setValue(org.sarsoft.PositionInfoControl.NONE);
		});

		this.centerCrosshair();
		
		google.maps.event.addListener(imap.map, "mousemove", function(evt) {
			that.update(that.value == org.sarsoft.PositionInfoControl.CURSOR ? evt.latLng : null);
		});
		google.maps.event.addListener(imap.map, "bounds_changed", function() {
			if(that.value == org.sarsoft.PositionInfoControl.CENTER) that.update(imap.map.getCenter());
		});
		google.maps.event.addListener(imap.map, "resize", function() {
			that.centerCrosshair();
		});
		$(window).resize(function() { that.centerCrosshair(); });
	}
}

org.sarsoft.PositionInfoControl.NONE = 0;
org.sarsoft.PositionInfoControl.CURSOR = 1;
org.sarsoft.PositionInfoControl.CENTER = 2;

org.sarsoft.PositionInfoControl.prototype.centerCrosshair = function() {
	var div = $(this.imap.map.getDiv());
	this.crosshair.css({left: Math.round(div.width()/2)-8 + "px", top: Math.round(div.height()/2)-8 + "px"});
	this.update(this.imap.map.getCenter());
}

org.sarsoft.PositionInfoControl.prototype.update = function(gll) {
	this.div.css('top', this.imap.map._overlaycontrol.div.height() + 'px');
	if(gll == null) return;
	var datumll = GeoUtil.fromWGS84(gll);
	var utm = GeoUtil.GLatLngToUTM(datumll);
	var message = utm.toHTMLString() + "<br/>";
	if(this.imap != null && this.imap.registered["org.sarsoft.UTMGridControl"] != null) {
		if(org.sarsoft.EnhancedGMap._coordinates == "DD") {
			message = message + GeoUtil.formatDD(datumll.lat()) + ", " + GeoUtil.formatDD(datumll.lng());
		} else if(org.sarsoft.EnhancedGMap._coordinates == "DMH") {
			message = message + GeoUtil.formatDDMMHH(datumll.lat()) + ", " + GeoUtil.formatDDMMHH(datumll.lng());
		} else {
			message = message + GeoUtil.formatDDMMSS(datumll.lat()) + ", " + GeoUtil.formatDDMMSS(datumll.lng());
		}
	}
	this.display.html(message);
}

org.sarsoft.PositionInfoControl.prototype.setValue = function(value) {
	if(value == org.sarsoft.PositionInfoControl.NONE) {
		this._restoreto = this.value;
		this.display.css('display', 'none');
		this.crosshair.css('visibility', 'hidden');
	} else if (value == org.sarsoft.PositionInfoControl.CURSOR) {
		this.display.css('display', 'block');
		this.crosshair.css('visibility', 'hidden');
	} else {
		this.update(this.imap.map.getCenter());
		this.display.css('display', 'block');		
		this.crosshair.css('visibility', 'visible');
	}
	this.value = value;
	this.minmax.css("display", (value == org.sarsoft.PositionInfoControl.NONE ? "inline" : "none"));
}

org.sarsoft.MapLabelWidget = function(imap) {
	var that = this;
	this.imap = imap;
	this.label = "backlit";
	var div = $('<div title="Applies to labeled map objects like markers and shapes">Show Labels</div>').appendTo(imap.controls.settings);
	this.cb1 = $('<input type="checkbox"/>').prependTo(div).change(function() { that.readCBs(); that.handleConfigChange() });
	this.cb2 = $('<input type="checkbox"/>').appendTo(div).change(function() { that.readCBs(); that.handleConfigChange() });
	div.append('as Opaque');

	this.writeCBs();
	this.handleConfigChange();
	imap.register("org.sarsoft.MapLabelWidget", this);
}

org.sarsoft.MapLabelWidget.prototype.readCBs = function() {
	var v1 = this.cb1[0].checked;
	var v2 = this.cb2[0].checked;
	this.label = (v1 ? (v2 ? "backlit" : "normal") : "hidden");
}

org.sarsoft.MapLabelWidget.prototype.writeCBs = function() {
	this.cb1[0].checked = (this.label != "hidden");
	this.cb2[0].checked = (this.label == "backlit");
}

org.sarsoft.MapLabelWidget.prototype.handleConfigChange = function() {
	var container = this.imap.map.getDiv();
	YAHOO.util.Dom.removeClass(container, "maplabelnormal");
	YAHOO.util.Dom.removeClass(container, "maplabelbacklit");
	YAHOO.util.Dom.removeClass(container, "maplabelhidden");
	YAHOO.util.Dom.addClass(container, "maplabel" + this.label);
}

org.sarsoft.MapLabelWidget.prototype.setConfig = function(config) {
	if(config.MapLabelWidget == null) return;
	this.label = config.MapLabelWidget.label;
	this.writeCBs();
	this.handleConfigChange();
}

org.sarsoft.MapLabelWidget.prototype.getConfig = function(config) {
	if(config.MapLabelWidget == null) config.MapLabelWidget = new Object();
	config.MapLabelWidget.label = this.label;
	return config;
}

org.sarsoft.MapFindWidget = function(imap) {
	var that = this;
	this.imap = imap;
	this.state = false;
	
	imap.register("org.sarsoft.MapFindWidget", this);

	this.container = jQuery('<span style="white-space: nowrap; color: black"></span>').append(this.find);
	this.f1 = $('<span class="underlineOnHover" style="margin-left: 3px; font-size: 110%"><img src="' + $.img('find.png') + '" style="vertical-align: text-top; margin-right: 3px"/>Find</span>').appendTo(this.container).attr("title", "Center the Map on a Coordinate or Named Place").click(function() {
		that.setState(!that.state);
	});
	this.f2 = $('<span style="margin-left: 3px"></span>').appendTo(this.container);
	this.f2.append($('<img src="' + $.img('find.png') + '" style="cursor: pointer; vertical-align: text-top; margin-right: 3px"/>').click(function() {
		that.setState(!that.state);
	}));

	this.locationEntryForm = new org.sarsoft.ThinLocationForm();
	this.locationEntryForm.create(this.f2, function() {
		that.locationEntryForm.read(function (gll) {that.imap.setCenter(gll, 14);});
	});
	
	var go = jQuery('<button>GO</button>').appendTo(this.f2)
	go.click(function() {
		var entry = that.locationEntryForm.read(function(gll) { that.imap.setCenter(gll, 14);});
	});
	
	if(typeof(navigator.geolocation) != "undefined") {
		this.mylocation = jQuery('<img src="' + $.img('location.png') + '" style="margin-left: 3px; cursor: pointer; vertical-align: middle" title="Go to Your Current Location"/>').appendTo(this.f2).click(function() {
			navigator.geolocation.getCurrentPosition(function(pos) {
				that.imap.setCenter(new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude), 14);
			}, function() { alert("Unable to determine your location.")});
		});
	}
	
	this.setState(false);

	imap.addMenuItem(this.container[0], 15);
}

org.sarsoft.MapFindWidget.prototype.setState = function(state) {
	this.state = state;
	if(this.state) {
		this.f2.css('display', 'inline');
		this.f1.css('display', 'none');
		this.locationEntryForm.clear();
		if(typeof google.maps.Geocoder != 'undefined' && !org.sarsoft.touch) {
			this.locationEntryForm.address.focus();
		}
	} else {
		this.f1.css('display', 'inline');
		this.f2.css('display', 'none');
		if(org.sarsoft.touch && this.mylocation != null) this.mylocation.css('display', 'inline');
	}
 }

// Like a map dialog, but supports reading / writing an entity form
org.sarsoft.view.MapEntityDialog = function(imap, title, entityform, handler, okButton) {
	if(imap == null) return;
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
	this.state = false;
	var dlgStyle = {width: "300px", position: "absolute", top: "0px", left: "0px", "z-index": "2500"};
	if(style != null) for(var key in style) {
		dlgStyle[key] = style[key];
	}
	
	if(typeof(bodynode)=="string") bodynode = jQuery('<div>' + bodynode + '</div>')[0];
	
	var dlg = jQuery('<div></div>');
	dlg.css(dlgStyle);
	dlg.css('display', 'none'); // on small sreens, hiddend dialogs cause phantom scrollbars
	this.hd = jQuery('<div class="hd">' + title + '</div>').appendTo(dlg);
	this.bd = jQuery('<div class="bd"></div>').appendTo(dlg);
	this.bd.append(bodynode);
	this.ft = jQuery('<div class="ft"></div>').appendTo(dlg);

	var ok = function() {
		handler();
		that.dialog.hide();
	}

	var buttons = new Array();
	if(yes != null) {
		buttons.push({ text : yes, handler: ok, isDefault: true});
	}
	if(no != null) {
		buttons.push({text : no, handler : function() { that.dialog.hide(); }});
	}
	this.dialog = new YAHOO.widget.Dialog(dlg[0], {buttons: buttons});
	this.dialog.render(document.body);
	this.dialog.hide();
	this.dialog.ok = ok;
	this.dlg = dlg;
	
	this.dialog.hideEvent.subscribe(function() {
		dlg.css('display', 'none');
		that.bd.css('height', 'auto');
		that.imap.container.right.css('visibility', 'visible');
		that.imap.map.getDiv().style.height = that._originalContainerHeight;
		google.maps.event.trigger(that.imap.map, 'resize');
		delete that.imap.registered["org.sarsoft.view.MapDialog"];
		that.state = false;
	});
}

org.sarsoft.view.MapDialog.prototype.show = function() {
	if(this.imap.registered["org.sarsoft.view.MapDialog"] != null) this.imap.registered["org.sarsoft.view.MapDialog"].hide();
	this.dlg.css('display', 'block');
	this.state = true;
	this.imap.register("org.sarsoft.view.MapDialog", this);
	this._originalContainerHeight = this.imap.map.getDiv().style.height;
	var container = $(this.imap.map.getDiv());
	this.dlg.css({left: '0px', top: '0px', 'width': (container.width()-2) + "px"});
	this.dialog.show();
	var dlgHeight = this.hd.outerHeight()+this.bd.outerHeight()+this.ft.outerHeight()+2;
	if($.browser.mozilla) dlgHeight = dlgHeight + 1;
	var height = (container.height() - dlgHeight);
	if(!org.sarsoft.mobile) {
		container.css('height', height+"px");
		this.dlg.css({left: (container.offset().left+1) + "px", top: height + "px"});
	} else {
		this.imap.container.right.css('visibility', 'hidden');
		this.bd.css('height', (container.height()-this.hd.outerHeight()-this.ft.outerHeight()-(this.bd.outerHeight()-this.bd.height())-2)+"px");
	}
	if(org.sarsoft.touch) this.dialog.focusFirstButton(); // prevent keyboard from popping up
}

org.sarsoft.view.MapDialog.prototype.hide = function() {
	delete this.imap.registered["org.sarsoft.view.MapDialog"];
	this.state = false;
	this.dialog.hide();
}

org.sarsoft.view.MapDialog.prototype.swap = function() {
	this.state=!this.state;
	if(this.state) {
		this.show();
	} else {
		this.hide();
	}
}

org.sarsoft.view.MapRightPane = function(imap, bodynode) {
	var that = this;
	this.imap = imap;
	var pane = jQuery('<div style="width: 100%; height: 100%; background-color: white; z-index: 2000; display: none; position: absolute; top: 0px; left: 0px; overflow-y: auto"></div>').appendTo(imap.container.right);
	var close = jQuery('<div style="cursor: pointer; float: right; font-size: 200%; font-weight: bold; color: red; padding-right: 5px">X</div>').appendTo(bodynode);
	jQuery('<div style="height: 100%; padding-left: 10px; border-left: 2px solid #666666;"></div>').appendTo(pane).append(bodynode);
	if(org.sarsoft.touch) {
		pane.css({'height': 'auto', 'width': 'auto', 'min-width': '100%'});
	}
	this.pane = pane;
	close.click(function() {
		that.hide();
	});
}

org.sarsoft.view.MapRightPane.prototype.visible = function() {
	return this.pane.css('display') == 'block';
}

org.sarsoft.view.MapRightPane.prototype.show = function() {
	if(this.imap.registered["org.sarsoft.view.MapDialog"] != null) this.imap.registered["org.sarsoft.view.MapDialog"].hide();
	this.imap.register("org.sarsoft.view.MapDialog", this);
	if(org.sarsoft.touch) $(this.imap.map.getDiv()).css('visibility', 'hidden');
	this.pane.css('display', 'block');
}

org.sarsoft.view.MapRightPane.prototype.hide = function() {
	delete this.imap.registered["org.sarsoft.view.MapDialog"];
	this.pane.css('display', 'none');
	if(org.sarsoft.touch) $(this.imap.map.getDiv()).css('visibility', 'visible');
}


org.sarsoft.ProjectionCaptureOverlay = function(imap) {
	this.imap = imap;
	this.setMap(imap.map);
}
org.sarsoft.ProjectionCaptureOverlay.prototype = new google.maps.OverlayView();
org.sarsoft.ProjectionCaptureOverlay.prototype.onAdd = function() {}
org.sarsoft.ProjectionCaptureOverlay.prototype.onRemove = function() {}
org.sarsoft.ProjectionCaptureOverlay.prototype.draw = function() {
	$(this.getPanes().mapPane).parent().addClass("printimgabsolute");
	$('a[href^="http://maps.google.com"]').children().addClass("gmnoprint");
	this.imap.projection = this.getProjection();
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
	this.controls = { settings: $('<div></div>'), settings_browser: $('<div></div>') }
	this._handlers = new Object();
	this._contextMenu = new org.sarsoft.view.ContextMenu();
	this._contextMenu._vertex;
	this._nextID = 0;
	this._menuItems = [{ text: "Delete Vertex", applicable: function() {var g = that._contextMenu._gmapobj; return g != null && g.getEditable != null && g.getEditable() && that._contextMenu._vertex != null && (g.getPath().getLength() > 3 || (g.getPath().getLength() > 2 && g.getPaths == null)) }, handler: function(obj) { that._contextMenu._gmapobj.getPath().removeAt(that._contextMenu._vertex); } }];

	this._menuItemsOverride = null;
	this.registered = new Object();
	this._mapInfoMessages = new Object();
	
	if(typeof map == undefined) return;
	this.map._imap = this;

	this.projection = false;
	var pco = new org.sarsoft.ProjectionCaptureOverlay(this);
	this.drawingManager = new google.maps.drawing.DrawingManager({map: map, drawingMode: null, drawingControl: false});
	
	google.maps.event.addListener(map, "rightclick", function(evt) {
		that.click(evt);
	});	

	this.container = new Object();
	if(options.container != null) {
		this.container.top = $(options.container);
		this.container.left = $(this.container.top.children()[0]);
		this.container.right = $(this.container.top.children()[1]);
		this.container.canvas = $(this.container.right[0]);

		this.container.top.addClass("printnooffset");
		if(org.sarsoft.touch) {
			this.container.left.css({position : "absolute", display : "none", height: "100%"});
			this.container.right.css({position : "relative", width : "100%", height: "100%"});
		} else {
			this.container.top.css({height : "100%"});
			this.container.left.css({position : "relative", float : "left", height: "100%", display : "none", "overflow-y" : "auto"});
			this.container.right.css({position : "relative", width : "100%", height: "100%"});
		}
		
		map._overlaycontrol.div.prependTo(this.container.right);
	} else {
		this.container.top = this.container.left = this.container.right = this.container.canvas = $('<div></div>');
	}
	
	this.dn = options.dn ? new options.dn(this) : new org.sarsoft.DataNavigator(this);
	this.dn.toggle = new org.sarsoft.DataNavigatorToggleControl(this);

	this.loadBrowserSettings();
	this.mapMessageControl = new org.sarsoft.MapMessageControl(this.map);
	this._mapInfoControl = new org.sarsoft.MapInfoControl(this.map);
	
	options = options || {};
	if(options.positionWindow) this.positionInfoControl = new org.sarsoft.PositionInfoControl(this, this.container.right);
	new org.sarsoft.MapDatumWidget(this, options.switchableDatum);
	new org.sarsoft.MapDeclinationWidget(this);
	if(options.find) new org.sarsoft.MapFindWidget(this);
	if(options.label) new org.sarsoft.MapLabelWidget(this);
	if(options.UTM) new org.sarsoft.UTMGridControl(this);

	$(map.getDiv()).addClass("printnotransform");
}

org.sarsoft.InteractiveMap.prototype.checkID = function(obj) {
	if(obj.id != null) {
		this._nextID = Math.max(this._nextID, obj.id+1);
	} else {
		obj.id = this._nextID++;
	}
}

org.sarsoft.InteractiveMap.prototype.click = function(evt, obj) {
	this._contextMenu._vertex = evt.vertex;
	this._contextMenu._gmapobj = obj;
	if(this._selected != null) {
		obj = this._selected;
	}
	var point = this.projection.fromLatLngToContainerPixel(evt.latLng);
	if(this._menuItems.length > 0  && this._menuItemsOverride == null) {
		this._contextMenu.setItems(this._menuItems)
		var offset = $(this.map.getDiv()).offset();
		this._contextMenu.show(point, obj, new google.maps.Point(point.x + offset.left, point.y + offset.top));
	}
	if(typeof this._handlers["singlerightclick"] != "undefined") {
		for(var i = 0; i < this._handlers["singlerightclick"].length; i++) {
			this._handlers["singlerightclick"][i](point, obj);
		}
	}
}

org.sarsoft.InteractiveMap.prototype.loadBrowserSettings = function(config) {
	if(config == null && YAHOO.util.Cookie.exists("org.sarsoft.browsersettings")) {
		config = YAHOO.lang.JSON.parse(YAHOO.util.Cookie.get("org.sarsoft.browsersettings"));
	}
	if(config != null) this.map.setOptions({scrollwheel: config.scrollwheelzoom, scaleControl: config.scalebar});
}

org.sarsoft.InteractiveMap.prototype.updateDatum = function() {
	for(var key in this.markers) {
		var m = this.markers[key];
		this.addWaypoint(m.waypoint, m.config, m.tooltip, m.label);
	}
	if(this.registered["org.sarsoft.UTMGridControl"] != null) this.registered["org.sarsoft.UTMGridControl"]._drawUTMGrid(true);
}


org.sarsoft.InteractiveMap.prototype.nameToAlias = function(name) {
	for(var i = 0; i < sarsoft.map.layers.length; i++) {
		if(name == sarsoft.map.layers[i].name) return sarsoft.map.layers[i].alias;
	}
	return name;
}

org.sarsoft.InteractiveMap.prototype.aliasToName = function(alias) {
	if(alias == null) return null;
	for(var i = 0; i < sarsoft.map.layers.length; i++) {
		if(alias == sarsoft.map.layers.alias) return sarsoft.map.layers[i].name;
	}
	for(var i = 0; i < sarsoft.map.layers.length; i++) {
		if(alias.replace(/ \(.*\)/, "") == sarsoft.map.layers[i].name.replace(/ \(.*\)/, "")) return sarsoft.map.layers[i].name;
	}
	return alias;
}

org.sarsoft.InteractiveMap.prototype.getConfig = function(config) {
	return this.map._overlaycontrol.getConfig(config);
}

org.sarsoft.InteractiveMap.prototype.setConfig = function(config) {
	this.map._overlaycontrol.setConfig(config);
}

org.sarsoft.InteractiveMap.prototype.setMapLayers = function(base, layers, opacity, alphas) {
	if(base != null) this.map._overlaycontrol.updateMap(base, layers, opacity, alphas);
}

org.sarsoft.InteractiveMap.prototype._createPolygon = function(vertices, config) {
	var that = this;
	var color = config.color;
	if(config.opacity == null) config.opacity = 100;
	if(config.fill == null) config.fill = 35
	if(config.weight == null) config.weight = 2;
	return new google.maps.Polygon({map: this.map, paths: vertices, strokeColor: config.color, strokeOpacity: config.opacity/100, strokeWeight: config.weight, fillColor: config.color, fillOpacity: config.fill/100});
}

org.sarsoft.InteractiveMap.prototype._createPolyline = function(vertices, config) {
	if(config.opacity == null) config.opacity = 100;
	if(config.weight == null) config.weight = 3;
	return new google.maps.Polyline({map: this.map, path: vertices, strokeColor: config.color, strokeOpacity: config.opacity/100, strokeWeight: config.weight});
}

org.sarsoft.InteractiveMap.prototype._removeOverlay = function(way) {
	this.unselect(way);
	var overlay = this.polys[way.id].overlay;
	google.maps.event.clearListeners(overlay, "mouseover");
	google.maps.event.clearListeners(overlay, "mouseout");
	overlay.setMap(null);
	if(overlay.label != null) overlay.label.setMap(null);
}

org.sarsoft.InteractiveMap.prototype._addOverlay = function(way, config, label) {
	var that = this;
	var id = way.id;
	var vertices = new Array();
	var labelOverlay = null;
	if(config == null) config = new Object();
	if(typeof way.waypoints != "undefined" && way.waypoints != null) {
		// all this sw/labelwpt/distance junk is simply to place the label on the bottom-right waypoint
		var sw = new google.maps.LatLng(way.boundingBox[0].lat, way.boundingBox[0].lng);
		var labelwpt = way.waypoints[0];
		var distance = 0;
		
		var lat = 0;
		var lng = 0;
		for(var i = 0; i < way.waypoints.length; i++) {
			var wpt = way.waypoints[i];
			var gll = new google.maps.LatLng(wpt.lat, wpt.lng);
			vertices.push(gll);
			if(google.maps.geometry.spherical.computeDistanceBetween(sw, gll) > distance) {
				distance = google.maps.geometry.spherical.computeDistanceBetween(sw, gll);
				labelwpt = wpt;
			}
			lat = lat + way.waypoints[i].lat;
			lng = lng + way.waypoints[i].lng;
		}
		var style = "max-width: 8em";
		if(way.polygon) {
			labelwpt = {lat : lat/way.waypoints.length, lng : lng/way.waypoints.length}
		} else if(way.waypoints.length > 1) {
			var i = Math.floor((way.waypoints.length-1)/2);
			if(way.waypoints.length < 3) i = 0;
			labelwpt = {lat : (way.waypoints[i].lat + way.waypoints[i+1].lat)/2, lng : (way.waypoints[i].lng + way.waypoints[i+1].lng)/2};
		}
		if(label != null) {
			labelOverlay = new Label(this.map, new google.maps.LatLng(labelwpt.lat, labelwpt.lng), "<span class='maplabel'>" + label + "</span>", style, null, new google.maps.Size(-0.5, -0.5));
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
	google.maps.event.addListener(poly, "mouseover", function() {
		if(config.clickable) that.select(way);
		if(config.displayMessage == null) {
			that._infomessage(way.name);
		} else {
			that._infomessage(config.displayMessage);
		}
	});
	google.maps.event.addListener(poly, "mousemove", function(evt) {
		if(that.registered["org.sarsoft.PositionInfoControl"] != null && that.registered["org.sarsoft.PositionInfoControl"].value == org.sarsoft.PositionInfoControl.CURSOR) that.registered["org.sarsoft.PositionInfoControl"].update(evt.latLng);
	});
	google.maps.event.addListener(poly, "mouseout", function() {
		if(config.clickable) that.unselect(way);
	});
	if(config.clickable) {
		google.maps.event.addListener(poly, "rightclick", function(evt) {
			that.click(evt, poly);
		});
	}
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
		overlay.setOptions({strokeWeight: (config.weight != null) ? config.weight + 1 : 4});
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
		overlay.setOptions({strokeWeight: (config.weight != null) ? config.weight : 3})
	}
}

org.sarsoft.InteractiveMap.prototype.removeWay = function(way) {
	this.checkID(way);
	this.unselect(way);
	var id = way.id;
	if(typeof this.polys[id] != "undefined") {
		this._removeOverlay(way);
		delete this.polys[id];
	}
}


org.sarsoft.InteractiveMap.prototype.addWay = function(way, config, label) {
	this.checkID(way);
	this.removeWay(way);
	this.polys[way.id] = { way: way, overlay: this._addOverlay(way, config, label), config: config};
}

org.sarsoft.InteractiveMap.prototype.addRangeRing = function(center, radius, vertices) {
	var glls = new Array();
	var centerUTM = GeoUtil.GLatLngToUTM(new google.maps.LatLng(center.lat, center.lng));
	for(var i = 0; i <= vertices; i++) {
		var vertexUTM = new UTM(centerUTM.e + radius*Math.sin(i*2*Math.PI/vertices), centerUTM.n + radius*Math.cos(i*2*Math.PI/vertices), centerUTM.zone);
		glls.push(GeoUtil.UTMToGLatLng(vertexUTM));
	}
	var poly = new google.maps.Polyline({map: this.map, path: glls, strokeColor: "#000000", strokeOpacity: 1, strokeWeight: 1});
	this.rangerings.push(poly);

	var labelUTM = new UTM(centerUTM.e, 1*centerUTM.n + 1*radius, centerUTM.zone);
	var label = new Label(this.map, GeoUtil.UTMToGLatLng(labelUTM), "<span class='maplabel'>" + radius + "m</span>", "", new google.maps.Size(-6, -4));
	this.rangerings.push(label);
}

org.sarsoft.InteractiveMap.prototype.removeRangeRings = function() {
	for(var i = 0; i < this.rangerings.length; i++) {
		this.rangerings[i].setMap(null);
	}
	this.rangerings = new Array();
}

org.sarsoft.InteractiveMap.prototype._removeMarker = function(waypoint) {
	this.unselect(waypoint);
	var marker = this.markers[waypoint.id].marker;
	google.maps.event.clearListeners(marker, "mouseover");
	google.maps.event.clearListeners(marker, "mouseout");
	marker.setMap(null);
	if(marker.label != null) marker.label.setMap(null);
}

org.sarsoft.InteractiveMap.prototype._addMarker = function(waypoint, config, tooltip, label) {
	var that = this;
	var id = waypoint.id;
	var gll = new google.maps.LatLng(waypoint.lat, waypoint.lng);
	var icon = (config.icon) ? config.icon : org.sarsoft.MapUtil.createFlatCircleImage(config.color);
	var tt = tooltip;
	if(typeof tt == "undefined") tt = waypoint.name;
	tt = tt +  "  (" + GeoUtil.GLatLngToUTM(GeoUtil.fromWGS84(new google.maps.LatLng(waypoint.lat, waypoint.lng))).toString() + ")";
	var marker = new google.maps.Marker({title: tt, icon: icon, position: gll, map: this.map, shape: icon.shape });
	
	if(config.drag != null) {
		marker.setDraggable(true);
		google.maps.event.addListener(marker, "dragend", function() { config.drag(marker.getPosition())});
	}
	google.maps.event.addListener(marker, "mouseover", function() {
		if(config.displayMessage == null) {
			that._infomessage(label);
		} else {
			that._infomessage(config.displayMessage);
		}
	});
	marker.id = waypoint.id;
	if(label != null && config.drag == null) {
		var s = icon.size || icon.scaledSize;
		labelOverlay = new Label(this.map, gll, "<span class='maplabel'>" + label + "</span>", "width: 8em", icon.anchor ? new google.maps.Size(s-icon.anchor.x, -1*icon.anchor.y) : new google.maps.Size(s.width*0.5, s.height*-0.5));
		marker.label = labelOverlay;
	}
	if(config.clickable)  {
		google.maps.event.addListener(marker, "mouseover", function() {
			that.select(waypoint);
		});
		google.maps.event.addListener(marker, "mouseout", function() {
			that.unselect(waypoint);
		});
		google.maps.event.addListener(marker, "rightclick", function(evt) {
			that.click(evt, marker);
		});
	}
	this.markers[waypoint.id] = { waypoint: waypoint, marker: marker, config: config, tooltip : tooltip, label : label};
	return marker;
}

org.sarsoft.InteractiveMap.prototype.removeWaypoint = function(waypoint) {
	this.checkID(waypoint);
	this.unselect(waypoint);
	var id = waypoint.id;
	if(typeof this.markers[id] != "undefined") {
		this._removeMarker(waypoint);
		delete this.markers[id];
	}
}

org.sarsoft.InteractiveMap.prototype.addWaypoint = function(waypoint, config, tooltip, label) {
	this.checkID(waypoint);
	this.removeWaypoint(waypoint);
	this._addMarker(waypoint, config, tooltip, label);
}

org.sarsoft.InteractiveMap.prototype.allowDragging = function(waypoint) {
	var that = this;
	var objs = this.markers[waypoint.id];
	this._removeMarker(waypoint);
	objs.config.drag = function(gll) {
	}
	this._addMarker(waypoint, objs.config, "Drag Me!", objs.label);
}

org.sarsoft.InteractiveMap.prototype.saveDrag = function(waypoint) {
	var objs = this.markers[waypoint.id];
	google.maps.event.clearListeners(objs.marker, "drag");
	this._removeMarker(waypoint);
	var gll = objs.marker.getPosition();
	waypoint.lat=gll.lat();
	waypoint.lng=gll.lng();
	objs.config.drag = null;
	this._addMarker(waypoint, objs.config, objs.tooltip, objs.label);
}

org.sarsoft.InteractiveMap.prototype.discardDrag = function(waypoint) {
	var objs = this.markers[waypoint.id];
	google.maps.event.clearListeners(objs.marker, "drag");
	this._removeMarker(waypoint);
	objs.config.drag = null;
	this._addMarker(waypoint, objs.config, objs.tooltip, objs.label);
}

org.sarsoft.InteractiveMap.prototype.dragOnce = function(waypoint, callback) {
	var that = this;
	var objs = this.markers[waypoint.id];
	this._removeMarker(waypoint);
	objs.config.drag = function(gll) {
		google.maps.event.clearListeners(objs.marker, "drag");
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
			that.projection.fromContainerPixelToLatLng(new google.maps.Point(point.x - 25, point.y - 25)),
			that.projection.fromContainerPixelToLatLng(new google.maps.Point(point.x + 25, point.y - 25)),
			that.projection.fromContainerPixelToLatLng(new google.maps.Point(point.x + 25, point.y + 25)),
			that.projection.fromContainerPixelToLatLng(new google.maps.Point(point.x - 25, point.y + 25)),
			that.projection.fromContainerPixelToLatLng(new google.maps.Point(point.x - 25, point.y - 25))
			];
	} else {
		vertices = [
			that.projection.fromContainerPixelToLatLng(new google.maps.Point(point.x - 40, point.y)),
			that.projection.fromContainerPixelToLatLng(new google.maps.Point(point.x + 40, point.y))
		];
	}
	return this._GLatLngListToWpt(vertices);
}

org.sarsoft.InteractiveMap.prototype._getPath = function(overlay) {
	if(overlay.getPath != null) {
		return overlay.getPath();
	} else {
		return overlay.getPaths().getAt(0);
	}
}

org.sarsoft.InteractiveMap.prototype._buildGLatLngListFromOverlay = function(overlay) {
	var vertices = new Array();
	var path = this._getPath(overlay);
	for(var i = 0; i < path.getLength(); i++) {
		vertices.push(path.getAt(i));
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
	this.polys[id].overlay.setEditable(true);
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
	this.unselect(this.polys[id].way);
	this.polys[id].overlay.setMap(null);
	if(this.polys[id].overlay.label != null) this.polys[id].overlay.label.setMap(null);	
	
	var config = this.polys[id].config;
	this.drawingManager.setOptions({polygonOptions: {strokeColor: config.color, strokeOpacity: config.opacity/100, strokeWeight: config.weight, fillColor: config.color, fillOpacity: config.fill/100},
		polylineOptions: {strokeColor: config.color, strokeOpacity: config.opacity/100, strokeWeight: config.weight}});
	this.drawingManager.setDrawingMode(this.polys[id].way.polygon ? google.maps.drawing.OverlayType.POLYGON : google.maps.drawing.OverlayType.POLYLINE);

	if(onEnd == null) onEnd = function() { that.edit(id); }
	if(onCancel == null) onCancel = function() { that.discard(id); }
	this.lockContextMenu();
	
	var release = function() {
		google.maps.event.removeListener(that.complete);
		that.unlockContextMenu();
		$(document).unbind("keydown", that.fn);
		that.drawingManager.setOptions({drawingMode: null});
	}

	this.fn = function(e) {
		if(e.which == 27) {
			that.drawingManager.setOptions({drawingMode: null});
		}
	}
	$(document).bind("keydown", this.fn);
	
	this.complete = google.maps.event.addListener(this.drawingManager, this.polys[id].way.polygon ? "polygoncomplete" : "polylinecomplete", function(poly) {
		release();
		var path = that._getPath(poly);
		poly.setMap(null);
		if((that.polys[id].way.polygon && path.getLength() < 3) || (!that.polys[id].way.polygon && path.getLength() < 2)) {
			window.setTimeout(onCancel, 200);
		} else {
			if(that.polys[id].overlay.setPath != null) {
				that.polys[id].overlay.setPath(path);
			} else {
				that.polys[id].overlay.setPaths(path);
			}
			that.polys[id].overlay.setMap(that.map);
			window.setTimeout(onEnd, 200);
		}
	});
}

org.sarsoft.InteractiveMap.prototype.save = function(id) {
	var poly = this.polys[id];
	poly.overlay.setEditable(false);
	return this._GLatLngListToWpt(this._buildGLatLngListFromOverlay(poly.overlay));
}

org.sarsoft.InteractiveMap.prototype.discard = function(id) {
	var label = this.polys[id].overlay.label;
	this._removeOverlay(this.polys[id].overlay);
	this.polys[id].overlay = this._addOverlay(this.polys[id].way, this.polys[id].config);
	this.polys[id].overlay.label = label;
	label.setMap(this.map);
}

org.sarsoft.InteractiveMap.prototype.addListener = function(event, handler) {
	if(typeof this._handlers[event] == "undefined") this._handlers[event] = new Array();
	this._handlers[event].push(handler);
}

org.sarsoft.InteractiveMap.prototype.addContextMenuItems = function(items) {
	this._menuItems = this._menuItems.concat(items);
}

org.sarsoft.InteractiveMap.prototype.setBounds = function(bounds) {
	this.map.fitBounds(bounds);
	this._boundsInitialized = true;
}

org.sarsoft.InteractiveMap.prototype.growMap = function(gll) {
	var bounds = this.map.getBounds();
	bounds.extend(gll);
	this.map.fitBounds(bounds);
}

org.sarsoft.InteractiveMap.prototype.setCenter = function(center, zoom) {
	this.map.setCenter(center);
	if(zoom != null) this.map.setZoom(zoom);
	this._boundsInitialized = true;
}

org.sarsoft.InteractiveMap.prototype.growInitialMap = function(gll) {
	if(this._boundsInitialized) return;
	if(typeof this._boundsInitialized == "undefined") {
		this._boundsInitialized = false;
		this._bounds = new google.maps.LatLngBounds(gll, gll);
		this.map.setCenter(gll);
		this.map.setZoom(15);
	} else {
		this._bounds.extend(gll);
		this.map.fitBounds(this._bounds);
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
	var extras = this.map._overlaycontrol.extras;
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
	this.track = !org.sarsoft.mobile;
	
	if(!readonce) {
		imap.register("org.sarsoft.MapURLHashWidget", this);
		if(!org.sarsoft.mobile) {
			this.cb = $('<input type="checkbox"/>').prependTo($('<div title="The page URL will update to reflect the map center and layers, but not unsaved data.">Update URL on Map Move</div>').appendTo(imap.controls.settings)).change(function() {
				that.track = that.cb[0].checked;
				if(!that.track) {
					window.location.hash="";
				} else {
					that.saveMap();
				}
			})
			this.cb[0].checked = this.track;
		}

	}

	org.sarsoft.async(function() {
		that.checkhashupdate();
		google.maps.event.addListener(imap.map, "idle", function() {
			if(!that.ignorehash) that.saveMap();
		});
	});

	if(!readonce) {
		window.setInterval(function() {that.checkhashupdate()}, 500);
	}
}

org.sarsoft.MapURLHashWidget.encodeGeoref = function(imap, alias) {
	var gr = imap
}

org.sarsoft.MapURLHashWidget.createConfigStr = function(imap) {
	var center = imap.map.getCenter();
	var hash = "ll=" + Math.round(center.lat()*100000)/100000 + "," + Math.round(center.lng()*100000)/100000 + "&z=" + map.getZoom();
	var config = imap.getConfig();
	hash = hash + "&b=" + encodeURIComponent(config.base);
	if(config.layers.length > 0) {
		hash = hash + "&o=" + config.layers.join(",") + "&n=" + config.opacity.join(",");
	}
	if(config.alphas != null) hash = hash + "&a=" + config.alphas.join(",");

	var cl = {}
	var geo = imap.registered["org.sarsoft.controller.GeoRefController"];
	if(geo != null && (geo.dao.objs.length > 0)) cl.georefs = geo.dao.dehydrate();
	var cfg = imap.registered["org.sarsoft.controller.ConfiguredLayerController"];
	if(cfg != null && (cfg.dao.objs.length > 0)) cl.cfglayers = cfg.dao.dehydrate();
	if(Object.keys(cl).length > 0) hash = hash + "&cl=" + encodeURIComponent(YAHOO.lang.JSON.stringify(cl));
	
	var pbc = imap.registered["org.sarsoft.PrintBoxController"];
	if(pbc != null) hash = hash + "&print=" + encodeURIComponent(YAHOO.lang.JSON.stringify(pbc.getURLState()));
	return hash;
}

org.sarsoft.MapURLHashWidget.prototype.saveMap = function() {
	var hash = org.sarsoft.MapURLHashWidget.createConfigStr(this.imap);
	if(this.track) {
		this.ignorehash=true;
		window.location.hash=hash;
		this.lasthash=window.location.hash
		this.ignorehash=false;
	}
}

org.sarsoft.MapURLHashWidget.parseConfigStr = function(hash, imap) {
	var props = hash.split("&");
	var config = new Object();
	for(var i = 0; i < props.length; i++) {
		var prop = props[i].split("=");
		if(prop[0] == "center" || prop[0] == "ll") {
			var latlng = prop[1].split(",");
			map.setCenter(new google.maps.LatLng(latlng[0], latlng[1]));
		}
		if((prop[0] == "zoom" || prop[0] == "z") && imap != null) imap.map.setZoom(1*prop[1]);
		if(prop[0] == "base" || prop[0] == "b") config.base = decodeURIComponent(prop[1]);
		if(prop[0] == "overlay" || prop[0] == "o") config.layers = decodeURIComponent(prop[1]).split(",");
		if(prop[0] == "opacity" || prop[0] == "n") config.opacity = prop[1].split(",");
		if(prop[0] == "alphaOverlays" || prop[0] == "a") config.alphas = decodeURIComponent(prop[1]).split(",");
		if(prop[0] == "cl" || prop[0] == "gr") config.cl = YAHOO.lang.JSON.parse(decodeURIComponent(prop[1]));
		if(prop[0] == "print") config.print = YAHOO.lang.JSON.parse(decodeURIComponent(prop[1]));
	}
	if(config.base != null) {
		config.layers = config.layers || [];
		config.opacity = config.opacity || [];
		config.alphas = config.alphas || [];
	}
	return config;
}

org.sarsoft.MapURLHashWidget.prototype.loadMap = function() {
	this.ignorehash=true;
	this.lasthash = window.location.hash;
	var hash = this.lasthash.slice(1);
	var config = org.sarsoft.MapURLHashWidget.parseConfigStr(hash, this.imap);
	if(config.cl != null) {
		var geo = imap.registered["org.sarsoft.controller.GeoRefController"];
		if(geo != null && config.cl.georefs != null) geo.dao.rehydrate(config.cl.georefs);
		if(geo != null && config.cl.length != null) geo.dao.rehydrate(config.cl);
		var cfg = imap.registered["org.sarsoft.controller.ConfiguredLayerController"];
		if(cfg != null && config.cl.cfglayers != null) cfg.dao.rehydrate(config.cl.cfglayers);
	}
	if(config.base != null) this.imap.setConfig(config);
	this.config = config;
	this.ignorehash=false;
	if(config.print != null && this.imap.registered["org.sarsoft.PrintBoxController"] != null) {
		this.imap.registered["org.sarsoft.PrintBoxController"].setURLState(config.print);
	}
}

org.sarsoft.MapURLHashWidget.prototype.checkhashupdate = function() {
	if(this.lasthash != window.location.hash) {
		this.loadMap();
	}
}

org.sarsoft.MapURLHashWidget.prototype.setConfig = function(config) {
	if(config.MapURLHashWidget == null) return;
	this.track = config.MapURLHashWidget.track;
	if(this.cb != null) this.cb[0].checked = this.track
}

org.sarsoft.MapURLHashWidget.prototype.getConfig = function(config) {
	if(config.MapURLHashWidget == null) config.MapURLHashWidget = new Object();
	config.MapURLHashWidget.track = this.track;
	return config;
}

org.sarsoft.MapInfoControl = function(map) {
	var that = this;
	this.minimized = false;
	this.div = jQuery('<div style="position: absolute; right: 0; bottom: 0; z-index: 1000; white-space: nowrap"></div>').appendTo(map.getDiv());
	this.ctrl = jQuery('<span style="background: white" class="noprint"></span>').appendTo(this.div);
	this.min = jQuery('<img style="cursor: pointer; width: 12px; height: 12px" src="' + $.img('right.png') + '"/>').appendTo(this.ctrl);
	this.min.click(function() {
		that.minmax();
	});

	this.premsg = jQuery('<span style="background: white"></span>').appendTo(this.div);
	this.msg = jQuery('<span style="background: white"></span>').appendTo(this.div);
	
	if(org.sarsoft.mobile) this.min.css('display', 'none');
}


org.sarsoft.MapInfoControl.prototype.minmax = function() {
	if(this.minimized) {
		this.ctrl.css("padding-right", "0");
		this.msg.css("display", "inline");
		this.premsg.css("display", "inline");
		this.min.attr("src", $.img('right.png'));
		this.minimized = false;
	} else {
		this.ctrl.css("padding-right", "1em");
		this.premsg.css("display", "none");
		this.msg.css("display", "none");
		this.min.attr("src", $.img('left.png'));
		this.minimized = true;
	}
}

org.sarsoft.MapInfoControl.prototype.setMessage = function(message) {
	this.msg.html(message);
}

if(typeof org.sarsoft.widget == "undefined") org.sarsoft.widget = new Object();

org.sarsoft.widget.MapLayers = function(imap) {
	var that = this;
	
	this.tree = imap.dn.addDataType("Layers");
	if(sarsoft.tenant != null) this.tree.body.css('display', 'none');
	this.tree.block.attr("title", "These are examples of what " + sarsoft.version + " can do.  Click the red +0 or +1 in the top right for more.");

	this.availableLayers = $('<div style="float: right; cursor: pointer; font-weight: normal;"><img style="vertical-align: text-bottom; margin-right: 2px" src="' + $.img('networkfolder.png') + '"/>Customize</div>').insertBefore(imap.map._overlaycontrol.addLayer);
	this.tree.getTool().html('<img src="' + $.img('kml64.png') + '"/>KML').
		attr("title", "Export Map Layers to Google Earth").click(function(evt) { evt.stopPropagation(); window.open("/kmz.html#" + org.sarsoft.MapURLHashWidget.createConfigStr(imap), '_blank'); })
	
	if(sarsoft.map.layers_sample != null) {
		this.sampleMaps = $('<div></div>').appendTo(this.tree.body);
		
		var samples = sarsoft.map.layers_sample.split(';');
		for(var i = 0; i < samples.length; i++) {
			var name = samples[i].split(':')[0];
			var cfg = samples[i].split(':')[1];
			var devnull = function(c) {
				$('<span style="cursor: pointer">&rarr; ' + name + '</span>').appendTo($('<div style="margin-top: 3px;"></div>').appendTo(that.sampleMaps)).click(function() {
				imap.setConfig(org.sarsoft.MapURLHashWidget.parseConfigStr(c));});
			}(cfg);
		}
	}

	var bn = jQuery('<div></div>');
	var layerpane = new org.sarsoft.view.MapRightPane(imap, bn);
	var header = jQuery('<div style="float: left; width: 90%; padding-bottom: 1em"></div>').appendTo(bn);
	jQuery('<div style="font-size: 150%; font-weight: bold">Set Available Data Sources</div>').appendTo(header);
	header.append('<div>You can limit the data sources that appear in the map layer dropdown to easily find the layers you use the most.  You can also enable some layers that are turned off by default.</div>');

	var ok1 = jQuery('<button style="clear: both; font-size: 150%">Save Changes</button>').appendTo(bn);
	var groupedbaselayers = jQuery('<div style="width: 100%; clear: both"></div>').appendTo(bn);
	var ungroupedbaselayers = jQuery('<div style="width: 100%; clear: both"><div style="width: 100%; font-size: 150%; font-weight: bold; padding-top: 1em">Other Layers</div></div>').appendTo(bn);
	var aolayers = jQuery('<div style="width: 100%; clear: both"><div style="font-size: 150%; font-weight: bold; padding-top: 1em">Overlays</div></div>').appendTo(bn);
	var checkboxes = new Object();
	var divs = new Object();
	
	// prioritize page loading
	window.setTimeout(function() {
		var grouping = {};
		if(sarsoft.map.layers_grouping != null) {
			var groups = sarsoft.map.layers_grouping.split(';');
			for(i = 0; i < groups.length; i++) {
				var name = groups[i].split('=')[0];
				var types = groups[i].split('=')[1].split(',');
				for(var j = 0; j < types.length; j++) {
					grouping[types[j]] = name;
				}
			}
		}
		var headers = {}
		
		for(var i = 0; i < sarsoft.map.layers.length; i++) {
			var type = sarsoft.map.layers[i];
			if((type.template || "").indexOf("{V}") > 0) continue;
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
					url = url.replace(/\{Z\}/, 12).replace(/\{X\}/, 657).replace(/\{Y\}/, 1529).replace(/\{V\}/, '');
				}
			} else if(type.type == "WMS") {
				url = "http://s3-us-west-1.amazonaws.com/caltopo/web/" + type.alias + ".jpg";
			} else if(type.type == "NATIVE") {
				url = "http://s3-us-west-1.amazonaws.com/caltopo/web/" + url + ".jpg";
			}
			var img = jQuery('<img style="width: 100px; height: 100px; cursor: pointer; float: left" src="' + url + '"/>').appendTo(div);
			var d2 = jQuery('<div style="float: left; width: 215px; padding-left: 5px"></div>').appendTo(div);
			var cb = jQuery('<input type="checkbox" style="vertical-align: text-top"/>');
			checkboxes[type.alias] = cb;
			var devnull = function(c, d) {
				div.click(function() { c[0].checked = !c[0].checked; c.change(); });
				$(c).change(function() {
					d.children().first().css('opacity', c[0].checked ? '0.2' : '0');
				});
			}(cb, div);
			cb.click(function(evt) { evt.stopPropagation(); });
			d2.append(jQuery('<div style="font-size: 120%; font-weight: bold"></div>').append(checkboxes[type.alias]).append(type.name));
			d2.append('<div>' + type.description + '</div>');
		}
		var ok2 = jQuery('<button style="clear: both; font-size: 150%; margin-top: 1em">Save Changes</button>').appendTo(bn);
		var okhandler = function() {
			sarsoft.map.layers_visible = [];
			for(var i = 0; i < sarsoft.map.layers.length; i++) {
				var type = sarsoft.map.layers[i];
				if(checkboxes[type.alias] && checkboxes[type.alias][0].checked) sarsoft.map.layers_visible.push(type.alias);
			}
			imap.map._overlaycontrol.resetMapTypes(true);
			layerpane.hide();
		}
		ok1.click(okhandler);
		ok2.click(okhandler);
		that.availableLayers.click(function() {
			if(layerpane.visible()) {
				layerpane.hide();
				if(that.layerHandler != null) that.layerHandler();
			} else {
				for(var key in checkboxes) {
					checkboxes[key][0].checked = (sarsoft.map.layers_visible.indexOf(key) >= 0) ? true : false;
					checkboxes[key].change();
				}
				layerpane.show();
			}
		});
	}, 1000);	
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

org.sarsoft.ThinLocationForm = function() {
}

org.sarsoft.ThinLocationForm.prototype.create = function(container, handler, noLookup) {
	var that = this;

	var geocode = !(typeof google.maps.Geocoder == 'undefined' || noLookup);
	this.select = jQuery('<select style="margin-left: 5px">' + (geocode ? '<option value="name">Place Name</option>' : '') + '<option value="UTM">UTM</option><option value="DD">DD</option><option value="DMS">DMS</option><option value="DMH">DMH</option></select>');
	this.select.appendTo(container);
	this.containers = {
			name : jQuery('<span' + (geocode ? '' : ' style="display: none"') + '></span>').appendTo(container),
			UTM : jQuery('<span' + (geocode ? ' style="display: none"' : '') + '></span>').appendTo(container),
			DD : jQuery('<span style="display: none"></span>').appendTo(container),
			DMH : jQuery('<span style="display: none"></span>').appendTo(container),
			DMS : jQuery('<span style="display: none"></span>').appendTo(container)
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
	this.lat = jQuery('<input type="text" size="8" placeholder="Latitude"/>').appendTo(dd);
	dd.append(", ");
	this.lng = jQuery('<input type="text" size="8" placeholder="Longitude"/>').appendTo(dd);
	
	var ddmmhh = this.containers["DMH"];
	this.DDMMHH = new Object();
	this.DDMMHH.latDD = jQuery('<input type="text" size="4" placeholder="Deg"/>').appendTo(ddmmhh);
	ddmmhh.append("\u00B0");
	this.DDMMHH.latMM = jQuery('<input type="text" size="5" placeholder="Min"/>').appendTo(ddmmhh);
	ddmmhh.append("', ");
	this.DDMMHH.lngDD = jQuery('<input type="text" size="4" placeholder="Deg"/>').appendTo(ddmmhh);
	ddmmhh.append("\u00B0");
	this.DDMMHH.lngMM = jQuery('<input type="text" size="5" placeholder="Min"/>').appendTo(ddmmhh);

	var ddmmss = this.containers["DMS"];
	this.DDMMSS = new Object();
	this.DDMMSS.latDD = jQuery('<input type="text" size="4" placeholder="Deg"/>').appendTo(ddmmss);
	ddmmss.append("\u00B0");
	this.DDMMSS.latMM = jQuery('<input type="text" size="2" placeholder="Min"/>').appendTo(ddmmss);
	ddmmss.append("'");
	this.DDMMSS.latSS = jQuery('<input type="text" size="2" placeholder="Sec"/>').appendTo(ddmmss);
	ddmmss.append("'', ");
	this.DDMMSS.lngDD = jQuery('<input type="text" size="4" placeholder="Deg"/>').appendTo(ddmmss);
	ddmmss.append("\u00B0");
	this.DDMMSS.lngMM = jQuery('<input type="text" size="2" placeholder="Min"/>').appendTo(ddmmss);
	ddmmss.append("'");
	this.DDMMSS.lngSS = jQuery('<input type="text" size="2" placeholder="Sec"/>').appendTo(ddmmss);
	
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
		var utm = this.utmform.read();
		callback(GeoUtil.UTMToGLatLng(utm));
	} else if(type == "name") {
		var gcg = new google.maps.Geocoder();
		gcg.geocode({address: this.address.val()}, function(result, status) { if(status!=google.maps.GeocoderStatus.OK) return; callback(result[0].geometry.location); });
	} else if(type == "DD") {
		var lat = this.lat.val();
		var lng = this.lng.val();
		if(lat != null && lat.length > 0 && lng != null && lng.length > 0) {
			callback(new google.maps.LatLng(1*lat, 1*lng));
		} else {
			return false;
		}
	} else if(type == "DMH") {
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
		callback(new google.maps.LatLng(lat, lng));
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
		callback(new google.maps.LatLng(lat, lng));
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

org.sarsoft.GeoRefImageOverlay = function(map, name, url, p1, p2, ll1, ll2, opacity, top) {
	this.set("p1", p1);
	this.set("p2", p2);
	this.set("ll1", ll1);
	this.set("ll2", ll2);
	this.set("url", url);
	this.set("top", top);
	this.set("name", name);
	
	this.div = jQuery('<img src="' + url + '"/>');
	this.div.css({position: 'absolute', 'z-index': (google.maps._openlayers ? 2 : 0), opacity: opacity});

	this._olcapable = true;
	this.opacity = opacity;
		
	this.setMap(map);
}

org.sarsoft.GeoRefImageOverlay.prototype = new google.maps.OverlayView();

org.sarsoft.GeoRefImageOverlay.prototype._calc = function() {
	var dLat = this.ll2.lat() - this.ll1.lat();
	var dLng = this.ll2.lng() - this.ll1.lng();
	var dx = this.p2.x - this.p1.x;
	var dy = this.p2.y - this.p1.y;
	
	var lat1 = GeoUtil.DegToRad(this.ll2.lat());
	var lat2 = GeoUtil.DegToRad(this.ll1.lat());
	var dLon = GeoUtil.DegToRad(this.ll2.lng()-this.ll1.lng());

	var y = Math.sin(dLon) * Math.cos(lat2);
	var x = Math.cos(lat1)*Math.sin(lat2) -
	        Math.sin(lat1)*Math.cos(lat2)*Math.cos(dLon);
	var mapAngle = GeoUtil.RadToDeg(Math.atan2(y, -x));
	
	var imageAngle = GeoUtil.RadToDeg(Math.atan(-dx / dy));
	if(dy > 0 && dx < 0) imageAngle = imageAngle - 180;
	if(dy > 0 && dx > 0) imageAngle = imageAngle + 180;
	this.angle = mapAngle - imageAngle;
	angle = GeoUtil.DegToRad(this.angle);
	
	this.div.css({"-webkit-transform": "rotate(" + this.angle + "deg)", "-moz-transform": "rotate(" + this.angle + "deg)", "-ms-transform": "rotate(" + this.angle + "deg)"});
	
	var s = Math.cos(this.ll1.lat());
	var r = Math.sqrt(Math.pow(this.size.w/2 - this.p1.x, 2) + Math.pow(this.size.h/2 - this.p1.y, 2)) / Math.sqrt(Math.pow(this.p2.x - this.p1.x, 2) + Math.pow(this.p2.y - this.p1.y, 2));
	var d = r*Math.sqrt(Math.pow(dLat, 2) + Math.pow(dLng, 2));

	var x1 = this.p1.x - this.size.w/2;
	var y1 = -1*(this.p1.y - this.size.h/2);
	var x2 = this.p2.x - this.size.w/2;
	var y2 = -1*(this.p2.y - this.size.h/2);
	var xnw = -1*this.size.w/2;
	var ynw = this.size.h/2;
	
	var u1 = x1*Math.cos(angle) + y1*Math.sin(angle);
	var v1 = y1*Math.cos(angle) - x1*Math.sin(angle);
	var u2 = x2*Math.cos(angle) + y2*Math.sin(angle);
	var v2 = y2*Math.cos(angle) - x2*Math.sin(angle);
	var unw = xnw*Math.cos(angle) + ynw*Math.sin(angle);
	var vnw = ynw*Math.cos(angle) - xnw*Math.sin(angle);
	
	var dlngdu = dLng/(u2-u1);
	var dlatdv = dLat/(v2-v1);
	
	this.center = new google.maps.LatLng(this.ll1.lat() - dlatdv*v1, this.ll1.lng() - dlngdu*u1);
	this.nw = new google.maps.LatLng(this.ll1.lat() - dlatdv*(vnw-v1), this.ll1.lng() + dlngdu*(unw-u1));
}

org.sarsoft.GeoRefImageOverlay.prototype._checkImageLoad = function() {
	var that = this;
	if(this.timer != null) {
		window.clearTimeout(this.timer);
		this.timer = null;
	}
	if(this.size == null) {
		var size = {w: this.div.width(), h: this.div.height()}
		if(size.w == 0) {
			if(this.getMap() != null) this.timer = window.setTimeout(function() { that._checkImageLoad() }, 400);
			return;
		} else {
			this.size = size;
			if(this.p1.x < 0) {
				this.p1.x = 0;
				this.p1.y = size.h;
			}
			if(this.p2.x < 0) {
				this.p2.x = size.w;
				this.p2.y = 0;
			}
		}
	}
	this._calc();
	this.div.css('opacity', this.get('opacity'));
	if(this._drawImageOnLoad) {
		this._drawImageOnLoad = false;
		this.draw();
	}
}

org.sarsoft.GeoRefImageOverlay.prototype.setOpacity = function(opacity) {
	this.set("opacity", opacity);
}

org.sarsoft.GeoRefImageOverlay.prototype.onAdd = function() {
	var that = this;
	if(this.top) {
		this.div.appendTo(this.getPanes().overlayLayer);
	} else {
		this.div.prependTo(this.getPanes().mapPane);
	}
	this._checkImageLoad();

	this.listeners_ = [
	           		google.maps.event.addListener(this, 'url_changed', function() { that._drawImageOnLoad = true; that.size = null; that._checkImageLoad() }),
	           		google.maps.event.addListener(this, 'p1_changed', function() { that._drawImageOnLoad = true; that._calc(); that.draw(); }),
	           		google.maps.event.addListener(this, 'p2_changed', function() { that._drawImageOnLoad = true; that._calc(); that.draw(); }),
	           		google.maps.event.addListener(this, 'll1_changed', function() { that._drawImageOnLoad = true; that._calc(); that.draw(); }),
	           		google.maps.event.addListener(this, 'll2_changed', function() { that._drawImageOnLoad = true; that._calc(); that.draw(); }),
	           		google.maps.event.addListener(this, 'opacity_changed', function() { that.div.css('opacity', that.get('opacity')) })
	           	];
	
}

org.sarsoft.GeoRefImageOverlay.prototype.onRemove = function() {
	this.div.remove();
	for (var i = 0, I = this.listeners_.length; i < I; ++i) {
		google.maps.event.removeListener(this.listeners_[i]);
	}	
}

org.sarsoft.GeoRefImageOverlay.prototype.draw = function() {
	if(this.center == null) {
		this._drawImageOnLoad = true;
		return;
	}
	
	var projection = this.getProjection();
	var px_1 = projection.fromLatLngToDivPixel(this.ll1);
	var px_2 = projection.fromLatLngToDivPixel(this.ll2);
	
	var scale = Math.sqrt(Math.pow(px_2.x - px_1.x, 2) + Math.pow(px_2.y - px_1.y, 2)) / Math.sqrt(Math.pow(this.p2.x - this.p1.x, 2) + Math.pow(this.p2.y - this.p1.y, 2));
	
	var px_center = projection.fromLatLngToDivPixel(this.center);
	this.px_nw = new google.maps.Point(Math.round(px_center.x - (this.size.w*scale)/2), Math.round(px_center.y - (this.size.h*scale)/2));
	
	this.div.css({left: this.px_nw.x + "px", top: this.px_nw.y + "px", width: (this.size.w*scale) + "px", height: (this.size.h*scale) + "px"});
}


org.sarsoft.MapUtil = new Object();

org.sarsoft.MapUtil.createIcon = function(url) {
	if(sarsoft.map.icons[url]) {
		var icon = sarsoft.map.icons[url];
		var sprite_count = 72;
		var target_size = 20;
		return { anchor : new google.maps.Point(icon.anchor[0]*target_size, icon.anchor[1]*target_size),
				scaledSize: new google.maps.Size(sprite_count*target_size, target_size),
				origin: new google.maps.Point(icon.offset*target_size, 0),
				size: new google.maps.Size(target_size, target_size), 
				url: $.img('icons/sprite2.png') }
	}
	return org.sarsoft.MapUtil.createImage(20, $.img(url));
}
org.sarsoft.MapUtil.createImage = function(size, url) {
  return { anchor: new google.maps.Point(size/2, size/2), scaledSize: new google.maps.Size(size, size), url: url }
}

org.sarsoft.MapUtil.createFlatCircleImage = function (color) {
  if(color.indexOf('#') == 0) color = color.substring(1);
  var url = "/resource/imagery/icons/circle/" + color + ".png";
  var img = { url: url, size: new google.maps.Size(12, 12), anchor: new google.maps.Point(6, 6) }
  img.shape = { type: "circle", coords: [6, 6, 6] }
  return img;
}

function Label(map, position, text, style, pixelOffset, centerOffset) {
	this._olcapable = true;
	this.setValues({map: map, text: text, position: position});
	this.pixelOffset = pixelOffset||new google.maps.Size(0,0);
	this.centerOffset = centerOffset||new google.maps.Size(0,-1);
	this.style = style || "";

	this.div_ = jQuery('<div style="position: absolute"></div>')[0];
	this.div2_ = jQuery('<div style="position: relative; z-index: 100; ' + style + '" class="olAlphaImage">' + text + '</div>').appendTo(this.div_)[0];
	
	this.setMap(map);
}

Label.prototype = new google.maps.OverlayView();

Label.prototype.onAdd = function() {
	var pane = this.getPanes().overlayLayer;
	pane.appendChild(this.div_);

	var me = this;
	this.listeners_ = [
		google.maps.event.addListener(this, 'position_changed',
		function() { me.draw(); }),
		google.maps.event.addListener(this, 'text_changed',
		function() { me.draw(); })
	];
	
};

Label.prototype.onRemove = function() { this.div_.parentNode.removeChild(this.div_ );
	for (var i = 0, I = this.listeners_.length; i < I; ++i) {
		google.maps.event.removeListener(this.listeners_[i]);
	}
};

Label.prototype.draw = function() {
	var projection = this.getProjection();
	var p = projection.fromLatLngToDivPixel(this.get('position'));
	var h = parseInt(this.div_.clientHeight);
	var w = parseInt(this.div_.clientWidth);

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
};
