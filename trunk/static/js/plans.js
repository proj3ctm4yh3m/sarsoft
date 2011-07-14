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
	this.assignmentDAO = new org.sarsoft.SearchAssignmentDAO(function() { that.controller.message("Server Communication Error"); });
	
	this.div = document.createElement("div");
	this.container.appendChild(this.div);
	var map = new org.sarsoft.EnhancedGMap().createMap(this.div);
	this.fmap = new org.sarsoft.FixedGMap(map);
	this.mapController = new org.sarsoft.MapController(this.fmap);

	var waypointController = new org.sarsoft.controller.SearchWaypointMapController(this.mapController);
	if(mapConfig == null) {
		var configWidget = new org.sarsoft.view.PersistedConfigWidget(this.mapController);
		configWidget.loadConfig();
	} else {
		this.mapController.emap.setConfig(mapConfig);
	}

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
	
	var info = document.createElement("div");
	info.style.zIndex=2000;
	info.className="printonly";
	info.style.position="absolute";
	info.style.top="0px";
	info.style.left="0px";
	info.style.backgroundColor="white";
	info.innerHTML = "Assignment " + assignment.id;
	this.fmap.map.getContainer().appendChild(info);
	
	var bb = this.assignment.boundingBox;
	this.fmap.map.setCenter(that.fmap.map.getCenter(), that.fmap.map.getBoundsZoomLevel(new GLatLngBounds(new GLatLng(bb[0].lat, bb[0].lng), new GLatLng(bb[1].lat, bb[1].lng))));
	this.setSize("7in","8.8in");

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
	this.fmap.map.setCenter(center, this.fmap.map.getBoundsZoomLevel(new GLatLngBounds(new GLatLng(bb[0].lat, bb[0].lng), new GLatLng(bb[1].lat, bb[1].lng))));
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

	this.mapController = new org.sarsoft.MapController(this.fmap);
	var waypointController = new org.sarsoft.controller.SearchWaypointMapController(this.mapController);
	var configWidget = new org.sarsoft.view.PersistedConfigWidget(this.mapController);
	configWidget.loadConfig();

	var bb = assignment.boundingBox;
	var center = new GLatLng((bb[0].lat + bb[1].lat) / 2, (bb[0].lng + bb[1].lng) / 2);

	this.mapController.setCenter(center, map.getBoundsZoomLevel(new GLatLngBounds(new GLatLng(bb[0].lat, bb[0].lng), new GLatLng(bb[1].lat, bb[1].lng))), 100);

	for(var i = 0; i < this.ways.length; i++) {
		var way = this.ways[i];
		way.waypoints = way.zoomAdjustedWaypoints;
		this.fmap.addWay(way, config, (way.type == "ROUTE") ? null : way.name);
	}

	for(var i = 0; i < this.assignment.waypoints.length; i++) {
		var waypoint = this.assignment.waypoints[i];
		this.fmap.addWaypoint(waypoint, config, waypoint.name, waypoint.name);
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

org.sarsoft.view.MapSetupWidget = function(controller) {
	var that = this;
	this.controller = controller;

	this._body = document.createElement("div");
	var style = {position : "absolute", zIndex : "2500", top : "100px", width : "500px"};
	this._dialog = org.sarsoft.view.CreateBlankDialog("Map Setup", this._body, "Update", "Cancel", function() { that.handleSetupChange() }, style);
	
	var setup = document.createElement("img");
	setup.src="/static/images/config.png";
	setup.style.cursor = "pointer";
	setup.style.verticalAlign="middle";
	setup.title = "Map Setup";
	GEvent.addDomListener(setup, "click", function() {
		that.showDlg();
	});
	controller.addMenuItem(setup, 25);

}

org.sarsoft.view.MapSetupWidget.prototype.showDlg = function() {
	var blocks = new Array();
	if(this._container != null) this._body.removeChild(this._container);
	this._container = document.createElement("div");
	this._body.appendChild(this._container);

	for(var key in this.controller.registered) {
		if(this.controller.registered[key].getSetupBlock != null) {
			var block = this.controller.registered[key].getSetupBlock();
			while(blocks[block.order] != null) block.order++;
			blocks[block.order] = block;
		}
	}
	
	for(var i = 0; i < blocks.length; i++) {
		if(blocks[i] != null) {
			this._container.appendChild(blocks[i].node);
		}
	}
	this._dialog.show();
	this.blocks = blocks;
}

org.sarsoft.view.MapSetupWidget.prototype.handleSetupChange = function() {
	for(var i = 0; i < this.blocks.length; i++) {
		if(this.blocks[i] != null) {
			this.blocks[i].handler();
		}
	}
	this.blocks = null;
}

org.sarsoft.view.PersistedConfigWidget = function(controller, persist) {
	var that = this;
	this.controller = controller;
	this.searchDAO = new org.sarsoft.SearchDAO(function() { that.controller.message("Server Communication Error!"); });

	if(persist) {
		var saveDlg = org.sarsoft.view.CreateSimpleDialog("Save Map Background", "This will make the map base and overlay layers, plus the range ring settings, the default for all maps on this search.", "Save", "Cancel", function() {
			that.saveConfig();
		});
		var save = document.createElement("img");
		save.src="/static/images/save.png";
		save.style.cursor = "pointer";
		save.style.verticalAlign="middle";
		save.title = "Make this the default search map (base, overlay and range rings)";
		GEvent.addDomListener(save, "click", function() {
			saveDlg.show();
		});
		
		controller.addMenuItem(save, 34);
	}
}


org.sarsoft.view.PersistedConfigWidget.prototype.saveConfig = function() {
	var that = this;
	this.searchDAO.load(function(config) {
		var config = YAHOO.lang.JSON.parse(config.value);
		that.controller.emap.getConfig(config);
		for(var key in that.controller.registered) {
			var val = that.controller.registered[key];
			if(val != null && val.getConfig != null) {
				val.getConfig(config);
			}
			that.searchDAO.save("mapConfig", { value: YAHOO.lang.JSON.stringify(config)});				
		}
	}, "mapConfig");
}

org.sarsoft.view.PersistedConfigWidget.prototype.loadConfig = function() {
	var that = this;
	this.searchDAO.load(function(config) {
		var config = YAHOO.lang.JSON.parse(config.value);
		that.controller.emap.setConfig(config);
		for(var key in that.controller.registered) {
			var val = that.controller.registered[key];
			if(val != null && val.setConfig != null) {
				val.setConfig(config);
			}
		}
	}, "mapConfig");
}

org.sarsoft.OperationalPeriodMapInfoControl = function(controller) {	
	this.controller = controller;
}

org.sarsoft.OperationalPeriodMapInfoControl.prototype = new GControl();
org.sarsoft.OperationalPeriodMapInfoControl.prototype.printable = function() { return false; }
org.sarsoft.OperationalPeriodMapInfoControl.prototype.selectable = function() { return false; }
org.sarsoft.OperationalPeriodMapInfoControl.prototype.getDefaultPosition = function() { return new GControlPosition(G_ANCHOR_BOTTOM_RIGHT, new GSize(0, 0)); }

org.sarsoft.OperationalPeriodMapInfoControl.prototype.initialize = function(map) {
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

org.sarsoft.OperationalPeriodMapInfoControl.prototype.minmax = function() {
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

org.sarsoft.OperationalPeriodMapInfoControl.prototype.redraw = function() {
	var setup = this.controller._mapsetup;
	var html = "";
	if(setup.rangerings != null && setup.rangerings.length > 0) {
		html += "Range Rings at " + setup.rangerings + "m";
	}
	
	html += " This OP: " + setup.present.show;
	html += " Prev OP: " + setup.past.show;
	this.msg.innerHTML = html;
}

org.sarsoft.controller.SearchWaypointMapController = function(controller) {
	var that = this;
	this.waypoints = new Object();
	this.searchDAO = new org.sarsoft.SearchDAO(function() { that.controller.message("Server Communication Error"); });
	this.controller = controller;
	this.controller.register("org.sarsoft.controller.SearchWaypointMapController", this);
	this.controller.addContextMenuItems([
		{text : "Set LKP here", applicable : function(obj) { return obj == null }, handler: function(data) { that.set("LKP", data.point); }},
		{text : "Set PLS here", applicable : function(obj) { return obj == null }, handler: function(data) { that.set("PLS", data.point); }},
		{text : "Set CP here", applicable : function(obj) { return obj == null }, handler: function(data) { that.set("CP", data.point); }},
		{text : "Delete LKP", applicable : function(obj) { return obj != null && obj == that.waypoints["LKP"]}, handler: function(data) { that.searchDAO.del("lkp"); that.controller.emap.removeWaypoint(that.waypoints["LKP"]); delete that.waypoints["LKP"];}},
		{text : "Delete PLS", applicable : function(obj) { return obj != null && obj == that.waypoints["PLS"]}, handler: function(data) { that.searchDAO.del("pls"); that.controller.emap.removeWaypoint(that.waypoints["PLS"]); delete that.waypoints["PLS"];}},
		{text : "Delete CP", applicable : function(obj) { return obj != null && obj == that.waypoints["CP"]}, handler: function(data) { that.searchDAO.del("cp"); that.controller.emap.removeWaypoint(that.waypoints["CP"]); delete that.waypoints["CP"];}}
	]);
	this.rangerings = "500,1000,1500";

	this.searchDAO.load(function(lkp) {
			if(lkp.value != null) {
				that.place("LKP", lkp.value);
				that.controller.setCenter(new GLatLng(lkp.value.lat, lkp.value.lng), 14, 3);
			}
		}, "lkp");
	that.searchDAO.load(function(pls) {
		if(pls.value != null) {
			that.place("PLS", pls.value);
			that.controller.setCenter(new GLatLng(pls.value.lat, pls.value.lng), 14, 2);
		}
	}, "pls");
	that.searchDAO.load(function(cp) {
		if(cp.value != null) {
			that.place("CP", cp.value);
			that.controller.setCenter(new GLatLng(cp.value.lat, cp.value.lng), 14, 1);
		}
	}, "cp");

}

org.sarsoft.controller.SearchWaypointMapController.prototype.setConfig = function(config) {
	if(config.SearchWaypointMapController == null) return;
	this.rangerings = config.SearchWaypointMapController.rangerings;
	if(this.waypoints["LKP"] != null) this.place("LKP", this.waypoints["LKP"]);
}

org.sarsoft.controller.SearchWaypointMapController.prototype.getConfig = function(config) {
	if(config == null) config = new Object();
	if(config.SearchWaypointMapController == null) config.SearchWaypointMapController = new Object();
	config.SearchWaypointMapController.rangerings = this.rangerings;
	return config;
}

org.sarsoft.controller.SearchWaypointMapController.prototype.set = function(type, point) {
	var wpt = this.controller.emap.map.fromContainerPixelToLatLng(new GPoint(point.x, point.y));
	wpt = {lat: wpt.lat(), lng: wpt.lng()};
	this.searchDAO.save(type.toLowerCase(), { value: wpt });
	wpt.id = type;
	this.place(type, wpt);
}

org.sarsoft.controller.SearchWaypointMapController.prototype.place = function(type, wpt) {
	if(this.waypoints[type] != null) this.controller.emap.removeWaypoint(this.waypoints[type]);
	this.waypoints[type] = wpt;
	if(type == "CP") {
		var icon = org.sarsoft.MapUtil.createIcon(15, "/static/images/cp.png");
		this.controller.emap.addWaypoint(wpt, {icon: icon}, type, type);
	} else {
		this.controller.emap.addWaypoint(wpt, {color: "#FF0000"}, type, type);
	}
	if(type == "LKP") {
		this.controller.emap.removeRangeRings();
		if(this.rangerings != null) {
			var radii = this.rangerings.split(",");
			for(var i = 0; i < radii.length; i++) {
				this.controller.emap.addRangeRing(wpt, radii[i], 36);
			}
		}
	}
}

org.sarsoft.controller.SearchWaypointMapController.prototype.getSetupBlock = function() {
	var that = this;
	if(this._mapForm == null) {
		this._mapForm = new org.sarsoft.view.EntityForm([{name : "rangerings", label: "Range Rings", type: "string"}]);
		var node = document.createElement("div");
		this._mapForm.create(node);
		this._setupBlock = {order : 5, node : node, handler : function() {
			var obj = that._mapForm.read();
			that.rangerings = obj.rangerings;
			if(that.waypoints["LKP"] != null) that.place("LKP", that.waypoints["LKP"]);
		}};
	}

	this._mapForm.write({rangerings : this.rangerings});
	return this._setupBlock;
}


org.sarsoft.controller.OperationalPeriodMapController = function(emap, operationalperiod, controller) {
	var that = this;
	this.emap = emap;
	this.period = operationalperiod;
	this.controller = controller;
	this.controller.register("org.sarsoft.controller.OperationalPeriodMapController", this);
	this.mapInfoControl = new org.sarsoft.OperationalPeriodMapInfoControl(this);
	this.emap.map.addControl(this.mapInfoControl);
	this.searchDAO = new org.sarsoft.SearchDAO(function() { that.controller.message("Server Communication Error"); });
	this.assignmentDAO = new org.sarsoft.SearchAssignmentDAO(function() { that.controller.message("Server Communication Error"); });
	this.periodDAO = new org.sarsoft.OperationalPeriodDAO(function() { that.controller.message("Server Communication Error"); });
	this.assignments = new Object();
	this._assignmentAttrs = new Object();
	this.showOtherPeriods = true;
	this._mapsetup = {
		past : { show : "ALL ASSIGNMENTS", colorby : "Disabled", fill : 0, opacity : 50},
		present : { show : "ALL ASSIGNMENTS", colorby : "Assignment Number", fill : 35, opacity : 100},
		showtracks : true,
		showlabels : true
		};

	this.controller.addContextMenuItems([
		{text : "New Search Assignment", applicable : function(obj) { return obj == null }, handler : function(data) { that.newAssignmentDlg.point = data.point; that.newAssignmentDlg.original = null; that.newAssignmentDlg.show({operationalPeriodId : that.period.id, polygon: true}); }},
		{text : "Edit Assignment Bounds", applicable : function(obj) { var assignment = that._getAssignmentFromWay(obj); return assignment != null && !that.getAssignmentAttr(assignment, "inedit") && that.getAssignmentAttr(assignment, "clickable") && assignment.status == "DRAFT"; }, handler : function(data) { that.edit(that._getAssignmentFromWay(data.subject)) }},
		{text : "View Assignment Details", applicable : function(obj) { var assignment = that._getAssignmentFromWay(obj); return assignment != null && !that.getAssignmentAttr(assignment, "inedit") && that.getAssignmentAttr(assignment, "clickable"); }, handler : function(data) { window.open('/app/assignment/' + that._getAssignmentFromWay(data.subject).id); }},
		{text : "Delete Assignment", applicable : function(obj) { var assignment = that._getAssignmentFromWay(obj); return assignment != null && !that.getAssignmentAttr(assignment, "inedit") && that.getAssignmentAttr(assignment, "clickable") && assignment.status == "DRAFT"; }, handler : function(data) { var assignment = that._getAssignmentFromWay(data.subject); that.assignmentDAO.del(assignment.id); that.removeAssignment(assignment); }},
		{text : "Clone Assignment", applicable : function(obj) { var assignment = that._getAssignmentFromWay(obj); return assignment != null && !that.getAssignmentAttr(assignment, "inedit") && that.getAssignmentAttr(assignment, "clickable")}, handler : function(data) { var assignment = that._getAssignmentFromWay(data.subject); that.newAssignmentDlg.point = null; that.newAssignmentDlg.original = assignment;
			that.newAssignmentDlg.show({operationalPeriodId : that.period.id, polygon: true, resourceType: assignment.resourceType, unresponsivePOD: assignment.unresponsivePOD, responsivePOD: assignment.responsivePOD, cluePOD: assignment.cluePOD, timeAllocated: assignment.timeAllocated, details: assignment.details}); }},
		{text : "Save Changes", applicable : function(obj) { var assignment = that._getAssignmentFromWay(obj); return assignment != null && that.getAssignmentAttr(assignment, "inedit"); }, handler: function(data) { that.save(that._getAssignmentFromWay(data.subject)) }},
		{text : "Discard Changes", applicable : function(obj) { var assignment = that._getAssignmentFromWay(obj); return assignment != null && that.getAssignmentAttr(assignment, "inedit"); }, handler: function(data) { that.discard(that._getAssignmentFromWay(data.subject)) }}
		]);
	
	var leaveDlg = org.sarsoft.view.CreateSimpleDialog("Leave Map View", "Leave the map view and return to the page for Operational Period " + this.period.id + "?", "Leave", "Cancel", function() {
		window.location = "/app/operationalperiod/" + that.period.id;		
	});
	var goback = document.createElement("img");
	goback.src="/static/images/home.png";
	goback.style.cursor = "pointer";
	goback.style.verticalAlign="middle";
	goback.title = "Back to operational period " + this.period.id;
	GEvent.addDomListener(goback, "click", function() {
		leaveDlg.show();
	});
	this.controller.addMenuItem(goback, 40);
	
	var showTracks = document.createElement("span");
	showTracks.innerHTML="TRK";
	showTracks.style.cursor = "pointer";
	showTracks.title = "Show/Hide tracks and waypoints";
	GEvent.addDomListener(showTracks, "click", function() {
		that._mapsetup.showtracks = !that._mapsetup.showtracks;
		that.handleSetupChange();
	});
	this.controller.addMenuItem(showTracks, 15);
	this.showTracks = showTracks;

	var showLabels = document.createElement("span");
	showLabels.innerHTML="LBL";
	showLabels.style.cursor = "pointer";
	showLabels.title = "Show/Hide assignment labels";
	GEvent.addDomListener(showLabels, "click", function() {
		that._mapsetup.showlabels = !that._mapsetup.showlabels;
		that.handleSetupChange();
	});
	this.controller.addMenuItem(showLabels, 17);
	this.showLabels = showLabels;

	this.periodDAO.load(function(period) {
			var bb = period.boundingBox;
			if(bb.length == 0) {
				that.periodDAO.loadAll(function(periods) {
					for(var i = periods.length; i >= 0; i--) {
						if(periods[i] != null && periods[i].boundingBox.length > 0 && bb.length == 0) {
							bb = periods[i].boundingBox;
							var center = new GLatLng((bb[0].lat + bb[1].lat) / 2, (bb[0].lng + bb[1].lng) / 2);
							that.controller.setCenter(center, that.emap.map.getBoundsZoomLevel(new GLatLngBounds(new GLatLng(bb[0].lat, bb[0].lng), new GLatLng(bb[1].lat, bb[1].lng))), 1);
						}
					}
				});
			} else {
				var center = new GLatLng((bb[0].lat + bb[1].lat) / 2, (bb[0].lng + bb[1].lng) / 2);
				that.controller.setCenter(center, that.emap.map.getBoundsZoomLevel(new GLatLngBounds(new GLatLng(bb[0].lat, bb[0].lng), new GLatLng(bb[1].lat, bb[1].lng))), 20);
			}
	}, that.period.id);

	this.newAssignmentDlg = new org.sarsoft.view.EntityCreateDialog("Create Assignment", new org.sarsoft.view.SearchAssignmentForm(), function(assignment) {
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
	});

	this.assignmentDAO.loadAll(function(assignments) {
		for(var i = 0; i < assignments.length; i++) {
			that.addAssignment(assignments[i]);
		}
	});

	this.assignmentDAO.mark();

	this.controller.message("Operational Period " + this.period.id + ".  Right click to create/edit assignments.", 30000);

}

org.sarsoft.controller.OperationalPeriodMapController._idx = 0;

org.sarsoft.controller.OperationalPeriodMapController.prototype.setConfig = function(config) {
	if(config.OperationalPeriodMapController == null) return;
	this._mapsetup.showtracks = config.OperationalPeriodMapController.showtracks;
	this._mapsetup.showlabels = config.OperationalPeriodMapController.showlabels;
	this.handleSetupChange();
}

org.sarsoft.controller.OperationalPeriodMapController.prototype.getConfig = function(config) {
	if(config == null) config = new Object();
	if(config.OperationalPeriodMapController == null) config.OperationalPeriodMapController = new Object();
	config.OperationalPeriodMapController.showtracks = this._mapsetup.showtracks;
	config.OperationalPeriodMapController.showlabels = this._mapsetup.showlabels;
	return config;
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

org.sarsoft.controller.OperationalPeriodMapController.prototype.handleSetupChange = function() {
	if(this._mapsetup.showtracks) {
		this.showTracks.innerHTML = "TRK";
	} else {
		this.showTracks.innerHTML = "<span style='text-decoration: line-through'>TRK</span>";		
	}
	if(this._mapsetup.showlabels) {
		this.showLabels.innerHTML = "LBL";
	} else {
		this.showLabels.innerHTML = "<span style='text-decoration: line-through'>LBL</span>";
	}
	

	for(var id in this.assignments) {
		var assignment = this.assignments[id];
		for(var i = 0; i < assignment.ways.length; i++) {
			this.emap.removeWay(assignment.ways[i]);
		}
		this.addAssignment(assignment);
	}
//	this.placeLkp(this.lkp);
//	this.reprocessResourceData();
	this.mapInfoControl.redraw();
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

org.sarsoft.controller.OperationalPeriodMapController.prototype.getColorForAssignmentId = function(id) {
	var assignment = this.assignments[id];
	if(assignment == null) return "#000000";
	var setup = (assignment.operationalPeriodId == this.period.id) ? this._mapsetup.present : this._mapsetup.past;
	
	if(setup.colorby == "Disabled") {
		return "#000000";
	} else if(setup.colorby == "Assignment Number") {
		return org.sarsoft.Constants.colorsById[assignment.id%org.sarsoft.Constants.colorsById.length];
	} else if(setup.colorby == "Resource Type") {
		return org.sarsoft.Constants.colorsByResourceType[assignment.resourceType];
	} else if(setup.colorby == "POD") {
		return org.sarsoft.Constants.colorsByProbability[assignment.responsivePOD];
	} else if(setup.colorby == "Assignment Status") {
		return org.sarsoft.Constants.colorsByStatus[assignment.status];
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

		config.color = this.getColorForAssignmentId(assignment.id);
		config.fill = setup.fill;
		config.opacity = setup.opacity;
		config.showtracks = this._mapsetup.showtracks;

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
		way.displayMessage = "Assignment " + assignment.id + ": " + assignment.status + " " + assignment.formattedSize + " " + assignment.timeAllocated + "hr " + assignment.resourceType + ".  <a href='/app/assignment/" + assignment.id + "' target='_new'>Details</a>";
		var label = null;
		if(this._mapsetup.showlabels) label = way.name;
		if(way.type == "ROUTE") label = assignment.id
		if(way.type == "ROUTE" || config.showtracks) this.emap.addWay(way, config, label);
	}
	if(config.clickable) {
		for(var i = 0; i < assignment.waypoints.length; i++) {
			var wpt = assignment.waypoints[i];
			this.emap.addWaypoint(wpt, config, wpt.name, (this._mapsetup.showlabels == true) ? wpt.name : null);
		}
	}
}

org.sarsoft.controller.OperationalPeriodMapController.prototype.getSetupBlock = function() {
	var that = this;
	if(this._setupForm1 == null) {
		this._setupForm1 = new org.sarsoft.view.EntityForm([
       		{ name: "show", label: "Show", type : ["ALL ASSIGNMENTS","GROUND","DOG","MOUNTED","OHV"]},
       		{ name : "colorby", label: "Color By", type : ["Disabled","Assignment Number","Resource Type","POD","Assignment Status"] },
       		{ name : "opacity", label: "Line Opacity (0-100)", type : "number"},
       		{ name : "fill", label: "Fill Opacity (0-100)", type: "number"}
       	]);
		this._setupForm2 = new org.sarsoft.view.EntityForm([
	   		{ name: "show", label: "Show", type : ["ALL ASSIGNMENTS","NONE","GROUND","DOG","MOUNTED","OHV"]},
	   		{ name : "colorby", label: "Color By", type : ["Disabled","Assignment Number","Resource Type","POD","Assignment Status"] },
	   		{ name : "opacity", label: "Line Opacity (0-100)", type : "number"},
	   		{ name : "fill", label: "Fill Opacity (0-100)", type: "number"}
	   	]);
		var node = document.createElement("div");
       	node.style.width="100%";
       	var present = document.createElement("div");
       	present.style.width="240px";
       	present.style.float="left";
       	present.innerHTML = "<span style='font-weight: bold; text-decoration: underline'>This OP:</span><br/>";
       	node.appendChild(present);
       	var past = document.createElement("div");
       	past.style.width="240px";
       	past.style.float="right";
       	past.innerHTML = "<span style='font-weight: bold; text-decoration: underline'>Previous OPs:</span><br/>";
       	node.appendChild(past);
		
		this._setupForm1.create(present);
		this._setupForm2.create(past);
		this._setupBlock = {order : 1, node : node, handler : function() {
			that._mapsetup.present = that._setupForm1.read();
			that._mapsetup.past = that._setupForm2.read();
			that.handleSetupChange();
		}};
	}

	this._setupForm1.write(this._mapsetup.present);
	this._setupForm2.write(this._mapsetup.past);
	return this._setupBlock;
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

