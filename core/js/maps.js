if(typeof org == "undefined") org = new Object();
if(typeof org.sarsoft == "undefined") org.sarsoft = new Object();
if(typeof org.sarsoft.controller == "undefined") org.sarsoft.controller = new Object();

if(typeof org.sarsoft.EnhancedGMap == "undefined") org.sarsoft.EnhancedGMap = new Object();
org.sarsoft.EnhancedGMap._coordinates = "DD";

org.sarsoft.WebMercator = function() {
	this.tilesize = 256;
	this.initialresolution = 2 * Math.PI * 6378137 / this.tilesize;
	this.originshift = 2 * Math.PI * 6378137 / 2;
}

org.sarsoft.WebMercator.prototype.resolution = function(zoom) {
	return this.initialresolution / Math.pow(2, zoom);
}

org.sarsoft.WebMercator.prototype.latLngToMeters = function(lat, lng) {
	var mx = lng * this.originshift / 180;
    var my = Math.log(Math.tan((90 + lat) * Math.PI / 360)) / (Math.PI / 180);
    my = my * this.originshift / 180;
    return [mx, my];
}

org.sarsoft.WebMercator.prototype.metersToLatLng = function(mx, my) {
	var lng = (mx / this.originshift) * 180;
	var lat = (my / this.originshift) * 180;

    lat = 180 / Math.PI * (2 * Math.atan(Math.exp(lat * Math.PI / 180)) - Math.PI / 2);
    return [lat, lng];
}

org.sarsoft.WebMercator.prototype.pixelsToMeters = function(px, py, zoom) {
    var res = this.resolution(zoom);
    var mx = px * res - this.originshift;
    var my = py * res - this.originshift;
    return [mx, my];
}

org.sarsoft.WebMercator.prototype.metersToPixels = function(mx, my, zoom) {
    var res = this.resolution(zoom);
    var px = (mx + this.originshift) / res;
    var py = (my + this.originshift) / res;
    return [px, py];
}

org.sarsoft.WebMercator.prototype.pixelsToTile = function(px, py) {
    var tx = Math.ceil(px / this.tilesize) - 1;
    var ty = Math.ceil(py / this.tilesize) - 1;
    return [tx, ty];
}

org.sarsoft.WebMercator.prototype.pixelsToDecimalTile = function(px, py) {
    var tx = px / this.tilesize;
    var ty = py / this.tilesize;
    return [tx, ty];
}

org.sarsoft.WebMercator.prototype.metersToDecimalTile = function(mx, my, zoom) {
	var p = this.metersToPixels(mx, my, zoom);
	return this.pixelsToDecimalTile(p[0], p[1]);
}

org.sarsoft.WebMercator.prototype.tileBounds = function(tx, ty, zoom) {
    var min = this.pixelsToMeters(tx*this.tilesize, ty*this.tilesize, zoom);
    var max = this.pixelsToMeters((tx+1)*this.tilesize, (ty+1)*this.tilesize, zoom);
    return [min[0], min[1], max[0], max[1]];
}

org.sarsoft.WebMercator.prototype.tileLatLngBounds = function(tx, ty, zoom) {
	var bounds = this.tileBounds(tx, ty, zoom);
	var min = this.metersToLatLng(bounds[0], bounds[1]);
	var max = this.metersToLatLng(bounds[2], bounds[3]);
	return [min[0], min[1], max[0], max[1]];
}

org.sarsoft.WebMercator.prototype.googleTile = function(tx, ty, zoom) {
	return [tx, (Math.pow(2, zoom)) - 1 - ty];
}

org.sarsoft.WebMercator.prototype.googleY = function(y, z) {
	return (Math.pow(2, z)) - 1 - y;
}

org.sarsoft.WebMercator.prototype.tileY = function(y, z) {
	return (Math.pow(2, z)) - 1 - y;
}

org.sarsoft.EnhancedGMap.nativeAliases = {};

org.sarsoft.EnhancedGMap.createMapType = function(config, map) {
	var ts = config.tilesize ? config.tilesize : 256;
	if(config.type == "TILE"){
		var type = new google.maps.ImageMapType({alt: "", maxZoom: 21, minZoom: config.minresolution, name: config.name, opacity: config.opacity == null ? 1 : config.opacity/100, tileSize: new google.maps.Size(ts,ts), getTileUrl: function(point, zoom) {
			var url = config.template;
			if(zoom > config.maxresolution) {
				url = '/resource/imagery/tilecache/' + config.name + '/{Z}/{X}/{Y}.png';
			}
			return url.replace(/{Z}/, zoom).replace(/{X}/, point.x).replace(/{Y}/, point.y);
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
	if(org.sarsoft.EnhancedGMap.visibleMapTypes.indexOf == null) {
		org.sarsoft.EnhancedGMap.visibleMapTypes.indexOf = function(elt) {
			for(var i = 0; i < this.length; i++) {
				if(this[i] == elt) return i;
			}
			return -1;
		}
	}

	var map = new google.maps.Map(element, {mapTypeControl: false, streetViewControl: false});
	$(element).css({"z-index": 0, overflow: "hidden"});

	var bkgset = false;
	for(var i = 0; i < org.sarsoft.EnhancedGMap.defaultMapTypes.length; i++) {
		var config = org.sarsoft.EnhancedGMap.defaultMapTypes[i];
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
	
	if(center == null) center = new google.maps.LatLng(org.sarsoft.map._default.lat, org.sarsoft.map._default.lng);
	if(zoom == null) zoom = org.sarsoft.map._default.zoom;
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
	this.map.overlayMapTypes.push(this.map.mapTypes.get(id));
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
	for(i = 0; i < org.sarsoft.EnhancedGMap.defaultMapTypes.length; i++) {
		var cfg = org.sarsoft.EnhancedGMap.defaultMapTypes[i];
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
	
	this.checkMaxZoom();
}

org.sarsoft.MapOverlayManager.prototype.checkMaxZoom = function() {
	var baseType = this.map.mapTypes.get(this.map.getMapTypeId());
	if(org.sarsoft.EnhancedGMap._overzoom || baseType == null || baseType.setOpacity == null) {
		this.map.setOptions({maxZoom: null});
	} else {
		var z = baseType._maxZoom;
		for(var i = 0; i < this.map.overlayMapTypes.getLength(); i++) {
			var type = this.map.overlayMapTypes.getAt(i);
			if(type != null && type._maxZoom != null) z = Math.min(z, type._maxZoom);
		}
		this.map.setOptions({maxZoom: z});
	}
}

org.sarsoft.MapOverlayControl = function(map, manager) {
	var that = this;
	this.map = map;
	this.manager = manager;
	
	this.baseOverlayControls = new Array();
	this.alphaOverlayBoxes = new Array();

	this.typeDM = new org.sarsoft.view.DropMenu();
	this.typeDM.change(function() { that.handleLayerChange() });

	this.alphaOverlayPlus = $('<span style="color: red; cursor: pointer; padding-left: 3px; padding-right: 3px" title="Additional Layers">+0</span>');
	this.dd = new org.sarsoft.view.MenuDropdown(this.alphaOverlayPlus, 'width: 20em');

	this.div = jQuery('<div style="color: #5a8ed7; background: white; font-weight: bold; z-index: 1001; position: absolute; right: 0; top: 0" class="noprint"></div>');
	this.div.append(this.extras = document.createElement("span"), this.typeDM.container, this.dd.container);

	this.baseOverlayContainer = jQuery('<div></div>').appendTo(this.dd.div);
	this.addLayer = jQuery('<div style="color: red; font-weight: bold; cursor: pointer; padding-left: 3px; padding-top: 3px">+ Add Layer</div>').appendTo(this.dd.div);
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
			that.baseOverlayControls[i].dm.container.css('width', that.baseOverlayControls[i].dm.ul.width() + "px");
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

	control.dm.container.css('width', control.dm.ul.width() + "px");
	
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
	
	this.addLayer.css('display', this.baseOverlayControls.length < 3 ? 'block' : 'none');
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

org.sarsoft.MapOverlayControl.prototype.swapConfigurableAlphaLayer = function(idx, cfgstr) {
	var cfg = this.manager.getConfigFromAlias(this.alphaOverlayTypes[idx]);
	if(cfg._vtemplate == null) cfg._vtemplate = cfg.template;
	cfg.template = cfg._vtemplate.replace(/{V}/,cfgstr);
	this.map.mapTypes.get(this.alphaOverlayTypes[idx])._cfgvalue = cfgstr;
	for(var i = 0; i < this.map.overlayMapTypes.getLength(); i++) {
		if(this.map.overlayMapTypes.getAt(i)._alias == cfg.alias) this.map.overlayMapTypes.setAt(i, this.map.overlayMapTypes.getAt(i));
	}
}

org.sarsoft.MapOverlayControl.prototype.addAlphaType = function(alias) {
	var that = this;
	if(org.sarsoft.EnhancedGMap.visibleMapTypes.indexOf(alias) < 0) org.sarsoft.EnhancedGMap.visibleMapTypes.push(alias);
	var type = this.map.mapTypes.get(alias);
	var idx = this.alphaOverlayBoxes.length;
	this.alphaOverlayTypes[idx] = alias;
	if(idx > 0) this.aDiv.append(document.createElement("br"));
	this.alphaOverlayBoxes[idx] = jQuery('<input type="checkbox" value="' + idx + '" name="' + type.name + '"/>').appendTo(this.aDiv)[0];
	this.aDiv.append(type.name);
	if(type._alias != null && type._alias.indexOf("sc") == 0) {
		var div = jQuery('<div></div>').appendTo(this.aDiv)
		var ta = jQuery('<textarea style="width: 95%; height: 3.2em"></textarea>').appendTo(div);
		var cfg = new Object();
		cfg.readCfgValue = function(hazard) {
			if(hazard == null) hazard = "";
			ta.val(hazard.replace(/p/g, '\n').replace(/c/g, ' '));
			that.swapConfigurableAlphaLayer(idx, hazard);
		}
		div.append('<span style="margin-right: 2px; float: right"><a href="http://caltopo.blogspot.com/2013/02/custom-dem-shading.html" target="_new">documentation</a></span>');
		var change = jQuery("<a href=\"#\">Update Shading</a>").appendTo(div);
		change.click(function() {
			var hazard = ta.val();
			if(hazard == null) hazard = "";
			hazard = hazard.trim().replace(/\n/g, 'p').replace(/ /g, 'c');
			that.swapConfigurableAlphaLayer(idx, hazard);
			that.handleLayerChange();
			return false;
		});
		this.alphaOverlayBoxes[idx]._cfg = cfg;
		this.alphaOverlayBoxes[idx]._div = div;
	}
	$(this.alphaOverlayBoxes[idx]).change(function() { that.handleLayerChange() });
	this.hasAlphaOverlays = true;
}

org.sarsoft.MapOverlayControl.prototype.addBaseTypeIfNecessary = function(alias) {
	if(org.sarsoft.EnhancedGMap.visibleMapTypes.indexOf(alias) >= 0) return;

	var mycfg = null;
	for(var i = 0; i < org.sarsoft.EnhancedGMap.defaultMapTypes.length; i++) {
		var config = org.sarsoft.EnhancedGMap.defaultMapTypes[i];
		if(config.alias == alias) mycfg = config;
	}

	if(mycfg == null) return;
	org.sarsoft.EnhancedGMap.visibleMapTypes.push(alias);
	
	this.typeDM.addItem(mycfg.name, org.sarsoft.EnhancedGMap.nativeAliases[alias] || alias, this.grouping[alias]);
	
	if(mycfg.type == "NATIVE") return;
	
	for(var i = 0; i < this.baseOverlayControls.length; i++) {
		this.baseOverlayControls[i].dm.addItem(mycfg.name, alias, this.grouping[alias]);
	}
}

org.sarsoft.MapOverlayControl.prototype.resetDM = function(dm, base) {
	dm.empty();
	for(var i = 0; i < org.sarsoft.EnhancedGMap.defaultMapTypes.length; i++) {
		var config = org.sarsoft.EnhancedGMap.defaultMapTypes[i];
		if(org.sarsoft.EnhancedGMap.visibleMapTypes.indexOf(config.alias) >= 0) {
			if(!config.alphaOverlay && (config.type != "NATIVE" || base)) {
				dm.addItem(config.name, org.sarsoft.EnhancedGMap.nativeAliases[config.alias] || config.alias, this.grouping[config.alias]);
			}
		}
	}
	
	if(base) return;
	for(var i = 0; i < org.sarsoft.EnhancedGMap.geoRefImages.length; i++) {
		var gr = org.sarsoft.EnhancedGMap.geoRefImages[i];
		dm.addItem(gr.name, "_gr" + gr.id);
	}
}

org.sarsoft.MapOverlayControl.prototype.resetMapTypes = function() {
	this.alphaOverlayBoxes = new Array();
	this.alphaOverlayTypes = new Array();
	this.aDiv.empty()

	this.grouping = {};
	if(org.sarsoft.EnhancedGMap.mapTypeGrouping != null) {
		var groups = org.sarsoft.EnhancedGMap.mapTypeGrouping.split(';');
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

	for(var i = 0; i < org.sarsoft.EnhancedGMap.defaultMapTypes.length; i++) {
		var config = org.sarsoft.EnhancedGMap.defaultMapTypes[i];
		if(org.sarsoft.EnhancedGMap.visibleMapTypes.indexOf(config.alias) >= 0) {
			if(config.alphaOverlay) this.addAlphaType(config.alias);
		}
	}

	for(var i = 0; i < org.sarsoft.EnhancedGMap.geoRefImages.length; i++) {
		var gr = org.sarsoft.EnhancedGMap.geoRefImages[i];
		var alias = "_gr" + gr.id;
		this.manager.removeOverlay(alias);
		this.manager.addType(alias, new org.sarsoft.GeoRefImageOverlay(null, gr.name, gr.url, new google.maps.Point(gr.x1, gr.y1), new google.maps.Point(gr.x2, gr.y2), new google.maps.LatLng(gr.lat1, gr.lng1), new google.maps.LatLng(gr.lat2, gr.lng2), 1));
	}
	
	this.hasAlphaOverlays = false;
	this.updateMap(this.map.getMapTypeId(), [], []);
}

org.sarsoft.MapOverlayControl.prototype.appendInfoStr = function(str, name) {
	var type = this.manager.getType(name);
	if(type && type._info && type._info.length > 0) return str + type._info + ". ";
	return str;
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

	// set map zoom limits
	this.manager.checkMaxZoom();
	
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

org.sarsoft.view.ScaleControl = function(map, container) {
	var that = this;
	this.map = map;
	this.container = container;
	this.state = true;
	this.div = jQuery('<div style="position: relative"></div>').appendTo(jQuery('<div style="position: absolute; bottom: 2px; left: 26px; height: 2em; font-size: 10px; z-index: 1000"></div>').appendTo(container));
	google.maps.event.addListener(map, "zoom_changed", function() { if(that.state) that.draw(); });
	google.maps.event.addListener(map, "center_changed", function() { if(that.state) that.draw(); });
}

org.sarsoft.view.ScaleControl.prototype.draw = function() {
	this.div.empty();
	var bounds = this.map.getBounds();
	var distance = google.maps.geometry.spherical.computeDistanceBetween(bounds.getNorthEast(), bounds.getSouthWest());
	var mapdiv = $(map.getDiv());
	var pxdistance = Math.sqrt(mapdiv.width()*mapdiv.width() + mapdiv.height()*mapdiv.height());
	var mscale = (distance/1000)/pxdistance;
	var iscale = mscale/1.609;
	var width = 200;
	var color = "#5a8ed7";
	
	this.div.empty();
	
	var interval = 1000;
	while(width*mscale/interval < 3) {
		if(interval%10 == 0) {
			interval = interval/2;
		} else {
			interval = interval/5;
		}
	}
	if(interval < 0.1) interval = 0.1;
	for(var i = 0; i*interval/mscale < width; i++) {
		var content = Math.round(i*interval*10)/10 + ((i+1)*interval/mscale < width ? "" : "km");
		jQuery('<div style="position: absolute; border-left: 1px solid ' + color + '; padding-left: 2px; top: 0px; height: 1em; left: ' + Math.round(i*interval/mscale) + 'px">' + content + '</div>').appendTo(this.div);
	}
	var width = (Math.round((i-1)*interval/mscale)+1);

	var interval = 1000;
	while(width*iscale/interval < 3) {
		if(interval%10 == 0) {
			interval = interval/2;
		} else {
			interval = interval/5;
		}
	}
	if(interval < 0.1) interval = 0.1;
	for(var i = 0; i*interval/iscale < width; i++) {
		var content = Math.round(i*interval*10)/10 + ((i+1)*interval/iscale < width ? "" : "mi");
		jQuery('<div style="position: absolute; border-left: 1px solid ' + color + '; padding-left: 2px; top: 1em; height: 1em; left: ' + Math.round(i*interval/iscale) + 'px">' + content + '</div>').appendTo(this.div);
	}
	var width = Math.max(width, (Math.round((i-1)*interval/iscale)+1));
	jQuery('<div style="position: absolute; margin-top: 1em; width: ' + width + 'px; border-bottom: 1px solid ' + color + '"></div>').appendTo(this.div);
}

org.sarsoft.view.ScaleControl.prototype.show = function() {
	this.state = true;
	this.div.css('display', 'block');
	this.draw();
}

org.sarsoft.view.ScaleControl.prototype.hide = function() {
	this.state = false;
	this.div.css('display', 'none');
}

org.sarsoft.view.MapSizeForm = function(map, container) {
	var that = this;
	this.map = map;
	this.container = container;
	
	this.presets = [{name: "letter", description: "8.5\"x11\"", width: "8.5in", height: "11in", margin: "0.25in"}, 
	                {name: "legal", description: "8.5\"x14\"", width: "8.5in", height: "14in", margin: "0.25in"},
	                {name: "A4", description: "A4", width: "21cm", height: "29.7cm", margin: "0.5cm"},
	                {name: "1117", description: "11\"x17\"", width: "11in", height: "17in", margin: "0.25in"},
	                {name: "1393", description: "13\"x19\"", width: "13in", height: "19in", margin: "0.25in"}
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
			that.preset.css('color', 'gray');
			that.custom.css('color', 'black');
			return;
		}
		that.preset.css('color', 'black');
		that.custom.css('color', 'gray');
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
	var header = jQuery('<div style="font-size: 150%"></div>').appendTo(div);
	this.printButton = jQuery('<button style="cursor; pointer">Print Map</button>').appendTo(header).click(function() {
		window.print();
	});
	jQuery('<button style="margin-left: 20px; cursor: pointer">Cancel</button>').appendTo(header).click(function() {
		container.css('display', 'none');
		that.fullscreen();
	});
	this.header = header;
	
	div.append(document.createTextNode("Page Size: "));
	this.presetInput = jQuery('<select><option value="Custom">Custom</option></select>').appendTo(div).change(this.updateToPreset);
	for(var i = 0; i < this.presets.length; i++) {
		jQuery('<option value="' + this.presets[i].name + '">' + this.presets[i].description + '</option>').appendTo(this.presetInput);
	}

	var div = jQuery('<span style="padding-left: 1ex"></span>').appendTo(div);
	div.append(document.createTextNode("Width: "));
	this.widthInput = jQuery('<input type="text" size="6"/>').appendTo(div).change(function() {that.write()});
	div.append(document.createTextNode("   Height: "));
	this.heightInput = jQuery('<input type="text" size="6"/>').appendTo(div).change(function() {that.write()});
	div.append(document.createTextNode("   Margin: "));
	if($.browser.mozilla) {
		div.append(document.createTextNode(" Not Supported on Firefox."));
		this.marginInput = jQuery('<input type="text" size="6"/>');
	} else {
		this.marginInput = jQuery('<input type="text" size="6"/>').appendTo(div).change(function() {that.write()});
	}
	this.custom = div;
		
	var div = jQuery('<div style="padding-top: 5px"></div>').appendTo(container);
	this.preset = jQuery('<span></span>').appendTo(div);
	this.cborientation = jQuery('<input type="checkbox" style="margin-left: 5px"/>').appendTo(this.preset).change(this.updateToPreset);
	this.preset.append('<span style="padding-right: 5px">Landscape</span>');
	this.cbmargin = jQuery('<input style="margin-left: 5px" type="checkbox"/>').appendTo(this.preset).change(this.updateToPreset);
	this.preset.append('<span>Borderless</span>');

	this.cbborder = jQuery('<input style="margin-left: 5px" type="checkbox" checked="checked"/>').appendTo(div).change(function() {that.write();});
	div.append('<span style="padding-right: 5px">Show Coordinates in Margin</span>');
	this.cbscale = jQuery('<input style="margin-left: 5px" type="checkbox" checked="checked"/>').appendTo(div).change(function() {that.write();});
	div.append('<span>Fit Preview To Screen</span>');	
		
	if($.browser.msie) {
		jQuery('<div style="font-weight: bold; color: red">Printing is not supported on Internet Explorer and may not work properly.</div>').appendTo(container);
	} else if($.browser.mozilla) {
		jQuery('<div style="font-weight: bold; color: red">Remember to check the "Ignore Scaling and Shrink to Fit Page Width" option in Firefox\'s print menu.</div>').appendTo(container);
	}
	
	this.scaleControl = new org.sarsoft.view.ScaleControl(map, map.getDiv());
	this.scaleControl.hide();
}

org.sarsoft.view.MapSizeForm.prototype.fullscreen = function() {
	var center = this.map.getCenter();

	this.map.getDiv().style.width="100%";
	this.map.getDiv().style.height="100%";
	this.map.getDiv()._margin=0;
	
	$(this.map.getDiv()).css('-webkit-transform', 'none').css('-moz-transform', 'none').css('-ms-transform', 'none');
	if(this.map._zoomControl != null) this.map._zoomControl.css('-webkit-transform', 'none').css('-moz-transform', 'none').css('-ms-transform', 'none');

	var ugc = this.map._imap.registered["org.sarsoft.UTMGridControl"];
	var mic = this.map._imap._mapInfoControl;

	ugc.hidePrintBorder();
	if(this.footer[0] != null) this.footer[0].remove();
	if(this.footer[1] != null) this.footer[1].remove();
	this.scaleControl.hide();
	
	if(mic != null) mic.ctrl.css('visibility', 'visible');
	this.footer = null;
	ugc.borders[3].div.css('height', '26px');

	google.maps.event.trigger(this.map, 'resize');
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
	
	var container = $(map.getDiv());
	container.css({width: width, height: height});
	this.map.getDiv()._margin=margin;
	
	var ugc = map._imap.registered["org.sarsoft.UTMGridControl"];
	var mdw = this.map._imap.registered["org.sarsoft.MapDatumWidget"];
	var mic = this.map._imap._mapInfoControl;
	if(this.cbborder[0].checked) {
		if(this.footer == null) {
			ugc.borders[3].div.css('height', '46px');
			this.footer = [];
			if(mdw != null) this.footer[0] = jQuery('<span style="padding-right: 5px">Datum:</span>').insertBefore(mdw.datumDisplay);
			this.scaleControl.show();
			if(mic != null) {
				this.footer[1] = jQuery('<span style="padding-right: 5px">Printed from ' + org.sarsoft.version + '.</span>').insertBefore(mic.premsg);
				mic.ctrl.css('visibility', 'hidden');
			}
		}
		ugc.showPrintBorder();
	} else {
		if(this.footer != null) {
			if(this.footer[0] != null) this.footer[0].remove();
			if(this.footer[1] != null) this.footer[1].remove();
			this.scaleControl.hide();
			if(mic != null) mic.ctrl.css('visibility', 'visible');
			this.footer = null;
			ugc.borders[3].div.css('height', '26px');
		}
		ugc.hidePrintBorder();
	}
	
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
	google.maps.event.trigger(this.map, 'resize');
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
	this.datumDisplay = jQuery('<span>' + org.sarsoft.map.datum + '.</span>').appendTo(this.datumControl);
	
	if(switchable) {
		this.datumSwitcher = jQuery('<a class="underlineOnHover" title="click to change datum" style="cursor: pointer"></a>').appendTo(this.datumControl).append(this.datumDisplay);
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
	org.sarsoft.map.datum = datum;
	GeoUtil.datum = org.sarsoft.map.datums[org.sarsoft.map.datum];
	this.datumDisplay.html(datum + '.');
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
	this.showborder = false;
	this.imap = imap;
	if(imap != null) {
		this._UTMToggle = new org.sarsoft.ToggleControl("UTM", "Toggle UTM grid", function(value) {
			that.setValue(value);
		});
		this._UTMToggle.setValue(this._showUTM);
		imap.addMenuItem(this._UTMToggle.node, 10);

		if(org.sarsoft.touch) {
			this._UTMConfig = {div: jQuery('<div></div>')}
		} else {
			this._UTMConfig = new org.sarsoft.view.MenuDropdown('&darr;', 'left: 0; width: 100%', imap.map._overlaycontrol.div);
		}
		
		var crosshatchContainer = jQuery('<div style="float: left; padding-right: 1em">Show grid as</div>').appendTo(this._UTMConfig.div)
		this.crosshatchSelect = jQuery('<select style="margin-left: 1em"><option value="0">Tickmarks</option><option value="20">Crosshatches</option><option value="100">Lines</option></select>').appendTo(crosshatchContainer);
		this.crosshatchSelect.change(function() {
			that.style.crosshatch = that.crosshatchSelect.val();
			that._drawUTMGrid(true);
		});
		this.crosshatchSelect.val(this.style.crosshatch);

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
					
		if(!org.sarsoft.touch) imap.addMenuItem(this._UTMConfig.container, 10);
		imap.register("org.sarsoft.UTMGridControl", this);
		this.map = imap.map;
		this.borders = [];
		
		var fn = function() {
			if(that.utminitialized == false) {
				that._drawUTMGrid();
				google.maps.event.addListener(imap.map, "idle", function() { that._drawUTMGrid(); });
//				google.maps.event.addListener(map, "zoom_changed", function(foo, bar) { that._drawUTMGrid(); });
				google.maps.event.addListener(imap.map, "dragstart", function() {
					for(var i = 0; i < that.text.length; i++) {
						that.text[i].setMap(null);
					}
					that.text = new Array();
					for(var i = 0; i < 4; i++) that.borders[i].clear();
				});
				that.utminitialized=true;
				that.majorSlider.setValue(that.style.major*100);
				that.minorSlider.setValue(that.style.minor*100);			
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
	this._UTMToggle.setValue(this._showUTM);
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
	
	this.block = jQuery('<div></div>').appendTo(container);
	this.header = jQuery('<div style="cursor: pointer; white-space: nowrap; overflow: hidden; width: 100%">' + label + '</div>').appendTo(this.block);
	this.body = jQuery('<div></div>').appendTo(this.block);

	this.header.css({"margin-bottom": "3px", "margin-top": "3px", "font-weight": "bold", color: "#5a8ed7", cursor: "pointer"});
	this.body.css('padding-left', '10px');
	
	this.header.click(function() {
		if(that.lock) return;
		if(that.body.css('display')=='none') {
			that.body.css('display', 'block');
		} else {
			that.body.css('display', 'none');
		}
	});
}

org.sarsoft.DataNavigator = function(imap) {
	var that = this;
	this.imap = imap;
	imap.register("org.sarsoft.DataNavigator", this);
	
	this.defaults = new Object();

	if(org.sarsoft.userPermissionLevel == "WRITE" || org.sarsoft.userPermissionLevel == "ADMIN") {
		this.defaults.savedAt = jQuery('<div style="display: none; color: #CCCCCC; font-style: italic">Map Not Modified</div>');
		org.sarsoft.BaseDAO.addListener(function(success) {
			if(success) {
				var d = new Date();
				var pm = false;
				var hours = d.getHours();
				if(hours > 12) {
					hours = hours - 12;
					pm = true;
				}
				that.defaults.savedAt.css('display', 'block').html('Last saved at ' + hours + ':' + (d.getMinutes() < 10 ? '0' : '') + d.getMinutes() + ':' + (d.getSeconds() < 10 ? '0' : '') + d.getSeconds() + (pm ? ' PM' : ' AM'));
			} else {
				that.defaults.savedAt.css({'display': 'block', 'font-style': 'normal', 'font-weight': 'bold', 'color': 'red'}).html('CHANGES NOT SAVED');
			}
		});
	}
}

org.sarsoft.DataNavigator.prototype.addDataType = function(title) {
	var tree = new org.sarsoft.DNTree(this.defaults.body, title);
	tree.header.css({"font-size": "120%", "font-weight": "bold", "color": "black", "margin-top": "0.5em", "border-top": "1px solid #CCCCCC"});
	return tree;
}

org.sarsoft.DataNavigatorToggleControl = function(imap) {
	var that = this;
	this.imap = imap;
	this.map = imap.map;
	imap.register("org.sarsoft.DataNavigatorToggleControl", this);
	this.offset = 200;
	this.mobile = org.sarsoft.mobile;
	this.state = !this.mobile;
	
	this.minmax = jQuery('<img src="' + org.sarsoft.imgPrefix + '/draghandle.png" title="Show Left Bar" style="cursor: pointer; z-index: 1001; position: absolute; left: 0; top:' + Math.round($(this.imap.map.getDiv()).height()/2-24) + 'px" class="noprint"/>');
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
		var dn = imap.registered["org.sarsoft.DataNavigator"];
		
	} else {
		if(YAHOO.util.Cookie.exists("org.sarsoft.browsersettings")) {
			var config = YAHOO.lang.JSON.parse(YAHOO.util.Cookie.get("org.sarsoft.browsersettings"))
			if(config.datanavstate != null) {
				this.state = config.datanavstate;
				this.offset = config.datanavoffset || 200;
			}
		}

		this.dragbar = jQuery('<div style="visibility: hidden; top: 0; left: 0; position: absolute; z-index: 2000; height: 100%; width: 8px; background-color: black; opacity: 0.4; filter: alpha(opacity=40)"></div>').appendTo(this.imap.container.top);

		this.minmax.bind('drag', function(evt) {
			if(that.state) that.dragbar.css({visibility : 'visible', left : Math.max(evt.offsetX - 8, 150) + "px"});
		});
		
		this.minmax.bind('dragend', function(evt) {
			if(that.state) {
				that.dragbar.css({visibility: 'hidden', left: '0px'});
				that.offset = Math.max(evt.offsetX, 150);
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

	if(this.imap.container != null) {
		this.imap.container.right.append(this.minmax);
	} else {
		map.getDiv().appendChild(this.minmax[0]);
	}

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

org.sarsoft.PositionInfoControl = function(imap) {
	if(imap != null) {
		this.imap = imap;
		imap.register("org.sarsoft.PositionInfoControl", this);
		this.value = (org.sarsoft.touch ? org.sarsoft.PositionInfoControl.CENTER : org.sarsoft.PositionInfoControl.CURSOR);

		var that = this;
		this.map = imap.map;
		this._show = true;
		
		this.crosshair = jQuery('<img class="noprint" style="visibility: hidden; z-index: 999; position: absolute" src="' + org.sarsoft.imgPrefix + '/crosshair.png"/>').appendTo(this.map.getDiv());
		var div = jQuery('<div style="text-align: right; position: absolute; right: 0; top: ' + imap.map._overlaycontrol.div.height() + 'px; z-index: 1001" class="noprint"></div>').prependTo(this.map.getDiv());
		this.display = jQuery('<div style="background-color: white; padding-top: 3px; font-weight: bold"></div>').appendTo(div);
		
		this.centerCrosshair();
		
		google.maps.event.addListener(imap.map, "mousemove", function(evt) {
			if(that.value == org.sarsoft.PositionInfoControl.CURSOR) that.update(evt.latLng);
		});
		google.maps.event.addListener(imap.map, "bounds_changed", function() {
			if(that.value == org.sarsoft.PositionInfoControl.CENTER) that.update(imap.map.getCenter());
		});
		google.maps.event.addListener(imap.map, "resize", function() {
			that.centerCrosshair();
		});
		$(window).resize(function() { that.centerCrosshair(); });
		this.div = div;	
	}
}

org.sarsoft.PositionInfoControl.NONE = 0;
org.sarsoft.PositionInfoControl.CURSOR = 1;
org.sarsoft.PositionInfoControl.CENTER = 2;

org.sarsoft.PositionInfoControl.prototype.centerCrosshair = function() {
	var div = $(this.imap.map.getDiv());
	this.crosshair.css({left: Math.round(div.width()/2)-8 + "px", top: Math.round(div.height()/2)-8 + "px"});
}

org.sarsoft.PositionInfoControl.prototype.update = function(gll) {
	this.div.css('top', this.imap.map._overlaycontrol.div.height() + 'px');
	var datumll = GeoUtil.fromWGS84(gll);
	var utm = GeoUtil.GLatLngToUTM(datumll);
	var message = utm.toHTMLString() + "<br/>";
	if(this.imap != null && this.imap.registered["org.sarsoft.UTMGridControl"] != null) {
		if(org.sarsoft.EnhancedGMap._coordinates == "DD") {
			message = message + GeoUtil.formatDD(datumll.lat()) + ", " + GeoUtil.formatDD(datumll.lng());
		} else if(org.sarsoft.EnhancedGMap._coordinates == "DDMMHH") {
			message = message + GeoUtil.formatDDMMHH(datumll.lat()) + ", " + GeoUtil.formatDDMMHH(datumll.lng());
		} else {
			message = message + GeoUtil.formatDDMMSS(datumll.lat()) + ", " + GeoUtil.formatDDMMSS(datumll.lng());
		}
	}
	this.display.html(message);
}

org.sarsoft.PositionInfoControl.prototype.setValue = function(value) {
	this.value = value;
	if(value == org.sarsoft.PositionInfoControl.NONE) {
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
		 {value : "backlit", style : "color: white; background-color: #5a8ed7"},
		 {value : "hidden", style : "text-decoration: line-through"}]);
	this.toggle.setValue(this.label);
	this.handleConfigChange();
	imap.addMenuItem(this.toggle.node, 15);
	imap.register("org.sarsoft.MapLabelWidget", this);
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
	this.toggle.setValue(this.label);
	this.handleConfigChange();
}

org.sarsoft.MapLabelWidget.prototype.getConfig = function(config) {
	if(config.MapLabelWidget == null) config.MapLabelWidget = new Object();
	config.MapLabelWidget.label = this.label;
	return config;
}

org.sarsoft.MapSizeWidget = function(imap) {
	imap.register("org.sarsoft.MapSizeWidget", this);
	var that = this;
	var div = jQuery('<div style="display: none; padding-left: 20px" class="noprint"></div>').prependTo($(imap.map.getDiv()).parent());
	this.pageSizeForm = new org.sarsoft.view.MapSizeForm(imap.map, div);
	this.print_options = new org.sarsoft.view.MenuDropdown('<img style="cursor: pointer; vertical-align: middle" title="Print" src="' + org.sarsoft.imgPrefix + "/print.png"+ '"/>', 'left: 0; width: 100%', imap.map._overlaycontrol.div);

	jQuery('<div style="margin-top: 1em"></div>').appendTo(this.print_options.div);
	jQuery('<span style="cursor: pointer; color: #5a8ed7; font-weight: bold; margin-right: 1ex">&rarr; Print From Your Browser</span>').prependTo(jQuery('<div style="margin-top: 1ex">Works best with Google Chrome.  Create borderless prints with any combination of page sizes and map layers.</div>').appendTo(this.print_options.div)).click(function() {
		if(div.css('display')=='none') {
			if(imap.registered["org.sarsoft.view.MapDialog"] != null) imap.registered["org.sarsoft.view.MapDialog"].hide();
			div.css('display', 'block');
			that.pageSizeForm.presetInput.val("letter");
			that.pageSizeForm.updateToPreset();
		} else {
			div.css('display', 'none');
			that.pageSizeForm.fullscreen();
		}
		that.print_options.hide();
	});
	
	imap.addMenuItem(this.print_options.container, 30);
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
	});
	
	if(typeof(navigator.geolocation) != "undefined") {
		this.mylocation = jQuery('<img src="' + org.sarsoft.imgPrefix + '/location.png" style="margin-left: 3px; cursor: pointer; vertical-align: middle" title="Go to my location"/>').appendTo(container).click(function() {
			navigator.geolocation.getCurrentPosition(function(pos) {
				that.imap.setCenter(new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude), 14);
			}, function() { alert("Unable to determine your location.")});
		});
	}
	
	this.container = container;
	this.setState(false);

	imap.addMenuItem(container[0], 25);
}

org.sarsoft.MapFindWidget.prototype.setState = function(state) {
	this.state = state;
	if(this.state) {
		this.container.children().css('display', 'inline');
		this.locationEntryForm.clear();
		if(typeof google.maps.Geocoder != 'undefined' && !org.sarsoft.touch) {
			this.locationEntryForm.address.focus();
		}
	} else {
		this.container.children().css('display', 'none');
		this.find.css('display', 'inline');
		if(org.sarsoft.touch && this.mylocation != null) this.mylocation.css('display', 'inline');
	}
 }

org.sarsoft.view.BaseConfigWidget = function(imap, persist, message) {
	var that = this;
	this.hasConfig = false;
	if(imap != null) {
		this.imap = imap;
		imap.register("org.sarsoft.view.BaseConfigWidget", this);
		if(persist) {
			var dn = imap.registered["org.sarsoft.DataNavigator"];
			this.saveLink = jQuery('<div style="margin-bottom: 3px; margin-top: 3px; font-weight: bold; color: black; cursor: pointer" title="Save current background, available data sources and UTM grid settings for future visits?"><img style="vertical-align: text-bottom; margin-right: 2px" src="' + org.sarsoft.imgPrefix + '/save.png" style="cursor: pointer; vertical-align: middle"/>Save Configuration</div>').prependTo(dn.defaults.layers.tree.body);
			this.saveLink.click(function() {
				that.saveConfig(function() { alert('The following configuration items have been saved for the next time you come back:\n\n - Map Center and Zoom Level\n - Current Layers\n - Available Data Sources\n - Datum\n - UTM Grid\n');});
			});
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
		if(org.sarsoft.EnhancedGMap.visibleMapTypes.indexOf(type.alias) >= 0) layers.push(type.alias);
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
	var handler = function(cfg) {
		var config = {};
		if(cfg.value != null) {
			config = YAHOO.lang.JSON.parse(cfg.value);
			that.hasConfig = true;
		}
		if(typeof(overrides) != "undefined") for(var key in overrides) {
			config[key] = overrides[key];
		}
		that._fromConfigObj(config);
	}
	if(org.sarsoft.preload.mapConfig != null) {
		org.sarsoft.async(function() { handler(org.sarsoft.preload.mapConfig) });
	} else {
		this.tenantDAO.load(handler, "mapConfig");
	}
}


org.sarsoft.view.CookieConfigWidget = function(imap, saveCenter) {
	org.sarsoft.view.BaseConfigWidget.call(this, imap, true, "Save map settings for future page loads?");
	this.saveCenter = saveCenter;
}

org.sarsoft.view.CookieConfigWidget.prototype = new org.sarsoft.view.BaseConfigWidget();

org.sarsoft.view.CookieConfigWidget.prototype.saveConfig = function(handler) {
	var config = {};
	if(YAHOO.util.Cookie.exists("org.sarsoft.mapConfig")) config = YAHOO.lang.JSON.parse(YAHOO.util.Cookie.get("org.sarsoft.mapConfig"));
	if(config.base == null) config = {}; // keep mis-set cookies from screwing everything up
	this._toConfigObj(config);
	config.alphaOverlays = null;
	config.overlay = null;
	YAHOO.util.Cookie.set("org.sarsoft.mapConfig", YAHOO.lang.JSON.stringify(config));
	if(this.saveCenter) {
		var center = this.imap.map.getCenter();
		var zoom = this.imap.map.getZoom();
		YAHOO.util.Cookie.set("org.sarsoft.mapCenter", YAHOO.lang.JSON.stringify({center: {lat: center.lat(), lng: center.lng()}, zoom: zoom}));
	}

	var layers = [];
	for(var i = 0; i < org.sarsoft.EnhancedGMap.defaultMapTypes.length; i++) {
		var type = org.sarsoft.EnhancedGMap.defaultMapTypes[i];
		if(org.sarsoft.EnhancedGMap.visibleMapTypes.indexOf(type.alias) >= 0) layers.push(type.alias);
	}

	YAHOO.util.Cookie.set("org.sarsoft.mapLayers", layers.join(","));
	YAHOO.util.Cookie.set("org.sarsoft.updated", new Date().getTime());
	if(handler != null) handler();
}

org.sarsoft.view.CookieConfigWidget.prototype.loadConfig = function(overrides) {
	if(YAHOO.util.Cookie.exists("org.sarsoft.mapLayers")) {
		var layers = YAHOO.util.Cookie.get("org.sarsoft.mapLayers").split(",");
		var date = YAHOO.util.Cookie.exists("org.sarsoft.updated") ? Math.round(YAHOO.util.Cookie.get("org.sarsoft.updated", Number)/(1000*60*60*24)) : 0;
		org.sarsoft.EnhancedGMap.visibleMapTypes = [];
		for(var i = 0; i < org.sarsoft.EnhancedGMap.defaultMapTypes.length; i++) {
			var type = org.sarsoft.EnhancedGMap.defaultMapTypes[i];
			if(type.date > date) {
				org.sarsoft.EnhancedGMap.visibleMapTypes.push(type.alias);
			} else {
				for(var j = 0; j < layers.length; j++) {
					if(layers[j] == type.alias) org.sarsoft.EnhancedGMap.visibleMapTypes.push(type.alias);
				}
			}
		}
		var config = imap.getConfig();
		imap.map._overlaycontrol.resetMapTypes();
		if(!YAHOO.util.Cookie.exists("org.sarsoft.mapConfig")) imap.setConfig(config);
	}
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
		this.imap.map.setCenter(new google.maps.LatLng(config.center.lat, config.center.lng));
		this.imap.map.setZoom(config.zoom);
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

/*
 *  Extends the MapEntityDialog for objects with geospatial information.  3 states:
 *  1. New Object
 *  2. Edit data only
 *  3. Edit data and geospatial info
 */
org.sarsoft.view.MapObjectEntityDialog = function(imap, title, entityform) {
	var that = this;
	org.sarsoft.view.MapEntityDialog.call(this, imap, title, entityform, function(obj) { that.ok(obj) }, "OK");
	
	this.dialog.dialog.hideEvent.subscribe(function() {
		if(that.hasGeoInfo) that.discardGeoInfo();
		if(that.live) that.live = false;
	});
}

org.sarsoft.view.MapObjectEntityDialog.prototype = new org.sarsoft.view.MapEntityDialog();

org.sarsoft.view.MapObjectEntityDialog.prototype.ok = function(obj) {
	var that = this;
	if(this.object.id == null) {
		this.create(obj);
	} else if(this.hasGeoInfo) {
		this.saveGeoInfo(obj, function() { that.saveData(obj); });
		this.hasGeoInfo = false;
	} else {
		this.saveData(obj);
	}
}

// override these stubs
org.sarsoft.view.MapObjectEntityDialog.prototype.discardGeoInfo = function() { }
org.sarsoft.view.MapObjectEntityDialog.prototype.saveGeoInfo = function(obj) { }
org.sarsoft.view.MapObjectEntityDialog.prototype.saveData = function(obj) { }
org.sarsoft.view.MapObjectEntityDialog.prototype.create = function(obj) { }

org.sarsoft.view.MapObjectEntityDialog.prototype.show = function(obj, point, hasGeoInfo) {
	this.object = obj;
	this.point = point;
	this.hasGeoInfo = hasGeoInfo;
	org.sarsoft.view.MapEntityDialog.prototype.show.call(this, obj);
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
		if(that.imap.container != null) that.imap.container.right.css('visibility', 'visible');
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
		if(this.imap.container != null) {
			container.css('height', height+"px");
		}
		this.dlg.css({left: (container.offset().left+1) + "px", top: height + "px"});
	} else {
		if(this.imap.container != null) this.imap.container.right.css('visibility', 'hidden');
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
	this._handlers = new Object();
	this._contextMenu = new org.sarsoft.view.ContextMenu();
	this._contextMenu._vertex
	this._menuItems = [{ text: "Delete Vertex", applicable: function() {var g = that._contextMenu._gmapobj; return g != null && g.getEditable != null && g.getEditable() && that._contextMenu._vertex != null && (g.getPath().getLength() > 3 || (g.getPath().getLength() > 2 && g.getPaths == null)) }, handler: function(obj) { that._contextMenu._gmapobj.getPath().removeAt(that._contextMenu._vertex); } }];

	this._menuItemsOverride = null;
	this.registered = new Object();
	this._mapInfoMessages = new Object();
	
	if(typeof map == undefined) return;
	
	this.projection = false;
	var pco = new org.sarsoft.ProjectionCaptureOverlay(this);
	this.drawingManager = new google.maps.drawing.DrawingManager({map: map, drawingMode: null, drawingControl: false});
	
	google.maps.event.addListener(map, "rightclick", function(evt) {
		that.click(evt);
	});
	
	this.loadBrowserSettings();
	this.map._imap = this;
	this.mapMessageControl = new org.sarsoft.MapMessageControl(this.map);
	this._mapInfoControl = new org.sarsoft.MapInfoControl(this.map);
	
	if(options == null) options = {};
	if(options.positionWindow || options.standardControls) {
		this.positionInfoControl = new org.sarsoft.PositionInfoControl(this);
	}
	var dc = new org.sarsoft.MapDatumWidget(this, options.switchableDatum);
	var mn = new org.sarsoft.MapDeclinationWidget(this);
	if(options.standardControls || options.UTM) {
		var ugc = new org.sarsoft.UTMGridControl(this);
	}
	if((options.standardControls && !org.sarsoft.mobile) || options.size) var sc = new org.sarsoft.MapSizeWidget(this);
	if(options.standardControls || options.find) var fc = new org.sarsoft.MapFindWidget(this);
	if(options.standardControls || options.label) var lc = new org.sarsoft.MapLabelWidget(this);
	if(options.standardControls || options.separators) {
		this.addMenuItem(jQuery('<span>&nbsp;<span style="border-left: 1px dashed #CCCCCC">&nbsp;</span></span>')[0], 20);
		this.addMenuItem(jQuery('<span>&nbsp;<span style="border-left: 1px dashed #CCCCCC">&nbsp;</span></span>')[0], 100);
	}
	
	$(map.getDiv()).addClass("printnotransform");

	if(options.container != null) {
		this.container = new Object();
		this.container.top = $(options.container);
		this.container.left = $(this.container.top.children()[0]);
		this.container.right = $(this.container.top.children()[1]);
		this.container.canvas = $(this.container.right[0]);

		this.container.top.addClass("printnooffset");
		if(org.sarsoft.touch) {
			this.container.left.css({position : "absolute", display : "none"});
			this.container.right.css({position : "relative", width : "100%", height: "100%"});
		} else {
			this.container.top.css({height : "100%"});
			this.container.left.css({position : "relative", float : "left", height: "100%", display : "none", "overflow-y" : "auto"});
			this.container.right.css({position : "relative", width : "100%", height: "100%"});
		}
		
		map._overlaycontrol.div.prependTo(this.container.right);
		if(this.positionInfoControl != null) {
			this.positionInfoControl.div.prependTo(this.container.right).css('z-index', '1001');
		}
		
		var dn = new org.sarsoft.DataNavigator(this);
		var dnc = new org.sarsoft.DataNavigatorToggleControl(this);
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

org.sarsoft.InteractiveMap.prototype.loadBrowserSettings = function() {
	if(YAHOO.util.Cookie.exists("org.sarsoft.browsersettings")) {
		var config = YAHOO.lang.JSON.parse(YAHOO.util.Cookie.get("org.sarsoft.browsersettings"));
		this.map.setOptions({scrollwheel: config.scrollwheelzoom, scaleControl: config.scalebar});
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
	config.base = this.map._overlaymanager.base;
	for(var key in org.sarsoft.EnhancedGMap.nativeAliases) {
		if(org.sarsoft.EnhancedGMap.nativeAliases[key] == config.base) config.base = key;
	}
	var manager = this.map._overlaymanager;
	config.layers = manager.layers.slice(0,manager.layers.length);
	config.opacity = manager.opacity.slice(0, manager.layers.length);
	var ao = manager.alphas.slice(0, manager.alphas.length);
	if(ao.length > 0) {
		for(var i = 0; i < ao.length; i++) {
			var type = this.map.mapTypes.get(ao[i]);
			if(type._cfgvalue != null) ao[i] = ao[i] + "_" + type._cfgvalue;
		}
	}
	config.alphas = (ao.length > 0 ? ao : null);
	return config;
}

org.sarsoft.InteractiveMap.prototype.setConfig = function(config) {
	if(config == null) return;
	if(config.overlay != null && config.layers == null) {
		config.layers = [config.overlay];
		config.opacity = [config.opacity];
	}
	if(config.alphaOverlays != null && config.alphas == null) config.alphas = config.alphaOverlays.split(",");

	if(config.alphas != null) {
		for (var i = 0; i < config.alphas.length; i++) {
			if(config.alphas[i] == "slp_s-11111111") config.alphas[i] = "sf";
			if(config.alphas[i].indexOf("_") >= 0) {
				var parts = names[i].split("_");
				config.alphas[i] = parts[0];
				var cfg = this.map._overlaymanager.getConfigFromAlias(parts[0]);
				if(cfg._vtemplate == null) cfg._vtemplate = cfg.template;
				cfg.template = cfg._vtemplate.replace(/{V}/,parts[1]);
				this.map.mapTypes.get(parts[0])._cfgvalue = parts[1];
			}
		}
	}
	if(config.base == null) return;
	this.setMapLayers(config.base, config.layers, config.opacity, config.alphas);
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
		if(way.displayMessage == null) {
			that._infomessage(way.name);
		} else {
			that._infomessage(way.displayMessage);
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
	this.unselect(way);
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
	var icon = (config.icon) ? config.icon : org.sarsoft.MapUtil.createFlatCircleImage(12, config.color);
	var tt = tooltip;
	if(typeof tt == "undefined") tt = waypoint.name;
	tt = tt +  "  (" + GeoUtil.GLatLngToUTM(GeoUtil.fromWGS84(new google.maps.LatLng(waypoint.lat, waypoint.lng))).toString() + ")";
	var marker = new google.maps.Marker({title: tt, icon: icon, position: gll, map: this.map, shape: icon.shape });
	
	if(config.drag != null) {
		marker.setDraggable(true);
		google.maps.event.addListener(marker, "dragend", function() { config.drag(marker.getPosition())});
	}
	google.maps.event.addListener(marker, "mouseover", function() {
		if(waypoint.displayMessage == null) {
			that._infomessage(label);
		} else {
			that._infomessage(waypoint.displayMessage);
		}
	});
	marker.id = waypoint.id;
	if(label != null && config.drag == null) {
		labelOverlay = new Label(this.map, gll, "<span class='maplabel'>" + label + "</span>", "width: 8em", new google.maps.Size(icon.size.width*0.5, icon.size.height*-0.5));
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
	this.unselect(waypoint);
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
		}

		google.maps.event.addListener(imap.map, "idle", function() {
			if(!that.ignorehash) that.saveMap();
		});
	}
	this.checkhashupdate();
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
	var clc = imap.registered["org.sarsoft.controller.CustomLayerController"];
	if(clc != null && clc.dao[0].objs.length > 0) hash = hash + "&cl=" + encodeURIComponent(YAHOO.lang.JSON.stringify(clc.dehydrate()));
	var pbc = imap.registered["org.sarsoft.PrintBoxController"];
	if(pbc != null) hash = hash + "&print=" + encodeURIComponent(YAHOO.lang.JSON.stringify(pbc.getURLState()));
	return hash;
}

org.sarsoft.MapURLHashWidget.prototype.saveMap = function() {
	var hash = org.sarsoft.MapURLHashWidget.createConfigStr(this.imap);
	if(imap.registered["org.sarsoft.DataNavigator"] != null && imap.registered["org.sarsoft.DataNavigator"].defaults.sharing != null) {
		var url = "http://" + window.location.host + '/map.html#' + hash;
		imap.registered["org.sarsoft.DataNavigator"].defaults.sharing.settings.html('Share this map by giving people the following URL: <a style="word-wrap: break-word" href="' + url + '">' + url + '</a><br/><br/>' +
		'Embed it in a webpage or forum:<textarea rows="4" cols="60" style="vertical-align: text-top">&lt;iframe width="500px" height="500px" src="' + url + '"&gt;&lt;/iframe&gt;</textarea>');
	}
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
		if(prop[0] == "cl") config.georef = YAHOO.lang.JSON.parse(decodeURIComponent(prop[1]));
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
	if(config.georef != null) {
		for(var i = 0; i < config.georef.length; i++) {
			org.sarsoft.controller.CustomLayerController.refreshLayers(this.imap, config.georef[i]);
		}
	}
	if(config.base != null) this.imap.setConfig(config);
	this.config = config;
	this.ignorehash=false;
	if(imap.registered["org.sarsoft.DataNavigator"] != null && imap.registered["org.sarsoft.DataNavigator"].defaults.sharing != null) {
		var url = "http://" + window.location.host + '/map.html#' + hash;
		imap.registered["org.sarsoft.DataNavigator"].defaults.sharing.settings.html('Share this map by giving people the following URL: <a style="word-wrap: break-word" href="' + url + '">' + url + '</a><br/><br/>' +
		'Embed it in a webpage or forum:<textarea rows="4" cols="60" style="vertical-align: text-top">&lt;iframe width="500px" height="500px" src="' + url + '"&gt;&lt;/iframe&gt;</textarea>');
	}
	if(config.georef != null && imap.registered["org.sarsoft.controller.CustomLayerController"] != null) {
		imap.registered["org.sarsoft.controller.CustomLayerController"].rehydrate(config.georef);
	}
	if(config.print != null && imap.registered["org.sarsoft.PrintBoxController"] != null) {
		imap.registered["org.sarsoft.PrintBoxController"].setURLState(config.print);
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
	this.toggle.setValue(this.track);
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
	this.min = jQuery('<img style="cursor: pointer; width: 12px; height: 12px" src="' + org.sarsoft.imgPrefix + '/right.png"/>').appendTo(this.ctrl);
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
		this.min.attr("src", org.sarsoft.imgPrefix + "/right.png");
		this.minimized = false;
	} else {
		this.ctrl.css("padding-right", "1em");
		this.premsg.css("display", "none");
		this.msg.css("display", "none");
		this.min.attr("src", org.sarsoft.imgPrefix + "/left.png");
		this.minimized = true;
	}
}

org.sarsoft.MapInfoControl.prototype.setMessage = function(message) {
	this.msg.html(message);
}

if(typeof org.sarsoft.widget == "undefined") org.sarsoft.widget = new Object();

org.sarsoft.widget.BrowserSettings = function(imap, container) {
	this.tree = new org.sarsoft.DNTree(container, '<img style="vertical-align: text-bottom; margin-right: 2px" src="' + org.sarsoft.imgPrefix + '/config.png"/>Browser Settings');
	var cbcontainer = jQuery('<div style="padding-top: 3px; padding-bottom: 3px"></div>').appendTo(this.tree.body);
	var pos = jQuery('<select style="margin-left: 1em">' + (org.sarsoft.touch ? '' : '<option value="1">Cursor</option>') + '<option value="2">Center</option><option value="0">None</option></select>').appendTo(jQuery('<div style="white-space: nowrap">Show Position:</div>').appendTo(cbcontainer)).change(function() {
		var val = 1*pos.val();
		imap.registered["org.sarsoft.PositionInfoControl"].setValue(val);
		org.sarsoft.setCookieProperty("org.sarsoft.browsersettings", "position", val);
	});

	var llContainer = jQuery('<div>Lat/Lng Format:</div>').appendTo(cbcontainer);
	var llSelect = jQuery('<select style="margin-left: 1em"><option value="DD">DD</option><option value="DDMMHH">DMH</option><option value="DDMMSS">DMS</option></select>').appendTo(llContainer).change(function() {
		var val = llSelect.val();
		org.sarsoft.setCookieProperty("org.sarsoft.browsersettings", "coordinates", val);
		org.sarsoft.EnhancedGMap._coordinates = val;
		if(imap.registered["org.sarsoft.UTMGridControl"] != null) imap.registered["org.sarsoft.UTMGridControl"]._drawUTMGrid(true);
		if(imap.registered["org.sarsoft.PositionInfoControl"] != null) imap.registered["org.sarsoft.PositionInfoControl"].update(imap.map.getCenter());
	});

	var sb = jQuery('<input type="checkbox"/>').prependTo(jQuery('<div style="white-space: nowrap;">Show Scale Bar</div>').appendTo(cbcontainer)).change(function() {
		org.sarsoft.setCookieProperty("org.sarsoft.browsersettings", "scalebar", sb[0].checked);
		imap.loadBrowserSettings();
	});
	if(!org.sarsoft.touch) var swz = jQuery('<input type="checkbox"/>').prependTo(jQuery('<div style="white-space: nowrap;">Enable Scroll Wheel Zoom</div>').appendTo(cbcontainer)).change(function() {
		org.sarsoft.setCookieProperty("org.sarsoft.browsersettings", "scrollwheelzoom", swz[0].checked);
		imap.loadBrowserSettings();
	});
	var overzoomcb = jQuery('<input type="checkbox"/>').prependTo(jQuery('<div>Allow Zooming Beyond Default Map Resolutions</div>').appendTo(cbcontainer)).change(function() {
		org.sarsoft.EnhancedGMap._overzoom = overzoomcb[0].checked;
		org.sarsoft.setCookieProperty("org.sarsoft.browsersettings", "overzoom", org.sarsoft.EnhancedGMap._overzoom);
		imap.map._overlaymanager.checkMaxZoom();
	});
	
	this.tree.body.css('display', 'none');
	
	var config = {}
	if(YAHOO.util.Cookie.exists("org.sarsoft.browsersettings")) {
		config = YAHOO.lang.JSON.parse(YAHOO.util.Cookie.get("org.sarsoft.browsersettings"));
	}
	if(typeof swz != "undefined") swz[0].checked = (config.scrollwheelzoom == false ? false : true);
	sb[0].checked = config.scalebar;
	org.sarsoft.EnhancedGMap._overzoom = (config.overzoom == false ? false : true);
	imap.map._overlaymanager.checkMaxZoom();
	overzoomcb[0].checked = org.sarsoft.EnhancedGMap._overzoom;
	if(config.position != null) {
		pos.val(config.position);
		imap.registered["org.sarsoft.PositionInfoControl"].setValue(config.position);
	}
	if(config.coordinates != null) {
		llSelect.val(config.coordinates);
		org.sarsoft.EnhancedGMap._coordinates = config.coordinates;
		if(imap.registered["org.sarsoft.UTMGridControl"] != null) imap.registered["org.sarsoft.UTMGridControl"]._drawUTMGrid(true);
		if(imap.registered["org.sarsoft.PositionInfoControl"] != null) imap.registered["org.sarsoft.PositionInfoControl"].update(imap.map.getCenter());
	}
}

org.sarsoft.widget.MapLayers = function(imap, container) {
	var that = this;
	
	this.tree = new org.sarsoft.DNTree(container, '<img style="vertical-align: text-bottom; margin-right: 2px" src="' + org.sarsoft.imgPrefix + '/layers.png"/>Map Layers');
	if(org.sarsoft.tenantid != null) this.tree.body.css('display', 'none');

	this.availableLayers = jQuery('<div style="margin-bottom: 3px; margin-top: 3px; font-weight: bold; color: black; cursor: pointer"><img style="vertical-align: text-bottom; margin-right: 2px" src="' + org.sarsoft.imgPrefix + '/networkfolder.png"/>Available Data Sources</div>').appendTo(this.tree.body);
	
	if(org.sarsoft.EnhancedGMap.sampleMapTypes != null) {
		this.sampleMaps = new org.sarsoft.DNTree(this.tree.body, '<img style="vertical-align: text-bottom; margin-right: 2px" src="' + org.sarsoft.imgPrefix + '/favorites.png"/>Popular Combinations');
		this.sampleMaps.body.css('padding-left', '18px');
		
		var samples = org.sarsoft.EnhancedGMap.sampleMapTypes.split(';');
		for(var i = 0; i < samples.length; i++) {
			var name = samples[i].split(':')[0];
			var cfg = samples[i].split(':')[1];
			var devnull = function(c) {
				jQuery('<div style="margin-bottom: 3px; margin-top: 3px; font-style: normal; color: black; cursor: pointer">' + name + '</div>').appendTo(that.sampleMaps.body).click(function() {
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
			var config = imap.getConfig();
			org.sarsoft.EnhancedGMap.visibleMapTypes = [];
			for(var i = 0; i < org.sarsoft.EnhancedGMap.defaultMapTypes.length; i++) {
				var type = org.sarsoft.EnhancedGMap.defaultMapTypes[i];
				if(checkboxes[type.alias][0].checked==true) org.sarsoft.EnhancedGMap.visibleMapTypes.push(type.alias);
			}
			imap.map._overlaycontrol.resetMapTypes();
			imap.setConfig(config);
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
					checkboxes[key][0].checked = (org.sarsoft.EnhancedGMap.visibleMapTypes.indexOf(key) >= 0) ? true : false;
					checkboxes[key].change();
				}
				layerpane.show();
			}
		});
	}, 1000);	
}

org.sarsoft.widget.Sharing = function(imap, container) {
	var that = this;
	
	this.sharing = jQuery('<div style="margin-bottom: 3px; margin-top: 3px; font-weight: bold; color: black; cursor: pointer; margin-right: 2px"><img style="vertical-align: text-bottom; margin-right: 2px" src="' + org.sarsoft.imgPrefix + '/sharing.png"/>Sharing</div>').appendTo(container);
	this.settings = jQuery('<div></div>');
	var body = jQuery('<div></div>').append(this.settings);
	var sharingDlg = new org.sarsoft.view.MapDialog(imap, "Sharing", body, "OK", "Cancel", function() {
		if(that.handler != null) that.handler();
	});
	this.sharing.click(function() {sharingDlg.swap();});

	if(org.sarsoft.tenantid != null) {

		body.prepend('<div style="font-size: 120%; color: #5a8ed7">Share</div>');
		
		this.collaborate = jQuery('<div><div style="font-size: 120%; color: #5a8ed7; padding-top: 5px">Collaborate</div></div>').appendTo(body);
				
		this.sync = jQuery('<input type="checkbox"/>').prependTo(jQuery('<div>Sync map to changes made by other users.  Work on the same map together.</div>').appendTo(this.collaborate));
		this.sync.change(function() {
			if(that.timer != null) {
				clearInterval(that.timer);
				that.timer = null;
			}
			if(that.killswitch != null) {
				clearTimeout(that.killswitch);
				that.killswitch = null;
			}
			var val = that.sync.attr("checked")=="checked";
			if(val) {
				alert('This page will automatically sync with changes made by other users for the next hour.');
				that.timer = setInterval(function() {that.imap.timer();}, 10000);
				that.killswitch = setTimeout(function() { that.toggle.setValue(false); clearInterval(that.timer); that.timer = null; that.killswitch = null}, 3600000)
			}
		});

		if(org.sarsoft.map.autoRefresh) {
			this.sync.attr("checked", "checked");
		}
	}
	
}

org.sarsoft.widget.Account = function(imap, container, acctlink) {
	
	this.maps = jQuery('<div style="margin-bottom: 3px; margin-top: 3px; font-weight: bold; color: black; cursor: pointer"><img style="vertical-align: text-bottom; margin-right: 2px" src="' + org.sarsoft.imgPrefix + '/folder.png"/>Your Maps</div>').appendTo(container);
	
	var bn = jQuery('<div></div>');
	var accountpane = new org.sarsoft.view.MapRightPane(imap, bn);
	var header = jQuery('<div style="float: left; width: 90%; padding-bottom: 1em"></div>').appendTo(bn);
	jQuery('<div style="font-size: 150%; font-weight: bold">Your Account</div>').appendTo(header);
	
	acctlink.click(function() {
		if(accountpane.visible()) {
			accountpane.hide();
		} else {
			accountpane.show();
		}
	});
	
	jQuery('<div style="clear: both"><a style="font-weight: bold; color: #5a8ed7" href="javascript:window.location=\'/app/logout?dest=/map.html#\' + org.sarsoft.MapURLHashWidget.createConfigStr(imap)">Logout of ' + org.sarsoft.version + '</a></div>').appendTo(bn);

	var uname = jQuery('<b></b>').appendTo(jQuery('<div style="max-width: 500px; padding-top: 1em">Your email is <b>' + org.sarsoft.username + '</b>.  By default, your account name will show up ' +
			'as a shortened version of your email.  You can choose a different username by entering it below or leave the box blank to ' +
			'use the default name.<br/><br/>Your current username is </div>').appendTo(bn));
	
	var i = jQuery('<input type="text" size="15" name="alias" value="' + org.sarsoft.alias + '"/>=').appendTo(bn);
	jQuery('<button>GO</button>').appendTo(bn).click(function() {
		var dao = new org.sarsoft.BaseDAO();
		dao.baseURL = "";
		dao._doPost("/rest/account", { success : function(obj) {
			i.val(obj.alias);
			accountpane.hide();
		}, failure: function(obj) {
			i.val(obj.alias);
			alert("Error updating username.");
		}
		}, {}, "alias=" + i.val());
	});

	var bn = jQuery('<div></div>');
	var tenantpane = new org.sarsoft.view.MapRightPane(imap, bn);
	var header = jQuery('<div style="float: left; width: 90%; padding-bottom: 1em"></div>').appendTo(bn);
	jQuery('<div style="font-size: 150%; font-weight: bold">Your Maps</div>').appendTo(header);
	var newmap = jQuery('<div style="clear: both; padding-top: 5px"></div>').appendTo(header);
	

	this.maps.click(function() {
		if(tenantpane.visible()) {
			tenantpane.hide();
		} else {
			tenantpane.show();
		}
	});
		
	var tenantDAO = new org.sarsoft.TenantDAO();
	var yourTable = new org.sarsoft.view.TenantTable({owner : false, comments : true, sharing : true, actions : false});
	yourTable.create(jQuery('<div class="growYUITable" style="clear: both"></div>').appendTo(bn)[0]);

	// prioritize page loading
	window.setTimeout(function() {
		tenantDAO.loadByClassName("org.sarsoft.markup.model.CollaborativeMap", function(rows) {
			yourTable.update(rows);
		});
	}, 1000);

	var d = jQuery('<div></div>').appendTo(newmap);
	var newform = jQuery('<form action="/map" method="post" id="createmapform" style="display: inline-block">Create a new map named: </form>').appendTo(d);
	var newName = jQuery('<input type="text" name="name"/>').appendTo(newform);
	
	var newlat = jQuery('<input type="hidden" name="lat"/>').appendTo(newform);
	var newlng = jQuery('<input type="hidden" name="lng"/>').appendTo(newform);
	var mapcfg = jQuery('<input type="hidden" name="mapcfg"/>').appendTo(newform);

	jQuery('<button>Create</button>').appendTo(d).click(function(evt) {
		var name = newName.val();
		if(name == null || name == "") {
			alert('Please enter a name for this map.');
			return;
		}
		var center = imap.map.getCenter();
		newlat.val(center.lat());
		newlng.val(center.lng());
		var bcw = imap.registered["org.sarsoft.view.BaseConfigWidget"];
		var cfg = {}
		if(bcw != null) {
			cfg = bcw._toConfigObj();
		} else {
			cfg = imap.getConfig();
		}
		mapcfg.val(YAHOO.lang.JSON.stringify(cfg));				
		newform.submit();
	});
	
}

org.sarsoft.widget.NoAccount = function(imap, container) {
	var that = this;
	
	this.login = function(provider) {
		var clientState = new Object();
		for(var key in imap.registered) {
			if(imap.registered[key].dehydrate != null) clientState[key] = imap.registered[key].dehydrate();
		}
		if(org.sarsoft.tenantid == null) {
			form_yahoo.append(jQuery('<input type="hidden" name="domain"/>').val(provider));
			form_yahoo.append(jQuery('<input type="hidden" name="dest"/>').val(window.location));
			form_yahoo.append(jQuery('<input type="hidden" name="clientState"/>').val(YAHOO.lang.JSON.stringify(clientState)));
			form_yahoo.submit();
		} else {
			window.location='/app/openidrequest?domain=' + provider + '&dest=' + encodeURIComponent(window.location);
		}
	}

	var form_yahoo = jQuery('<form action="/app/openidrequest" method="POST"></form>');
	var login_yahoo = jQuery('<a href="#"><img style="border: none; vertical-align: middle" src="http://l.yimg.com/a/i/reg/openid/buttons/14.png"/></a>').appendTo(form_yahoo);
	login_yahoo.click(function() {
		that.login('yahoo');
	});
	var form_google = jQuery('<form action="/app/openidrequest" method="POST"></form>');
	var login_google = jQuery('<a href="#"><span style="font-weight: bold; color: #1F47B2">Sign in through G<span style="color:#C61800">o</span><span style="color:#BC2900">o</span>g<span style="color:#1BA221">l</span><span style="color:#C61800">e</span></span></a>').appendTo(form_google);
	login_google.click(function() {
		that.login('google');
	});
	container.append(jQuery('<div style="padding-top: 5px"></div>').append(form_yahoo)).append(
			jQuery('<div style="white-space: nowrap; padding-top: 5px"></div>').append(form_google));
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
	if(typeof google.maps.Geocoder == 'undefined' || noLookup) {
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
	} else if(addr != null && addr.length > 0 && typeof google.maps.Geocoder != 'undefined') {
		var gcg = new google.maps.Geocoder();
		gcg.geocode({address: addr}, function(result, status) { if(status!=google.maps.GeocoderStatus.OK) return; callback(result[0].geometry.location); });
	} else if(type == "DD"){
		var lat = this.lat.val();
		var lng = this.lng.val();
		if(lat != null && lat.length > 0 && lng != null && lng.length > 0) {
			callback(new google.maps.LatLng(1*lat, 1*lng));
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
	this.lat = jQuery('<input type="text" size="8"/>').appendTo(dd);
	dd.append(", ");
	this.lng = jQuery('<input type="text" size="8"/>').appendTo(dd);
	
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

GeoUtil.wpt2gll = function(wpt) {
	return new google.maps.LatLng(wpt.lat, wpt.lng);
}

GeoUtil.wpts2path = function(waypoints) {
	var path = [];
	for(var i = 0; i < waypoints.length; i++) path.push(GeoUtil.wpt2gll(waypoints[i]));
	return path;
}

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
	return new google.maps.LatLng(GeoUtil.RadToDeg(ll[0]),GeoUtil.RadToDeg(ll[1]));
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
	
	return new google.maps.LatLng(GeoUtil.RadToDeg(lat+dLat), GeoUtil.RadToDeg(lng+dLng));
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

org.sarsoft.MapUtil.createImage = function(size, url) {
  return new google.maps.MarkerImage(url, new google.maps.Size(size, size), null, new google.maps.Point(size/2, size/2));
}

org.sarsoft.MapUtil.createFlatCircleImage = function (size, color) {
  if(color.indexOf('#') == 0) color = color.substring(1);
  var url = "/resource/imagery/icons/circle/" + color + ".png";
  var img = new google.maps.MarkerImage(url, new google.maps.Size(size, size), null, new google.maps.Point(size/2, size/2));
  img.shape = { type: "circle", coords: [5, 5, 6]}
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
