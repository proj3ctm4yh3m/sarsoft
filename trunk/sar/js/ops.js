org.sarsoft.ResourceDAO = function() {
	org.sarsoft.WaypointObjectDAO.call(this, "Resource", "/rest/resource");
	this.label = "name";
}

org.sarsoft.ResourceDAO.prototype = new org.sarsoft.WaypointObjectDAO();


org.sarsoft.ResourceForm = function() {
	org.sarsoft.AssignmentChildForm.call(this);
}

org.sarsoft.ResourceForm.prototype = new org.sarsoft.AssignmentChildForm();

org.sarsoft.ResourceForm.prototype.create = function(container) {
	org.sarsoft.AssignmentChildForm.prototype.create.call(this, container);
	var that = this;

	var div = $('<div></div>').appendTo(container);
	var form = $('<form method="post" enctype="multipart/form-data" name="resourceupload" action="/sar/resource">You can also load resources from CSV: </form>').appendTo(div);
	var input = $('<input type="file" name="file"/>').appendTo(form).change(function() { form[0].submit() });
	
	var row = jQuery('<tr></tr>').appendTo(jQuery('<tbody></tbody>').appendTo(jQuery('<table style="border: 0"></table>').appendTo(container)));
	var left = $('<td width="50%" valign="top"></td>').appendTo(row);
	var right = jQuery('<td width="50%" valign="top" style="padding-left: 20px"></td>').appendTo(row);
	
	this.fields.name = this.build('<input type="text"/>', 'Name', left);
	this.fields.assignmentId = this.build('<select></select>', 'Assignment', left);
	this.fields.type = this.build('<select><option value="PERSON">Person</option><option value="EQUIPMENT">Equipment</option></select>', 'Type', left);
	this.fields.agency = this.build('<input type="text"/>', 'Agency', left);
	
	this.fields.callsign = this.build('<input type="text"/>', 'Callsign', right);
	this.fields.spotId = this.build('<input type="text"/>', 'SPOT ID', right);
	this.fields.spotPassword = this.build('<input type="text"/>', 'SPOT Password', right);
}

org.sarsoft.ResourceForm.prototype.write = function(obj) {
	org.sarsoft.AssignmentChildForm.prototype.write.call(this, obj);
	this.fields['name'].focus();
}

org.sarsoft.ResourceController = function(imap, background_load) {
	var that = this;
	imap.register("org.sarsoft.ResourceController", this);
	org.sarsoft.WaypointObjectController.call(this, imap, {name: "Resource", dao: org.sarsoft.ResourceDAO, label: "Resources", geo: true, waypoint: "position"}, background_load);
	this.parentController = imap.registered["org.sarsoft.AssignmentController"];
	this.parentController.childControllers["Resource"] = this;
	this.refreshCount = 0;
	
	this.dn.tree.getTool().html('<img src="' + $.img('details.png') + '"/>CSV').
	attr("title", "Export to CSV").click(function(evt) { evt.stopPropagation(); window.open('/sar/resource', '_blank'); return false });
	
	if(!org.sarsoft.iframe && org.sarsoft.writeable && !background_load) {
		this.buildAddButton(0, "Resource", function(point) {
			that.dlg.show({ }, point);
		});

		this.dlg = new org.sarsoft.view.MapObjectEntityDialog(imap, "Resource Details", new org.sarsoft.ResourceForm(), this);
		this.dlg.create = function(resource) {
			resource.position = null;
			that.dao.create(resource);
		}

		var pc = function(obj) { return that._contextMenuCheck(obj) }
		
		if(org.sarsoft.writeable) {
			this.imap.addContextMenuItems([
			    {text : "New Resource", applicable : this.cm.a_none, handler: function(data) { that.dlg.show({}, data.point); }},
	    		{text : "Details", precheck: pc, applicable : that.cm.a_noedit, handler: that.cm.h_details },
	    		{text : "Drag to New Location", precheck: pc, applicable : that.cm.a_noedit, handler: that.cm.h_drag},
	    		{text : "Delete Resource", precheck: pc, applicable : that.cm.a_noedit, handler:  that.cm.h_del}
	    		]);
		}
	}
}

org.sarsoft.ResourceController.prototype = new org.sarsoft.WaypointObjectController();
sarsoft.Controllers["Resource"] = [16, org.sarsoft.ResourceController];

org.sarsoft.ResourceController.prototype.growmap = function(obj) {
	if(obj.position != null) org.sarsoft.WaypointObjectController.prototype.growmap.call(this, obj);
}

org.sarsoft.ResourceController.prototype.focus = function(obj) {
	if(obj.position != null) org.sarsoft.WaypointObjectController.prototype.focus.call(this, obj);
}

org.sarsoft.ResourceController.prototype.edit = function(obj) {
	if(obj.position != null) org.sarsoft.WaypointObjectController.prototype.edit.call(this, obj);
}

org.sarsoft.ResourceController.prototype.save = function(obj, handler) {
	if(obj.position != null) return org.sarsoft.WaypointObjectController.prototype.save.call(this, obj, handler);
	handler();
}

org.sarsoft.ResourceController.prototype.drag = function(obj) {
	if(obj.position != null) org.sarsoft.WaypointObjectController.prototype.drag.call(this, obj);
}

org.sarsoft.ResourceController.prototype.discard = function(obj) {
	if(obj.position != null) org.sarsoft.WaypointObjectController.prototype.discard.call(this, obj);
}

org.sarsoft.ResourceController.prototype.remove = function(obj) {
	if(obj.position != null) org.sarsoft.WaypointObjectController.prototype.remove.call(this, obj);
}


org.sarsoft.ResourceController.prototype._saveWaypoint = function(id, waypoint, handler) {
	this.dao.updatePosition(id, waypoint, handler);
}

org.sarsoft.ResourceController.prototype.getConfig = function(obj) {
	obj = this.obj(obj);
	var config = this.parentController.getChildConfig(obj.assignmentId);
	config.icon = config.color;
	delete config.color;
	
	var timestamp = org.sarsoft.MapState._timestamp || org.sarsoft.preload.timestamp;
	if(obj.position == null || (timestamp - (1*obj.position.time) > 300000 && (obj.assignmentId == null || obj.assignmentId == ""))) {
		config.icon = "#888888";
	}
	if(obj.position != null && timestamp - (1*obj.position.time) > 900000) {
		config.icon = "warning";
	}
	
	return config;
}

org.sarsoft.ResourceController.prototype.timer = function() {
	this.refreshCount++;
	if(this.refreshCount > 6) {
		this.refreshCount = 0;
		this.handleSetupChange();
	}	
}

org.sarsoft.ResourceController.prototype.show = function(object) {
	var that = this;
	if(object.position != null) this.imap.removeWaypoint(object.position);

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

	if(this.dn.visible && config.visible && object.position != null) {
		var wptcfg = new Object();	
		var tooltip = org.sarsoft.htmlescape(object.name);
		wptcfg.icon = org.sarsoft.MapUtil.createIcon(config.icon);
		wptcfg.clickable = org.sarsoft.writeable && config.active;
		
		this.imap.addWaypoint(object.position, wptcfg, tooltip, tooltip);
	}
}

org.sarsoft.CallsignDAO = function() {
	org.sarsoft.WaypointObjectDAO.call(this, "Callsign", "/rest/callsign");
	this.label = "name";
}

org.sarsoft.CallsignDAO.prototype = new org.sarsoft.WaypointObjectDAO();

org.sarsoft.CallsignDAO.prototype.setObj = function(id, obj) {
	if(obj != null && obj.position != null) obj.position.id = id;
	org.sarsoft.BaseDAO.prototype.setObj.call(this, id, obj);
}

org.sarsoft.CallsignController = function(imap, background_load) {
	var that = this;
	org.sarsoft.WaypointObjectController.call(this, imap, {name: "Callsign", dao: org.sarsoft.CallsignDAO, label: "Callsigns", geo: true, waypoint: "position"}, background_load);
	imap.register("org.sarsoft.CallsignController", this);
	this.refreshCount = 0;

	$('<span style="color: red; cursor: pointer">- Clear List</span>').appendTo(jQuery('<div style="padding-top: 1em; font-size: 120%"></div>').appendTo($('<div style="clear: both"></div>').appendTo(this.dn.tree.body))).click(function() {
		that.dao._doGet("/clear", function() {
			that.clearCallsigns();
		});
	});

}

org.sarsoft.CallsignController.prototype = new org.sarsoft.WaypointObjectController();
sarsoft.Controllers["Callsign"] = [17, org.sarsoft.CallsignController];

org.sarsoft.CallsignController.prototype.getConfig = function(obj) {
	var timestamp = org.sarsoft.MapState._timestamp || org.sarsoft.preload.timestamp;
	if(obj.position == null || (timestamp - (1*obj.position.time) > 600000)) return { icon : "#888888", visible : true }
	return { icon : "#FF0000", visible: true }
}

org.sarsoft.CallsignController.prototype.show = function(object) {
	var that = this;
	this.imap.removeWaypoint(object.position);

	org.sarsoft.MapObjectController.prototype.show.call(this, object);
	var config = this.getConfig(object);
	if(!config.visible) {
		if(this.dn != null) this.dn.remove(object.id);
		return config;
	}

	this.DNAddLine(object);

	if(this.dn.visible && config.visible && object.position != null) {
		var wptcfg = new Object();	
		var tooltip = org.sarsoft.htmlescape(object.name);
		wptcfg.icon = org.sarsoft.MapUtil.createFlatCircleImage(config.icon);
		wptcfg.clickable = org.sarsoft.writeable && config.active;
		
		this.imap.addWaypoint(object.position, wptcfg, tooltip, tooltip);
	}
}

org.sarsoft.CallsignController.prototype.timer = function() {
	this.dao.loadSince();
	this.dao.mark();
	this.refreshCount++;
	if(this.refreshCount > 6) {
		this.refreshCount = 0;
		this.handleSetupChange();
	}	
}

org.sarsoft.CallsignController.prototype.clearCallsigns = function() {
	for(var id in this.dao.objs) {
		this.remove(this.dao.objs[id]);
		delete this.dao.objs[id];
	}
	this.checkForObjects();
}
