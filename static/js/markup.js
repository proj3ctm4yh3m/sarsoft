if(typeof org == "undefined") org = new Object();
if(typeof org.sarsoft == "undefined") org.sarsoft = new Object();
if(typeof org.sarsoft.view == "undefined") org.sarsoft.view = new Object();
if(typeof org.sarsoft.controller == "undefined") org.sarsoft.controller = new Object();

org.sarsoft.ShapeDAO = function(errorHandler, baseURL) {
	if(typeof baseURL == "undefined") baseURL = "/rest/shape";
	this.baseURL = baseURL;
	this.errorHandler = errorHandler;
}

org.sarsoft.ShapeDAO.prototype = new org.sarsoft.BaseDAO();

org.sarsoft.ShapeDAO.prototype.getWaypoints = function(handler, shape, precision) {
	this._doGet("/" + shape.id + "/way?precision=" + precision, handler);
}

org.sarsoft.ShapeDAO.prototype.saveWaypoints = function(shape, waypoints) {
	this._doPost("/" + shape.id + "/way", function() {}, waypoints);
}

org.sarsoft.MarkerDAO = function(errorHandler, baseURL) {
	if(typeof baseURL == "undefined") baseURL = "/rest/marker";
	this.baseURL = baseURL;
	this.errorHandler = errorHandler;
}

org.sarsoft.MarkerDAO.prototype = new org.sarsoft.BaseDAO();

org.sarsoft.view.MarkerForm = function() {
	var fields = [
		{ name : "label", label: "Label", type : "string"},
		{ name : "url", label: "Image URL", type : "string"}
	];
	org.sarsoft.view.EntityForm.call(this, fields);
}

org.sarsoft.view.MarkerForm.prototype = new org.sarsoft.view.EntityForm();

org.sarsoft.view.ShapeForm = function() {
}

org.sarsoft.view.ShapeForm.prototype.create = function(container) {
	var that = this;
	var form = jQuery('<form name="EntityForm_' + org.sarsoft.view.EntityForm._idx++ + '" className="EntityForm"></form>').appendTo(container);
	var div = jQuery('<div class="item"><label for="color">Color:</label></div>').appendTo(form);
	this.colorInput = jQuery('<input name="color" type="text" size="8"/>').appendTo(div);
	
	div = jQuery('<div class="item"><label for="color">Weight:</label></div>').appendTo(form);
	this.weightInput = jQuery('<input name="weight" type="text" size="2"/>').appendTo(div);
	
	div = jQuery('<div class="item"><label for="color">Fill:</label></div>').appendTo(form);
	this.fillInput = jQuery('<input name="fill" type="text" size="2"/>').appendTo(div);
	
	var colorContainer = jQuery('<div border: 1px solid red"></div>').appendTo(form);
	var colors = ["#FF0000", "#FF5500", "#FFAA00", "#FFFF00", "#0000FF", "#8800FF", "#FF00FF"];
	for(var i = 0; i < colors.length; i++) {
		var swatch = jQuery('<div style="width: 20px; height: 20px; float: left; background-color: ' + colors[i] + '"></div>').appendTo(colorContainer);
		swatch.click(function() { var j = i; return function() {that.colorInput.val(colors[j])}}());
	}
}

org.sarsoft.view.ShapeForm.prototype.read = function() {
	return {color : this.colorInput.val(), fill: this.fillInput.val(), weight: this.weightInput.val()};
}

org.sarsoft.view.ShapeForm.prototype.write = function(obj) {
	this.colorInput.val(obj.color);
	this.fillInput.val(obj.fill);
	this.weightInput.val(obj.weight);
	this.fillInput.attr("disabled",  (obj.way.polygon ? false : true));
}

org.sarsoft.controller.MarkupMapController = function(imap) {
	var that = this;
	this.imap = imap;
	this.imap.register("org.sarsoft.controller.MarkupMapController", this);
	this.shapeDAO = new org.sarsoft.ShapeDAO(function () { that.imap.message("Server Communication Error"); });
	this.markerDAO = new org.sarsoft.MarkerDAO(function () { that.imap.message("Server Communication Error"); });
	this.markers = new Object();
	this.shapes = new Object();
	this._shapeAttrs = new Object();
	this.showMarkup = true;
	
	this.markerDlg = new org.sarsoft.view.EntityCreateDialog("Marker Details", new org.sarsoft.view.MarkerForm(), function(marker) {
		if(that.markerDlg.marker != null) {
			marker.position = that.markerDlg.marker.position;
			that.markerDAO.save(that.markerDlg.marker.id, marker, function(obj) {
				that.refreshMarkers([obj]);
			});
		} else {
			var wpt = this.imap.map.fromContainerPixelToLatLng(new GPoint(that.markerDlg.point.x, that.markerDlg.point.y));
			marker.position = {lat: wpt.lat(), lng: wpt.lng()};
			that.markerDAO.create(function(obj) {
				that.refreshMarkers([obj]);
			}, marker);
		}});
	
	this.shapeDlg = new org.sarsoft.view.EntityCreateDialog("Shape Details", new org.sarsoft.view.ShapeForm(), function(shape) {
		if(that.shapeDlg.shape != null) {
			that.shapeDAO.save(that.shapeDlg.shape.id, shape, function(obj) {
				that.refreshShapes([obj]);
			});
		} else {
			shape.way = {polygon: that.shapeDlg.polygon};
			shape.way.waypoints = that.imap.getNewWaypoints(that.shapeDlg.point, that.shapeDlg.polygon);
			that.shapeDAO.create(function(obj) {
				that.refreshShapes([obj]);
			}, shape);
		}});
	
	this.imap.addContextMenuItems([
       		{text : "Add Marker", applicable : function(obj) { return obj == null }, handler: function(data) { that.markerDlg.marker=null; that.markerDlg.entityform.write({});that.markerDlg.point=data.point; that.markerDlg.show(); }},
    		{text : "Edit Marker", applicable : function(obj) { return obj != null && that.getMarkerIdFromWpt(obj) != null}, handler: function(data) { var marker = that.markers[that.getMarkerIdFromWpt(data.subject)]; that.markerDlg.marker=marker; that.markerDlg.entityform.write(marker); that.markerDlg.show();}},
    		{text : "Delete Marker", applicable : function(obj) { return obj != null && that.getMarkerIdFromWpt(obj) != null}, handler: function(data) { var id = that.getMarkerIdFromWpt(data.subject); that.removeMarker(id); that.markerDAO.del(id);}},
       		{text : "Add Line", applicable : function(obj) { return obj == null }, handler: function(data) { that.shapeDlg.shape=null; that.shapeDlg.polygon=false; that.shapeDlg.entityform.write({});that.shapeDlg.point=data.point; that.shapeDlg.show(); }},
       		{text : "Add Polygon", applicable : function(obj) { return obj == null }, handler: function(data) { that.shapeDlg.shape=null; that.shapeDlg.polygon=true; that.shapeDlg.entityform.write({});that.shapeDlg.point=data.point; that.shapeDlg.show(); }},
    		{text : "Edit Bounds", applicable : function(obj) { var shape = that.shapes[that.getShapeIdFromWay(obj)]; return shape != null && !that.getShapeAttr(shape, "inedit"); }, handler : function(data) { that.editShape(that.shapes[that.getShapeIdFromWay(data.subject)]) }},
    		{text : "Redraw Freehand", applicable : function(obj) { var shape = that.shapes[that.getShapeIdFromWay(obj)]; return shape != null && !that.getShapeAttr(shape, "inedit"); }, handler : function(data) { that.redrawShape(that.shapes[that.getShapeIdFromWay(data.subject)]) }},
    		{text : "Save Changes", applicable : function(obj) { var shape = that.shapes[that.getShapeIdFromWay(obj)]; return shape != null && that.getShapeAttr(shape, "inedit"); }, handler: function(data) { that.saveShape(that.shapes[that.getShapeIdFromWay(data.subject)]) }},
    		{text : "Discard Changes", applicable : function(obj) { var shape = that.shapes[that.getShapeIdFromWay(obj)]; return shape != null && that.getShapeAttr(shape, "inedit"); }, handler: function(data) { that.discardShape(that.shapes[that.getShapeIdFromWay(data.subject)]) }},
    		{text : "Edit Details", applicable : function(obj) { var id = that.getShapeIdFromWay(obj); return obj != null && id != null && !that.getShapeAttr(that.shapes[id], "inedit");}, handler: function(data) { var shape = that.shapes[that.getShapeIdFromWay(data.subject)]; that.shapeDlg.shape=shape; that.shapeDlg.entityform.write(shape); that.shapeDlg.show();}},
    		{text : "Delete Shape", applicable : function(obj) { var id = that.getShapeIdFromWay(obj); return obj != null && id != null && !that.getShapeAttr(that.shapes[id], "inedit");}, handler: function(data) { var id = that.getShapeIdFromWay(data.subject); that.removeShape(id); that.shapeDAO.del(id);}}
     		]);
	
	var showHide = new org.sarsoft.ToggleControl("MRK", "Show/Hide Markup", function(value) {
		that.showMarkup = value;
		that.handleSetupChange();
	});
	this.showHide = showHide;
	this.imap.addMenuItem(showHide.node, 19);

	this.markerDAO.loadAll(function(markers) {
		var n = -180;
		var s = 180;
		var e = -180;
		var w = 180;
		var total = 0;
		for(var i = 0; i < markers.length; i++) {
			var marker = markers[i];
			if(marker.position != null) {
				total++;
				n = Math.max(n, marker.position.lat);
				s = Math.min(s, marker.position.lat);
				e = Math.max(e, marker.position.lng);
				w = Math.min(w, marker.position.lng);
			}
		}
		if(total > 1) {
			that.imap.growInitialMap(new GLatLng(s, w));
			that.imap.growInitialMap(new GLatLng(n, e));
		}

		that.refreshMarkers(markers);
	});		
	this.markerDAO.mark();
	
	this.shapeDAO.loadAll(function(shapes) {
		// TODO adjust map size/center
		that.refreshShapes(shapes);
	});
	this.shapeDAO.mark();	
}

org.sarsoft.controller.MarkupMapController.prototype.setShapeAttr = function(shape, key, value) {
	if(shape == null) return null;
	if(typeof this._shapeAttrs[shape.id] == "undefined") {
		this._shapeAttrs[shape.id] = new Object();
	}
	this._shapeAttrs[shape.id][key] = value;
}

org.sarsoft.controller.MarkupMapController.prototype.getShapeAttr = function(shape, key) {
	if(shape == null) return null;
	if(typeof this._shapeAttrs[shape.id] == "undefined") return null;
	return this._shapeAttrs[shape.id][key];
}


org.sarsoft.controller.MarkupMapController.prototype.saveShape = function(shape) {
	shape.way.waypoints = this.imap.save(shape.way.id);
	this.shapeDAO.saveWaypoints(shape, shape.way.waypoints);
	this.setShapeAttr(shape, "inedit", false);
}

org.sarsoft.controller.MarkupMapController.prototype.discardShape = function(shape) {
	this.imap.discard(shape.way.id);
	this.setShapeAttr(shape, "inedit", false);
}

org.sarsoft.controller.MarkupMapController.prototype.redrawShape = function(shape) {
	this.imap.redraw(shape.way.id);
	this.setShapeAttr(shape, "inedit", true);
}

org.sarsoft.controller.MarkupMapController.prototype.editShape = function(shape) {
	this.imap.edit(shape.way.id);
	this.setShapeAttr(shape, "inedit", true);
}

org.sarsoft.controller.MarkupMapController.prototype.removeMarker = function(id) {
	if(this.markers[id] != null) this.imap.removeWaypoint(this.markers[id].position);
	this.markers[id] = null;
}

org.sarsoft.controller.MarkupMapController.prototype.removeShape = function(id) {
	if(this.shapes[id] != null) this.imap.removeWay(this.shapes[id].way);
	this.shapes[id] = null;
}

org.sarsoft.controller.MarkupMapController.prototype.setConfig = function(config) {
	if(config.MarkupMapController == null || config.MarkupMapController.showClues == null) return;
	this.showMarkup = config.ClueLocationMapController.showMarkup;
	this.handleSetupChange();
}

org.sarsoft.controller.MarkupMapController.prototype.getConfig = function(config) {
	if(config == null) config = new Object();
	if(config.MarkupMapController == null) config.MarkupMapController = new Object();
	config.MarkupMapController.showClues = this.showMarkup;
	return config;
}

org.sarsoft.controller.MarkupMapController.prototype.getMarkerIdFromWpt = function(wpt) {
	for(var key in this.markers) {
		if(this.markers[key] != null && this.markers[key].position == wpt) return key;
	}
}

org.sarsoft.controller.MarkupMapController.prototype.getShapeIdFromWay = function(way) {
	for(var key in this.shapes) {
		if(this.shapes[key] != null && this.shapes[key].way == way) return key;
	}
}

org.sarsoft.controller.MarkupMapController.prototype.timer = function() {
	var that = this;
	this.markerDAO.loadSince(function(markers) {
		that.refreshMarkers(markers);
	});
	that.markerDAO.mark();
	this.shapeDAO.loadSince(function(shapes) {
		that.refreshShapes(shapes);
	});
	that.shapeDAO.mark();
}

org.sarsoft.controller.MarkupMapController.prototype.showMarker = function(marker) {
	if(this.markers[marker.id] != null) this.imap.removeWaypoint(this.markers[marker.id].position);
	if(marker.position == null) return;
	this.markers[marker.id] = marker;
	if(!this.showMarkup) return; // need lines above this in case the user re-enables clues

	var config = new Object();	
	var tooltip = marker.label;
	
	var icon = org.sarsoft.MapUtil.createIcon(16, "/static/images/find.png");
	this.imap.addWaypoint(marker.position, {icon: icon}, tooltip, marker.label);
}


org.sarsoft.controller.MarkupMapController.prototype.showShape = function(shape) {
	if(this.shapes[shape.id] != null) this.imap.removeWay(this.shapes[shape.id].way);
	if(shape.way == null) return;
	this.shapes[shape.id] = shape;
	shape.way.waypoints = shape.way.zoomAdjustedWaypoints;
	if(!this.showMarkup) return; // need lines above this in case the user re-enables clues

	this.imap.addWay(shape.way, {clickable : true, fill: shape.fill, color: shape.color, weight: shape.weight});
}

org.sarsoft.controller.MarkupMapController.prototype.refreshMarkers = function(markers) {
	var that = this;

	var timestamp = this.markerDAO._timestamp;
	for(var i = 0; i < markers.length; i++) {
		this.showMarker(markers[i]);
	}
}

org.sarsoft.controller.MarkupMapController.prototype.refreshShapes = function(shapes) {
	var that = this;

	var timestamp = this.shapeDAO._timestamp;
	for(var i = 0; i < shapes.length; i++) {
		this.showShape(shapes[i]);
	}
}

org.sarsoft.controller.MarkupMapController.prototype.handleSetupChange = function() {
	this.showHide.setValue(this.showMarkup);
	if(!this.showMarkup) {
		for(var key in this.markers) {
			this.imap.removeWaypoint(this.markers[key].position);
		}
		for(var key in this.shapes) {
			this.imap.removeWay(this.shapes[key].way);
		}
	} else {
		for(var key in this.markers) {
			this.showMarker(this.markers[key]);
		}
		for(var key in this.shapes) {
			this.showShape(this.shapes[key]);
		}
	}
}
