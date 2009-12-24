if(typeof org == "undefined") org = new Object();
if(typeof org.sarsoft == "undefined") org.sarsoft = new Object();
if(typeof org.sarsoft.view == "undefined") org.sarsoft.view = new Object();
if(typeof org.sarsoft.controller == "undefined") org.sarsoft.controller = new Object();

org.sarsoft.SearchAssignmentDAO = function(errorHandler, baseURL) {
	if(baseURL == undefined) baseURL = "/rest/assignment";
	this.baseURL = baseURL;
	this.errorHandler = errorHandler;
}

org.sarsoft.SearchAssignmentDAO.prototype = new org.sarsoft.BaseDAO();

org.sarsoft.SearchAssignmentDAO.prototype.getWays = function(handler, assignment, precision) {
	this._doGet("/" + assignment.id + "/way?precision=" + precision, handler);
}

org.sarsoft.SearchAssignmentDAO.prototype.createWay = function(handler, assignment, way) {
	this._doPost("/" + assignment.id + "/way", handler, route);
}

org.sarsoft.SearchAssignmentDAO.prototype.deleteWay = function(assignment, idx, way) {
	this._doPost("/" + assignment.id + "/way/" + idx + "?action=delete", function() {}, way);
}

org.sarsoft.SearchAssignmentDAO.prototype.saveWaypoints = function(assignment, idx, waypoints) {
	this._doPost("/" + assignment.id + "/way/" + idx + "/waypoints", function() {}, waypoints);
}

org.sarsoft.SearchAssignmentDAO.prototype.createWaysFromGpx = function(handler, id, obj) {
	this._doPost("/" + id + "/way", handler, obj, "format=gpx");
}

org.sarsoft.SearchAssignmentDAO.prototype.createMapConfig = function(id, config, handler) {
	this._doPost("/" + id + "/mapConfig/new", handler ? handler : function() {}, config);
}

org.sarsoft.OperationalPeriodDAO = function(errorHandler, baseURL) {
	if(baseURL == undefined) baseURL = "/rest/operationalperiod";
	this.baseURL = baseURL;
	this.errorHandler = errorHandler;
}

org.sarsoft.OperationalPeriodDAO.prototype = new org.sarsoft.BaseDAO();

org.sarsoft.OperationalPeriodDAO.prototype.loadAssignments = function(handler, periodId) {
	this._doGet("/" + periodId + "/assignment", handler);
}

org.sarsoft.OperationalPeriodDAO.prototype.createAssignmentsFromTFX = function(handler, id, obj) {
	this._doPost("/" + id + "/assignment/tfx", handler, obj);
}

org.sarsoft.view.MapConfigTable = function(handler) {
	var coldefs = [
	  	{ key:"base", sortable: false, resizeable: false},
	  	{ key:"overlay", sortable: false, resizeable: false},
		{ key:"opacity", sortable: false, resizeable: false, formatter: "number"}
	];
	org.sarsoft.view.EntityTable.call(this, coldefs, { caption: "Attached Maps" }, function(mapConfig) {
		handler(mapConfig);
	});
}
org.sarsoft.view.MapConfigTable.prototype = new org.sarsoft.view.EntityTable();

org.sarsoft.view.OperationalPeriodTable = function() {
	var coldefs = [
		{ key : "id", label : "ID"},
		{ key : "description", label : "Description"},
		{ key : "start", label : "Start Time", formatter: "date"},
		{ key : "numAssignments", label : "# of Assignments"},
		{ key : "area", label : "Total Area (km&sup2;)"},
		{ key : "timeAllocated", label : "Team Hours Allocated"}
	];
	org.sarsoft.view.EntityTable.call(this, coldefs, { caption: "Operational Periods" }, function(period) {
		window.location="/app/operationalperiod/" + period.id;
	});
}
org.sarsoft.view.OperationalPeriodTable.prototype = new org.sarsoft.view.EntityTable();

org.sarsoft.view.SearchAssignmentTable = function() {
	var coldefs = [
		{ key : "id", label : "ID", sortable: true, formatter: org.sarsoft.view.getColorFormatter(org.sarsoft.Constants.colorsById) },
		{ key : "resourceType", label : "Resource Type", sortable: true},
		{ key : "status", label : "Status", sortable: true, formatter: org.sarsoft.view.getColorFormatter(org.sarsoft.Constants.colorsByStatus) },
		{ key : "name", label : "Name", sortable: true},
		{ key : "area", label : "Area (km&sup2;)", sortable: true},
		{ key : "timeAllocated", label : "Time Allocated", sortable : true},
		{ key : "responsivePOD", label : "Responsive POD", sortable : true, formatter: org.sarsoft.view.getColorFormatter(org.sarsoft.Constants.colorsByProbability) },
		{ key : "details", label : "Details"}
	];
	org.sarsoft.view.EntityTable.call(this, coldefs, { caption: "Search Assignments" }, function(assignment) {
		window.location="/app/assignment/" + assignment.id;
	});
}
org.sarsoft.view.SearchAssignmentTable.prototype = new org.sarsoft.view.EntityTable();

org.sarsoft.view.WayTable = function(handler, onDelete) {
	var coldefs = [
		{ key : "id", label : "", formatter : function(cell, record, column, data) { cell.innerHTML = "<span style='color: red; font-weight: bold'>X</span>"; cell.onclick=function() {onDelete(record);} }},
		{ key : "id", label : "ID"},
		{ key : "updated", label : "Uploaded", formatter : function(cell, record, column, data) { var date = new Date(1*data); cell.innerHTML = date.toUTCString();}}
	];
	org.sarsoft.view.EntityTable.call(this, coldefs, { caption: "Tracks" }, handler);
}
org.sarsoft.view.WayTable.prototype = new org.sarsoft.view.EntityTable();

org.sarsoft.view.SearchAssignmentForm = function() {
	var fields = [
		{ name : "name", type : "string" },
		{ name : "operationalPeriodId", label: "Operational Period", type: "number"},
		{ name : "resourceType", type : ["GROUND","DOG","MOUNTED","OHV"] },
		{ name : "unresponsivePOD", type : ["LOW","MEDIUM","HIGH","VERY_HIGH"] },
		{ name : "responsivePOD", type : ["LOW","MEDIUM","HIGH","VERY_HIGH"] },
		{ name : "timeAllocated", type : "number" },
		{ name : "details", type : "text" }
	];
	org.sarsoft.view.EntityForm.call(this, fields);
}

org.sarsoft.view.SearchAssignmentForm.prototype = new org.sarsoft.view.EntityForm();

org.sarsoft.view.SearchAssignmentGPXDlg = function(id) {
	var that = this;
	this.id = id;
	var dao = new org.sarsoft.SearchAssignmentDAO();
	var dlg = document.createElement("div");
	dlg.style.position="absolute";
	dlg.style.zIndex="200";
	dlg.style.top="200px";
	dlg.style.left="200px";
	dlg.style.width="420px";
	var hd = document.createElement("div");
	hd.appendChild(document.createTextNode("Upload GPX File"));
	hd.className = "hd";
	dlg.appendChild(hd);
	var bd = document.createElement("div");
	bd.className = "bd";
	bd.innerHTML="<form method='post' enctype='multipart/form-data' name='gpxupload' action='/rest/assignment/" + id + "/way'><input type='file' name='file'/><input type='hidden' name='format' value='gpx'/></form>";
	dlg.appendChild(bd);
	this.dialog = new YAHOO.widget.Dialog(dlg, {zIndex: "200"});
	var buttons = [ { text : "Import", handler: function() {
		that.dialog.hide(); document.forms['gpxupload'].submit();
	}, isDefault: true}, {text : "Cancel", handler : function() { that.dialog.hide(); }}];
	this.dialog.cfg.queueProperty("buttons", buttons);
	this.dialog.render(document.body);
	this.dialog.hide();
}

org.sarsoft.controller.AssignmentPrintMapController = function(container, id) {
	var that = this;
	this.container = container;
	this.fmaps = new Array();
	this.assignmentDAO = new org.sarsoft.SearchAssignmentDAO(function() { that._handleServerError(); });
	this.assignmentDAO.load(function(obj) { that._loadAssignmentCallback(obj); }, id);
}

org.sarsoft.controller.AssignmentPrintMapController.prototype._loadAssignmentCallback = function(assignment) {
	var that = this;
	this.assignment = assignment;
	this.tilesLoaded = 0;

	var config = new Object();
	config.clickable = false;
	config.fill = false;
	config.color = "#FF0000";
	config.opacity = 100;

	for(var i = 0; i < assignment.mapConfigs.length; i++) {
		var mapConfig = assignment.mapConfigs[i];

		var div = document.createElement("div");
		div.style.width="8in";
		div.style.height="10in";
		div.className="page";
		this.container.appendChild(div);
		var map = new org.sarsoft.EnhancedGMap().createMap(div);
		var fmap = new org.sarsoft.FixedGMap(map);
	    GEvent.addListener(map, "tilesloaded", function() {
	        that.tilesLoaded++;
	        if(that.tilesLoaded == that.fmaps.length) {
	        	window.print();
	        }
		});
		this.fmaps.push(fmap);

		var bb = assignment.boundingBox;
		var center = new GLatLng((bb[0].lat + bb[1].lat) / 2, (bb[0].lng + bb[1].lng) / 2);
		fmap.setMapLayers(mapConfig.base, mapConfig.overlay, mapConfig.opacity/100);
		fmap.map.setCenter(center, fmap.map.getBoundsZoomLevel(new GLatLngBounds(new GLatLng(bb[0].lat, bb[0].lng), new GLatLng(bb[1].lat, bb[1].lng))));
	}

	this.assignmentDAO.getWays(function(ways) {
		for(var i = 0; i < ways.length; i++) {
			var way = ways[i];
			way.waypoints = way.zoomAdjustedWaypoints;
			for(j = 0; j < that.fmaps.length; j++) {
				that.fmaps[j].addWay(way, config);
			}
		}
	}, assignment, 10);

}

org.sarsoft.controller.AssignmentViewMapController = function(div, assignment, ways, defaultConfig) {
	var that = this;
	this.div = div;
	this.assignment = assignment;
	this.ways = ways;

	var config = new Object();
	if(defaultConfig == null) defaultConfig = new Object();
	config.clickable = false;
	config.fill = false;
	config.color = (defaultConfig.color == null) ? "#888888" : defaultConfig.color;
	config.opacity = (defaultConfig.opacity == null) ? 100 : defaultConfig.opacity;
	this.baseConfig = config;

	var mapConfig = assignment.mapConfigs[0];

	var map = new org.sarsoft.EnhancedGMap().createMap(this.div);
	this.fmap = new org.sarsoft.FixedGMap(map);

	var bb = assignment.boundingBox;
	var center = new GLatLng((bb[0].lat + bb[1].lat) / 2, (bb[0].lng + bb[1].lng) / 2);
	this.setMapConfig(mapConfig);
	this.fmap.map.setCenter(center, this.fmap.map.getBoundsZoomLevel(new GLatLngBounds(new GLatLng(bb[0].lat, bb[0].lng), new GLatLng(bb[1].lat, bb[1].lng))));

	for(var i = 0; i < this.ways.length; i++) {
		var way = this.ways[i];
		way.waypoints = way.zoomAdjustedWaypoints;
		that.fmap.addWay(way, config);
	}
}

org.sarsoft.controller.AssignmentViewMapController.prototype.setMapConfig = function(mapConfig) {
	if(mapConfig != null) this.fmap.setMapLayers(mapConfig.base, mapConfig.overlay, mapConfig.opacity/100);
}

org.sarsoft.controller.AssignmentViewMapController.prototype.addWay = function(way, config) {
	way.waypoints = way.zoomAdjustedWaypoints;
	this.fmap.addWay(way, config);
}

org.sarsoft.controller.AssignmentViewMapController.prototype.highlight = function(way) {
	if(this.highlighted != null) {
		this.fmap.removeWay(this.highlighted);
		this.addWay(this.highlighted, this.baseConfig);
		this.highlighted = null;
	}

	this.fmap.removeWay(way);
	var config = new Object();
	config.clickable = false;
	config.fill = false;
	config.color = "#FF0000";
	config.opacity = 100;
	this.addWay(way, config);

	var bb = way.boundingBox;
	var center = new GLatLng((bb[0].lat + bb[1].lat) / 2, (bb[0].lng + bb[1].lng) / 2);
	this.fmap.map.setCenter(center, this.fmap.map.getBoundsZoomLevel(new GLatLngBounds(new GLatLng(bb[0].lat, bb[0].lng), new GLatLng(bb[1].lat, bb[1].lng))));

	this.highlighted = way;
}

org.sarsoft.view.OperationalPeriodTFXDlg2 = function(id) {
	var that = this;
	this.id = id;
	var dao = new org.sarsoft.OperationalPeriodDAO();
	var dlg = document.createElement("div");
	dlg.style.position="absolute";
	dlg.style.zIndex="200";
	dlg.style.top="200px";
	dlg.style.left="200px";
	dlg.style.width="420px";
	var hd = document.createElement("div");
	hd.appendChild(document.createTextNode("Upload TFX File"));
	hd.className = "hd";
	dlg.appendChild(hd);
	var bd = document.createElement("div");
	bd.className = "bd";
	dlg.appendChild(bd);
	bd.innerHTML="<form method='post' enctype='multipart/form-data' name='tfxupload' action='/rest/operationalperiod/" + id + "/assignment/tfx'><input type='file' name='file'/></form>";
	this.dialog = new YAHOO.widget.Dialog(dlg, {zIndex: "200"});
	var buttons = [ { text : "Import", handler: function() {
		that.dialog.hide(); document.forms['tfxupload'].submit();
	}, isDefault: true}, {text : "Cancel", handler : function() { that.dialog.hide(); }}];
	this.dialog.cfg.queueProperty("buttons", buttons);
	this.dialog.render(document.body);
	this.dialog.hide();
}

org.sarsoft.view.OperationalPeriodForm = function() {
	var fields = [
		{ name : "id", type : "number" },
		{ name : "description", type: "string"},
	];
	org.sarsoft.view.EntityForm.call(this, fields);
}

org.sarsoft.view.OperationalPeriodForm.prototype = new org.sarsoft.view.EntityForm();

org.sarsoft.view.OperationalPeriodMapSetupDlg = function(handler) {
	var that = this;
	this.handler = handler;
	var fields = [
		{ name: "show", label: "Show", type : ["ALL","GROUND","DOG","MOUNTED","OHV"]},
		{ name : "colorby", label: "Color By", type : ["Disabled","Assignment Number","Resource Type","POD","Assignment Status"] },
		{ name : "fill", label: "Fill Opacity", type: "number"},
		{ name : "opacity", label: "Line Opacity", type : "number"}
	];
	this.pastEntityForm = new org.sarsoft.view.EntityForm(fields);
	this.presentEntityForm = new org.sarsoft.view.EntityForm(fields);
	var dlg = document.createElement("div");
	dlg.style.position="absolute";
	dlg.style.zIndex="200";
	dlg.style.top="200px";
	dlg.style.left="200px";
	dlg.style.width="350px";
	var hd = document.createElement("div");
	hd.appendChild(document.createTextNode("Map Setup"));
	hd.className = "hd";
	dlg.appendChild(hd);
	var bd = document.createElement("div");
	bd.className = "bd";
	dlg.appendChild(bd);
	var past = document.createElement("div");
	past.innerHTML = "<span style='font-weight: bold; text-decoration: underline'>Previous OPs:</span><br/>";
	bd.appendChild(past);
	var present = document.createElement("div");
	present.innerHTML = "<span style='font-weight: bold; text-decoration: underline'>This OP:</span><br/>";
	bd.appendChild(present);
	this.pastEntityForm.create(past);
	this.presentEntityForm.create(present);
	this.dialog = new YAHOO.widget.Dialog(dlg, {zIndex: "200"});
	var buttons = [ { text : "Update", handler: function() {
		that.dialog.hide();
		var obj = new Object();
		obj.past = that.pastEntityForm.read();
		obj.present = that.presentEntityForm.read();
		that.pastEntityForm.write(new Object());
		that.presentEntityForm.write(new Object());
		handler(obj);
	}, isDefault: true}, {text : "Cancel", handler : function() { that.dialog.hide(); }}];
	this.dialog.cfg.queueProperty("buttons", buttons);
	this._rendered = false;
	this.dialog.render(document.body);
	this.dialog.hide();
}

org.sarsoft.view.OperationalPeriodMapSetupDlg.prototype.show = function(obj) {
	if(obj != null) {
		this.pastEntityForm.write(obj.past);
		this.presentEntityForm.write(obj.present);
	}
	this.dialog.show();
}

org.sarsoft.view.PlansTreeView = function(container) {
	var that = this;
	this.periodDAO = new org.sarsoft.OperationalPeriodDAO();
	this.assignmentDAO = new org.sarsoft.SearchAssignmentDAO();

	this.tree = new YAHOO.widget.TreeView(container);
	this.tree.setDynamicLoad(function(node, fnLoadComplete) { that._load(node, fnLoadComplete); });
	var root = this.tree.getRoot();

	this.periodDAO.loadAll(function(periods) {
		for(var i = 0; i < periods.length; i++) {
			var tmp = new YAHOO.widget.TextNode(periods[i].description, root, false);
			tmp.ssType = "period";
			tmp.ssId = periods[i].id;
		}
		that.tree.draw();
	});
}

org.sarsoft.view.PlansTreeView.prototype._load = function(node, fnLoadComplete) {
	var that = this;
	if(node.ssType == "period") {
		this.periodDAO.loadAssignments(function(assignments) {
			for(var i = 0; i < assignments.length; i++) {
				var tmp = new YAHOO.widget.TextNode(assignments[i].name, node, false);
				tmp.ssType = "assignment";
				tmp.ssId = assignments[i].id;
				tmp.isLeaf = true;
			}
			fnLoadComplete();
		}, node.ssId);
	}
}


org.sarsoft.controller.OperationalPeriodMapController = function(emap, operationalperiod) {
	var that = this;
	this.emap = emap;
	this.period = operationalperiod;
	this.configDAO = new org.sarsoft.ConfigDAO(function() { that._handleServerError(); });
	this.propertyDAO = new org.sarsoft.SearchPropertyDAO(function() { that._handleServerError(); });
	this.assignmentDAO = new org.sarsoft.SearchAssignmentDAO(function() { that._handleServerError(); });
	this.periodDAO = new org.sarsoft.OperationalPeriodDAO(function() { that._handleServerError(); });
	this.assignments = new Object();
	this._assignmentAttrs = new Object();
	this.showOtherPeriods = false;
	this._mapsetup = {
		past : { show : "ALL", colorby : "Disabled", fill : 0, opacity : 50 },
		present : { show : "ALL", colorby : "Assignment Number", fill : 35, opacity : 100}
		};

	this.contextMenu = new org.sarsoft.view.ContextMenu();
	this.contextMenu.setItems([
		{text : "New Search Assignment", applicable : function(obj) { return obj == null }, handler : function(data) { that.newAssignmentDlg.point = data.point; that.newAssignmentDlg.show({operationalPeriodId : that.period.id}); }},
		{text : "Map Setup", applicable : function(obj) { return obj == null }, handler : function(data) { that.setupDlg.show(that._mapsetup); }},
		{text : "Make this map background default for search", applicable : function(obj) { return obj == null; }, handler : function(data) { var config = that.emap.getConfig(); that.propertyDAO.save("map_settings", { name: "map_settings", value: YAHOO.lang.JSON.stringify(that.emap.getConfig())})}},
		{text : "Hide Previous Operational Periods", applicable : function(obj) { return obj == null && that.showOtherPeriods; }, handler : function(data) { that.showOtherPeriods = false; that._handleSetupChange(); }},
		{text : "Show Previous Operational Periods", applicable : function(obj) { return obj == null && !that.showOtherPeriods; }, handler : function(data) { that.showOtherPeriods = true; that._handleSetupChange(); }},
		{text : "Return to Operational Period " + operationalperiod.id, applicable : function(obj) { return obj == null; }, handler : function(data) { window.location = "/app/operationalperiod/" + operationalperiod.id; }},
		{text : "Edit Assignment Bounds", applicable : function(obj) { return obj != null && !that.getAssignmentAttr(obj, "inedit") && that.getAssignmentAttr(obj, "clickable") && obj.status == "DRAFT"; }, handler : function(data) { that.edit(data.subject) }},
		{text : "View Assignment Details", applicable : function(obj) { return obj != null && !that.getAssignmentAttr(obj, "inedit") && that.getAssignmentAttr(obj, "clickable"); }, handler : function(data) { window.open('/app/assignment/' + data.subject.id); }},
		{text : "Attach this map to assignment", applicable : function(obj) { return obj != null && !that.getAssignmentAttr(obj, "inedit") && that.getAssignmentAttr(obj, "clickable"); }, handler : function(data) { var config = that.emap.getConfig(); that.assignmentDAO.createMapConfig(data.subject.id, {base: config.base, overlay: config.overlay, opacity: config.opacity*100}); }},
		{text : "Delete Assignment", applicable : function(obj) { return obj != null && !that.getAssignmentAttr(obj, "inedit") && that.getAssignmentAttr(obj, "clickable") && obj.status == "DRAFT"; }, handler : function(data) { that.assignmentDAO.delete(data.subject.id); that.removeAssignment(data.subject); }},
		{text : "Save Changes", applicable : function(obj) { return obj != null && that.getAssignmentAttr(obj, "inedit"); }, handler: function(data) { that.save(data.subject) }},
		{text : "Discard Changes", applicable : function(obj) { return obj != null && that.getAssignmentAttr(obj, "inedit"); }, handler: function(data) { that.discard(data.subject) }}
		]);

	emap.addListener("singlerightclick", function(point, way) {
		that.contextMenu.show(point, that._getAssignmentFromWay(way));
	});

	this.propertyDAO.loadAll(function(configs) {
		for(var i = 0; i < configs.length; i++) {
			if(configs[i].name == "map_settings") {
				var mapConfig = YAHOO.lang.JSON.parse(configs[i].value);
				that.emap.setConfig(mapConfig);
			}
		}
//		var bb = that.period.boundingBox;
//		var center = new GLatLng((bb[0].lat + bb[1].lat) / 2, (bb[0].lng + bb[1].lng) / 2);
//		that.emap.map.setCenter(center, that.emap.map.getBoundsZoomLevel(new GLatLngBounds(new GLatLng(bb[0].lat, bb[0].lng), new GLatLng(bb[1].lat, bb[1].lng))));
	});

	var handler = function(assignment) {
		var mapconfig = that.emap.getConfig();
		assignment.mapConfigs = [{base: mapconfig.base, overlay: mapconfig.overlay, opacity: mapconfig.opacity}];
		var way = { name: assignment.name, polygon: true };
		assignment.ways = [way];
		way.waypoints = that.emap.getNewWaypoints(that.newAssignmentDlg.point, way.polygon);
		that.assignmentDAO.create(function(obj) {
			that.addAssignment(obj);
		}, assignment);
	}

	var setupHandler = function(obj) {
		that._mapsetup = obj;
		that._handleSetupChange();
	}

	this.newAssignmentDlg = new org.sarsoft.view.EntityCreateDialog("Create Assignment", new org.sarsoft.view.SearchAssignmentForm(), handler);
	this.setupDlg = new org.sarsoft.view.OperationalPeriodMapSetupDlg(setupHandler);

	this.assignmentDAO.loadAll(function(assignments) {
		for(var i = 0; i < assignments.length; i++) {
			that.addAssignment(assignments[i]);
		}
	});

	this.assignmentDAO.mark();

}

org.sarsoft.controller.OperationalPeriodMapController._idx = 0;

org.sarsoft.controller.OperationalPeriodMapController.prototype._handleServerError = function() {
	this.emap._infomessage("Server Error");
}

org.sarsoft.controller.OperationalPeriodMapController.prototype._getAssignmentFromWay = function(way) {
	if(way == null) return null;
	for(var key1 in this.assignments) {
		for(var key2 = 0; key2 < this.assignments[key1].ways.length; key2++) {
			if(this.assignments[key1].ways[key2].id == way.id) return this.assignments[key1];
		}
	}
	return null;
}

org.sarsoft.controller.OperationalPeriodMapController.prototype._handleSetupChange = function() {
	for(var id in this.assignments) {
		var assignment = this.assignments[id];
		for(var i = 0; i < assignment.ways.length; i++) {
			this.emap.removeWay(assignment.ways[i]);
		}
		this.addAssignment(assignment);
	}
}

org.sarsoft.controller.OperationalPeriodMapController.prototype.timer = function() {
	var that = this;
	this.assignmentDAO.loadSince(function(assignments) {
		for(var i = 0; i < assignments.length; i++) {
			var attr = that.getAssignmentAttr(assignments[i], "inedit");
			if(attr == null || attr == undefined || attr != true) {
				that.removeAssignment(assignments[i]);
				that.addAssignment(assignments[i]);
			} else {
				throw("Assignment open for edit has been modified on the server");
			}
		}
		that.assignmentDAO.mark();
	});
}

org.sarsoft.controller.OperationalPeriodMapController.prototype.save = function(assignment) {
	for(var i = 0; i < assignment.ways.length; i++) {
		var way = assignment.ways[i];
		way.waypoints = this.emap.save(way.id);
		this.assignmentDAO.saveWaypoints(assignment, i, way.waypoints);
	}
	this.setAssignmentAttr(assignment, "inedit", false);
}

org.sarsoft.controller.OperationalPeriodMapController.prototype.discard = function(assignment) {
	for(var i = 0; i < assignment.ways.length; i++) {
		this.emap.discard(assignment.ways[i].id);
	}
	this.setAssignmentAttr(assignment, "inedit", false);
}

org.sarsoft.controller.OperationalPeriodMapController.prototype.edit = function(assignment) {
	for(var i = 0; i < assignment.ways.length; i++) {
		this.emap.edit(assignment.ways[i].id);
	}
	this.setAssignmentAttr(assignment, "inedit", true);
}

org.sarsoft.controller.OperationalPeriodMapController.prototype.setAssignmentAttr = function(assignment, key, value) {
	if(assignment == null) return null;
	if(this._assignmentAttrs[assignment.id] == undefined) {
		this._assignmentAttrs[assignment.id] = new Object();
	}
	this._assignmentAttrs[assignment.id][key] = value;
}

org.sarsoft.controller.OperationalPeriodMapController.prototype.getAssignmentAttr = function(assignment, key) {
	if(assignment == null) return null;
	if(this._assignmentAttrs[assignment.id] == undefined) return undefined;
	return this._assignmentAttrs[assignment.id][key];
}

org.sarsoft.controller.OperationalPeriodMapController.prototype.removeAssignment = function(assignment) {
	for(var i = 0; i < assignment.ways.length; i++) {
		this.emap.removeWay(assignment.ways[i]);
	}
	delete this.assignments[assignment.id];
}

org.sarsoft.controller.OperationalPeriodMapController.prototype.addAssignment = function(assignment) {
	var that = this;
	this.assignments[assignment.id] = assignment;
	if(assignment.operationalPeriodId <= this.period.id) {
		var config = new Object();
		var setup = this._mapsetup.past;
		config.clickable = false;
		if(assignment.operationalPeriodId == this.period.id) {
			setup = this._mapsetup.present;
			config.clickable = true;
		} else {
			if(!this.showOtherPeriods) return;
		}

		if(setup.show != "ALL" && setup.show != assignment.resourceType) return;

		config.fill = setup.fill;
		config.opacity = setup.opacity;

		if(setup.colorby == "Disabled") {
			config.color ="#000000";
		} else if(setup.colorby == "Assignment Number") {
			config.color = org.sarsoft.Constants.colorsById[assignment.id%org.sarsoft.Constants.colorsById.length];
		} else if(setup.colorby == "Resource Type") {
			config.color = org.sarsoft.Constants.colorsByResourceType[assignment.resourceType];
		} else if(setup.colorby == "POD") {
			config.color = org.sarsoft.Constants.colorsByProbability[assignment.responsivePOD];
		} else if(setup.colorby == "Assignment Status") {
			config.color = org.sarsoft.Constants.colorsByStatus[assignment.status];
		}

		this.setAssignmentAttr(assignment, "clickable", config.clickable);

		if(config.clickable) {
			this._addAssignmentCallback(config, assignment.ways, assignment);
			this.assignmentDAO.getWays(function(obj) { that._refreshAssignmentCallback(config, obj, assignment); }, assignment, 10);
		} else {
			this._addAssignmentCallback(config, assignment.ways, assignment);
		}
	}
}

org.sarsoft.controller.OperationalPeriodMapController.prototype._refreshAssignmentCallback = function(config, ways, assignment) {
	for(var i = 0; i < ways.length; i++) {
		this.emap.removeWay(ways[i]);
	}
	this._addAssignmentCallback(config, ways, assignment);
}

org.sarsoft.controller.OperationalPeriodMapController.prototype._addAssignmentCallback = function(config, ways, assignment) {
	for(var i = 0; i < ways.length; i++) {
		var way = ways[i];
		way.waypoints = way.zoomAdjustedWaypoints;
		way.displayMessage = assignment.id + ": " + assignment.name + "<br/>" + assignment.resourceType + ", " + assignment.status + ", " + assignment.responsivePOD;
		this.emap.addWay(way, config);
	}
}
