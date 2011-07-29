if(typeof org == "undefined") org = new Object();
if(typeof org.sarsoft == "undefined") org.sarsoft = new Object();
if(typeof org.sarsoft.view == "undefined") org.sarsoft.view = new Object();
if(typeof org.sarsoft.controller == "undefined") org.sarsoft.controller = new Object();

org.sarsoft.view.ResourceTable = function(handler, onDelete) {
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
			window.location="/app/resource/" + resource.id;
		}
	}
	org.sarsoft.view.EntityTable.call(this, coldefs, { caption: "Resources" }, handler);
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
	var dlg = document.createElement("div");
	dlg.style.position="absolute";
	dlg.style.zIndex="1000";
	dlg.style.top="200px";
	dlg.style.left="200px";
	dlg.style.width="420px";
	var hd = document.createElement("div");
	hd.appendChild(document.createTextNode("Upload Resources as CSV"));
	hd.className = "hd";
	dlg.appendChild(hd);
	var bd = document.createElement("div");
	bd.className = "bd";
	bd.innerHTML="<p>Data should be a comma separated file without character escaping.  Column ordering should match the file created when selecting 'Export to CSV'.</p><form method='post' enctype='multipart/form-data' name='resourceupload' action='/app/resource/'><input type='file' name='file'/><input type='hidden' name='format' value='csv'/></form>";
	dlg.appendChild(bd);
	this.dialog = new YAHOO.widget.Dialog(dlg, {zIndex: "1000", width: "420px"});
	var buttons = [ { text : "Import", handler: function() {
		that.dialog.hide(); document.forms['resourceupload'].submit();
	}, isDefault: true}, {text : "Cancel", handler : function() { that.dialog.hide(); }}];
	this.dialog.cfg.queueProperty("buttons", buttons);
	this.dialog.render(document.body);
	this.dialog.hide();
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

	that.imap.setCenter(new GLatLng(resource.position.lat, resource.position.lng), 13);
	that.imap.addWaypoint(resource.position, config, resource.name);
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
     		{text : "View Resource Details", applicable : function(obj) { return obj != null && that.getResourceIdFromWpt(obj) != null}, handler : function(data) { window.open('/app/resource/' + that.getResourceIdFromWpt(data.subject)); }}
     		]);
	
	var showHide = new org.sarsoft.ToggleControl("LOC", "Show/Hide Resource Locations", function(value) {
		that.showLocations = value;
		that.handleSetupChange();
	});
	this.imap.addMenuItem(showHide.node, 18);
	this.showHide = showHide;

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
			that.imap.growInitialMap(new GLatLng(s, w));
			that.imap.growInitialMap(new GLatLng(n, e));
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

org.sarsoft.controller.ResourceLocationMapController.prototype.showResource = function(resource) {
	if(this.resources[resource.id] != null) this.imap.removeWaypoint(this.resources[resource.id].position);
	if(resource.position == null) return;
	this.resources[resource.id] = resource;
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
	if(timestamp - (1*resource.position.time) > 1800000 && (resource.assignmentId == null || resource.assignmentId == "")) return;
	if(timestamp - (1*resource.position.time) > 900000) {
		config = { icon : org.sarsoft.MapUtil.createIcon(15, "/static/images/warning.png")}
	}
	this.imap.addWaypoint(resource.position, config, tooltip, label);
}

org.sarsoft.controller.ResourceLocationMapController.prototype.handleSetupChange = function() {
	this.showHide.setValue(this.showLocations);
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

org.sarsoft.controller.CallsignMapController = function(imap) {
	var that = this;
	this.callsignDAO = new org.sarsoft.ResourceDAO(function() { that.imap.message("Server Communication Error!"); }, "/rest/callsign");
	this.showCallsigns = true;
	this.callsigns = new Object();
	this._callsignId = -1;
	this.imap = imap;
	this.imap.register("org.sarsoft.controller.CallsignMapController", this);

	var showHide = new org.sarsoft.ToggleControl("CLL", "Show/Hide Nearby Callsigns", function(value) {
		that.showCallsigns = value;
		that.handleSetupChange();
	});
	this.imap.addMenuItem(showHide.node, 19);
	this.showHide = showHide;
	
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
	this.showHide.setValue(this.showCallsigns);
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

org.sarsoft.controller.CallsignMapController.prototype.expireCallsigns = function() {
	var timestamp = this.callsignDAO._timestamp;
	for(var key in this.callsigns) {
		var callsign = this.callsigns[key];
		if(callsign.position != null && timestamp - (1*callsign.position.time) > 400000) {
			this.imap.removeWaypoint(callsign.position);
			delete this.callsigns[key];
		}
	}
}

org.sarsoft.controller.CallsignMapController.prototype.addCallsign = function(callsign) {
	if(this.callsigns[callsign.name] != null) this.imap.removeWaypoint(this.callsigns[callsign.name].position);
	if(callsign.position == null) return;
	this.callsigns[callsign.name] = callsign;
	callsign.position.id = this._callsignId;
	this._callsignId--;
	var config = new Object();
	if(!this.showCallsigns) return;

	var timestamp = this.callsignDAO._timestamp;
	config.color = "#000000";

	this.imap.addWaypoint(callsign.position, config, callsign.name, callsign.name);
}
