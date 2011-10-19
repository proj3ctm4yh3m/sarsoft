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
}

org.sarsoft.view.MarkerForm.prototype.create = function(container) {
	var that = this;
	var form = jQuery('<form name="EntityForm_' + org.sarsoft.view.EntityForm._idx++ + '" className="EntityForm"></form>').appendTo(container);
	var div = jQuery('<div class="item"><label for="label">Label:</label></div>').appendTo(form);
	this.labelInput = jQuery('<input name="label" type="text" size="15"/>').appendTo(div);
	
	div = jQuery('<div class="item"><label for="image">Image:</label></div>').appendTo(form);
	this.imageInput = jQuery('<input name="image" type="text" size="15"/>').appendTo(div);

	var imgSwatch = jQuery('<img style="width: 20px; height: 20px"/>').appendTo(div);
	this.imageInput.change(function() {
		var url = that.imageInput.val();
		if(url == null) url = "";
		if(url.indexOf('#') == 0) {
			url = '/resource/imagery/icons/circle/' + url.substr(1) + '.png';
		} else if(url.indexOf('/') == -1 && url.indexOf('.') == -1) {
			url = '/static/images/icons/' + url + '.png';
		}
		imgSwatch.attr("src", url);
		});

	var imageContainer = jQuery('<div></div>').appendTo(form);
	var images = ["warning","crossbones","avy1","fire","rescue","rocks","cp","clue","binoculars","car","drinkingwater","harbor","picnic","shelter","wetland","waterfall","climbing","skiing","spelunking","hunting","snowmobile","motorbike"];
	for(var i = 0; i < images.length; i++) {
		var swatch = jQuery('<img style="width: 20px; height: 20px" src="/static/images/icons/' + images[i] + '.png"/>').appendTo(imageContainer);
		swatch.click(function() { var j = i; return function() {
			that.imageInput.val(images[j]); that.imageInput.trigger('change');}}());
	}
	var colors = ["#FF0000", "#FF5500", "#FFAA00", "#FFFF00", "#0000FF", "#8800FF", "#FF00FF"];
	for(var i = 0; i < colors.length; i++) {
		var swatch = jQuery('<img style="width: 20px; height: 20px" src="/resource/imagery/icons/circle/' + colors[i].substr(1) + '.png"></div>').appendTo(imageContainer);
		swatch.click(function() { var j = i; return function() {that.imageInput.val(colors[j]); that.imageInput.trigger('change');}}());
	}
}

org.sarsoft.view.MarkerForm.prototype.read = function() {
	return {label : this.labelInput.val(), url: this.imageInput.val()};
}

org.sarsoft.view.MarkerForm.prototype.write = function(obj) {
	this.labelInput.val(obj.label);
	this.imageInput.val(obj.url);
	this.imageInput.trigger('change');}

org.sarsoft.view.ShapeForm = function() {
}

org.sarsoft.view.ShapeForm.prototype.create = function(container) {
	var that = this;
	var form = jQuery('<form name="EntityForm_' + org.sarsoft.view.EntityForm._idx++ + '" className="EntityForm"></form>').appendTo(container);
	
	var div = jQuery('<div class="item"><label for="label">Label:</label></div>').appendTo(form);
	this.labelInput = jQuery('<input name="label" type="text" size="15"/>').appendTo(div);	
	
	div = jQuery('<div class="item"><label for="color">Color:</label></div>').appendTo(form);
	this.colorInput = jQuery('<input name="color" type="text" size="8" style="float: left"/>').appendTo(div);
	var colorSwatch = jQuery('<div style="width: 20px; height: 20px; float: left"></div>').appendTo(div);
	this.colorInput.change(function() {colorSwatch.css('background-color', that.colorInput.val())});
	
	var colorContainer = jQuery('<div style="clear: both"></div>').appendTo(form);
	var colors = ["#FFFFFF", "#C0C0C0", "#808080", "#000000", "#FF0000", "#800000", "#FF5500", "#FFAA00", "#FFFF00", "#808000", "#00FF00", "#008000", "#00FFFF", "#008080", "#0000FF", "#000080", "#FF00FF", "#800080"];
	for(var i = 0; i < colors.length; i++) {
		var swatch = jQuery('<div style="width: 20px; height: 20px; float: left; background-color: ' + colors[i] + '"></div>').appendTo(colorContainer);
		swatch.click(function() { var j = i; return function() {that.colorInput.val(colors[j]); that.colorInput.trigger('change');}}());
	}
	
	div = jQuery('<div class="item" style="clear: both"><label for="color">Weight:</label></div>').appendTo(form);
	this.weightInput = jQuery('<select name="weight"><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option></select>').appendTo(div);
	
	this.fillDiv = jQuery('<div class="item"><label for="color">Fill:</label></div>').appendTo(form);
	this.fillInput = jQuery('<select name="fill"><option value="0">None</option><option value="10">10%</option>' + 
			'<option value="20">20%</option><option value="30">30%</option><option value="40">40%</option><option value="50">50%</option>' +
			'<option value="60">60%</option><option value="70">70%</option><option value="80">80%</option><option value="90">90%</option>' +
			'<option value="100">Solid</option>/select>').appendTo(this.fillDiv);

	this.freehandDiv = jQuery('<div class="item"><label for="freehand">Freehand Draw:</label></div>').appendTo(form);
	this.freehandInput = jQuery('<input name="freehand" type="checkbox"/>').appendTo(this.freehandDiv);

}

org.sarsoft.view.ShapeForm.prototype.read = function() {
	return {label : this.labelInput.val(), color : this.colorInput.val(), fill: this.fillInput.val(), weight: this.weightInput.val(), freehand : this.freehandInput.attr("checked")};
}

org.sarsoft.view.ShapeForm.prototype.write = function(obj) {
	this.colorInput.val(obj.color);
	this.colorInput.trigger('change');
	this.fillInput.val(obj.fill);
	this.weightInput.val(obj.weight);
	this.labelInput.val(obj.label);
	if(obj.way != null) this.fillDiv.css("display", (obj.way.polygon ? "block" : "none"));
	this.freehandDiv.css("display", (obj.create ? "block" : "none"));
}

org.sarsoft.controller.MarkupMapController = function(imap, nestMenuItems) {
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
				if(shape.freehand) that.redrawShape(obj);
			}, shape);
		}});
	
	var items = [{text : "New Marker", applicable : function(obj) { return obj == null }, handler: function(data) { that.markerDlg.marker=null; that.markerDlg.entityform.write({url: "#FF0000"});that.markerDlg.point=data.point; that.markerDlg.show(); }},
	    {text : "New Line", applicable : function(obj) { return obj == null }, handler: function(data) { that.shapeDlg.shape=null; that.shapeDlg.polygon=false; that.shapeDlg.entityform.write({create: true, weight: 1, color: "#FF0000", way : {polygon: false}});that.shapeDlg.point=data.point; that.shapeDlg.show(); }},
	    {text : "New Polygon", applicable : function(obj) { return obj == null }, handler: function(data) { that.shapeDlg.shape=null; that.shapeDlg.polygon=true; that.shapeDlg.entityform.write({create: true, weight: 1, color: "#FF0000", way : {polygon: true}});that.shapeDlg.point=data.point; that.shapeDlg.show(); }}];

	if(nestMenuItems) {
		items = [{text : "Markup \u2192", applicable : function(obj) { return obj == null }, items: items}];
	}

	if(org.sarsoft.userPermissionLevel == "WRITE" || org.sarsoft.userPermissionLevel == "ADMIN") {
		this.imap.addContextMenuItems(items.concat([
    		{text : "Details", applicable : function(obj) { return obj != null && that.getMarkerIdFromWpt(obj) != null}, handler: function(data) { var marker = that.markers[that.getMarkerIdFromWpt(data.subject)]; that.markerDlg.marker=marker; that.markerDlg.entityform.write(marker); that.markerDlg.show();}},
    		{text : "Delete Marker", applicable : function(obj) { return obj != null && that.getMarkerIdFromWpt(obj) != null}, handler: function(data) { var id = that.getMarkerIdFromWpt(data.subject); that.removeMarker(id); that.markerDAO.del(id);}},
    		{text : "Modify Points", applicable : function(obj) { var shape = that.shapes[that.getShapeIdFromWay(obj)]; return shape != null && !that.getShapeAttr(shape, "inedit"); }, handler : function(data) { that.editShape(that.shapes[that.getShapeIdFromWay(data.subject)]) }},
    		{text : "Details", applicable : function(obj) { var id = that.getShapeIdFromWay(obj); return obj != null && id != null && !that.getShapeAttr(that.shapes[id], "inedit");}, handler: function(data) { var shape = that.shapes[that.getShapeIdFromWay(data.subject)]; that.shapeDlg.shape=shape; that.shapeDlg.entityform.write(shape); that.shapeDlg.show();}},
    		{text : "Redraw", applicable : function(obj) { var shape = that.shapes[that.getShapeIdFromWay(obj)]; return shape != null && !that.getShapeAttr(shape, "inedit"); }, handler : function(data) { that.redrawShape(that.shapes[that.getShapeIdFromWay(data.subject)]) }},
    		{text : "Save Changes", applicable : function(obj) { var shape = that.shapes[that.getShapeIdFromWay(obj)]; return shape != null && that.getShapeAttr(shape, "inedit"); }, handler: function(data) { that.saveShape(that.shapes[that.getShapeIdFromWay(data.subject)]) }},
    		{text : "Discard Changes", applicable : function(obj) { var shape = that.shapes[that.getShapeIdFromWay(obj)]; return shape != null && that.getShapeAttr(shape, "inedit"); }, handler: function(data) { that.discardShape(that.shapes[that.getShapeIdFromWay(data.subject)]) }},
    		{text : "Delete Shape", applicable : function(obj) { var id = that.getShapeIdFromWay(obj); return obj != null && id != null && !that.getShapeAttr(that.shapes[id], "inedit");}, handler: function(data) { var id = that.getShapeIdFromWay(data.subject); that.removeShape(id); that.shapeDAO.del(id);}}
     		]));
	}

	var showHide = new org.sarsoft.ToggleControl("MRK", "Show/Hide Markup", function(value) {
		that.showMarkup = value;
		that.handleSetupChange();
	});
	this.showHide = showHide;
	this.imap.addMenuItem(showHide.node, 19);

	this.markerDAO.loadAll(function(markers) {
		that.refreshMarkers(markers);
		for(var i = 0; i < markers.length; i++) {
			that.imap.growInitialMap(new GLatLng(markers[i].position.lat, markers[i].position.lng));
		}
	});		
	this.markerDAO.mark();

	this.shapeDAO.loadAll(function(shapes) {
		that.refreshShapes(shapes);
		for(var i = 0; i < shapes.length; i++) {
			var bb = shapes[i].way.boundingBox;
			that.imap.growInitialMap(new GLatLng(bb[0].lat, bb[0].lng));
			that.imap.growInitialMap(new GLatLng(bb[1].lat, bb[1].lng));
		}
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
	delete this.markers[id];
}

org.sarsoft.controller.MarkupMapController.prototype.removeShape = function(id) {
	if(this.shapes[id] != null) this.imap.removeWay(this.shapes[id].way);
	delete this.shapes[id];
}

org.sarsoft.controller.MarkupMapController.prototype.setConfig = function(config) {
	if(config.MarkupMapController == null || config.MarkupMapController.showClues == null) return;
	this.showMarkup = config.MarkupMapController.showMarkup;
	this.handleSetupChange();
}

org.sarsoft.controller.MarkupMapController.prototype.getConfig = function(config) {
	if(config == null) config = new Object();
	if(config.MarkupMapController == null) config.MarkupMapController = new Object();
	config.MarkupMapController.showMarkup = this.showMarkup;
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
	
	if(marker.url == null || marker.url.length == 0) {
		config.color = "#FF0000";
	} else if(marker.url.indexOf('#') == 0) {
		config.color = marker.url;
	} else if(marker.url.indexOf('/') == -1 && marker.url.indexOf('.') == -1) {
		config.icon = org.sarsoft.MapUtil.createIcon(24, "/static/images/icons/" + marker.url + ".png");
	} else {
		config.icon = org.sarsoft.MapUtil.createIcon(20, marker.url);
	}
	this.imap.addWaypoint(marker.position, config, tooltip, marker.label);
}

org.sarsoft.controller.MarkupMapController.prototype.showShape = function(shape) {
	if(this.shapes[shape.id] != null) this.imap.removeWay(this.shapes[shape.id].way);
	if(shape.way == null) return;
	this.shapes[shape.id] = shape;
	shape.way.waypoints = shape.way.zoomAdjustedWaypoints;
	shape.way.displayMessage = shape.label + " (" + shape.formattedSize + ")";
	if(!this.showMarkup) return; // need lines above this in case the user re-enables clues

	this.imap.addWay(shape.way, {clickable : true, fill: shape.fill, color: shape.color, weight: shape.weight}, shape.label);
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
		if(!this.getShapeAttr(shapes[i], "inedit"))
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

org.sarsoft.controller.MarkupMapController.prototype.getFindBlock = function() {
	var that = this;
	var node = jQuery('<div></div>');
	var node1 = jQuery('<div>Marker:</div>').appendTo(node);
	var select1 = jQuery('<select><option value="--">--</option></select>').appendTo(node1);
	for(var id in this.markers) {
		var label = this.markers[id].label;
		if(label != null && label.length > 0) {
			jQuery('<option value="' + id + '">' + label + '</option>').appendTo(select1);
		}
	}

	var node2 = jQuery('<div>Shape:</div>').appendTo(node);
	var select2 = jQuery('<select><option value="--">--</option></select>').appendTo(node2);
	for(var id in this.shapes) {
		var label = this.shapes[id].label;
		if(label != null && label.length > 0) {
			jQuery('<option value="' + id + '">' + label + '</option>').appendTo(select2);
		}
	}

	this._findBlock = {order : 10, node : node[0], handler : function() {
		var id = select1.val();
		if(id != "--") {
			var wpt = that.markers[id].position;
			that.imap.map.setCenter(new GLatLng(wpt.lat, wpt.lng), 15);
			return true;
		}
		id = select2.val();
		if(id != "--") {
			var bb = that.shapes[id].way.boundingBox;
			that.imap.setBounds(new GLatLngBounds(new GLatLng(bb[0].lat, bb[0].lng), new GLatLng(bb[1].lat, bb[1].lng)));
			return true;
		}
		return false;
	}};

	return this._findBlock;
}
