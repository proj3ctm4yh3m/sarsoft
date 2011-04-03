function GBrowserIsCompatible() { return true;}

GEvent = new Object();
GEvent._handlers = new Object();

GEvent.addListener = function(obj, event, handler) {
	if(GEvent._handlers[obj] == null) GEvent._handlers[obj] = new Object();
	if(GEvent._handlers[obj][event] == null) GEvent._handlers[obj][event] = new Array();
	GEvent._handlers[obj][event].push(handler);
}

GEvent.trigger = function(obj, event, param1, param2, param3, param4, param5) {
	if(GEvent._handlers[obj] != null) {
		if(GEvent._handlers[obj][event] != null) {
			for(var i = 0; i < GEvent._handlers[obj][event].length; i++) {
				GEvent._handlers[obj][event][i](param1, param2, param3, param4, param5);
			}
		}
	}
}

GEvent.addDomListener = function(obj, event, handler) {
	obj.addEventListener(event, handler, false);
}

G_SATELLITE_MAP = new Object();
G_SATELLITE_MAP.getProjection = function() {};
G_ANCHOR_TOP_RIGHT = 5;

function GCopyrightCollection() {}
GCopyrightCollection.prototype.addCopyright = function() {};

function GTileLayer(copyright, minResolution, maxResolution, options) {
	this._options = options;
	this._minResolution = minResolution;
	this._maxResolution = maxResolution;
}
GTileLayer.prototype._init = function(name, baseLayer) {
	this.ol = new Object();
	if(this._options.tileUrlTemplate != null) {
		var xyz = this._options.tileUrlTemplate;
		xyz = xyz.replace(/{/g, "${");
		xyz = xyz.replace(/{X}/, "{x}");
		xyz = xyz.replace(/{Y}/, "{y}");
		xyz = xyz.replace(/{Z}/, "{z}");
		this.ol.layer = new OpenLayers.Layer.XYZ(name, xyz, {sphericalMercator: true, isBaseLayer: baseLayer == null ? true : baseLayer});	
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

function GMap2(node) {
	var that = this;
	this.ol = new Object();
	var options = {
            maxExtent: new OpenLayers.Bounds(-20037508.34,-20037508.34,20037508.34,20037508.34),
            maxResolution: 156543.0339,
            numZoomLevels: 19,
            units: 'm',
            projection: new OpenLayers.Projection("EPSG:900913"),
            displayProjection: new OpenLayers.Projection("EPSG:4326")
		};
	
	G_PHYSICAL_MAP = new GMapType(
			[new GTileLayer(null, 0, 20, { isPng: true, tileUrlTemplate: 'http://tile.openstreetmap.org/{Z}/{X}/{Y}.png'})],
			G_SATELLITE_MAP.getProjection(), "Phsyical", {tileSize: 256 } );	

	this.ol.map = new OpenLayers.Map(node, options);
	this.ol.maptypes = new Array();
	this.ol.currentMapType = null;
	
	this.setMapType(G_PHYSICAL_MAP);

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
			GEvent.trigger(this, "singlerightclick", e.xy, OpenLayers.Event.element(e), that.ol.getFeatureFromEvent(e));  return false;
		}, 
		click: function(e) { 
			GEvent.trigger(this, "click", e.xy, OpenLayers.Event.element(e), that.ol.getFeatureFromEvent(e)); return false;}
		}, {});
	this.ol.clickHandler.control = new Object();
	this.ol.clickHandler.control.handleRightClicks = true;
	this.ol.clickHandler.setMap(this.ol.map);
	this.ol.clickHandler.activate();

	this.ol.map.events.register("mousemove", this, function(e) {GEvent.trigger(this, "mousemove", GLatLng.fromLonLat(that.ol.map.getLonLatFromPixel(that.ol.map.events.getMousePosition(e))))});
	
	node.oncontextmenu = function(e) {return false;}

}

GMap2.ol = new Object();
GMap2.ol.geographic = new OpenLayers.Projection("EPSG:4326");
GMap2.ol.mercator = new OpenLayers.Projection("EPSG:900913");

GMap2.prototype.fromContainerPixelToLatLng = function(px) {
	return GLatLng.fromLonLat(this.ol.map.getLonLatFromPixel(px));
}

GMap2.prototype.addMapType = function(type) {
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
	overlay.ol.map = this;
	if(overlay.ol.vector != null)
		this.ol.vectorLayer.addFeatures([overlay.ol.vector]);
	if(overlay.ol.marker != null)
		this.ol.markerLayer.addMarker(overlay.ol.marker);
	if(overlay.ol.layer != null) {
		overlay.ol.layer.ol.layer.setOpacity(overlay.ol.layer.getOpacity());
		this.ol.map.addLayer(overlay.ol.layer.ol.layer);
		this.ol.map.raiseLayer(overlay.ol.layer.ol.layer, -100);
	}
}

GMap2.prototype.removeOverlay = function(overlay) {
	if(overlay.ol.vector != null)
		this.ol.vectorLayer.removeFeatures([overlay.ol.vector]);
	if(overlay.ol.marker != null) {
		this.ol.markerLayer.removeMarker(overlay.ol.marker);
	}
	if(overlay.ol.layer != null) {
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
	return R * c;
}

GLatLng.fromLonLat = function(ll) {
	ll = ll.transform(GMap2.ol.mercator, GMap2.ol.geographic);
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

function GPolygon(latlngs, strokeColor, strokeWeight, strokeOpacity, fillColor, fillOpacity, opts) {
	var vertices = new Array();
	for(var i = 0; i < latlngs.length; i++) {
		var ll = GLatLng.toLonLat(latlngs[i]);
		vertices.push(new OpenLayers.Geometry.Point(ll.lon, ll.lat));
	}
	this.ol = new Object();
	var linearRing = new OpenLayers.Geometry.LinearRing(vertices);
	this.ol.vector = new OpenLayers.Feature.Vector(new OpenLayers.Geometry.Polygon([linearRing]), null, {strokeColor: strokeColor, strokeWidth: strokeWeight, strokeOpacity: strokeOpacity, fillColor: fillColor, fillOpacity: fillOpacity});
	this.ol.vector.goverlay = this;
}

GPolygon.prototype.enableEditing = function(opts) {
	this.ol.map.ol.modifyControl.selectFeature(this.ol.vector);
}

GPolygon.prototype.disableEditing = function() {
	this.ol.map.ol.modifyControl.unselectFeature(this.ol.vector);	
}

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

GPolyline.prototype.enableEditing = function(opts) {
	this.ol.map.ol.modifyControl.selectFeature(this.ol.vector);
}

GPolyline.prototype.disableEditing = function() {
	this.ol.map.ol.modifyControl.unselectFeature(this.ol.vector);	
}

function GOverlay() {
}

function GMarker(latlng, opts) {
	var size = new OpenLayers.Size(21,25);
	var offset = new OpenLayers.Pixel(-(size.w/2), -size.h);
	var icon = new OpenLayers.Icon('http://www.openlayers.org/dev/img/marker.png', size, offset);
	if(opts != null) this._title = opts.title;
	this._latlng = latlng;
	this.ol = new Object();
	this.ol.marker = new OpenLayers.Marker(GLatLng.toLonLat(latlng),icon);
	this.ol.marker.gmarker = this;
}

GMarker.prototype.getTitle = function() {
	return this._title;
}

GMarker.prototype.getLatLng = function() {
	return this._latlng;
}