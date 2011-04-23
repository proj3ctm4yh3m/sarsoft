if(typeof org == "undefined") org = new Object();
if(typeof org.sarsoft == "undefined") org.sarsoft = new Object();
if(typeof org.sarsoft.view == "undefined") org.sarsoft.view = new Object();


org.sarsoft.BaseDAO = function() {
//	this._timestamp = 0;
}

org.sarsoft.BaseDAO.prototype._doPost = function(url, handler, obj, poststr) {
	var that = this;
	postdata = "json=" + encodeURIComponent(YAHOO.lang.JSON.stringify(obj));
	if(typeof poststr != "undefined") postdata += "&" + poststr;
	YAHOO.util.Connect.resetDefaultHeaders();
	YAHOO.util.Connect.setDefaultPostHeader(false);
	YAHOO.util.Connect.initHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
	YAHOO.util.Connect.asyncRequest('POST', this.baseURL + url, { success : function(response) {
			handler(YAHOO.lang.JSON.parse(response.responseText));
		}, failure : function(response) {
			throw("AJAX ERROR posting to " + that.baseURL + url + ": " + response.responseText);
		}}, postdata);
}

org.sarsoft.BaseDAO.prototype._doGet = function(url, handler) {
	var that = this;
	YAHOO.util.Connect.asyncRequest('GET', this.baseURL + url, { success : function(response) {
			handler(YAHOO.lang.JSON.parse(response.responseText));
		}, failure : function(response) {
			throw("AJAX ERROR getting from " + that.baseURL + url + ": " + response.responseText);
		}});
}

org.sarsoft.BaseDAO.prototype.create = function(handler, obj) {
	this._doPost("/", handler, obj);
}

org.sarsoft.BaseDAO.prototype.save = function(id, obj) {
	this._doPost("/" + id + ".do", function() {}, obj);
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

if(typeof net == "undefined") net = new Object();
if(typeof org.sarsoft == "undefined") org.sarsoft = new Object();

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

org.sarsoft.view.ContextMenu = function() {
	var id = "ContextMenu_" + org.sarsoft.view.ContextMenu._idx++;
	this.menu = new YAHOO.widget.Menu(id, { hidedelay : 800, zIndex: "1000"});
	this.menu.render(document.body);
}

org.sarsoft.view.ContextMenu._idx = 0;

org.sarsoft.view.ContextMenu.prototype.setItems = function(items) {
	this.items = items;
}

org.sarsoft.view.ContextMenu.prototype.show = function(point, subject) {
	var that = this;
	this.data = {point: point, subject: subject};
	this.menu.clearContent();
	var createhandler = function(idx) {
		return function() { that.items[idx].handler(that.data)}
	}
	for(var i = 0; i < this.items.length; i++) {
		if(this.items[i].applicable(subject)) {
			var handler = this.items[i].handler;
			this.menu.addItem(new YAHOO.widget.MenuItem(this.items[i].text, { onclick: { fn: createhandler(i)}}));
		}
	}
	this.menu.moveTo(point.x, point.y);
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

org.sarsoft.view.EntityCreateDialog = function(title, entityform, handler) {
	var that = this;
	this.handler = handler;
	this.entityform = entityform;
	var dlg = document.createElement("div");
	dlg.style.position="absolute";
	dlg.style.zIndex="1000";
	dlg.style.top="200px";
	dlg.style.left="200px";
	dlg.style.width="400px";
	var hd = document.createElement("div");
	hd.appendChild(document.createTextNode(title));
	hd.className = "hd";
	dlg.appendChild(hd);
	var bd = document.createElement("div");
	bd.className = "bd";
	dlg.appendChild(bd);
	this.entityform.create(bd);
	this.dialog = new YAHOO.widget.Dialog(dlg, {zIndex: "1000", width: "400px"});
	var buttons = [ { text : "Create", handler: function() {
		that.dialog.hide();
		var obj = that.entityform.read();
		that.entityform.write(new Object());
		handler(obj);
	}, isDefault: true}, {text : "Cancel", handler : function() { that.dialog.hide(); }}];
	this.dialog.cfg.queueProperty("buttons", buttons);
	this._rendered = false;
	this.dialog.render(document.body);
	this.dialog.hide();
}

org.sarsoft.view.EntityCreateDialog.prototype.show = function(obj) {
	if(obj != null) this.entityform.write(obj);
	this.dialog.show();
}

if(org.sarsoft.yuiloaded == true) org.sarsoft.Loader.execute();
