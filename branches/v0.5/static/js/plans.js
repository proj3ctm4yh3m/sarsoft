if(typeof org == "undefined") org = new Object();
if(typeof org.sarsoft == "undefined") org.sarsoft = new Object();
if(typeof org.sarsoft.view == "undefined") org.sarsoft.view = new Object();
if(typeof org.sarsoft.controller == "undefined") org.sarsoft.controller = new Object();

org.sarsoft.SearchAssignmentDAO = function(errorHandler, baseURL) {
	if(typeof baseURL == "undefined") baseURL = "/rest/assignment";
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

org.sarsoft.SearchAssignmentDAO.prototype.deleteWaypoint = function(assignment, idx, wpt) {
	this._doPost("/" + assignment.id + "/wpt/" + idx + "?action=delete", function() {}, wpt);
}

org.sarsoft.SearchAssignmentDAO.prototype.createWaysFromGpx = function(handler, id, obj, type) {
	if(type != null) {
		this._doPost("/" + id + "/way", handler, obj, "format=gpx&type="+type);
	} else {
		this._doPost("/" + id + "/way", handler, obj, "format=gpx");
	}
}

org.sarsoft.SearchAssignmentDAO.prototype.createMapConfig = function(id, config, handler) {
	this._doPost("/" + id + "/mapConfig", handler ? handler : function() {}, config);
}

org.sarsoft.SearchAssignmentDAO.prototype.deleteMapConfig = function(id, config, handler) {
	this._doPost("/" + id + "/mapConfig/" + config.id + "?action=delete", handler ? handler : function() {}, config);
}

org.sarsoft.OperationalPeriodDAO = function(errorHandler, baseURL) {
	if(typeof baseURL == "undefined") baseURL = "/rest/operationalperiod";
	this.baseURL = baseURL;
	this.errorHandler = errorHandler;
}

org.sarsoft.OperationalPeriodDAO.prototype = new org.sarsoft.BaseDAO();

org.sarsoft.OperationalPeriodDAO.prototype.loadAssignments = function(handler, periodId) {
	this._doGet("/" + periodId + "/assignment", handler);
}

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
		{ key : "id", label : "Number", sortable: true},
		{ key : "resourceType", label : "Resource Type", sortable: true},
		{ key : "status", label : "Status", sortable: true, formatter: org.sarsoft.view.getColorFormatter(org.sarsoft.Constants.colorsByStatus) },
		{ key : "formattedSize", label : "Size", sortable: true},
		{ key : "timeAllocated", label : "Time Allocated", sortable : true},
		{ key : "responsivePOD", label : "Responsive POD", sortable : true, formatter: org.sarsoft.view.getColorFormatter(org.sarsoft.Constants.colorsByProbability) },
		{ key : "details", label : "Details", formatter : function(cell, record, column, data) { cell.style.overflow="hidden"; cell.style.maxHeight="1em"; cell.style.maxWidth="40em"; cell.innerHTML = data;}}
	];
	org.sarsoft.view.EntityTable.call(this, coldefs, { caption: "Search Assignments" }, function(assignment) {
		window.location="/app/assignment/" + assignment.id;
	});
}
org.sarsoft.view.SearchAssignmentTable.prototype = new org.sarsoft.view.EntityTable();

org.sarsoft.view.WayTable = function(handler, onDelete) {
	var coldefs = [
		{ key : "id", label : "", formatter : function(cell, record, column, data) { cell.innerHTML = "<span style='color: red; font-weight: bold'>X</span>"; cell.onclick=function() {onDelete(record);} }},
		{ key : "name", label : "Name"},
		{ key : "updated", label : "Uploaded", formatter : function(cell, record, column, data) { var date = new Date(1*data); cell.innerHTML = date.toUTCString();}}
	];
	org.sarsoft.view.EntityTable.call(this, coldefs, { caption: "Tracks" }, handler);
}
org.sarsoft.view.WayTable.prototype = new org.sarsoft.view.EntityTable();

org.sarsoft.view.WaypointTable = function(handler, onDelete) {
	var coldefs = [
		{ key : "id", label : "", formatter : function(cell, record, column, data) { cell.innerHTML = "<span style='color: red; font-weight: bold'>X</span>"; cell.onclick=function() {onDelete(record);} }},
		{ key : "name", label : "Name"},
		{ key : "time", label : "Uploaded", formatter : function(cell, record, column, data) { var date = new Date(1*data); cell.innerHTML = date.toUTCString();}}
	];
	org.sarsoft.view.EntityTable.call(this, coldefs, { caption: "Waypoints" }, handler);
}
org.sarsoft.view.WaypointTable.prototype = new org.sarsoft.view.EntityTable();

org.sarsoft.view.SearchAssignmentForm = function() {
	var fields = [
		{ name : "id", label: "Assignment Number", type : "string"},
		{ name : "polygon", label: "Area Assignment?", type: "boolean", value: true},
		{ name : "operationalPeriodId", label: "Operational Period", type: "number"},
		{ name : "resourceType", type : ["GROUND","DOG","MOUNTED","OHV"] },
		{ name : "unresponsivePOD", type : ["LOW","MEDIUM","HIGH"] },
		{ name : "responsivePOD", type : ["LOW","MEDIUM","HIGH"] },
		{ name : "cluePOD", type : ["LOW","MEDIUM","HIGH"]},
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
	dlg.style.zIndex="2500";
	dlg.style.top="200px";
	dlg.style.left="200px";
	dlg.style.width="420px";
	var hd = document.createElement("div");
	hd.appendChild(document.createTextNode("Upload GPX File"));
	hd.className = "hd";
	dlg.appendChild(hd);
	var bd = document.createElement("div");
	bd.className = "bd";
	bd.innerHTML="<form method='post' enctype='multipart/form-data' name='gpxupload' action='/app/assignment/" + id + "/way'><input type='file' name='file'/><input type='hidden' name='format' value='gpx'/></form>";
	dlg.appendChild(bd);
	this.dialog = new YAHOO.widget.Dialog(dlg, {zIndex: "2500", width: "420px"});
	var buttons = [ { text : "Import", handler: function() {
		that.dialog.hide(); document.forms['gpxupload'].submit();
	}, isDefault: true}, {text : "Cancel", handler : function() { that.dialog.hide(); }}];
	this.dialog.cfg.queueProperty("buttons", buttons);
	this.dialog.render(document.body);
	this.dialog.hide();
}

org.sarsoft.controller.AssignmentPrintMapController = function(container, id, mapConfig) {
	var that = this;
	this.container = container;
	this.mapConfig = mapConfig;
	this.assignmentDAO = new org.sarsoft.SearchAssignmentDAO(function() { that._handleServerError(); });
	this.assignmentDAO.load(function(obj) { that._loadAssignmentCallback(obj); }, id);
}

org.sarsoft.controller.AssignmentPrintMapController.prototype._loadAssignmentCallback = function(assignment) {
	var that = this;
	this.assignment = assignment;

	var config = new Object();
	config.clickable = false;
	config.fill = false;
	config.color = "#FF0000";
	config.opacity = 100;
	
	var trackConfig = new Object();
	trackConfig.clickable = false;
	trackConfig.fill = false;
	trackConfig.color = "#FF8800";
	trackConfig.opacity = 100;

	this.div = document.createElement("div");
	this.container.appendChild(this.div);
	var map = new org.sarsoft.EnhancedGMap().createMap(this.div);
	this.fmap = new org.sarsoft.FixedGMap(map);
	var info = document.createElement("div");
	info.style.zIndex=2000;
	info.className="printonly";
	info.style.position="absolute";
	info.style.top="0px";
	info.style.left="0px";
	info.style.backgroundColor="white";
	info.innerHTML = "Assignment " + assignment.id;
	map.getContainer().appendChild(info);
	
	var searchDAO = new org.sarsoft.SearchDAO(function() { that._handleServerError(); });
	searchDAO.load(function(config) {
			try {
				if(that.mapConfig == null) that.mapConfig = YAHOO.lang.JSON.parse(config.value);
				that.fmap.setConfig(that.mapConfig);
			} catch (e) {}
			var bb = that.assignment.boundingBox;
			that.setSize("7in","8.8in");
			that.fmap.map.setCenter(that.fmap.map.getCenter(), that.fmap.map.getBoundsZoomLevel(new GLatLngBounds(new GLatLng(bb[0].lat, bb[0].lng), new GLatLng(bb[1].lat, bb[1].lng))));
	}, "mapConfig");
	
	searchDAO.load(function(lkp) {
		if(lkp.value != null) {
			that.fmap.addWaypoint(lkp.value, {color: "#FF0000"}, "LKP", "LKP");
		}
	}, "lkp");
	searchDAO.load(function(pls) {
		if(pls.value != null) {
			that.fmap.addWaypoint(pls.value, {color: "#FF0000"}, "PLS", "PLS");
		}
	}, "pls");
	searchDAO.load(function(cp) {
		if(cp.value != null) {
			var icon = org.sarsoft.MapUtil.createIcon(15, "/static/images/cp.png");
			that.fmap.addWaypoint(cp.value, {icon: icon}, "CP", "CP");
		}
	}, "cp");

	this.assignmentDAO.getWays(function(ways) {
		for(var i = 0; i < ways.length; i++) {
			var way = ways[i];
			way.waypoints = way.zoomAdjustedWaypoints;
			that.fmap.addWay(way, (way.type == "ROUTE") ? config : trackConfig, (way.type == "ROUTE") ? null : way.name);
		}
	}, assignment, 10);

	for(var i = 0; i < assignment.waypoints.length; i++) {
		var wpt = assignment.waypoints[i];
		that.fmap.addWaypoint(wpt, config, wpt.name, wpt.name);
	}
}

org.sarsoft.controller.AssignmentPrintMapController.prototype.setSize = function(width, height) {
	this.div.style.width=width;
	this.div.style.height=height;
	this.fmap.map.checkResize();
	var bb = this.assignment.boundingBox;
	var center = new GLatLng((bb[0].lat + bb[1].lat) / 2, (bb[0].lng + bb[1].lng) / 2);
	this.fmap.map.setCenter(center);
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


	var map = new org.sarsoft.EnhancedGMap().createMap(this.div);
	this.fmap = new org.sarsoft.FixedGMap(map);

	var bb = assignment.boundingBox;
	var center = new GLatLng((bb[0].lat + bb[1].lat) / 2, (bb[0].lng + bb[1].lng) / 2);

	var searchDAO = new org.sarsoft.SearchDAO(function() { that._handleServerError(); });
	searchDAO.load(function(config) {
		try {
			var mapConfig = YAHOO.lang.JSON.parse(config.value);
			that.fmap.setConfig(mapConfig);
		} catch (e) {}
		that.fmap.map.setCenter(center, that.fmap.map.getBoundsZoomLevel(new GLatLngBounds(new GLatLng(bb[0].lat, bb[0].lng), new GLatLng(bb[1].lat, bb[1].lng))));
	}, "mapConfig");

	for(var i = 0; i < this.ways.length; i++) {
		var way = this.ways[i];
		way.waypoints = way.zoomAdjustedWaypoints;
		that.fmap.addWay(way, config, (way.type == "ROUTE") ? null : way.name);
	}

	for(var i = 0; i < this.assignment.waypoints.length; i++) {
		var waypoint = this.assignment.waypoints[i];
		that.fmap.addWaypoint(waypoint, config, waypoint.name, waypoint.name);
	}
}

org.sarsoft.controller.AssignmentViewMapController.prototype.addWay = function(way, config) {
	way.waypoints = way.zoomAdjustedWaypoints;
	this.fmap.addWay(way, config, (way.type == "ROUTE") ? null : way.name);
}

org.sarsoft.controller.AssignmentViewMapController.prototype.addWaypoint = function(waypoint, config) {
	this.fmap.addWaypoint(waypoint, config, waypoint.name, waypoint.name);
}

org.sarsoft.controller.AssignmentViewMapController.prototype._dehighlight = function() {
	if(this.highlightedWay != null) {
		this.fmap.removeWay(this.highlightedWay);
		this.addWay(this.highlightedWay, this.baseConfig, (this.highlightedWay.type == "ROUTE") ? null : this.highlightedWay.name);
		this.highlightedWay = null;
	}
}

org.sarsoft.controller.AssignmentViewMapController.prototype.highlight = function(way) {
	this._dehighlight();
	this._dehighlightWaypoint();
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

	this.highlightedWay = way;
}

org.sarsoft.controller.AssignmentViewMapController.prototype._dehighlightWaypoint = function() {
	if(this.highlightedWaypoint != null) {
		this.fmap.removeWaypoint(this.highlightedWaypoint);
		this.addWaypoint(this.highlightedWaypoint, this.baseConfig, this.highlightedWaypoint.name, this.highlightedWaypoint.name);
		this.highlightedWaypoint = null;
	}
}

org.sarsoft.controller.AssignmentViewMapController.prototype.highlightWaypoint = function(waypoint) {
	this._dehighlight();
	this._dehighlightWaypoint();
	this.fmap.removeWaypoint(waypoint);
	var config = new Object();
	config.clickable = false;
	config.fill = false;
	config.color = "#FF0000";
	config.opacity = 100;
	this.addWaypoint(waypoint, config);
	this.highlightedWaypoint = waypoint;

	var center = new GLatLng(waypoint.lat, waypoint.lng);
	this.fmap.map.setCenter(center);
}

org.sarsoft.view.OperationalPeriodForm = function() {
	var fields = [
		{ name : "id", type : "number" },
		{ name : "description", type: "string"},
	];
	org.sarsoft.view.EntityForm.call(this, fields);
}

org.sarsoft.view.OperationalPeriodForm.prototype = new org.sarsoft.view.EntityForm();

org.sarsoft.view.OperationalPeriodMapSizeDlg = function(map) {
	var that = this;
	this.map = map;
	var dlg = document.createElement("div");
	dlg.style.position="absolute";
	dlg.style.zIndex="200";
	dlg.style.top="200px";
	dlg.style.left="200px";
	dlg.style.width="350px";
	var hd = document.createElement("div");
	hd.appendChild(document.createTextNode("Map Size"));
	hd.className = "hd";
	dlg.appendChild(hd);
	var bd = document.createElement("div");
	bd.className = "bd";
	dlg.appendChild(bd);
	bd.innerHTML="Width: <input type='text' size='8' name='opmsdwidth' id='opmsdwidth'/>&nbsp;&nbsp;&nbsp;Height: <input type='text' size='8' name='opmsdheight' id='opmsdheight'/>";
	this.dialog = new YAHOO.widget.Dialog(dlg, {zIndex: "2500", width: "350px"});
	var buttons = [ { text : "Update", handler: function() {
		that.dialog.hide();
		var width = document.getElementById('opmsdwidth').value;
		var height = document.getElementById('opmsdheight').value;
		that.map.getContainer().style.width=width;
		that.map.getContainer().style.height=height;
		that.map.checkResize();
	}, isDefault: true}, {text : "Cancel", handler : function() { that.dialog.hide(); }}];
	this.dialog.cfg.queueProperty("buttons", buttons);
	this._rendered = false;
	this.dialog.render(document.body);
	this.dialog.hide();
}

org.sarsoft.view.OperationalPeriodMapSizeDlg.prototype.show = function() {
	document.getElementById('opmsdwidth').value=this.map.getContainer().style.width;
	document.getElementById('opmsdheight').value=this.map.getContainer().style.height;
	this.dialog.show();
}

org.sarsoft.view.OperationalPeriodMapSetupDlg = function(handler) {
	var that = this;
	this.handler = handler;
	var fields = [
		{ name: "show", label: "Show", type : ["ALL ASSIGNMENTS","GROUND","DOG","MOUNTED","OHV"]},
		{ name : "colorby", label: "Color By", type : ["Disabled","Assignment Number","Resource Type","POD","Assignment Status"] },
		{ name : "opacity", label: "Line Opacity (0-100)", type : "number"},
		{ name : "fill", label: "Fill Opacity (0-100)", type: "number"},
		{ name : "showtracks", label: "Show Tracks", type : "boolean"}
	];
	this.pastEntityForm = new org.sarsoft.view.EntityForm(fields);
	this.presentEntityForm = new org.sarsoft.view.EntityForm(fields);
	this.mapForm = new org.sarsoft.view.EntityForm([{name : "rangerings", label: "Range Rings", type: "string"},{name : "labeltw", label: "Label Tracks & Waypoints", type: "boolean"}]);
	var dlg = document.createElement("div");
	dlg.style.position="absolute";
	dlg.style.zIndex="2500";
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
	var present = document.createElement("div");
	present.innerHTML = "<span style='font-weight: bold; text-decoration: underline'>This OP:</span><br/>";
	bd.appendChild(present);
	var past = document.createElement("div");
	past.innerHTML = "<span style='font-weight: bold; text-decoration: underline'>Previous OPs:</span><br/>";
	bd.appendChild(past);
	var map = document.createElement("div");
	map.innerHTML = "<span style='font-weight: bold; text-decoration: underline'>Map:</span><br/>";
	bd.appendChild(map);
	this.pastEntityForm.create(past);
	this.presentEntityForm.create(present);
	this.mapForm.create(map);
	this.dialog = new YAHOO.widget.Dialog(dlg, {zIndex: "2500", width: "350px"});
	var buttons = [ { text : "Update", handler: function() {
		that.dialog.hide();
		var obj = new Object();
		obj.past = that.pastEntityForm.read();
		obj.present = that.presentEntityForm.read();
		obj.map = that.mapForm.read();
		that.pastEntityForm.write(new Object());
		that.presentEntityForm.write(new Object());
		that.mapForm.write(new Object());
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
		this.mapForm.write(obj.map);
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
	this.searchDAO = new org.sarsoft.SearchDAO(function() { that._handleServerError(); });
	this.assignmentDAO = new org.sarsoft.SearchAssignmentDAO(function() { that._handleServerError(); });
	this.resourceDAO = new org.sarsoft.ResourceDAO(function () { that._handleServerError(); });
	this.periodDAO = new org.sarsoft.OperationalPeriodDAO(function() { that._handleServerError(); });
	this.assignments = new Object();
	this.resources = new Object();
	this._assignmentAttrs = new Object();
	this.showOtherPeriods = true;
	this.showLocations = true;
	this._mapsetup = {
		past : { show : "ALL ASSIGNMENTS", colorby : "Disabled", fill : 0, opacity : 50, showtracks : true },
		present : { show : "ALL ASSIGNMENTS", colorby : "Assignment Number", fill : 35, opacity : 100, showtracks : true},
		map : {}
		};

	this.contextMenu = new org.sarsoft.view.ContextMenu();
	this.contextMenu.setItems([
		{text : "New Search Assignment", applicable : function(obj) { return obj == null }, handler : function(data) { that.newAssignmentDlg.point = data.point; that.newAssignmentDlg.original = null; that.newAssignmentDlg.show({operationalPeriodId : that.period.id, polygon: true}); }},
		{text : "Hide Previous Operational Periods", applicable : function(obj) { return obj == null && that.showOtherPeriods; }, handler : function(data) { that.showOtherPeriods = false; that._handleSetupChange(); }},
		{text : "Show Previous Operational Periods", applicable : function(obj) { return obj == null && !that.showOtherPeriods; }, handler : function(data) { that.showOtherPeriods = true; that._handleSetupChange(); }},
		{text : "Hide Locations", applicable : function(obj) { return obj == null && that.showLocations; }, handler : function(data) { that.showLocations = false; that._handleSetupChange(); }},
		{text : "Show Locations", applicable : function(obj) { return obj == null && !that.showLocations; }, handler : function(data) { that.showLocations = true; that._handleSetupChange(); }},
		{text : "Return to Operational Period " + operationalperiod.id, applicable : function(obj) { return obj == null; }, handler : function(data) { window.location = "/app/operationalperiod/" + operationalperiod.id; }},
		{text : "Map Setup", applicable : function(obj) { return obj == null }, handler : function(data) { that.setupDlg.show(that._mapsetup); }},
		{text : "Set LKP here", applicable : function(obj) { return obj == null }, handler: function(data) { that.setLkp(data.point); }},
		{text : "Set PLS here", applicable : function(obj) { return obj == null }, handler: function(data) { that.setPls(data.point); }},
		{text : "Set CP here", applicable : function(obj) { return obj == null }, handler: function(data) { that.setCP(data.point); }},
		{text : "Adjust page size for printing", applicable: function(obj) { return obj == null}, handler : function(data) { that.pageSizeDlg.show(); }},
		{text : "Make this map background default for search", applicable : function(obj) { return obj == null; }, handler : function(data) { var config = that.emap.getConfig(); config.rangerings = that._mapsetup.map.rangerings; that.searchDAO.save("mapConfig", { value: YAHOO.lang.JSON.stringify(config)})}},
		{text : "Edit Assignment Bounds", applicable : function(obj) { return obj != null && !that.getAssignmentAttr(obj, "inedit") && that.getAssignmentAttr(obj, "clickable") && obj.status == "DRAFT"; }, handler : function(data) { that.edit(data.subject) }},
		{text : "View Assignment Details", applicable : function(obj) { return obj != null && !that.getAssignmentAttr(obj, "inedit") && that.getAssignmentAttr(obj, "clickable"); }, handler : function(data) { window.open('/app/assignment/' + data.subject.id); }},
		{text : "Delete Assignment", applicable : function(obj) { return obj != null && !that.getAssignmentAttr(obj, "inedit") && that.getAssignmentAttr(obj, "clickable") && obj.status == "DRAFT"; }, handler : function(data) { that.assignmentDAO.del(data.subject.id); that.removeAssignment(data.subject); }},
		{text : "Clone Assignment", applicable : function(obj) { return obj != null && !that.getAssignmentAttr(obj, "inedit") && that.getAssignmentAttr(obj, "clickable")}, handler : function(data) { that.newAssignmentDlg.point = null; that.newAssignmentDlg.original = data.subject;
			that.newAssignmentDlg.show({operationalPeriodId : that.period.id, polygon: true, resourceType: data.subject.resourceType, unresponsivePOD: data.subject.unresponsivePOD, responsivePOD: data.subject.responsivePOD, cluePOD: data.subject.cluePOD, timeAllocated: data.subject.timeAllocated, details: data.subject.details}); }},
		{text : "Save Changes", applicable : function(obj) { return obj != null && that.getAssignmentAttr(obj, "inedit"); }, handler: function(data) { that.save(data.subject) }},
		{text : "Discard Changes", applicable : function(obj) { return obj != null && that.getAssignmentAttr(obj, "inedit"); }, handler: function(data) { that.discard(data.subject) }}
		]);

	emap.addListener("singlerightclick", function(point, way) {
		that.contextMenu.show(point, that._getAssignmentFromWay(way));
	});

	this.isCenterSet=false;
	this.periodDAO.load(function(period) {
		that.searchDAO.load(function(config) {
				that._mapsetup.map.labeltw = false;
				if(config.value == null) {
					that._mapsetup.map.rangerings = "500,1000,1500";
				} else try {
					var mapConfig = YAHOO.lang.JSON.parse(config.value);
					that._mapsetup.map.rangerings = mapConfig.rangerings;
					that.emap.setConfig(mapConfig);
				} catch (e) {}
				if(that.lkp != null) that.placeLkp(that.lkp);
				var bb = period.boundingBox;
				if(bb.length == 0) {
					that.periodDAO.loadAll(function(periods) {
						for(var i = periods.length; i >= 0; i--) {
							if(periods[i] != null && periods[i].boundingBox.length > 0 && bb.length == 0) {
								bb = periods[i].boundingBox;
								var center = new GLatLng((bb[0].lat + bb[1].lat) / 2, (bb[0].lng + bb[1].lng) / 2);
								that.emap.map.setCenter(center, that.emap.map.getBoundsZoomLevel(new GLatLngBounds(new GLatLng(bb[0].lat, bb[0].lng), new GLatLng(bb[1].lat, bb[1].lng))));
								that.isCenterSet=true;
							}
						}
					});
				} else {
					var center = new GLatLng((bb[0].lat + bb[1].lat) / 2, (bb[0].lng + bb[1].lng) / 2);
					that.emap.map.setCenter(center, that.emap.map.getBoundsZoomLevel(new GLatLngBounds(new GLatLng(bb[0].lat, bb[0].lng), new GLatLng(bb[1].lat, bb[1].lng))));
					that.isCenterSet=true;
				}
		}, "mapConfig");
		that.searchDAO.load(function(config) {
			if(config.value != null) {
				that.lkp = config.value;
				that.placeLkp(config.value);
				if(that.isCenterSet==false) {
					that.emap.map.setCenter(new GLatLng(that.lkp.lat, that.lkp.lng), 14);
				}
				}
		}, "lkp");
		that.searchDAO.load(function(pls) {
			if(pls.value != null) {
				that.pls = pls.value;
				that.placePls(pls.value);
			}
		}, "pls");
		that.searchDAO.load(function(cp) {
			if(cp.value != null) {
				that.cp = cp.value;
				that.placeCP(cp.value);
			}
		}, "cp");
	}, that.period.id);

	var handler = function(assignment) {
		var mapconfig = that.emap.getConfig();
		var way = { name: assignment.name, polygon: assignment.polygon };
		assignment.ways = [way];
		if(that.newAssignmentDlg.point != null) {
			way.waypoints = that.emap.getNewWaypoints(that.newAssignmentDlg.point, way.polygon);
		} else {
			for(var i = 0; i < that.newAssignmentDlg.original.ways.length; i++) {
				var origWay = that.newAssignmentDlg.original.ways[i];
				if(origWay.type == "ROUTE") {
					way.polygon = origWay.polygon;
					way.waypoints = new Array();
					for(var j = 0; j < origWay.zoomAdjustedWaypoints.length; j++) {
						way.waypoints.push({lat: origWay.zoomAdjustedWaypoints[j].lat, lng: origWay.zoomAdjustedWaypoints[j].lng});
					}
				}
			}
		}
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
	this.pageSizeDlg = new org.sarsoft.view.OperationalPeriodMapSizeDlg(this.emap.map);

	this.assignmentDAO.loadAll(function(assignments) {
		for(var i = 0; i < assignments.length; i++) {
			that.addAssignment(assignments[i]);
		}
	});

	this.resourceDAO.loadAll(function(resources) {
		that.refreshResourceData(resources);
	});

	this.assignmentDAO.mark();
	this.resourceDAO.mark();

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
	this.placeLkp(this.lkp);
	this.reprocessResourceData();
}

org.sarsoft.controller.OperationalPeriodMapController.prototype.timer = function() {
	var that = this;
	this.assignmentDAO.loadSince(function(assignments) {
		for(var i = 0; i < assignments.length; i++) {
			var attr = that.getAssignmentAttr(assignments[i], "inedit");
			if(attr == null || typeof attr == "undefined" || attr != true) {
				that.removeAssignment(assignments[i]);
				that.addAssignment(assignments[i]);
			} else {
//				throw("Assignment open for edit has been modified on the server");
			}
		}
		that.assignmentDAO.mark();
	});

	this.resourceDAO.loadSince(function(resources) {
		that.refreshResourceData(resources);
		that.resourceDAO.mark();
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

org.sarsoft.controller.OperationalPeriodMapController.prototype.setLkp = function(lkp) {
	var lkp = this.emap.map.fromContainerPixelToLatLng(new GPoint(lkp.x, lkp.y));
	lkp = {lat: lkp.lat(), lng: lkp.lng()};
	this.searchDAO.save("lkp", { value: lkp});
	lkp.id = "lkp";
	this.placeLkp(lkp);
}

org.sarsoft.controller.OperationalPeriodMapController.prototype.setPls = function(pls) {
	var pls = this.emap.map.fromContainerPixelToLatLng(new GPoint(pls.x, pls.y));
	pls = {lat: pls.lat(), lng: pls.lng()};
	this.searchDAO.save("pls", { value: pls});
	pls.id = "pls";
	this.placePls(pls);
}

org.sarsoft.controller.OperationalPeriodMapController.prototype.setCP = function(cp) {
	var cp = this.emap.map.fromContainerPixelToLatLng(new GPoint(cp.x, cp.y));
	cp = {lat: cp.lat(), lng: cp.lng()};
	this.searchDAO.save("cp", { value: cp});
	cp.id = "cp";
	this.placeCP(cp);
}

org.sarsoft.controller.OperationalPeriodMapController.prototype.placeLkp = function(lkp) {
	if(this.lkp != null) this.emap.removeWaypoint(this.lkp);
	this.lkp = lkp;
	this.emap.addWaypoint(lkp, {color: "#FF0000"}, "LKP", "LKP");
	this.emap.removeRangeRings();
	if(this._mapsetup.map.rangerings != null) {
		var radii = this._mapsetup.map.rangerings.split(",");
		for(var i = 0; i < radii.length; i++) {
			this.emap.addRangeRing(lkp, radii[i], 36);
		}
	}
}

org.sarsoft.controller.OperationalPeriodMapController.prototype.placePls = function(pls) {
	if(this.pls != null) this.emap.removeWaypoint(this.pls);
	this.pls = pls;
	this.emap.addWaypoint(pls, {color: "#FF0000"}, "PLS", "PLS");
}

org.sarsoft.controller.OperationalPeriodMapController.prototype.placeCP = function(cp) {
	if(this.cp != null) this.emap.removeWaypoint(this.cp);
	this.cp = cp;
	var icon = org.sarsoft.MapUtil.createIcon(15, "/static/images/cp.png");
	this.emap.addWaypoint(cp, {icon: icon}, "CP", "CP");
}

org.sarsoft.controller.OperationalPeriodMapController.prototype.setAssignmentAttr = function(assignment, key, value) {
	if(assignment == null) return null;
	if(typeof this._assignmentAttrs[assignment.id] == "undefined") {
		this._assignmentAttrs[assignment.id] = new Object();
	}
	this._assignmentAttrs[assignment.id][key] = value;
}

org.sarsoft.controller.OperationalPeriodMapController.prototype.getAssignmentAttr = function(assignment, key) {
	if(assignment == null) return null;
	if(typeof this._assignmentAttrs[assignment.id] == "undefined") return null;
	return this._assignmentAttrs[assignment.id][key];
}

org.sarsoft.controller.OperationalPeriodMapController.prototype.removeAssignment = function(assignment) {
	for(var i = 0; i < assignment.ways.length; i++) {
		this.emap.removeWay(assignment.ways[i]);
	}
	delete this.assignments[assignment.id];
}

org.sarsoft.controller.OperationalPeriodMapController.prototype.showResource = function(resource) {
	if(resource.assignmentId == null) return;
	var assignment = this.assignments[resource.assignmentId];
	if(assignment != null && assignment.operationalPeriodId == this.period.id) {
		if(this.resources[resource.id] != null) this.emap.removeWaypoint(this.resources[resource.id].position);
		if(resource.position == null) return;
		this.resources[resource.id] = resource;
		if(!this.showLocations) return; // need lines above this in case the user re-enables resources
		var setup = this._mapsetup.present;
		var config = new Object();
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
		var date = new Date(1*resource.position.time);
		var pad2 = function(num) { return (num < 10 ? '0' : '') + num; };
		this.emap.addWaypoint(resource.position, config, resource.assignmentId + "-" + resource.name + " " + pad2(date.getHours()) + ":" + pad2(date.getMinutes()) + ":" + pad2(date.getSeconds()), (this._mapsetup.map.labeltw == true) ? resource.assignmentId + "-" + resource.name : null);
	}
}

org.sarsoft.controller.OperationalPeriodMapController.prototype.refreshResourceData = function(resources) {
	var that = this;

	var timestamp = this.resourceDAO._timestamp;
	for(var i = 0; i < resources.length; i++) {
		this.showResource(resources[i]);
	}

	for(var key in this.resources) {
		var resource = this.resources[key];
		if(timestamp - (1*resource.position.time) > 1800000) {
			this.emap.removeWaypoint(resource.position);
			delete this.resources[key];
		}
	}
}

org.sarsoft.controller.OperationalPeriodMapController.prototype.reprocessResourceData = function() {
	if(!this.showLocations) {
		for(var key in this.resources) {
			this.emap.removeWaypoint(this.resources[key].position);
		}
	} else {
		for(var key in this.resources) {
			this.showResource(this.resources[key]);
		}
	}
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

		if(setup.show != "ALL ASSIGNMENTS" && setup.show != assignment.resourceType) return;

		config.fill = setup.fill;
		config.opacity = setup.opacity;
		config.showtracks = setup.showtracks;

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
	for(var i = 0; i < assignment.waypoints.length; i++) {
		this.emap.removeWaypoint(assignment.waypoints[i]);
	}
	this._addAssignmentCallback(config, ways, assignment);
}

org.sarsoft.controller.OperationalPeriodMapController.prototype._addAssignmentCallback = function(config, ways, assignment) {
	for(var i = 0; i < ways.length; i++) {
		var way = ways[i];
		way.waypoints = way.zoomAdjustedWaypoints;
		way.displayMessage = assignment.id + ": " + assignment.resourceType + ", " + assignment.status;
		var label = null;
		if(this._mapsetup.map.labeltw) label = way.name;
		if(way.type == "ROUTE") label = assignment.id
		if(way.type == "ROUTE" || config.showtracks) this.emap.addWay(way, config, label);
	}
	if(config.clickable) {
		for(var i = 0; i < assignment.waypoints.length; i++) {
			var wpt = assignment.waypoints[i];
			this.emap.addWaypoint(wpt, config, wpt.name, (this._mapsetup.map.labeltw == true) ? wpt.name : null);
		}
	}
}


org.sarsoft.view.BulkGPXDlg = function(id) {
	var that = this;
	this.id = id;
	var dao = new org.sarsoft.OperationalPeriodDAO();
	var dlg = document.createElement("div");
	dlg.style.position="absolute";
	dlg.style.zIndex="1000";
	dlg.style.top="200px";
	dlg.style.left="200px";
	dlg.style.width="420px";
	var hd = document.createElement("div");
	hd.appendChild(document.createTextNode("Upload GPX File"));
	hd.className = "hd";
	dlg.appendChild(hd);
	var bd = document.createElement("div");
	bd.className = "bd";
	dlg.appendChild(bd);
	bd.innerHTML="<form method='post' enctype='multipart/form-data' name='gpxupload' action='/rest/search'><input type='hidden' name'format' value='GPX'/><input type='file' name='file'/></form>";
	this.dialog = new YAHOO.widget.Dialog(dlg, {zIndex: "1000", width: "420px"});
	var buttons = [ { text : "Import", handler: function() {
		that.dialog.hide(); document.forms['gpxupload'].submit();
	}, isDefault: true}, {text : "Cancel", handler : function() { that.dialog.hide(); }}];
	this.dialog.cfg.queueProperty("buttons", buttons);
	this.dialog.render(document.body);
	this.dialog.hide();
}
