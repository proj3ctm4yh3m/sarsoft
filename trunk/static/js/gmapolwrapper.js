google = new Object();
google.maps = new Object();

google.maps.event = new Object();
google.maps.event._handlers = [[], [], []];

google.maps.event.addListener = function(obj, event, handler) {
	var idx = google.maps.event._handlers[0].length;
	google.maps.event._handlers[0][idx] = obj;
	google.maps.event._handlers[1][idx] = event;
	google.maps.event._handlers[2][idx] = handler;
	return idx;
}

google.maps.event.trigger = function(obj, event, param1, param2, param3, param4, param5) {
	for(var i = 0; i < google.maps.event._handlers[0].length; i++) {
		if(google.maps.event._handlers[0][i] == obj && google.maps.event._handlers[1][i] == event)
			google.maps.event._handlers[2][i](param1, param2, param3, param4, param5);
	}
}

google.maps.event.addDomListener = function(obj, event, handler) {
	if(obj.addEventListener) {
		obj.addEventListener(event, handler, false);
	} else if(obj.attachEvent) {
		obj.attachEvent("on" + event, handler);
	}
}

google.maps.event.clearListeners = function(obj, event) {
	for(var i = 0; i < google.maps.event._handlers[0].length; i++) {
		if(google.maps.event._handlers[0][i] == obj && google.maps.event._handlers[1][i] == event) {
			delete google.maps.event._handlers[0][i];
			delete google.maps.event._handlers[1][i];
			delete google.maps.event._handlers[2][i];
		}
	}
}

google.maps.event.removeListener = function(i) {
	delete google.maps.event._handlers[0][i];
	delete google.maps.event._handlers[1][i];
	delete google.maps.event._handlers[2][i];
}

google.maps.ControlPosition = new Object();
google.maps.ControlPosition.BOTTOM_RIGHT=3;
google.maps.ControlPosition.TOP_LEFT=4;
google.maps.ControlPosition.TOP_RIGHT = 5;
/*
G_MAP_FLOAT_SHADOW_PANE = 6;
G_MAP_MAP_PANE=7;
G_MAP_OVERLAY_LAYER_PANE=8;
G_MAP_MARKER_MOUSE_TARGET_PANE=9;
*/

google.maps.ImageMapType = function(opts) {
	var that = this;
	this.opts = opts;
	for(var key in opts) {
		this[key] = opts[key];
	}
	this.opacity = (opts.opacity != null) ? opts.opacity : 1;
	this.ol = new Object();
	this.ol.blayer = new OpenLayers.Layer.XYZ(opts.name, "", {sphericalMercator: true, isBaseLayer: true, numZoomLevels: opts.maxZoom+1});
	this.ol.blayer.getURL = function(bounds) {
		var xyz = this.getXYZ(bounds);
		return opts.getTileUrl({x: xyz.x, y: xyz.y}, xyz.z);		
	}
	this.ol.olayer = new OpenLayers.Layer.XYZ(opts.name, "", {sphericalMercator: true, isBaseLayer: false, numZoomLevels: opts.maxZoom+1});
	this.ol.olayer.getURL = function(bounds) {
		var xyz = this.getXYZ(bounds);
		return opts.getTileUrl({x: xyz.x, y: xyz.y}, xyz.z);		
	}
}

google.maps.ImageMapType.prototype.getOpacity = function() {
	return this.opacity;
}

google.maps.ImageMapType.prototype.setOpacity = function(opacity) {
	this.opacity = opacity;
	this.ol.olayer.setOpacity(opacity);
}

google.maps.Point = function(x, y) {
	this.x = x;
	this.y = y;
}

google.maps.Point.prototype.equals = function(other) { return this.x == other.x && this.y == other.y;}

google.maps.Size = function(width, height) {
	this.width = width;
	this.height = height;
}

google.maps.MapTypeRegistry = function() {
	this.registry = {};
}

google.maps.MapTypeRegistry.prototype.set = function(id, type) {
	this.registry[id] = type;
}

google.maps.MapTypeRegistry.prototype.get = function(id) {
	return this.registry[id];
}

google.maps.MVCArray = function(array) {
	this.array = [];
	if(array != null) this.array = array.slice();
}

google.maps.MVCArray.prototype.clear = function() { this.array = []; }

google.maps.MVCArray.prototype.forEach = function(callback) {
	for(var i = 0; i < this.array.length; i++) {
		callback(this.array[i], i);
	}
}

google.maps.MVCArray.prototype.getArray = function() { return this.array; }

google.maps.MVCArray.prototype.getAt = function(i) { return this.array[i]; }

google.maps.MVCArray.prototype.getLength = function() { return this.array.length; }

google.maps.MVCArray.prototype.insertAt = function(i, element) {
	this.array[i] = element;
	google.maps.event.trigger(this, "insert_at", i);
}

google.maps.MVCArray.prototype.push = function(element) {
	this.insertAt(this.array.length, element);
}

google.maps.MVCArray.prototype.removeAt = function(i) {	
	if(i >= this.array.length) return;
	google.maps.event.trigger(this, "remove_at", i);
	this.array.splice(i, 1);
}

google.maps.MVCArray.prototype.setAt = function(i, element) { this.insertAt(i, element) }

google.maps.Map = function(node, opts) {
	var that = this;
	this.ol = new Object();
	this._overlays = new Array();

	this.ol.navigation = new OpenLayers.Control.Navigation();
	var options = {
            maxExtent: new OpenLayers.Bounds(-20037508.34,-20037508.34,20037508.34,20037508.34),
            maxResolution: 156543.0339,
            numZoomLevels: 19,
            units: 'm',
            projection: new OpenLayers.Projection("EPSG:900913"),
            displayProjection: new OpenLayers.Projection("EPSG:4326"),
            controls: [new OpenLayers.Control.PanZoomBar({displayClass: "noprint"}), this.ol.navigation]
		};
	
	this.ol.map = new OpenLayers.Map(node, options);
	this.ol.map.div.style.position="relative";
	this.mapTypes = new google.maps.MapTypeRegistry();
	this.overlayMapTypes = new google.maps.MVCArray();
	this.currentMapType = null;

	var dummy = new google.maps.ImageMapType({name: "dummy", maxZoom: 20, minZom: 0, getTileUrl: function(p, z) { return "/resource/imagery/tiles/dummy/" + p.z + "/" + p.x + "/" + p.y + ".png"}});	
	this.mapTypes.set("dummy", dummy);
	this.setMapTypeId("dummy");
	
	this.ol.vectorLayer = new OpenLayers.Layer.Vector("overlays", {});
	this.ol.map.addLayer(this.ol.vectorLayer);
	this.ol.markerLayer = new OpenLayers.Layer.Markers("marker", {});
    this.ol.map.addLayer(this.ol.markerLayer);
	this.ol.map.setLayerIndex(this.ol.vectorLayer, 20);
	this.ol.map.setLayerIndex(this.ol.markerLayer, 21);
    
	this.ol.map.setCenter(new OpenLayers.LonLat(0, 0), 1);
	
	this.ol.modifyControl = new OpenLayers.Control.ModifyFeature(this.ol.vectorLayer);
	this.ol.map.addControl(this.ol.modifyControl);
	this.ol.modifyControl.standalone = true;
	this.ol.modifyControl.activate();

	this.ol.drawLineControl = new OpenLayers.Control.DrawFeature(this.ol.vectorLayer, OpenLayers.Handler.Path);
	this.ol.drawLineControl.handler.dblclickTolerance=5
	this.ol.map.addControl(this.ol.drawLineControl);

	this.ol.drawPolygonControl = new OpenLayers.Control.DrawFeature(this.ol.vectorLayer, OpenLayers.Handler.Polygon);
	this.ol.drawPolygonControl.handler.dblclickTolerance=5
	this.ol.map.addControl(this.ol.drawPolygonControl);
	
	this.ol.scaleControl = new OpenLayers.Control.ScaleLine({geodesic: true});
	this.ol.map.addControl(this.ol.scaleControl);
	if(!opts.scaleControl) $(this.ol.scaleControl.div).css('display', 'none');
	
	var getFeatureFromEvent = function(evt) {
		var feature = that.ol.vectorLayer.getFeatureFromEvent(evt);
		if(feature != null) return feature.goverlay;
		return null;
	}
	
	var createMouseEvent = function(source, trigger, e) {
		google.maps.event.trigger(source, trigger, {latLng: google.maps.LatLng.fromLonLat(that.ol.map.getLonLatFromViewPortPx(e.xy))});
	}
	
	var createPolyMouseEvent = function(poly, trigger, e) {
		google.maps.event.trigger(poly, trigger, {latLng: google.maps.LatLng.fromLonLat(that.ol.map.getLonLatFromViewPortPx(e.xy))});
	}
	
	var createEvent = function(trigger, e) {
		var feature = getFeatureFromEvent(e);
		if(feature == null) {
			createMouseEvent(that, trigger, e);
		} else if(feature.ol != null && feature.ol.marker != null) {
			createMouseEvent(feature, trigger, e);
		} else {
			createPolyMouseEvent(feature, trigger, e);
		}
	}
	
	this.ol.clickHandler = new OpenLayers.Handler.Click(this, {
		rightclick: function(e) { 
			createEvent("rightclick", e);
			return false;
		}, 
		click: function(e) { 
			if(e.ctrlKey || (Event.META_MASK || Event.CTRL_MASK)) {
				createEvent("rightclick", e);
			} else {
				createEvent("click", e);
		} return false}}, {});
	this.ol.clickHandler.control = new Object();
	this.ol.clickHandler.control.handleRightClicks = true;
	this.ol.clickHandler.setMap(this.ol.map);
	this.ol.clickHandler.activate();
	
	this.ol.map.events.register("mouseover", this, function(e) {
		createEvent("mouseover", e);
	});

	this.ol.map.events.register("mouseout", this, function(e) {
		createEvent("mouseout", e);
	});

	this.ol.map.events.register("mousemove", this, function(e) {google.maps.event.trigger(that, "mousemove", {latLng: google.maps.LatLng.fromLonLat(that.ol.map.getLonLatFromPixel(that.ol.map.events.getMousePosition(e)))} )});
	this.ol.map.events.register("zoomend", this, function(e) { that.redrawOverlays(); google.maps.event.trigger(that, "zoom_changed"); google.maps.event.trigger(that, "zoomeend")});
	this.ol.map.events.register("moveend", this, function(e) { that.redrawOverlays(); google.maps.event.trigger(that, "moveend"); google.maps.event.trigger(that, "center_changed"); google.maps.event.trigger(that, "idle"); google.maps.event.trigger(that, "dragend"), google.maps.event.trigger(that, "bounds_changed")});
	
	document.oncontextmenu = function(e) {return false;}
	if(node.attachEvent) {
		document.body.oncontextmenu = function(e) { return false; }
	}
	
	window.setInterval(function() {google.maps.event.trigger(that, "tilesloaded", {})}, 1000);
	
	google.maps.event.addListener(this, "resize", function() {
		that.ol.map.updateSize();
	});

	this.controls = [];
	this.controls[google.maps.ControlPosition.TOP_RIGHT] = new google.maps.MVCArray();
	this.controls[google.maps.ControlPosition.TOP_LEFT] = new google.maps.MVCArray();
	this.controls[google.maps.ControlPosition.BOTTOM_RIGHT] = new google.maps.MVCArray();

	google.maps.event.addListener(this.controls[google.maps.ControlPosition.TOP_RIGHT], "insert_at", function(i) {
		var control = that.controls[google.maps.ControlPosition.TOP_RIGHT].getAt(i);
		control.style.position="absolute";
		control.style.right="0px";
		control.style.top="0px";
		control.style.zIndex=1000;
	});

	google.maps.event.addListener(this.controls[google.maps.ControlPosition.TOP_LEFT], "insert_at", function(i) {
		var control = that.controls[google.maps.ControlPosition.TOP_LEFT].getAt(i);
		control.style.position="absolute";
		control.style.left="0px";
		control.style.top="0px";
		control.style.zIndex=1000;
	});

	google.maps.event.addListener(this.controls[google.maps.ControlPosition.BOTTOM_RIGHT], "insert_at", function(i) {
		var control = that.controls[google.maps.ControlPosition.BOTTOM_RIGHT].getAt(i);
		control.style.position="absolute";
		control.style.right="0px";
		control.style.bottom="0px";
		control.style.zIndex=1000;
	});
	
	google.maps.event.addListener(this.overlayMapTypes, "remove_at", function(i) { 
		var type = that.overlayMapTypes.getAt(i);
		if(type != null) that.ol.map.removeLayer(type.ol.olayer);
	});
	google.maps.event.addListener(this.overlayMapTypes, "insert_at", function(i) { 
		var type = that.overlayMapTypes.getAt(i);
		that.ol.map.addLayer(type.ol.olayer);
        that.ol.map.setLayerIndex(that.ol.vectorLayer, 20);
        that.ol.map.setLayerIndex(that.ol.markerLayer, 21);
    });

}

google.maps.Map.ol = new Object();
google.maps.Map.ol.geographic = new OpenLayers.Projection("EPSG:4326");
google.maps.Map.ol.mercator = new OpenLayers.Projection("EPSG:900913");

google.maps.Map.prototype.setOptions = function(opts) {
	if(opts.scaleControl != null) {
		if(opts.scaleControl) {
			$(this.ol.scaleControl.div).css('display', 'block');
		} else {
			$(this.ol.scaleControl.div).css('display', 'none');
		}
	}
	if(opts.scrollwheel != null) {
		if(opts.scrollwheel) {
			this.ol.navigation.enableZoomWheel();
		} else {
			this.ol.navigation.disableZoomWheel();
		}
	}
}

google.maps.Map.prototype.getBounds = function() {
	var bb = this.ol.map.getExtent();
	return new google.maps.LatLngBounds(
			google.maps.LatLng.fromLonLat(new OpenLayers.LonLat(bb.left, bb.bottom)),
			google.maps.LatLng.fromLonLat(new OpenLayers.LonLat(bb.right, bb.top)));
}

google.maps.Map.prototype.setMapTypeId = function(name) {
	if(this.currentMapType != null) {
		this.ol.map.removeLayer(this.currentMapType.ol.blayer);
		this.currentMapType = null;
	}
	// set map type before adding layers so that it's available to event listeners
	this.currentMapType = this.mapTypes.registry[name];
	this.currentMapType.ol.blayer.numZoomLevels = this.currentMapType.opts.maxZoom;
	this.ol.map.addLayer(this.currentMapType.ol.blayer);
	this._mapTypeId = name;
}

google.maps.Map.prototype.getMapTypeId = function() {
	return this._mapTypeId;
}

google.maps.Map.prototype.getDiv = function() {
	return this.ol.map.div;
}

google.maps.Map.prototype.addOverlay = function(overlay) {
	if(typeof overlay._init != "undefined") overlay._init(this.ol);
	this._overlays.push(overlay);
	if(overlay.ol != null) {
		if(overlay.ol.vector != null) {
			this.ol.vectorLayer.addFeatures([overlay.ol.vector]);
		} else if(overlay.ol.marker != null) {
			this.ol.vectorLayer.addFeatures(overlay.ol.marker);
		}
	}
	overlay.draw();
}

google.maps.Map.prototype.redrawOverlays = function() {
	for(var i = 0; i < this._overlays.length; i++) {
		if(this._overlays[i] != null) this._overlays[i].draw();
	}
}

google.maps.Map.prototype.removeOverlay = function(overlay) {
	if(overlay._olcapable) {
		for(var i = 0; i < this._overlays.length; i++) {
			if(this._overlays[i] == overlay) {
				delete this._overlays[i];
			}
		}
		return;
	}
	if(overlay.ol == null) return;
	if(overlay.ol.vector != null) {
		this.ol.modifyControl.unselectFeature(overlay.ol.vector);
		this.ol.vectorLayer.removeFeatures([overlay.ol.vector]);
	} else if(overlay.ol.marker != null) {	
		this.ol.modifyControl.unselectFeature(overlay.ol.marker);
		this.ol.vectorLayer.removeFeatures([overlay.ol.marker]);
	}
}

google.maps.Map.prototype.fitBounds = function(bounds) {
	var olb = new OpenLayers.Bounds();
	olb.extend(google.maps.LatLng.toLonLat(bounds.getSouthWest()));
	olb.extend(google.maps.LatLng.toLonLat(bounds.getNorthEast()));
	var zoom = this.ol.map.getZoomForExtent(olb, false);
	this.setCenter(bounds.getCenter());
	this.setZoom(zoom);
}

google.maps.Map.prototype.setCenter = function(center, zoom, type) {
	this.ol.map.setCenter(google.maps.LatLng.toLonLat(center), zoom);
}

google.maps.Map.prototype.getCenter = function() {
	return google.maps.LatLng.fromLonLat(this.ol.map.getCenter());
}

google.maps.Map.prototype.getZoom = function() {
	return this.ol.map.getZoom();
}

google.maps.Map.prototype.setZoom = function(zoom) {
	this.ol.map.zoomTo(zoom);
}

google.maps.OverlayView = function() {
}

google.maps.OverlayView.prototype.setValues = function(values) {
	for(var key in values) {
		this[key] = values[key];
	}
}

google.maps.OverlayView.prototype.get = function(key) {
	return this[key];
}

google.maps.OverlayView.prototype.set = function(key, value) {
	this[key] = value;
	google.maps.event.trigger(this, key + "_changed");
}

google.maps.OverlayView.prototype.draw = function() {}
google.maps.OverlayView.prototype.onAdd = function() {}
google.maps.OverlayView.prototype.onRemove = function() {}

google.maps.OverlayView.prototype.setMap = function(map) {
	if(map == null) {
		if(this.map != null) {
			this.map.removeOverlay(this);
			this.onRemove();
		}
		this.map = null;
		return;
	}
	this.map = map;
	this.projection = new google.maps.MapCanvasProjection(map);
	this.onAdd();
	map.addOverlay(this);
}

google.maps.OverlayView.prototype.getMap = function() {
	return this.map;
}

google.maps.OverlayView.prototype.getPanes = function() {
	return {mapPane : this.map.ol.map.getLayersByClass("OpenLayers.Layer.XYZ")[0].div, overlayLayer: this.map.ol.markerLayer.div}
}

google.maps.OverlayView.prototype.getProjection = function() { return this.projection }

google.maps.MapCanvasProjection = function(map) {
	this.map = map;
}

google.maps.MapCanvasProjection.prototype.fromLatLngToContainerPixel = function(gll) {
	return this.map.ol.map.getViewPortPxFromLonLat(google.maps.LatLng.toLonLat(gll));
}

google.maps.MapCanvasProjection.prototype.fromContainerPixelToLatLng = function(px) {
	return google.maps.LatLng.fromLonLat(this.map.ol.map.getLonLatFromViewPortPx(px));
}

google.maps.MapCanvasProjection.prototype.fromLatLngToDivPixel = function(gll) {
	return this.map.ol.map.getLayerPxFromLonLat(google.maps.LatLng.toLonLat(gll));
}

google.maps.MapCanvasProjection.prototype.fromDivPixelToLatLng = function(px) {
	var viewportPx = this.map.ol.map.getViewPortPxFromLayerPx(new OpenLayers.Pixel(px.x, px.y));
	return google.maps.LatLng.fromLonLat(this.map.ol.map.getLonLatFromViewPortPx(viewportPx));
}

google.maps.LatLng = function(lat, lng) {
	this._lat = lat;
	this._lng = lng;
}

google.maps.LatLng.prototype.lat = function() {
	return this._lat;
}

google.maps.LatLng.prototype.lng = function() {
	return this._lng;
}

google.maps.LatLng.fromPoint = function(point) {
	point = point.clone().transform(google.maps.Map.ol.mercator, google.maps.Map.ol.geographic);
	return new google.maps.LatLng(point.y, point.x);
}

google.maps.LatLng.fromLonLat = function(mercator) {
	var geographic = mercator.clone().transform(google.maps.Map.ol.mercator, google.maps.Map.ol.geographic);
	return new google.maps.LatLng(geographic.lat, geographic.lon);
}
google.maps.LatLng.toLonLat = function(geographic) {
	return new OpenLayers.LonLat(geographic.lng(), geographic.lat()).transform(google.maps.Map.ol.geographic, google.maps.Map.ol.mercator);
}

google.maps.LatLngBounds = function(sw, ne) {
	this._sw = sw;
	this._ne = ne;
}

google.maps.LatLngBounds.prototype.getSouthWest = function() { return this._sw;}
google.maps.LatLngBounds.prototype.getNorthEast = function() { return this._ne;}

google.maps.LatLngBounds.prototype.intersects = function(other) {
	var utm_sw = GeoUtil.GLatLngToUTM(this._sw);
	var utm_ne = GeoUtil.GLatLngToUTM(this._ne, utm_sw.zone);
	
	var other_sw = GeoUtil.GLatLngToUTM(other.getSouthWest(), utm_sw.zone);
	var other_ne = GeoUtil.GLatLngToUTM(other.getNorthEast(), utm_sw.zone);
	
	if(this.containsLatLng(other.getSouthWest()) || this.containsLatLng(other.getNorthEast())) return true;
	if(other.containsLatLng(this.getSouthWest()) || other.containsLatLng(this.getNorthEast())) return true;

	if(!((other_ne.n <= utm_ne.n && other_ne.n >= utm_sw.s) || (other_sw.s <= utm_ne.n && other_sw.s >= utm_sw.s))) intersects = false;
	if(!((other_ne.e >= utm_ne.e && other_ne.e <= utm_sw.w) || (other_sw.w >= utm_ne.e && other_sw.w <= utm_sw.w))) intersects = false;
	
}

google.maps.LatLngBounds.prototype.containsLatLng = function(latlng) {
	return ((this._sw.lat() < latlng.lat() && latlng.lat() < this._ne.lat()) &&
	   (this._sw.lng() < latlng.lng() && latlng.lng() < this._ne.lng()));
}

google.maps.LatLngBounds.prototype.containsBounds = function(other) {
	return (this.containsLatLng(other.getSouthWest()) && this.containsLatLng(other.getNorthEast()));
}

google.maps.LatLngBounds.prototype.extend = function(gll) {
	if(gll.lat() < this._sw.lat()) this._sw = new google.maps.LatLng(gll.lat(), this._sw.lng());
	if(gll.lng() < this._sw.lng()) this._sw = new google.maps.LatLng(this._sw.lat(), gll.lng());
	if(gll.lat() > this._ne.lat()) this._ne = new google.maps.LatLng(gll.lat(), this._ne.lng());
	if(gll.lng() > this._ne.lng()) this._ne = new google.maps.LatLng(this._ne.lat(), gll.lng());
}

google.maps.LatLngBounds.prototype.getCenter = function() {
	return new google.maps.LatLng((this.getSouthWest().lat() + this.getNorthEast().lat()) / 2, (this.getSouthWest().lng() + this.getNorthEast().lng()) / 2);
}

google.maps.Poly = function() {	
}

google.maps.Poly.prototype = new google.maps.OverlayView();
google.maps.Poly.prototype.getVertexCount = function() {
	if(this._closed) return this.ol.vector.geometry.getVertices().length+1;
	return this.ol.vector.geometry.getVertices().length;
}
google.maps.Poly.prototype.getVertex = function(idx) {
	if(this._closed && idx == this.ol.vector.geometry.getVertices().length)
		idx = 0;
	return google.maps.LatLng.fromPoint(this.ol.vector.geometry.getVertices()[idx]);
}

google.maps.Poly.prototype.setEditable = function(editable) {
	if(editable) {
		this._editable = true;
		this.map.ol.modifyControl.selectFeature(this.ol.vector);
	} else {
		this._editable = false;
		this.map.ol.modifyControl.unselectFeature(this.ol.vector);
	}
}

google.maps.Poly.prototype.getEditable = function() {
	return this._editable;
}

google.maps.Poly.prototype.setOptions = function(opts) {
	if(opts.strokeColor != null) this.ol.style.strokeColor = opts.strokeColor;
	if(opts.strokeWeight != null) this.ol.style.strokeWidth = opts.strokeWeight;
	if(opts.strokeOpacity != null) this.ol.style.strokeOpacity = opts.strokeOpacity;
	if(opts.fillColor != null) this.ol.style.fillColor = opts.fillColor;
	if(opts.fillOpacity != null) this.ol.style.fillOpacity = opts.fillOpacity;
	this.ol.vector.style = this.ol.style;
	if(this.map != null) this.map.ol.vectorLayer.redraw();
}

google.maps.Polygon = function(opts) {
	this._closed=true;
	this.ol = new Object();
	this.ol.style = {strokeColor: opts.strokeColor, strokeWidth: opts.strokeWeight, strokeOpacity: opts.strokeOpacity, fillColor: opts.fillColor, fillOpacity: opts.fillOpacity};
	this.setPaths(opts.paths);
	
	if(opts.map != null) this.setMap(opts.map);
}
google.maps.Polygon.prototype = new google.maps.Poly();

google.maps.Polygon.prototype.setPaths = function(paths) {
	var vertices = new Array();
	var latlngs = paths;
	if(latlngs.array != null) latlngs = latlngs.array; // It's an MVCArray
	if(latlngs[0].lat == null) {
		latlngs = latlngs[0];
		if(latlngs.array != null) latlngs = latlngs.array; // First path is an MVCArray
	}

	for(var i = 0; i < latlngs.length; i++) {
		var ll = google.maps.LatLng.toLonLat(latlngs[i]);
		vertices.push(new OpenLayers.Geometry.Point(ll.lon, ll.lat));
	}
	
	this.ol.geometry = new OpenLayers.Geometry.LinearRing(vertices);
	
	if(this.ol.vector == null) {
		this.ol.vector = new OpenLayers.Feature.Vector(new OpenLayers.Geometry.Polygon([this.ol.geometry]), null, this.ol.style);
		this.ol.vector.goverlay = this;
	}
	this.ol.vector.geometry = new OpenLayers.Geometry.Polygon([this.ol.geometry]);

	if(this.map != null) this.map.ol.vectorLayer.redraw();
}

google.maps.Polygon.prototype.getPaths = function() {
	var path = [];
	for(var i = 0; i < this.ol.vector.geometry.getVertices().length; i++) {
		path[i] = google.maps.LatLng.fromPoint(this.ol.vector.geometry.getVertices()[i]);
	}
	return new google.maps.MVCArray([new google.maps.MVCArray(path)]);
}

google.maps.Polyline = function(opts) {
	this.ol = new Object();
	this.ol.style = {strokeColor: opts.strokeColor, strokeWidth: opts.strokeWeight, strokeOpacity: opts.strokeOpacity};
	this.setPath(opts.path);
	
	if(opts.map != null) this.setMap(opts.map);
}
google.maps.Polyline.prototype = new google.maps.Poly();

google.maps.Polyline.prototype.setPath = function(path) {
	var vertices = new Array();
	var latlngs = path;
	if(latlngs.array != null) latlngs = latlngs.array; // It's an MVCArray

	for(var i = 0; i < latlngs.length; i++) {
		var ll = google.maps.LatLng.toLonLat(latlngs[i]);
		vertices.push(new OpenLayers.Geometry.Point(ll.lon, ll.lat));
	}
	this.ol.geometry = new OpenLayers.Geometry.LineString(vertices);
	
	if(this.ol.vector == null) {
		this.ol.vector = new OpenLayers.Feature.Vector(this.ol.geometry, null, this.ol.style);
		this.ol.vector.goverlay = this;
	}
	
	this.ol.vector.geometry = this.ol.geometry;
	if(this.map != null) this.map.ol.vectorLayer.redraw();
}

google.maps.Polyline.prototype.getPath = function() {
	var path = [];
	for(var i = 0; i < this.ol.vector.geometry.getVertices().length; i++) {
		path[i] = google.maps.LatLng.fromPoint(this.ol.vector.geometry.getVertices()[i]);
	}
	return new google.maps.MVCArray(path);
}

google.maps.MarkerImage = function(url, size, origin, anchor, scaledSize) {
	this.url = url;
	this.size = size;
	this.origin = origin;
	this.anchor = anchor;
	this.scaledSize = scaledSize;
}

google.maps.Marker = function(opts) {
	this.position = opts.position;
	this.icon = opts.icon;
	var size = new OpenLayers.Size(12,12);
	var url = this.icon;
	if(this.icon.url != null) {
		url = this.icon.url;
		if(this.icon.size != null) size = new OpenLayers.Size(this.icon.size.width, this.icon.size.height);
	}
	var offset = new OpenLayers.Pixel(-(size.w/2), -(size.h/2));
	var icon = new OpenLayers.Icon(url, size, offset);

	this.ol = new Object();
	if(opts.title != null) {
		this.title = opts.title;
	}
	
	var ll = google.maps.LatLng.toLonLat(this.position);
	this.ol.marker = new OpenLayers.Feature.Vector(new OpenLayers.Geometry.Point(ll.lon, ll.lat), null, {externalGraphic: url, graphicWidth: size.w, graphicHeight: size.h});
	
	this.ol.marker.goverlay = this;
	
	if(opts.map != null) this.setMap(opts.map);
}

google.maps.Marker.prototype = new google.maps.OverlayView();

google.maps.Marker.prototype.getTitle = function() {
	return this.title;
}

google.maps.Marker.prototype.getPosition = function() {
	return google.maps.LatLng.fromLonLat(new OpenLayers.LonLat(this.ol.marker.geometry.x, this.ol.marker.geometry.y));
}

google.maps.Marker.prototype.setPosition = function(position) {
	var ll = google.maps.LatLng.toLonLat(position);
	this.map.ol.vectorLayer.removeFeatures([this.ol.marker]);
	this.ol.marker.geometry = new OpenLayers.Geometry.Point(ll.lon, ll.lat)
	this.map.ol.vectorLayer.addFeatures([this.ol.marker]);
}

google.maps.Marker.prototype.setDraggable = function(val) {
	var that = this;
	if(val) {
		this.map.ol.modifyControl.selectFeature(this.ol.marker);
		this.map.ol.modifyControl.dragControl.onComplete = function() {
			google.maps.event.trigger(that, "dragend");
		}
	} else {
		this.map.ol.modifyControl.unselectFeature(this.ol.marker);
		this.map.ol.modifyControl.dragControl.onComplete = null;
	}
}

google.maps.geometry = new Object();
google.maps.geometry.spherical = new Object();

google.maps.geometry.spherical.computeDistanceBetween = function(from, to) {
	var R = 6371;
    var pi = 3.14159265358979323;
	var dLat = (to.lat()-from.lat())/180*pi;
	var dLon = (to.lng()-from.lng())/180*pi; 
	var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
	        Math.cos(from.lat()/180*pi) * Math.cos(to.lat()/180*pi) * 
	        Math.sin(dLon/2) * Math.sin(dLon/2); 
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
	return R * c * 1000;
}

google.maps.geometry.spherical.computeLength = function(path) {
	if(path.array != null) path = path.array;
	var distance = 0;
	for(var i = 1; i < path.length; i++) {
		distance = distance + google.maps.geometry.spherical.computeDistanceBetween(path[i-1], path[i]);
	}
	return distance;
}

google.maps.geometry.spherical.computeArea = function(path) {
	if(path.array != null) path = path.array;
	var area = 0;
	for(var i = 1; i < path.length; i++) {
		var x0 = (path[i-1].lng()-path[0].lng())*( 6378137*Math.PI/180 )*Math.cos(path[i-1].lat()*Math.PI/180 );
		var y0 = (path[i-1].lat()-path[0].lat())*( 6378137*Math.PI/180 );

		var x1 = (path[i].lng()-path[0].lng())*( 6378137*Math.PI/180 )*Math.cos(path[i].lat()*Math.PI/180 );
		var y1 = (path[i].lat()-path[0].lat())*( 6378137*Math.PI/180 );

		area += x0*y1 - x1*y0;
	}
	return Math.abs(area)/2;
}

google.maps.drawing = new Object();
google.maps.drawing.OverlayType = new Object();
google.maps.drawing.OverlayType.POLYGON = 0;
google.maps.drawing.OverlayType.POLYLINE = 1;

google.maps.drawing.DrawingManager = function(opts) {
	this.opts = {}
	this.map = opts.map;
}

google.maps.drawing.DrawingManager.prototype.setOptions = function(opts) {
	for(var key in opts) {
		this.opts[key] = opts[key];
	}
	if(typeof opts["drawingMode"] != "undefined") this.setDrawingMode(opts["drawingMode"])
	
	this.map.ol.drawPolygonControl.handler.style = {strokeColor: this.opts.polygonOptions.strokeColor, strokeOpacity: this.opts.polygonOptions.strokeOpacity, strokeWidth: this.opts.polygonOptions.strokeWeight, fillColor: this.opts.polygonOptions.fillColor, fillOpacity: this.opts.polygonOptions.fillOpacity}
	this.map.ol.drawLineControl.handler.style = {strokeColor: this.opts.polylineOptions.strokeColor, strokeOpacity: this.opts.polylineOptions.strokeOpacity, strokeWidth: this.opts.polylineOptions.strokeWeight}
}

google.maps.drawing.DrawingManager.prototype.setDrawingMode = function(type) {
	var that = this;
	if(this.control != null) {
		this.control.deactivate();
		this.map.ol.vectorLayer.events.remove("sketchcomplete");
		this.control = null;
	}
	if(type == null) return;
	
	if(type == google.maps.drawing.OverlayType.POLYGON) {
		this.control = this.map.ol.drawPolygonControl;
	} else {
		this.control = this.map.ol.drawLineControl;
	}
	
	this.control.activate();
	this.map.ol.vectorLayer.events.register("sketchcomplete", this.map.ol.vectorLayer, function(e) {
		that.control.deactivate();
		that.map.ol.vectorLayer.events.remove("sketchcomplete");
		that.map.ol.vectorLayer.removeFeatures([e.feature]);

		var poly = null;
		if(type == google.maps.drawing.OverlayType.POLYGON) {
			poly = new google.maps.Polygon({paths: [[]]});
		} else {
			poly = new google.maps.Polyline({path: []});
		}
		poly.ol.vector = e.feature;
		google.maps.event.trigger(that, type == google.maps.drawing.OverlayType.POLYGON ? "polygoncomplete" : "polylinecomplete", poly);
		return false; // required to prevent OpenLayers from re-adding feature.
	});
	
}

google.maps.ElevationService = function() {
}

google.maps.ElevationService.prototype.resamplePath = function(path, samples) {
	var length = google.maps.geometry.spherical.computeLength(path);
	var interval = length / (samples - 1);
	
	var s_index = 1;
	var leg = 0;
	var rpt = path[0];
	var resampled = []
	resampled.push(path[0])

	while(resampled.length < samples) {
		var d = google.maps.geometry.spherical.computeDistanceBetween(rpt, path[s_index]);
		if(d + leg < interval) {
			leg += d;
			rpt = path[s_index];
			s_index++;
			if(s_index >= path.length) {
				resampled.push(path[path.length-1]);
				return resampled;
			}
		} else {
			var ratio = (interval-leg)/d;
			rpt = new google.maps.LatLng(rpt.lat()*(1-ratio) + path[s_index].lat()*ratio, rpt.lng()*(1-ratio) + path[s_index].lng()*ratio);
			resampled.push(rpt);
			leg = 0;
		}
	}
	
	return resampled;
	
}

google.maps.ElevationService.prototype.getElevationAlongPath = function(obj, handler) {
	var path = this.resamplePath(obj.path, obj.samples);
	var url = "/resource/elevation?locations=";
	for(var i = 0; i < path.length; i++) {
		url = url + (i > 0 ? "|" : "") + path[i].lat() + "," + path[i].lng();
	}
	YAHOO.util.Connect.asyncRequest('GET', url, { success : function(response) {
		var obj = YAHOO.lang.JSON.parse(response.responseText);
		var results = []
		for(var i = 0; i < obj.results.length; i++) {
			results[i] = { elevation: obj.results[i].elevation, location: new google.maps.LatLng(obj.results[i].location.lat, obj.results[i].location.lng)};
		}
		handler(results, obj.status);
	}, failure : function(response) {
		throw("AJAX ERROR getting elevation: " + response.responseText);
	}});
}

google.maps.ElevationStatus = { OK : "OK" }
