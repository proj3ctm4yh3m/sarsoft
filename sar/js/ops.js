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

org.sarsoft.ResourceController = function(imap, background_load) {
	var that = this;
	imap.register("org.sarsoft.ResourceController", this);
	org.sarsoft.WaypointObjectController.call(this, imap, {name: "Resource", dao: org.sarsoft.ResourceDAO, label: "Resources", geo: true, waypoint: "position"}, background_load);
	this.parentController = imap.registered["org.sarsoft.AssignmentController"];
	this.parentController.childControllers["Resource"] = this;
	this.refreshCount = 0;
	
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

org.sarsoft.ResourceController.prototype.growmap = function(obj) {
	if(obj.position != null) org.sarsoft.WaypointObjectController.prototype.growmap.call(this, obj);
}

org.sarsoft.ResourceController.prototype._saveWaypoint = function(id, waypoint, handler) {
	this.dao.updatePosition(id, waypoint, handler);
}

org.sarsoft.ResourceController.prototype.getConfig = function(obj) {
	obj = this.obj(obj);
	var config = this.parentController.getChildConfig(obj.assignmentId);
	config.icon = config.color;
	
	var timestamp = this.dao._timestamp;
	if(obj.position == null || (timestamp - (1*obj.position.time) > 180000 && (obj.assignmentId == null || obj.assignmentId == ""))) {
		config.icon = config.color = '#CCCCCC';
	}
	if(obj.position != null && timestamp - (1*obj.position.time) > 900000) {
		config.icon = org.sarsoft.MapUtil.createImage(16, "/static/images/warning.png");
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
		var tooltip = org.sarsoft.htmlescape(object.label);
		wptcfg.icon = org.sarsoft.MapUtil.createFlatCircleImage(config.color);
		wptcfg.clickable = org.sarsoft.writeable && config.active;
		
		this.imap.addWaypoint(object.position, wptcfg, tooltip, tooltip);
	}
}

org.sarsoft.CallsignDAO = function() {
	org.sarsoft.WaypointObjectDAO.call(this, "Callsign", "/rest/callsign");
	this.label = "name";
}

org.sarsoft.CallsignDAO.prototype = new org.sarsoft.WaypointObjectDAO();

org.sarsoft.CallsignController = function(imap, background_load) {
	var that = this;
	org.sarsoft.WaypointObjectController.call(this, imap, {name: "Callsign", dao: org.sarsoft.CallsignDAO, label: "Callsigns", geo: true, waypoint: "position"}, background_load);
	imap.register("org.sarsoft.CallsignController", this);
}

org.sarsoft.CallsignController.prototype = new org.sarsoft.WaypointObjectController();

org.sarsoft.CallsignController.prototype.getConfig = function(obj) {
	return { icon : "#FF0000", color : "#FF0000" }
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
		var tooltip = org.sarsoft.htmlescape(object.label);
		wptcfg.icon = org.sarsoft.MapUtil.createFlatCircleImage(config.color);
		wptcfg.clickable = org.sarsoft.writeable && config.active;
		
		this.imap.addWaypoint(object.position, wptcfg, tooltip, tooltip);
	}
}

org.sarsoft.CallsignController.prototype.timer = function() {
	var that = this;
	this.dao.loadSince();
	this.dao.mark();
	this.expireCallsigns();
}

org.sarsoft.CallsignController.prototype.expireCallsigns = function() {
	var timestamp = this.dao._timestamp;
	for(var id in this.dao.objs) {
		var callsign = this.dao.objs[key];
		if(callsign.position != null && timestamp - (1*callsign.position.time) > 400000) {
			this.remove(callsign);
		}
	}
}

/*
org.sarsoft.view.ResourceImportDlg = function(id) {
	var that = this;
	var body = jQuery("<div><p>Data should be a comma separated file without character escaping.  Column ordering should match the file created when selecting 'Export to CSV'.</p><form method='post' enctype='multipart/form-data' name='resourceupload' action='/resource/'><input type='file' name='file'/><input type='hidden' name='format' value='csv'/></form></div>")[0];
	this.dialog = org.sarsoft.view.CreateDialog("Upload Resources as CSV", body, "Import", "Cancel", function() {
		document.forms['resourceupload'].submit();
		}, {width: "420px", left: "200px", top: "200px"});
}

org.sarsoft.controller.CallsignMapController = function(imap) {
	var that = this;
	this.callsignDAO = new org.sarsoft.ResourceDAO(function() { that.imap.message("Server Communication Error!"); }, "/rest/callsign");
	this.showCallsigns = true;
	this.callsigns = new Object();
	this._callsignId = -1;
	this.imap = imap;
	this.imap.register("org.sarsoft.controller.CallsignMapController", this);

	if(imap.registered["org.sarsoft.DataNavigator"] != null) {
		var dn = imap.registered["org.sarsoft.DataNavigator"];
		this.dn = new Object();
		var ctree = dn.addDataType("Callsigns");
		ctree.header.css({"font-size": "120%", "font-weight": "bold", "margin-top": "0.5em", "border-top": "1px solid #CCCCCC"});
		this.dn.cdiv = jQuery('<div></div>').appendTo(ctree.body);
		this.dn.callsigns = new Object();
		this.dn.cb = jQuery('<input type="checkbox"' + (that.showCallsigns ? ' checked="checked"' : '') + '/>').prependTo(ctree.header).click(function(evt) {
			var val = that.dn.cb[0].checked;
			if(val) {
				that.showCallsigns = true;
				ctree.body.css('display', 'block');
				ctree._lock = false;
			} else {
				that.showCallsigns = false;
				ctree.body.css('display', 'none');
				ctree._lock = true;
			}
			evt.stopPropagation();
			that.handleSetupChange();
		});

		if((org.sarsoft.userPermissionLevel == "WRITE" || org.sarsoft.userPermissionLevel == "ADMIN")) {
			jQuery('<span style="color: red; cursor: pointer">- Clear List</span>').appendTo(jQuery('<div style="padding-top: 1em; font-size: 120%"></div>').appendTo(ctree.body)).click(function() {
				that.callsignDAO._doGet("/clear", function() {
					that.clearCallsigns();
				});
			});
		}
	}	
	
	this.callsignDAO.mark();
	this.callsignDAO.loadAll(function(callsigns) {
		for(var i = 0; i < callsigns.length; i++) {
			var callsign = callsigns[i];
			that.addCallsign(callsign);
		}
	});

}

org.sarsoft.controller.CallsignMapController._idx = 0;

org.sarsoft.controller.CallsignMapController.prototype.setConfig = function(config) {
	if(config.CallsignMapController == null) return;
	this.showCallsigns = config.CallsignMapController.showCallsigns;
	this.handleSetupChange();
}

org.sarsoft.controller.CallsignMapController.prototype.getConfig = function(config) {
	if(config == null) config = new Object();
	if(config.CallsignMapController == null) config.CallsignMapController = new Object();
	config.CallsignMapController.showCallsigns = this.showCallsigns;
	return config;
}

org.sarsoft.controller.CallsignMapController.prototype.handleSetupChange = function() {
	for(var cs in this.callsigns) {
		var callsign = this.callsigns[cs];
		this.addCallsign(callsign);
	}
}

org.sarsoft.controller.CallsignMapController.prototype.timer = function() {
	var that = this;
	this.callsignDAO.loadSince(function(callsigns) {
		for(var i = 0; i < callsigns.length; i++) {
			that.addCallsign(callsigns[i]);
		}
		that.expireCallsigns();
		that.callsignDAO.mark();
	});
}

org.sarsoft.controller.CallsignMapController.prototype.removeCallsign = function(callsign) {
	if(this.dn.callsigns[callsign.name] != null) this.dn.callsigns[callsign.name].remove();
	this.dn.callsigns[callsign.name] = null;
	this.imap.removeWaypoint(callsign.position);
	delete this.callsigns[callsign.name];
}

org.sarsoft.controller.CallsignMapController.prototype.expireCallsigns = function() {
	var timestamp = this.callsignDAO._timestamp;
	for(var key in this.callsigns) {
		var callsign = this.callsigns[key];
		if(callsign.position != null && timestamp - (1*callsign.position.time) > 400000) {
			this.removeCallsign(callsign);
		}
	}
}

org.sarsoft.controller.CallsignMapController.prototype.clearCallsigns = function() {
	for(var key in this.callsigns) {
		this.removeCallsign(this.callsigns[key]);
	}
}

org.sarsoft.controller.CallsignMapController.prototype.DNAddCallsign = function(callsign) {
	var that = this;
	if(this.dn.cdiv == null) return;

	if(this.dn.callsigns[callsign.name] == null) {
		this.dn.callsigns[callsign.name] = jQuery('<div></div>').appendTo(this.dn.cdiv);
	}
	this.dn.callsigns[callsign.name].empty();
	
	var line = jQuery('<div style="padding-top: 0.5em"></div>').appendTo(this.dn.callsigns[callsign.name]);

	var s = jQuery('<span style="cursor: pointer; font-weight: bold; color: #945e3b">' + org.sarsoft.htmlescape(callsign.name) + '</span>');

	s.appendTo(line).click(function() {
		if(org.sarsoft.mobile) imap.registered["org.sarsoft.DataNavigatorToggleControl"].hideDataNavigator();
		if(callsign.position != null) that.imap.setCenter(new google.maps.LatLng(that.callsigns[callsign.name].position.lat, that.callsigns[callsign.name].position.lng));
	});
	
	var d = new Date(1*callsign.position.time);
	s.attr("title", "Last Position " + GeoUtil.GLatLngToUTM(new google.maps.LatLng(callsign.position.lat, callsign.position.lng)) + " at " + (d.getMonth()+1) + "/" + (d.getDate()) + " " + d.toTimeString());

	if((org.sarsoft.userPermissionLevel == "WRITE" || org.sarsoft.userPermissionLevel == "ADMIN") && that.imap.registered["org.sarsoft.controller.ResourceLocationMapController"] != null) {
		jQuery('<span title="Edit" style="cursor: pointer; float: right; margin-right: 5px;"><img src="' + org.sarsoft.imgPrefix + '/edit.png"/></span>').appendTo(line).click(function() {
			var dlg = that.imap.registered["org.sarsoft.controller.ResourceLocationMapController"].resourceDlg;
			dlg.entityform.write(that.callsigns[callsign.name]);
			dlg.show();
		});
	}

	var line = jQuery('<div></div>').appendTo(this.dn.callsigns[callsign.name]);
}

org.sarsoft.controller.CallsignMapController.prototype.addCallsign = function(callsign) {
	if(this.callsigns[callsign.name] != null) this.imap.removeWaypoint(this.callsigns[callsign.name].position);
	if(callsign.position == null) return;
	this.callsigns[callsign.name] = callsign;
	callsign.position.id = this._callsignId;
	this._callsignId--;
	var config = new Object();
	this.DNAddCallsign(callsign);
	
	if(!this.showCallsigns) return;

	var timestamp = this.callsignDAO._timestamp;
	config.color = "#000000";

	this.imap.addWaypoint(callsign.position, config, callsign.name, callsign.name);
}
*/