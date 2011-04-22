if(typeof org == "undefined") org = new Object();
if(typeof org.sarsoft == "undefined") org.sarsoft = new Object();

if(typeof org.sarsoft.EnhancedGMap == "undefined") org.sarsoft.EnhancedGMap = function() {}

org.sarsoft.EnhancedGMap.prototype.createMapType = function(config) {
	if(config.type == "NATIVE") return eval(config.template);
	var layers = this.createTileLayers(config);
    return new GMapType(layers, G_SATELLITE_MAP.getProjection(), config.name, { errorMessage: "error w topo", tileSize: config.tilesize ? config.tilesize : 256 } );
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
		map.addControl(new OverlayDropdownMapControl());
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
	this.types = map.getMapTypes();
	this.typeSelect = this._createSelect(this.types);
	this.overlaySelect = this._createSelect(this.types);
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

	var div = document.createElement("div");
	div.appendChild(document.createTextNode("background: "));
	div.appendChild(this.typeSelect);
	div.appendChild(document.createTextNode("overlay: "));
	div.appendChild(this.overlaySelect);
	div.appendChild(this.opacityInput);
	var go = document.createElement("button");
	go.appendChild(document.createTextNode("GO"));
	div.appendChild(go);
	map.getContainer().appendChild(div);

	GEvent.addDomListener(go, "click", function() {
		var base = that.types[that.typeSelect.value];
		var overlay = that.types[that.overlaySelect.value];
		var opacity = that.opacityInput.value;
		if(opacity < 0) opacity = 0;
		if(opacity > 100) opacity = 100;
		opacity = opacity / 100;
		that.updateMap(base, overlay, opacity);
	});
	return div;
}

OverlayDropdownMapControl.prototype.updateMap = function(base, overlay, opacity) {
		this.opacityInput.value=opacity*100;
		for(var i = 0; i < this.types.length; i++) {
			if(this.types[i] == base) this.typeSelect.value = i;
			if(this.types[i] == overlay) this.overlaySelect.value = i;
		}
		if(overlay.getMaximumResolution != null && base.getMaximumResolution() > overlay.getMaximumResolution()) {
			// google maps doesn't seem to check the overlays' min and max resolutions
			// null check overlay to handle georef'd imagery
			var tmp = overlay;
			overlay = base;
			base = tmp;
			opacity = 1-opacity;
		}
		this.map.setMapType(base);
		if(typeof this._overlays != "undefined") {
			for(var i = 0; i < this._overlays.length; i++) {
				this.map.removeOverlay(this._overlays[i]);
			}
		}
		this._overlays = new Array();
		if(overlay.angle != null) {
			this._overlays[0] = new GeoRefImageOverlay(new GPoint(1*overlay.originx, 1*overlay.originy), new GLatLng(1*overlay.originlat, 1*overlay.originlng), overlay.angle, overlay.scale, overlay.id, new GSize(1*overlay.width, 1*overlay.height), opacity);
			this.map.addOverlay(this._overlays[0]);
		} else {
			var layers = overlay.getTileLayers();
			for(var i = 0; i < layers.length; i++) {
				this._overlays[i] = new GTileLayerOverlay(new org.sarsoft.GAlphaTileLayerWrapper(overlay.getTileLayers()[i], opacity));
				this.map.addOverlay(this._overlays[i]);
				this.map._sarsoft_overlay_type = overlay;
				this.map._sarsoft_overlay_opacity = opacity;
			}
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

org.sarsoft.FixedGMap = function(map) {
	var that = this;
	this.map = map;
	this.polys = new Object();
	this.overlays = new Array();
	this.rangerings = new Array();
	this.text = new Array();
	this.markers = new Array();
	this.utmgridlines = new Array();
	this.utminitialized = false;
	if(typeof map != "undefined") {
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
	}
}

org.sarsoft.FixedGMap.prototype.getConfig = function() {
	var config = new Object();
	config.base = this.map.getCurrentMapType().getName();
	config.overlay = this.map._sarsoft_overlay_type ? this.map._sarsoft_overlay_type.getName() : null;
	config.opacity = this.map._sarsoft_overlay_opacity;
	return config;
}

org.sarsoft.FixedGMap.prototype.setConfig = function(config) {
	this.setMapLayers(config.base, config.overlay, config.opacity);
}

org.sarsoft.FixedGMap.prototype.setMapLayers = function(baseName, overlayName, opacity) {
	var types = this.map.getMapTypes();
	var base = null;
	var overlay = null;
	opacity = opacity ? opacity : 0;
	for(var i = 0; i < types.length; i++) {
		if(types[i].getName != null && types[i].getName() == baseName) base = types[i];
		if(types[i].getName != null && types[i].getName() == overlayName) overlay = types[i];
		if(types[i].name == overlayName) overlay = types[i];
	}
	if(base != null && overlay != null) this.map._overlaydropdownmapcontrol.updateMap(base, overlay, opacity);
}

org.sarsoft.FixedGMap.prototype._drawUTMGrid = function() {
	if(typeof this.utmgridcoverage != "undefined" && this.utmgridcoverage.getSouthWest().distanceFrom(this.map.getBounds().getSouthWest()) == 0 &&
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
	var bounds = this.map.getBounds();
	var span = bounds.getSouthWest().distanceFrom(bounds.getNorthEast());
	var spacing = 1000;
	if(span > 30000) spacing = 10000;
	if(span > 300000) spacing = 100000;
	
	var sw = GeoUtil.GLatLngToUTM(bounds.getSouthWest());
	var ne = GeoUtil.GLatLngToUTM(bounds.getNorthEast());
	if(ne.zone - sw.zone > 1) return;
	this._drawUTMGridForZone(sw.zone, spacing, false);
	if(sw.zone != ne.zone)  this._drawUTMGridForZone(ne.zone, spacing, true);
}

org.sarsoft.FixedGMap.prototype._drawUTMGridForZone = function(zone, spacing, right) {
	var bounds = this.map.getBounds();
	var sw = GeoUtil.GLatLngToUTM(bounds.getSouthWest(), zone);
	var ne = GeoUtil.GLatLngToUTM(bounds.getNorthEast(), zone);
	sw.e = sw.e-spacing;
	sw.n = sw.n-spacing;
	ne.e = ne.e+spacing;
	ne.n = ne.n+spacing;

	var east = GeoUtil.getEastBorder(zone);
	var west = GeoUtil.getWestBorder(zone);

	function createText(meters) {
		return "<div style=\"color:#0000FF; background: #FFFFFF\"><b>" + Math.round(meters/1000) + "</b><span style=\"font-size: smaller\">000</span></div>";
	}

	var easting = Math.round(sw.e / spacing)  * spacing;
	var pxmax = this.map.fromLatLngToContainerPixel(bounds.getNorthEast()).x;
	var pymax = this.map.fromLatLngToContainerPixel(bounds.getSouthWest()).y;
	while(easting < ne.e) {
		var vertices = new Array();
		vertices.push(GeoUtil.UTMToGLatLng({e: easting, n: sw.n, zone: zone}));
		vertices.push(GeoUtil.UTMToGLatLng({e: easting, n: ne.n, zone: zone}));

		if(west < vertices[0].lng() && vertices[0].lng() < east) {
			var overlay = new GPolyline(vertices, "#0000FF", 1, 1);
			this.utmgridlines.push(overlay);
			this.map.addOverlay(overlay);

			var offset = this.map.fromLatLngToContainerPixel(vertices[0]).x;
			if(0 < offset && offset < pxmax) {
				var point = new GPoint(offset, pymax-10);
				var label = new ELabel(this.map.fromContainerPixelToLatLng(point), createText(easting));
				this.map.addOverlay(label);
				this.text.push(label);
			}
		}
		easting = easting + spacing;
	}
	var northing = Math.round(sw.n / spacing) * spacing;
	while(northing < ne.n) {
		var vertices = new Array();
		var start = GeoUtil.UTMToGLatLng({e: sw.e, n: northing, zone: zone});
		if(start.lng() < west) {
			start = GeoUtil.UTMToGLatLng({e: GeoUtil.GLatLngToUTM(new GLatLng(start.lat(), west), zone).e, n: northing, zone: zone});
		}
		vertices.push(start);
		var end = GeoUtil.UTMToGLatLng({e: ne.e, n: northing, zone: zone});
		if(end.lng() > east) {
			end = GeoUtil.UTMToGLatLng({e: GeoUtil.GLatLngToUTM(new GLatLng(end.lat(), east), zone).e, n: northing, zone: zone});
		}
		vertices.push(end);

		var overlay = new GPolyline(vertices, "#0000FF", 1, 1);
		this.utmgridlines.push(overlay);
		this.map.addOverlay(overlay);

		var offset = this.map.fromLatLngToContainerPixel(vertices[0]).y;
		if(0 < offset && offset < pymax) {
			var point = new GPoint(0, offset);
			if(right) {
				point = new GPoint(this.map.getSize().width-50, this.map.fromLatLngToContainerPixel(vertices[1]).y);
			}
			var label = new ELabel(this.map.fromContainerPixelToLatLng(point), createText(northing));
			this.map.addOverlay(label);
			this.text.push(label);
		}
		northing = northing + spacing;
	}

}

org.sarsoft.FixedGMap.prototype._createPolygon = function(vertices, config) {
	var that = this;
	var color = config.color;
	if(config.opacity == null) config.opacity = 100;
	if(config.fill == null) config.fill = 35
	var poly = new GPolygon(vertices, color, 2, Math.max(Math.min(config.opacity/100, 1), 0), color, config.fill/100);
	this.map.addOverlay(poly);
	return poly;
}

org.sarsoft.FixedGMap.prototype._createPolyline = function(vertices, config) {
	if(config.opacity == null) config.opacity = 100;
	var poly = new GPolyline(vertices, config.color, 3, Math.max(Math.min(config.opacity/100, 1), 0));
	this.map.addOverlay(poly);
	return poly;
}

org.sarsoft.FixedGMap.prototype._removeOverlay = function(way) {
	var overlay = this.polys[way.id].overlay;
	this.map.removeOverlay(overlay);
	if(overlay.label != null) this.map.removeOverlay(overlay.label);
}

org.sarsoft.FixedGMap.prototype._addOverlay = function(way, config, label) {
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
			labelOverlay = new ELabel(new GLatLng(labelwpt.lat, labelwpt.lng), label);
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
	return poly;
}

org.sarsoft.FixedGMap.prototype.removeWay = function(way) {
	var id = way.id;
	if(typeof this.polys[id] != "undefined") {
		this._removeOverlay(way);
		delete this.polys[id];
	}
}


org.sarsoft.FixedGMap.prototype.addWay = function(way, config, label) {
	this.removeWay(way);
	this.polys[way.id] = { way: way, overlay: this._addOverlay(way, config, label), config: config};
}

org.sarsoft.FixedGMap.prototype.addRangeRing = function(center, radius, vertices) {
	var glls = new Array();
	var centerUTM = GeoUtil.GLatLngToUTM(center);
	for(var i = 0; i <= vertices; i++) {
		var vertexUTM = new UTM(centerUTM.e + radius*Math.sin(i*2*Math.PI/vertices), centerUTM.n + radius*Math.cos(i*2*Math.PI/vertices), centerUTM.zone);
		glls.push(GeoUtil.UTMToGLatLng(vertexUTM));
	}
	var poly = new GPolyline(glls, "000000", 1, 1);
	this.map.addOverlay(poly);
	this.rangerings.push(poly);
}

org.sarsoft.FixedGMap.prototype.removeRangeRings = function() {
	for(var i = 0; i < this.rangerings.length; i++) {
		this.map.removeOverlay(this.rangerings[i]);
	}
	this.rangerings = new Array();
}

org.sarsoft.FixedGMap.prototype._removeMarker = function(waypoint) {
	var marker = this.markers[waypoint.id].marker;
	this.map.removeOverlay(marker);
	if(marker.label != null) this.map.removeOverlay(marker.label);
}

org.sarsoft.FixedGMap.prototype._addMarker = function(waypoint, config, tooltip, label) {
	var that = this;
	var id = waypoint.id;
	var gll = new GLatLng(waypoint.lat, waypoint.lng);
	var icon = createFlatCircleIcon(12, config.color);
	if(typeof tooltip == "undefined") tooltip = waypoint.name;
	tooltip = tooltip +  "  (" + GeoUtil.GLatLngToUTM(gll).toString() + ")";
	var marker = new GMarker(gll, { title : tooltip, icon : icon});
	this.map.addOverlay(marker);
	marker.id = waypoint.id;
	if(label != null) {
		labelOverlay = new ELabel(gll, label);
		this.map.addOverlay(labelOverlay);
		marker.label = labelOverlay;
	}
	return marker;
}

org.sarsoft.FixedGMap.prototype.removeWaypoint = function(waypoint) {
	var id = waypoint.id;
	if(typeof this.markers[id] != "undefined") {
		this._removeMarker(waypoint);
		delete this.markers[id];
	}
}

org.sarsoft.FixedGMap.prototype.addWaypoint = function(waypoint, config, tooltip, label) {
	this.removeWaypoint(waypoint);
	this.markers[waypoint.id] = { waypoint: waypoint, marker: this._addMarker(waypoint, config, tooltip, label), config: config};
}

org.sarsoft.EditableGMap = function(map, infodiv) {
	org.sarsoft.FixedGMap.call(this, map);
	var that = this;
	this._handlers = new Object();

	this._infodiv = infodiv;

	GEvent.addListener(map, "singlerightclick", function(point, src, overlay) {
		var obj = null;
		if(overlay != null) {
			if(that.polys[overlay.id] != null) obj = that.polys[overlay.id].way;
			if(that.markers[overlay.id] != null) obj = that.markers[overlay.id].waypoint;
		}
		if(typeof that._handlers["singlerightclick"] != "undefined") {
			for(var i = 0; i < that._handlers["singlerightclick"].length; i++) {
				that._handlers["singlerightclick"][i](point, obj);
				}
		}
	});

	GEvent.addListener(map, "mousemove", function(latlng) {
		var utm = GeoUtil.GLatLngToUTM(latlng);
		that._positionMessage(utm.toString());
	});
}

org.sarsoft.EditableGMap.prototype = new org.sarsoft.FixedGMap();

org.sarsoft.EditableGMap.prototype._positionMessage = function(message) {
	document.getElementById(this._infodiv.id + "_position").innerHTML = message;
}
org.sarsoft.EditableGMap.prototype._infomessage = function(message) {
	document.getElementById(this._infodiv.id + "_message").innerHTML = message;
}

org.sarsoft.EditableGMap.prototype._addOverlay = function(way, config, label) {
	var that = this;
	var poly = org.sarsoft.FixedGMap.prototype._addOverlay.call(this, way, config, label);
	GEvent.addListener(poly, "mouseover", function() {
		if(way.displayMessage == null) {
			that._infomessage("<b>" + way.name + "</b>");
		} else {
			that._infomessage("<b>" + way.displayMessage + "</b>");
		}
	});
	return poly;
}

org.sarsoft.EditableGMap.prototype.getNewWaypoints = function(point, polygon) {
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

org.sarsoft.EditableGMap.prototype._buildGLatLngListFromOverlay = function(overlay) {
	var vertices = new Array();
	var count = overlay.getVertexCount();
	for(var i = 0; i < count; i++) {
		vertices.push(overlay.getVertex(i));
	}
	return vertices;
}

org.sarsoft.EditableGMap.prototype._GLatLngListToWpt = function(glls) {
	var waypoints = new Array();
	for(var i = 0; i < glls.length; i++) {
		waypoints.push({lat: glls[i].lat(), lng: glls[i].lng()});
	}
	return waypoints;
}

org.sarsoft.EditableGMap.prototype.edit = function(id) {
	this.polys[id].overlay.enableEditing();
}

org.sarsoft.EditableGMap.prototype.save = function(id) {
	var poly = this.polys[id];
	poly.overlay.disableEditing();
	return this._GLatLngListToWpt(this._buildGLatLngListFromOverlay(poly.overlay));
}

org.sarsoft.EditableGMap.prototype.discard = function(id) {
	var label = this.polys[id].overlay.label;
	this._removeOverlay(this.polys[id].overlay);
	this.polys[id].overlay = this._addOverlay(this.polys[id].way, this.polys[id].config);
	this.polys[id].overlay.label = label;
	if(label != null) this.map.addOverlay(label);
}

org.sarsoft.EditableGMap.prototype.addListener = function(event, handler) {
	if(typeof this._handlers[event] == "undefined") this._handlers[event] = new Array();
	this._handlers[event].push(handler);
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

GeoUtil = new Object();

GeoUtil.UTMToGLatLng = function(utm) {
	var ll = new Object();
	UTMXYToLatLon(utm.e, utm.n, utm.zone, false, ll);
	return new GLatLng(RadToDeg(ll[0]),RadToDeg(ll[1]));
}

GeoUtil.GLatLngToUTM = function(gll, zone) {
	var xy = new Object();
	if(typeof zone == "undefined") zone = Math.floor ((gll.lng() + 180.0) / 6) + 1;
	var zone = LatLonToUTMXY (DegToRad(gll.lat()), DegToRad(gll.lng()), zone, xy);
	return new UTM(xy[0], xy[1], zone);
}

GeoUtil.getWestBorder = function(zone) {
	return (zone - 1)*6 - 180;
}

GeoUtil.getEastBorder = function(zone) {
	return GeoUtil.getWestBorder(zone + 1);
}

// Copyright 1997-1998 by Charles L. Taylor -->
    var pi = 3.14159265358979323;

    /* Ellipsoid model constants (actual values here are for WGS84) */
    var sm_a = 6378137.0;
    var sm_b = 6356752.314;
    var sm_EccSquared = 6.69437999013e-03;

    var UTMScaleFactor = 0.9996;


    /*
    * DegToRad
    *
    * Converts degrees to radians.
    *
    */
    function DegToRad (deg)
    {
        return (deg / 180.0 * pi)
    }




    /*
    * RadToDeg
    *
    * Converts radians to degrees.
    *
    */
    function RadToDeg (rad)
    {
        return (rad / pi * 180.0)
    }




    /*
    * ArcLengthOfMeridian
    *
    * Computes the ellipsoidal distance from the equator to a point at a
    * given latitude.
    *
    * Reference: Hoffmann-Wellenhof, B., Lichtenegger, H., and Collins, J.,
    * GPS: Theory and Practice, 3rd ed.  New York: Springer-Verlag Wien, 1994.
    *
    * Inputs:
    *     phi - Latitude of the point, in radians.
    *
    * Globals:
    *     sm_a - Ellipsoid model major axis.
    *     sm_b - Ellipsoid model minor axis.
    *
    * Returns:
    *     The ellipsoidal distance of the point from the equator, in meters.
    *
    */
    function ArcLengthOfMeridian (phi)
    {
        var alpha, beta, gamma, delta, epsilon, n;
        var result;

        /* Precalculate n */
        n = (sm_a - sm_b) / (sm_a + sm_b);

        /* Precalculate alpha */
        alpha = ((sm_a + sm_b) / 2.0)
           * (1.0 + (Math.pow (n, 2.0) / 4.0) + (Math.pow (n, 4.0) / 64.0));

        /* Precalculate beta */
        beta = (-3.0 * n / 2.0) + (9.0 * Math.pow (n, 3.0) / 16.0)
           + (-3.0 * Math.pow (n, 5.0) / 32.0);

        /* Precalculate gamma */
        gamma = (15.0 * Math.pow (n, 2.0) / 16.0)
            + (-15.0 * Math.pow (n, 4.0) / 32.0);

        /* Precalculate delta */
        delta = (-35.0 * Math.pow (n, 3.0) / 48.0)
            + (105.0 * Math.pow (n, 5.0) / 256.0);

        /* Precalculate epsilon */
        epsilon = (315.0 * Math.pow (n, 4.0) / 512.0);

    /* Now calculate the sum of the series and return */
    result = alpha
        * (phi + (beta * Math.sin (2.0 * phi))
            + (gamma * Math.sin (4.0 * phi))
            + (delta * Math.sin (6.0 * phi))
            + (epsilon * Math.sin (8.0 * phi)));

    return result;
    }



    /*
    * UTMCentralMeridian
    *
    * Determines the central meridian for the given UTM zone.
    *
    * Inputs:
    *     zone - An integer value designating the UTM zone, range [1,60].
    *
    * Returns:
    *   The central meridian for the given UTM zone, in radians, or zero
    *   if the UTM zone parameter is outside the range [1,60].
    *   Range of the central meridian is the radian equivalent of [-177,+177].
    *
    */
    function UTMCentralMeridian (zone)
    {
        var cmeridian;

        cmeridian = DegToRad (-183.0 + (zone * 6.0));
        return cmeridian;
    }



    /*
    * FootpointLatitude
    *
    * Computes the footpoint latitude for use in converting transverse
    * Mercator coordinates to ellipsoidal coordinates.
    *
    * Reference: Hoffmann-Wellenhof, B., Lichtenegger, H., and Collins, J.,
    *   GPS: Theory and Practice, 3rd ed.  New York: Springer-Verlag Wien, 1994.
    *
    * Inputs:
    *   y - The UTM northing coordinate, in meters.
    *
    * Returns:
    *   The footpoint latitude, in radians.
    *
    */
    function FootpointLatitude (y)
    {
        var y_, alpha_, beta_, gamma_, delta_, epsilon_, n;
        var result;

        /* Precalculate n (Eq. 10.18) */
        n = (sm_a - sm_b) / (sm_a + sm_b);

        /* Precalculate alpha_ (Eq. 10.22) */
        /* (Same as alpha in Eq. 10.17) */
        alpha_ = ((sm_a + sm_b) / 2.0)
            * (1 + (Math.pow (n, 2.0) / 4) + (Math.pow (n, 4.0) / 64));

        /* Precalculate y_ (Eq. 10.23) */
        y_ = y / alpha_;

        /* Precalculate beta_ (Eq. 10.22) */
        beta_ = (3.0 * n / 2.0) + (-27.0 * Math.pow (n, 3.0) / 32.0)
            + (269.0 * Math.pow (n, 5.0) / 512.0);

        /* Precalculate gamma_ (Eq. 10.22) */
        gamma_ = (21.0 * Math.pow (n, 2.0) / 16.0)
            + (-55.0 * Math.pow (n, 4.0) / 32.0);

        /* Precalculate delta_ (Eq. 10.22) */
        delta_ = (151.0 * Math.pow (n, 3.0) / 96.0)
            + (-417.0 * Math.pow (n, 5.0) / 128.0);

        /* Precalculate epsilon_ (Eq. 10.22) */
        epsilon_ = (1097.0 * Math.pow (n, 4.0) / 512.0);

        /* Now calculate the sum of the series (Eq. 10.21) */
        result = y_ + (beta_ * Math.sin (2.0 * y_))
            + (gamma_ * Math.sin (4.0 * y_))
            + (delta_ * Math.sin (6.0 * y_))
            + (epsilon_ * Math.sin (8.0 * y_));

        return result;
    }



    /*
    * MapLatLonToXY
    *
    * Converts a latitude/longitude pair to x and y coordinates in the
    * Transverse Mercator projection.  Note that Transverse Mercator is not
    * the same as UTM; a scale factor is required to convert between them.
    *
    * Reference: Hoffmann-Wellenhof, B., Lichtenegger, H., and Collins, J.,
    * GPS: Theory and Practice, 3rd ed.  New York: Springer-Verlag Wien, 1994.
    *
    * Inputs:
    *    phi - Latitude of the point, in radians.
    *    lambda - Longitude of the point, in radians.
    *    lambda0 - Longitude of the central meridian to be used, in radians.
    *
    * Outputs:
    *    xy - A 2-element array containing the x and y coordinates
    *         of the computed point.
    *
    * Returns:
    *    The function does not return a value.
    *
    */
    function MapLatLonToXY (phi, lambda, lambda0, xy)
    {
        var N, nu2, ep2, t, t2, l;
        var l3coef, l4coef, l5coef, l6coef, l7coef, l8coef;
        var tmp;

        /* Precalculate ep2 */
        ep2 = (Math.pow (sm_a, 2.0) - Math.pow (sm_b, 2.0)) / Math.pow (sm_b, 2.0);

        /* Precalculate nu2 */
        nu2 = ep2 * Math.pow (Math.cos (phi), 2.0);

        /* Precalculate N */
        N = Math.pow (sm_a, 2.0) / (sm_b * Math.sqrt (1 + nu2));

        /* Precalculate t */
        t = Math.tan (phi);
        t2 = t * t;
        tmp = (t2 * t2 * t2) - Math.pow (t, 6.0);

        /* Precalculate l */
        l = lambda - lambda0;

        /* Precalculate coefficients for l**n in the equations below
           so a normal human being can read the expressions for easting
           and northing
           -- l**1 and l**2 have coefficients of 1.0 */
        l3coef = 1.0 - t2 + nu2;

        l4coef = 5.0 - t2 + 9 * nu2 + 4.0 * (nu2 * nu2);

        l5coef = 5.0 - 18.0 * t2 + (t2 * t2) + 14.0 * nu2
            - 58.0 * t2 * nu2;

        l6coef = 61.0 - 58.0 * t2 + (t2 * t2) + 270.0 * nu2
            - 330.0 * t2 * nu2;

        l7coef = 61.0 - 479.0 * t2 + 179.0 * (t2 * t2) - (t2 * t2 * t2);

        l8coef = 1385.0 - 3111.0 * t2 + 543.0 * (t2 * t2) - (t2 * t2 * t2);

        /* Calculate easting (x) */
        xy[0] = N * Math.cos (phi) * l
            + (N / 6.0 * Math.pow (Math.cos (phi), 3.0) * l3coef * Math.pow (l, 3.0))
            + (N / 120.0 * Math.pow (Math.cos (phi), 5.0) * l5coef * Math.pow (l, 5.0))
            + (N / 5040.0 * Math.pow (Math.cos (phi), 7.0) * l7coef * Math.pow (l, 7.0));

        /* Calculate northing (y) */
        xy[1] = ArcLengthOfMeridian (phi)
            + (t / 2.0 * N * Math.pow (Math.cos (phi), 2.0) * Math.pow (l, 2.0))
            + (t / 24.0 * N * Math.pow (Math.cos (phi), 4.0) * l4coef * Math.pow (l, 4.0))
            + (t / 720.0 * N * Math.pow (Math.cos (phi), 6.0) * l6coef * Math.pow (l, 6.0))
            + (t / 40320.0 * N * Math.pow (Math.cos (phi), 8.0) * l8coef * Math.pow (l, 8.0));

        return;
    }



    /*
    * MapXYToLatLon
    *
    * Converts x and y coordinates in the Transverse Mercator projection to
    * a latitude/longitude pair.  Note that Transverse Mercator is not
    * the same as UTM; a scale factor is required to convert between them.
    *
    * Reference: Hoffmann-Wellenhof, B., Lichtenegger, H., and Collins, J.,
    *   GPS: Theory and Practice, 3rd ed.  New York: Springer-Verlag Wien, 1994.
    *
    * Inputs:
    *   x - The easting of the point, in meters.
    *   y - The northing of the point, in meters.
    *   lambda0 - Longitude of the central meridian to be used, in radians.
    *
    * Outputs:
    *   philambda - A 2-element containing the latitude and longitude
    *               in radians.
    *
    * Returns:
    *   The function does not return a value.
    *
    * Remarks:
    *   The local variables Nf, nuf2, tf, and tf2 serve the same purpose as
    *   N, nu2, t, and t2 in MapLatLonToXY, but they are computed with respect
    *   to the footpoint latitude phif.
    *
    *   x1frac, x2frac, x2poly, x3poly, etc. are to enhance readability and
    *   to optimize computations.
    *
    */
    function MapXYToLatLon (x, y, lambda0, philambda)
    {
        var phif, Nf, Nfpow, nuf2, ep2, tf, tf2, tf4, cf;
        var x1frac, x2frac, x3frac, x4frac, x5frac, x6frac, x7frac, x8frac;
        var x2poly, x3poly, x4poly, x5poly, x6poly, x7poly, x8poly;

        /* Get the value of phif, the footpoint latitude. */
        phif = FootpointLatitude (y);

        /* Precalculate ep2 */
        ep2 = (Math.pow (sm_a, 2.0) - Math.pow (sm_b, 2.0))
              / Math.pow (sm_b, 2.0);

        /* Precalculate cos (phif) */
        cf = Math.cos (phif);

        /* Precalculate nuf2 */
        nuf2 = ep2 * Math.pow (cf, 2.0);

        /* Precalculate Nf and initialize Nfpow */
        Nf = Math.pow (sm_a, 2.0) / (sm_b * Math.sqrt (1 + nuf2));
        Nfpow = Nf;

        /* Precalculate tf */
        tf = Math.tan (phif);
        tf2 = tf * tf;
        tf4 = tf2 * tf2;

        /* Precalculate fractional coefficients for x**n in the equations
           below to simplify the expressions for latitude and longitude. */
        x1frac = 1.0 / (Nfpow * cf);

        Nfpow *= Nf;   /* now equals Nf**2) */
        x2frac = tf / (2.0 * Nfpow);

        Nfpow *= Nf;   /* now equals Nf**3) */
        x3frac = 1.0 / (6.0 * Nfpow * cf);

        Nfpow *= Nf;   /* now equals Nf**4) */
        x4frac = tf / (24.0 * Nfpow);

        Nfpow *= Nf;   /* now equals Nf**5) */
        x5frac = 1.0 / (120.0 * Nfpow * cf);

        Nfpow *= Nf;   /* now equals Nf**6) */
        x6frac = tf / (720.0 * Nfpow);

        Nfpow *= Nf;   /* now equals Nf**7) */
        x7frac = 1.0 / (5040.0 * Nfpow * cf);

        Nfpow *= Nf;   /* now equals Nf**8) */
        x8frac = tf / (40320.0 * Nfpow);

        /* Precalculate polynomial coefficients for x**n.
           -- x**1 does not have a polynomial coefficient. */
        x2poly = -1.0 - nuf2;

        x3poly = -1.0 - 2 * tf2 - nuf2;

        x4poly = 5.0 + 3.0 * tf2 + 6.0 * nuf2 - 6.0 * tf2 * nuf2
        	- 3.0 * (nuf2 *nuf2) - 9.0 * tf2 * (nuf2 * nuf2);

        x5poly = 5.0 + 28.0 * tf2 + 24.0 * tf4 + 6.0 * nuf2 + 8.0 * tf2 * nuf2;

        x6poly = -61.0 - 90.0 * tf2 - 45.0 * tf4 - 107.0 * nuf2
        	+ 162.0 * tf2 * nuf2;

        x7poly = -61.0 - 662.0 * tf2 - 1320.0 * tf4 - 720.0 * (tf4 * tf2);

        x8poly = 1385.0 + 3633.0 * tf2 + 4095.0 * tf4 + 1575 * (tf4 * tf2);

        /* Calculate latitude */
        philambda[0] = phif + x2frac * x2poly * (x * x)
        	+ x4frac * x4poly * Math.pow (x, 4.0)
        	+ x6frac * x6poly * Math.pow (x, 6.0)
        	+ x8frac * x8poly * Math.pow (x, 8.0);

        /* Calculate longitude */
        philambda[1] = lambda0 + x1frac * x
        	+ x3frac * x3poly * Math.pow (x, 3.0)
        	+ x5frac * x5poly * Math.pow (x, 5.0)
        	+ x7frac * x7poly * Math.pow (x, 7.0);

        return;
    }




    /*
    * LatLonToUTMXY
    *
    * Converts a latitude/longitude pair to x and y coordinates in the
    * Universal Transverse Mercator projection.
    *
    * Inputs:
    *   lat - Latitude of the point, in radians.
    *   lon - Longitude of the point, in radians.
    *   zone - UTM zone to be used for calculating values for x and y.
    *          If zone is less than 1 or greater than 60, the routine
    *          will determine the appropriate zone from the value of lon.
    *
    * Outputs:
    *   xy - A 2-element array where the UTM x and y values will be stored.
    *
    * Returns:
    *   The UTM zone used for calculating the values of x and y.
    *
    */
    function LatLonToUTMXY (lat, lon, zone, xy)
    {
        MapLatLonToXY (lat, lon, UTMCentralMeridian (zone), xy);

        /* Adjust easting and northing for UTM system. */
        xy[0] = xy[0] * UTMScaleFactor + 500000.0;
        xy[1] = xy[1] * UTMScaleFactor;
        if (xy[1] < 0.0)
            xy[1] = xy[1] + 10000000.0;

        return zone;
    }



    /*
    * UTMXYToLatLon
    *
    * Converts x and y coordinates in the Universal Transverse Mercator
    * projection to a latitude/longitude pair.
    *
    * Inputs:
    *	x - The easting of the point, in meters.
    *	y - The northing of the point, in meters.
    *	zone - The UTM zone in which the point lies.
    *	southhemi - True if the point is in the southern hemisphere;
    *               false otherwise.
    *
    * Outputs:
    *	latlon - A 2-element array containing the latitude and
    *            longitude of the point, in radians.
    *
    * Returns:
    *	The function does not return a value.
    *
    */
    function UTMXYToLatLon (x, y, zone, southhemi, latlon)
    {
        var cmeridian;

        x -= 500000.0;
        x /= UTMScaleFactor;

        /* If in southern hemisphere, adjust y accordingly. */
        if (southhemi)
        y -= 10000000.0;

        y /= UTMScaleFactor;

        cmeridian = UTMCentralMeridian (zone);
        MapXYToLatLon (x, y, cmeridian, latlon);

        return;
    }


createFlatCircleIcon = function (size, color) {
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


function ELabel(point, html, classname, pixelOffset, percentOpacity, overlap) {
  this._olcapable = true;
  // Mandatory parameters
  this.point = point;
  this.html = html;

  // Optional parameters
  this.classname = classname||"";
  this.pixelOffset = pixelOffset||new GSize(0,0);
  if (percentOpacity) {
    if(percentOpacity<0){percentOpacity=0;}
    if(percentOpacity>100){percentOpacity=100;}
  }
  this.percentOpacity = percentOpacity;
  this.overlap=overlap||false;
  this.hidden = false;
}

ELabel.prototype = new GOverlay();

ELabel.prototype.initialize = function(map) {
  var div = document.createElement("div");
  div.style.position = "absolute";
  div.innerHTML = '<div class="' + this.classname + '">' + this.html + '</div>' ;
  map.getPane(G_MAP_FLOAT_SHADOW_PANE).appendChild(div);
  this.map_ = map;
  this.div_ = div;
  if (this.percentOpacity) {
    if(typeof(div.style.filter)=='string'){div.style.filter='alpha(opacity:'+this.percentOpacity+')';}
    if(typeof(div.style.KHTMLOpacity)=='string'){div.style.KHTMLOpacity=this.percentOpacity/100;}
    if(typeof(div.style.MozOpacity)=='string'){div.style.MozOpacity=this.percentOpacity/100;}
    if(typeof(div.style.opacity)=='string'){div.style.opacity=this.percentOpacity/100;}
  }
  if (this.overlap) {
    var z = GOverlay.getZIndex(this.point.lat());
    this.div_.style.zIndex = z;
  }
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
  this.div_.style.left = (p.x + this.pixelOffset.width) + "px";
  this.div_.style.top = (p.y +this.pixelOffset.height - h) + "px";
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

ELabel.prototype.setOpacity = function(percentOpacity) {
  if (percentOpacity) {
    if(percentOpacity<0){percentOpacity=0;}
    if(percentOpacity>100){percentOpacity=100;}
  }
  this.percentOpacity = percentOpacity;
  if (this.percentOpacity) {
    if(typeof(this.div_.style.filter)=='string'){this.div_.style.filter='alpha(opacity:'+this.percentOpacity+')';}
    if(typeof(this.div_.style.KHTMLOpacity)=='string'){this.div_.style.KHTMLOpacity=this.percentOpacity/100;}
    if(typeof(this.div_.style.MozOpacity)=='string'){this.div_.style.MozOpacity=this.percentOpacity/100;}
    if(typeof(this.div_.style.opacity)=='string'){this.div_.style.opacity=this.percentOpacity/100;}
  }
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

