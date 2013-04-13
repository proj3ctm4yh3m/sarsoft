if(!Object.keys) Object.keys = function(o){
if (o !== Object(o))
throw new TypeError('Object.keys called on non-object');
var ret=[],p;
for(p in o) if(Object.prototype.hasOwnProperty.call(o,p)) ret.push(p);
return ret;
}

if (!Array.prototype.filter)
{
  Array.prototype.filter = function(fun /*, thisp*/)
  {
    var len = this.length;
    if (typeof fun != "function")
      throw new TypeError();

    var res = new Array();
    var thisp = arguments[1];
    for (var i = 0; i < len; i++)
    {
      if (i in this)
      {
        var val = this[i]; // in case fun mutates this
        if (fun.call(thisp, val, i, this))
          res.push(val);
      }
    }

    return res;
  };
}

if (!Array.prototype.indexOf) {
	Array.prototype.indexOf = function(elt) {
		for(var i = 0; i < this.length; i++) {
			if(this[i] == elt) return i;
		}
		return -1;
	}
}

if(typeof org == "undefined") org = new Object();
if(typeof org.sarsoft == "undefined") org.sarsoft = new Object();
if(typeof org.sarsoft.view == "undefined") org.sarsoft.view = new Object();
if(typeof org.sarsoft.preload == "undefined") org.sarsoft.preload = new Object();

org.sarsoft.touch = (navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry)/) != null);
org.sarsoft.mobile = org.sarsoft.touch && $(window).width() < 600;
try {
	org.sarsoft.iframe = !(window==top);
} catch (e) {
	org.sarsoft.iframe = true;
}

org.sarsoft.writeable = (sarsoft.permission == "WRITE" || sarsoft.permission == "ADMIN" || sarsoft.tenant == null)

org.sarsoft.async = function(fn) {
	window.setTimeout(fn, 0);
}

$.img = function(url) {
	if(url.indexOf("/") != 0) url = "/" + url;
	return sarsoft.imgprefix + url;
}

org.sarsoft.setCookieProperty = function(cookie, prop, value) {
	var obj = {}
	if(YAHOO.util.Cookie.exists(cookie)) {
		obj = YAHOO.lang.JSON.parse(YAHOO.util.Cookie.get(cookie));
	}
	obj[prop] = value;
	YAHOO.util.Cookie.set(cookie, YAHOO.lang.JSON.stringify(obj), { path: "/"});
}

org.sarsoft.getCookieProperty = function(cookie, prop) {
	var obj = {}
	if(YAHOO.util.Cookie.exists(cookie)) {
		obj = YAHOO.lang.JSON.parse(YAHOO.util.Cookie.get(cookie));
	}
	return obj[prop];
}

org.sarsoft.htmlescape = function(str, newline) {
	if(str == null) return "";
	if(typeof(str) == "number") str = String(str);
	if(newline) return str.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\n/g, "<br/>");
	return str.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

org.sarsoft.BaseDAO = function() {
	this.objs = []
	this.listeners = [];
}

org.sarsoft.BaseDAO.prototype.setObj = function(id, obj) {
	this.objs[id] = obj;
}

org.sarsoft.BaseDAO.prototype.getObj = function(id) {
	return this.objs[id];
}

org.sarsoft.BaseDAO.prototype._doPost = function(url, handler, obj, poststr) {
	var that = this;
	postdata = "json=" + encodeURIComponent(YAHOO.lang.JSON.stringify(obj));
	if(typeof poststr != "undefined") postdata += "&" + poststr;
	if(sarsoft.tenant != null) postdata += "&tid=" + encodeURIComponent(sarsoft.tenant.name);
	YAHOO.util.Connect.resetDefaultHeaders();
	YAHOO.util.Connect.setDefaultPostHeader(false);
	YAHOO.util.Connect.initHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
	YAHOO.util.Connect.asyncRequest('POST', this.baseURL + url, { success : function(response) {
			$(org.sarsoft.BaseDAO).triggerHandler('success');
			handler(YAHOO.lang.JSON.parse(response.responseText));
		}, failure : function(response) {
			if(!org.sarsoft._saveAlertFlag) {
				org.sarsoft._saveAlertFlag = true;
				alert("Server Communication Error!  Data may not be getting saved properly, reloading this page may solve the problem.  This message will not be shown again until you reload the page, but the problem may persist");
			}
			$(org.sarsoft.BaseDAO).triggerHandler('failure');
			throw("AJAX ERROR posting to " + that.baseURL + url + ": " + response.responseText);
		}}, postdata);
}

org.sarsoft.BaseDAO.prototype._doGet = function(url, handler) {
	var that = this;
	var url = this.baseURL + url;
	if(sarsoft.tenant != null) url = url + (url.indexOf("?") < 0 ? "?tid=" : "&tid=") + encodeURIComponent(sarsoft.tenant.name);
	YAHOO.util.Connect.asyncRequest('GET', url, { success : function(response) {
			handler(YAHOO.lang.JSON.parse(response.responseText));
		}, failure : function(response) {
			throw("AJAX ERROR getting from " + url + ": " + response.responseText);
		}});
}

org.sarsoft.BaseDAO.prototype._doDelete = function(url, handler) {
	var that = this;
	var url = this.baseURL + url;
	if(sarsoft.tenant != null) url = url + (url.indexOf("?") < 0 ? "?tid=" : "&tid=") + encodeURIComponent(sarsoft.tenant.name);
	YAHOO.util.Connect.asyncRequest('DELETE', url, { success : function(response) {
			$(org.sarsoft.BaseDAO).triggerHandler('success');
			handler(YAHOO.lang.JSON.parse(response.responseText));
		}, failure : function(response) {
			$(org.sarsoft.BaseDAO).triggerHandler('failure');
			throw("AJAX ERROR getting from " + url + ": " + response.responseText);
		}});
}

org.sarsoft.BaseDAO.prototype.create = function(obj, handler) {
	var that = this;
	this._doPost("/", function(r) {
		that.setObj(r.id, r);
		$(that).triggerHandler('create', r);
		if(handler) handler(r);
	}, obj);
}

org.sarsoft.BaseDAO.prototype.save = function(id, obj, handler) {
	var that = this;
	this._doPost("/" + id + ".do", function(r) {
		that.setObj(r.id, r)
		$(that).triggerHandler('save', r);
		if(handler) handler(r)
	}, obj);
}

org.sarsoft.BaseDAO.prototype.del2 = function(id, handler) {
	var that = this;
	this._doPost("/" + id + ".do", function() { delete that.objs[id]; if(handler != null) handler() }, new Object(), "action=delete");
}

org.sarsoft.BaseDAO.prototype.del = function(id, handler) {
	var that = this;
	this._doDelete("/" + id + ".do", function(r) {
		delete that.objs[id];
		$(that).triggerHandler('delete', r);
		if(handler) handler(r);
	});
}

org.sarsoft.BaseDAO.prototype.load = function(id, handler) {
	var that = this;
	this._doGet("/" + id + ".do", function(r) {
		that.setObj(r.id, r);
		$(that).triggerHandler('load', r);
		if(handler) handler(r);
	});
}

org.sarsoft.BaseDAO.prototype.mark = function() {
	var that = this;
	var url = "/rest/timestamp";
	if(sarsoft.tenant != null) url = url + "?tid=" + encodeURIComponent(sarsoft.tenant.name);
	YAHOO.util.Connect.asyncRequest('GET', url, { success : function(response) {
			that._timestamp = YAHOO.lang.JSON.parse(response.responseText).timestamp;
		}, failure : function(response) {
			that.errorHandler();
		}});
}

org.sarsoft.BaseDAO.prototype.loadSince = function(handler) {
	var that = this;
	this._doGet("/since/" + this._timestamp, function(r) {
		for(var i = 0; i < r.length; i++) {
			that.setObj(r[i].id, r[i]);
			$(that).triggerHandler('load', r[i]);
			if(handler) handler(r[i]);
		}
	});
}

org.sarsoft.BaseDAO.prototype.loadAll = function(handler) {
	var that = this;
	this._doGet("/", function(r) {
		for(var i = 0; i < r.length; i++) {
			if(handler) handler(r[i]);
			that.setObj(r[i].id, r[i]);
			$(that).triggerHandler('load', r[i]);
			$(that).triggerHandler('loadall', r[i]);
		}
	});
}

org.sarsoft.SearchDAO = function(errorHandler, baseURL) {
	if(typeof baseURL == "undefined") baseURL = "/rest/search";
	this.baseURL = baseURL;
	this.errorHandler = errorHandler;
}

org.sarsoft.SearchDAO.prototype = new org.sarsoft.BaseDAO();

org.sarsoft.BrowserCheck = function() {
	if(YAHOO.util.Cookie.get("sarsoftBrowserCheck") == "checked") return;
	if($.browser.msie && 1*$.browser.version < 9) {
		YAHOO.util.Cookie.set("sarsoftBrowserCheck", "checked", {path: "/"});
		alert("Please be aware that " + sarsoft.version + " has some features that are incompatible with versions of Internet Explorer prior to IE 9.")
	} else if($.browser.mozilla && 1*$.browser.version < 3.6) {
		YAHOO.util.Cookie.set("sarsoftBrowserCheck", "checked", {path: "/"});
		alert("Please be aware that " + sarsoft.version + " has some features that may be incompatible with older versions of Firefox");
	}
}

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

org.sarsoft.view.CreateSlider = function(container, width) {
	if(width == null) width = 100;
	var sliderbg = jQuery('<div class="yui-h-slider" style="background: none; border-bottom: 1px solid #808080; width: ' + (width + 5) + 'px; float: left; margin-left: 5px; height: 6px"></div>');
	container.append('<div style="float: left"><span style="color: #606060; margin-left: 5px">0</span></div>', sliderbg, '<div style="float: left; margin-left: 5px; color: #606060">100</div>');
	var sliderthumb = jQuery('<div class="yui-slider-thumb" style="cursor: pointer; width: 5px; height: 12px; top: 0px; background-color: black">&#32;</div>').appendTo(sliderbg);
	return YAHOO.widget.Slider.getHorizSlider(sliderbg[0], sliderthumb[0], 0, width);
}

org.sarsoft.view.DropMenu = function(scale) {
	var that = this;
	this.groups = {}
	this.values = {}
	this.scale = scale || 100;
	if(org.sarsoft.touch) {
		this.mobile = true;
		this.container = jQuery('<select></select>');
	} else {
		this.container = jQuery('<span style="display: inline-block; border: 1px solid #CCCCCC; color: black"></span>');
		this.holder = jQuery('<span style="position: relative; z-index: 2000; vertical-align: text-top"></span>').appendTo(this.container);
		this.select = jQuery('<span style="display: inline-block; width: 100%; cursor: pointer; font-weight: bold; font-size: ' + this.scale + '%"></span>').appendTo(this.container).hover(function() { that.select.addClass("yuimenuitem-selected") }, function() { that.select.removeClass("yuimenuitem-selected")});
		this.label = jQuery('<span style="padding-left: 10px">&nbsp;</span>').appendTo(this.select);
		this.dd = jQuery('<span style="float: right">&darr;</span>').appendTo(this.select);
		var id = "DropMenu_" + org.sarsoft.view.DropMenu._idx++;
		this.menu = jQuery('<div class="yui-module yui-overlay yuimenu" style="position: absolute; left: 0; top: 1.5em;"></div>').appendTo(this.holder);
		this.bd = jQuery('<div class="bd"></div>').appendTo(this.menu);
		this.ul = jQuery('<ul class="first-of-type cs" style="max-height: 150px; overflow-y: auto"></ul>').appendTo(this.bd);
		this.select.click(function() {
			if(that.menu.css('visibility')=='visible') {
				that.hide();
			} else {
				that.show();
			}
		});
		this.bd.mouseout(function() {
			if(that.timer != null) clearTimeout(that.timer);
			that.timer = setTimeout(function() {that.hide()}, 300);
		});
		this.bd.mouseover(function() {
			if(that.timer != null) clearTimeout(that.timer);
		});
	}
}

org.sarsoft.view.DropMenu._idx = 0;

org.sarsoft.view.DropMenu.prototype.addItem = function(text, value, group, title) {
	var that = this;
	if(this.value == null) this.value = value;
	
	if(this.mobile) {
		this.container.append('<option value="' + value + '">' + text + '</option>');
		return;
	}
	
	this.values[value] = text;
	var li = jQuery('<li class="yuimenuitem"></li>').appendTo(this.ul);
	var a = jQuery('<a href="javascript:void{}" class="yuimenuitemlabel" style="cursor: pointer; font-weight: bold; padding-left: 10px">' + text + '</a>').appendTo(li);
	a.hover(function() { li.addClass("yuimenuitem-selected") }, function() { li.removeClass("yuimenuitem-selected")});
	a.click(function() { that.val(value); that.change(); that.hide()});
	if(title != null) a.attr("title", title);
	
	if(group != null) {
		this.addGroup(group);
		this.groups[group].slice(-1)[0].after(li);
		this.groups[group].push(li);
		if(this.groups[group].length == 3) {
			this.groups[group][0].css('display', 'list-item');
			this.groups[group][1].children().css({'font-weight': 'normal','padding-left': '20px'});
		}
		if(this.groups[group].length > 2) {
			a.css({'font-weight': 'normal', 'padding-left': '20px'});
		}
	}
	
	if(this.scale > 100) this.menu.css('min-width', "0px")
	var size = Math.ceil(this.menu.width()*(this.scale/100)) + "px";
	this.container.css('width', size);
	if(this.scale > 100) this.menu.css('min-width', size)
}

org.sarsoft.view.DropMenu.prototype.addGroup = function(text) {
	if(this.groups[text] != null) return;
	var that = this;
	var li = jQuery('<li class="yuimenuitem" style="display: none"></li>').appendTo(this.ul);
	var a = jQuery('<a href="javascript:void{}" class="yuimenuitemlabel" style="font-weight: bold; padding-left: 10px">' + text + '</a>').appendTo(li);
	this.container.css('width', this.ul.width() + "px");
	this.groups[text] = [li];
}

org.sarsoft.view.DropMenu.prototype.checkContainerWidth = function() {
	if(this.ul != null) this.container.css('width', this.ul.width() + "px");	
}

org.sarsoft.view.DropMenu.prototype.show = function() {
	var available = $(document.body).height() - (this.select.position().top + this.select.height() + 20);
	this.ul.css({'max-height': available + "px"});
	this.menu.css({'top': '1.5em'});
	this.menu.css({'visibility': 'visible'});
}

org.sarsoft.view.DropMenu.prototype.hide = function() {
	this.menu.css('visibility', 'hidden');
	this.ul.css({'max-height': "150px"});
}

org.sarsoft.view.DropMenu.prototype.empty = function() {
	if(this.mobile) return this.container.empty();
	this.groups = {};
	this.value = null;
	this.ul.empty();
}

org.sarsoft.view.DropMenu.prototype.val = function(val) {
	if(this.mobile) {
		if(val == null) return this.container.val();
		return this.container.val(val); // passing null not the same as passing no arg
	}
	if(val == null) return this.value;
	this.value = val;
	this.label.html(this.values[val]);
}

org.sarsoft.view.DropMenu.prototype.change = function(fn) {
	if(this.mobile) {
		if(fn == null) return this.container.change();
		return this.container.change(fn);
	}
	if(fn != null) {
		this.listener=fn;
		return;
	}
	if(this._hold) return;
	this._hold = true;
	if(this.listener != null) this.listener(this.value);
	this._hold = false;
}


org.sarsoft.view.DropSelect = function(text, css) {
	var that = this;
	this.text = text;
	this.css = css || {};
	this.container = jQuery('<span style="display: inline-block;"></span>');
	this.holder = jQuery('<span style="position: relative; z-index: 2000; vertical-align: text-top"></span>').appendTo(this.container);
	this.select = jQuery('<span style="display: inline-block; width: 100%; cursor: pointer; font-weight: bold; padding-left: 10px; padding-right: 10px"></span>').html(text).css(css).appendTo(this.container);
	var id = "DropMenu_" + org.sarsoft.view.DropMenu._idx++;
	this.menu = jQuery('<div class="yui-module yui-overlay yuimenu" style="position: absolute; display: none; left: 0; top: 1.5em; visibility: visible"></div>').appendTo(this.holder);
	this.bd = jQuery('<div class="bd"></div>').appendTo(this.menu);
	this.ul = jQuery('<ul class="first-of-type"></ul>').appendTo(this.bd);
	this.select.click(function() {
		if(that.menu.css('display')=='block') {
			that.hide();
		} else {
			$(that).triggerHandler('show');
			that.show();
		}
	});
	this.bd.mouseout(function() {
		if(that.timer != null) clearTimeout(that.timer);
		that.timer = setTimeout(function() {that.hide()}, 300);
	});
	this.bd.mouseover(function() {
		if(that.timer != null) clearTimeout(that.timer);
	});
}

org.sarsoft.view.DropSelect._idx = 0;

org.sarsoft.view.DropSelect.prototype.addItem = function(text, handler) {
	var that = this;
	
	var li = jQuery('<li class="yuimenuitem"></li>').appendTo(this.ul);
	var a = jQuery('<a href="javascript:void{}" class="yuimenuitemlabel" style="cursor: pointer; font-weight: bold; padding-left: 10px">' + text + '</a>').css(this.css).appendTo(li);
	a.hover(function() { li.addClass("yuimenuitem-selected") }, function() { li.removeClass("yuimenuitem-selected")});
	a.click(function() { handler(); that.hide()});

	if(this.container.width() > 0) {
		this.container.css('width', Math.max(this.container.width(), this.ul.width()) + "px");
		this.ul.css('min-width', this.container.css('width'));
	}
}

org.sarsoft.view.DropSelect.prototype.show = function() {
	if(this.select.position().top + this.select.height() + this.menu.height() + 20 > $(document.body).height()) {
		this.menu.css({'top': '-' + this.menu.height() + "px"});
	} else {
		this.menu.css({'top': '1.5em'});
	}
	this.menu.css({'display': 'block'});
}

org.sarsoft.view.DropSelect.prototype.hide = function() {
	this.menu.css('display', 'none');
}


org.sarsoft.view.ContextMenu = function() {
	var id = "ContextMenu_" + org.sarsoft.view.ContextMenu._idx++;
	this.menu = new YAHOO.widget.Menu(id, { hidedelay : 500, showdelay : 0, zIndex: "2001"});
	this.menu.render(document.body);
}

org.sarsoft.view.ContextMenu._idx = 0;

org.sarsoft.view.ContextMenu.prototype.setItems = function(items) {
	this.items = items;
}

org.sarsoft.view.ContextMenu.prototype._addItems = function(menu, items, subject, data) {
	var pc_fn = [];
	var pc_result = [];

	var createhandler = function(idx) {
		return function() { data.pc = pc_result[pc_fn.indexOf(items[idx].precheck)]; items[idx].handler(data) }
	}
	
	for(var i = 0; i < items.length; i++) {
		var pc = items[i].precheck;
		if(pc != null && pc_fn.indexOf(pc) < 0) {
			pc_fn.push(pc);
			pc_result.push(pc(subject));
		}
		if(items[i].applicable((pc == null) ? subject : pc_result[pc_fn.indexOf(pc)])) {
			if(items[i].items != null) {
				var submenu = new YAHOO.widget.Menu("ContextMenu_" + org.sarsoft.view.ContextMenu._idx++, { hidedelay : 750, showdelay : 0, zIndex : "2010"});
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

org.sarsoft.view.MenuDropdown = function(html, css, parent, onShow) {
	var that = this;
	this.onShow = onShow;
	var container = jQuery('<span style="position: relative"></span>');
	var trigger = jQuery('<span style="cursor: pointer"></span>').append(html).appendTo(container);
	
	this.isArrow = (html == "&darr;");

	var div = jQuery('<div style="color: black; font-weight: normal; visibility: hidden; background: white; position: absolute; right: 0; z-index: -1; ' + ($.browser.msie ? 'top: 0em; padding-top: 1.5em; ' : 'top: 0em; padding-top: 1.5em; ') + css + '"></div>');
	div.appendTo(parent != null ? parent : container);
	trigger.click(function() {
		if(div.css("visibility")=="hidden") {
			that.show();
		} else {
			that.hide();
		}
	});
		
	this.content = jQuery('<div style="padding-top: 2px"></div>').appendTo(div);
	var upArrow = jQuery('<span style="color: red; font-weight: bold; cursor: pointer; float: right; padding-right: 5px; padding-left: 5px; font-size: larger">&uarr;</span>').appendTo(this.content);
	upArrow.click(function() {that.hide()});

	this.trigger = trigger;
	this.container = container[0];
	this.div = div;	
}

org.sarsoft.view.MenuDropdown.prototype.show = function() {
	this.div.css("visibility", "visible");
	if(this.isArrow) this.trigger.html('&uarr;');
	if(this.onShow != null) this.onShow();
}

org.sarsoft.view.MenuDropdown.prototype.hide = function() {
	this.div.css("visibility", "hidden");
	if(this.isArrow) this.trigger.html('&darr;');
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
	var tclass = YAHOO.widget.DataTable;
	if(this.config && this.config.height) tclass = YAHOO.widget.ScrollingDataTable;
	this.table = new tclass(container, this.coldefs, this.datasource, this.config);
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

org.sarsoft.CollaborativeMapDAO = function() {
	this.baseURL = "/rest/map";
}

org.sarsoft.CollaborativeMapDAO.prototype = new org.sarsoft.BaseDAO();

org.sarsoft.CollaborativeMapDAO.prototype.getMaps = function(handler) {
	this._doGet("/", handler);
}

org.sarsoft.CollaborativeMapDAO.prototype.setCenter = function(center, handler) {
	this._doPost("/center", handler, center);
}

org.sarsoft.CollaborativeMapDAO.prototype.setConfig = function(state, handler) {
	this._doPost("/config", handler, state);
}

org.sarsoft.CollaborativeMapDAO.prototype.getConfig = function(handler) {
	if(org.sarsoft.preload.MapConfig != null) {
		return org.sarsoft.async(function() {
			handler({ MapConfig: org.sarsoft.preload.MapConfig, MapLayers: org.sarsoft.preload.MapLayers });
		});
	}
	this._doGet("/config", handler);
}

org.sarsoft.LocalMapDAO = function() {
}

org.sarsoft.LocalMapDAO.prototype.getMaps = function() {
	var maps = [];
	for(var key in localStorage) {
		if(key.indexOf("map") == 0) {
			var id = Number(key.substr(3));
			maps[id] = YAHOO.lang.JSON.parse(localStorage[key]);
			maps[id].id = id;
		}
	}
	return maps;
}

org.sarsoft.LocalMapDAO.prototype.getMap = function(id) {
	var map = YAHOO.lang.JSON.parse(localStorage["map" + id]);
	map.id = id;
	return map;
}

org.sarsoft.LocalMapDAO.prototype.create = function(map) {
	var maps = this.getMaps();
	var min = 0;
	for(var id in maps) {
		min = Math.min(id, min);
	}
	min = min + 1;
	localStorage["map" + min] = YAHOO.lang.JSON.stringify(map);
	return min;
}

org.sarsoft.LocalMapDAO.prototype.saveState = function(id, state) {
	var map = YAHOO.lang.JSON.parse(localStorage["map" + id]);
	map.state = state;
	localStorage["map" + id] = YAHOO.lang.JSON.stringify(map);
}

org.sarsoft.LocalMapDAO.prototype.del = function(id) {
	delete localStorage["map" + id];
}

org.sarsoft.LocalMapDAO.prototype.listen = function(event) {
	var that = this;
	for(var type in org.sarsoft.MapState.daos) {
		$(org.sarsoft.MapState.daos[type]).bind(event, function() { that.saveState(sarsoft.local.id, org.sarsoft.MapState.get()); });
	}
}

org.sarsoft.view.TenantList = function(container) {
	this.block = jQuery('<div></div>').appendTo(container);
}

org.sarsoft.view.TenantList.prototype.update = function(rows) {
	for(var i = 0; i < rows.length; i++) {
		var url = "map?id=" + rows[i].name
		if(rows[i].type == "org.sarsoft.plans.model.Search") url = "search?id=" + rows[i].name;
		jQuery('<div><a style="color: black; font-weight: bold; text-transform: capitalize" href="' + sarsoft.server + url + '">' + rows[i].publicName + '</a></div>').appendTo(this.block);
	}
}

org.sarsoft.view.TenantTable = function(cols) {
	if(cols == null) cols = {owner : true, comments : true, sharing : true, actions : true}
	var permissionFormatter = function(cell, record, column, data) {
		var tenant = record.getData();
		var value = "N/A";
		if(tenant.allUserPermission == "WRITE") value = '<span style="white-space: nowrap">Edit with URL</span>';
		else if(tenant.passwordProtectedUserPermission == "WRITE" && tenant.allUserPermission == "READ") value = '<span style="white-space: nowrap">View with URL</span>, <span style="white-space: nowrap">Edit with Password</span>';
		else if(tenant.passwordProtectedUserPermission == "WRITE") value = '<span style="white-space: nowrap">Edit with Password</span>';
		else if(tenant.passwordProtectedUserPermission == "READ" && tenant.allUserPermission == "NONE") value = '<span style="white-space: nowrap">View with Password</span>';
		else if(tenant.allUserPermission == "READ") value = '<span style="white-space: nowrap">View with URL</span>';
		else if(tenant.passwordProtectedUSerPermission == "NONE" && tenant.allUSerPermission == "NONE") value = "Private";
		cell.innerHTML = value;
	}
	
    var alertBody = document.createElement('div');
    var alertDlg = org.sarsoft.view.AlertDialog("Sharing", alertBody);	

    var coldefs = [
		{ key : "publicName", label : "Name", sortable : true, 
			formatter : function(cell, record, column, data) { $(cell).css({"white-space": "nowrap"}); cell.innerHTML = '<a href="/' + ((record.getData().type == "org.sarsoft.plans.model.Search") ? "search" : "map") + '?id=' + record.getData().name + '">' + org.sarsoft.htmlescape(data) + '</a>' },
			sortOptions: {sortFunction: function(a, b, desc) { 
				return YAHOO.util.Sort.compare(a.getData("publicName"), b.getData("publicName"), desc); 
				}} }];
    if(cols.owner) coldefs.push({ key : "owner", label: "Created By", sortable : true});
    if(cols.comments) coldefs.push({ key : "comments", label: "Comments", sortable: true, formatter : function(cell, record, column, data) { $(cell).css({overflow: "hidden", "max-height": "4em", "max-width": "30em"}); if(data != null && data.length > 120) data = data.substr(0,120) + "..."; cell.innerHTML = data;}});
	if(cols.sharing) coldefs.push({ key : "allUserPermission", label : "Sharing", formatter : permissionFormatter });
	if(cols.actions) coldefs.push({ key : "name", label : "Actions", formatter : function(cell, record, column, data) { 
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
		}});
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

	$(toggle).click(function() {
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
	this.div = jQuery('<div style="width: 400px; height: 5em; overflow-y: if-needed"></div>').appendTo(container);
	
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
	var that = this;
	var gpx = this.control.gpsDataString;
	globalgpx = gpx;
	this.console('<span style="font-weight: bold; color: green">Done!</span>');
    var dao = new org.sarsoft.BaseDAO();
    dao.baseURL = "";
	dao._doPost(this._url, function(response) {
		if(that._handler == null) {
			window.location.reload();
		} else {
			that._handler(response);
		}}, {gpx:gpx}, this._poststr);
}

org.sarsoft.GPSComms.prototype.clear = function() {
	this.div.html("");
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
			return;
		}
	}

	var unlocked = this.control.unlock( [sarsoft.garmin_hostname, sarsoft.garmin_devicekey] );
	if(!unlocked) {
		this.console('<span class="warning">Unable to unlock Garmin plugin.</span>');
		if(sarsoft.garmin_devicekey == "null") this.console("No garmin device key found for hostname " + sarsoft.garmin_hostname + ".  You man need to update this server's configuration.");
		return;
	}

	if(this._write) {
		  this.console("Retrieving GPS data from server . . .");
		  var url = this._url;
		  if(url.submit != null) {
			  $.ajax({type: 'POST', cache: false, url: url.attr("action"), data: url.serialize(), dataType: 'text', success: function(msg) { 
				  that.gpxstr = msg;
				  that.control.findDevices();
			  	}});
		  } else {
			  YAHOO.util.Connect.asyncRequest('GET', url, { success : function(response) {
				  	that.gpxstr = response.responseText;
					that.control.findDevices();
				}, failure : function(response) {
					that.console('<span class="warning">Error loading GPX file from server</span>');
				}});
		  }
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
	this._handler = handler;
	
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
	if(typeof YAHOO != "undefined" && typeof($) != "undefined") {
		org.sarsoft.Loader.execute();
	} else {
		window.setTimeout(sarsoftInit, 250);
	}
}
sarsoftInit();