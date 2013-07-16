org.sarsoft.MapObjectChildDialog = function(imap, controller, title) {
	var that = this;
	this.imap = imap;
	this.controller = controller;
	this.body = $('<div style="height: 150px; width: 95%"></div>');
	
	this.tabs = new Object();
	
	this.tabview = new YAHOO.widget.TabView();
	this.tabview.appendTo(this.body[0]);
	
	this.dialog = new org.sarsoft.view.MapDialog(imap, title, this.body, null, "OK", function() {});
}

org.sarsoft.MapObjectChildDialog.prototype.addTab = function(type, title) {
	var div = $('<div style="float: left; width: 90%"></div>');
	this.tabs[type] = {
		div : div,
		tab : new YAHOO.widget.Tab({label: title, contentEl: div[0]})
	}
	this.tabview.addTab(this.tabs[type].tab);
}

org.sarsoft.MapObjectChildDialog.prototype.addChildTab = function(type, title, coldefs, deleteable) {
	var that = this;
	this.addTab(type, title);
	
	var div = this.tabs[type].div;
	this.tabs[type].message = $('<div>No ' + title + ' found</div>').appendTo(div);
	this.tabs[type].content = $('<div></div>').appendTo(div);
	
	if(deleteable && org.sarsoft.writeable) {
		coldefs[0].formatter = function(cell, record, column, data) { $(cell).html("<span style='color: red; font-weight: bold'>X</span>").click(function(evt) {
			evt.stopPropagation();
			org.sarsoft.MapState.daos[type].del(record.getData().id, function() { that.tabs[type].table.table.deleteRow(record) });
		})}
	}
	
	this.tabs[type].table = new org.sarsoft.view.EntityTable(coldefs, { height: "120px" }, function(obj) {
		if(that.controller.childControllers[type]) that.controller.childControllers[type].focus(obj);
	});
	this.tabs[type].table.create(this.tabs[type].content[0]);
}

org.sarsoft.MapObjectChildDialog.prototype.show = function(obj) {
	var obj = this.obj = this.controller.obj(obj);
	
	for(var type in this.tabs) {
		var table = this.tabs[type].table;
		if(table) {
			table.clear();
			table.update(this.controller.dao.children(obj, type));
			var length = table.table.getRecordSet().getLength();
			this.tabs[type].message.css('display', (length > 0) ? 'none' : 'block');
			this.tabs[type].content.css('display', (length > 0) ? 'block' : 'none');
		}
	}
	
	this.tabview.selectTab(0);
	this.dialog.show();
	google.maps.event.trigger(this.imap.map, "resize");
}

org.sarsoft.OperationalPeriodDAO = function() {
	org.sarsoft.MapObjectDAO.call(this, "OperationalPeriod");
	this.baseURL = "/rest/op";
	this.childTypes = { Assignment : "operationalPeriodId" }

}

org.sarsoft.OperationalPeriodDAO.prototype = new org.sarsoft.MapObjectDAO();

org.sarsoft.OperationalPeriodChildDialog = function(imap, controller) {
	org.sarsoft.MapObjectChildDialog.call(this, imap, controller, "OperationalPeriod");
	var that = this;

	if(sarsoft.tenant != null && org.sarsoft.writeable) {
		this.addTab("action", "Actions");
		
		var div = this.tabs['action'].div;
		var left = $('<ul></ul>').appendTo(div);
		$('<a href="#">Bulk Operations - This Period</a>').appendTo($('<li></li>').appendTo(left)).click(function() {
			window.open('/sar/bulk?op=' + that.obj.id, '_blank');
			return false;
		});
		$('<a href="#">Bulk Operations - All Assignments</a>').appendTo($('<li></li>').appendTo(left)).click(function() {
			window.open('/sar/bulk', '_blank');
			return false;
		});
	}
	
	this.addChildTab("Assignment", "Assignments", [
		{ key : "number", label : ""},
		{ key : "resourceType", label : "type"},
		{ key : "updated", label : "Uploaded", formatter : function(cell, record, column, data) { var date = new Date(1*data); cell.innerHTML = date.toUTCString();}}]);
}

org.sarsoft.OperationalPeriodChildDialog.prototype = new org.sarsoft.MapObjectChildDialog();


org.sarsoft.OperationalPeriodController = function(imap, background_load) {
	var that = this;
	imap.register("org.sarsoft.OperationalPeriodController", this);
	org.sarsoft.MapObjectController.call(this, imap, {name: "OperationalPeriod", dao: org.sarsoft.OperationalPeriodDAO, label: "Operational Periods"}, background_load);
	this.dn.sortable = true;
	this.dn.cb.css('display', 'none');
	this.cb = new Array();
	
	this.childDlg = new org.sarsoft.OperationalPeriodChildDialog(imap, this);

	if(org.sarsoft.writeable && !background_load) {
		this.buildAddButton(0, "Operational Period", function(point) {
			that.dlg.show({create: true}, point);
		});

		var form = new org.sarsoft.view.EntityForm([{ name : "description", label: "Name", type : "string"}]);
		
		this.dlg = new org.sarsoft.view.MapEntityDialog(imap, "Operational Period", form, function(period) {
			period.id = that.dlg.id;
			that.dlg.id = null;
			if(period.id == null) {
				that.dao.create(period);
			} else {
				that.dao.save(period.id, period);
			}
		}, "OK");
	}
}

org.sarsoft.OperationalPeriodController.prototype = new org.sarsoft.MapObjectController();
sarsoft.Controllers["OperationalPeriod"] = [11, org.sarsoft.OperationalPeriodController];

org.sarsoft.OperationalPeriodController.prototype.show = function(object) {
	var that = this;
	org.sarsoft.MapObjectController.prototype.show.call(this, object);
	
	var line = this.dn.add(object.id, object.description, function() { that.childDlg.show(object.id); return true });
	var cb = this.cb[object.id] = $('<input type="checkbox" checked="checked">').appendTo('<div></div>').click(function(evt) { evt.stopPropagation() }).change(function() { that.handleSetupChange(true) });
	line.prepend(cb.parent());
	
	if(org.sarsoft.writeable) {
		this.dn.addIconEdit(object.id, function() {
			that.dlg.show(object);
			that.dlg.id = object.id;
		});
		this.dn.addIconDelete(object.id, function() {
			that.del(function() { that.dao.del(object.id); });
		});
	}
	
}

org.sarsoft.OperationalPeriodController.prototype.getChildConfig = function(id) {
	if(!this.cb[id]) return { active : true, visible: true }
	var visible = this.cb[id][0].checked;
	if(!visible) return { active : false, visible : false}
	var found = false;
	for(var i = 0; i < this.dn.sorted.length; i++) {
		if(found && this.dn.sorted[i].find('input')[0].checked) return { active : false, visible : true }
		if(this.dn.sorted[i] == this.dn.lines[id]) found = true;
	}
	return { active : true, visible : true}
	for(var i = id + 1; i < this.cb.length; i++) {
		if(this.cb[i] != null && this.cb[i][0].checked) return { active : false, visible : true }
	}
	return { active : true, visible : true}
}

org.sarsoft.OperationalPeriodController.prototype.handleSetupChange = function(cascade) {
	if(cascade) for(var key in this.childControllers) {
		this.childControllers[key].handleSetupChange(cascade);
	}
}

org.sarsoft.AssignmentTable = function() {
	var status = { "DRAFT" : 0, "PREPARED" : 1, "INPROGRESS" : 2, "COMPLETED" : 3};
	var pod = {"LOW" : 0, "MEDIUM" : 1, "HIGH" : 2};
	var coldefs = [
		{ key : "id", label : "Number", sortable: true},
		{ key : "resourceType", label : "Resource Type", sortable: true},
		{ key : "status", label : "Status", sortable: true, formatter: org.sarsoft.view.getColorFormatter({DRAFT: "#0088FF", INPROGRESS: "#FF0000", PREPARED: "#FF8800", COMPLETED: "#8800FF"}), sortOptions: {sortFunction: function(a, b, desc) { 
			return YAHOO.util.Sort.compare(status[a.getData("status")], status[b.getData("status")], desc); 
			}} },
		{ key : "formattedSize", label : "Size", sortable: true},
		{ key : "timeAllocated", label : "Time Allocated", sortable : true},
		{ key : "responsivePOD", label : "Responsive POD", sortable : true, formatter: org.sarsoft.view.getColorFormatter({MEDIUM: "#FF8800", HIGH: "#FF0000", LOW: "#0088FF"}), sortOptions : {sortFunction: function(a, b, desc) { return YAHOO.util.Sort.compare(pod[a.getData("responsivePOD")], pod[b.getData("responsivePOD")], desc)}}},
		{ key : "details", label : "Details", formatter : function(cell, record, column, data) { $(cell).css({overflow: "hidden", "max-height": "1em", "max-width": "40em"}); cell.innerHTML = data;}}
	];
	org.sarsoft.view.EntityTable.call(this, coldefs, { }, function(assignment) { } );
}
org.sarsoft.AssignmentTable.prototype = new org.sarsoft.view.EntityTable();

org.sarsoft.AssignmentDAO = function() {
	org.sarsoft.WayObjectDAO.call(this, "Assignment", "/rest/assignment", "segment");
	this.label = "number";
	this.childTypes = { Clue : "assignmentId", FieldTrack: "assignmentId", FieldWaypoint: "assignmentId", Resource: "assignmentId" }
}

org.sarsoft.AssignmentDAO.prototype = new org.sarsoft.WayObjectDAO();

org.sarsoft.AssignmentDAO.prototype.validate = function(obj, override) {
	obj = org.sarsoft.WayObjectDAO.prototype.validate.call(this, obj, override);

	if(obj.formattedSize == null || override) {
		if(obj.segment.polygon) {
			var area = google.maps.geometry.spherical.computeArea(GeoUtil.wpts2path(obj.segment.waypoints))/1000000;
			obj.formattedSize = Math.round(area*100)/100 + " km&sup2; / " + (Math.round(area*38.61)/100) + "mi&sup2;";
		} else {
			var distance = google.maps.geometry.spherical.computeLength(GeoUtil.wpts2path(obj.segment.waypoints))/1000;
			obj.formattedSize = Math.round(distance*100)/100 + " km / " + (Math.round(distance*62.137)/100) + " mi";
		}
	}
	
	return obj;
}

org.sarsoft.AssignmentDAO.prototype.saveSegment = function(assignment, waypoints, handler) {
	this.saveWay(assignment, waypoints, handler);
}

org.sarsoft.AssignmentForm = function() {
}

org.sarsoft.AssignmentForm.prototype.create = function(container) {
	var that = this;
	var row = jQuery('<tr></tr>').appendTo(jQuery('<tbody></tbody>').appendTo(jQuery('<table style="border: 0; width: 95%"></table>').appendTo(container)));
	var left = $('<td width="35%" valign="top"></td>').appendTo(row);
	var right = jQuery('<td width="60%" valign="top" style="padding-left: 20px"></td>').appendTo(row);
	
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
	this.fields.timeAllocated = build('<input type="text"/>', 'Time (hours)');
	this.fields.primaryFrequency = build('<input type="text"/>', 'Primary Freq');
	this.fields.secondaryFrequency = build('<input type="text"/>', 'Secondary Freq');

	this.fields.details = $('<textarea style="width: 100%" rows="3"></textarea').appendTo($('<div>Details</div>').appendTo(right));
	this.fields.previousEfforts = $('<textarea style="width: 100%" rows="2"></textarea').appendTo($('<div>Previous Efforts</div>').appendTo(right));
	this.fields.transportation = $('<textarea style="width: 100%" rows="2"></textarea').appendTo($('<div>Transportation</div>').appendTo(right));
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
	if(obj.operationalPeriodId == null) this.fields.operationalPeriodId.append('<option value="">N/A</option>');
	var periods = org.sarsoft.MapState.daos["OperationalPeriod"].objs;
	periods = periods.slice(0, periods.length).sort(function(a, b) {
		if((a.description || "") == (b.description || "")) return 0;
		return ((a.description || "") < (b.description || "")) ? -1 : 1;
	});
	for(var i = 0; i < periods.length; i++) {
		if(periods[i] != null) this.fields.operationalPeriodId.append('<option value="' + periods[i].id + '">' + periods[i].description + '</option>');
	}
	for(var key in this.fields) {
		this.fields[key].val(obj[key]);
	}
}

org.sarsoft.AssignmentChildDialog = function(imap, controller) {
	org.sarsoft.MapObjectChildDialog.call(this, imap, controller, "Assignment");
	var that = this;
	
	if(sarsoft.tenant != null) {
		this.addTab("action", "Actions");
		
		var div = this.tabs['action'].div;
		var left = $('<ul></ul>').appendTo($('<div style="float: left; padding-right: 20px;"></div>').appendTo(div));
		$('<a href="#">Print 104 Form</a>').appendTo($('<li></li>').appendTo(left)).click(function() {
			window.open('/sar/104?ids=' + that.obj.id, '_blank');
			return false;
		});
		$('<a href="#">Print Browser Map</a>').appendTo($('<li></li>').appendTo(left)).click(function() {
			window.open('/sar/maps/browser?ids=' + that.obj.id, '_blank');
			return false;
		});
		$('<a href="#">Auto PDF Map</a>').appendTo($('<li></li>').appendTo(left)).click(function() {
			window.open('/sar/maps/pdf?ids=' + that.obj.id + '&layer=' + org.sarsoft.EnhancedGMap.toLayerStr(imap.getConfig()), '_blank');
			return false;
		});
		$('<a href="#">Custom PDF Map</a>').appendTo($('<li></li>').appendTo(left)).click(function() {
			window.open('/sar/print?ids=' + that.obj.id, '_blank');
			return false;
		});
	
		if(org.sarsoft.writeable) {
			var right = $('<div style="float: left">Clean up Tracks and Waypoints:</div>').appendTo(div);
			var line = $('<div>more than </div>').appendTo(right);
			var in_dist = $('<input type="text" size="5" value="15"/>').appendTo(line);
			line.append(' km from assignment');
			$('<button style="margin-left: 10px">GO</button>').appendTo(line).click(function() {
				that.controller.dao._doPost("/" + that.obj.id + "/clean", function(state) { that.updateCleanedTracks(state) }, null, "radius=" + in_dist.val());
			});
			
			var line = $('<div>more than </div>').appendTo(right);
			var in_time = $('<input type="text" size="3" value="24"/>').appendTo(line);
			line.append(' hours (if timestamps recorded)');
			$('<button style="margin-left: 10px">GO</button>').appendTo(line).click(function() {
				that.controller.dao._doPost("/" + that.obj.id + "/clean", function(state) { that.updateCleanedTracks(state) }, null, "time=" + in_time.val());
			});
		}
		div.append('<div style="clear: both"></div>');
		
		if(org.sarsoft.writeable) {
			this.addTab("imp", "Import");
			this.tabs['imp'].div.append('<div>Import Tracks and Waypoints:</div>');
			this.imp = new Object();
			this.imp.importer = new org.sarsoft.widget.Importer(this.tabs['imp'].div, '/rest/in?tid=' + (sarsoft.tenant ? sarsoft.tenant.name : ''));
			$(this.imp.importer).bind('success', function() { that.dialog.hide(); })
			
		}
	}

	this.addChildTab("FieldTrack", "Tracks", [
		{ key : "id", label : ""},
		{ key : "label", label : "Name"},
		{ key : "updated", label : "Uploaded", formatter : function(cell, record, column, data) { var date = new Date(1*data); cell.innerHTML = date.toUTCString();}}], true);
	
	this.addChildTab("FieldWaypoint", "Waypoints", [
		{ key : "id", label : ""},
		{ key : "name", label : "Name"},
		{ key : "updated", label : "Uploaded", formatter : function(cell, record, column, data) { var date = new Date(1*data); cell.innerHTML = date.toUTCString();}}], true);
	
	this.addChildTab("Clue", "Clues", [
 	      { key : "id", label : "Clue #"},
	      { key : "summary", label : "Item Found"},
	      { key : "assignmentId", label : "Team"},
		  { key : "position", label : "Location Found", formatter : function(cell, record, column, data) { if(data == null) return; var gll = {lat: function() {return data.lat;}, lng: function() {return data.lng;}}; cell.innerHTML = GeoUtil.GLatLngToUTM(GeoUtil.fromWGS84(gll)).toString();}},
		  { key : "instructions", label: "Instructions"}]);

	this.addChildTab("Resource", "Resources", [
		{ key : "name", label : "Name", sortable : true},
		{ key : "agency", label : "Agency", sortable : true},
		{ key : "type", label : "Type", sortable : true},
		{ key : "callsign", label : "Callsign"},
		{ key : "lastFix", label : "Last Update", sortable : true }]);
	
	var container = this.tabs['Resource'].div;
	$(container.children()[1]).css('float', 'left');
	var div = $('<div style="float: left; padding-left: 10px">Add Resource: </div>').appendTo(container);
	container.append('<div style="clear: both"></div>');
	this.s_resource = $('<select></select>').appendTo(div);
	$('<button>Add</button>').appendTo(div).click(function() {
		var id = that.s_resource.val();
		var resource = org.sarsoft.MapState.daos["Resource"].getObj(id);
		resource.assignmentId = that.obj.id;
		org.sarsoft.MapState.daos["Resource"].save(resource.id, resource, function(r) {
			that.tabs["Resource"].table.update([r]);
			that.tabs["Resource"].message.css('display', 'none');
			that.tabs["Resource"].content.css('display', 'block');
			that.s_resource.find('[value="' + r.id + '"]').remove();
		});
	});
}

org.sarsoft.AssignmentChildDialog.prototype = new org.sarsoft.MapObjectChildDialog();

org.sarsoft.AssignmentChildDialog.prototype.show = function(id) {
	var that = this;
	if(this.imp) this.imp.importer.clear('/rest/assignment/' + id + '/in');

	this.s_resource.empty();
	var mine = this.controller.dao.children(this.controller.obj(id), "Resource");
	var all = org.sarsoft.MapState.daos["Resource"].objs;
	for(var i = 0; i < all.length; i++) {
		var obj = all[i];
		if(obj != null && mine.indexOf(obj) < 0) this.s_resource.append('<option value="' + obj.id + '">' + obj.name + (obj.assignmentId ? ' (' + that.controller.dao.getObj(obj.assignmentId).number  + ')' : '') + '</option>');
	}

	org.sarsoft.MapObjectChildDialog.prototype.show.call(this, id);
}

org.sarsoft.AssignmentChildDialog.prototype.updateCleanedTracks = function(state) {
	var tc = this.controller.childControllers["FieldTrack"];
	var wc = this.controller.childControllers["FieldWaypoint"];

	if(state.FieldTrack) {
		for(var i = 0; i < state.FieldTrack.length; i++) {
			var track = state.FieldTrack[i];
			if(track.way.waypoints.length < 2) {
				delete tc.dao.objs[track.id];
				tc.remove(track);
			} else {
				tc.dao.setObj(track.id, track);
				tc.show(track);
			}
		}
	}

	if(state.FieldWaypoint) {
		for(var i = 0; i < state.FieldWaypoint.length; i++) {
			var fwpt = state.FieldWaypoint[i];
			delete wc.dao.objs[fwpt.id];
			wc.remove(fwpt);
		}
	}
	
	this.dialog.hide();
}

org.sarsoft.AssignmentController = function(imap, background_load) {
	var that = this;
	imap.register("org.sarsoft.AssignmentController", this);
	this.parentController = imap.registered["org.sarsoft.OperationalPeriodController"];
	this.parentController.childControllers["Assignment"] = this;
	this.config = { show : "NA", color: "NA" }

	org.sarsoft.WayObjectController.call(this, imap, {name: "Assignment", dao: org.sarsoft.AssignmentDAO, label: "Assignments", geo: true, way : "segment"}, background_load);
	this.dn.sortable = true;

	this.childDlg = new org.sarsoft.AssignmentChildDialog(imap, this);
	
	this.configDiv = $('<div style="display: none"></div>').prependTo(this.dn.tree.body);
	
	var line = $('<div style="clear: both">Show:</div>').appendTo(this.configDiv);
	this.s_show = $('<select style="float: right"><option value="NA">All Assignments</option><option>GROUND</option><option>DOG</option><option>MOUNTED</option><option>OHV</option></select>').appendTo(line).change(function() {
		that.config.show = that.s_show.val();
		that.handleSetupChange(true);
	});

	var line = $('<div style="clear: both">Color By:</div>').appendTo(this.configDiv);
	this.s_color = $('<select style="float: right"><option value="NA">N/A</option><option value="id">Random</option><option value="color_type">Resource Type</option><option value="probability">POD</option><option value="status">Status</option></select>').appendTo(line).change(function() {
		that.config.color = that.s_color.val();
		that.handleSetupChange(true);
	});
	
	this.dn.tree.getTool().html('<img src="' + $.img('config.png') + '"/>CFG').
	attr("title", "Color and Visibility").click(function(evt) { evt.stopPropagation(); that.configDiv.css('display', (that.configDiv.css('display') == 'block' ? 'none' : 'block')) });
	
	if(org.sarsoft.writeable && !background_load) {
		this.buildAddButton(0, "Line Assignment", function(point) {
			that.dlg.show({create: true, operationalPeriodId: that.parentController.dao.getMaxId(), segment: {polygon: false}}, point);
		});

		this.buildAddButton(0, "Area Assignment", function(point) {
			that.dlg.show({create: true, operationalPeriodId: that.parentController.dao.getMaxId(), segment: {polygon: true}}, point);
		});
		
		
		this.dlg = new org.sarsoft.view.MapObjectEntityDialog(imap, "Assignment Details", new org.sarsoft.AssignmentForm(), this);
		this.dlg.create = function(assignment) {
			assignment.segment = {type: "ROUTE", polygon: this.object.segment.polygon};
			if(this.object.segment.waypoints != null) {
				assignment.segment.waypoints = this.object.segment.waypoints.slice(0, this.object.segment.waypoints.length);
				that.dao.create(assignment, function(obj) { that.show(obj) });
			} else {
				assignment.segment.waypoints = that.imap.getNewWaypoints(this.point, this.object.segment.polygon);
				that.dao.create(assignment, function(obj) {
					that.redraw(obj, function() { that.save(obj, function() { that.show(obj);}); }, function() { that.dao.del(obj.id); });
				});
			}
		};
		
		var pc = function(obj) {
			var r = that._contextMenuCheck(obj);
			r.clickable = r.obj != null && that.attr(r.obj, "clickable");
			return r;
		}
		
		this.imap.addContextMenuItems([
		    { text: "New Assignment", applicable: this.cm.a_none, handler: function(data) { that.dlg.show({create: true, operationalPeriodId: that.parentController.dao.getMaxId(), segment : {polygon: true}}, data.point)}},
		    { text: "Drag Vertices", precheck: pc, applicable: function(obj) { return obj.clickable && !obj.inedit }, handler: this.cm.h_drag},
		    { text: "Clone Assignment", precheck: pc, applicable: function(obj) { return obj.clickable && !obj.inedit }, handler: function(data) {
		    	var a = data.pc.obj;
		    	that.dlg.point = null;
		    	that.dlg.original = a;
		    	that.dlg.show({create: true, operationalPeriodId : a.operationalPeriodId, segment: a.segment, resourceType: a.resourceType, unresponsivePOD: a.unresponsivePOD, responsivePOD: a.responsivePOD, cluePOD: a.cluePOD, timeAllocated: a.timeAllocated, details: a.details});
		    }},
    		{text : "Save Changes", precheck: pc, applicable : this.cm.a_editnodlg, handler: this.cm.h_save },
    		{text : "Discard Changes", precheck: pc, applicable : this.cm.a_editnodlg, handler: this.cm.h_discard },
    		{text : "Delete Assignment", precheck: pc, applicable : this.cm.a_noedit, handler: this.cm.h_del }
		    ]);
	}
		
}

org.sarsoft.AssignmentController.prototype = new org.sarsoft.WayObjectController();
sarsoft.Controllers["Assignment"] = [12, org.sarsoft.AssignmentController];

org.sarsoft.AssignmentController.prototype._saveWay = function(obj, waypoints, handler) {
	this.dao.saveSegment(obj, waypoints, handler)
}

org.sarsoft.AssignmentController.prototype.getColor = function(assignment, colorby) {
	if(colorby == "id") return sarsoft.constants.color_id[assignment.id % sarsoft.constants.color_id.length];
	if(colorby == "probability") return sarsoft.constants.color_probability[assignment.responsivePOD];
	if(colorby == "status") return sarsoft.constants.color_status[assignment.status];
	if(colorby == "type") return sarsoft.constants.color_type[assignment.resourceType];
	return "#FF0000";
}

org.sarsoft.AssignmentController.prototype.getConfig = function(assignment) {
	var cfg = this.parentController.getChildConfig(assignment.operationalPeriodId);

	var visible = cfg.visible;
	if(this.config.show != "NA" && this.config.show != assignment.resourceType) visible = false;
	
	var color = cfg.active ? this.getColor(assignment, this.config.color) : "#000000";
	
	return { color : color, weight: 2, fill : (cfg.active ? 30 : 0), active : cfg.active, visible : visible }
}

org.sarsoft.AssignmentController.prototype.getChildConfig = function(id) {
	var obj = this.obj(id);
	if(obj == null) return { active : true, visible : true, color : "#FF0000", weight: 2, fill : 30 }
	return this.getConfig(obj);
}

org.sarsoft.AssignmentController.prototype.show = function(assignment) {
	var that = this;
	this.imap.removeWay(assignment.segment);
	if(assignment.segment == null) return;
	org.sarsoft.MapObjectController.prototype.show.call(this, assignment);
	
	var config = this.getConfig(assignment);
	if(!config.visible) {
		if(this.dn != null) this.dn.remove(assignment.id);
		return;
	}
	
	this.DNAddLine(assignment, function() { that.childDlg.show(assignment.id); });
	if((assignment.comments || "").length > 0) this.dn.addComments(assignment.id, assignment.comments);

	this.DNAddProfile(assignment);
	if(org.sarsoft.writeable) {
		this.DNAddEdit(assignment);
		this.DNAddDelete(assignment);
	}
	
	this.attr(assignment, "clickable", config.active);
	if(this.dn.visible && config.visible) {
		this.imap.addWay(assignment.segment, {displayMessage: org.sarsoft.htmlescape(assignment.number) + " " + assignment.resourceType + " (" + assignment.formattedSize + ")", clickable : config.active, fill: config.fill, color: config.color, weight: config.weight}, org.sarsoft.htmlescape(assignment.number));
	}
}

org.sarsoft.AssignmentChildForm = function() {
}

org.sarsoft.AssignmentChildForm.prototype.create = function(container) {
	this.container = container;
	this.fields = new Object();
}

org.sarsoft.AssignmentChildForm.prototype.build = function(input, label, div) {
	input = $(input);
	$('<div class="item"><span class="label">' + label + '</span></div>').appendTo(div ? div : this.container).append($('<div style="float: left"></div>').append(input));
	return input;
}

org.sarsoft.AssignmentChildForm.prototype.read = function() {
	var obj = {}
	for(var key in this.fields) {
		obj[key] = this.fields[key].val();
	}
	return obj;
}

org.sarsoft.AssignmentChildForm.prototype.write = function(obj) {
	this.fields.assignmentId.empty();
	if(obj.assignmentId == null) this.fields.assignmentId.append('<option value="">N/A</option>');
	var assignments = org.sarsoft.MapState.daos["Assignment"].objs;
	for(var i = 0; i < assignments.length; i++) {
		if(assignments[i] != null) this.fields.assignmentId.append('<option value="' + i + '">' + assignments[i].number + '</option>');
	}
	for(var key in this.fields) {
		this.fields[key].val(obj[key]);
	}
}


org.sarsoft.ClueDAO = function() {
	org.sarsoft.WaypointObjectDAO.call(this, "Clue", "/rest/clue");
	this.label = "summary";
}

org.sarsoft.ClueDAO.prototype = new org.sarsoft.WaypointObjectDAO();


org.sarsoft.ClueForm = function() {
	org.sarsoft.AssignmentChildForm.call(this);
}

org.sarsoft.ClueForm.prototype = new org.sarsoft.AssignmentChildForm();

org.sarsoft.ClueForm.prototype.create = function(container) {
	org.sarsoft.AssignmentChildForm.prototype.create.call(this, container);
	var that = this;

	var row = jQuery('<tr></tr>').appendTo(jQuery('<tbody></tbody>').appendTo(jQuery('<table style="border: 0; width: 100%"></table>').appendTo(container)));
	var left = $('<td width="35%" valign="top"></td>').appendTo(row);
	var right = jQuery('<td width="60%" valign="top" style="padding-left: 20px"></td>').appendTo(row);
	

	this.fields.summary = this.build('<input type="text"/>', 'Summary', left);
	this.fields.assignmentId = this.build('<select></select>', 'Assignment', left);
	this.fields.instructions = this.build('<select><option>COLLECT</option><option>MARK</option><option>IGNORE</option>', 'Instructions', left);

	this.fields.description = $('<textarea style="width: 100%" rows="3"></textarea').appendTo($('<div>Details</div>').appendTo(right));
	this.fields.location = $('<textarea style="width: 100%" rows="2"></textarea').appendTo($('<div>Location</div>').appendTo(right));
}

org.sarsoft.ClueController = function(imap, background_load) {
	var that = this;
	org.sarsoft.WaypointObjectController.call(this, imap, {name: "Clue", dao: org.sarsoft.ClueDAO, label: "Clues", geo: true, waypoint: "position"}, background_load);
	this.parentController = imap.registered["org.sarsoft.AssignmentController"];
	this.parentController.childControllers["Clue"] = this;

	this.dn.tree.getTool().html('<img src="' + $.img('details.png') + '"/>CSV').
	attr("title", "Export to CSV").click(function(evt) { evt.stopPropagation(); window.open('/sar/134', '_blank'); return false });

	if(!org.sarsoft.iframe && org.sarsoft.writeable && !background_load) {
		this.buildAddButton(0, "Clue", function(point) {
			that.dlg.show({url: "#FF0000"}, point);
		});

		this.dlg = new org.sarsoft.view.MapObjectEntityDialog(imap, "Clue Details", new org.sarsoft.ClueForm(), this);
		this.dlg.create = function(clue) {
			var wpt = that.imap.projection.fromContainerPixelToLatLng(new google.maps.Point(this.point.x, this.point.y));
			clue.position = {lat: wpt.lat(), lng: wpt.lng()};
			that.dao.create(clue);
		}

		var pc = function(obj) { return that._contextMenuCheck(obj) }
		
		if(org.sarsoft.writeable) {
			this.imap.addContextMenuItems([
			    {text : "New Clue", applicable : this.cm.a_none, handler: function(data) { that.dlg.show({}, data.point); }},
	    		{text : "Details", precheck: pc, applicable : that.cm.a_noedit, handler: that.cm.h_details },
	    		{text : "Drag to New Location", precheck: pc, applicable : that.cm.a_noedit, handler: that.cm.h_drag},
	    		{text : "Delete Clue", precheck: pc, applicable : that.cm.a_noedit, handler:  that.cm.h_del}
	    		]);
		}
	}
}

org.sarsoft.ClueController.prototype = new org.sarsoft.WaypointObjectController();
sarsoft.Controllers["Clue"] = [13, org.sarsoft.ClueController];

org.sarsoft.ClueController.prototype._saveWaypoint = function(id, waypoint, handler) {
	this.dao.updatePosition(id, waypoint, handler);
}

org.sarsoft.ClueController.prototype.DNGetIcon = function(obj) {
	return $('<div><img src="' + $.img('icons/clue.png') + '"/></div>');
}

org.sarsoft.ClueController.prototype.show = function(object) {
	var that = this;
	this.imap.removeWaypoint(object.position);
	
	org.sarsoft.MapObjectController.prototype.show.call(this, object);
	var config = this.parentController.getChildConfig(object.assignmentId);
	if(!config.visible) {
		if(this.dn != null) this.dn.remove(object.id);
		return;
	}
	
	this.DNAddLine(object);
	if((object.description || "").length > 0) this.dn.addComments(object.id, object.description);

	this.dn.addIcon(object.id, "Sar 135 Form", '<img src="' + $.img('details.png') + '"/>', function() {
		window.open('/sar/135?ids=' + object.id, '_blank');
	});
	if(org.sarsoft.writeable) {
		this.DNAddEdit(object);
		this.DNAddDelete(object);
	}
	
	if(this.dn.visible && config.visible) {
		var config = new Object();	
		var tooltip = org.sarsoft.htmlescape(object.summary || object.description);
		config.icon = org.sarsoft.MapUtil.createIcon('icons/clue.png');
		config.clickable = org.sarsoft.writeable;
		
		this.imap.addWaypoint(object.position, config, tooltip, tooltip);
	}
}

org.sarsoft.FieldWaypointDAO = function() {
	org.sarsoft.WaypointObjectDAO.call(this, "FieldWaypoint", "/rest/fieldwpt");
	this.label = "label";
}

org.sarsoft.FieldWaypointDAO.prototype = new org.sarsoft.WaypointObjectDAO();

org.sarsoft.FieldWaypointForm = function() {
	org.sarsoft.AssignmentChildForm.call(this);
}

org.sarsoft.FieldWaypointForm.prototype = new org.sarsoft.AssignmentChildForm();

org.sarsoft.FieldWaypointForm.prototype.create = function(container) {
	org.sarsoft.AssignmentChildForm.prototype.create.call(this, container);
	
	this.fields.label = this.build('<input type="text"/>', 'Label');
	this.fields.assignmentId = this.build('<select></select>', 'Assignment');
}

org.sarsoft.FieldWaypointController = function(imap, background_load) {
	var that = this;
	org.sarsoft.WaypointObjectController.call(this, imap, {name: "FieldWaypoint", dao : org.sarsoft.FieldWaypointDAO, label: "Waypoints", geo: true, waypoint: "position"}, background_load);
	this.parentController = imap.registered["org.sarsoft.AssignmentController"];
	this.parentController.childControllers["FieldWaypoint"] = this;
	
	if(!org.sarsoft.iframe && org.sarsoft.writeable && !background_load) {

		this.dlg = new org.sarsoft.view.MapObjectEntityDialog(imap, "Waypoint Details", new org.sarsoft.FieldWaypointForm(), this);
		var pc = function(obj) { return that._contextMenuCheck(obj) }
		
		if(org.sarsoft.writeable) {
			this.imap.addContextMenuItems([
				{text : "Details", precheck: pc, applicable : that.cm.a_noedit, handler: that.cm.h_details },
	    		{text : "Drag to New Location", precheck: pc, applicable : that.cm.a_noedit, handler: that.cm.h_drag},
				{text : "Delete Waypoint", precheck: pc, applicable : that.cm.a_noedit, handler:  that.cm.h_del}
				]);
		}
	}
}

org.sarsoft.FieldWaypointController.prototype = new org.sarsoft.WaypointObjectController();
sarsoft.Controllers["FieldWaypoint"] = [15, org.sarsoft.FieldWaypointController];

org.sarsoft.FieldWaypointController.prototype.growmap = function(obj) {
	// don't expand map due to wayward tracks and waypoints
}

org.sarsoft.FieldWaypointController.prototype._saveWaypoint = function(id, waypoint, handler) {
	this.dao.updatePosition(id, waypoint, handler);
}

org.sarsoft.FieldWaypointController.prototype.getConfig = function(obj) {
	obj = this.obj(obj);
	var config = this.parentController.getChildConfig(obj.assignmentId);
	config.icon = config.color;
	return config;
}

org.sarsoft.FieldWaypointController.prototype.show = function(object) {
	var that = this;
	this.imap.removeWaypoint(object.position);
	
	org.sarsoft.MapObjectController.prototype.show.call(this, object);
	var config = this.getConfig(object);
	if(!config.visible) {
		if(this.dn != null) this.dn.remove(object.id);
		return config;
	}
	
	this.DNAddLine(object);

	if(org.sarsoft.writeable) {
		this.DNAddEdit(object);
		this.DNAddDelete(object);
	}
	
	if(this.dn.visible && config.visible) {
		var wptcfg = new Object();	
		var tooltip = org.sarsoft.htmlescape(object.label);
		wptcfg.icon = org.sarsoft.MapUtil.createFlatCircleImage(config.color);
		wptcfg.clickable = org.sarsoft.writeable && config.active;
		
		this.imap.addWaypoint(object.position, wptcfg, tooltip, tooltip);
	}
}

org.sarsoft.FieldTrackDAO = function() {
	org.sarsoft.WayObjectDAO.call(this, "FieldTrack", "/rest/fieldtrack", "way");
	this.label = "label";
}

org.sarsoft.FieldTrackDAO.prototype = new org.sarsoft.WayObjectDAO();

org.sarsoft.FieldTrackDAO.prototype.validate = function(obj) {
	obj = org.sarsoft.WayObjectDAO.prototype.validate.call(this, obj);
	if(obj.way.boundingBox == null) this.addBoundingBox(obj.way);
	return obj;
}

org.sarsoft.FieldTrackForm = function() {
	org.sarsoft.AssignmentChildForm.call(this);
}

org.sarsoft.FieldTrackForm.prototype = new org.sarsoft.AssignmentChildForm();

org.sarsoft.FieldTrackForm.prototype.create = function(container) {
	org.sarsoft.AssignmentChildForm.prototype.create.call(this, container);
	
	this.fields.label = this.build('<input type="text"/>', 'Label');
	this.fields.assignmentId = this.build('<select></select>', 'Assignment');
}

org.sarsoft.FieldTrackController = function(imap, background_load) {
	var that = this;
	org.sarsoft.WayObjectController.call(this, imap, {name: "FieldTrack", dao: org.sarsoft.FieldTrackDAO, label: "Tracks", geo: true, way : "way"}, background_load);
	this.parentController = imap.registered["org.sarsoft.AssignmentController"];
	this.parentController.childControllers["FieldTrack"] = this;
	
	if(org.sarsoft.writeable && !background_load) {
		this.dlg = new org.sarsoft.view.MapObjectEntityDialog(imap, "Track Details", new org.sarsoft.FieldTrackForm(), this);
		
		this.sizewarning = $('<div style="font-weight: bold; color: red; display: none"></div>').prependTo(this.dlg.body);
		this.dlg.dialog.dialog.hideEvent.subscribe(function() {
			that.sizewarning.css('display', 'none');
		});

		var pc = function(obj) { return that._contextMenuCheck(obj) }
		
		if(org.sarsoft.writeable) {
			this.imap.addContextMenuItems([
			    {text : "Details", precheck: pc, applicable : this.cm.a_noedit, handler: this.cm.h_details },
    			{text : "Drag Vertices", precheck: pc, applicable : this.cm.a_noedit, handler : this.cm.h_drag },
	    		{text : "Save Changes", precheck: pc, applicable : this.cm.a_editnodlg, handler: this.cm.h_save },
	    		{text : "Discard Changes", precheck: pc, applicable : this.cm.a_editnodlg, handler: this.cm.h_discard },
    			{text : "Delete Track", precheck: pc, applicable : this.cm.a_noedit, handler: this.cm.h_del }
			    ]);
		}

	}
	
}

org.sarsoft.FieldTrackController.prototype = new org.sarsoft.WayObjectController();
sarsoft.Controllers["FieldTrack"] = [14, org.sarsoft.FieldTrackController];

org.sarsoft.FieldTrackController.prototype.growmap = function(obj) {
	// don't expand map due to wayward tracks and waypoints
}

org.sarsoft.FieldTrackController.prototype._saveWay = function(obj, waypoints, handler) {
	this.dao.saveWay(obj, waypoints, handler);
}

org.sarsoft.FieldTrackController.prototype.getConfig = function(obj) {
	obj = this.obj(obj);
	return this.parentController.getChildConfig(obj.assignmentId);
}

org.sarsoft.FieldTrackController.prototype.show = function(object) {
	var that = this;
	this.imap.removeWay(object.way);
	if(object.way == null) return;
	
	org.sarsoft.MapObjectController.prototype.show.call(this, object);
	
	var config = this.getConfig(object);
	if(!config.visible) {
		if(this.dn != null) this.dn.remove(object.id);
		return;
	}

	
	this.DNAddLine(object);
	this.DNAddProfile(object);

	if(org.sarsoft.writeable) {
		this.dn.addIconEdit(object.id, function() {
			 if(object.way.waypoints.length <= 500) {
				 that.edit(object);
			 } else {
				 that.sizewarning.css('display', 'block').html('Vertex editing is not possible on tracks with more than 500 waypoints (this one has ' + object.way.waypoints.length + ').');
			 }
			 that.dlg.show(object, null, true);
			 that.dlg.live = true;
		});
		this.DNAddDelete(object);
	}
	
	this.attr(object, "clickable", config.active);
	if(this.dn.visible && config.visible) {
		this.imap.addWay(object.way, {displayMessage: org.sarsoft.htmlescape(object.label), clickable : config.active, fill: config.fill, color: config.color, weight: config.weight}, org.sarsoft.htmlescape(object.label));
	}
}


org.sarsoft.AssignmentPrintMapController = function(container, ids) {
	var that = this;
	this.container = container;
	this.maps = {}
	this.dao = {
		assignment : org.sarsoft.MapState.daos["Assignment"] || new org.sarsoft.AssignmentDAO(),
		clue : org.sarsoft.MapState.daos["Clue"] || new org.sarsoft.ClueDAO(),
		track : org.sarsoft.MapState.daos["FieldTrack"] || new org.sarsoft.FieldTrackDAO(),
		waypoint : org.sarsoft.MapState.daos["FieldWaypoint"] || new org.sarsoft.FieldWaypointDAO()
	}
	
	this.header = $('<div class="noprint"></div>').appendTo(container);
	var cb_utm = $('<input type="checkbox">').prependTo($('<div>Show UTM Grid</div>').appendTo(this.header)).change(function() {
		for(var id in that.maps) {
			that.maps[id].utm.setValue(cb_utm[0].checked);
		}
	});

	var cb_tracks = $('<input type="checkbox">').prependTo($('<div>Show Overlapping Tracks From Other Assignments</div>').appendTo(this.header)).change(function() {
		for(var id in that.maps) {
			that.toggleTracks(id, cb_tracks[0].checked);
		}
	});

	this.showPrevious = false;
	this.previousEfforts = new Array();
	
	this.dao.clue.loadAll();
	this.dao.track.loadAll();
	this.dao.waypoint.loadAll();

	$(this.dao.assignment).bind('loadall', function(e, obj) { 
		if(ids == null || ids.indexOf(String(obj.id)) >= 0) that.create(obj);
	});
	
	this.dao.assignment.loadAll();
}

org.sarsoft.AssignmentPrintMapController.prototype.create = function(assignment) {
	var that = this;
	var id = assignment.id
	this.maps[id] = new Object();
	
	this.container.append('<div class="noprint" style="height: 40px"></div>');
	
	var div = this.maps[id].div = $('<div class="page"></div>').appendTo(this.container).css({'width' : '8in', 'height': '10in'});
	var map = this.maps[id].map = org.sarsoft.EnhancedGMap.createMap(div[0]);
	var imap = this.maps[id].imap = new org.sarsoft.InteractiveMap(map, {});
	this.maps[id].utm = new org.sarsoft.UTMGridControl(imap);
	
	if(Object.keys(this.maps).length == 1) {
		$(map._overlaymanager).bind('update', function(e, cfg) { that.copyConfig(id, cfg) });
	}
	
	this.maps[id].markers = new org.sarsoft.controller.MarkerController(imap, true);
	this.maps[id].shapes = new org.sarsoft.controller.ShapeController(imap, true);
	var configWidget = new org.sarsoft.view.PersistedConfigWidget(imap, false);
	configWidget.loadConfig();

	
	$('<div class="printonly" style="z-index: 2000; position: absolute; top: 0px; left: 0px; background: white">Assignment ' + assignment.id + ((assignment.status == "COMPLETED") ? ' Debrief' : '') + '</div>').appendTo(div);

	var bounds = new google.maps.LatLngBounds(GeoUtil.wpt2gll(assignment.segment.boundingBox[0]), GeoUtil.wpt2gll(assignment.segment.boundingBox[1]));
	imap.setBounds(bounds);
	imap.addWay(assignment.segment, {clickable : false, fill: false, color: "#FF0000", opacity: 100});
	
	var tracks = this.dao.assignment.children(assignment, "FieldTrack");
	for(var i = 0; i < tracks.length; i++) {
		var track = tracks[i];
		imap.addWay(track.way, {clickable: false, fill: false, color: "#FF8800", opacity: 100}, track.label);
	}
	
	var waypoints = this.dao.assignment.children(assignment, "FieldWaypoint");
	for(var i = 0; i < waypoints.length; i++) {
		var fwpt = waypoints[i];
		imap.addWaypoint(fwpt.position, { color: "#FF0000" }, fwpt.label, fwpt.label);
	}

	var clues = this.dao.assignment.children(assignment, "Clue");
	for(var i = 0; i < clues.length; i++) {
		var clue = clues[i];
		imap.addWaypoint(clue.position, { icon: org.sarsoft.MapUtil.createImage(16, "/static/images/clue.png") }, clue.summary, clue.description);
	}
	
}

org.sarsoft.AssignmentPrintMapController.prototype.toggleTracks = function(id, on) {
	var assignment = this.dao.assignment.objs[id];
	var imap = this.maps[id].imap;
	var bounds = new google.maps.LatLngBounds(GeoUtil.wpt2gll(assignment.segment.boundingBox[0]), GeoUtil.wpt2gll(assignment.segment.boundingBox[1]));
	for(var i = 0; i < this.dao.track.objs.length; i++) {
		var track = this.dao.track.objs[i];
		if(track == null) continue;
		var abounds = new google.maps.LatLngBounds(GeoUtil.wpt2gll(track.way.boundingBox[0]), GeoUtil.wpt2gll(track.way.boundingBox[1]));
		if(track.assignmentId != id && bounds.intersects(abounds)) {
			if(on) {
				imap.addWay(track.way, {clickable: false, fill: false, color: "#000000", opacity: 100});
			} else {
				imap.removeWay(track.way);
			}
		}
	}
}

org.sarsoft.AssignmentPrintMapController.prototype.copyConfig = function(sourceid, config) {
	for(var id in this.maps) {
		if(id == sourceid) continue;
		this.maps[id].imap.setConfig(config);
	}
}
