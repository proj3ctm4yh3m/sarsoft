function GBrowserIsCompatible() { return true;}
function GUnload() {}

GEvent = new Object();
GEvent._handlers = [[], [], []];

GEvent.addListener = function(obj, event, handler) {
	var idx = GEvent._handlers[0].length;
	GEvent._handlers[0][idx] = obj;
	GEvent._handlers[1][idx] = event;
	GEvent._handlers[2][idx] = handler;
}

GEvent.trigger = function(obj, event, param1, param2, param3, param4, param5) {
	for(var i = 0; i < GEvent._handlers[0].length; i++) {
		if(GEvent._handlers[0][i] == obj && GEvent._handlers[1][i] == event)
			GEvent._handlers[2][i](param1, param2, param3, param4, param5);
	}
}

GEvent.addDomListener = function(obj, event, handler) {
	if(obj.addEventListener) {
		obj.addEventListener(event, handler, false);
	} else if(obj.attachEevent) {
		obj.attachEvent("on" + event, handler);
	}
}

G_SATELLITE_MAP = new Object();
G_SATELLITE_MAP.getProjection = function() {
};
G_ANCHOR_TOP_RIGHT = 5;
G_MAP_FLOAT_SHADOW_PANE = 6;
G_MAP_MAP_PANE=7;
G_MAP_OVERLAY_LAYER_PANE=8;

function GCopyrightCollection() {}
GCopyrightCollection.prototype.addCopyright = function() {};

function GTileLayer(copyright, minResolution, maxResolution, options) {
	this._options = options;
	this._minResolution = minResolution;
	this._maxResolution = maxResolution;
}
GTileLayer.prototype._init = function(name, baseLayer) {
	var that = this;
	this.ol = new Object();
	var xyz = this._options.tileUrlTemplate;
	if(xyz == null) xyz = "";
	xyz = xyz.replace(/{/g, "${");
	xyz = xyz.replace(/{X}/, "{x}");
	xyz = xyz.replace(/{Y}/, "{y}");
	xyz = xyz.replace(/{Z}/, "{z}");
	this.ol.layer = new OpenLayers.Layer.XYZ(name, xyz, {sphericalMercator: true, isBaseLayer: baseLayer == null ? true : baseLayer, numZoomLevels: this._maxResolution});	
	if(this._options.tileUrlTemplate == null) {
		this.ol.layer.getURL = function(bounds) {
			var url = that.wmstemplate;
			bounds.transform(GMap2.ol.mercator, GMap2.ol.geographic);
			url = url.replace(/\{left\}/g, bounds.left);
		    url = url.replace(/\{bottom\}/g, bounds.bottom);
		    url = url.replace(/\{right\}/g, bounds.right);
		    url = url.replace(/\{top\}/g, bounds.top);
		    url = url.replace(/\{tilesize\}/g, 256);
		    return url;
		}
	}
}
GTileLayer.prototype.minResolution = function() {return this._minResolution;};
GTileLayer.prototype.maxResolution = function() {return this._maxResolution;};
GTileLayer.prototype.getTileUrl = function() {};
GTileLayer.prototype.isPng = function() {return this._options.png};
GTileLayer.prototype.getOpacity = function() {return 1};
GTileLayer.prototype.getCopyright = function() {};

GTileLayerOverlay = function(layer, opts) {
	this.ol = new Object();
	this.ol.layer = layer;
	// hack to get GAlphaTileOverlay working
	if(layer.tileLayer != null) layer._options = layer.tileLayer._options;
	layer._init("overlay", false);
}
GTileLayerOverlay.prototype.getLayer = function() { return this.ol.layer; }

function GMapType(layers, projection, name, opts) {
	this.ol = new Object();
	this.ol.layers = layers;
	this.ol.name = name;
	layers[0]._init(name);
	for(var i = 1; i < layers.length; i++) {
		layers[i]._init(name + "_" + i);
	}
}

GMapType.prototype.getName = function() {
	return this.ol.name;
}

GMapType.prototype.getTileLayers = function() {
	return this.ol.layers;
}

GMapType.prototype.getMaximumResolution = function() {
	return this.ol.layers[0].maxResolution();
}
GMapType.prototype.getMinimumResolution = function() {
	return this.ol.layers[0].minResolution();
}

function GControl() {
}
GControl.prototype.initialize = function(map) {}
GControl.prototype.getDefaultPosition = function() { return null;}
	
function GControlPosition(anchor, offset) {
	this.anchor = anchor;
	this.offset = offset;
}

function GLargeMapControl3D() {}
GLargeMapControl3D.prototype = new GControl();
function GScaleControl() {}
GScaleControl.prototype = new GControl();


function GSize(width, height) {
	this.width = width;
	this.height = height;
}

function GLatLngBounds(sw, ne) {
	this._sw = sw;
	this._ne = ne;
}

GLatLngBounds.prototype.getSouthWest = function() { return this._sw;}
GLatLngBounds.prototype.getNorthEast = function() { return this._ne;}

function GMap2(node) {
	var that = this;
	this.ol = new Object();
	this._overlays = new Array();
	
	var options = {
            maxExtent: new OpenLayers.Bounds(-20037508.34,-20037508.34,20037508.34,20037508.34),
            maxResolution: 156543.0339,
            numZoomLevels: 19,
            units: 'm',
            projection: new OpenLayers.Projection("EPSG:900913"),
            displayProjection: new OpenLayers.Projection("EPSG:4326"),
            controls: [new OpenLayers.Control.PanZoomBar({displayClass: "noprint"}), new OpenLayers.Control.Navigation()]
		};
	
	this.ol.map = new OpenLayers.Map(node, options);
	this.ol.map.div.style.position="relative";
	this.ol.maptypes = new Array();
	this.ol.currentMapType = null;
	

	var dummy = new GMapType(
			[new GTileLayer(null, 0, 20, { isPng: true, tileUrlTemplate: '/resource/imagery/tiles/dummy/{Z}/{X}/{Y}.png'})],
			G_SATELLITE_MAP.getProjection(), "Physical", {tileSize: 256 } );	
	
	this.setMapType(dummy);
	
	this.ol.vectorLayer = new OpenLayers.Layer.Vector("overlays", {});
	this.ol.map.addLayer(this.ol.vectorLayer);
	this.ol.markerLayer = new OpenLayers.Layer.Markers("marker", {});
	this.ol.map.addLayer(this.ol.markerLayer);
	
	this.ol.map.setCenter(new OpenLayers.LonLat(0, 0), 1);
	
	this.ol.modifyControl = new OpenLayers.Control.ModifyFeature(this.ol.vectorLayer);
	this.ol.map.addControl(this.ol.modifyControl);
	this.ol.modifyControl.standalone = true;
	this.ol.modifyControl.activate();

	this.ol.getFeatureFromEvent = function(evt) {
		var feature = that.ol.vectorLayer.getFeatureFromEvent(evt);
		if(feature != null) return feature.goverlay;
		for(var i = 0; i < that.ol.markerLayer.markers.length; i++) {
			var marker = that.ol.markerLayer.markers[i];
			var px = that.ol.map.getPixelFromLonLat(marker.lonlat);
			if(Math.abs(px.x - evt.xy.x) < 5 && Math.abs(px.y - evt.xy.y) < 5) return marker.gmarker;
		}
		return null;
	}
	this.ol.clickHandler = new OpenLayers.Handler.Click(this, {
		rightclick: function(e) { 
			GEvent.trigger(that, "singlerightclick", e.xy, OpenLayers.Event.element(e), that.ol.getFeatureFromEvent(e));  return false;
		}, 
		click: function(e) { 
			if(e.ctrlKey || (Event.META_MASK || Event.CTRL_MASK)) {
				GEvent.trigger(that, "singlerightclick", e.xy, OpenLayers.Event.element(e), that.ol.getFeatureFromEvent(e));  return false;
			} else {
				GEvent.trigger(that, "click", e.xy, OpenLayers.Event.element(e), that.ol.getFeatureFromEvent(e)); return false;}
		}
		}, {});
	this.ol.clickHandler.control = new Object();
	this.ol.clickHandler.control.handleRightClicks = true;
	this.ol.clickHandler.setMap(this.ol.map);
	this.ol.clickHandler.activate();
	
	this.ol.map.events.register("mouseover", this, function(e) {
		overlay = that.ol.getFeatureFromEvent(e);
		if(overlay != null) GEvent.trigger(overlay, "mouseover", e.xy, OpenLayers.Event.element(e), overlay);  return false;
	});
	
	this.ol.map.events.register("mousemove", this, function(e) {GEvent.trigger(this, "mousemove", GLatLng.fromLonLat(that.ol.map.getLonLatFromPixel(that.ol.map.events.getMousePosition(e))))});
	this.ol.map.events.register("zoomend", this, function(e) { that.redrawOverlays();});
	this.ol.map.events.register("moveend", this, function(e) { GEvent.trigger(this, "moveend");});
	
	document.oncontextmenu = function(e) {return false;}
	if(node.attachEvent) {
		document.body.oncontextmenu = function(e) { return false; }
	}
	
	window.setInterval(function() {GEvent.trigger(that, "tilesloaded", {})}, 1000);

}

GMap2.ol = new Object();
GMap2.ol.geographic = new OpenLayers.Projection("EPSG:4326");
GMap2.ol.mercator = new OpenLayers.Projection("EPSG:900913");

GMap2.prototype.checkResize = function() {
	this.ol.map.updateSize();
}

GMap2.prototype.getBounds = function() {
	var bb = this.ol.map.getExtent();
	return new GLatLngBounds(
			GLatLng.fromLonLat(new OpenLayers.LonLat(bb.left, bb.bottom)),
			GLatLng.fromLonLat(new OpenLayers.LonLat(bb.right, bb.top)));
}

GMap2.prototype.getSize = function() {
	var size = this.ol.map.getSize();
	return new GSize(size.w, size.h);
}

GMap2.prototype.fromLatLngToContainerPixel = function(gll) {
	return this.ol.map.getViewPortPxFromLonLat(GLatLng.toLonLat(gll));
}

GMap2.prototype.fromContainerPixelToLatLng = function(px) {
	return GLatLng.fromLonLat(this.ol.map.getLonLatFromViewPortPx(px));
}

GMap2.prototype.fromLatLngToDivPixel = function(gll) {
	return this.ol.map.getLayerPxFromLonLat(GLatLng.toLonLat(gll));
}

GMap2.prototype.fromDivPixelToLatLng = function(px) {
	var viewportPx = this.ol.map.getViewPortPxFromLayerPx(new OpenLayers.Pixel(px.x, px.y));
	return GLatLng.fromLonLat(this.ol.map.getLonLatFromViewPortPx(viewportPx));
}

GMap2.prototype.getPane = function(pane) {
	if(pane == G_MAP_FLOAT_SHADOW_PANE) return this.ol.markerLayer.div;
	if(pane == G_MAP_MAP_PANE) return this.ol.map.baseLayer	.div;
}

GMap2.prototype.addMapType = function(type) {
	if(this.ol.maptypes.length == 0) {
		this.setMapType(type);
	}
	this.ol.maptypes.push(type);
}

GMap2.prototype.getMapTypes = function() {
	return this.ol.maptypes;
}

GMap2.prototype.setMapType = function(type) {
	if(this.ol.currentMapType != null) {
		for(var i = 0; i < this.ol.currentMapType.getTileLayers().length; i++) {
			this.ol.map.removeLayer(this.ol.currentMapType.getTileLayers()[i].ol.layer);
		}	
		this.ol.currentMapType = null;
	}
	for(var i = 0; i < type.getTileLayers().length; i++) {
		type.getTileLayers()[i].ol.layer.numZoomLevels = type.getTileLayers()[i].maxResolution();
		this.ol.map.addLayer(type.getTileLayers()[i].ol.layer);
	}
	this.ol.currentMapType = type;
}

GMap2.prototype.getCurrentMapType = function() {
	return this.ol.currentMapType;
}

GMap2.prototype.getContainer = function() {
	return this.ol.map.div;
}

GMap2.prototype.addControl = function(control) {
	var ref = control.initialize(this);
    if(ref != null) ref.className += " noprint";
	var position = control.getDefaultPosition();
	if(position != null) {
		if(position.anchor == G_ANCHOR_TOP_RIGHT) {
			ref.style.position="absolute";
			ref.style.right=position.offset.width;
			ref.style.top=position.offset.height;
			ref.style.zIndex=1000;
		}
	} 
}

GMap2.prototype.addOverlay = function(overlay) {
	if(overlay._olcapable) {
		this._overlays.push(overlay);
		overlay.initialize(this);
		overlay.redraw(true);
	}
	if(overlay.ol == null) return;
	overlay.ol.map = this;
	if(overlay.ol.vector != null) {
		this.ol.vectorLayer.addFeatures([overlay.ol.vector]);
	} else if(overlay.ol.marker != null) {
		this.ol.markerLayer.addMarker(overlay.ol.marker);
	} else if(overlay.ol.layer != null) {
		this.ol.currentMapType.ol.layers[0].ol.layer.numZoomLevels = Math.min(this.ol.currentMapType.ol.layers[0].maxResolution(), overlay.ol.layer.maxResolution());
		overlay.ol.layer.ol.layer.setOpacity(overlay.ol.layer.getOpacity());
		this.ol.map.addLayer(overlay.ol.layer.ol.layer);
		this.ol.map.raiseLayer(overlay.ol.layer.ol.layer, -100);
	}
}

GMap2.prototype.redrawOverlays = function() {
	for(var i = 0; i < this._overlays.length; i++) {
		if(this._overlays[i] != null) this._overlays[i].redraw();
	}
}

GMap2.prototype.removeOverlay = function(overlay) {
	if(overlay._olcapable) {
		overlay.remove();
		for(var i = 0; i < this._overlays.length; i++) {
			if(this._overlays[i] == overlay) delete this._overlays[i];
		}
		return;
	}
	if(overlay.ol == null) return;
	if(overlay.ol.vector != null) {
		this.ol.modifyControl.unselectFeature(overlay.ol.vector);
		this.ol.vectorLayer.removeFeatures([overlay.ol.vector]);
	} else if(overlay.ol.marker != null) {	
		this.ol.markerLayer.removeMarker(overlay.ol.marker);
	} else if(overlay.ol.layer != null) {
		this.ol.map.removeLayer(overlay.ol.layer.ol.layer);
	}
}

GMap2.prototype.getBoundsZoomLevel = function(bounds) {
	var olb = new OpenLayers.Bounds();
	olb.extend(GLatLng.toLonLat(bounds.getSouthWest()));
	olb.extend(GLatLng.toLonLat(bounds.getNorthEast()));
	return this.ol.map.getZoomForExtent(olb, false);
}

GMap2.prototype.setCenter = function(center, zoom, type) {
	this.ol.map.setCenter(GLatLng.toLonLat(center), zoom);
}

GMap2.prototype.getCenter = function() {
	return GLatLng.fromLonLat(this.ol.map.getCenter());
}

GMap2.prototype.getZoom = function() {
	return this.ol.map.getZoom();
}

GMap2.prototype.setZoom = function(zoom) {
	this.ol.map.zoomTo(zoom);
}

function GPoint(x, y) {
	this.x = x;
	this.y = y;
}

GPoint.prototype.equals = function(other) { return this.x == other.x && this.y == other.y;}

function GLatLng(lat, lng) {
	this._lat = lat;
	this._lng = lng;
}

GLatLng.prototype.lat = function() {
	return this._lat;
}

GLatLng.prototype.lng = function() {
	return this._lng;
}

GLatLng.prototype.distanceFrom = function(gll) {
	var R = 6371;
    var pi = 3.14159265358979323;
	var dLat = (gll.lat()-this._lat)/180*pi;
	var dLon = (gll.lng()-this._lng)/180*pi; 
	var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
	        Math.cos(this._lat/180*pi) * Math.cos(gll.lat()/180*pi) * 
	        Math.sin(dLon/2) * Math.sin(dLon/2); 
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
	return R * c * 1000;
}

GLatLng.fromPoint = function(point) {
	point = point.clone().transform(GMap2.ol.mercator, GMap2.ol.geographic);
	return new GLatLng(point.y, point.x);
}

GLatLng.fromLonLat = function(ll) {
	ll = ll.clone().transform(GMap2.ol.mercator, GMap2.ol.geographic);
	return new GLatLng(ll.lat, ll.lon);
}
GLatLng.toLonLat = function(gll) {
	return new OpenLayers.LonLat(gll.lng(), gll.lat()).transform(GMap2.ol.geographic, GMap2.ol.mercator);
}

function GLatLngBounds(sw, ne) {
	this.sw = sw;
	this.ne = ne;
}

GLatLngBounds.prototype.getSouthWest = function() {
	return this.sw;
}

GLatLngBounds.prototype.getNorthEast = function() {
	return this.ne;
}

G_DEFAULT_ICON = 1;
function GIcon() {	
}

function GOverlay() {
}

GOverlay.prototype.getZIndex = function(lat) {
	return 1000;
}

function GPoly() {	
}

GPoly.prototype = new GOverlay();
GPoly.prototype.getVertexCount = function() {
	if(this._closed) return this.ol.vector.geometry.getVertices().length+1;
	return this.ol.vector.geometry.getVertices().length;
}
GPoly.prototype.getVertex = function(idx) {
	if(this._closed && idx == this.ol.vector.geometry.getVertices().length)
		idx = 0;
	return GLatLng.fromPoint(this.ol.vector.geometry.getVertices()[idx]);
}
GPoly.prototype.enableEditing = function(opts) {
	this.ol.map.ol.modifyControl.selectFeature(this.ol.vector);
}

GPoly.prototype.disableEditing = function() {
	this.ol.map.ol.modifyControl.unselectFeature(this.ol.vector);
}

function GPolygon(latlngs, strokeColor, strokeWeight, strokeOpacity, fillColor, fillOpacity, opts) {
	this._closed=true;
	var vertices = new Array();
	for(var i = 0; i < latlngs.length - 1; i++) {
		var ll = GLatLng.toLonLat(latlngs[i]);
		vertices.push(new OpenLayers.Geometry.Point(ll.lon, ll.lat));
	}
	this.ol = new Object();
	var linearRing = new OpenLayers.Geometry.LinearRing(vertices);
	this.ol.vector = new OpenLayers.Feature.Vector(new OpenLayers.Geometry.Polygon([linearRing]), null, {strokeColor: strokeColor, strokeWidth: strokeWeight, strokeOpacity: strokeOpacity, fillColor: fillColor, fillOpacity: fillOpacity});
	this.ol.vector.goverlay = this;
}
GPolygon.prototype = new GPoly();

function GPolyline(latlngs, strokeColor, strokeWeight, strokeOpacity) {
	var vertices = new Array();
	for(var i = 0; i < latlngs.length; i++) {
		var ll = GLatLng.toLonLat(latlngs[i]);
		vertices.push(new OpenLayers.Geometry.Point(ll.lon, ll.lat));
	}
	this.ol = new Object();
	this.ol.vector = new OpenLayers.Feature.Vector(new OpenLayers.Geometry.LineString(vertices), null, {strokeColor: strokeColor, strokeWidth: strokeWeight, strokeOpacity: strokeOpacity});
	this.ol.vector.goverlay = this;
}
GPolyline.prototype = new GPoly();

function GMarker(latlng, opts) {
	var size = new OpenLayers.Size(12,12);
	var offset = new OpenLayers.Pixel(-(size.w/2), -size.h);
	var icon = new OpenLayers.Icon('/resources/images/circle/000000.png', size, offset);
	if(opts != null) {
		this._title = opts.title;
		// handle cusotm google icons
		if(opts.icon != null) {
			size = new OpenLayers.Size(opts.icon.iconSize.width,opts.icon.iconSize.height);
			offset = new OpenLayers.Pixel(-(size.w/2), -size.h);
			icon = new OpenLayers.Icon(opts.icon.image, size, offset);
		}
	}
	this._latlng = latlng;
	this.ol = new Object();
	this.ol.marker = new OpenLayers.Marker(GLatLng.toLonLat(latlng),icon);
	this.ol.marker.gmarker = this;
}

GMarker.prototype = new GOverlay();

GMarker.prototype.getTitle = function() {
	return this._title;
}

GMarker.prototype.getLatLng = function() {
	return this._latlng;
}