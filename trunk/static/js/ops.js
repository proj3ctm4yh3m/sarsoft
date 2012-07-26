if(typeof org == "undefined") org = new Object();
if(typeof org.sarsoft == "undefined") org.sarsoft = new Object();
if(typeof org.sarsoft.view == "undefined") org.sarsoft.view = new Object();
if(typeof org.sarsoft.controller == "undefined") org.sarsoft.controller = new Object();

org.sarsoft.view.ResourceTable = function(handler, onDelete, caption) {
	var coldefs = [
	    { key : "id", label : "", formatter : function(cell, record, column, data) { cell.innerHTML = "<span style='color: red; font-weight: bold'>X</span>"; cell.onclick=function(evt) {evt.cancelBubble = true; onDelete(record);} }},
		{ key : "name", label : "Name", sortable : true},
		{ key : "agency", label : "Agency", sortable : true},
		{ key : "type", label : "Type", sortable : true},
		{ key : "assignmentId", label : "Assignment", sortable : true},
		{ key : "callsign", label : "Callsign"},
		{ key : "spotId", label: "SPOT ID"},
		{ key : "position", label : "Position", formatter : function(cell, record, column, data) { if(data == null) return; var gll = {lat: function() {return data.lat;}, lng: function() {return data.lng;}}; cell.innerHTML = GeoUtil.GLatLngToUTM(GeoUtil.fromWGS84(gll)).toString();}},
		{ key : "lastFix", label : "Last Update", sortable : true }
	];
	if(onDelete == null) {
		coldefs.splice(0,1);
	}
	if(handler == null) {
		handler = function(resource) {
			window.location="/resource/" + resource.id;
		}
	}
	if(caption == null) caption = "Resources";
	org.sarsoft.view.EntityTable.call(this, coldefs, { caption: caption }, handler);
}
org.sarsoft.view.ResourceTable.prototype = new org.sarsoft.view.EntityTable();

org.sarsoft.ResourceDAO = function(errorHandler, baseURL) {
	if(typeof baseURL == "undefined") baseURL = "/rest/resource";
	this.baseURL = baseURL;
	this.errorHandler = errorHandler;
}

org.sarsoft.ResourceDAO.prototype = new org.sarsoft.BaseDAO();

org.sarsoft.ResourceDAO.prototype.detachResource = function(resource, assignmentid) {
	this._doGet("/" + resource.id + "/detach/" + assignmentid, function() {});
}

org.sarsoft.view.ResourceImportDlg = function(id) {
	var that = this;
	var body = jQuery("<div><p>Data should be a comma separated file without character escaping.  Column ordering should match the file created when selecting 'Export to CSV'.</p><form method='post' enctype='multipart/form-data' name='resourceupload' action='/resource/'><input type='file' name='file'/><input type='hidden' name='format' value='csv'/></form></div>")[0];
	this.dialog = org.sarsoft.view.CreateDialog("Upload Resources as CSV", body, "Import", "Cancel", function() {
		document.forms['resourceupload'].submit();
		}, {width: "420px", left: "200px", top: "200px"});
}


org.sarsoft.controller.ResourceViewMapController = function(id, imap) {
	var that = this;
	this.imap = imap;
	this.resourceDAO = new org.sarsoft.ResourceDAO(function() { that._handleServerError(); });
	this.resourceDAO.load(function(obj) { that._loadResourceCallback(obj); }, id);
}

org.sarsoft.controller.ResourceViewMapController.prototype._loadResourceCallback = function(resource) {
	var that = this;
	this.resource = resource;

	var config = new Object();
	config.clickable = false;
	config.fill = false;
	config.color = "#FF0000";
	config.opacity = 100;

	that.imap.setCenter(new google.maps.LatLng(resource.position.lat, resource.position.lng), 13);
	that.imap.addWaypoint(resource.position, config, resource.name);
}

org.sarsoft.view.ResourceForm = function() {
}

org.sarsoft.view.ResourceForm.prototype.create = function(container) {
	var that = this;
	var row = jQuery('<tr></tr>').appendTo(jQuery('<tbody></tbody>').appendTo(jQuery('<table style="border: 0"></table>').appendTo(container)));
	var left = jQuery('<td width="50%" valign="top"></td>').appendTo(row);
	var right = jQuery('<td width="50%" valign="top" style="padding-left: 20px"></td>').appendTo(row);

	var leftFields = [{ name: "name", label: "Name", type: "string"},
	                  { name: "type", label: "Type", type: ["PERSON","EQUIPMENT"]},
	                  { name: "agency", label: "Agency", type: "string"}];
	
	var rightFields = [{ name: "callsign", label: "Callsign", type: "string"},
	 	              { name: "spotId", label: "SPOT ID", type: "string"},
	 	              { name: "spotPassword", label: "SPOT Password", type: "string"}];
		
	this.leftForm = new org.sarsoft.view.EntityForm(leftFields);
	this.leftForm.create(left[0]);
	this.rightForm = new org.sarsoft.view.EntityForm(rightFields);
	this.rightForm.create(right[0]);
}

org.sarsoft.view.ResourceForm.prototype.read = function() {
	obj = this.leftForm.read();
	obj2 = this.rightForm.read();
	for(var key in obj2) {
		obj[key] = obj2[key];
	}
	return obj;
}

org.sarsoft.view.ResourceForm.prototype.write = function(obj) {
	this.leftForm.write(obj);
	this.rightForm.write(obj);
}

org.sarsoft.controller.ResourceLocationMapController = function(controller) {
	var that = this;
	this.imap = imap;
	this.imap.register("org.sarsoft.controller.ResourceLocationMapController", this);
	this.resourceDAO = new org.sarsoft.ResourceDAO(function () { that.imap.message("Server Communication Error"); });
	this.resources = new Object();
	this.showLocations = true;
	this.refreshCount=0;
	
	this.imap.addContextMenuItems([
     		{text : "Details (opens new window)", applicable : function(obj) { return obj != null && that.getResourceIdFromWpt(obj) != null}, handler : function(data) { window.open('/resource/' + that.getResourceIdFromWpt(data.subject)); }}
     		]);
	
	if(imap.registered["org.sarsoft.DataNavigator"] != null) {
		var dn = imap.registered["org.sarsoft.DataNavigator"];
		this.dn = new Object();
		var rtree = dn.addDataType("Resources");
		rtree.header.css({"font-size": "120%", "font-weight": "bold", "margin-top": "0.5em", "border-top": "1px solid #CCCCCC"});
		this.dn.rdiv = jQuery('<div></div>').appendTo(rtree.body);
		this.dn.resources = new Object();
		this.dn.cb = jQuery('<input type="checkbox"' + (that.showLocations ? ' checked="checked"' : '') + '/>').prependTo(rtree.header).click(function(evt) {
			var val = that.dn.cb[0].checked;
			if(val) {
				that.showLocations = true;
				rtree.body.css('display', 'block');
				rtree._lock = false;
			} else {
				that.showLocations = false;
				rtree.body.css('display', 'none');
				rtree._lock = true;
			}
			evt.stopPropagation();
			that.handleSetupChange();
		});

		if((org.sarsoft.userPermissionLevel == "WRITE" || org.sarsoft.userPermissionLevel == "ADMIN")) {
			jQuery('<span style="color: green; cursor: pointer">+ New Resource</span>').appendTo(jQuery('<div style="padding-top: 1em; font-size: 120%"></div>').appendTo(rtree.body)).click(function() {
				that.resourceDlg.resource = null;
				that.resourceDlg.show();
			});
		}
	}

	this.resourceDlg = new org.sarsoft.view.MapEntityDialog(this.imap, "Edit Resource", new org.sarsoft.view.ResourceForm(), function(updated) {
		if(that.resourceDlg.resource != null) {
			var resource = that.resources[that.resourceDlg.resource.id];
			that.resourceDlg.resource = null;
			that.resourceDAO.save(resource.id, updated, function(r) {
				that.showResource(r);
			});
		} else { 
			that.resourceDAO.create(function(r) {
				that.showResource(r);
			}, updated);
		}
	}, "Save");
	
	this.delconfirm = new org.sarsoft.view.MapDialog(imap, "Delete?", jQuery('<div>Delete - Are You Sure?</div>'), "Delete", "Cancel", function() {
		that.resourceDAO.del(that.delconfirm.resource.id); that.removeResource(that.delconfirm.resource);
		that.delconfirm.resource = null;
	});

	that.resourceDAO.loadAll(function(resources) {
		var n = -180;
		var s = 180;
		var e = -180;
		var w = 180;
		var total = 0;
		for(var i = 0; i < resources.length; i++) {
			var resource = resources[i];
			that.showResource(resource);
			if(resource.position != null) {
				total++;
				n = Math.max(n, resource.position.lat);
				s = Math.min(s, resource.position.lat);
				e = Math.max(e, resource.position.lng);
				w = Math.min(w, resource.position.lng);
			}
		}
		if(total > 1) {
			that.imap.growInitialMap(new google.maps.LatLng(s, w));
			that.imap.growInitialMap(new google.maps.LatLng(n, e));
		}

	});		
	this.resourceDAO.mark();
	
}

org.sarsoft.controller.ResourceLocationMapController.prototype.setConfig = function(config) {
	if(config.ResourceLocationMapController == null || config.ResourceLocationMapController.showLocations == null) return;
	this.showLocations = config.ResourceLocationMapController.showLocations;
	this.handleSetupChange();
}

org.sarsoft.controller.ResourceLocationMapController.prototype.getConfig = function(config) {
	if(config == null) config = new Object();
	if(config.ResourceLocationMapController == null) config.ResourceLocationMapController = new Object();
	config.ResourceLocationMapController.showLocations = this.showLocations;
	return config;
}

org.sarsoft.controller.ResourceLocationMapController.prototype.getResourceIdFromWpt = function(wpt) {
	for(var key in this.resources) {
		if(this.resources[key] != null && this.resources[key].position == wpt) return key;
	}
}

org.sarsoft.controller.ResourceLocationMapController.prototype.timer = function() {
	var that = this;
	this.resourceDAO.loadSince(function(resources) {
		for(var i = 0; i < resources.length; i++) {
			that.showResource(resources[i]);
		}
		that.refreshCount++;
		if(that.refreshCount > 6) {
			that.refreshCount = 0;
			that.handleSetupChange();
		}
	});
	that.resourceDAO.mark();
}

org.sarsoft.controller.ResourceLocationMapController.prototype.DNAddResource = function(resource) {
	var that = this;
	if(this.dn.rdiv == null) return;

	if(this.dn.resources[resource.id] == null) {
		this.dn.resources[resource.id] = jQuery('<div></div>').appendTo(this.dn.rdiv);
	}
	this.dn.resources[resource.id].empty();
	
	var line = jQuery('<div style="padding-top: 0.5em"></div>').appendTo(this.dn.resources[resource.id]);

	var s = jQuery('<span style="cursor: pointer; font-weight: bold; color: #945e3b">' + org.sarsoft.htmlescape(resource.name) + (resource.assignmentId != null && resource.assignmentId.length > 0 ? ' (' + resource.assignmentId + ')' : '') + '</span>');

	s.appendTo(line).click(function() {
		if(org.sarsoft.mobile) imap.registered["org.sarsoft.DataNavigatorToggleControl"].hideDataNavigator();
		if(resource.position != null) that.imap.setCenter(new google.maps.LatLng(that.resources[resource.id].position.lat, that.resources[resource.id].position.lng));
	});
	
	var title = "";
	if(resource.position != null) {
		var d = new Date(1*resource.updated);
		title = title + "Last Position " + GeoUtil.GLatLngToUTM(new google.maps.LatLng(resource.position.lat, resource.position.lng)) + " at " + (d.getMonth()+1) + "/" + (d.getDate()) + " " + d.toTimeString();
	} else {
		title = title + "No Current Position"
	}
	if(resource.assignmentId != null && resource.assignmentId.length > 0) {
		title = title + "\nAssignment " + resource.assignmentId;
	} else {
		title = title + "\nNo Assignment";
	}
	
	s.attr("title", title);

	var timestamp = this.resourceDAO._timestamp;
	if(resource.position == null || (timestamp - (1*resource.position.time) > 1800000 && (resource.assignmentId == null || resource.assignmentId == ""))) {
		s.css('color', '#CCCCCC');		
	}

	if((org.sarsoft.userPermissionLevel == "WRITE" || org.sarsoft.userPermissionLevel == "ADMIN")) {	
		jQuery('<span title="Delete" style="cursor: pointer; float: right; margin-right: 10px; font-weight: bold; color: red">-</span>').appendTo(line).click(function() {
			that.delconfirm.resource = resource;
			that.delconfirm.show();
		});
		jQuery('<span title="Edit" style="cursor: pointer; float: right; margin-right: 5px;"><img src="' + org.sarsoft.imgPrefix + '/edit.png"/></span>').appendTo(line).click(function() {
			that.resourceDlg.resource = resource;
			that.resourceDlg.entityform.write(that.resources[resource.id]);
			that.resourceDlg.show();
		});
	}

	var line = jQuery('<div></div>').appendTo(this.dn.resources[resource.id]);
}

org.sarsoft.controller.ResourceLocationMapController.prototype.showResource = function(resource) {
	if(this.resources[resource.id] != null && this.resources[resource.id].position != null) this.imap.removeWaypoint(this.resources[resource.id].position);
	this.resources[resource.id] = resource;
	this.DNAddResource(resource);
	if(resource.position == null) return;
	if(!this.showLocations) return; // need lines above this in case the user re-enables resources

	var config = new Object();	
	var tooltip = resource.name + " " + resource.lastFix;
	var label = resource.name;
	
	var opmc = this.imap.registered["org.sarsoft.controller.OperationalPeriodMapController"];
	if(opmc != null) {
		config.color = opmc.getColorForAssignmentId(resource.assignmentId);
	} else {
		config.color = "#FF0000";
	}
	
	if(resource.assignmentId != null && resource.assignmentId > 0) {
		label = resource.assignmentId + ":" + label;
	}
	
	var timestamp = this.resourceDAO._timestamp;
	if(timestamp - (1*resource.position.time) > 1800000 && (resource.assignmentId == null || resource.assignmentId == "")) {
		// present in DN but greyed out
		return;
	}
	if(timestamp - (1*resource.position.time) > 900000) {
		config = { icon : org.sarsoft.MapUtil.createImage(16, "/static/images/warning.png")}
	}
	this.imap.addWaypoint(resource.position, config, tooltip, label);
}

org.sarsoft.controller.ResourceLocationMapController.prototype.removeResource = function(resource) {
	if(this.resources[resource.id] != null && this.resources[resource.id].position != null) this.imap.removeWaypoint(this.resources[resource.id].position);
	delete this.resources[resource.id];
	this.dn.resources[resource.id].remove();
	delete this.dn.resources[resource.id];
}

org.sarsoft.controller.ResourceLocationMapController.prototype.isResourceVisible = function(resource) {
	var timestamp = this.resourceDAO._timestamp;
	if(timestamp - (1*resource.position.time) > 1800000 && (resource.assignmentId == null || resource.assignmentId == "")) return false;
	return true;
}

org.sarsoft.controller.ResourceLocationMapController.prototype.handleSetupChange = function() {
	// TODO update show/hide toggle
	if(!this.showLocations) {
		for(var key in this.resources) {
			this.imap.removeWaypoint(this.resources[key].position);
		}
	} else {
		for(var key in this.resources) {
			this.showResource(this.resources[key]);
		}
	}
}

org.sarsoft.controller.ResourceLocationMapController.prototype.getFindBlock = function() {
	var that = this;
	var node = document.createElement("div");
	node.appendChild(document.createTextNode("Resource: "));
	var select = document.createElement("select");
	node.appendChild(select);
	var opt = document.createElement("option");
	opt.appendChild(document.createTextNode("--"));
	opt.value = "--";
	select.appendChild(opt);
	for(var id in this.resources) {
		if(this.isResourceVisible(this.resources[id])) {
			opt = document.createElement("option");
			opt.appendChild(document.createTextNode(this.resources[id].name));
			opt.value=id;
			select.appendChild(opt);
		}
	}
	this._findBlock = {order : 5, node : node, handler : function() {
		var id = select.options[select.selectedIndex].value;
		if(id != "--") {
			var wpt = that.resources[id].position;
			that.imap.map.setCenter(new google.maps.LatLng(wpt.lat, wpt.lng), 14);
			return true;
		}
		return false;
	}};

	return this._findBlock;
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
	this.dn.callsigns[callsign.name].remove();
	this.dn.callsigns[callsign.name] = null;
	this.imap.removeWaypoint(callsign.position);
	delete this.callsigns[key];
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
