org.sarsoft.OperationalPeriodDAO = function() {
	org.sarsoft.MapObjectDAO.call(this, "OperationalPeriod");
	this.baseURL = "/rest/op";
}

org.sarsoft.OperationalPeriodDAO.prototype = new org.sarsoft.MapObjectDAO();

org.sarsoft.OperationalPeriodDAO.prototype.unlink = function(period) {
	var dao = org.sarsoft.MapState.daos["Assignment"];
	for(i = 0; i < dao.objs.length; i++) {
		if(dao.objs[i] && dao.objs[i].operationalPeriodId == period.id) dao.objs[i].operationalPeriodId = null;
	}
}

org.sarsoft.OperationalPeriodController = function(imap, background_load) {
	var that = this;
	imap.register("org.sarsoft.OperationalPeriodController", this);
	org.sarsoft.MapObjectController.call(this, imap, {name: "OperationalPeriod", dao: org.sarsoft.OperationalPeriodDAO, label: "Operational Periods"})
	
	if(org.sarsoft.writeable && !background_load) {
		this.buildAddButton(0, "Operational Period", function(point) {
			that.periodDlg.show({create: true}, point);
		});

		var form = new org.sarsoft.view.EntityForm([{ name : "description", label: "Name", type : "string"}]);
		
		this.periodDlg = new org.sarsoft.view.MapEntityDialog(imap, "Operational Period", form, function(period) {
			period.id = that.periodDlg.id;
			that.periodDlg.id = null;
			if(period.id == null) {
				that.dao.create(period);
			} else {
				that.dao.dave(period.id, period);
			}
		});
	}
}

org.sarsoft.OperationalPeriodController.prototype = new org.sarsoft.MapObjectController();

org.sarsoft.OperationalPeriodController.prototype.show = function(object) {
	var that = this;
	org.sarsoft.MapObjectController.prototype.show.call(this, object);
	
	var line = this.dn.add(object.id, object.description, function() {});
	line.prepend('<div></div>');
	
	if(org.sarsoft.writeable) {
		this.dn.addIconEdit(object.id, function() {
			that.periodDlg.show(object);
			that.periodDlg.id = object.id;
		});
		this.dn.addIconDelete(object.id, function() {
			that.del(function() { that.dao.del(object.id); });
		});
	}
	
	// TODO configuration icon
}

org.sarsoft.OperationalPeriodController.prototype.visible = function(id) {
	return true;
}

org.sarsoft.OperationalPeriodController.prototype.active = function(id) {
	return id > 0;
}

org.sarsoft.AssignmentDAO = function() {
	org.sarsoft.WayObjectDAO.call(this, "Assignment", "/rest/assignment");
	this.label = "number";
}

org.sarsoft.AssignmentDAO.prototype = new org.sarsoft.WayObjectDAO();

org.sarsoft.AssignmentDAO.prototype.validate = function(obj) {
	obj = org.sarsoft.WayObjectDAO.prototype.validate.call(this, obj);
	if(obj.route.boundingBox == null) this.addBoundingBox(obj.route);
	return obj;
}

org.sarsoft.AssignmentDAO.prototype.unlink = function(assignment) {
	var dao = org.sarsoft.MapState.daos["Clue"];
	for(i = 0; i < dao.objs.length; i++) {
		if(dao.objs[i] && dao.objs[i].assignmentId == assignment.id) dao.objs[i].assignmentId = null;
	}
}

org.sarsoft.AssignmentDAO.prototype.saveRoute = function(assignment, waypoints, handler) {
	var that = this;
	if(this.offline) {
		org.sarsoft.async(function() {
			var way = that.getObj(assignment.id).route;
			way.waypoints = waypoints;
			that.addBoundingBox(way);
			if(handler != null) handler(way);
		});
	} else {
		this._doPost("/" + assignment.id + "/route", function(way) {
			that.getObj(assignment.id).route = way;
			if(handler != null) handler(way);
		}, waypoints);
		
	}
}

org.sarsoft.AssignmentForm = function() {
}

org.sarsoft.AssignmentForm.prototype.create = function(container) {
	var that = this;
	var row = jQuery('<tr></tr>').appendTo(jQuery('<tbody></tbody>').appendTo(jQuery('<table style="border: 0"></table>').appendTo(container)));
	var left = $('<td width="50%" valign="top"></td>').appendTo(row);
	var right = jQuery('<td width="50%" valign="top" style="padding-left: 20px"></td>').appendTo(row);
	
	var build = function(input, label) {
		input = $(input);
		$('<div class="item"><span class="label">' + label + '</span></div>').appendTo(left).append($('<div style="float: left"></div>').append(input));
		return input;
	}

	this.fields = new Object();
	this.fields.number = build('<input type="text"/>', 'Assignment Number');
	this.fields.operationalPeriodId = build('<select></select>', 'Operational Period');
	this.fields.resourceType = build('<select><option>GROUND</option><option>DOG</option><option>MOUNTED</option><option>OHV</option></select>', 'Resource Type');
	this.fields.unresponsivePOD = build('<select><option>LOW</option><option>MEDIUM</option><option>HIGH</option></select>', 'Unresponsive POD');
	this.fields.responsivePOD = build('<select><option>LOW</option><option>MEDIUM</option><option>HIGH</option></select>', 'Responsive POD');
	this.fields.cluePOD = build('<select><option>LOW</option><option>MEDIUM</option><option>HIGH</option></select>', 'Clue POD');
	this.fields.timeAllocated = build('<input type="text"/>', 'Time Allocated');

	this.fields.details = $('<textarea></textarea').appendTo($('<div>details</div>').appendTo(right));
}

org.sarsoft.AssignmentForm.prototype.read = function() {
	var obj = {}
	for(var key in this.fields) {
		obj[key] = this.fields[key].val();
	}
	return obj;
}

org.sarsoft.AssignmentForm.prototype.write = function(obj) {
	this.fields.operationalPeriodId.empty();
	var periods = org.sarsoft.MapState.daos["OperationalPeriod"].objs;
	for(var i = 0; i < periods.length; i++) {
		if(periods[i] != null) this.fields.operationalPeriodId.append('<option value="' + i + '">' + periods[i].description + '</option>');
	}
	for(var key in this.fields) {
		this.fields[key].val(obj[key]);
	}
}

org.sarsoft.AssignmentMapDialog = function(imap, controller) {
	this.body = $('<div></div>');
	var that = this;
	
	this.tabs = {
			action: $('<div></div>'),
			tracks: $('<div></div>'),
			clues: $('<div></div>')
	}
	
	this.tabview = new YAHOO.widget.TabView();
	this.tabview.addTab(new YAHOO.widget.Tab({label: 'Actions', contentEl: this.tabs.action[0]}))
	this.tabview.addTab(new YAHOO.widget.Tab({label: 'Tracks', contentEl: this.tabs.tracks[0]}));
	this.tabview.addTab(new YAHOO.widget.Tab({label: 'Clues', contentEl: this.tabs.clues[0]}));
	this.tabview.appendTo(this.body[0]);
	
	this.imp = new Object();
	this.imp.importer = new org.sarsoft.widget.Importer($('<div></div>').appendTo(this.tabs.clues), '/rest/in?tid=' + (sarsoft.tenant ? sarsoft.tenant.name : ''));
	$(this.imp.importer).bind('success', function() { that.dialog.hide(); })
	
    this.cluetable = new org.sarsoft.ClueTable(function(clue) {
    	imap.map.setCenter(new google.maps.LatLng(clue.position.lat, clue.position.lng));
    });
    this.cluetable.create(this.tabs.clues[0]);
	this.cluetable.table.showTableMessage('<i>No Clues Attached</i>');
	this.dialog = new org.sarsoft.view.MapDialog(imap, "Search Assignment", this.body, null, "OK", function() {});
}

org.sarsoft.AssignmentMapDialog.prototype.show = function(id) {
	this.imp.importer.clear();
	this.cluetable.clear();
	var dao = org.sarsoft.MapState.daos["Clue"];
	for(i = 0; i < dao.objs.length; i++) {
		if(dao.objs[i] && dao.objs[i].assignmentId == id) this.cluetable.table.addRow(dao.objs[i]);
	}
	this.dialog.show();
}

org.sarsoft.AssignmentController = function(imap, background_load) {
	var that = this;
	this.opcontroller = imap.registered["org.sarsoft.OperationalPeriodController"]; 

	org.sarsoft.WayObjectController.call(this, imap, {name: "Assignment", dao: org.sarsoft.AssignmentDAO, label: "Assignments", geo: true, way : "route"})
	
	if(org.sarsoft.writeable && !background_load) {
		this.buildAddButton(0, "Line Assignment", function(point) {
			that.assignmentDlg.show({create: true, operationalPeriodId: 1, route: {polygon: false}}, point);
		});

		this.buildAddButton(0, "Area Assignment", function(point) {
			that.assignmentDlg.show({create: true, operationalPeriodId: 1, route: {polygon: true}}, point);
		});
		
		
		this.relatedDlg = new org.sarsoft.AssignmentMapDialog(imap);
		
		var form = new org.sarsoft.AssignmentForm();

		this.assignmentDlg = new org.sarsoft.view.MapObjectEntityDialog(imap, "Assignment Details", form);
		
		this.assignmentDlg.discardGeoInfo = function() { that.discard(this.object); }
		this.assignmentDlg.saveGeoInfo = function(assignment, callback) { that.save(this.object.id, callback); }
		this.assignmentDlg.saveData = function(assignment) {
			that.dao.save(this.object.id, assignment);
		}
		this.assignmentDlg.create = function(assignment) {
			assignment.route = {type: "ROUTE", polygon: this.object.route.polygon};
			assignment.route.waypoints = that.imap.getNewWaypoints(this.point, this.object.route.polygon);
			that.dao.create(assignment, function(obj) {
				that.redraw(obj, function() { that.save(obj, function() { that.show(obj);}); }, function() { that.dao.del(obj.id); });
			});
		}

		this.pg = new org.sarsoft.view.ProfileGraph();
		this.profileDlg = new org.sarsoft.view.MapDialog(imap, "Elevation Profile", this.pg.div, "OK", null, function() { that.pg.hide(); });
		this.profileDlg.dialog.hideEvent.subscribe(function() { that.pg.hide(); });
		
		var pc = function(obj) {
			if(obj == null) return {}
			var assignment = that.dao.getObj(that.getObjectIdFromWay(obj));
			var inedit = (assignment != null && that.attr(assignment, "inedit"));
			var clickable = (assignment != null && !inedit && that.attr(assignment, "clickable"));
			return { assignment: assignment, inedit: inedit, clickable: clickable}
		}
		
		this.imap.addContextMenuItems([
		    { text: "New Assignment", applicable: function(obj) { return obj == null && that.dn.visible}, handler: function(data) { that.assignmentDlg.show({create: true, operationalPeriodId: 1, polygon: true}, data.point)}},
		    { text: "Drag Vertices", precheck: pc, applicable: function(obj) { return obj.clickable }, handler: function(data) { that.edit(data.pc.assignment)}},
    		{text : "Save Changes", precheck: pc, applicable : function(obj) { return obj.inedit && !that.assignmentDlg.live; }, handler: function(data) { that.save(data.pc.assignment) }},
    		{text : "Discard Changes", precheck: pc, applicable : function(obj) { return obj.inedit && !that.assignmentDlg.live }, handler: function(data) { that.discard(data.pc.assignment) }},
    		{text : "Delete Assignment", precheck: pc, applicable : function(obj) { return obj.assignment != null && !obj.inedit }, handler: function(data) { that.del(function() { that.dao.del(data.pc.assignment.id);});}}
		    ]);
	}
	
}

org.sarsoft.AssignmentController.prototype = new org.sarsoft.WayObjectController();

org.sarsoft.AssignmentController.prototype._saveWay = function(obj, waypoints, handler) {
	this.dao.saveRoute(obj, waypoints, handler)
}

org.sarsoft.AssignmentController.prototype.profile = function(assignment) {
	var that = this;
	assignment = this.obj(assignment);
	this.pg.profile(assignment.route, "FF0000", function() {
		that.profileDlg.show();
	});
}

org.sarsoft.AssignmentController.prototype.remove = function(assignment) {
	// TODO tracks and waypoints
	org.sarsoft.WayObjectController.prototype.remove.call(this, assignment);
}

org.sarsoft.AssignmentController.getIconForAssignment = function(assignment) {
	if(assignment.route.polygon) {
		var div = jQuery('<div style="height: 0.6em;"></div>');
		div.css({"border-top": '1px solid ' + '#FF0000', "border-bottom": '1px solid ' + "#FF0000"});
		jQuery('<div style="width: 100%; height: 100%"></div>').appendTo(div).css({"background-color": "#FF0000", filter: "alpha(opacity=30)", opacity : 0.3});
		return div;
	} else {
		return jQuery('<div style="height: 0.5ex"></div>').css("border-top", "1px solid " + "#FF0000");			
	}
}

org.sarsoft.AssignmentController.prototype.show = function(assignment) {
	var that = this;
	this.imap.removeWay(assignment.route);
	if(assignment.route == null) return;
	
	var active = this.opcontroller.active(assignment.operationalPeriodId);
	
	org.sarsoft.MapObjectController.prototype.show.call(this, assignment);
	
	var line = this.dn.add(assignment.id, assignment.number, function() {
		that.imap.setBounds(new google.maps.LatLngBounds(new google.maps.LatLng(assignment.route.boundingBox[0].lat, assignment.route.boundingBox[0].lng), new google.maps.LatLng(assignment.route.boundingBox[1].lat, assignment.route.boundingBox[1].lng)));
		that.relatedDlg.show(assignment.id);
	});
	
	if((assignment.comments || "").length > 0) this.dn.addComments(assignment.id, assignment.comments);
	line.prepend(org.sarsoft.AssignmentController.getIconForAssignment(assignment));

	this.dn.addIcon(assignment.id, "Elevation Profile", '<img src="' + $.img('profile.png') + '"/>', function() {
		that.profile(assignment);
	});
	
	if(org.sarsoft.writeable) {
		this.dn.addIconEdit(assignment.id, function() {
			that.edit(assignment);
			that.assignmentDlg.show(assignment, null, true);
			that.assignmentDlg.live = true;
		});
		this.dn.addIconDelete(assignment.id, function() {
			that.del(function() { that.dao.del(assignment.id); });
		});
	}
	
	this.attr(assignment, "clickable", active);
	if(this.dn.visible) {
		this.imap.addWay(assignment.route, {displayMessage: org.sarsoft.htmlescape(assignment.id) + " (" + assignment.type + ")", clickable : active, fill: 0.3, color: active ? "#FF0000" : "#000000", weight: 2}, org.sarsoft.htmlescape(assignment.number));
		// TODO tracks and waypoints
	}
}

org.sarsoft.AssignmentController.prototype.handleSetupChange = function() {
	if(!this.dn.visible) {
		for(var key in this.dao.objs) {
			this.imap.removeWay(this.dao.getObj(key).route);
			// TODO tracks and waypoints
		}
	} else {
		for(var key in this.dao.objs) {
			this.show(this.dao.getObj([key]));
		}
	}
}


org.sarsoft.ClueDAO = function() {
	org.sarsoft.MapObjectDAO.call(this, "Clue");
	this.baseURL = "/rest/clue";
	this.geo = true;
	this.label = "summary";
}

org.sarsoft.ClueDAO.prototype = new org.sarsoft.MapObjectDAO();

org.sarsoft.ClueDAO.prototype.updatePosition = function(id, position, handler) {
	var that = this;
	if(this.offline) {
		var c = this.getObj(id);
		c.position.lat = position.lat;
		c.position.lng = position.lng;
		org.sarsoft.async(function() { handler(c) });
	} else {
		this._doPost("/" + id + "/position", function(r) { that.setObj(id, r); handler(r) }, {position: position});
	}
}

org.sarsoft.ClueTable = function(handler) {
	var coldefs =[
      { key : "id", label : "Clue #"},
      { key : "summary", label : "Item Found"},
      { key : "assignmentId", label : "Team"},
	  { key : "position", label : "Location Found", formatter : function(cell, record, column, data) { if(data == null) return; var gll = {lat: function() {return data.lat;}, lng: function() {return data.lng;}}; cell.innerHTML = GeoUtil.GLatLngToUTM(GeoUtil.fromWGS84(gll)).toString();}},
	  { key : "instructions", label: "Instructions"}
	];
	org.sarsoft.view.EntityTable.call(this, coldefs, {}, handler);
}

org.sarsoft.ClueTable.prototype = new org.sarsoft.view.EntityTable();

org.sarsoft.ClueForm = function() {
}

org.sarsoft.ClueForm.prototype.create = function(container) {
	var that = this;
	var row = jQuery('<tr></tr>').appendTo(jQuery('<tbody></tbody>').appendTo(jQuery('<table style="border: 0"></table>').appendTo(container)));
	var left = $('<td width="50%" valign="top"></td>').appendTo(row);
	var right = jQuery('<td width="50%" valign="top" style="padding-left: 20px"></td>').appendTo(row);
	
	var build = function(input, label, div) {
		input = $(input);
		$('<div class="item"><span class="label">' + label + '</span></div>').appendTo(div ? div : left).append($('<div style="float: left"></div>').append(input));
		return input;
	}

	this.fields = new Object();		
	this.fields.summary = build('<input type="text"/>', 'Summary');
	this.fields.assignmentId = build('<select></select>', 'Assignment');
	this.fields.instructions = build('<select><option>COLLECT</option><option>MARK</option><option>IGNORE</option>', 'Instructions');

	this.fields.description = $('<textarea></textarea').appendTo($('<div>Description</div>').appendTo(right));
}

org.sarsoft.ClueForm.prototype.read = function() {
	var obj = {}
	for(var key in this.fields) {
		obj[key] = this.fields[key].val();
	}
	return obj;
}

org.sarsoft.ClueForm.prototype.write = function(obj) {
	this.fields.assignmentId.empty();
	var assignments = org.sarsoft.MapState.daos["Assignment"].objs;
	for(var i = 0; i < assignments.length; i++) {
		if(assignments[i] != null) this.fields.assignmentId.append('<option value="' + i + '">' + assignments[i].number + '</option>');
	}
	for(var key in this.fields) {
		this.fields[key].val(obj[key]);
	}
}

org.sarsoft.ClueController = function(imap, background_load) {
	var that = this;
	org.sarsoft.WaypointObjectController.call(this, imap, {name: "Clue", dao : org.sarsoft.ClueDAO, label: "Clues", geo: true, waypoint: "position"}, background_load);
	
	if(!org.sarsoft.iframe && org.sarsoft.writeable && !background_load) {
		this.buildAddButton(0, "Clue", function(point) {
			that.clueDlg.show({url: "#FF0000"}, point);
		});

		var form = new org.sarsoft.ClueForm();
		this.clueDlg = new org.sarsoft.view.MapObjectEntityDialog(imap, "Clue Details", form);
		
		this.clueDlg.discardGeoInfo = function() { that.discard(this.object.id) }
		this.clueDlg.saveGeoInfo = function(marker, callback) { that.save(this.object.id, callback); }
		this.clueDlg.saveData = function(clue) {
			clue.position = this.object.position;
			that.dao.save(this.object.id, clue);
		}
		this.clueDlg.create = function(clue) {
			var wpt = that.imap.projection.fromContainerPixelToLatLng(new google.maps.Point(this.point.x, this.point.y));
			clue.position = {lat: wpt.lat(), lng: wpt.lng()};
			that.dao.create(clue);
		}

		var pc = function(obj) {
			if(obj == null) return {}
			var clue = that.obj(that.getObjectIdFromWpt(obj));
			var inedit = (clue != null && that.attr(clue, "inedit"));
			return { clue: clue, inedit: inedit}
		}
		
		if(org.sarsoft.writeable && !this.bgload) {
			this.imap.addContextMenuItems([
			    {text : "New Clue", applicable : function(obj) { return obj == null && that.dn.visible}, handler: function(data) { that.clueDlg.show({}, data.point); }},
	    		{text : "Details", precheck: pc, applicable : function(obj) { return obj.clue != null && !obj.inedit && !that.clueDlg.live; }, handler: function(data) { that.clueDlg.show(data.pc.clue) }},
	    		{text : "Drag to New Location", precheck: pc, applicable : function(obj) { return obj.clue != null && !obj.inedit && !that.clueDlg.live;}, handler: function(data) { that.drag(data.pc.clue)}},
	    		{text : "Delete Clue", precheck: pc, applicable : function(obj) { return obj.clue != null && !obj.inedit && !that.clueDlg.live;}, handler: function(data) { that.del(function() { that.dao.del(data.pc.clue.id);})}} ]);
		}
	}
}

org.sarsoft.ClueController.prototype = new org.sarsoft.WaypointObjectController();

org.sarsoft.ClueController.prototype._saveWaypoint = function(id, waypoint, handler) {
	this.dao.updatePosition(id, waypoint, handler);
}

org.sarsoft.ClueController.prototype.show = function(object) {
	var that = this;
	this.imap.removeWaypoint(object.position);
	
//	var active = this.opcontroller.active(assignment.operationalPeriodId);
	
	org.sarsoft.MapObjectController.prototype.show.call(this, object);
	
	var line = this.dn.add(object.id, object.summary, function() {
		that.imap.map.setCenter(new google.maps.LatLng(object.position.lat, object.position.lng));
	});
	
	if((object.description || "").length > 0) this.dn.addComments(object.id, object.description);
	line.prepend('<div><img src="' + $.img('icons/clue.png') + '"/></div>');

	if(org.sarsoft.writeable) {
		this.dn.addIconEdit(object.id, function() {
			that.clueDlg.show(object, null, true);
			that.clueDlg.live = true;
			that.edit(object);
		});
		this.dn.addIconDelete(object.id, function() {
			that.del(function() { that.dao.del(object.id); });
		});
	}
	
	if(this.dn.visible) {
		var config = new Object();	
		var tooltip = org.sarsoft.htmlescape(object.summary || object.description);
		config.icon = org.sarsoft.MapUtil.createIcon('icons/clue.png');
		config.clickable = org.sarsoft.writeable;
		
		this.imap.addWaypoint(object.position, config, tooltip, tooltip);
	}
}

/*
if(typeof org == "undefined") org = new Object();
if(typeof org.sarsoft == "undefined") org.sarsoft = new Object();
if(typeof org.sarsoft.view == "undefined") org.sarsoft.view = new Object();
if(typeof org.sarsoft.controller == "undefined") org.sarsoft.controller = new Object();


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
		window.location="/op/" + period.id;
	});
}
org.sarsoft.view.OperationalPeriodTable.prototype = new org.sarsoft.view.EntityTable();

org.sarsoft.view.SearchAssignmentTable = function() {
	var status = { "DRAFT" : 0, "PREPARED" : 1, "INPROGRESS" : 2, "COMPLETED" : 3};
	var pod = {"LOW" : 0, "MEDIUM" : 1, "HIGH" : 2};
	var coldefs = [
		{ key : "id", label : "Number", sortable: true},
		{ key : "resourceType", label : "Resource Type", sortable: true},
		{ key : "status", label : "Status", sortable: true, formatter: org.sarsoft.view.getColorFormatter(org.sarsoft.Constants.colorsByStatus), sortOptions: {sortFunction: function(a, b, desc) { 
			return YAHOO.util.Sort.compare(status[a.getData("status")], status[b.getData("status")], desc); 
			}} },
		{ key : "formattedSize", label : "Size", sortable: true},
		{ key : "timeAllocated", label : "Time Allocated", sortable : true},
		{ key : "responsivePOD", label : "Responsive POD", sortable : true, formatter: org.sarsoft.view.getColorFormatter(org.sarsoft.Constants.colorsByProbability), sortOptions : {sortFunction: function(a, b, desc) { return YAHOO.util.Sort.compare(pod[a.getData("responsivePOD")], pod[b.getData("responsivePOD")], desc)}}},
		{ key : "details", label : "Details", formatter : function(cell, record, column, data) { $(cell).css({overflow: "hidden", "max-height": "1em", "max-width": "40em"}); cell.innerHTML = data;}}
	];
	org.sarsoft.view.EntityTable.call(this, coldefs, { caption: "Search Assignments" }, function(assignment) {
		window.location="/assignment/" + assignment.id;
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


org.sarsoft.view.SearchAssignmentGPXDlg = function(id) {
	var that = this;
	this.id = id;
	var dao = new org.sarsoft.SearchAssignmentDAO();
		
	var body = jQuery('<form method="post" enctype="multipart/form-data" name="gpxupload" action="/assignment/' + id + '/way"><input type="file" name="file"/><input type="hidden" name="format" value="gpx"/></form>')[0];

	this.dialog = org.sarsoft.view.CreateDialog("Uload GPX File", body, "Import", "Cancel", function() {
		}, {top: "200px", left: "200px", width: "420px"});
}

org.sarsoft.controller.AssignmentPrintMapController = function(container, id, mapConfig, showPreviousEfforts) {
	var that = this;
	this.mapConfig = mapConfig;
	this.assignmentDAO = new org.sarsoft.SearchAssignmentDAO(function() { that.fmap.message("Server Communication Error"); });
	this.showPrevious = showPreviousEfforts;
	this.previousEfforts = new Array();
	
	this.div = container;
	var height = "10.5in";
	if(navigator.userAgent.indexOf("MSIE") > 0 && typeof(GMap2.ol) == "undefined") height = "8in";
	this.div.style.width="8in";
	this.div.style.height=height;
	var map = org.sarsoft.EnhancedGMap.createMap(this.div);
	this.fmap = new org.sarsoft.InteractiveMap(map, {standardControls : true});

	var waypointController = new org.sarsoft.controller.SearchWaypointMapController(this.fmap);
	var markupController = new org.sarsoft.controller.MarkupMapController(this.fmap, "none");
	var configWidget = new org.sarsoft.view.PersistedConfigWidget(this.fmap);
	configWidget.loadConfig(mapConfig);
	
	this.assignmentDAO.load(function(obj) { that._loadAssignmentCallback(obj); }, id);

}

org.sarsoft.controller.AssignmentPrintMapController.prototype._loadAssignmentCallback = function(assignment) {
	var that = this;
	this.assignment = assignment;

	var config = {clickable : false, fill: false, color: "#FF0000", opacity: 100};	
	var trackConfig = {clickable: false, fill: false, color: "#FF8800", opacity: 100};	
	var otherTrackConfig = {clickable: false, fill: false, color: "#000000", opacity: 80};
	this.otherTrackConfig = otherTrackConfig;

	jQuery('<div class="printonly" style="z-index: 2000; position: absolute; top: 0px; left: 0px; background: white">Assignment ' + assignment.id + ((assignment.status == "COMPLETED") ? ' Debrief' : '') + '</div>').appendTo(this.fmap.map.getDiv());
	
	if(this.showPrevious == null) this.showPrevious = (assignment.status == "COMPLETED") ? false : true;
	
	var showHide = new org.sarsoft.ToggleControl("PREV TRK", "Show/Hide Previous Efforts in Search Area", function(value) {
		that.showPrevious = value;
		that.handleSetupChange();
	});
	showHide.setValue(this.showPrevious);
	this.fmap.addMenuItem(showHide.node, 19);
	this.showHide = showHide;
	
	var bb = this.assignment.boundingBox;
	this.fmap.setBounds(new google.maps.LatLngBounds(new google.maps.LatLng(bb[0].lat, bb[0].lng), new google.maps.LatLng(bb[1].lat, bb[1].lng)));


	this.assignmentDAO.getWays(function(ways) {
		for(var i = 0; i < ways.length; i++) {
			var way = ways[i];
			that.fmap.addWay(way, (way.type == "ROUTE") ? config : trackConfig, (way.type == "ROUTE") ? null : way.name);
		}
	}, assignment, 10);
	
	for(var i = 0; i < assignment.waypoints.length; i++) {
		var wpt = assignment.waypoints[i];
		that.fmap.addWaypoint(wpt, config, wpt.name, wpt.name);
	}
	
	for(var i = 0; i < assignment.clues.length; i++) {
		var clue = assignment.clues[i];
		if(clue.position != null) {
			that.fmap.addWaypoint(clue.position, { icon: org.sarsoft.MapUtil.createImage(16, "/static/images/clue.png") }, clue.id, clue.summary);
			that.fmap.growMap(new google.maps.LatLng(clue.position.lat, clue.position.lng));
		}
	}
	
	var bounds = new google.maps.LatLngBounds(new google.maps.LatLng(assignment.boundingBox[0].lat, assignment.boundingBox[0].lng), new google.maps.LatLng(assignment.boundingBox[1].lat, assignment.boundingBox[1].lng));
	this.assignmentDAO.loadAll(function(assignments) {
		for(var i = 0; i < assignments.length; i++) {
			var abounds = new google.maps.LatLngBounds(new google.maps.LatLng(assignments[i].boundingBox[0].lat, assignments[i].boundingBox[0].lng), new google.maps.LatLng(assignments[i].boundingBox[1].lat, assignments[i].boundingBox[1].lng));
			if(assignments[i].id != assignment.id && (bounds.intersects(abounds) || bounds.containsBounds(abounds) || abounds.containsBounds(bounds))) {
				that.assignmentDAO.getWays(function(ways) {
					for(var i = 0; i < ways.length; i++) {
						var way = ways[i];
						way.waypoints = way.zoomAdjustedWaypoints;
						if(way.type == "TRACK") {
							that.previousEfforts.push(way);
							if(that.showPrevious) that.fmap.addWay(way, otherTrackConfig, null);
						}
					}
				}, assignments[i], 10);
			}
		}
	});
}

org.sarsoft.controller.AssignmentPrintMapController.prototype.handleSetupChange = function() {
	if(this.showPrevious) {
		this.showHide.innerHTML = "PREV TRK";
		for(var i = 0; i < this.previousEfforts.length; i++) {
			this.fmap.addWay(this.previousEfforts[i], this.otherTrackConfig, null);
		}
	} else {
		this.showHide.innerHTML = "<span style='text-decoration: line-through'>PREV TRK</span>";
		for(var i = 0; i < this.previousEfforts.length; i++) {
			this.fmap.removeWay(this.previousEfforts[i], this.otherTrackConfig, null);
		}
	}
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

	var map = org.sarsoft.EnhancedGMap.createMap(this.div);
	this.fmap = new org.sarsoft.InteractiveMap(map);

	var waypointController = new org.sarsoft.controller.SearchWaypointMapController(this.fmap);
	var configWidget = new org.sarsoft.view.PersistedConfigWidget(this.fmap);
	configWidget.loadConfig();

	var bb = assignment.boundingBox;

	this.fmap.setBounds(new google.maps.LatLngBounds(new google.maps.LatLng(bb[0].lat, bb[0].lng), new google.maps.LatLng(bb[1].lat, bb[1].lng)));

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
	this.addWay(way, {clickable: false, fill: false, color: "#FF0000", opacity: 100});

	var bb = way.boundingBox;
	this.fmap.setBounds(new google.maps.LatLngBounds(new google.maps.LatLng(bb[0].lat, bb[0].lng), new google.maps.LatLng(bb[1].lat, bb[1].lng)));

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
	this.addWaypoint(waypoint, {clickable: false, fill: false, color: "#FF0000", opacity: 100});
	this.highlightedWaypoint = waypoint;

	this.fmap.setCenter(new google.maps.LatLng(waypoint.lat, waypoint.lng));
}

org.sarsoft.view.OperationalPeriodForm = function() {
	var fields = [
		{ name : "id", type : "number" },
		{ name : "description", type: "string"},
	];
	org.sarsoft.view.EntityForm.call(this, fields);
}

org.sarsoft.view.OperationalPeriodForm.prototype = new org.sarsoft.view.EntityForm();

org.sarsoft.controller.SearchWaypointMapController = function(imap) {
	var that = this;
	this.waypoints = new Object();
	this.searchDAO = new org.sarsoft.SearchDAO(function() { that.imap.message("Server Communication Error"); });
	this.imap = imap;
	this.imap.register("org.sarsoft.controller.SearchWaypointMapController", this);
	if(org.sarsoft.userPermissionLevel == "WRITE" || org.sarsoft.userPermissionLevel == "ADMIN") {
		this.imap.addContextMenuItems([
		    {text : "ICS Waypoints \u2192", applicable : function(obj) { return obj == null }, items: [
			  {text : "Set LKP here", applicable : function(obj) { return obj == null }, handler: function(data) { that.set("LKP", data.point); }},
			  {text : "Set PLS here", applicable : function(obj) { return obj == null }, handler: function(data) { that.set("PLS", data.point); }},
			  {text : "Set CP here", applicable : function(obj) { return obj == null }, handler: function(data) { that.set("CP", data.point); }}]},
			{text : "Delete LKP", applicable : function(obj) { return obj != null && obj == that.waypoints["LKP"]}, handler: function(data) { that.searchDAO.del("lkp"); that.imap.removeWaypoint(that.waypoints["LKP"]); delete that.waypoints["LKP"];}},
			{text : "Delete PLS", applicable : function(obj) { return obj != null && obj == that.waypoints["PLS"]}, handler: function(data) { that.searchDAO.del("pls"); that.imap.removeWaypoint(that.waypoints["PLS"]); delete that.waypoints["PLS"];}},
			{text : "Delete CP", applicable : function(obj) { return obj != null && obj == that.waypoints["CP"]}, handler: function(data) { that.searchDAO.del("cp"); that.imap.removeWaypoint(that.waypoints["CP"]); delete that.waypoints["CP"];}}
		]);
	}
	this.rangerings = "500,1000,1500";

	if(imap.registered["org.sarsoft.DataNavigator"] != null) {
		var dn = imap.registered["org.sarsoft.DataNavigator"];
		this.dn = new Object();
		var stree = dn.addDataType("Search");
		stree.header.css({"font-size": "120%", "font-weight": "bold", "margin-top": "0.5em", "border-top": "1px solid #CCCCCC"});
		this.dn.sdiv = jQuery('<div></div>').appendTo(stree.body);
		this.dn.waypoints = new Object();
	}
	
	this.searchDAO.load(function(lkp) {
			if(lkp.value != null) {
				that.place("LKP", lkp.value);
				that.imap.growInitialMap(new google.maps.LatLng(lkp.value.lat, lkp.value.lng));
			}
		}, "lkp");
	that.searchDAO.load(function(pls) {
		if(pls.value != null) {
			that.place("PLS", pls.value);
			that.imap.growInitialMap(new google.maps.LatLng(pls.value.lat, pls.value.lng));
		}
	}, "pls");
	that.searchDAO.load(function(cp) {
		if(cp.value != null) {
			that.place("CP", cp.value);
			that.imap.growInitialMap(new google.maps.LatLng(cp.value.lat, cp.value.lng));
		}
	}, "cp");

}

org.sarsoft.controller.SearchWaypointMapController.prototype.setConfig = function(config) {
	if(config.SearchWaypointMapController == null) return;
	this.rangerings = config.SearchWaypointMapController.rangerings;
	if(this.waypoints["LKP"] != null) this.place("LKP", this.waypoints["LKP"]);
}

org.sarsoft.controller.SearchWaypointMapController.prototype.getConfig = function(config) {
	if(config.SearchWaypointMapController == null) config.SearchWaypointMapController = new Object();
	config.SearchWaypointMapController.rangerings = this.rangerings;
	return config;
}

org.sarsoft.controller.SearchWaypointMapController.prototype.set = function(type, point) {
	var wpt = this.imap.projection.fromContainerPixelToLatLng(new google.maps.Point(point.x, point.y));
	wpt = {lat: wpt.lat(), lng: wpt.lng()};
	this.searchDAO.save(type.toLowerCase(), { value: wpt });
	wpt.id = type;
	this.place(type, wpt);
}


org.sarsoft.controller.SearchWaypointMapController.prototype.place = function(type, wpt) {
	var that = this;
	if(this.waypoints[type] != null) this.imap.removeWaypoint(this.waypoints[type]);
	this.waypoints[type] = wpt;
	if(type == "CP") {
		var icon = org.sarsoft.MapUtil.createImage(15, "/static/images/cp.png");
		this.imap.addWaypoint(wpt, {icon: icon}, type, type);
	} else {
		this.imap.addWaypoint(wpt, {color: "#FF0000"}, type, type);
	}
	if(type == "LKP") {
		this.imap.removeRangeRings();
		if(this.rangerings != null) {
			var radii = this.rangerings.split(",");
			for(var i = 0; i < radii.length; i++) {
				this.imap.addRangeRing(wpt, radii[i], 36);
			}
		}
	}
	
	if(this.dn == null) return;

	if(this.dn.waypoints[type] == null) {
		this.dn.waypoints[type] = jQuery('<div></div>').appendTo(this.dn.sdiv);
	}
	this.dn.waypoints[type].empty();
	
	var line = jQuery('<div style="padding-top: 0.5em"></div>').appendTo(this.dn.waypoints[type]);
	var s = jQuery('<span style="cursor: pointer; font-weight: bold; color: #945e3b">' + type + '</span>');
	s.appendTo(line).click(function() {
		if(org.sarsoft.mobile) imap.registered["org.sarsoft.DataNavigatorToggleControl"].hideDataNavigator();
		that.imap.setCenter(new google.maps.LatLng(wpt.lat, wpt.lng));
	});
	
	if(type == "LKP") {
		this.rrInput = jQuery('<input type="text" size="10" value="' + this.rangerings + '"/>').appendTo(jQuery('<div>Range Rings: </div>').appendTo(line)).change(function() {
			that.rangerings = that.rrInput.val();
			that.place("LKP", wpt);
		});
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

org.sarsoft.controller.OperationalPeriodMapController = function(imap, operationalperiod, maxId) {
	var that = this;
	this.imap = imap;
	this.period = operationalperiod;
	this.imap.register("org.sarsoft.controller.OperationalPeriodMapController", this);
	this.assignmentDAO = new org.sarsoft.SearchAssignmentDAO(function() { that.imap.message("Server Communication Error"); });
	this.periodDAO = new org.sarsoft.OperationalPeriodDAO(function() { that.imap.message("Server Communication Error"); });
	this.assignments = new Object();
	this._assignmentAttrs = new Object();
	this.showOtherPeriods = true;
	this._mapsetup = []
	this._hide = []
	for(var i = 0; i <= maxId; i++) {
		if(i < operationalperiod) {
			this._mapsetup[i] = {colorby : "Disabled", fill : 0, opacity : 50, showtracks: true, visible: true}
		} else if(i == operationalperiod) {
			this._mapsetup[i] = {colorby : "Assignment Number", fill : 10, opacity : 100, showtracks: true, visible: true}
		} else {
			this._mapsetup[i] = {colorby : "Disabled", fill : 0, opacity : 50, showtracks: true, visible: false}
		}
		this._hide[i] = new Object();
	}

	if(org.sarsoft.userPermissionLevel == "WRITE" || org.sarsoft.userPermissionLevel == "ADMIN") {
		this.imap.addContextMenuItems([
			{text : "New Assignment", applicable : function(obj) { return obj == null }, handler : function(data) { that.newAssignmentDlg.point = data.point; that.newAssignmentDlg.original = null; that.newAssignmentDlg.show({operationalPeriodId : that.period, polygon: true}); }},
			{text : "Modify Points", applicable : function(obj) { var assignment = that._getAssignmentFromWay(obj); return assignment != null && !that.getAssignmentAttr(assignment, "inedit") && that.getAssignmentAttr(assignment, "clickable") && assignment.status == "DRAFT"; }, handler : function(data) { that.edit(that._getAssignmentFromWay(data.subject)) }}
			]);
	}
	this.imap.addContextMenuItems([
		{text : "Details (opens new window)", applicable : function(obj) { var assignment = that._getAssignmentFromWay(obj); if(assignment == null) assignment = that._getAssignmentFromWaypoint(obj); return assignment != null && !that.getAssignmentAttr(assignment, "inedit") && that.getAssignmentAttr(assignment, "clickable"); }, handler : function(data) { var assignment = that._getAssignmentFromWay(data.subject); if(assignment == null) assignment = that._getAssignmentFromWaypoint(data.subject); window.open('/assignment/' + assignment.id); }}
		]);
	if(org.sarsoft.userPermissionLevel == "WRITE" || org.sarsoft.userPermissionLevel == "ADMIN") {
		this.imap.addContextMenuItems([
			{text : "Redraw", applicable : function(obj) { var assignment = that._getAssignmentFromWay(obj); return assignment != null && !that.getAssignmentAttr(assignment, "inedit") && that.getAssignmentAttr(assignment, "clickable") && assignment.status == "DRAFT"; }, handler : function(data) { that.redraw(that._getAssignmentFromWay(data.subject)) }},
			{text : "Delete Assignment", applicable : function(obj) { var assignment = that._getAssignmentFromWay(obj); return obj != null && obj.type != "TRACK" && assignment != null && !that.getAssignmentAttr(assignment, "inedit") && that.getAssignmentAttr(assignment, "clickable") && assignment.status == "DRAFT"; }, handler : function(data) { var assignment = that._getAssignmentFromWay(data.subject); that.assignmentDAO.del(assignment.id); that.removeAssignment(assignment); }},
			{text : "Clone Assignment", applicable : function(obj) { var assignment = that._getAssignmentFromWay(obj); return obj != null && obj.type != "TRACK" && assignment != null && !that.getAssignmentAttr(assignment, "inedit") && that.getAssignmentAttr(assignment, "clickable")}, handler : function(data) { var assignment = that._getAssignmentFromWay(data.subject); that.newAssignmentDlg.point = null; that.newAssignmentDlg.original = assignment;
				that.newAssignmentDlg.show({operationalPeriodId : that.period, polygon: true, resourceType: assignment.resourceType, unresponsivePOD: assignment.unresponsivePOD, responsivePOD: assignment.responsivePOD, cluePOD: assignment.cluePOD, timeAllocated: assignment.timeAllocated, details: assignment.details}); }},
			{text : "Delete Track", applicable : function(obj) { var assignment = that._getAssignmentFromWay(obj); return obj != null && obj.type == "TRACK" && assignment != null && !that.getAssignmentAttr(assignment, "inedit") && that.getAssignmentAttr(assignment, "clickable"); }, handler : function(data) { 
				var assignment = that._getAssignmentFromWay(data.subject);
				var idx = 100;
				for(var i = 0; i < assignment.ways.length; i++) {
					if(assignment.ways[i].id == data.subject.id) idx = i;
				}
				that.assignmentDAO.deleteWay(function() {
					assignment.ways.splice(idx, 1);
					that.imap.removeWay(data.subject);				
				}, assignment, idx, data.subject);
			}},
			{text : "Delete Waypoint", applicable : function(obj) { var assignment = that._getAssignmentFromWaypoint(obj); return obj != null && assignment != null && !that.getAssignmentAttr(assignment, "inedit") && that.getAssignmentAttr(assignment, "clickable"); }, handler : function(data) { 
				var assignment = that._getAssignmentFromWaypoint(data.subject);
				var idx = 100;
				for(var i = 0; i < assignment.waypoints.length; i++) {
					if(assignment.waypoints[i].id == data.subject.id) idx = i;
				}
				if(idx != 100) that.assignmentDAO.deleteWaypoint(function() {
					assignment.waypoints.splice(idx, 1);
					that.imap.removeWaypoint(data.subject);				
				}, assignment, idx, data.subject);
			}},
			{text : "Save Changes", applicable : function(obj) { var assignment = that._getAssignmentFromWay(obj); return assignment != null && that.getAssignmentAttr(assignment, "inedit"); }, handler: function(data) { that.save(that._getAssignmentFromWay(data.subject)) }},
			{text : "Discard Changes", applicable : function(obj) { var assignment = that._getAssignmentFromWay(obj); return assignment != null && that.getAssignmentAttr(assignment, "inedit"); }, handler: function(data) { that.discard(that._getAssignmentFromWay(data.subject)) }}
			]);
	}
	
	var leaveDlg = org.sarsoft.view.CreateDialog("Leave Map View", "Leave the map view and return to the page for Operational Period " + this.period + "?", "Leave", "Cancel", function() {
		window.location = "/op/" + that.period;		
	});
	var goback = jQuery('<img src="/static/images/home.png" style="cursor: pointer; vertical-align: middle" title="Back to operational period ' + this.period + '"/>')[0];
	google.maps.event.addDomListener(goback, "click", function() {
		leaveDlg.show();
	});
	this.imap.addMenuItem(goback, 40);	
	
	this.delconfirm = new org.sarsoft.view.MapDialog(imap, "Delete?", jQuery('<div>Delete - Are You Sure?</div>'), "Delete", "Cancel", function() {
		that.assignmentDAO.del(that.delconfirm.assignment.id); that.removeAssignment(that.delconfirm.assignment);
		that.delconfirm.assignment = null;
	});

	
	if(imap.registered["org.sarsoft.DataNavigator"] != null) {
		var dn = imap.registered["org.sarsoft.DataNavigator"];
		this.dn = [];
		
		var initDN = function(i) {
			that.dn[i] = new Object();
			var optree = dn.addDataType("OP " + i);
			optree.header.css({"font-size": "120%", "font-weight": "bold", "margin-top": "0.5em", "border-top": "1px solid #CCCCCC"});
			that.dn[i].assignmentdiv = jQuery('<div' + (that._mapsetup[i].visible ? '' : ' style="display: none"') + '></div>').appendTo(optree.body);
			that.dn[i].assignments = new Object();
			that.dn[i].config = jQuery('<div style="display: none; border-left-width: 1px; border-left-style: dashed; border-left-color: rgb(90, 142, 215); margin-left: 0.5em; padding-left: 0.5em; margin-top: 1ex; margin-bottom: 1ex;"></div>').appendTo(that.dn[i].assignmentdiv);
			that.dn[i].cb = jQuery('<input type="checkbox"' + (that._mapsetup[i].visible ? ' checked="checked"' : '') + '/>').prependTo(optree.header).click(function(evt) {
				var val = that.dn[i].cb[0].checked;
				if(val) {
					that.dn[i].assignmentdiv.css('display', 'block');
					that._mapsetup[i].visible = true;
					optree.body.css('display', 'block');
				} else {
					that.dn[i].assignmentdiv.css('display', 'none');
					that._mapsetup[i].visible = false;
				}
				evt.stopPropagation();
				that.handleSetupChange();
			});
			that.dn[i].assignmenttoggle = jQuery('<div style="float: right; font-size: 83%; cursor: pointer">(setup)</div>').prependTo(optree.header).click(function(evt) {
					if(that.dn[i].config.css('display')=='none') {
						that.dn[i].assignmenttoggle.html('(done)');
						that.dn[i].config.css('display', 'block');
					} else {
						that.dn[i].assignmenttoggle.html('(setup)');
						that.dn[i].config.css('display', 'none');
					}
					evt.stopPropagation();
				});

			that.dn[i].groupingSelect = jQuery('<select><option value="Assignment Number">N/A</option><option value="Resource Type">Type</option><option>POD</option><option value="Assignment Status">Status</option></select>').appendTo(jQuery('<div>Group By: </div>').appendTo(that.dn[i].config)).change(function() {
				for(var key in that.dn[i].grouping) {
					if(key == that.dn[i].groupingSelect.val()) {
						that.dn[i].grouping[key].css('display', 'block');
						that.dn[i].grouping[key].children().css('display', 'none');
						that._hide[i] = new Object();
					} else {
						that.dn[i].grouping[key].css('display', 'none');
					}
				}
				that.handleSetupChange();
			});

			that.dn[i].coloringSelect = jQuery('<select><option value="Assignment Number">Number</option><option value="Resource Type">Type</option><option>POD</option><option value="Assignment Status">Status</option></select>').appendTo(jQuery('<div>Color By: </div>').appendTo(that.dn[i].config)).change(function() {
				that._mapsetup[i].colorby = that.dn[i].coloringSelect.val();
				that.handleSetupChange();
			});

			that.dn[i].grouping = {
					"Assignment Number": jQuery('<div style="display: block"><div></div><div></div></div>').appendTo(that.dn[i].assignmentdiv)
//					"Resource Type": jQuery('<div style="display: none"><div grouping="GROUND"><div style="color: #FF0000; font-style: italic; font-size: 125%; text-align: center">Ground</div></div><div grouping="DOG"><div style="color: #FF8800; font-style: italic; font-size: 125%; text-align: center">Dog</div></div><div grouping="OHV"><div style="color: #8800FF; font-style: italic; font-size: 125%; text-align: center">OHV</div></div><div grouping="MOUNTED"><div style="color: #8800FF; font-style: italic; font-size: 125%; text-align: center">Mounted</div></div></div>').appendTo(that.dn[i].assignmentdiv),
//					"POD": jQuery('<div style="display: none"><div grouping="LOW"><div style="color: #0088FF; font-style: italic; font-size: 125%; text-align: center">Low</div></div><div grouping="MEDIUM"><div style="color: #FF8800; font-style: italic; font-size: 125%; text-align: center">Medium</div></div><div grouping="HIGH"><div style="color: #FF0000; font-style: italic; font-size: 125%; text-align: center">High</div></div></div>').appendTo(that.dn[i].assignmentdiv),
//					"Assignment Status": jQuery('<div style="display: none"><div grouping="DRAFT"><div style="color: #0088FF; font-style: italic; font-size: 125%; text-align: center">Draft</div></div><div grouping="PREPARED"><div style="color: #FF8800; font-style: italic; font-size: 125%; text-align: center">Prepared</div></div><div grouping="INPROGRESS"><div style="color: #FF0000; font-style: italic; font-size: 125%; text-align: center">In Progress</div></div><div grouping="COMPLETED"><div style="color: #8800FF; font-style: italic; font-size: 125%; text-align: center">Completed</div></div></div>').appendTo(that.dn[i].assignmentdiv)
			}
			
			var groupings = {
					"Resource Type": {"GROUND": ["Ground", "#FF0000"], "DOG": ["Dog", "#FF8800"], "OHV": ["OHV", "#8800FF"], "MOUNTED": ["Mounted", "#8800FF"]},
					"POD": {"LOW": ["Low", "#0088FF"], "MEDIUM": ["Medium", "#FF8800"], "HIGH": ["High", "#FF0000"]},
					"Assignment Status": {"DRAFT": ["Draft", "#0088FF"], "PREPARED": ["Prepared", "#FF8800"], "INPROGRESS": ["In Progress", "#FF0000"], "COMPLETED": ["Completed", "#8800FF"]}					
			}
			
			var fn = function(k2, d3) {
				return function() {
					var visible = !(d3.css("display")=="block");
					if(visible) {
						d3.css('display', 'block');
						that._hide[i][k2] = false;
					} else {
						d3.css('display', 'none');
						that._hide[i][k2] = true;
					}
					that.handleSetupChange();
				}
			}
			
			for(var key in groupings) {
				var div = jQuery('<div style="display: none"></div>').appendTo(that.dn[i].assignmentdiv);
				that.dn[i].grouping[key] = div;
				for(var k2 in groupings[key]) {
					var d2 = jQuery('<div grouping="' + k2 + '"></div>').appendTo(div);
					var d3 = jQuery('<div style="display: block"></div>').appendTo(d2);
					jQuery('<div style="color: ' + groupings[key][k2][1] + '; font-style: italic; cursor: pointer; font-size: 125%; text-align: center">' + groupings[key][k2][0] + '</div>').prependTo(d2).click(fn(k2, d3));
				}
			}
			
			if(i != operationalperiod) {
				that.dn[i].coloringSelect.prepend('<option value="Disabled">N/A</option>');
				that.dn[i].coloringSelect.val('Disabled');
			}
			
			that.dn[i].optree = optree;
		}

		for(var j = 1; j <= maxId; j++) {
			initDN(j);
		}
		
		
		if((org.sarsoft.userPermissionLevel == "WRITE" || org.sarsoft.userPermissionLevel == "ADMIN")) {
			this.dn.newAssignment = jQuery('<div style="padding-top: 1em; font-size: 120%"></div>').appendTo(that.dn[that.period].optree.body);
			jQuery('<span style="color: green; cursor: pointer">+ New Assignment</span>').appendTo(this.dn.newAssignment).click(function() {
				var center = that.imap.map.getCenter();
				that.newAssignmentDlg.point = that.imap.projection.fromLatLngToContainerPixel(center);
				that.newAssignmentDlg.original = null;
				that.newAssignmentDlg.show({operationalPeriodId : that.period, polygon: true});
			});
		}
	}
	
	this.periodDAO.load(function(period) {
			var bb = period.boundingBox;
			if(bb.length == 0) {
				that.periodDAO.loadAll(function(periods) {
					for(var i = periods.length; i >= 0; i--) {
						if(periods[i] != null && periods[i].boundingBox.length > 0 && bb.length == 0) {
							bb = periods[i].boundingBox;
							that.imap.growInitialMap(new google.maps.LatLng(bb[0].lat, bb[0].lng));
							that.imap.growInitialMap(new google.maps.LatLng(bb[1].lat, bb[1].lng));
						}
					}
				});
			} else {
				that.imap.growInitialMap(new google.maps.LatLng(bb[0].lat, bb[0].lng));
				that.imap.growInitialMap(new google.maps.LatLng(bb[1].lat, bb[1].lng));
			}
	}, that.period);

	this.newAssignmentDlg = new org.sarsoft.view.MapEntityDialog(this.imap, "Create Assignment", new org.sarsoft.view.SearchAssignmentForm(), function(assignment) {
		var way = { name: assignment.name, polygon: assignment.polygon };
		var isClone = false;
		assignment.ways = [way];
		if(that.newAssignmentDlg.point != null) {
			way.waypoints = that.imap.getNewWaypoints(that.newAssignmentDlg.point, way.polygon);
		} else {
			isClone = true;
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
		that.assignmentDAO.create(assignment, function(obj) {
			that.addAssignment(obj, function() {
				if(!isClone) {
					that.redraw(obj, function() {
						that.save(obj);
					});
				}});
		});
	});
	
	this.editAssignmentDlg = new org.sarsoft.view.MapEntityDialog(this.imap, "Edit Assignment", new org.sarsoft.view.SearchAssignmentForm(true), function(assignment) {
		var a2 = that.editAssignmentDlg.assignment;
		that.editAssignmentDlg.assignment = null;
		that.save(a2, function() {
			that.assignmentDAO.save(a2.id, assignment, function(assignment) {
				that.addAssignment(assignment);
			});
		});
	}, "Save");

	this.editAssignmentDlg.dialog.dialog.hideEvent.subscribe(function() { 
		if(that.editAssignmentDlg.assignment != null) {
			that.discard(that.editAssignmentDlg.assignment);
			that.editAssignmentDlg.assignment = null;
		}
	});
	
	this.pg = new org.sarsoft.view.ProfileGraph();
	this.profileDlg = new org.sarsoft.view.MapDialog(imap, "Elevation Profile", this.pg.div, "OK", null, function() { that.pg.hide(); });
	this.profileDlg.dialog.hideEvent.subscribe(function() { that.pg.hide(); });
	
	this.assignmentDAO.loadAll(function(assignments) {
		for(var i = 0; i < assignments.length; i++) {
			that.addAssignment(assignments[i]);
		}
		if(that.imap.registered["org.sarsoft.controller.ResourceLocationMapController"]) that.imap.registered["org.sarsoft.controller.ResourceLocationMapController"].handleSetupChange();
	});

	this.assignmentDAO.mark();

	this.imap.message("Operational Period " + this.period + ".  Right click to create/edit assignments.", 30000);

}

org.sarsoft.controller.OperationalPeriodMapController._idx = 0;

org.sarsoft.controller.OperationalPeriodMapController.prototype.setConfig = function(config) {
	if(config.OperationalPeriodMapController == null || config.OperationalPeriodMapController.ops == null) return;
//	for(var i = 0; i < config.OperationalPeriodMapController.ops.length; i++) {
//		this._mapsetup[i] = config.OperationalPeriodMapController.ops[i]
//	}
	this.handleSetupChange();
}

org.sarsoft.controller.OperationalPeriodMapController.prototype.getConfig = function(config) {
	if(config == null) config = new Object();
	if(config.OperationalPeriodMapController == null) config.OperationalPeriodMapController = new Object();
//	if(config.OperationalPeriodMapController.ops == null) config.OperationalPeriodMapController.ops = [];
//	for(var i = 0; i < this._mapsetup.length; i++) {
//		config.OperationalPeriodMapController.ops[i] = this._mapsetup[i];
//	}
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

org.sarsoft.controller.OperationalPeriodMapController.prototype._getAssignmentFromWaypoint = function(wpt) {
	if(wpt == null) return null;
	for(var key1 in this.assignments) {
		for(var key2 = 0; key2 < this.assignments[key1].waypoints.length; key2++) {
			if(this.assignments[key1].waypoints[key2].id == wpt.id) return this.assignments[key1];
		}
	}
	return null;
}

org.sarsoft.controller.OperationalPeriodMapController.prototype.handleSetupChange = function() {
	var p = 0;
	for(var i = 0; i < this.dn.length; i++) {
		if(this.dn[i] != null) {
			if(this.dn[i].cb[0].checked) p = i;
		}
	}
	
	if(p != this.period) {
		this._mapsetup[this.period].colorby = "Disabled";
		this._mapsetup[this.period].fill = 0;
		this._mapsetup[this.period].opacity = 50;
		this.dn[this.period].coloringSelect.val("Disabled");
		this.period = p;
		this._mapsetup[this.period].colorby = "Assignment Number";
		this._mapsetup[this.period].fill = 10;
		this._mapsetup[this.period].opacity = 100;
		this.dn[this.period].coloringSelect.val("Assignment Number");
		if(p > 0) {
			this.dn.newAssignment.appendTo(this.dn[this.period].optree.body);
		} else {
			this.dn.newAssignment.remove();
		}
	}

	for(var id in this.assignments) {
		var assignment = this.assignments[id];
		for(var i = 0; i < assignment.ways.length; i++) {
			this.imap.removeWay(assignment.ways[i]);
		}
		this.addAssignment(assignment);
	}
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
	});
	that.assignmentDAO.mark();

}

org.sarsoft.controller.OperationalPeriodMapController.prototype.save = function(assignment, callback) {
	for(var i = 0; i < assignment.ways.length; i++) {
		var way = assignment.ways[i];
		way.waypoints = this.imap.save(way.id);
		this.assignmentDAO.saveWaypoints(assignment, i, way.waypoints, i == 0 ? callback : null);
	}
	this.setAssignmentAttr(assignment, "inedit", false);
}

org.sarsoft.controller.OperationalPeriodMapController.prototype.discard = function(assignment) {
	for(var i = 0; i < assignment.ways.length; i++) {
		this.imap.discard(assignment.ways[i].id);
	}
	this.setAssignmentAttr(assignment, "inedit", false);
}

org.sarsoft.controller.OperationalPeriodMapController.prototype.redraw = function(assignment, callback) {
	var found = false;
	for(var i = 0; i < assignment.ways.length && found == false; i++) {
		if(assignment.ways[i].type == "ROUTE") {
			this.imap.redraw(assignment.ways[i].id, callback);
			found = true;
		}
	}
	this.setAssignmentAttr(assignment, "inedit", true);
}

org.sarsoft.controller.OperationalPeriodMapController.prototype.edit = function(assignment) {
	for(var i = 0; i < assignment.ways.length; i++) {
		this.imap.edit(assignment.ways[i].id);
	}
	this.setAssignmentAttr(assignment, "inedit", true);
}

org.sarsoft.controller.OperationalPeriodMapController.prototype.profile = function(assignment) {
	var that = this;
	var service = new google.maps.ElevationService();
	var path = [];
	var idx = 0;
	for(var i = 0; i < assignment.ways.length; i++) {
		if(assignment.ways[i].type=="ROUTE") idx=i;
	}
	for(var i = 0; i < assignment.ways[idx].waypoints.length; i++) {
		path.push(new google.maps.LatLng(assignment.ways[idx].waypoints[i].lat, assignment.ways[idx].waypoints[i].lng));
	}
	if(assignment.ways[idx].polygon) path.push(new google.maps.LatLng(assignment.ways[idx].waypoints[0].lat, assignment.ways[idx].waypoints[0].lng));
	service.getElevationAlongPath({path: path, samples: 100}, function(result, status) {
		if(status == google.maps.ElevationStatus.OK) {
			that.profileDlg.show();
			that.pg.draw(result, that.getColorForAssignmentId(assignment.id));
		} else {
			alert("An error occurred while retrieving profile data from Google Maps: " + status);
		}
	});
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
		this.imap.removeWay(assignment.ways[i]);
	}
	delete this.assignments[assignment.id];
	var op = 1*assignment.operationalPeriodId;
	if(this.dn[op].assignments[assignment.id] != null) {
		this.dn[op].assignments[assignment.id].remove();
		delete this.dn[op].assignments[assignment.id];		
	}
}

org.sarsoft.controller.OperationalPeriodMapController.prototype.getColorForAssignmentId = function(id) {
	var assignment = this.assignments[id];
	if(assignment == null) return "#000000";
	var setup = this._mapsetup[assignment.operationalPeriodId];
	
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

org.sarsoft.controller.OperationalPeriodMapController.prototype.addAssignment = function(assignment, handler) {
	var that = this;
	this.assignments[assignment.id] = assignment;
	var config = new Object();
	var setup = this._mapsetup[assignment.operationalPeriodId];
	config.clickable = false;
	if(assignment.operationalPeriodId == this.period) {
		config.clickable = true;
	}

	config.color = this.getColorForAssignmentId(assignment.id);
	config.fill = setup.fill;
	config.opacity = setup.opacity;
	config.showtracks = setup.showtracks;
	config.visible = setup.visible;

	this.setAssignmentAttr(assignment, "clickable", config.clickable);
	this.setAssignmentAttr(assignment, "config", config);

	if(config.clickable) {
		this._addAssignmentCallback(assignment.ways, assignment);
		this.assignmentDAO.getWays(function(obj) { that._refreshAssignmentCallback(obj, assignment); if(typeof(handler) != "undefined") handler(); }, assignment, 10);
	} else {
		this._addAssignmentCallback(assignment.ways, assignment);
		if(typeof(handler) != "undefined") handler();
	}
}

org.sarsoft.controller.OperationalPeriodMapController.prototype._refreshAssignmentCallback = function( ways, assignment) {
	for(var i = 0; i < ways.length; i++) {
		this.imap.removeWay(ways[i]);
	}
	for(var i = 0; i < assignment.waypoints.length; i++) {
		this.imap.removeWaypoint(assignment.waypoints[i]);
	}
	this._addAssignmentCallback(ways, assignment);
}

org.sarsoft.controller.OperationalPeriodMapController.prototype._addAssignmentCallback = function(ways, assignment) {
	var config = this.getAssignmentAttr(assignment, "config");
	var visible = config.visible;
	var op = 1*assignment.operationalPeriodId;
	var grouping = this.dn[op].groupingSelect.val();
	if(grouping == "Resource Type") {
		if(this._hide[op][assignment.resourceType]) visible = false;
	} else if(grouping == "POD") {
		if(this._hide[op][assignment.responsivePOD]) visible = false;
	} else if(grouping == "Assignment Status") {
		if(this._hide[op][assignment.status]) visible = false;
	}

	if(visible) {
		for(var i = 0; i < ways.length; i++) {
			var way = ways[i];
			way.waypoints = way.zoomAdjustedWaypoints;
			way.displayMessage = "Assignment " + assignment.id + ": " + assignment.status + " " + assignment.formattedSize + " " + assignment.timeAllocated + "hr " + assignment.resourceType + ".  <a href='/assignment/" + assignment.id + "' target='_new'>Details</a>";
			var label = null;
			label = way.name;
			if(way.type == "ROUTE") label = assignment.id
			if(way.type == "ROUTE" || config.showtracks) this.imap.addWay(way, config, label);
		}
		if(config.clickable && config.showtracks) {
			for(var i = 0; i < assignment.waypoints.length; i++) {
				var wpt = assignment.waypoints[i];
				this.imap.addWaypoint(wpt, config, wpt.name, wpt.name);
			}
		}
	}

	this.DNAddAssignment(ways, assignment);
}

org.sarsoft.controller.OperationalPeriodMapController.prototype.getIconForAssignment = function(assignment) {
	// TODO replace assignment.ways[0] with the actual route
	var config = this.getAssignmentAttr(assignment, "config");
	if(assignment.ways[0].polygon) {
		var div = jQuery('<div style="float: left; height: 0.6em; width: 1.5em; margin-right: 0.5em"></div>');
		div.css({"border-top": config.weight + 'px solid ' + config.color, "border-bottom": config.weight + 'px solid ' + config.color});
		jQuery('<div style="width: 100%; height: 100%"></div>').appendTo(div).css({"background-color": config.color, filter: "alpha(opacity=" + config.fill + ")", opacity : config.fill/100});
		return div;
	} else {
		return jQuery('<div style="float: left; height: 0.5em; width: 1.5em; margin-right: 0.5em"></div>').css("border-bottom", config.weight + "px solid " + config.color);			
	}
}

org.sarsoft.controller.OperationalPeriodMapController.prototype.DNAddAssignment = function(ways, assignment) {
	var that = this;
	var op = 1*assignment.operationalPeriodId;
	if(this.dn[op].assignmentdiv == null) return;
	
	var grouping = this.dn[op].groupingSelect.val();
	var adiv = this.dn[op].grouping[grouping];

	if(grouping == "Resource Type") {
		var child = this.dn[op].grouping["Resource Type"].children('[grouping="' + assignment.resourceType + '"]');
		if(child.length > 0) adiv = child[0];
	} else if(grouping == "POD") {
		var child = this.dn[op].grouping["POD"].children('[grouping="' + assignment.responsivePOD + '"]');
		if(child.length > 0) adiv = child[0];
	} else if(grouping == "Assignment Status") {
		var child = this.dn[op].grouping["Assignment Status"].children('[grouping="' + assignment.status + '"]');
		if(child.length > 0) adiv = child[0];
	}
	
	$(adiv).css('display', 'block');
	adiv = $(adiv).children().last();

	if(this.dn[op].assignments[assignment.id] == null) {
		this.dn[op].assignments[assignment.id] = jQuery('<div></div>');
		this.dn[op].assignments[assignment.id][0].aid = assignment.id;
	}
	
	this.dn[op].assignments[assignment.id].empty().appendTo(adiv);
	
	adiv.children().sort(function(a, b) { return (1*a.aid > 1*b.aid) ? 1 : (1*a.aid < 1*b.aid) ? -1 : 0}).appendTo(adiv);
	
	var line = jQuery('<div style="padding-top: 0.5em"></div>').appendTo(this.dn[op].assignments[assignment.id]);
	line.append(this.getIconForAssignment(assignment));

	var s = jQuery('<span style="cursor: pointer; font-weight: bold; color: #945e3b">' + assignment.id + '&nbsp;&nbsp;(' + assignment.resourceType[0] + '/' + assignment.responsivePOD[0] + ')</span>');
	if(assignment.details != null && assignment.details.length > 0) {
		s.attr('title', org.sarsoft.htmlescape(assignment.details));
	}

	s.appendTo(line).click(function() {
		if(org.sarsoft.mobile) imap.registered["org.sarsoft.DataNavigatorToggleControl"].hideDataNavigator();
		that.imap.setBounds(new google.maps.LatLngBounds(new google.maps.LatLng(assignment.boundingBox[0].lat, assignment.boundingBox[0].lng), new google.maps.LatLng(assignment.boundingBox[1].lat, assignment.boundingBox[1].lng)));
	});
	
	if((org.sarsoft.userPermissionLevel == "WRITE" || org.sarsoft.userPermissionLevel == "ADMIN")) {	
		if(assignment.status == "DRAFT" && this.getAssignmentAttr(assignment, "clickable")) {
			jQuery('<span title="Delete" style="cursor: pointer; float: right; margin-right: 10px; font-weight: bold; color: red">-</span>').appendTo(line).click(function() {
				that.delconfirm.assignment = assignment; that.delconfirm.show();
			});

			jQuery('<span title="Edit" style="cursor: pointer; float: right; margin-right: 5px;"><img src="' + org.sarsoft.imgPrefix + '/edit.png"/></span>').appendTo(line).click(function() {
				that.editAssignmentDlg.assignment = assignment;
				that.edit(assignment);
				that.editAssignmentDlg.show(assignment);
			});

		}

	}

	jQuery('<span title="Elevation Profile" style="cursor: pointer; float: right; margin-right: 5px;"><img src="' + org.sarsoft.imgPrefix + '/profile.png"/></span>').appendTo(line).click(function() {
			that.profile(assignment);
		});

	var line = jQuery('<div></div>').appendTo(this.dn[op].assignments[assignment.id]);
//	if(assignment.details != null && assignment.details.length > 0) {
//		jQuery('<div style="border-left: 1px solid #945e3b; padding-left: 1ex" class="shape_desc_line_item pre"></div>').append(org.sarsoft.htmlescape(assignment.details)).appendTo(line);
//	}

}


org.sarsoft.ClueDAO = function(errorHandler, baseURL) {
	if(typeof baseURL == "undefined") baseURL = "/rest/clue";
	this.baseURL = baseURL;
	this.errorHandler = errorHandler;
}

org.sarsoft.ClueDAO.prototype = new org.sarsoft.BaseDAO();

org.sarsoft.ClueDAO.prototype.updatePosition = function(id, position, handler) {
	this._doPost("/" + id + "/position", handler, {position: position}, handler);
}

org.sarsoft.controller.ClueViewMapController = function(id, imap) {
	var that = this;
	this.imap = imap;
	this.clueDAO = new org.sarsoft.ClueDAO(function() { that._handleServerError(); });
	this.clueDAO.load(function(obj) { that._loadClueCallback(obj); }, id);
}

org.sarsoft.controller.ClueViewMapController.prototype._loadClueCallback = function(clue) {
	var that = this;
	this.clue = clue;

	that.imap.setCenter(new google.maps.LatLng(clue.position.lat, clue.position.lng), 13);
	
	var icon = org.sarsoft.MapUtil.createImage(16, "/static/images/clue.png");
	that.imap.addWaypoint(clue.position, {icon: icon}, clue.id);
}



org.sarsoft.controller.ClueLocationMapController = function(imap) {
	var that = this;
	this.imap = imap;
	this.imap.register("org.sarsoft.controller.ClueLocationMapController", this);
	this.clueDAO = new org.sarsoft.ClueDAO(function () { that.imap.message("Server Communication Error"); });
	this.clues = new Object();
	this.showClues = true;
	
	this.imap.addContextMenuItems([
     		{text : "Details (opens new window)", applicable : function(obj) { return obj != null && that.getClueIdFromWpt(obj) != null}, handler : function(data) { window.open('/clue/' + that.getClueIdFromWpt(data.subject)); }}
     		]);
		
	if(imap.registered["org.sarsoft.DataNavigator"] != null) {
		var dn = imap.registered["org.sarsoft.DataNavigator"];
		this.dn = new Object();
		var cluetree = dn.addDataType("Clues");
		cluetree.header.css({"font-size": "120%", "font-weight": "bold", "margin-top": "0.5em", "border-top": "1px solid #CCCCCC"});
		this.dn.cluediv = jQuery('<div></div>').appendTo(cluetree.body);
		this.dn.clues = new Object();
		this.dn.cb = jQuery('<input type="checkbox"' + (that.showClues ? ' checked="checked"' : '') + '/>').prependTo(cluetree.header).click(function(evt) {
			var val = that.dn.cb[0].checked;
			if(val) {
				that.showClues = true;
				cluetree.body.css('display', 'block');
				cluetree._lock = false;
			} else {
				that.showClues = false;
				cluetree.body.css('display', 'none');
				cluetree._lock = true;
			}
			evt.stopPropagation();
			that.handleSetupChange();
		});
		
		if(!this.showClues) this.dn.cluetoggle.click();

		if((org.sarsoft.userPermissionLevel == "WRITE" || org.sarsoft.userPermissionLevel == "ADMIN")) {
			jQuery('<span style="color: green; cursor: pointer">+ New Clue</span>').appendTo(jQuery('<div style="padding-top: 1em; font-size: 120%"></div>').appendTo(cluetree.body)).click(function() {
    			that.clueDlg.point=that.imap.projection.fromLatLngToContainerPixel(that.imap.map.getCenter());
				that.clueDlg.show();
			});
		}
	}

	this.clueDlg = new org.sarsoft.view.MapEntityDialog(this.imap, "Edit Clue", new org.sarsoft.view.ClueForm(), function(updated) {
		if(that.clueDlg.clue != null) {
			var clue = that.clues[that.clueDlg.clue.id];
			that.clueDlg.clue = null;
			that.imap.saveDrag(clue.position);
			that.clueDAO.updatePosition(clue.id, clue.position, function() {
				that.clueDAO.save(clue.id, updated, function(c) {
					that.showClue(c);
				});
			});
		} else { 
			var wpt = that.imap.projection.fromContainerPixelToLatLng(new google.maps.Point(that.clueDlg.point.x, that.clueDlg.point.y));
			updated.position = {lat: wpt.lat(), lng: wpt.lng()};
			that.clueDAO.create(updated, function(c) {
				that.showClue(c);
			});
		}
	}, "Save");
	
	this.clueDlg.dialog.dialog.hideEvent.subscribe(function() { 
		if(that.clueDlg.clue != null) {
			that.imap.discardDrag(that.clues[that.clueDlg.clue.id].position);
			that.clueDlg.clue = null;
		}
	});
	
	this.delconfirm = new org.sarsoft.view.MapDialog(imap, "Delete?", jQuery('<div>Delete - Are You Sure?</div>'), "Delete", "Cancel", function() {
		that.clueDAO.del(that.delconfirm.clue.id); that.removeClue(that.delconfirm.clue);
		that.delconfirm.clue = null;
	});


	this.clueDAO.loadAll(function(clues) {
		var n = -180;
		var s = 180;
		var e = -180;
		var w = 180;
		var total = 0;
		for(var i = 0; i < clues.length; i++) {
			var clue = clues[i];
			if(clue.position != null) {
				total++;
				n = Math.max(n, clue.position.lat);
				s = Math.min(s, clue.position.lat);
				e = Math.max(e, clue.position.lng);
				w = Math.min(w, clue.position.lng);
			}
		}
		if(total > 1) {
			that.imap.growInitialMap(new google.maps.LatLng(s, w));
			that.imap.growInitialMap(new google.maps.LatLng(n, e));
		}

		that.refresh(clues);
	});		
	this.clueDAO.mark();
	
}

org.sarsoft.controller.ClueLocationMapController.prototype.setConfig = function(config) {
	if(config.ClueLocationMapController == null || config.ClueLocationMapController.showClues == null) return;
	this.showClues = config.ClueLocationMapController.showClues;
	this.handleSetupChange();
}

org.sarsoft.controller.ClueLocationMapController.prototype.getConfig = function(config) {
	if(config == null) config = new Object();
	if(config.ClueLocationMapController == null) config.ClueLocationMapController = new Object();
	config.ClueLocationMapController.showClues = this.showClues;
	return config;
}

org.sarsoft.controller.ClueLocationMapController.prototype.getClueIdFromWpt = function(wpt) {
	for(var key in this.clues) {
		if(this.clues[key] != null && this.clues[key].position == wpt) return key;
	}
}

org.sarsoft.controller.ClueLocationMapController.prototype.timer = function() {
	var that = this;
	this.clueDAO.loadSince(function(clues) {
		that.refresh(clues);
	});
	that.clueDAO.mark();
}

org.sarsoft.controller.ClueLocationMapController.prototype.DNAddClue = function(clue) {
	var that = this;
	if(this.dn.cluediv == null) return;

	if(this.dn.clues[clue.id] == null) {
		this.dn.clues[clue.id] = jQuery('<div></div>').appendTo(this.dn.cluediv);
	}
	this.dn.clues[clue.id].empty();
	
	var line = jQuery('<div style="padding-top: 0.5em"></div>').appendTo(this.dn.clues[clue.id]);

	var s = jQuery('<span style="cursor: pointer; font-weight: bold; color: #945e3b">' + clue.id + '&nbsp;' + org.sarsoft.htmlescape(clue.summary) + '</span>');
	var title = "";
	if(clue.description != null && clue.description.length > 0) title = title + org.sarsoft.htmlescape(clue.description) + "\n\n";
	if(clue.assignmentId != null && clue.assignmentId != "") {
		title = title + "(Assignment " + clue.assignmentId + ")";
	} else {
		title = title + "(No Asssignment)";
	}
	s.attr('title', title);

	s.appendTo(line).click(function() {
		if(org.sarsoft.mobile) imap.registered["org.sarsoft.DataNavigatorToggleControl"].hideDataNavigator();
		that.imap.setCenter(new google.maps.LatLng(clue.position.lat, clue.position.lng));
	});
	
	
	if((org.sarsoft.userPermissionLevel == "WRITE" || org.sarsoft.userPermissionLevel == "ADMIN")) {	
		jQuery('<span title="Delete" style="cursor: pointer; float: right; margin-right: 10px; font-weight: bold; color: red">-</span>').appendTo(line).click(function() {
			that.delconfirm.clue = clue; that.delconfirm.show();
		});
		jQuery('<span title="Edit" style="cursor: pointer; float: right; margin-right: 5px;"><img src="' + org.sarsoft.imgPrefix + '/edit.png"/></span>').appendTo(line).click(function() {
			var c = that.clues[clue.id];
			that.imap.allowDragging(c.position);
			that.clueDlg.entityform.write(c);
			that.clueDlg.show();
			that.clueDlg.clue=c;
		});
	}

	var line = jQuery('<div></div>').appendTo(this.dn.clues[clue.id]);

}

org.sarsoft.controller.ClueLocationMapController.prototype.showClue = function(clue) {
	if(this.clues[clue.id] != null) this.imap.removeWaypoint(this.clues[clue.id].position);
	if(clue.position == null) return;
	this.clues[clue.id] = clue;
	this.DNAddClue(clue);
	if(!this.showClues) return; // need lines above this in case the user re-enables clues

	var config = new Object();	
	var tooltip = clue.description;
	
	if(clue.assignmentId != null && clue.assignmentId > 0) {
		tooltip = tooltip + " (Assignment " + clue.assignmentId + ")";
	}
	
	var icon = org.sarsoft.MapUtil.createImage(16, "/static/images/clue.png");
	this.imap.addWaypoint(clue.position, {icon: icon}, tooltip, clue.summary);
}

org.sarsoft.controller.ClueLocationMapController.prototype.removeClue = function(clue) {
	if(this.clues[clue.id] != null) this.imap.removeWaypoint(this.clues[clue.id].position);
	delete this.clues[clue.id];
	this.dn.clues[clue.id].remove();
	delete this.dn.clues[clue.id];
}

org.sarsoft.controller.ClueLocationMapController.prototype.refresh = function(clues) {
	var that = this;

	var timestamp = this.clueDAO._timestamp;
	for(var i = 0; i < clues.length; i++) {
		this.showClue(clues[i]);
	}
}

org.sarsoft.controller.ClueLocationMapController.prototype.handleSetupChange = function() {
	// TODO update show/hide clue toggle
	if(!this.showClues) {
		for(var key in this.clues) {
			this.imap.removeWaypoint(this.clues[key].position);
		}
	} else {
		for(var key in this.clues) {
			this.showClue(this.clues[key]);
		}
	}
}


*/
