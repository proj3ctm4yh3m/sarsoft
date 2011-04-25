if(typeof org == "undefined") org = new Object();
if(typeof org.sarsoft == "undefined") org.sarsoft = new Object();
if(typeof org.sarsoft.view == "undefined") org.sarsoft.view = new Object();
if(typeof org.sarsoft.controller == "undefined") org.sarsoft.controller = new Object();

org.sarsoft.view.ResourceTable = function(handler, onDelete) {
	var coldefs = [
	    { key : "id", label : "", formatter : function(cell, record, column, data) { cell.innerHTML = "<span style='color: red; font-weight: bold'>X</span>"; cell.onclick=function(evt) {evt.cancelBubble = true; onDelete(record);} }},
		{ key : "name", label : "Name", sortable : true},
		{ key : "assignmentId", label : "Assignment", sortable : true},
		{ key : "callsign", label : "Callsign"},
		{ key : "spotId", label: "SPOT ID"},
		{ key : "position", label : "Position", formatter : function(cell, record, column, data) { if(data == null) return; var gll = {lat: function() {return data.lat;}, lng: function() {return data.lng;}}; cell.innerHTML = GeoUtil.GLatLngToUTM(gll).toString();}},
		{ key : "position", label : "Last Update", formatter : function(cell, record, column, data) { if (data == null) return; cell.innerHTML = new Date(1*data.time).toUTCString(); }, sortable : true}
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

org.sarsoft.controller.ResourceViewMapController = function(container, id) {
	var that = this;
	this.container = container;
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

	var map = new org.sarsoft.EnhancedGMap().createMap(this.container);
	this.fmap = new org.sarsoft.FixedGMap(map);

	var searchDAO = new org.sarsoft.SearchDAO(function() { that._handleServerError(); });
	searchDAO.load(function(config) {
			try {
				var mapConfig = YAHOO.lang.JSON.parse(config.value);
				that.fmap.setConfig(mapConfig);
			} catch (e) {}
			that.fmap.map.setCenter(that.fmap.map.center, 13);
	}, "mapConfig");

	var center = new GLatLng(resource.position.lat, resource.position.lng);
	that.fmap.map.setCenter(center, 13);
	that.fmap.addWaypoint(resource.position, config, resource.name);
}


org.sarsoft.controller.ResourceMapController = function(emap) {
	var that = this;
	this.emap = emap;
	this.searchDAO = new org.sarsoft.SearchDAO(function() { that._handleServerError(); });
	this.resourceDAO = new org.sarsoft.ResourceDAO(function () { that._handleServerError(); });
	this.callsignDAO = new org.sarsoft.ResourceDAO(function() { that._handleServerError(); }, "/rest/callsign");
	this.showCallsigns = true;
	this.resources = new Object();
	this.callsigns = new Object();
	this._callsignId = -1;

	this.contextMenu = new org.sarsoft.view.ContextMenu();
	this.contextMenu.setItems([
		{text : "Hide Callsigns", applicable : function(obj) { return obj == null && that.showCallsigns; }, handler : function(data) { that.showCallsigns = false; that._handleSetupChange(); }},
		{text : "Show Callsigns", applicable : function(obj) { return obj == null && !that.showCallsigns; }, handler : function(data) { that.showCallsigns = true; that._handleSetupChange(); }},
		{text : "View Resource Details", applicable : function(obj) { return obj != null }, handler : function(data) { window.open('/app/resource/' + data.subject.id); }},
		{text : "Return to Resources List", applicable : function(obj) { return obj == null; }, handler : function(data) { window.location = "/app/resource/"}},
		{text : "Adjust page size for printing", applicable: function(obj) { return obj == null}, handler : function(data) { that.pageSizeDlg.show(); }},
		{text : "Make this map background default for search", applicable : function(obj) { return obj == null; }, handler : function(data) { var config = that.emap.getConfig(); that.searchDAO.save("mapConfig", { value: YAHOO.lang.JSON.stringify(that.emap.getConfig())})}}
		]);

	emap.addListener("singlerightclick", function(point, wpt) {
		that.contextMenu.show(point, that._getResourceFromWpt(wpt));
	});

	this.resourceDAO.mark();
	this.resourceDAO.loadAll(function(resources) {
		var n = -180;
		var s = 180;
		var e = -180;
		var w = 180;
		for(var i = 0; i < resources.length; i++) {
			var resource = resources[i];
			if(resource.position != null) {
				that.addResource(resource);
				n = Math.max(n, resource.position.lat);
				s = Math.min(s, resource.position.lat);
				e = Math.max(e, resource.position.lng);
				w = Math.min(w, resource.position.lng);
			}
		}

		that.searchDAO.load(function(config) {
				try {
					var mapConfig = YAHOO.lang.JSON.parse(config.value);
					that.emap.setConfig(mapConfig);
				} catch (e) {}
				var center = new GLatLng((n + s) / 2, (e + w) / 2);
				that.emap.map.setCenter(center, that.emap.map.getBoundsZoomLevel(new GLatLngBounds(new GLatLng(s, w), new GLatLng(n, e))));
		}, "mapConfig");
	});
	
	this.callsignDAO.mark();
	this.callsignDAO.loadAll(function(callsigns) {
		for(var i = 0; i < callsigns.length; i++) {
			var callsign = callsigns[i];
			that.addCallsign(callsign);
		}
	});

	this.pageSizeDlg = new org.sarsoft.view.OperationalPeriodMapSizeDlg(this.emap.map);

}

org.sarsoft.controller.ResourceMapController._idx = 0;

org.sarsoft.controller.ResourceMapController.prototype._handleServerError = function() {
	this.emap._infomessage("Server Error");
}

org.sarsoft.controller.ResourceMapController.prototype._getResourceFromWpt = function(wpt) {
	if(wpt == null) return null;
	for(var key1 in this.resources) {
		if(this.resources[key1].position.id == wpt.id) return this.resources[key1];
	}
	return null;
}

org.sarsoft.controller.ResourceMapController.prototype._handleSetupChange = function() {
	for(var id in this.resources) {
		var resource = this.resources[id];
		this.addResource(resource);
	}
	for(var cs in this.callsigns) {
		var callsign = this.callsigns[cs];
		this.addCallsign(callsign);
	}
}

org.sarsoft.controller.ResourceMapController.prototype.timer = function() {
	var that = this;
	this.resourceDAO.loadSince(function(resources) {
		for(var i = 0; i < resources.length; i++) {
			that.addResource(resources[i]);
		}
		that.expireResources();
		that.resourceDAO.mark();
	});
	this.callsignDAO.loadSince(function(callsigns) {
		for(var i = 0; i < callsigns.length; i++) {
			that.addCallsign(callsigns[i]);
		}
		that.expireCallsigns();
		that.callsignDAO.mark();
	});
}

org.sarsoft.controller.ResourceMapController.prototype.expireResources = function() {
	var timestamp = this.resourceDAO._timestamp;
	for(var key in this.resources) {
		var resource = this.resources[key];
		if(resource.position != null && timestamp - (1*resource.position.time) > 400000) {
			this.addResource(resource, true);
		}
	}
}

org.sarsoft.controller.ResourceMapController.prototype.expireCallsigns = function() {
	var timestamp = this.callsignDAO._timestamp;
	for(var key in this.callsigns) {
		var callsign = this.callsigns[key];
		if(callsign.position != null && timestamp - (1*callsign.position.time) > 400000) {
			this.addCallsign(callsign, true);
		}
	}
}

org.sarsoft.controller.ResourceMapController.prototype.addResource = function(resource, expireCheck) {
	if(this.resources[resource.id] != null) this.emap.removeWaypoint(this.resources[resource.id].position);
	if(expireCheck != true) {
		this.resources[resource.id] = resource;
	}
	if(resource.position == null) return;
	var config = new Object();

	var timestamp = this.resourceDAO._timestamp;
	config.color = "#FF0000";
	if(timestamp - (1*resource.position.time) > 400000) config.color = "#000000";

	var date = new Date(1*resource.position.time);
	var pad2 = function(num) { return (num < 10 ? '0' : '') + num; };
	this.emap.addWaypoint(resource.position, config, resource.name + " " + pad2(date.getHours()) + ":" + pad2(date.getMinutes()) + ":" + pad2(date.getSeconds()), resource.name);
}


org.sarsoft.controller.ResourceMapController.prototype.addCallsign = function(callsign, expireCheck) {
	if(this.callsigns[callsign.name] != null) this.emap.removeWaypoint(this.callsigns[callsign.name].position);
	if(callsign.position == null) return;
	if(expireCheck != true) {
		this.callsigns[callsign.name] = callsign;
		callsign.position.id = this._callsignId;
		this._callsignId--;
	}
	var config = new Object();
	if(!this.showCallsigns) return;

	var timestamp = this.callsignDAO._timestamp;
	config.color = "#FFCC00";
	if(timestamp - (1*callsign.position.time) > 400000) config.color = "#000000";

	var date = new Date(1*callsign.position.time);
	var pad2 = function(num) { return (num < 10 ? '0' : '') + num; };
	this.emap.addWaypoint(callsign.position, config, callsign.name + " " + pad2(date.getHours()) + ":" + pad2(date.getMinutes()) + ":" + pad2(date.getSeconds()), callsign.name);
}
