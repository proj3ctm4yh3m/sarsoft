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
	var mapTypes = map.getMapTypes();
	this.types = new Array();
	// georef images get added to this list; need to shallow cop
	for(var i = 0; i < mapTypes.length; i++) {
		this.types[i] = mapTypes[i];
	}
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

	this.extras = document.createElement("span");

	var div = document.createElement("div");
	div.style.color="red";
	div.style.background="white";
	div.style.fontWeight="bold";
	div.appendChild(this.extras);
	div.appendChild(document.createTextNode("base: "));
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
	this._go = go;
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
		var width = that.widthInput.value;
		var height = that.heightInput.value;
		that.map.getContainer().style.width=width;
		that.map.getContainer().style.height=height;
		that.map.checkResize();
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


org.sarsoft.FixedGMap = function(map, showtools) {
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
		var datum = document.createElement("div");
		datum.style.zIndex=2000;
		datum.style.position="absolute";
		datum.style.bottom="0px";
		datum.style.left="0px";
		datum.style.backgroundColor="white";
		datum.innerHTML = org.sarsoft.map.datum;
		map.getContainer().appendChild(datum);
		this.mapMessageControl = new org.sarsoft.MapMessageControl();
		this.map.addControl(this.mapMessageControl);
		
		this._showUTM = true;
		if(showtools && this.map._overlaydropdownmapcontrol != null) {
			var extras = this.map._overlaydropdownmapcontrol.extras;
			this._UTMToggle = document.createElement("a");
			this._UTMToggle.menuOrder=10;
			this._UTMToggle.title = "Enable/disable UTM gridlines";
			this._UTMToggle.style.cursor="pointer";
			this._UTMToggle.innerHTML = "UTM";
			GEvent.addDomListener(this._UTMToggle, "click", function() {
				if(that._showUTM) {
					that._UTMToggle.innerHTML = "<span style='text-decoration: line-through'>UTM</span>";
					that._showUTM = false;
				} else {
					that._UTMToggle.innerHTML = "UTM";
					that._showUTM = true;
				}
				that._drawUTMGrid(true);
			});
			extras.appendChild(this._UTMToggle);
			extras.appendChild(document.createTextNode(" "));
			var n = document.createTextNode(" | ");
			n.menuOrder = 20;
			extras.appendChild(n);

			this.pageSizeDlg = new org.sarsoft.view.MapSizeDlg(this.map);
			var pagesetup = document.createElement("img");
			pagesetup.menuOrder=30;
			pagesetup.src="/static/images/print.png";
			pagesetup.style.cursor="pointer";
			pagesetup.style.verticalAlign="middle";
			pagesetup.title = "Adjust page size for printing";
			GEvent.addDomListener(pagesetup, "click", function() {
				that.pageSizeDlg.show();
			});
			extras.appendChild(document.createTextNode(" "));
			extras.appendChild(pagesetup);
			var n = document.createTextNode(" | ");
			n.menuOrder = 100;
			extras.appendChild(n);
		}
		
	}
}

org.sarsoft.FixedGMap.prototype.getConfig = function(config) {
	if(config == null) config = new Object();
	config.base = this.map.getCurrentMapType().getName();
	config.overlay = this.map._sarsoft_overlay_name;
	config.opacity = this.map._sarsoft_overlay_opacity;
	config.utm = this._showUTM;
	return config;
}

org.sarsoft.FixedGMap.prototype.setConfig = function(config) {
	this.setMapLayers(config.base, config.overlay, config.opacity);
	if(config.utm != null) {
		this._showUTM = config.utm;
		if(this._showUTM) {
			this._UTMToggle.innerHTML = "UTM";
		} else {
			this._UTMToggle.innerHTML = "<span style='text-decoration: line-through'>UTM</span>";
		}
		this._drawUTMGrid(true);
	}
}

org.sarsoft.FixedGMap.prototype.setMapLayers = function(baseName, overlayName, opacity) {
	var types = this.map._overlaydropdownmapcontrol.types;
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

org.sarsoft.FixedGMap.prototype._drawUTMGrid = function(force) {
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
	
	if(!this._showUTM) return;
	
	var bounds = this.map.getBounds();
	var span = bounds.getSouthWest().distanceFrom(bounds.getNorthEast());
	var px1 = this.map.fromLatLngToContainerPixel(bounds.getSouthWest());
	var px2 = this.map.fromLatLngToContainerPixel(bounds.getNorthEast());
	var pxspan = Math.sqrt(Math.pow(px1.x-px2.x, 2) + Math.pow(px1.y-px2.y, 2));
	scale = span/pxspan;
	var spacing = 100;
	if(scale > 2) spacing = 1000;
	if(scale > 20) spacing = 10000;
	if(scale > 200) spacing = 100000;
	
	var sw = GeoUtil.GLatLngToUTM(GeoUtil.fromWGS84(bounds.getSouthWest()));
	var ne = GeoUtil.GLatLngToUTM(GeoUtil.fromWGS84(bounds.getNorthEast()));
	if(ne.zone - sw.zone > 1) return;
	this._drawUTMGridForZone(sw.zone, spacing, false);
	if(sw.zone != ne.zone)  this._drawUTMGridForZone(ne.zone, spacing, true);
}

org.sarsoft.FixedGMap.prototype._drawUTMGridForZone = function(zone, spacing, right) {
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
		var vertices = new Array();
		vertices.push(GeoUtil.toWGS84(GeoUtil.UTMToGLatLng({e: easting, n: sw.n, zone: zone})));
		vertices.push(GeoUtil.toWGS84(GeoUtil.UTMToGLatLng({e: easting, n: ne.n, zone: zone})));

		if(west < vertices[0].lng() && vertices[0].lng() < east) {
			var overlay = new GPolyline(vertices, "#0000FF", 1, (easting % 1000 == 0) ? 1 : 0.4);
			this.utmgridlines.push(overlay);
			this.map.addOverlay(overlay);

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
		var vertices = new Array();
		var start = GeoUtil.toWGS84(GeoUtil.UTMToGLatLng({e: sw.e, n: northing, zone: zone}));
		if(start.lng() < west) {
			start = GeoUtil.toWGS84(GeoUtil.UTMToGLatLng({e: GeoUtil.GLatLngToUTM(new GLatLng(start.lat(), west), zone).e, n: northing, zone: zone}));
		}
		vertices.push(start);
		var end = GeoUtil.toWGS84(GeoUtil.UTMToGLatLng({e: ne.e, n: northing, zone: zone}));
		if(end.lng() > east) {
			end = GeoUtil.toWGS84(GeoUtil.UTMToGLatLng({e: GeoUtil.GLatLngToUTM(new GLatLng(end.lat(), east), zone).e, n: northing, zone: zone}));
		}
		vertices.push(end);

		var overlay = new GPolyline(vertices, "#0000FF", 1, (northing % 1000 == 0) ? 1 : 0.4);
		this.utmgridlines.push(overlay);
		this.map.addOverlay(overlay);

		var offset = this.map.fromLatLngToContainerPixel(GeoUtil.toWGS84(GeoUtil.UTMToGLatLng({e: screenSW.e, n: northing, zone: zone}))).y;
		if(0 < offset && offset < pymax && northing % 1000 == 0) {
			var point = new GPoint(0, offset);
			if(right) {
				point = new GPoint(this.map.getSize().width-50, this.map.fromLatLngToContainerPixel(GeoUtil.toWGS84(GeoUtil.UTMToGLatLng({e: screenNE.e, n: northing, zone: zone}))).y);
			}
			var label = new ELabel(this.map.fromContainerPixelToLatLng(point), createText(northing), null, null, new GSize(0,-0.5));
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
			labelOverlay = new ELabel(new GLatLng(labelwpt.lat, labelwpt.lng), label, "width: 6em");
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
	var centerUTM = GeoUtil.GLatLngToUTM(new GLatLng(center.lat, center.lng));
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
	var icon = (config.icon) ? config.icon : org.sarsoft.MapUtil.createFlatCircleIcon(12, config.color);
	if(typeof tooltip == "undefined") tooltip = waypoint.name;
	tooltip = tooltip +  "  (" + GeoUtil.GLatLngToUTM(GeoUtil.fromWGS84(new GLatLng(waypoint.lat, waypoint.lng))).toString() + ")";
	var marker = new GMarker(gll, { title : tooltip, icon : icon});
	this.map.addOverlay(marker);
	marker.id = waypoint.id;
	if(label != null) {
		labelOverlay = new ELabel(gll, label, "width: 6em", new GSize(4, -4));
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

org.sarsoft.EditableGMap = function(map, showtools) {
	org.sarsoft.FixedGMap.call(this, map, showtools);
	var that = this;
	this._handlers = new Object();

	var id = document.createElement("div");
	id.style.zIndex=2000;
	id.style.position="absolute";
	id.style.top="25px";
	id.style.right="0px";
	id.style.backgroundColor="white";
	map.getContainer().appendChild(id);
	
	var pos = document.createElement("div");
	pos.style.fontWeight="bold";
	pos.style.textAlign="right";
	pos.className="noprint";
	id.appendChild(pos);
	
	this._infodiv = id;
	this._infopos = pos;

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
		var utm = GeoUtil.GLatLngToUTM(GeoUtil.fromWGS84(latlng));
		var e = "" + Math.round(utm.e);
		var n = "" + Math.round(utm.n);
		var e1 = e.substring(0, e.length-3);
		var e2 = e.substring(e.length-3, e.length);
		var n1 = n.substring(0, n.length-3);
		var n2 = n.substring(n.length-3, n.length);

		var message = utm.zone + " " + e1 + "<span style=\"font-size: smaller\">" + e2 + "</span>E " + n1 + "<span style=\"font-size: smaller\">" + n2 + "</span>N<br/>";
		message = message + GeoUtil.formatDDMMHH(latlng.lat()) + ", " + GeoUtil.formatDDMMHH(latlng.lng());
		that._positionMessage(message);
	});
}

org.sarsoft.EditableGMap.prototype = new org.sarsoft.FixedGMap();

org.sarsoft.EditableGMap.prototype._positionMessage = function(message) {
	this._infopos.innerHTML = message;
}
org.sarsoft.EditableGMap.prototype._infomessage = function(message, timeout) {
	this.mapMessageControl.redraw(message, timeout);
}

org.sarsoft.EditableGMap.prototype._addOverlay = function(way, config, label) {
	var that = this;
	var poly = org.sarsoft.FixedGMap.prototype._addOverlay.call(this, way, config, label);
	GEvent.addListener(poly, "mouseover", function() {
		if(way.displayMessage == null) {
			that._infomessage(way.name);
		} else {
			that._infomessage(way.displayMessage);
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
		var gll = glls[i];
		waypoints.push({lat: gll.lat(), lng: gll.lng()});
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

org.sarsoft.MapInfoControl = function() {
}

org.sarsoft.MapInfoControl.prototype = new GControl();
org.sarsoft.MapInfoControl.prototype.printable = function() { return false; }
org.sarsoft.MapInfoControl.prototype.selectable = function() { return false; }
org.sarsoft.MapInfoControl.prototype.getDefaultPosition = function() { return new GControlPosition(G_ANCHOR_BOTTOM_RIGHT, new GSize(0, 0)); }

org.sarsoft.MapInfoControl.prototype.initialize = function(map) {
	var that = this;
	this.minimized = false;
	this.div = document.createElement("div");

	this.ctrl = document.createElement("span");
	this.ctrl.style.background = "white";
	this.ctrl.style.border = "1px 0px 0px 1px solid black";
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
	this.msg.style.border = "1px 0px 0px 0px solid black";
	
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

org.sarsoft.MapController = function(emap) {
	var that = this;
	this.emap = emap;
	this._contextMenu = new org.sarsoft.view.ContextMenu();
	this._menuItems = [];
	this._setCenterPrecedence = -1;
	this.registered = new Object();
	this._mapInfoMessages = new Object();
	
	if(emap.addListener != null) emap.addListener("singlerightclick", function(point, obj) {
		that._contextMenu.setItems(that._menuItems)
		that._contextMenu.show(point, obj);
	});
}

org.sarsoft.MapController.prototype.addContextMenuItems = function(items) {
	this._menuItems = this._menuItems.concat(items);
}

org.sarsoft.MapController.prototype.setCenter = function(center, zoom, precedence) {
	if(precedence == null || precedence < 0) precedence = 0;
	if(precedence <= this._setCenterPrecedence) return;
	
	this.emap.map.setCenter(center, zoom);
	this._setCenterPrecedence = precedence;
}

org.sarsoft.MapController.prototype.message = function(msg, delay) {
	this.emap._infomessage(msg, delay);
}

org.sarsoft.MapController.prototype.register = function(type, controller) {
	this.registered[type] = controller;
}

org.sarsoft.MapController.prototype.addMenuItem = function(item, order) {
	if(order == null) order = 10000;
	item.menuOrder = order;
	var extras = this.emap.map._overlaydropdownmapcontrol.extras;
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

org.sarsoft.MapController.prototype.timer = function() {
	for(var key in this.registered) {
		var val = this.registered[key];
		if(val.timer != null) val.timer();
	}
}

org.sarsoft.MapController.prototype.setMapInfo = function(classname, order, message) {
	if(this._mapInfoControl == null) {
		this._mapInfoControl = new org.sarsoft.MapInfoControl();
		this.emap.map.addControl(this._mapInfoControl);
	}
	
	this._mapInfoMessages[classname] = { order: order, message : message};

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
  div.innerHTML = '<div style="' + this.style + '">' + this.html + '</div>' ;
  map.getPane(G_MAP_FLOAT_SHADOW_PANE).appendChild(div);
  this.map_ = map;
  this.div_ = div;
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
  this.div_.style.left = Math.round(p.x + this.pixelOffset.width + w * this.centerOffset.width) + "px";
  this.div_.style.top = Math.round(p.y +this.pixelOffset.height + h * this.centerOffset.height) + "px";
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


