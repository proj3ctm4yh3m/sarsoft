if(typeof org == "undefined") org = new Object();
if(typeof org.sarsoft == "undefined") org.sarsoft = new Object();
if(typeof org.sarsoft.view == "undefined") org.sarsoft.view = new Object();

org.sarsoft.htmlescape = function(str, newline) {
	if(newline) return str.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\n/g, "<br/>");
	return str.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

org.sarsoft.BaseDAO = function() {
//	this._timestamp = 0;
}

org.sarsoft.BaseDAO.prototype._doPost = function(url, handler, obj, poststr) {
	var that = this;
	postdata = "json=" + encodeURIComponent(YAHOO.lang.JSON.stringify(obj));
	if(typeof poststr != "undefined") postdata += "&" + poststr;
	if(org.sarsoft.tenantid != null) postdata += "&tid=" + encodeURIComponent(org.sarsoft.tenantid);
	YAHOO.util.Connect.resetDefaultHeaders();
	YAHOO.util.Connect.setDefaultPostHeader(false);
	YAHOO.util.Connect.initHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
	YAHOO.util.Connect.asyncRequest('POST', this.baseURL + url, { success : function(response) {
			handler(YAHOO.lang.JSON.parse(response.responseText));
		}, failure : function(response) {
			if(!org.sarsoft._saveAlertFlag) {
				org.sarsoft._saveAlertFlag = true;
				alert("Server Communication Error!  Data may not be getting saved properly, reloading this page may solve the problem.  This message will not be shown again until you reload the page, but the problem may persist");
			}
			throw("AJAX ERROR posting to " + that.baseURL + url + ": " + response.responseText);
		}}, postdata);
}

org.sarsoft.BaseDAO.prototype._doGet = function(url, handler) {
	var that = this;
	var url = this.baseURL + url;
	if(org.sarsoft.tenantid != null) url = url + (url.indexOf("?") < 0 ? "?tid=" : "&tid=") + encodeURIComponent(org.sarsoft.tenantid);
	YAHOO.util.Connect.asyncRequest('GET', url, { success : function(response) {
			handler(YAHOO.lang.JSON.parse(response.responseText));
		}, failure : function(response) {
			throw("AJAX ERROR getting from " + url + ": " + response.responseText);
		}});
}

org.sarsoft.BaseDAO.prototype.create = function(handler, obj) {
	this._doPost("/", handler, obj);
}

org.sarsoft.BaseDAO.prototype.save = function(id, obj, handler) {
	this._doPost("/" + id + ".do", function(obj) {if(handler != null) handler(obj);}, obj);
}

org.sarsoft.BaseDAO.prototype.del = function(id) {
	this._doPost("/" + id + ".do", function() {}, new Object(), "action=delete");
}

org.sarsoft.BaseDAO.prototype.load = function(handler, id) {
	this._doGet("/" + id + ".do", handler);
}

org.sarsoft.BaseDAO.prototype.mark = function() {
	var that = this;
	var url = "/rest/timestamp";
	if(org.sarsoft.tenantid != null) url = url + "?tid=" + encodeURIComponent(org.sarsoft.tenantid);
	YAHOO.util.Connect.asyncRequest('GET', url, { success : function(response) {
			that._timestamp = YAHOO.lang.JSON.parse(response.responseText).timestamp;
		}, failure : function(response) {
			that.errorHandler();
		}});
}

org.sarsoft.BaseDAO.prototype.loadSince = function(handler) {
	this._doGet("/since/" + this._timestamp, handler);
}

org.sarsoft.BaseDAO.prototype.loadAll = function(handler) {
	this._doGet("/", handler);
}

org.sarsoft.SearchDAO = function(errorHandler, baseURL) {
	if(typeof baseURL == "undefined") baseURL = "/rest/search";
	this.baseURL = baseURL;
	this.errorHandler = errorHandler;
}

org.sarsoft.SearchDAO.prototype = new org.sarsoft.BaseDAO();

org.sarsoft.Loader = new Object();
org.sarsoft.Loader._tasks = new Array();
org.sarsoft.Loader.queue = function(task) {
	if(org.sarsoft.Loader._tasks == null) {
		task();
	} else {
		org.sarsoft.Loader._tasks.push(task);
	}
}
org.sarsoft.Loader.execute = function() {
	var tasks = org.sarsoft.Loader._tasks;
	if(tasks != null) {
		for(var i = 0; i < tasks.length; i++) {
			tasks[i]();
		}
	}
	org.sarsoft.Loader._tasks = null;
}

org.sarsoft.Loader.queue(function() {YAHOO.util.Event.throwErrors = true;});

org.sarsoft.view.CreateSlider = function(container) {
	var sliderbg = jQuery('<div class="yui-h-slider" style="background: none; border-bottom: 1px solid #808080; width: 105px; float: left; margin-left: 5px; height: 6px"></div>');
	container.append('<div style="float: left"><span style="color: #606060; margin-left: 5px">0</span></div>', sliderbg, '<div style="float: left; margin-left: 5px; color: #606060">100</div>');
	var sliderthumb = jQuery('<div class="yui-slider-thumb" style="cursor: pointer; width: 5px; height: 12px; top: 0px; background-color: black">&#32;</div>').appendTo(sliderbg);
	return YAHOO.widget.Slider.getHorizSlider(sliderbg[0], sliderthumb[0], 0, 100);
}

org.sarsoft.view.ContextMenu = function() {
	var id = "ContextMenu_" + org.sarsoft.view.ContextMenu._idx++;
	this.menu = new YAHOO.widget.Menu(id, { hidedelay : 500, showdelay : 0, zIndex: "1000"});
	this.menu.render(document.body);
}

org.sarsoft.view.ContextMenu._idx = 0;

org.sarsoft.view.ContextMenu.prototype.setItems = function(items) {
	this.items = items;
}

org.sarsoft.view.ContextMenu.prototype._addItems = function(menu, items, subject, data) {
	var createhandler = function(idx) {
		return function() { items[idx].handler(data)}
	}
	
	for(var i = 0; i < items.length; i++) {
		if(items[i].applicable(subject)) {
			if(items[i].items != null) {
				var submenu = new YAHOO.widget.Menu("ContextMenu_" + org.sarsoft.view.ContextMenu._idx++, { hidedelay : 750, showdelay : 0, zIndex : "1010"});
				this._addItems(submenu, items[i].items, subject, data);
				var item = menu.addItem(new YAHOO.widget.MenuItem(items[i].text, { submenu: submenu}));
			} else {
				var handler = items[i].handler;
				menu.addItem(new YAHOO.widget.MenuItem(items[i].text, { onclick: { fn: createhandler(i)}}));
			}
		}
	}
}

org.sarsoft.view.ContextMenu.prototype.show = function(point, subject, screenxy) {
	var that = this;
	this.data = {point: point, subject: subject};
	this.menu.clearContent();
	if(screenxy == null) screenxy = point;
	
	this._addItems(this.menu, this.items, subject, this.data);

	this.menu.moveTo(screenxy.x, screenxy.y);
	this.menu.render(document.body);
	this.menu.show();
}

org.sarsoft.view.getColorFormatter = function(colors) {
  return function(cell, record, column, data) {
    var color = colors[data];
    if(typeof data == "number") color = colors[data % colors.length];
  	cell.innerHTML = "<span style='color: " + color + "'>" + data + "</span>";
  }
}

org.sarsoft.view.EntityTable = function(coldefs, config, clickhandler) {
	if(coldefs == null) return;
	this.coldefs = coldefs;
	this.config = config;
	this.clickhandler = clickhandler;
	this.clickoverride = true;
	this.datasource = new YAHOO.util.DataSource([]);
	this.datasource.responseType = YAHOO.util.DataSource.TYPE_JSARRAY;
	var schema = { fields: [] };
	for(var i = 0; i < coldefs.length; i++) {
		schema.fields.push(coldefs[i].key);
	}
	this.datasource.responseSchema = schema;
}

org.sarsoft.view.EntityTable.prototype.getSelectedData = function() {
	var data = new Array();
	var rows = this.table.getSelectedRows();
	for(var i = 0; i < rows.length; i++) {
		data.push(this.table.getRecordSet().getRecord(rows[i]).getData());
	}
	return data;
}

org.sarsoft.view.EntityTable.prototype.setClickOverride = function(override) {
	this.clickoverride = override;
	if(override) this.table.unselectAllRows();
}

org.sarsoft.view.EntityTable.prototype.click = function(record) {
	if(this.clickoverride)
		this.clickhandler(record.getData());
}

org.sarsoft.view.EntityTable.prototype.create = function(container) {
	var that = this;
	this.container = container;
	this.table = new YAHOO.widget.DataTable(container, this.coldefs, this.datasource, this.config);
	this.table.showTableMessage('<i>Loading Data . . .</i>');
	if(this.coldefs[0].sortable) {
		this.table.sortColumn(this.table.getColumn(this.coldefs[0].key), YAHOO.widget.DataTable.CLASS_ASC);
	} else if(this.coldefs[1].sortable) {
		this.table.sortColumn(this.table.getColumn(this.coldefs[1].key), YAHOO.widget.DataTable.CLASS_ASC);
	}
	if(this.clickhandler != null) {
		YAHOO.util.Dom.addClass(this.table.getTableEl(), 'clickableyuitable');
		this.table.subscribe("rowMouseoverEvent", this.table.onEventHighlightRow);
		this.table.subscribe("rowMouseoutEvent", this.table.onEventUnhighlightRow);
		this.table.subscribe("rowClickEvent", this.table.onEventSelectRow);
		this.table.subscribe("rowSelectEvent", function(args) {
			that.click(args.record);
		});
	}
}

org.sarsoft.view.EntityTable.prototype.clear = function() {
	this.table.set("sortedBy", null);
	var rs = this.table.getRecordSet();
	while(rs.getLength() > 0) this.table.deleteRow(0);
}

org.sarsoft.view.EntityTable.prototype.update = function(records) {
	var sortedBy = this.table.get("sortedBy");
	this.table.set("sortedBy", null);
	var rs = this.table.getRecordSet();
	for(var i = 0; i < records.length; i++) {
		for(var j = 0; j < rs.getLength(); j++) {
			if(rs.getRecord(j).getData().id == records[i].id && typeof records[i].id != "undefined") {
				this.table.deleteRow(j);
			}
		}
		this.table.addRow(records[i]);
	}
	if(sortedBy != null) this.table.sortColumn(sortedBy.column, sortedBy.dir);
}

org.sarsoft.view.EntityForm = function(fields) {
	this.fields = fields;
	this.elements = new Object();
}

org.sarsoft.view.EntityForm._idx = 0;
org.sarsoft.view.EntityForm._classNames = ["row", "group", "subgroup"];
org.sarsoft.view.EntityForm._inputTypes = {
	string : {
		node: "input",
		params : { length : 15 }
	}, number : {
		node: "input",
		params : { length: 5 }
	}, text : {
		node: "textarea",
		params : { className: "entityform" }
	}, boolean : {
		node: "input",
		params : { type: "checkbox" }
	}
}

org.sarsoft.view.EntityForm.prototype.create = function(container) {
	this.form = document.createElement("form");
	this.form.name = "EntityForm_" + org.sarsoft.view.EntityForm._idx++;
	this.form.className = "EntityForm";
	this._process(this.form, this.fields, 0);
	container.appendChild(this.form);
}

org.sarsoft.view.EntityForm.prototype._process = function(container, fields, level) {
	for(var i = 0; i < fields.length; i++) {
		var field = fields[i];
		if(field instanceof Array) {
			var elt = this._createContainer(level);
			this._process(elt, field, level+1);
			container.appendChild(elt);
		} else {
			container.appendChild(this._createField(field));
		}
	}
}

org.sarsoft.view.EntityForm.prototype._createContainer = function(level) {
	var div = document.createElement("div");
	if(level < org.sarsoft.view.EntityForm._classNames.length) {
		div.className = org.sarsoft.view.EntityForm._classNames[level];
	}
	return div;
}

org.sarsoft.view.EntityForm.prototype._createField = function(field) {
	var div = document.createElement("div");
	div.className = "item";
	var label = document.createElement("label");
	label.htmlFor = field.name;
	label.appendChild(document.createTextNode(field.label ? field.label : field.name));
	div.appendChild(label);
	var type = field.type;
	var elt;
	if(type instanceof Array) {
		elt = document.createElement("select");
		elt.name = field.name;
		for(var i = 0; i < type.length; i++) {
			var opt = document.createElement("option");
			opt.appendChild(document.createTextNode(type[i]));
			opt.value= type[i];
			elt.appendChild(opt);
		}
	}
	else {
		if(typeof org.sarsoft.view.EntityForm._inputTypes[type] != "undefined") {
			type = org.sarsoft.view.EntityForm._inputTypes[type];
		}
		elt = document.createElement(type.node);
		elt.name = field.name;
		for(var key in type.params) {
			elt[key] = type.params[key];
		}
	}
	this.elements[field.name] = elt;
	div.appendChild(elt);
	if(field.hint != null) jQuery('<span class="hint" style="padding-left: 10px">' + field.hint + '</span>').appendTo(div);
	return div;
}

org.sarsoft.view.EntityForm.prototype.write = function(obj) {
	this._write(this.fields, obj);
}

org.sarsoft.view.EntityForm.prototype._write = function(fields, obj) {
	for(var i = 0; i < fields.length; i++) {
		var field = fields[i];
		if(field instanceof Array) {
			this._write(field, obj);
		} else {
			this._setValue(this.elements[field.name], obj[field.name]);
		}
	}
}

org.sarsoft.view.EntityForm.prototype.read = function() {
	var obj = new Object();
	this._read(this.fields, obj);
	return obj;
}

org.sarsoft.view.EntityForm.prototype._read = function(fields, obj) {
	for(var i = 0; i < fields.length; i++) {
		var field = fields[i];
		if(field instanceof Array) {
			this._read(field, obj);
		} else {
			obj[field.name] = this._getValue(this.elements[field.name]);
		}
	}
}

org.sarsoft.view.EntityForm.prototype._getValue = function(node) {
	if(node == null) return null;
	if(node.nodeName == "INPUT" && node.type == "checkbox") return node.checked;
	if(node.nodeName == "SELECT") return node.options[node.selectedIndex].value;
	return node.value;
}

org.sarsoft.view.EntityForm.prototype._setValue = function(node, value) {
	if(node == null) return;
	if(node.nodeName == "INPUT" && node.type == "checkbox") {
		node.checked = (value == true);
	} else if(node.nodeName == "SELECT") {
		for(var i = 0; i < node.options.length; i++) {
			if(node.options[i].value == value) {
				node.selectedIndex = i;
				return;
			}
		}
	} else {
		if(value == null) {
			node.value = "";
		} else {
			node.value = value;
		}
	}
}

org.sarsoft.TenantDAO = function(errorHandler, baseURL) {
	if(typeof baseURL == "undefined") baseURL = "/rest/tenant";
	this.baseURL = baseURL;
	this.errorHandler = errorHandler;
}

org.sarsoft.TenantDAO.prototype = new org.sarsoft.BaseDAO();

org.sarsoft.TenantDAO.prototype.loadByClassName = function(className, handler) {
	this._doGet("/?className=" + className, handler);
}

org.sarsoft.TenantDAO.prototype.loadRecent = function(className, handler) {
	this._doGet("/recent?className=" + className, handler);
}

org.sarsoft.TenantDAO.prototype.saveCenter = function(center, handler) {
	this._doPost("/center", handler, center);
}
org.sarsoft.view.TenantTable = function() {
	
	var permissionFormatter = function(cell, record, column, data) {
		var tenant = record.getData();
		var value = "N/A";
		if(tenant.allPerm == "WRITE") value = '<span style="white-space: nowrap">Edit with URL</span>';
		else if(tenant.passwordPerm == "WRITE" && tenant.allPerm == "READ") value = '<span style="white-space: nowrap">View with URL</span>, <span style="white-space: nowrap">Edit with Password</span>';
		else if(tenant.passwordPerm == "WRITE") value = '<span style="white-space: nowrap">Edit with Password</span>';
		else if(tenant.passwordPerm == "READ" && tenant.allPerm == "NONE") value = '<span style="white-space: nowrap">View with Password</span>';
		else if(tenant.allPerm == "READ") value = '<span style="white-space: nowrap">View with URL</span>';
		else if(tenant.passwordPerm == "NONE" && tenant.allPerm == "NONE") value = "Private";
		cell.innerHTML = value;
	}
	
    var alertBody = document.createElement('div');
    var alertDlg = org.sarsoft.view.AlertDialog("Sharing", alertBody);	

    var coldefs = [
		{ key : "publicName", label : "Name", sortable : true, 
			formatter : function(cell, record, column, data) { $(cell).css({"white-space": "nowrap"}); cell.innerHTML = '<a href="/' + ((record.getData().type == "org.sarsoft.plans.model.Search") ? "search" : "map") + '?id=' + record.getData().name + '">' + org.sarsoft.htmlescape(data) + '</a>' },
			sortOptions: {sortFunction: function(a, b, desc) { 
				return YAHOO.util.Sort.compare(a.getData("publicName"), b.getData("publicName"), desc); 
				}} },
		{ key : "owner", label: "Created By", sortable : true},
		{ key : "comments", label: "Comments", sortable: true, formatter : function(cell, record, column, data) { $(cell).css({overflow: "hidden", "max-height": "4em", "max-width": "30em"}); if(data != null && data.length > 120) data = data.substr(0,120) + "..."; cell.innerHTML = data;}},
		{ key : "allPerm", label : "Sharing", formatter : permissionFormatter },
		{ key : "name", label : "Actions", formatter : function(cell, record, column, data) { 
			if(record.getData().type == "org.sarsoft.markup.model.CollaborativeMap") {
				var guide = jQuery('<span><a href="/guide?id=' + record.getData().name + '">Printable Guide</a>,&nbsp;</span>').appendTo(cell);
			}
			var share = jQuery('<a href="javascript:return false;">Share</a>').appendTo(cell);
			share.click(function() { var rooturl = window.location.href.replace(window.location.pathname, "") + "/"; var html = 'Share this ';
			if(record.getData().type == "org.sarsoft.plans.model.Search") {
				html += 'map by giving people the following URL:<br/><br/>';
				var surl = rooturl + 'search?id=' + record.getData().name;
				html += '<a href="' + surl + '">' + surl + '</a>';
			} else {
				html += 'map by giving people the following URL:<br/><br/>';
				var murl = rooturl + 'map?id=' + record.getData().name;
				html += '<a href="' + murl + '">' + murl + '</a><br/><br/>';
				html += 'Embed it in a webpage or forum:<br/><br/><textarea rows="3" cols="45">&lt;iframe width="500px" height="500px" src="' + murl + '"&gt;&lt;/iframe&gt;</textarea>';
			}
			alertBody.innerHTML = html; alertDlg.show();});
			
		
		}}
	];
	org.sarsoft.view.EntityTable.call(this, coldefs, {});
}
org.sarsoft.view.TenantTable.prototype = new org.sarsoft.view.EntityTable();

org.sarsoft.view.EntityCreateDialog = function(title, entityform, handler, okButton) {
	if(okButton == null) okButton = "Create";
	var that = this;
	this.handler = handler;
	this.entityform = entityform;
	this.body = document.createElement("div");
	entityform.create(this.body);
	this.dialog = org.sarsoft.view.CreateDialog(title, this.body, okButton, "Cancel", function() {
		var obj = that.entityform.read();
		that.entityform.write(new Object());
		handler(obj);
	},  {left: "200px", width: "400px"});
}

org.sarsoft.view.EntityCreateDialog.prototype.show = function(obj) {
	if(obj != null) this.entityform.write(obj);
	this.dialog.show();
}

org.sarsoft.view.CreateDialog = function(title, bodynode, yes, no, handler, style) {
	var dlgStyle = {width: "350px", position: "absolute", top: "100px", left: "100px", "z-index": "2500"};
	if(style != null) for(var key in style) {
		dlgStyle[key] = style[key];
	}
	
	if(typeof(bodynode)=="string") bodynode = jQuery('<div>' + bodynode + '</div>')[0];
	
	var dlg = jQuery('<div><div class="hd">' + title + '</div></div>');
	dlg.css(dlgStyle);
	this.bd = jQuery('<div class="bd"></div>').appendTo(dlg);
	this.bd.append(bodynode);
	
	var dialog = null;
	var ok = function() {
		dialog.hide();
		handler();
	}

	var buttons = [ { text : yes, handler: ok, isDefault: true}, {text : no, handler : function() { dialog.hide(); }}];
	dialog = new YAHOO.widget.Dialog(dlg[0], {buttons: buttons});
	dialog.render(document.body);
	dialog.hide();
	dialog.ok = ok;
	return dialog;
}

org.sarsoft.view.AlertDialog = function(title, bodynode, style) {
	var dlgStyle = {width: "350px", position: "absolute", top: "100px", left: "100px", "z-index": "2500"};
	if(style != null) for(var key in style) {
		dlgStyle[key] = style[key];
	}
	
	if(typeof(bodynode)=="string") bodynode = jQuery('<div>' + bodynode + '</div>')[0];
	
	var dlg = jQuery('<div><div class="hd">' + title + '</div></div>');
	dlg.css(dlgStyle);
	this.bd = jQuery('<div class="bd"></div>').appendTo(dlg);
	this.bd.append(bodynode);
	
	var dialog = null;
	var buttons = [{ text : "OK", handler: function() { dialog.hide(); }, isDefault: true}];
	dialog = new YAHOO.widget.Dialog(dlg[0], {buttons: buttons});
	dialog.render(document.body);
	dialog.hide();
	return dialog;
}

org.sarsoft.PasswordDialog = function() {
	var bodynode = jQuery('<form action="/password" method="post">This will reload the page you are on.<br/>' +
			'<input type="hidden" name="dest" value="' + window.location + '"/><label for="password">Password:</label><input type="password" name="password" length="10"/></form>');
	return new org.sarsoft.view.CreateDialog("Enter Password", bodynode, "Enter", "Cancel", function() {
		bodynode.submit();
	});
}

org.sarsoft.ToggleControl = function(label, tooltip, handler, states) {
	var that = this;
	if(states == null) states = [{value: true, style: ""}, {value: false, style: "text-decoration: line-through"}];
	this.states = states;
	this.state = states[0].value;
	var toggle = document.createElement("a");
	toggle.title = tooltip;
	toggle.style.cursor = "pointer";
	toggle.innerHTML = "<span style='" + states[0].style + "'>" + label + "</span>";
	this.node = toggle;
	this.label = label;

	GEvent.addDomListener(toggle, "click", function() {
		for(var i = 0; i < states.length; i++) {
			if(states[i].value == that.state) {
				var j = i+1;
				if(j >= states.length) j = 0;
				that.state = states[j].value;
				toggle.innerHTML = "<span style='" + states[j].style + "'>" + label + "</span>";
				handler(states[j].value);
				return;
			}
		}
	});
}

org.sarsoft.ToggleControl.prototype.setValue = function(value) {
	for(var i = 0; i < this.states.length; i++) {
		if(this.states[i].value == value) {
			this.state = value;
			this.node.innerHTML = "<span style='" + this.states[i].style + "'>" + this.label + "</span>";
		}
	}
}

org.sarsoft.GPSComms = function(container) {
	var that = this;
	this.div = jQuery('<div style="width: 400px; height: 5em"></div>').appendTo(container);
	
}

org.sarsoft.GPSComms.prototype.console = function(str) {
	this.div.append('<div>' + str + '</div>');
}

org.sarsoft.GPSComms.prototype.onFinishFindDevices = function() {
	var devices = this.control.getDevices();
	if(devices.length > 1) {
		this.console('The following GPS devices were found.  <span class="warning">Please attach 1 GPS device at a time</span>:');
	    for( var i=0; i < devices.length; i++ ) {
	        this.console(devices[i].getDisplayName());
	    }
	    return;
	}
	if(devices.length == 0) {
		this.console('No GPS found.  <span class="warning">Please attach a GPS and try again.</span>');
		return;
	}
	var device = devices[0];
	if((this._write && !device._gpxType.writeAccess) || (!this._write && !device._gpxType.readAccess)) {
		this.console('<span class="warning">Device does not support ' + (this._write ? "writing" : "reading") + '</span>');
		return;
	}
	this.console((this._write ? "Writing data to " : "Reading data from ") + device.getDisplayName() + " . . .");
	if(this._write) {
		this.control.writeDataToDevice(Garmin.DeviceControl.FILE_TYPES.gpx, this.gpxstr, this.name);
	} else {
		this.control.readFromDevice();
	}
}

org.sarsoft.GPSComms.prototype.onFinishWriteToDevice = function() {
	this.console('<span style="font-weight: bold; color: green">Done!</span>');
}

org.sarsoft.GPSComms.prototype.onCancelWriteToDevice = function() {
	this.console('<span class="warning">Operation Canceled</span>');
}

org.sarsoft.GPSComms.prototype.onException = function() {
	this.console('<span class="warning">GPS Exception: ' + this.control.msg + '</span>');
}

org.sarsoft.GPSComms.prototype.onFinishReadFromDevice = function() {
	var gpx = this.control.gpsDataString;
	globalgpx = gpx;
	this.console('<span style="font-weight: bold; color: green">Done!</span>');
    var dao = new org.sarsoft.BaseDAO();
    dao.baseURL = "";
	dao._doPost(this._url, function() { window.location.reload(); }, {gpx:gpx}, this._poststr);
}

org.sarsoft.GPSComms.prototype.retry = function() {
	var that = this;
	this.div.html("");
	
    if(this.control == null) {
    	this.console("Initializing Garmin plugin . . .");
		// TODO alert user if plugin doesn't exist
		if(PluginDetect.detectGarminCommunicatorPlugin() && __garminPluginCreated == false) {
			installGarminPlugin();
		}
		try {
			this.control = new Garmin.DeviceControl(this);
		} catch (e) {
			this.console('<span class="warning">Error initializing Garmin Communicator plugin.</span>');
			this.console('Please visit <a href="http://www8.garmin.com/products/communicator/" target="_new">http://www8.garmin.com/products/communicator/</a> to install the plugin.');
		}
	}

	var unlocked = this.control.unlock( [org.sarsoft.garmin.hostName,org.sarsoft.garmin.deviceKey] );
	if(!unlocked) {
		this.console('<span class="warning">Unable to unlock Garmin plugin.</span>');
		if(org.sarsoft.garmin.deviceKey == "null") this.console("No garmin device key found for hostname " + org.sarsoft.garmin.hostName + ".  You man need to update this server's configuration.");
		return;
	}

	if(this._write) {
		  this.console("Retrieving GPS data from server . . .");
		  var url = this._url;
		  if(org.sarsoft.tenantid != null) url = url + (url.indexOf("?") < 0 ? "?tid=" : "&tid=") + encodeURIComponent(org.sarsoft.tenantid);
		  YAHOO.util.Connect.asyncRequest('GET', url, { success : function(response) {
			  	that.gpxstr = response.responseText;
				that.control.findDevices();
			}, failure : function(response) {
				that.console('<span class="warning">Error loading GPX file from server</span>');
			}});
		} else {
			that.control.findDevices();
		}
}

org.sarsoft.GPSComms.prototype.init = function(write, url, name, handler, poststr) {
	var that = this;
	this._write = write;
	this._url = url;
	this._name = name;
	this._poststr = poststr;
	
	if(typeof(__garminJSLoaded) == "undefined") {
		jQuery.getScript("/static/js/garmin.js", function() {
			that.init(write, url, name, handler, poststr);
		});
		return;
	}

	this.retry();
}


org.sarsoft.GPSDlg = function() {
	var that = this;
	var dlgStyle = {width: "410px", position: "absolute", top: "100px", left: "100px", "z-index": "2500"};

	var dlg = jQuery('<div><div class="hd">GPS Transfer</div></div>');
	dlg.css(dlgStyle);
	this.bd = jQuery('<div class="bd"></div>').appendTo(dlg);
	this.comms = new org.sarsoft.GPSComms(this.bd);
	
	var dialog = null;
	var buttons = [{text : "Try Again", handler: function() {that.comms.retry()}},{ text : "OK", handler: function() { that.dialog.hide(); }, isDefault: true}];
	this.dialog = new YAHOO.widget.Dialog(dlg[0], {buttons: buttons});
	this.dialog.render(document.body);
	this.dialog.hide();	
}


org.sarsoft.GPSDlg.prototype.show = function(write, url, name, handler, poststr) {
	this.comms.init(write, url, name, handler, poststr);

	this.dialog.show();	
}

function sarsoftInit() {
	if(typeof YAHOO != "undefined") {
		org.sarsoft.Loader.execute();
	} else {
		window.setTimeout(250, sarsoftInit);
	}
}
sarsoftInit();