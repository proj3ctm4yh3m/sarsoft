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

org.sarsoft.ShapeDAO.prototype.saveWaypoints = function(shape, waypoints, handler) {
	this._doPost("/" + shape.id + "/way", (handler == null) ? function() {} : handler, waypoints);
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
	this.imgSwatch = jQuery('<img style="width: 20px; height: 20px"/>').appendTo(div);
	div.append(document.createTextNode("  or color:"));
	this.imageInput = jQuery('<input name="image" type="text" size="8"/>').appendTo(div);

	this.imageInput.change(function() {
		that.imageUrl = that.imageInput.val();
		that.handleChange();
	});

	var imageContainer = jQuery('<div></div>').appendTo(form);
	var images = ["nps-4wd","nps-climbing","nps-dirtbike","nps-diving","nps-firstaid","nps-gas","nps-lookout","nps-phone","nps-picnic","nps-roadbike","nps-rockfall","nps-scramble","nps-shelter","nps-shower","nps-snowmobile","nps-water","warning","crossbones","avy1","fire","rescue","rocks","cp","clue","binoculars","car","drinkingwater","harbor","picnic","shelter","tent","wetland","waterfall","climbing","skiing","spelunking","hunting","snowmobile","motorbike"];
	for(var i = 0; i < images.length; i++) {
		var swatch = jQuery('<img style="width: 20px; height: 20px" src="/static/images/icons/' + images[i] + '.png"/>').appendTo(imageContainer);
		swatch.click(function() { var j = i; return function() {
			that.imageInput.val(""); that.imageUrl = images[j]; that.handleChange();}}());
	}
	var colors = ["#FF0000", "#FF5500", "#FFAA00", "#FFFF00", "#0000FF", "#8800FF", "#FF00FF"];
	for(var i = 0; i < colors.length; i++) {
		var swatch = jQuery('<img style="width: 20px; height: 20px" src="/resource/imagery/icons/circle/' + colors[i].substr(1) + '.png"></div>').appendTo(imageContainer);
		swatch.click(function() { var j = i; return function() {that.imageInput.val(colors[j]); that.imageInput.trigger('change');}}());
	}

	this.specsDiv = jQuery('<div class="item" style="padding-top: 10px"></div>').appendTo(form);
}


org.sarsoft.view.MarkerForm.prototype.handleChange = function() {
	var url = this.imageUrl;
	if(url == null) url = "";
	if(url.indexOf('#') == 0) {
		url = '/resource/imagery/icons/circle/' + url.substr(1) + '.png';
	} else if(url.indexOf('/') == -1 && url.indexOf('.') == -1) {
		url = '/static/images/icons/' + url + '.png';
	}
	this.imgSwatch.attr("src", url);
}

org.sarsoft.view.MarkerForm.prototype.read = function() {
	return {label : this.labelInput.val(), url: this.imageUrl};
}

org.sarsoft.view.MarkerForm.prototype.write = function(obj) {
	this.labelInput.val(obj.label);
	this.imageUrl = obj.url;
	if(this.imageUrl != null && this.imageUrl.indexOf("#")==0) {
		this.imageInput.val(obj.url);
	} else {
		this.imageInput.val("");
	}
	if(obj.updated != null) {
		this.specsDiv.html("Last updated on " + new Date(1*obj.updated).toDateString());
	} else {
		this.specsDiv.html("");
	}
	this.handleChange();
}

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
	
	this.specsDiv = jQuery('<div class="item" style="padding-top: 10px"></div>').appendTo(form);
}

org.sarsoft.view.ShapeForm.prototype.read = function() {
	return {label : this.labelInput.val(), color : this.colorInput.val(), fill: this.fillInput.val(), weight: this.weightInput.val()};
}

org.sarsoft.view.ShapeForm.prototype.write = function(obj) {
	this.colorInput.val(obj.color);
	this.colorInput.trigger('change');
	this.fillInput.val(obj.fill);
	this.weightInput.val(obj.weight);
	this.labelInput.val(obj.label);
	if(obj.way != null) this.fillDiv.css("display", (obj.way.polygon ? "block" : "none"));
	if(obj.formattedSize != null) {
		this.specsDiv.html("Size is " + obj.formattedSize + "<br/>" + "Last updated on " + new Date(1*obj.updated).toDateString());
	} else {
		this.specsDiv.html("");
	}
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

	var form = new org.sarsoft.view.MarkerForm();
	this.markerDlg = new org.sarsoft.view.EntityCreateDialog("Marker Details", form, function(marker) {
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
	form.labelInput.keydown(function(event) { if(event.keyCode == 13) that.markerDlg.dialog.ok();});

	form = new org.sarsoft.view.ShapeForm();
	this.shapeDlg = new org.sarsoft.view.EntityCreateDialog("Shape Details",form , function(shape) {
		if(that.shapeDlg.shape != null) {
			that.shapeDAO.save(that.shapeDlg.shape.id, shape, function(obj) {
				that.refreshShapes([obj]);
			});
		} else {
			shape.way = {polygon: that.shapeDlg.polygon};
			shape.way.waypoints = that.imap.getNewWaypoints(that.shapeDlg.point, that.shapeDlg.polygon);
			that.shapeDAO.create(function(obj) {
				that.refreshShapes([obj]);
				that.redrawShape(obj, function() { that.saveShape(obj); });
			}, shape);
		}});
	form.labelInput.keydown(function(event) { if(event.keyCode == 13) that.shapeDlg.dialog.ok();});
	
	var items = [{text : "New Marker", applicable : function(obj) { return obj == null }, handler: function(data) { that.markerDlg.marker=null; that.markerDlg.entityform.write({url: "#FF0000"});that.markerDlg.point=data.point; that.markerDlg.show(); }},
	    {text : "New Line", applicable : function(obj) { return obj == null }, handler: function(data) { that.shapeDlg.shape=null; that.shapeDlg.polygon=false; that.shapeDlg.entityform.write({create: true, weight: 2, color: "#FF0000", way : {polygon: false}});that.shapeDlg.point=data.point; that.shapeDlg.show(); }},
	    {text : "New Polygon", applicable : function(obj) { return obj == null }, handler: function(data) { that.shapeDlg.shape=null; that.shapeDlg.polygon=true; that.shapeDlg.entityform.write({create: true, weight: 2, color: "#FF0000", way : {polygon: true}, fill: 10});that.shapeDlg.point=data.point; that.shapeDlg.show(); }}];

	if(nestMenuItems) {
		items = [{text : "Markup \u2192", applicable : function(obj) { return obj == null }, items: items}];
	}

	if((org.sarsoft.userPermissionLevel == "WRITE" || org.sarsoft.userPermissionLevel == "ADMIN") && nestMenuItems != "none") {
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

	if(!nestMenuItems) {
		this.gps = new Object();
		this.gps.form = jQuery('<form name="gpsform" action="/map/gpxupload" enctype="multipart/form-data" method="post">I want to:</form>');
		this.gps.io = jQuery('<select style="margin-left: 15px"><option value="export">Export</option>' + ((org.sarsoft.userPermissionLevel != "READ") ? '<option value="import">Import</option>' : '') + '</select').appendTo(this.gps.form);
		this.gps.form.append("<br/><br/>");

		this.gps.exp = jQuery('<div></div>').appendTo(this.gps.form);
		var d1 = jQuery('<div></div>').appendTo(this.gps.exp);
		this.gps.exportAll = jQuery('<input type="radio" name="gpsexport" value="all" checked="yes">The entire map</input>').appendTo(d1);
		this.gps.shapeDiv = jQuery('<div></div>').appendTo(this.gps.exp);
		this.gps.exportShape = jQuery('<input type="radio" name="gpsexport" value="shape">A single shape:</input>').appendTo(this.gps.shapeDiv);
		this.gps.shape = jQuery('<select style="margin-left: 15px">').appendTo(this.gps.shapeDiv);

		this.gps.markerDiv = jQuery('<div></div>').appendTo(this.gps.exp);
		this.gps.exportMarker = jQuery('<input type="radio" name="gpsexport" value="marker">A single marker:</input>').appendTo(this.gps.markerDiv);
		this.gps.marker = jQuery('<select style="margin-left: 15px">').appendTo(this.gps.markerDiv);
		this.gps.exp.append("<br/>to:");
		this.gps.expFormat = jQuery('<select style="margin-left: 15px"><option value="GPX">GPX</option><option value="KML">KML</option><option value="GPS">Garmin GPS</option></select>').appendTo(this.gps.exp);
		
		this.gps.imp = jQuery('<div style="display: none"></div>').appendTo(this.gps.form);
		this.gps.imp.append("from:");
		this.gps.impFormat = jQuery('<select style="margin-left: 15px"><option value="GPX">GPX</option><option value="GPS">Garmin GPS</option></select>').appendTo(this.gps.imp);
		this.gps.imp.append('<br/>GPX File:<input type="hidden" name="format" value="gpx"/>');
		this.gps.impFile = jQuery('<input type="file" name="file" style="margin-left: 15px"/>').appendTo(this.gps.imp);
		
		this.gps.io.change(function() {
			var impexp = that.gps.io.val();
			if(impexp == "export") { that.gps.exp.css("display", "block"); that.gps.imp.css("display", "none"); }
			else { that.gps.exp.css("display", "none"); that.gps.imp.css("display", "block"); }
		});
		
		this.gps.impFormat.change(function() { that.gps.impFile.attr("disabled", that.gps.impFormat.val() != "GPX"); });

		var download = function(url, format) {
			if(format == "GPX" || format == "KML") {
				window.location = url + format;
			} else {
				url = url + "GPX";
				window.location = "/app/togarmin?name=Map%20Export&file=" + encodeURIComponent(url) + "&callbackurl=" + encodeURIComponent(window.location);
			}
		}
		this.gps.dlg = new org.sarsoft.view.CreateDialog("Import / Export", this.gps.form[0], "GO", "Cancel", function() {
			var impexp = that.gps.io.val();
			if(impexp == "export") {
				var val = $("input[@name=gpsexport]:checked").val();
				var format = that.gps.expFormat.val();
				if(val == "all") {
					download(window.location+'&format=', format);
				} else if(val == "shape") {
					download("/rest/shape/" + that.gps.shape.val() + "?format=", format);
				} else if(val == "marker") {
					download("/rest/marker/" + that.gps.marker.val() + "?format=", format);
				}
			} else {
				var format = that.gps.impFormat.val();
				if(format == "GPS") {
					window.location="/app/fromgarmin?callbackurl=" + encodeURIComponent(window.location) + "&posturl=/map/restgpxupload";
				} else if("" == that.gps.impFile.val()) {
					that.gps.dlg.show();
					alert("Please select a GPX file to import.");
				} else {
					that.gps.form.submit();
				}
			}
		});
		
		var icon = jQuery('<img src="/static/images/gps.png" style="cursor: pointer; vertical-align: middle" title="Export"/>')[0];
		GEvent.addDomListener(icon, "click", function() {
			that.gps.shape.empty();
			for(var key in that.shapes) {
				if(that.shapes[key].label != null && that.shapes[key].label.length > 0) that.gps.shape.append('<option value="' + that.shapes[key].id + '">' + that.shapes[key].label + '</option>')
			}
			if(that.gps.shape.children().length == 0) {
				that.gps.shapeDiv.css("display", "none");
			} else {
				that.gps.shapeDiv.css("display", "block");
			}
			that.gps.marker.empty();
			for(var key in that.markers) {
				if(that.markers[key].label != null && that.markers[key].label.length > 0) that.gps.marker.append('<option value="' + that.markers[key].id + '">' + that.markers[key].label + '</option>')
			}
			if(that.gps.marker.children().length == 0) {
				that.gps.markerDiv.css("display", "none");
			} else {
				that.gps.markerDiv.css("display", "block");
			}
			that.gps.dlg.show();
		});
		imap.addMenuItem(icon, 40);
	}

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
	this.shapeDAO.saveWaypoints(shape, shape.way.waypoints, function(obj) { shape.way = obj});
	this.setShapeAttr(shape, "inedit", false);
}

org.sarsoft.controller.MarkupMapController.prototype.discardShape = function(shape) {
	this.imap.discard(shape.way.id);
	this.setShapeAttr(shape, "inedit", false);
}

org.sarsoft.controller.MarkupMapController.prototype.redrawShape = function(shape, callback) {
	this.imap.redraw(shape.way.id, callback);
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
	if(way == null) return null;
	for(var key in this.shapes) {
		if(this.shapes[key] != null && this.shapes[key].way.id == way.id) return key;
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
		config.icon = org.sarsoft.MapUtil.createIcon(20, "/static/images/icons/" + marker.url + ".png");
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
	if(select1.children().length == 1) node1.css("display", "none");

	var node2 = jQuery('<div>Shape:</div>').appendTo(node);
	var select2 = jQuery('<select><option value="--">--</option></select>').appendTo(node2);
	for(var id in this.shapes) {
		var label = this.shapes[id].label;
		if(label != null && label.length > 0) {
			jQuery('<option value="' + id + '">' + label + '</option>').appendTo(select2);
		}
	}
	if(select2.children().length == 1) node2.css("display", "none");

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

org.sarsoft.controller.MapToolsController = function(imap) {
	var that = this;
	this.imap = imap;
	this.imap.register("org.sarsoft.controller.MapToolsController", this);
	
	this.alertDiv = document.createElement("div");
	this.dlg = new org.sarsoft.view.AlertDialog("Measure", this.alertDiv);

	var items = [{text: "Measure \u2192", applicable: function(obj) { return obj == null }, items:
		[{text: "Distance", applicable : function(obj) { return obj == null }, handler: function(data) { that.measure(data.point, false);}},
		 {text: "Area", applicable : function(obj) { return obj == null }, handler: function(data) { that.measure(data.point, true);}}]
	}];
	
	this.imap.addContextMenuItems(items);
}
	
org.sarsoft.controller.MapToolsController.prototype.measure = function(point, polygon) {
	var that = this;
	var poly = (polygon) ? new GPolygon([], "#FF0000",2,1,"#FF0000",0.2) : new GPolyline([], "#FF0000", 2, 1);
	this.imap.map.addOverlay(poly);
	poly.enableDrawing();
	poly.enableDrawing();
	GEvent.addListener(poly, "endline", function() {
		if(polygon) {
			that.alertDiv.innerHTML = "Area is " + (Math.round(poly.getArea()/1000)/1000) + " sq km";
		} else {
			that.alertDiv.innerHTML = "Distance is " + (Math.round(poly.getLength())/1000) + " km";
		}
		that.imap.map.removeOverlay(poly);
		that.dlg.show();
	});
	GEvent.addListener(poly, "cancelline", function() {
		that.imap.map.removeOverlay(poly);
	});
}
