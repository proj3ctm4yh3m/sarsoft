sarsoft.Controllers = {}

sarsoft.Page = function(opts) {
	$('#map_canvas').empty();
	map = this.map = org.sarsoft.EnhancedGMap.createMap(document.getElementById('map_canvas'), opts.center, opts.zoom);
	
	var map_opts = {UTM: true, switchableDatum: true, dn: (opts.dnclass || org.sarsoft.DataNavigator)}
	if(!org.sarsoft.iframe) {
		map_opts.positionWindow = opts.position;
		map_opts.size = opts.size && !org.sarsoft.mobile;
		map_opts.find = opts.find;
		map_opts.label = opts.label;
		map_opts.container = $('#page_container')[0];
	}

	imap = this.imap = new org.sarsoft.InteractiveMap(map, map_opts);
	if(opts.url) urlwidget = this.url = new org.sarsoft.MapURLHashWidget(this.imap, org.sarsoft.iframe || opts.bgload);	
	if(opts.config) {
		this.cfg = new opts.config(this.imap, (!org.sarsoft.iframe && sarsoft.permission != "READ"), true);
		this.cfg.loadConfig();
	}

	var max_priority = 0;
	for(var type in sarsoft.Controllers) {
		max_priority = Math.max(max_priority, sarsoft.Controllers[type][0]);
	}
	for(var i = 0; i <= max_priority; i++) {
		for(var type in sarsoft.Controllers) {
			if(sarsoft.Controllers[type][0] == i && opts[type] != false) this[type] = new sarsoft.Controllers[type][1](this.imap, opts.bgload);
		}
	}

	if(opts.print || (!org.sarsoft.iframe && opts.print != false)) this.print = new org.sarsoft.widget.Print(this.imap);
	if(opts.tools || (!org.sarsoft.iframe && opts.tools != false)) this.tools = new org.sarsoft.controller.MapToolsController(this.imap);

	if(!org.sarsoft.iframe) {
		org.sarsoft.BrowserCheck();
		google.maps.event.trigger(this.map, "resize");
	}
	
	if(!org.sarsoft.mobile && !org.sarsoft.iframe && !org.sarsoft.tenant && !org.sarsoft.local && imap.registered["org.sarsoft.MapFindWidget"]) imap.registered["org.sarsoft.MapFindWidget"].setState(true);

	$(document).ready(function() { $(document).bind("contextmenu", function(e) { return false;})});
}


org.sarsoft.CacheSettings = function() {
	this.cookie = "ct.offlinecache";
}

org.sarsoft.CacheSettings.prototype.get = function() {
	if(YAHOO.util.Cookie.exists(this.cookie)) return YAHOO.lang.JSON.parse(YAHOO.util.Cookie.get(this.cookie))[0];
}

org.sarsoft.CacheSettings.prototype.set = function(zoom, bounds, layers) {
	YAHOO.util.Cookie.set(this.cookie, YAHOO.lang.JSON.stringify([{zoom : zoom, layers : layers, bounds : bounds}]));
}

org.sarsoft.CacheSettings.prototype.getLatLngBounds = function() {
	var settings = this.get();	
	if(settings == null) return null;
	var wm = new org.sarsoft.WebMercator();
	var p_ne = wm.pixelsToMeters((settings.bounds[2])*256, (settings.bounds[3])*256, settings.zoom);
	var p_sw = wm.pixelsToMeters(settings.bounds[0]*256, settings.bounds[1]*256, settings.zoom);
	var ll_ne = wm.metersToLatLng(p_ne[0], p_ne[1]);
	var ll_sw = wm.metersToLatLng(p_sw[0], p_sw[1]);
	return new google.maps.LatLngBounds(new google.maps.LatLng(ll_sw[0], ll_sw[1]), new google.maps.LatLng(ll_ne[0], ll_ne[1]));
}


org.sarsoft.SaveAsDialog = function(imap, offline) {
	var that = this;
	this.body = $('<div style="clear: both"></div>');
	var name = $('<input type="text" name="name" placeholder="choose a map name"/>').appendTo($('<div style="clear: both; margin-bottom: 1ex">Save this as a map named </div>').appendTo(this.body));

	this.div = [];
	this.cb = [];
	
	var addBox = function(str, click) {
		var idx = that.div.length;
		that.div[idx] = $('<div style="float: left; width: 30%; margin-right: 10px"></div>').appendTo(that.body);
		that.cb[idx] = $('<input type="checkbox" style="vertical-align: text-top"/>').prependTo($('<div style="font-size: 120%; margin-bottom: 1ex; cursor: pointer">' + str + '</div>').appendTo(that.div[idx]).click(function() {
			if(!click) return;
			for(var i = 0; i < that.cb.length; i++) {
				that.cb[i][0].checked = (i == idx ? "checked" : null);
			}
		}));
	}

	addBox('Save to Your Account', sarsoft.account != null);

	addBox('Make a One Off Map', true);
	this.div[1].append('Share this map without tying it to your account.  ' + (sarsoft.account != null ? 'You\'ll still be able to edit it when signed in.' : 'If you want to edit it in the future, you\'ll need to enter a password below.'));
	var pw = $('<input type="password"/>').appendTo($('<div style="margin-top: 5px">Password: </div>').css('display', (sarsoft.account != null ? 'none' : 'block')).appendTo(this.div[1]));

	addBox('Save to Your Browser', sarsoft.local == null);

	this.body.append('<div style="clear: both"></div>');

	if(sarsoft.account == null) {
		this.cb[0].attr("disabled", "disabled");
		this.div[0].css('color', 'gray');
		this.cb[1][0].checked=true;
		this.div[0].append('In order to save editable maps to your Google or Yahoo account, please sign in:');
		new org.sarsoft.widget.Login(imap, this.div[0]);
	} else {
		this.div[0].append('Save an editable map to your ' + sarsoft.account.email + ' account.');
		this.cb[0][0].checked=true;
	}
	
	if(sarsoft.local == null) {
		this.div[2].append('Save this map in your browser\'s local storage for offline access.  Data is not backed up to ' + sarsoft.version);
	} else {
		this.cb[2].attr("disabled", "disabled");
		this.div[2].css('color', 'gray');
		this.div[2].append('This map is alread stored locally in your browser.');		
	}
	
	if(offline) {
		this.div[0].css('display', 'none');
		this.div[1].css('display', 'none');
		this.cb[0][0].checked=false;
		this.cb[1][0].checked=false;
		this.cb[2][0].checked=true;
	}

	this.dlg = new org.sarsoft.view.MapDialog(imap, "Save As", this.body, "Save", "Cancel", function() {
		if((name.val() || "").length == 0) {
			alert("Please enter a name for this map.");
			return;
		}
		if(that.cb[0][0].checked || that.cb[1][0].checked) {
			var newform = $('<form action="/map" method="post" style="display: none"></form>').appendTo(document.body);

			$('<input type="hidden" name="name"/>').appendTo(newform).val(name.val());
			
			var center = imap.map.getCenter();
			$('<input type="hidden" name="lat"/>').appendTo(newform).val(center.lat());
			$('<input type="hidden" name="lng"/>').appendTo(newform).val(center.lng());

			$('<input type="hidden" name="state"/>').appendTo(newform).val(YAHOO.lang.JSON.stringify(org.sarsoft.MapState.get(imap)));
			if(that.cb[1][0].checked) {
				 $('<input type="hidden" name="oneoff"/>').appendTo(newform).val("true");
				 $('<input type="hidden" name="password"/>').appendTo(newform).val(pw.val());
			}
			
			newform.submit();
		} else {
			var dao = new org.sarsoft.LocalMapDAO();
			var id = dao.create(name.val(), org.sarsoft.MapState.get(imap));
			window.location= (sarsoft.offline ? "/offline#" : "/map#") + id;
		}
	});

}

org.sarsoft.widget.Login = function(imap, container) {
	
	var login = function(provider) {
		if(sarsoft.tenant == null) {
			form_yahoo.append(jQuery('<input type="hidden" name="domain"/>').val(provider));
			form_yahoo.append(jQuery('<input type="hidden" name="dest"/>').val(window.location));
			form_yahoo.append(jQuery('<input type="hidden" name="state"/>').val(YAHOO.lang.JSON.stringify(org.sarsoft.MapState.get(imap))));
			form_yahoo.submit();
		} else {
			window.location='/app/openidrequest?domain=' + provider + '&dest=' + encodeURIComponent(window.location);
		}
	}

	var form_yahoo = jQuery('<form action="/app/openidrequest" method="POST"></form>');
	var login_yahoo = jQuery('<a href="#"><img style="border: none; vertical-align: middle" src="http://l.yimg.com/a/i/reg/openid/buttons/14.png"/></a>').appendTo(form_yahoo);
	login_yahoo.click(function() {
		login('yahoo');
	});
	var form_google = jQuery('<form action="/app/openidrequest" method="POST"></form>');
	var login_google = jQuery('<a href="#"><span style="font-weight: bold; color: #1F47B2">Sign in through G<span style="color:#C61800">o</span><span style="color:#BC2900">o</span>g<span style="color:#1BA221">l</span><span style="color:#C61800">e</span></span></a>').appendTo(form_google);
	login_google.click(function() {
		login('google');
	});
	container.append(jQuery('<div></div>').append(form_yahoo)).append(
			jQuery('<div style="white-space: nowrap; padding-top: 5px"></div>').append(form_google));
}

org.sarsoft.widget.Account = function(imap, container, acctlink) {
	var that = this;
	
	var bn = jQuery('<div></div>');
	var accountpane = new org.sarsoft.view.MapRightPane(imap, bn);
	var header = jQuery('<div style="float: left; width: 90%; padding-bottom: 1em"></div>').appendTo(bn);
	jQuery('<div style="font-size: 150%; font-weight: bold">Your Account</div>').appendTo(header);
	
	acctlink.click(function() {
		if(accountpane.visible()) {
			accountpane.hide();
		} else {
			accountpane.show();
		}
	});
	
	jQuery('<div style="clear: both"><a style="font-weight: bold; color: #5a8ed7" href="javascript:window.location=\'/app/logout?dest=/map.html#\' + org.sarsoft.MapURLHashWidget.createConfigStr(imap)">Logout of ' + sarsoft.version + '</a></div>').appendTo(bn);

	var uname = jQuery('<b></b>').appendTo(jQuery('<div style="max-width: 500px; padding-top: 1em">Your email is <b>' + sarsoft.account.email + '</b>.  By default, your account name will show up ' +
			'as a shortened version of your email.  You can choose a different username by entering it below or leave the box blank to ' +
			'use the default name.<br/><br/>Your current username is </div>').appendTo(bn));
	
	var i = jQuery('<input type="text" size="15" name="alias" value="' + sarsoft.account.alias + '"/>=').appendTo(bn);
	jQuery('<button>GO</button>').appendTo(bn).click(function() {
		var dao = new org.sarsoft.BaseDAO();
		dao.baseURL = "";
		dao._doPost("/rest/account", { success : function(obj) {
			i.val(obj.alias);
			accountpane.hide();
		}, failure: function(obj) {
			i.val(obj.alias);
			alert("Error updating username.");
		}
		}, {}, "alias=" + i.val());
	});
}

org.sarsoft.widget.Maps = function(imap, container) {
	var that = this;
	this.maps = jQuery('<div class="underlineOnHover"><img style="vertical-align: text-bottom; margin-right: 2px" src="' + $.img('/folder.png') + '"/>Your Maps</div>').appendTo(container);

	var bn = jQuery('<div></div>');
	var tenantpane = new org.sarsoft.view.MapRightPane(imap, bn);
	var header = jQuery('<div style="float: left; width: 90%; padding-bottom: 1em"></div>').appendTo(bn);

	this.maps.click(function() {
		if(tenantpane.visible()) {
			tenantpane.hide();
		} else {
			tenantpane.show();
		}
	});

	if(sarsoft.account) {
		jQuery('<div style="font-size: 150%; font-weight: bold">Maps Saved to Your Account</div>').appendTo(header);
		var newmap = jQuery('<div style="clear: both; padding-top: 5px"></div>').appendTo(header);

		var dao = new org.sarsoft.CollaborativeMapDAO();
		
		this.yourTable = new org.sarsoft.view.EntityTable([
	        {
	        	key : "name",
	        	label : "",
	        	formatter : function(cell, record, column, data) { 
	        		var d1 = $('<div></div>').appendTo(cell);
	        		var d2 = $('<div style="display: none; position: absolute; padding: 5px; background-color: white; border: 1px solid black">Delete ' + record.getData().description + ' - Are You Sure?</div>').appendTo(d1);
	        		var d3 = $('<div></div>').appendTo(d2);
	        		$('<span style="cursor: pointer; color: blue; font-weight: bold">Cancel</span>').appendTo(d3).click(function(evt) {
	        			evt.stopPropagation();
	        			d2.css('display', 'none');
	        		});
	        		$('<span style="cursor: pointer; color: red; font-weight: bold; margin-left: 20px">Delete</span>').appendTo(d3).click(function(evt) {
	        			evt.stopPropagation();
	        			dao.del(record.getData().name, function(r) {
	        				if(r.error) {
	        					alert(r.error);
	        				} else {
	        					that.yourTable.table.deleteRow(record);
	        				}
	        			});
	        		});
	        		$('<span style="cursor: pointer; color: red; font-weight: bold; margin-left: 20px">Detach</span>').prependTo($('<span> (will become a one-off map)</span>').appendTo(d3)).click(function(evt) {
	        			evt.stopPropagation();
	        			dao.save(record.getData().name, { detach : true}, function(r) {
	        				if(r.error) {
	        					alert(r.error);
	        				} else {
	        					var name = record.getData().name;
	        					that.yourTable.table.deleteRow(record);
	        					alert("This map is no longer attached to your account.  Read-only access is still available at \n\n" + sarsoft.server + "map?id=" + name);
	        				}
	        			});
	        		});
	        		var s1 = $('<span style="cursor: pointer; color: red; font-weight: bold">X</span>').prependTo(d1).click(function() {
	        			d2.css('display', 'block');
	        		});
	        	}
	        },{
				key : "publicName",
				label : "Name",
				sortable : true, 
				formatter : function(cell, record, column, data) { $(cell).css({"white-space": "nowrap"}); cell.innerHTML = '<a href="/map' + '?id=' + record.getData().name + '">' + org.sarsoft.htmlescape(data) + '</a>' },
				sortOptions: {sortFunction: function(a, b, desc) { return YAHOO.util.Sort.compare(a.getData("publicName"), b.getData("publicName"), desc); }}
			},{
				key : "comments",
				label: "Comments",
				sortable: true,
				formatter : function(cell, record, column, data) { $(cell).css({overflow: "hidden", "max-height": "4em", "max-width": "30em"}); if(data != null && data.length > 120) data = data.substr(0,120) + "..."; cell.innerHTML = (data || ""); }
			},{
				key : "allUserPermission",
				label : "Sharing",
				formatter : function(cell, record, column, data) {
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
			}
		]);
		this.yourTable.create(jQuery('<div class="growYUITable" style="clear: both"></div>').appendTo(bn)[0]);
		
		var div = $('<div>Copy <select></select> to a new browser map named </div>').appendTo(bn);
		var mine_sync_from = $(div.find('select')[0]);
		var mine_sync_to = $('<input type="text"/>').appendTo(div);
		$('<button>Copy</button>').appendTo(div).click(function() {
			var bdao = new org.sarsoft.BaseDAO();
			bdao.baseURL = "/";
			bdao._doGet("map?id=" + mine_sync_from.val() + "&format=JSON", function(state) {
				var id = new org.sarsoft.LocalMapDAO().create(mine_sync_to.val(), state);
				window.location="/map#" + id;
			})
		});
	
		// prioritize page loading
		window.setTimeout(function() {
			new org.sarsoft.CollaborativeMapDAO().getMaps(function(rows) {
				that.yourTable.update(rows);
				for(var i = 0; i < rows.length; i++) {
					$('<option value="' + rows[i].name + '">' + rows[i].description + '</option>').appendTo(mine_sync_from);
				}
			});
		}, 1000);

		var d = jQuery('<div></div>').appendTo(newmap);
		var newform = jQuery('<form action="/map" method="post" id="createmapform" style="display: inline-block">Create a new map named: </form>').appendTo(d);
		var newName = jQuery('<input type="text" name="name"/>').appendTo(newform);
		
		var newlat = jQuery('<input type="hidden" name="lat"/>').appendTo(newform);
		var newlng = jQuery('<input type="hidden" name="lng"/>').appendTo(newform);
		var clientstate = jQuery('<input type="hidden" name="state"/>').appendTo(newform);

		jQuery('<button>Create</button>').appendTo(d).click(function(evt) {
			var name = newName.val();
			if(name == null || name == "") {
				alert('Please enter a name for this map.');
				return;
			}
			var center = imap.map.getCenter();
			newlat.val(center.lat());
			newlng.val(center.lng());
			if(sarsoft.tenant == null) clientstate.val(YAHOO.lang.JSON.stringify(org.sarsoft.MapState.get(imap, ["Map"])));
			newform.submit();
		});		
	}
	
	var localDAO = new org.sarsoft.LocalMapDAO();
	if(localDAO.getMaps().length > 0) {
		$('<div style="float: left; width: 90%; padding-bottom: 1em; padding-top: 1em"></div>').appendTo(bn).append($('<div style="font-size: 150%; font-weight: bold">Maps Saved to Your Browser</div>'));
		this.browserTable = new org.sarsoft.view.EntityTable([
		     {
		       	key : "id",
		       	label : "",
		       	formatter : function(cell, record, column, data) { 
	        		var d1 = $('<div></div>').appendTo(cell);
	        		var d2 = $('<div style="display: none; position: absolute; padding: 5px; background-color: white; border: 1px solid black">Delete ' + record.getData().name + ' - Are You Sure?</div>').appendTo(d1);
	        		var d3 = $('<div></div>').appendTo(d2);
	        		$('<span style="cursor: pointer; color: blue; font-weight: bold">Cancel</span>').appendTo(d3).click(function(evt) {
	        			evt.stopPropagation();
	        			d2.css('display', 'none');
	        		});
	        		$('<span style="cursor: pointer; color: red; font-weight: bold; margin-left: 20px">Delete</span>').appendTo(d3).click(function(evt) {
		       			evt.stopPropagation();
		       			localDAO.del(record.getData().id);
	   					that.browserTable.table.deleteRow(record);
	        		});
	        		var s1 = $('<span style="cursor: pointer; color: red; font-weight: bold">X</span>').prependTo(d1).click(function() {
	        			d2.css('display', 'block');
	        		});
		       	}
		       },{
				key : "name",
				label : "Name",
				sortable : true, 
				formatter : function(cell, record, column, data) { $(cell).css({"white-space": "nowrap", "min-width": "200px"}); cell.innerHTML = '<a href="/' +  (sarsoft.offline ? 'offline#' : 'map#') + record.getData().id + '">' + org.sarsoft.htmlescape(data) + '</a>' },
				sortOptions: {sortFunction: function(a, b, desc) { return YAHOO.util.Sort.compare(a.getData("publicName"), b.getData("publicName"), desc); }}
			}
		]);
	   	this.browserTable.create(jQuery('<div class="growYUITable" style="clear: both"></div>').appendTo(bn)[0]);
		that.browserTable.update(localDAO.getMaps());
	
		if(sarsoft.account) {
			var div = $('<div>Copy <select></select> to a new ' + sarsoft.version + ' map named </div>').appendTo(bn);
			var browser_sync_from = $(div.find('select')[0]);
			var maps = localDAO.getMaps();
			for(var i = 0; i < maps.length; i++) {
				if(maps[i] != null) $('<option value="' + maps[i].id + '">' + maps[i].name + '</option>').appendTo(browser_sync_from);
			}
			var browser_sync_to = $('<input type="text"/>').appendTo(div);
			$('<button>Copy</button>').appendTo(div).click(function() {
				var newform = $('<form action="/map" method="post" style="display: none"></form>').appendTo(document.body);
		
				$('<input type="hidden" name="name"/>').appendTo(newform).val(browser_sync_to.val());
				var center = imap.map.getCenter();
				$('<input type="hidden" name="lat"/>').appendTo(newform).val(center.lat());
				$('<input type="hidden" name="lng"/>').appendTo(newform).val(center.lng());
				$('<input type="hidden" name="state"/>').appendTo(newform).val(YAHOO.lang.JSON.stringify(localDAO.getState(browser_sync_from.val())));
				
				newform.submit();
			});
		}
	}

	if(!sarsoft.offline) {
		$('<div style="float: left; width: 90%; padding-bottom: 1em; padding-top: 1em"></div>').appendTo(bn).append($('<div style="font-size: 150%; font-weight: bold">Offline Access</div>'));
		var cs = new org.sarsoft.CacheSettings();
		var cached = cs.get();
		var div = $('<div style="clear: both"><a href="/togo">Visit ' + sarsoft.version + ' To Go</a> for off-the-grid map access anytime, anywhere.  Save layers to your browser using HTML5 application caching.</div>').appendTo(bn);
		if(cached != null) {
			div.append('  You currently have ' + cached.layers.split(",").length + ' layers saved.');
		}
	}
}

org.sarsoft.widget.BaseSharing = function(imap) {
	if(!imap) return;
	var that = this;
	this.imap = imap;
	
	this.share = $('<div>Share this map by giving people the following URL: <a style="word-wrap: break-word" href="#"></a><br/><br/>' +
	'Embed it in a webpage or forum:<textarea rows="2" cols="60" style="vertical-align: text-top"></textarea></div>');
	
	this.body = $('<div></div>').append(this.share);

	this.dlg = new org.sarsoft.view.MapDialog(imap, "Sharing", this.body, "OK", "Cancel", function() {
		if(that.save != null) that.save();
	});

	imap.controls.action.links['share'].click(function() {
		that.show();
	});
}

org.sarsoft.widget.BaseSharing.prototype.show = function() {
	this.dlg.swap();
}

org.sarsoft.widget.URLSharing = function(imap, page) {
	org.sarsoft.widget.BaseSharing.call(this, imap);
	this.page = page;
	this.share.find('textarea').attr('rows', '4');
}

org.sarsoft.widget.URLSharing.prototype = new org.sarsoft.widget.BaseSharing();

org.sarsoft.widget.URLSharing.prototype.show = function() {
	var hash = org.sarsoft.MapURLHashWidget.createConfigStr(this.imap);
	var url = sarsoft.server + this.page + '#' + hash;
	
	this.share.find('a').attr('href', url).html(url);
	this.share.find('textarea').val('<iframe width="500px" height="500px" src="' + url + '"></iframe>');

	org.sarsoft.widget.BaseSharing.prototype.show.call(this);
}

org.sarsoft.widget.TenantSharing = function(imap, page) {
	var that = this;
	org.sarsoft.widget.BaseSharing.call(this, imap);

	this.body.prepend('<div style="font-size: 120%; color: #5a8ed7">Share</div>');

	this.collaborate = jQuery('<div><div style="font-size: 120%; color: #5a8ed7; padding-top: 5px">Collaborate</div></div>').appendTo(this.body);

	this.sync = jQuery('<input type="checkbox"/>').prependTo(jQuery('<div>Sync map to changes made by other users.  Work on the same map together.</div>').appendTo(this.collaborate));
	this.sync.change(function() {
		if(that.timer != null) {
			clearInterval(that.timer);
			that.timer = null;
		}
		if(that.killswitch != null) {
			clearTimeout(that.killswitch);
			that.killswitch = null;
		}
		var val = that.sync.attr("checked")=="checked";
		if(val) {
			alert('This page will automatically sync with changes made by other users for the next hour.');
			that.timer = setInterval(function() {that.imap.timer(); org.sarsoft.MapState.timer(); }, sarsoft.refresh_interval);
			that.killswitch = setTimeout(function() { that.toggle.setValue(false); clearInterval(that.timer); that.timer = null; that.killswitch = null}, 3600000)
		}
	});

	if(sarsoft.refresh_auto) {
		this.timer = setInterval(function() {that.imap.timer(); org.sarsoft.MapState.timer(); }, sarsoft.refresh_interval);
		this.sync.attr("checked", "checked");
	}

	if(sarsoft.permission == "READ") {
		var pwd = jQuery('<div style="padding-top: 1em"></div>').appendTo(this.collaborate);
		var pwdform = jQuery('<form action="/password" method="post"><input type="hidden" name="dest" value="' + window.location + '"/></form>').appendTo(pwd);
		pwdform.append('If this map\'s owner has set a password, you can enter it for write acess:');
		pwdform.append('<input type="password" name="password"/>');
		$('<button>Enter Password</button>').appendTo(pwdform).click(function() { pwdform.submit(); });
	}
	
	var url = sarsoft.server + page + '?id=' + sarsoft.tenant.name;
	this.share.find('a').attr('href', url).html(url);
	this.share.find('textarea').val('<iframe width="500px" height="500px" src="' + url + '"></iframe>');
}

org.sarsoft.widget.TenantSharing.prototype = new org.sarsoft.widget.BaseSharing();

org.sarsoft.widget.Importer = function(container, url) {
	var that = this;
	this.body = container;
	this.url = url;

    $('<div style="float: left; padding-right: 50px"></div>').appendTo(this.body).append(
            $('<div style="cursor: pointer"><div><img style="display: block; margin-right: auto; margin-left: auto;" src="' + $.img('gps64.png') + '"/></div><div style="font-size: 120%; color: #5a8ed7; font-weight: bold;">Garmin GPS</div></div>').click(function() {
                    that.header.css('visibility', 'inherit');
                    that.comms.init(false, that.url, "", function(data) { that.processImportedData(data) } );
            }));
	
	this.gpx = new Object();
	this.gpx.form = $('<form style="float: left; display: none; padding-left: 10px" name="gpsform" action="' + url + '" enctype="multipart/form-data" method="post"><input type="hidden" name="format" value="gpx"/>Please choose a file to import:<br/></form>');
	this.gpx.file = $('<input type="file" name="file" style="margin-top: 10px;"/>').appendTo(this.gpx.form);
	this.gpx.file.change(function() {
		if(that.bgframe == null)  {
			that.bgframe = jQuery('<iframe name="IOFrame" id="IOFrame" width="0px" height="0px" style="display: none"></iframe>').appendTo(document.body);
			that.bgform = jQuery('<form style="display: none" name="gpsform" action="' + that.url + '" target="IOFrame" enctype="multipart/form-data" method="post"><input type="hidden" name="responseType" value="frame"/><input type="hidden" name="format" value="gpx"/></form>').appendTo(document.body);
		}
		jsonFrameCallback = function(data) { that.processImportedData(data) };
		_bgframe = that.bgframe;
		that.gpx.file.appendTo(that.bgform);
		that.bgform.attr("action", that.url);
		that.bgform.submit();
	});
	$('<div style="cursor: pointer; float: left"><div><img style="display: block; margin-right: auto; margin-left: auto;" src="' + $.img('gpx64.png') + '"/></div><div style="font-size: 120%; color: #5a8ed7; font-weight: bold; text-align: center">GPX or KML File</div></div>').click(function() {
		that.gpx.form.css('display', 'block');
	}).prependTo($('<div style="float: left"></div').append(this.gpx.form).appendTo($('<div style="float: left"></div>').appendTo(this.body)));
	
	this.header = $('<div style="visibility: hidden; float: left; vertical-align: top"><img src="' + $.img('gps.png') + '"/><b>GPS Console</b></div>').appendTo(this.body);
	this.comms = new org.sarsoft.GPSComms(this.header);
}

org.sarsoft.widget.Importer.prototype.clear = function (url) {
	this.comms.clear();
	this.gpx.file.appendTo(this.gpx.form).val("");
	this.gpx.form.css('display', 'none');
	if(url) {
		this.url = url;
		this.gpx.form.attr("action", url);
	}
}

org.sarsoft.widget.Importer.prototype.processImportedData = function(data) {
	for(var name in org.sarsoft.MapState.daos) {
		if(data[name] && data[name].length > 0) org.sarsoft.MapState.daos[name].sideload(data[name]);
	}
	$(this).triggerHandler('success');
}

org.sarsoft.widget.IO = function(imap) {
	var that = this;
	this.imap = imap;
	imap.register("org.sarsoft.widget.IO", this);
	
	if(org.sarsoft.writeable) {
		this.imp = new Object();
		this.imp.importer = new org.sarsoft.widget.Importer($('<div></div>'), '/rest/in?tid=' + (sarsoft.tenant ? sarsoft.tenant.name : ''));
		this.imp.importer.body.append('<div style="clear: both"></div>');
		this.imp.dlg = new org.sarsoft.view.MapDialog(imap, "Import Data", $('<div><div style="font-weight: bold; margin-bottom: 10px">To import data, click on the file type you wish to import from:</div></div>').append(this.imp.importer.body), null, "Cancel", function() {});
		imap.controls.action.links['import'].css('display', '').click(function() {
			that.imp.importer.clear();
			that.imp.dlg.swap();
		});
		$(this.imp.importer).bind('success', function() { that.imp.dlg.hide(); })
	}
	
	this.exp = new Object();
	this.exp.dlg = new org.sarsoft.view.MapDialog(imap, "Export Data", $('<div><div style="font-weight: bold; margin-bottom: 10px">Export <select></select> to:</div></div>'), null, "Done", function() {});
	if(imap.controls.action) imap.controls.action.links['export'].click(function() {
		var exportables = that.exp.body.find('select');
		exportables.empty();
		exportables.append('<option value="0">All Objects</option>');
		
		for(var name in org.sarsoft.MapState.daos) {
			var dao = org.sarsoft.MapState.daos[name];
			if(dao.geo) {
				for(var i = 0; i < dao.objs.length; i++) {
					var obj = dao.objs[i];
					if(obj != null && (obj[dao.label] || "").length > 0) exportables.append('<option value="' + name + '_' + obj.id + '">' + obj[dao.label] + '</option>');
				}
			}
		}

		that.exp.comms.clear();
		that.exp.dlg.swap(); 
		});
	this.exp.body = this.exp.dlg.bd.children().first();

	$('<div style="cursor: pointer"><div><img style="display: block; margin-right: auto; margin-left: auto; width:" src="' + $.img('gps64.png') + '"/></div><div style="font-size: 120%; color: #5a8ed7; font-weight: bold;">Garmin GPS</div></div>').appendTo(jQuery('<div style="display: inline-block; padding-right: 50px"></div>').appendTo(this.exp.body)).click(function() {
		that.exp.header.css('visibility', 'inherit');
		that.doexport("GPS");
	});

	$('<div style="display: inline-block; padding-right: 50px"></div>').appendTo(this.exp.body).append($('<div style="cursor: pointer"><div><img style="display: block; margin-right: auto; margin-left: auto;" src="' + $.img('gpx64.png') + '"/></div><div style="font-size: 120%; color: #5a8ed7; font-weight: bold;">GPX File</div></div>').click(function () {
		that.doexport("GPX");
	}));

	$('<div style="cursor: pointer"><div><img style="display: block; margin-right: auto; margin-left: auto;" src="' + $.img('kml64.png') + '"/></div><div style="font-size: 120%; color: #5a8ed7; font-weight: bold; text-align: center">Google Earth</div></div>').appendTo(jQuery('<div style="display: inline-block; padding-right: 50px"></div>').appendTo(this.exp.body)).click(function() {
		that.doexport("KML");
	});

	this.exp.header = jQuery('<div style="visibility: hidden; display: inline-block; vertical-align: top"><img src="' + $.img('gps.png') + '"/><b>GPS Console</b></div>').appendTo(this.exp.body);
	this.exp.comms = new org.sarsoft.GPSComms(this.exp.header);
}

org.sarsoft.widget.IO.prototype.doexport = function(format) {
	var val = this.exp.body.find('select').val();
	var type, id = null;
	if(val != 0) {
		type = val.split("_")[0];
		id = Number(val.split("_")[1]);
	}
	
	var gps = false;
	if(format == "GPS") {
		gps = true;
		format = "GPX";
	}

	if(sarsoft.tenant && type == null) {
		var url = window.location.href + "&format=" + format;
		if(gps) {
			this.exp.comms.init(true, url, "");
		} else {
			window.location = url;
		}
	} else {
		if(!this.exp.form ) this.exp.form = $('<form style="display: none" action="/rest/out" method="POST"><input type="hidden" name="tid"/><input type="hidden" name="format"/><input type="hidden" name="state"/></form>').appendTo(document.body);		
		var state = {}
		if(type) {
			state[type] = [org.sarsoft.MapState.daos[type].objs[id]];
		} else {
			state = org.sarsoft.MapState.get();
		}
		this.exp.form.find('[name="state"]').val(YAHOO.lang.JSON.stringify(state));
		this.exp.form.find('[name="format"]').val(format);
		this.exp.form.find('[name="tid"]').val(sarsoft.tenant ? sarsoft.tenant.name : '');
		if(gps) {
			this.exp.comms.init(true, this.exp.form, "");
		} else {
			this.exp.form.submit();
		}
	}
}

org.sarsoft.widget.MapAction = function(container) {
	var that = this;
	this.draftcheck = new Object();
	this.draftmode = false;

	this.saved = jQuery('<div style="display: none; color: #CCCCCC; font-style: italic">Map Not Modified</div>').appendTo(container);
	$(org.sarsoft.BaseDAO).bind('success', function(e, obj) {
		var d = new Date();
		var pm = false;
		var hours = d.getHours();
		if(hours > 12) {
			hours = hours - 12;
			pm = true;
		}
		that.saved.css('display', 'block').html('Last saved at ' + hours + ':' + (d.getMinutes() < 10 ? '0' : '') + d.getMinutes() + ':' + (d.getSeconds() < 10 ? '0' : '') + d.getSeconds() + (pm ? ' PM' : ' AM'));
	});
	$(org.sarsoft.BaseDAO).bind('failure', function(e, obj) {
		that.saved.css({'display': 'block', 'font-style': 'normal', 'font-weight': 'bold', 'color': 'red'}).html('CHANGES NOT SAVED');
	});

	this.container = $('<div><div></div><div></div><div style="clear: both; padding-bottom: 5px"></div></div>').appendTo(container);
	this.links = {}
	this.bodies = {}

	this.addAction('save', $('<div style="color: red; display: none" title="Save This to ' + sarsoft.version + '"><img src="' + $.img('save.png') + '"/>Save</div>'));
	this.addAction('share', $('<div title="Share via Email, or Embed in a Forum Post"><img src="' + $.img('sharing.png') + '"/>Share</div>'));	
	this.addAction('import', $('<div style="display: none" title="Import Data From a GPS or GPX File"><img src="' + $.img('up.png') + '"/>Import</div>'));
	this.addAction('export', $('<div style="display: none; margin-right: 0px" title="Export Data to GPS, GPX or KML" style="display: none"><img src="' + $.img('down.png') + '"/>Export</div>'));

}

org.sarsoft.widget.MapAction.prototype.toggle = function(name) {
	for(var key in this.bodies) {
		this.bodies[key].css('display', (key == name  && this.bodies[key].css('display') == 'none') ? 'block' : 'none');
	}
}

org.sarsoft.widget.MapAction.prototype.addAction = function(name, link, body) {
	var that = this;
	this.links[name] = link.appendTo(this.container.children()[0]).addClass('floatingButton');
	if(body != null) {
		this.bodies[name] = body.appendTo(this.container.children()[1]).css({'display': 'none', 'clear': 'both', 'padding-top': '5px'});
		this.links[name].click(function() {
			that.toggle(name);
		});
	}
}

org.sarsoft.widget.MapAction.prototype.setDraftMode = function(name, draft) {
	this.draftcheck[name] = draft;
	this.draftmode = false;
	for(var key in this.draftcheck) this.draftmode = this.draftmode || this.draftcheck[key];
	this.links['export'].css('display', this.draftmode ? 'block' : 'none');
	if(sarsoft.tenant != null) this.draftmode = false;
	this.links.save.css('display', this.draftmode ? 'block' : 'none');
	this.links.share.css('display', this.draftmode ? 'none' : 'block');
}

org.sarsoft.StructuredDataNavigator = function(imap) {
	org.sarsoft.DataNavigator.call(this, imap);
	var that = this;
	imap.dn = this;

	this.account = this.addHeader(sarsoft.account == null ? "Not Signed In" : (sarsoft.account.alias ? sarsoft.account.alias : sarsoft.account.email), "account.png");
	this.account.block.css('margin-bottom', '5px');
	if(sarsoft.account != null) {
	    new org.sarsoft.widget.Account(imap, this.account.body, this.account.header);
	    new org.sarsoft.widget.Maps(imap, this.account.body);
	} else {
		new org.sarsoft.widget.Login(imap, this.account.body);
		var dao = new org.sarsoft.LocalMapDAO();
		if(dao.getMaps().length > 0) new org.sarsoft.widget.Maps(imap, this.account.body);
	}

	this.tenant = this.addHeader((sarsoft.tenant ? sarsoft.tenant.publicName : (sarsoft.local ? sarsoft.local.name : "Unsaved Map")), "favicon.png");	
	imap.controls.action = new org.sarsoft.widget.MapAction(this.tenant.body);
	var saveAs = new org.sarsoft.SaveAsDialog(imap);
	imap.controls.action.links.save.click(function() { saveAs.dlg.swap(); });
	
	this.body = $('<div></div>').appendTo(this.tenant.body);

	var div = $('<div style="padding-top: 10px; clear: both; font-size: 120%; color: green"></div>').appendTo(this.tenant.body).css('display', org.sarsoft.writeable ? 'block' : 'none');
	
	this.addobjlink = new org.sarsoft.view.DropSelect("+ Add New Object", {color: "green", "font-weight": "normal"});
	this.addobjlink.container.appendTo(div);
	
	$('<div style="margin-top: 10px"></div>').appendTo(div);

	this.addlayerlink = new org.sarsoft.view.DropSelect("+ Add New Layer", {color: "green", "font-weight": "normal"});
	this.addlayerlink.container.appendTo(div);
	
	$(this.addobjlink).bind('show', function() { that.addlayerlink.hide() });
	$(this.addlayerlink).bind('show', function() { that.addobjlink.hide() });

	var settings = this.addDataType("Settings");
	settings.block.css('margin-bottom', '5px');
	imap.controls.settings = $('<div></div>').appendTo(settings.body);
	imap.controls.settings.more = $('<div style="padding-top: 5px"></div>').appendTo(settings.body).append($('<span style="color: #666666; cursor: pointer">Show More</span>').click(function() {
		imap.controls.settings.more.css('display', 'none');
		imap.controls.settings.less.css('display', 'block');
		imap.controls.settings_browser.css('display', 'block');
	}));
	imap.controls.settings_browser = $('<div style="display: none"></div>').appendTo(settings.body);
	imap.controls.settings.less = $('<div style="padding-top: 5px; display: none"></div>').appendTo(settings.body).append($('<span style="color: #666666; cursor: pointer">Show Less</span>').click(function() {
		imap.controls.settings.more.css('display', 'block');
		imap.controls.settings.less.css('display', 'none');
		imap.controls.settings_browser.css('display', 'none');
	}));
	
	if(!org.sarsoft.iframe && !this.bgload) new org.sarsoft.widget.IO(imap);

	new org.sarsoft.widget.MapLayers(imap, this.body);
}

org.sarsoft.StructuredDataNavigator.prototype = new org.sarsoft.DataNavigator();

org.sarsoft.StructuredDataNavigator.prototype.addNewOption = function(idx, text, handler) {
	if(idx == 0) {
		this.addobjlink.addItem(text, handler);
	} else {
		this.addlayerlink.addItem(text, handler);
	}
}

org.sarsoft.OfflineDataNavigator = function(imap) {
	org.sarsoft.DataNavigator.call(this, imap);
	var that = this;
	imap.dn = this;

	this.account = this.addHeader("Offline", "account.png");
	this.account.block.css('margin-bottom', '5px');
    new org.sarsoft.widget.Maps(imap, this.account.body);
    if(navigator.onLine) {
    	$('<div class="underlineOnHover"><div style="width: 16px; margin-right: 2px; float: left; color: red; font-weight: bold; text-align: center">X</div>Return to ' + sarsoft.version + ' Online</div>').appendTo(this.account.body).click(function() {
    		window.location = "/map.html";
    	});
    }

    this.tenant = this.addHeader((sarsoft.tenant ? sarsoft.tenant.publicName : (sarsoft.local ? sarsoft.local.name : "Unsaved Map")), "favicon.png");
	imap.controls.action = new org.sarsoft.widget.MapAction(this.tenant.body);
	var saveAs = new org.sarsoft.SaveAsDialog(imap, true);
	imap.controls.action.links.save.click(function() { saveAs.dlg.swap(); });
	
	this.body = $('<div></div>').appendTo(this.tenant.body);

	var div = $('<div style="padding-top: 10px; clear: both; font-size: 120%; color: green"></div>').appendTo(this.tenant.body).css('display', org.sarsoft.writeable ? 'block' : 'none');
	
	this.addobjlink = new org.sarsoft.view.DropSelect("+ Add New Object", {color: "green", "font-weight": "normal"});
	this.addobjlink.container.appendTo(div);
	
	$('<div style="margin-top: 10px"></div>').appendTo(div);

	this.addlayerlink = new org.sarsoft.view.DropSelect("+ Add New Layer", {color: "green", "font-weight": "normal"});
	this.addlayerlink.container.appendTo(div);
	
	$(this.addobjlink).bind('show', function() { that.addlayerlink.hide() });
	$(this.addlayerlink).bind('show', function() { that.addobjlink.hide() });

	var settings = this.addDataType("Settings");
	settings.block.css('margin-bottom', '5px');
	imap.controls.settings = $('<div></div>').appendTo(settings.body);
	imap.controls.settings.more = $('<div style="padding-top: 5px"></div>').appendTo(settings.body).append($('<span style="color: #666666; cursor: pointer">Show More</span>').click(function() {
		imap.controls.settings.more.css('display', 'none');
		imap.controls.settings.less.css('display', 'block');
		imap.controls.settings_browser.css('display', 'block');
	}));
	imap.controls.settings_browser = $('<div style="display: none"></div>').appendTo(settings.body);
	imap.controls.settings.less = $('<div style="padding-top: 5px; display: none"></div>').appendTo(settings.body).append($('<span style="color: #666666; cursor: pointer">Show Less</span>').click(function() {
		imap.controls.settings.more.css('display', 'block');
		imap.controls.settings.less.css('display', 'none');
		imap.controls.settings_browser.css('display', 'none');
	}));
	
}

org.sarsoft.OfflineDataNavigator.prototype = new org.sarsoft.DataNavigator();

org.sarsoft.OfflineDataNavigator.prototype.addNewOption = function(idx, text, handler) {
	if(idx == 0) {
		this.addobjlink.addItem(text, handler);
	} else {
		this.addlayerlink.addItem(text, handler);
	}
}

org.sarsoft.view.BaseConfigWidget = function(imap, persist) {
	var that = this;
	if(imap != null) {
		this.imap = imap;
		var container = imap.controls.settings_browser;
		this.sb = jQuery('<input type="checkbox"/>').prependTo(jQuery('<div style="white-space: nowrap;">Show Scale Bar</div>').appendTo(container)).change(function() {
			var val = that.sb[0].checked;
			imap.map.setOptions({ scaleControl: val });
			org.sarsoft.BrowserSettings.set('scalebar', val);
		});
		this.swz = jQuery('<input type="checkbox"/>').prependTo(jQuery('<div style="white-space: nowrap;" title="Use your mouse\'s scroll wheel to zoom in and out.">Enable Scroll Wheel Zoom</div>').appendTo(container)).change(function() {
			var val = that.swz[0].checked;
			imap.map.setOptions({ scrollwheel: val });
			org.sarsoft.BrowserSettings.set('scrollwheelzoom', val);
		});
		
		this.position = $('<select><option value="1">At Cursor</option><option value="2">At Center</option></select>').appendTo($('<div>Show Location </div>').appendTo(container)).change(function() {
			var val = Number(that.position.val());
			var pic = imap.registered["org.sarsoft.PositionInfoControl"];
			if(pic) pic.setValue(val);
			org.sarsoft.BrowserSettings.set('position', val);
		}).val(org.sarsoft.touch ? 2 : 1);
		var div = $('<div>In </div>').appendTo(container);
		this.grid_format = $('<select><option value="UTM">UTM</option><option value="USNG">USNG</option></select>').appendTo(div).change(function() {
			var val = that.grid_format.val();
			org.sarsoft.EnhancedGMap._grid = val;
			org.sarsoft.BrowserSettings.set('grid', val);
			if(imap.registered["org.sarsoft.UTMGridControl"] != null) imap.registered["org.sarsoft.UTMGridControl"]._drawUTMGrid(true);
			if(imap.registered["org.sarsoft.PositionInfoControl"] != null) imap.registered["org.sarsoft.PositionInfoControl"].update(imap.map.getCenter());
		});
		this.coord_format = $('<select><option value="DD">Degrees</option><option value="DMH">Deg Min</option><option value="DMS">Deg Min Sec</option></select>').appendTo(div.append('+')).change(function() {
			var val = that.coord_format.val();
			org.sarsoft.EnhancedGMap._coordinates = val;
			org.sarsoft.BrowserSettings.set('coordinates', val);
			if(imap.registered["org.sarsoft.UTMGridControl"] != null) imap.registered["org.sarsoft.UTMGridControl"]._drawUTMGrid(true);
			if(imap.registered["org.sarsoft.PositionInfoControl"] != null) imap.registered["org.sarsoft.PositionInfoControl"].update(imap.map.getCenter());
		});

		var config = org.sarsoft.BrowserSettings.load();
		this.swz[0].checked = (config.scrollwheelzoom == false ? false : true);
		this.sb[0].checked = config.scalebar;
		if(config.position != null) {
			org.sarsoft.async(function() { if(imap.registered["org.sarsoft.PositionInfoControl"] != null) imap.registered["org.sarsoft.PositionInfoControl"].setValue(config.position) });
			that.position.val(config.position);
		}
		if(config.coordinates != null) {
			org.sarsoft.EnhancedGMap._coordinates = config.coordinates;
			that.coord_format.val(config.coordinates);
		}
		if(config.grid != null) {
			org.sarsoft.EnhancedGMap._grid = config.grid;
			that.grid_format.val(config.grid);
		}
		if(config.coordinates != null || config.grid != null) {
			if(imap.registered["org.sarsoft.UTMGridControl"] != null) imap.registered["org.sarsoft.UTMGridControl"]._drawUTMGrid(true);
			if(imap.registered["org.sarsoft.PositionInfoControl"] != null) imap.registered["org.sarsoft.PositionInfoControl"].update(imap.map.getCenter());
		}
	}
}

org.sarsoft.view.BaseConfigWidget.prototype.saveBrowserSettings = function() {
	if(this.sb != null)  {
		org.sarsoft.BrowserSettings.set('scalebar', this.sb[0].checked);
		org.sarsoft.BrowserSettings.set('scrollwheelzoom', this.swz[0].checked);
		if(imap.registered["org.sarsoft.PositionInfoControl"] != null) org.sarsoft.BrowserSettings.set('position', imap.registered["org.sarsoft.PositionInfoControl"].value);
		org.sarsoft.BrowserSettings.set('coordinates', org.sarsoft.EnhancedGMap._coordinates);
		org.sarsoft.BrowserSettings.set('grid', org.sarsoft.EnhancedGMap._grid);
	}
}

org.sarsoft.view.PersistedConfigWidget = function(imap, persist, saveCenter) {
	var that = this;
	org.sarsoft.view.BaseConfigWidget.call(this, imap, persist);
	this.dao = new org.sarsoft.CollaborativeMapDAO();
	this.saveCenter = saveCenter;
	if(persist) google.maps.event.addListener(imap.map, "idle", function() {
		var cfg = imap.getConfig();
		if(!that._lastcfg) {
			that._lastcfg = cfg;
		} else {
			if(!org.sarsoft.MapOverlayControl.ConfigEquals(that._lastcfg, cfg)) {
				that._lastcfg = cfg;
				that.saveConfig();
			}
		}
	});
}

org.sarsoft.view.PersistedConfigWidget.prototype = new org.sarsoft.view.BaseConfigWidget();

org.sarsoft.view.PersistedConfigWidget.prototype.saveConfig = function(handler) {
	this.saveBrowserSettings();
	var that = this;

	this.dao.setConfig(org.sarsoft.MapState.get(that.imap, "Map"), function() {
		if(that.saveCenter) {
			var center = that.imap.map.getCenter();
			that.dao.setCenter({lat: center.lat(), lng: center.lng()}, handler != null ? handler : function() {});
		} else if(handler != null) {
			handler();
		}
	});
}

org.sarsoft.view.PersistedConfigWidget.prototype.loadConfig = function(overrides) {
	var that = this;
	this.dao.getConfig(function(state) {
		var config = state.MapConfig || {};
		if(typeof(overrides) != "undefined") for(var key in overrides) {
			config[key] = overrides[key];
		}
		org.sarsoft.MapState.setConfig(that.imap, config);
		if(YAHOO.util.Cookie.exists("org.sarsoft.mapLayers")) {
			var date = YAHOO.util.Cookie.exists("org.sarsoft.updated") ? Math.round(YAHOO.util.Cookie.get("org.sarsoft.updated", Number)/(1000*60*60*24)) : 0;
			org.sarsoft.MapState.setLayers(that.imap, YAHOO.util.Cookie.get("org.sarsoft.mapLayers").split(","), date);
			var config = imap.getConfig();
			imap.map._overlaycontrol.resetMapTypes();
			imap.setConfig(config);
		}
	})
}

org.sarsoft.view.CookieConfigWidget = function(imap, persist, saveCenter) {
	var that = this;
	this._idled = false;
	org.sarsoft.view.BaseConfigWidget.call(this, imap, true, "Save map settings for future page loads?");
	this.saveCenter = saveCenter;
	if(persist) google.maps.event.addListener(imap.map, "idle", function() {
		if(!that._idled) {
			that._idled = true;
		} else {
			that.saveConfig();
		}
	});
}

org.sarsoft.view.CookieConfigWidget.prototype = new org.sarsoft.view.BaseConfigWidget();

org.sarsoft.view.CookieConfigWidget.prototype.saveConfig = function(handler) {
	this.saveBrowserSettings();
	var config = org.sarsoft.MapState.getConfig(this.imap);
	YAHOO.util.Cookie.set("org.sarsoft.mapConfig", YAHOO.lang.JSON.stringify(config));
	if(this.saveCenter) {
		var center = this.imap.map.getCenter();
		var zoom = this.imap.map.getZoom();
		YAHOO.util.Cookie.set("org.sarsoft.mapCenter", YAHOO.lang.JSON.stringify({center: {lat: center.lat(), lng: center.lng()}, zoom: zoom}));
	}

	if(handler != null) handler();
}

org.sarsoft.view.CookieConfigWidget.prototype.loadConfig = function(overrides) {
	var that = this;
	if(YAHOO.util.Cookie.exists("org.sarsoft.mapLayers")) {
		var date = YAHOO.util.Cookie.exists("org.sarsoft.updated") ? Math.round(YAHOO.util.Cookie.get("org.sarsoft.updated", Number)/(1000*60*60*24)) : 0;
		org.sarsoft.MapState.setLayers(that.imap, YAHOO.util.Cookie.get("org.sarsoft.mapLayers").split(","), date);
		var config = imap.getConfig();
		imap.map._overlaycontrol.resetMapTypes();
		if(!YAHOO.util.Cookie.exists("org.sarsoft.mapConfig")) imap.setConfig(config);
	}
	if(YAHOO.util.Cookie.exists("org.sarsoft.mapConfig")) {
		var config = YAHOO.lang.JSON.parse(YAHOO.util.Cookie.get("org.sarsoft.mapConfig"));
		if(typeof(overrides) != "undefined") for(var key in overrides) {
			config[key] = overrides[key];
		}
		org.sarsoft.MapState.setConfig(this.imap, config);
	}
	if(YAHOO.util.Cookie.exists("org.sarsoft.mapCenter")) {
		var config = YAHOO.lang.JSON.parse(YAHOO.util.Cookie.get("org.sarsoft.mapCenter"));
		if(typeof(overrides) != "undefined") for(var key in overrides) {
			config[key] = overrides[key];
		}
		this.imap.map.setCenter(new google.maps.LatLng(config.center.lat, config.center.lng));
		this.imap.map.setZoom(config.zoom);
	}
}

org.sarsoft.view.OfflineConfigWidget = function(imap, persist, saveCenter) {
	org.sarsoft.view.BaseConfigWidget.call(this, imap, true, "Save map settings for future page loads?");
	this.saveCenter = false;
}

org.sarsoft.view.OfflineConfigWidget.prototype = new org.sarsoft.view.BaseConfigWidget();

org.sarsoft.view.OfflineConfigWidget.prototype.saveConfig = function(handler) {
	this.saveBrowserSettings();
	if(handler != null) handler();
}

org.sarsoft.view.OfflineConfigWidget.prototype.loadConfig = function(overrides) {
}


org.sarsoft.widget.Print = function(imap) {
	var that = this;
	var div = jQuery('<div style="display: none; padding-left: 20px" class="noprint"></div>').prependTo($(imap.map.getDiv()).parent());
	this.pageSizeForm = new org.sarsoft.view.MapSizeForm(imap.map, div);
	this.print_options = new org.sarsoft.view.MenuDropdown('<span class="underlineOnHover" style="font-size: 110%; color: black" title="Print This Page or Make a PDF"><img style="vertical-align: text-top; margin-right: 3px" title="Print" src="' + $.img('print.png') + '"/>Print</span>', 'left: 0; width: 100%', imap.map._overlaycontrol.div);

	jQuery('<div style="margin-top: 1em"></div>').appendTo(this.print_options.div);
	jQuery('<span class="underlineOnHover" style="color: #5a8ed7; font-weight: bold; margin-right: 1ex">&rarr; Print From Your Browser</span>').prependTo(jQuery('<div style="margin-top: 1ex">Works best with Google Chrome.  Create borderless prints with any combination of page sizes and map layers.</div>').appendTo(this.print_options.div)).click(function() {
		if(div.css('display')=='none') {
			if(imap.registered["org.sarsoft.view.MapDialog"] != null) imap.registered["org.sarsoft.view.MapDialog"].hide();
			div.css('display', 'block');
			that.pageSizeForm.presetInput.val("letter");
			that.pageSizeForm.updateToPreset();
		} else {
			div.css('display', 'none');
			that.pageSizeForm.fullscreen();
		}
		that.print_options.hide();
	});
	
	imap.addMenuItem(this.print_options.container, 30);
	imap.addMenuItem($('<span>&nbsp;<span style="border-left: 1px dashed #CCCCCC">&nbsp;</span></span>')[0], 20);
	imap.addMenuItem($('<span>&nbsp;<span style="border-left: 1px dashed #CCCCCC">&nbsp;</span></span>')[0], 40);
	
}

org.sarsoft.view.ScaleControl = function(map, container) {
	var that = this;
	this.map = map;
	this.container = container;
	this.state = true;
	this.div = jQuery('<div style="position: relative"></div>').appendTo(jQuery('<div style="position: absolute; bottom: 2px; left: 26px; height: 2em; font-size: 10px; z-index: 1000"></div>').appendTo(container));
	google.maps.event.addListener(map, "zoom_changed", function() { if(that.state) that.draw(); });
	google.maps.event.addListener(map, "center_changed", function() { if(that.state) that.draw(); });
}

org.sarsoft.view.ScaleControl.prototype.draw = function() {
	this.div.empty();
	var bounds = this.map.getBounds();
	var distance = google.maps.geometry.spherical.computeDistanceBetween(bounds.getNorthEast(), bounds.getSouthWest());
	var mapdiv = $(map.getDiv());
	var pxdistance = Math.sqrt(mapdiv.width()*mapdiv.width() + mapdiv.height()*mapdiv.height());
	var mscale = (distance/1000)/pxdistance;
	var iscale = mscale/1.609;
	var width = 200;
	var color = "#5a8ed7";
	
	this.div.empty();
	
	var interval = 1000;
	while(width*mscale/interval < 3) {
		if(interval%10 == 0) {
			interval = interval/2;
		} else {
			interval = interval/5;
		}
	}
	if(interval < 0.1) interval = 0.1;
	for(var i = 0; i*interval/mscale < width; i++) {
		var content = Math.round(i*interval*10)/10 + ((i+1)*interval/mscale < width ? "" : "km");
		jQuery('<div style="position: absolute; border-left: 1px solid ' + color + '; padding-left: 2px; top: 0px; height: 1em; left: ' + Math.round(i*interval/mscale) + 'px">' + content + '</div>').appendTo(this.div);
	}
	var width = (Math.round((i-1)*interval/mscale)+1);

	var interval = 1000;
	while(width*iscale/interval < 3) {
		if(interval%10 == 0) {
			interval = interval/2;
		} else {
			interval = interval/5;
		}
	}
	if(interval < 0.1) interval = 0.1;
	for(var i = 0; i*interval/iscale < width; i++) {
		var content = Math.round(i*interval*10)/10 + ((i+1)*interval/iscale < width ? "" : "mi");
		jQuery('<div style="position: absolute; border-left: 1px solid ' + color + '; padding-left: 2px; top: 1em; height: 1em; left: ' + Math.round(i*interval/iscale) + 'px">' + content + '</div>').appendTo(this.div);
	}
	var width = Math.max(width, (Math.round((i-1)*interval/iscale)+1));
	jQuery('<div style="position: absolute; margin-top: 1em; width: ' + width + 'px; border-bottom: 1px solid ' + color + '"></div>').appendTo(this.div);
}

org.sarsoft.view.ScaleControl.prototype.show = function() {
	this.state = true;
	this.div.css('display', 'block');
	this.draw();
}

org.sarsoft.view.ScaleControl.prototype.hide = function() {
	this.state = false;
	this.div.css('display', 'none');
}


org.sarsoft.view.MapSizeForm = function(map, container) {
	var that = this;
	this.map = map;
	this.container = container;
	
	this.presets = [{name: "letter", description: "8.5\"x11\"", width: "8.5in", height: "11in", margin: "0.25in"}, 
	                {name: "legal", description: "8.5\"x14\"", width: "8.5in", height: "14in", margin: "0.25in"},
	                {name: "A4", description: "A4", width: "21cm", height: "29.7cm", margin: "0.5cm"},
	                {name: "1117", description: "11\"x17\"", width: "11in", height: "17in", margin: "0.25in"},
	                {name: "1393", description: "13\"x19\"", width: "13in", height: "19in", margin: "0.25in"}
	                ];

	this.updateToPreset = function() {
		var presetName = that.presetInput.val();
		if(presetName == "Custom") {
			that.widthInput.removeAttr("disabled");
			that.heightInput.removeAttr("disabled");
			that.marginInput.removeAttr("disabled");
			that.cborientation.attr("disabled", "disabled");
			that.cbmargin.attr("disabled", "disabled");
			that.cborientation[0].checked=false;
			that.cbmargin[0].checked=false;
			that.preset.css('color', 'gray');
			that.custom.css('color', 'black');
			return;
		}
		that.preset.css('color', 'black');
		that.custom.css('color', 'gray');
		that.cbmargin.removeAttr("disabled");
		that.cborientation.removeAttr("disabled");
		that.widthInput.attr("disabled", "disabled");
		that.heightInput.attr("disabled", "disabled");
		that.marginInput.attr("disabled", "disabled");

		for(var i = 0; i < that.presets.length; i++) {
			var preset = that.presets[i];
			if(presetName == preset.name) {
				var width = preset.width;
				var height = preset.height;
				if(that.cborientation[0].checked) {
					width = preset.height;
					height = preset.width;
				}
				that.widthInput.val(width);
				that.heightInput.val(height);
				var margin = preset.margin;
				if(that.cbmargin[0].checked) margin = "0";
				that.marginInput.val(margin);
				that.write();
			}
		}
	}

	var div = jQuery('<div></div>').appendTo(container);
	var header = jQuery('<div style="font-size: 150%"></div>').appendTo(div);
	this.printButton = jQuery('<button style="cursor; pointer">Print Map</button>').appendTo(header).click(function() {
		window.print();
	});
	jQuery('<button style="margin-left: 20px; cursor: pointer">Cancel</button>').appendTo(header).click(function() {
		container.css('display', 'none');
		that.fullscreen();
	});
	this.header = header;
	
	div.append(document.createTextNode("Page Size: "));
	this.presetInput = jQuery('<select><option value="Custom">Custom</option></select>').appendTo(div).change(this.updateToPreset);
	for(var i = 0; i < this.presets.length; i++) {
		jQuery('<option value="' + this.presets[i].name + '">' + this.presets[i].description + '</option>').appendTo(this.presetInput);
	}

	var div = jQuery('<span style="padding-left: 1ex"></span>').appendTo(div);
	div.append(document.createTextNode("Width: "));
	this.widthInput = jQuery('<input type="text" size="6"/>').appendTo(div).change(function() {that.write()});
	div.append(document.createTextNode("   Height: "));
	this.heightInput = jQuery('<input type="text" size="6"/>').appendTo(div).change(function() {that.write()});
	div.append(document.createTextNode("   Margin: "));
	if($.browser.mozilla) {
		div.append(document.createTextNode(" Not Supported on Firefox."));
		this.marginInput = jQuery('<input type="text" size="6"/>');
	} else {
		this.marginInput = jQuery('<input type="text" size="6"/>').appendTo(div).change(function() {that.write()});
	}
	this.custom = div;
		
	var div = jQuery('<div style="padding-top: 5px"></div>').appendTo(container);
	this.preset = jQuery('<span></span>').appendTo(div);
	this.cborientation = jQuery('<input type="checkbox" style="margin-left: 5px"/>').appendTo(this.preset).change(this.updateToPreset);
	this.preset.append('<span style="padding-right: 5px">Landscape</span>');
	this.cbmargin = jQuery('<input style="margin-left: 5px" type="checkbox"/>').appendTo(this.preset).change(this.updateToPreset);
	this.preset.append('<span>Borderless</span>');

	this.cbborder = jQuery('<input style="margin-left: 5px" type="checkbox" checked="checked"/>').appendTo(div).change(function() {that.write();});
	div.append('<span style="padding-right: 5px">Show Coordinates in Margin</span>');
	this.cbscale = jQuery('<input style="margin-left: 5px" type="checkbox" checked="checked"/>').appendTo(div).change(function() {that.write();});
	div.append('<span>Fit Preview To Screen</span>');	
		
	if($.browser.msie) {
		jQuery('<div style="font-weight: bold; color: red">Printing is not supported on Internet Explorer and may not work properly.</div>').appendTo(container);
	} else if($.browser.mozilla) {
		jQuery('<div style="font-weight: bold; color: red">Remember to check the "Ignore Scaling and Shrink to Fit Page Width" option in Firefox\'s print menu.</div>').appendTo(container);
	}
	
	this.scaleControl = new org.sarsoft.view.ScaleControl(map, map.getDiv());
	this.scaleControl.hide();
}

org.sarsoft.view.MapSizeForm.prototype.fullscreen = function() {
	var center = this.map.getCenter();

	this.map.getDiv().style.width="100%";
	this.map.getDiv().style.height="100%";
	this.map.getDiv()._margin=0;
	
	$(this.map.getDiv()).css('-webkit-transform', 'none').css('-moz-transform', 'none').css('-ms-transform', 'none');
	if(this.map._zoomControl != null) this.map._zoomControl.css('-webkit-transform', 'none').css('-moz-transform', 'none').css('-ms-transform', 'none');

	var ugc = this.map._imap.registered["org.sarsoft.UTMGridControl"];
	var mic = this.map._imap._mapInfoControl;

	ugc.hidePrintBorder();
	if(this.footer[0] != null) this.footer[0].remove();
	if(this.footer[1] != null) this.footer[1].remove();
	this.scaleControl.hide();
	
	if(mic != null) mic.ctrl.css('visibility', 'visible');
	this.footer = null;
	ugc.borders[3].div.css('height', '26px');

	google.maps.event.trigger(this.map, 'resize');
	this.map.setCenter(center);	
}

org.sarsoft.view.MapSizeForm.prototype.write = function() {
	var center = this.map.getCenter();
	var width = this.widthInput.val().replace(' ', '');
	var height = this.heightInput.val().replace(' ', '');
	var margin = this.marginInput.val().replace(' ', '')
	var rule = this._getMarginRule();
	
	if(rule != null && width.indexOf("in") > 0 && height.indexOf("in") > 0) {
		var nWidth = width.replace("in", "");
		var nHeight = height.replace("in", "");
		var nMargin = 0;
		if(margin.indexOf("in") > 0) {
			nMargin = margin.replace("in", "");
		} else if(margin.indexOf("cm") > 0) {
			nMargin = 2.54*margin.replace("cm", "");
		}
		width = (1*nWidth - nMargin*2) + "in";
		height = (1*nHeight - nMargin*2) + "in";
	}
	
	if(rule != null && width.indexOf("cm") > 0 && height.indexOf("cm") > 0) {
		var nWidth = width.replace("cm", "");
		var nHeight = height.replace("cm", "");
		var nMargin = 0;
		if(margin.indexOf("cm") > 0) {
			nMargin = margin.replace("cm", "");
		} else if(margin.indexOf("in") > 0) {
			nMargin = margin.replace("in", "")/2.54;
		}
		width = (1*nWidth - nMargin*2) + "cm";
		height = (1*nHeight - nMargin*2) + "cm";
	}
	
	var container = $(this.map.getDiv());
	container.css({width: width, height: height});
	this.map.getDiv()._margin=margin;
	
	var ugc = this.map._imap.registered["org.sarsoft.UTMGridControl"];
	var mdw = this.map._imap.registered["org.sarsoft.MapDatumWidget"];
	var mic = this.map._imap._mapInfoControl;
	if(this.cbborder[0].checked) {
		if(this.footer == null) {
			ugc.borders[3].div.css('height', '46px');
			this.footer = [];
			if(mdw != null) this.footer[0] = jQuery('<span style="padding-right: 5px">Datum:</span>').insertBefore(mdw.datumDisplay);
			this.scaleControl.show();
			if(mic != null) {
				this.footer[1] = jQuery('<span style="padding-right: 5px">Printed from ' + sarsoft.version + '.</span>').insertBefore(mic.premsg);
				mic.ctrl.css('visibility', 'hidden');
			}
		}
		ugc.showPrintBorder();
	} else {
		if(this.footer != null) {
			if(this.footer[0] != null) this.footer[0].remove();
			if(this.footer[1] != null) this.footer[1].remove();
			this.scaleControl.hide();
			if(mic != null) mic.ctrl.css('visibility', 'visible');
			this.footer = null;
			ugc.borders[3].div.css('height', '26px');
		}
		ugc.hidePrintBorder();
	}
	
	this.border=this.container.height()+30;
	
	var scale = Math.min((container.parent().width()-40)/container.width(), (container.parent().height()-(this.container.height()+30))/container.height());
	
	if(scale < 1 && this.cbscale[0].checked) {
		var offset = (-50)*(1-scale);
		var transform = 'translate(20px, 10px) translate(' + offset + '%, ' + offset + '%) scale(' + scale + ', ' + scale + ')';
		container.css('-webkit-transform', transform).css('-moz-transform', transform).css('-ms-transform', transform);
		var zscale = 1/scale;
		var zoffset = (-50)*(1-zscale);
		var ztransform = 'translate(' + zoffset + '%, ' + zoffset + '%) scale(' + zscale + ', ' + zscale + ')';
		if(this.map._zoomControl != null) this.map._zoomControl.css('-webkit-transform', ztransform).css('-moz-transform', ztransform).css('-ms-transform', ztransform);
	} else {
		container.css('-webkit-transform', 'none').css('-moz-transform', 'none').css('-ms-transform', 'none');
		if(this.map._zoomControl != null) this.map._zoomControl.css('-webkit-transform', 'none').css('-moz-transform', 'none').css('-ms-transform', 'none');
	}
	if(rule != null) rule.style.setProperty('margin', margin);
	google.maps.event.trigger(this.map, 'resize');
	this.map.setCenter(center);
}

org.sarsoft.view.MapSizeForm.prototype._getMarginRule = function() {
	for(var i = 0; i < document.styleSheets.length; i++) {
		var sheet = document.styleSheets[i];
		var rules = sheet.cssRules;
		if(rules == null) rules = sheet.rules;
		for(var j = 0; j < rules.length; j++) {
			if(rules[j].cssText != null && rules[j].cssText.indexOf("@page") >= 0 && rules[j].cssText.indexOf("margin") >= 0) return rules[j];
		}
	}
}


org.sarsoft.view.MapObjectEntityDialog = function(imap, title, entityform, controller) {
	var that = this;
	this.controller = controller;
	
	org.sarsoft.view.MapEntityDialog.call(this, imap, title, entityform, function(obj) { that.ok(obj) }, "OK");
	
	this.dialog.dialog.hideEvent.subscribe(function() {
		if(that.hasGeoInfo) that.discardGeoInfo();
		if(that.live) that.live = false;
	});
}

org.sarsoft.view.MapObjectEntityDialog.prototype = new org.sarsoft.view.MapEntityDialog();

org.sarsoft.view.MapObjectEntityDialog.prototype.ok = function(obj) {
	var that = this;
	if(this.object.id == null) {
		this.create(obj);
	} else if(this.hasGeoInfo) {
		this.saveGeoInfo(obj, function() { that.saveData(obj); });
		this.hasGeoInfo = false;
	} else {
		this.saveData(obj);
	}
}

org.sarsoft.view.MapObjectEntityDialog.prototype.discardGeoInfo = function() {
	this.controller.discard(this.object);
}
org.sarsoft.view.MapObjectEntityDialog.prototype.saveGeoInfo = function(obj, callback) {
	this.controller.save(this.object.id, callback);
}
org.sarsoft.view.MapObjectEntityDialog.prototype.saveData = function(obj) {
	this.controller.dao.save(this.object.id, obj);
}
org.sarsoft.view.MapObjectEntityDialog.prototype.create = function(obj) {
}

org.sarsoft.view.MapObjectEntityDialog.prototype.show = function(obj, point, hasGeoInfo) {
	this.object = obj;
	this.point = point;
	this.hasGeoInfo = hasGeoInfo;
	org.sarsoft.view.MapEntityDialog.prototype.show.call(this, obj);
}

org.sarsoft.MapState = new Object();

org.sarsoft.MapState.daos = new Object();
org.sarsoft.MapState._dao = new org.sarsoft.BaseDAO();
org.sarsoft.MapState._dao.baseURL = "/rest";

org.sarsoft.MapState.get = function(imap, types) {
	var daos = org.sarsoft.MapState.daos;
	var state = new Object();
	for(var key in daos) {
		if(types == null || types.indexOf(key) >= 0) state[key] = daos[key].dehydrate();
	}

	if(imap != null) {
		state.MapConfig = org.sarsoft.MapState.getConfig(imap);
		state.MapLayers = org.sarsoft.MapState.getLayers();
	}
	
	return state;
}

org.sarsoft.MapState.timer = function() {
	var timestamp = this._timestamp || org.sarsoft.preload.timestamp || 0;
	this._dao._doGet("/since/" + timestamp, function(r) {
		org.sarsoft.MapState._timestamp = r.timestamp;
		for(var type in org.sarsoft.MapState.daos) {
			if(r[type]) org.sarsoft.MapState.daos[type].sideload(r[type]);
		}
	});
}

org.sarsoft.MapState.getConfig = function(imap) {
	var config = new Object;
	imap.getConfig(config);
	for(var key in imap.registered) {
		var val = imap.registered[key];
		if(val != null && val.getConfig != null) {
			val.getConfig(config);
		}
	}
	return config;
}

org.sarsoft.MapState.setConfig = function(imap, config) {
	imap.setConfig(config);
	for(var key in imap.registered) {
		var val = imap.registered[key];
		if(val != null && val.setConfig != null) {
			val.setConfig(config);
		}
	}
}

org.sarsoft.MapState.getLayers = function() {
	var layers = [];

	for(var i = 0; i < sarsoft.map.layers.length; i++) {
		var type = sarsoft.map.layers[i];
		if(sarsoft.map.layers_visible.indexOf(type.alias) >= 0) layers.push(type.alias);
	}
	
	return layers;
}

org.sarsoft.MapState.setLayers = function(imap, layers, date) {
	if(layers == null) return;
	date = date || 0;
	sarsoft.map.layers_visible = [];
	for(var i = 0; i < sarsoft.map.layers.length; i++) {
		var type = sarsoft.map.layers[i];
		if(type.date > date) {
			sarsoft.map.layers_visible.push(type.alias);
		} else {
			for(var j = 0; j < layers.length; j++) {
				if(layers[j] == type.alias) sarsoft.map.layers_visible.push(type.alias);
			}
		}
	}
	if(imap != null) imap.map._overlaycontrol.resetMapTypes(true);
}

org.sarsoft.MapState.setLayersFromBrowserSettings = function() {
	if(YAHOO.util.Cookie.exists("org.sarsoft.mapLayers")) {
		var date = YAHOO.util.Cookie.exists("org.sarsoft.updated") ? Math.round(YAHOO.util.Cookie.get("org.sarsoft.updated", Number)/(1000*60*60*24)) : 0;
		org.sarsoft.MapState.setLayers(null, YAHOO.util.Cookie.get("org.sarsoft.mapLayers").split(","), date);
	}
}

org.sarsoft.MapObjectDAO = function(type) {
	org.sarsoft.BaseDAO.call(this);
	if(type == null) return;
	this.type = type;
	this.offline = (sarsoft.tenant == null);
	org.sarsoft.MapState.daos[type] = this;
	this.label = "label";
}

org.sarsoft.MapObjectDAO.prototype = new org.sarsoft.BaseDAO();

org.sarsoft.MapObjectDAO.prototype.get = function(type, id) {
	var instances = org.sarsoft.MapObjectDAO.instances;
	var state = new Object();
	if(type != null) {
		state[type] = instances[type].objs[id];
	} else {
		for(var key in instances) {
			state[key] = instances[key].dehydrate();
		}
	}
	
	return state;
}

org.sarsoft.MapObjectDAO.prototype.validate = function(obj) {
	if(obj.id == null) obj.id = this.objs.length;
	return obj;
}

org.sarsoft.MapObjectDAO.prototype.link = function(obj) {
}

org.sarsoft.MapObjectDAO.prototype.unlink = function(obj) {
	if(this.childTypes) {
		for(var type in this.childTypes) {
			var prop = this.childTypes[type];
			var dao = org.sarsoft.MapState.daos[type];
			for(i = 0; i < dao.objs.length; i++) {
				if(dao.objs[i] && dao.objs[i][prop] == obj.id) dao.objs[i][prop] = null;
			}
		}
	}
}

org.sarsoft.MapObjectDAO.prototype.children = function(obj, type) {
	var prop = this.childTypes[type];
	var children = [];
	var dao = org.sarsoft.MapState.daos[type];
	for(i = 0; i < dao.objs.length; i++) {
		if(dao.objs[i] && dao.objs[i][prop] == obj.id) children.push(dao.objs[i]);
	}
	return children;
}

org.sarsoft.MapObjectDAO.prototype.getMaxId = function() {
	return this.objs.length-1;
}

org.sarsoft.MapObjectDAO.prototype.dehydrate = function() {
	return this.objs.filter(function(o) { return o != null});
}

org.sarsoft.MapObjectDAO.prototype.rehydrate = function(state) {
	for(var i = 0; i < state.length; i++) {
		if(state[i] != null) {
			var s = this.validate(state[i]); 
			this.objs[s.id] = s;
		}
	}
}

org.sarsoft.MapObjectDAO.prototype.create = function(obj, handler) {
	if(!this.offline) return org.sarsoft.BaseDAO.prototype.create.call(this, obj, handler);
	
	var that = this;
	org.sarsoft.async(function() {
		that.validate(obj);
		that.link(obj);
		that.setObj(obj.id, obj);
		$(that).triggerHandler('create', obj);
		if(handler) handler(obj);
	});
}

org.sarsoft.MapObjectDAO.prototype.save = function(id, obj, handler) {
	if(!this.offline) return org.sarsoft.BaseDAO.prototype.save.call(this, id, obj, handler);

	var that = this;
	org.sarsoft.async(function() {
		var mine = that.getObj(id);
		if(mine == null) {
			that.setObj(id, obj);
			mine = obj;
		} else {
			for(var k in obj) {
				mine[k] = obj[k];
			}
		}
		$(that).triggerHandler('save', mine);
		if(handler) handler(mine);
	});
}

org.sarsoft.MapObjectDAO.prototype.del = function(id, handler) {
	var that = this;
	if(!this.offline) return org.sarsoft.BaseDAO.prototype.del.call(this, id, function(obj) { that.unlink(obj); if(handler) handler(obj) });

	org.sarsoft.async(function() {
		var obj = that.objs[id];
		that.unlink(obj);
		delete that.objs[id];
		$(that).triggerHandler('delete', obj);
		if(handler) handler(obj);
	});
}

org.sarsoft.MapObjectDAO.prototype.load = function(id, handler) {
	if(!this.offline) return org.sarsoft.BaseDAO.prototype.load.call(this, id, handler);

	var that = this;
	org.sarsoft.async(function() {
		$(that).triggerHandler('load', that.getObj(id));
		if(handler) handler(that.getObj(id));
	});
}

org.sarsoft.MapObjectDAO.prototype.mark = function(handler) {
	var that = this;
	if(org.sarsoft.preload[this.type]) {
		return org.sarsoft.async(function() {
			that._timestamp = org.sarsoft.preload.timestamp;
		});
	}
	if(!this.offline) return org.sarsoft.BaseDAO.prototype.mark.call(this, handler);
}

org.sarsoft.MapObjectDAO.prototype.loadSince = function(handler) {
	if(!this.offline) return org.sarsoft.BaseDAO.prototype.loadSince.call(this, handler);
}

org.sarsoft.MapObjectDAO.prototype.loadAll = function(handler) {
	if(!this.offline && !org.sarsoft.preload[this.type]) return org.sarsoft.BaseDAO.prototype.loadAll.call(this, handler);

	var that = this;
	org.sarsoft.async(function() {
		if(org.sarsoft.preload[that.type]) {
			that.rehydrate(org.sarsoft.preload[that.type]);
			delete org.sarsoft.preload[that.type];
		}
		for(var i = 0; i < that.objs.length; i++) {
			if(that.getObj(i) != null) {
				if(handler) handler(that.getObj(i));
				$(that).triggerHandler('load', that.getObj(i));
				$(that).triggerHandler('loadall', that.getObj(i));
			}
		}
	});
}

org.sarsoft.MapObjectDAO.prototype.sideload = function(data) {
	this.rehydrate(data);
	for(var i = 0; i < data.length; i++) {
		$(this).triggerHandler('load', this.getObj(data[i].id));
	}
}

org.sarsoft.MapObjectDN = function(imap, label) {
	var that = this;
	this.imap = imap;
	this.tree = imap ? imap.dn.addDataType(label) : new org.sarsoft.DNTree($('<div></div>'), '');
	this.tree.block.css({'display': 'none', 'margin-bottom': '10px'});
	this.tree.body.css('padding-top', '5px');
	this.div = $('<div></div>').appendTo(this.tree.body);
	this.lines = new Object();
	this.visible = true;
	
	this.cb = $('<input type="checkbox"' + (this.visible ? ' checked="checked"' : '') + '/>').prependTo(this.tree.header).click(function(evt) {
		that.setObjectsVisible(that.cb[0].checked);
		$(that).trigger('visibilitychanged');
		evt.stopPropagation();
	});	
}

org.sarsoft.MapObjectDN.prototype.setObjectsVisible = function(visible) {
	this.visible = visible;
	this.tree.body.css('display', visible ? 'block' : 'none');
	this.tree.lock = !visible;
}

org.sarsoft.MapObjectDN.prototype.setDNVisible = function(visible) {
	this.tree.block.css('display', visible ? 'block' : 'none');
}

org.sarsoft.MapObjectDN.prototype.add = function(id, name, fn) {
	var that = this;

	if(this.lines[id] == null) {
		var div = null;
		for(var i = 0; i <= id; i++) {
			div = this.lines[i] || div;
		}
		this.lines[id] = $('<div class="dn-obj"></div>');
		if(div) {
			this.lines[id].insertAfter(div);
		} else {
			this.lines[id].prependTo(this.div);
		}
	}
	this.lines[id].html('<div class="dn-obj-left"></div><div class="dn-obj-right"></div>');
	
	return this.get(id, 0).click(function() {
		if(org.sarsoft.mobile) that.imap.dn.hideDataNavigator();
		fn();
	}).append((name || "").length == 0 ? '<span style="color: #CCCCCC">N/A</span>' : org.sarsoft.htmlescape(name))
}

org.sarsoft.MapObjectDN.prototype.get = function(id, child) {
	var line = this.lines[id];
	return (child == null) ? line : $(line.children()[child]);
}

org.sarsoft.MapObjectDN.prototype.remove = function(id) {
	if(this.lines[id] == null) return;
	this.lines[id].remove();
	this.lines[id] = null;
}

org.sarsoft.MapObjectDN.prototype.addIcon = function(id, title, html, handler) {
	$('<span class="dn-obj-icon" title="' + title + '"></span>').html(html || '').appendTo(this.get(id, 1)).click(handler);
}

org.sarsoft.MapObjectDN.prototype.addIconEdit = function(id, handler) {
	this.addIcon(id, "Edit", '<img src="' + $.img('edit.png') + '"/>', handler);
}

org.sarsoft.MapObjectDN.prototype.addIconDelete = function(id, handler) {
	this.addIcon(id, "Edit", '<span style="font-weight: bold; color: red">-</span>', handler);
}

org.sarsoft.MapObjectDN.prototype.addComments = function(id, comments) {
	var that = this;
	var line = this.get(id, 0);
	$('<div class="dn-obj-comments"></div>').append(comments).appendTo(this.get(id)).click(function() {
		line.click();
	}).hover(function() { line.css('text-decoration', 'underline') }, function() { line.css('text-decoration', '') });
}


org.sarsoft.MapObjectController = function(imap, type, background_load) {
	if(imap == null) return;
	var that = this;
	this.imap = imap;
	this.type = type;
	this.childControllers = new Object();
	this.bgload = background_load;

	this.delconfirm = new org.sarsoft.view.MapDialog(imap, "Delete?", $('<div>Delete - Are You Sure?</div>'), "Delete", "Cancel", function() {
			that.dchandler();
			that.dchandler = null;
		});

	this.dao = org.sarsoft.MapState.daos[type.name] || new type.dao();
	this.attrs = new Object();
	this.dn = new org.sarsoft.MapObjectDN(this.bgload ? null : imap, type.label);
	$(this.dn).bind('visibilitychanged', function() { that.handleSetupChange(); });
	
	$(this.dao).bind('create', function(e, obj) { that.show(obj) });
	$(this.dao).bind('save', function(e, obj) { that.show(obj) });
	$(this.dao).bind('load', function(e, obj) { if(!that.attr(obj, "inedit")) that.show(obj) });
	$(this.dao).bind('loadall', function(e, obj) { that.growmap(obj) });
	$(this.dao).bind('delete', function(e, obj) { that.remove(obj) });
	
	this.dao.loadAll();
	this.dao.mark();
}

org.sarsoft.MapObjectController.prototype.id = function(obj) {
	return (typeof obj == "object") ? obj.id : obj;
}

org.sarsoft.MapObjectController.prototype.obj = function(obj) {
	return (typeof obj == "object") ? obj : this.dao.getObj(obj);
}

org.sarsoft.MapObjectController.prototype.buildAddButton = function(idx, text, handler) {
	var that = this;
	this.imap.dn.addNewOption(idx, "Add " + text, function() {
		var center = that.imap.map.getCenter();
		handler(that.imap.projection.fromLatLngToContainerPixel(center));
	});
}

org.sarsoft.MapObjectController.prototype.removeFromMap = function(obj) {
}

org.sarsoft.MapObjectController.prototype.focus = function(obj) {
}

org.sarsoft.MapObjectController.prototype.growmap = function(obj) {
	// override this stub
}

org.sarsoft.MapObjectController.prototype.attr = function(id, key, value) {
	if(id == null) return null;
	id = this.id(id);
	if(value != null) {
		if(typeof this.attrs[id] == "undefined") this.attrs[id] = new Object();
		this.attrs[id][key] = value;
	}
	return this.attrs[id] ? this.attrs[id][key] : null;
}

org.sarsoft.MapObjectController.prototype.remove = function(object) {
	this.attr(object, "inedit", false);
	if(this.dn != null) this.dn.remove(object.id);
	this.checkForObjects();
}

org.sarsoft.MapObjectController.prototype.show = function(object) {
	this.attr(object, "inedit", false);
	this.checkForObjects();
}

org.sarsoft.MapObjectController.prototype.del = function(handler) {
	this.dchandler = handler;
	this.delconfirm.show();
}

org.sarsoft.MapObjectController.prototype.handleSetupChange = function(cascade) {
	if(!this.dn.visible) {
		for(var key in this.dao.objs) {
			this.removeFromMap(this.dao.getObj(key));
		}
	} else {
		for(var key in this.dao.objs) {
			this.show(this.dao.getObj([key]));
		}
	}
	if(cascade) {
		for(var type in this.childControllers) {
			this.childControllers[type].handleSetupChange(true);
		}
	}
}

org.sarsoft.MapObjectController.prototype.checkForObjects = function() {
	var check = Object.keys(this.dao.objs).length > 0;
	if(this.type.geo && this.imap.controls.action) this.imap.controls.action.setDraftMode(this.type.name, check);
	this.dn.setDNVisible(check);
}

org.sarsoft.WaypointObjectDAO = function(name, baseURL) {
	org.sarsoft.MapObjectDAO.call(this, name);
	this.baseURL = baseURL;
	this.geo = true;
}

org.sarsoft.WaypointObjectDAO.prototype = new org.sarsoft.MapObjectDAO();

org.sarsoft.WaypointObjectDAO.prototype.updatePosition = function(id, position, handler) {
	var that = this;
	if(this.offline) {
		var m = this.getObj(id);
		m.position.lat = position.lat;
		m.position.lng = position.lng;
		$(that).triggerHandler('save', m);
		if(handler) org.sarsoft.async(function() { handler(m) });
	} else {
		this._doPost("/" + id + "/position", function(r) { that.setObj(id, r); if(handler) handler(r) }, {position: position});
	}
}

org.sarsoft.WaypointObjectController = function(imap, type, background_load) {
	org.sarsoft.MapObjectController.call(this, imap, type, background_load);
	var that = this;

	this.cm = {
			a_none : function(obj) { return obj == null && that.dn.visible },
			a_editnodlg : function(obj) { return obj.inedit && !that.dlg.live },
			a_noedit : function(obj) { return obj.obj != null && !obj.inedit && !that.dlg.live },
			
			h_details : function(data) { that.dlg.show(data.pc.obj) },
			h_edit : function(data) { that.edit(data.pc.obj) },
			h_drag : function(data) { that.drag(data.pc.obj) },
			h_del : function(data) { that.del(function() { that.dao.del(data.pc.obj.id) }) }
	}
}

org.sarsoft.WaypointObjectController.prototype = new org.sarsoft.MapObjectController();

org.sarsoft.WaypointObjectController.prototype._contextMenuCheck = function(mapobj) {
	var that = this;
	if(mapobj == null) return {}
	var obj = that.dao.getObj(that.getObjectIdFromWpt(mapobj));
	var inedit = (obj != null && that.attr(obj, "inedit"));
	return { obj: obj, inedit: inedit }
}

org.sarsoft.WaypointObjectController.prototype.focus = function(obj) {
	this.imap.map.setCenter(new google.maps.LatLng(obj[this.type.waypoint].lat, obj[this.type.waypoint].lng));
}

org.sarsoft.WaypointObjectController.prototype.removeFromMap = function(obj) {
	this.imap.removeWaypoint(obj[this.type.waypoint]);
}

org.sarsoft.WaypointObjectController.prototype.growmap = function(obj) {
	this.imap.growInitialMap(new google.maps.LatLng(obj.position.lat, obj.position.lng));
}

org.sarsoft.WaypointObjectController.prototype.edit = function(obj) {
	obj = this.obj(obj);
	this.imap.allowDragging(obj[this.type.waypoint]);
	this.attr(obj, "inedit", true);
}

org.sarsoft.WaypointObjectController.prototype._saveWaypoint = function(id, waypoint, handler) {
	// override this
}

org.sarsoft.WaypointObjectController.prototype.save = function(obj, handler) {
	obj = this.obj(obj);
	this.imap.saveDrag(obj[this.type.waypoint]);
	this.attr(obj, "inedit", false);
	this._saveWaypoint(obj.id, obj[this.type.waypoint], function() {if(handler != null) handler();});
}

org.sarsoft.WaypointObjectController.prototype.discard = function(obj) {
	obj = this.obj(obj);
	this.imap.discardDrag(obj[this.type.waypoint]);
	this.attr(obj, "inedit", false);
}

org.sarsoft.WaypointObjectController.prototype.drag = function(obj) {
	obj = this.obj(obj);
	var that = this;
	this.attr(obj, "inedit", true);
	this.imap.dragOnce(obj[this.type.waypoint], function(gll) {
		that.attr(obj, "inedit", false);
		obj[that.type.waypoint].lat = gll.lat();
		obj[that.type.waypoint].lng = gll.lng();
		that._saveWaypoint(obj.id, obj[that.type.waypoint]);
	});
}

org.sarsoft.WaypointObjectController.prototype.remove = function(obj) {
	this.imap.removeWaypoint(obj[this.type.waypoint]);
	org.sarsoft.MapObjectController.prototype.remove.call(this, obj);
}

org.sarsoft.WaypointObjectController.prototype.getObjectIdFromWpt = function(wpt) {
	for(var key in this.dao.objs) {
		var obj = this.dao.getObj(key);
		if(obj != null && obj[this.type.waypoint].id == wpt.id) return key;
	}
}

org.sarsoft.WaypointObjectController.prototype.getConfig = function(obj) {
	return { active: true, visible: true, icon: "#FF0000" }
}

org.sarsoft.WaypointObjectController.prototype.DNGetIcon = function(obj) {
	var config = this.getConfig(obj);
	return $('<div><img src="' + org.sarsoft.controller.MarkerController.getRealURLForMarker(config.icon) + '"/></div>');
}

org.sarsoft.WaypointObjectController.prototype.DNAddLine = function(obj, handler) {
	var that = this;
	var line = this.dn.add(obj.id, obj[this.dao.label], function() {
		if(handler && handler()) return;
		that.focus(obj);
	});
	line.prepend(this.DNGetIcon(obj));
	return line
}

org.sarsoft.WaypointObjectController.prototype.DNAddEdit = function(obj, handler) {
	var that = this;
	this.dn.addIconEdit(obj.id, function() {
		that.dlg.show(obj, null, true);
		that.dlg.live = true;
		that.edit(obj);
	});
}

org.sarsoft.WaypointObjectController.prototype.DNAddDelete = function(obj) {
	var that = this;
	this.dn.addIconDelete(obj.id, function() {
		that.del(function() { that.dao.del(obj.id); });
	});
}


org.sarsoft.WayObjectDAO = function(name, baseURL, wname) {
	org.sarsoft.MapObjectDAO.call(this, name);
	this.baseURL = baseURL;
	this.geo = true;
	this.wname = wname;
}

org.sarsoft.WayObjectDAO.prototype = new org.sarsoft.MapObjectDAO();

org.sarsoft.WayObjectDAO.prototype.addBoundingBox = function(way) {
	var bb = [{lat: 90, lng: 180}, {lat: -90, lng: -180}]
	for(var i = 0; i < way.waypoints.length; i++) {
		var wpt = way.waypoints[i];
		if(wpt.lat < bb[0].lat) bb[0].lat = wpt.lat;
		if(wpt.lng < bb[0].lng) bb[0].lng = wpt.lng;
		if(wpt.lat > bb[1].lat) bb[1].lat = wpt.lat;
		if(wpt.lng > bb[1].lng) bb[1].lng = wpt.lng;
	}
	way.boundingBox=bb;
}

org.sarsoft.WayObjectDAO.prototype.validate = function(obj, override) {
	if(obj.way.boundingBox == null || override) this.addBoundingBox(obj.way);
	return org.sarsoft.MapObjectDAO.prototype.validate.call(this, obj);
}

org.sarsoft.WayObjectDAO.prototype.saveWay = function(obj, waypoints, handler) {
	var that = this;
	if(this.offline) {
		org.sarsoft.async(function() {
			var way = that.getObj(obj.id)[that.wname];
			way.waypoints = waypoints;
			that.validate(obj, true);
			$(that).triggerHandler('save', obj);
			if(handler != null) handler(way);
		});
	} else {
		this._doPost("/" + obj.id + "/" + this.wname, function(way) {
			that.getObj(obj.id)[that.wname] = way;
			if(handler != null) handler(way);
		}, waypoints);
	}
}


org.sarsoft.WayObjectController = function(imap, type, background_load) {
	org.sarsoft.MapObjectController.call(this, imap, type, background_load);	
	var that = this;
	
	this.pg = new org.sarsoft.view.ProfileGraph();
	this.profileDlg = new org.sarsoft.view.MapDialog(imap, "Elevation Profile", this.pg.div, "OK", null, function() { that.pg.hide(); });
	this.profileDlg.dialog.hideEvent.subscribe(function() { that.pg.hide(); });
	
	this.cm = {
			a_none : function(obj) { return obj == null && that.dn.visible },
			a_editnodlg : function(obj) { return obj.inedit && !that.dlg.live },
			a_noedit : function(obj) { return obj.obj != null && !obj.inedit && !that.dlg.live },

			h_details : function(data) { that.dlg.show(data.pc.obj, data.point) },
			h_profile : function(data) { that.profile(data.pc.obj) },
			h_drag : function(data) { that.edit(data.pc.obj) },
			h_extend : function(data) { that.extend(data.pc.obj) },
			h_save : function(data) { that.save(data.pc.obj) },
			h_discard : function(data) { that.discard(data.pc.obj) },
			h_del : function(data) { that.del(function() { that.dao.del(data.pc.obj.id) }) }
	}	
}

org.sarsoft.WayObjectController.prototype = new org.sarsoft.MapObjectController();

org.sarsoft.WayObjectController.prototype._contextMenuCheck = function(mapobj, data) {
	var that = this;
	if(mapobj == null) return {}
	var obj = that.dao.getObj(that.getObjectIdFromWay(mapobj));
	var inedit = (obj != null && that.attr(obj, "inedit"));
	return { obj: obj, inedit: inedit }
}

org.sarsoft.WayObjectController.prototype.getConfig = function(obj) {
	return { active: true, visible: true, color : "#FF0000", weight : 2, fill : 30 }
}

org.sarsoft.WayObjectController.prototype.profile = function(obj) {
	var that = this;
	obj = this.obj(obj);
	var config = this.getConfig(obj);
	this.pg.profile(obj[this.type.way], config.color, function() {
		that.profileDlg.show();
	}, obj[this.dao.label] || "Unnamed Shape");
}

org.sarsoft.WayObjectController.prototype.removeFromMap = function(obj) {
	this.imap.removeWay(obj[this.type.way]);
}

org.sarsoft.WayObjectController.prototype.focus = function(obj) {
	this.imap.setBounds(new google.maps.LatLngBounds(new google.maps.LatLng(obj[this.type.way].boundingBox[0].lat, obj[this.type.way].boundingBox[0].lng), new google.maps.LatLng(obj[this.type.way].boundingBox[1].lat, obj[this.type.way].boundingBox[1].lng)));
}

org.sarsoft.WayObjectController.prototype.growmap = function(object) {
		var bb = object[this.type.way].boundingBox;
		if(bb[0].lat == 90 && bb[0].lng == 180 && bb[1].lat == -90 && bb[1].lng == -180) return;
		this.imap.growInitialMap(new google.maps.LatLng(bb[0].lat, bb[0].lng));
		this.imap.growInitialMap(new google.maps.LatLng(bb[1].lat, bb[1].lng));
}

org.sarsoft.WayObjectController.prototype.save = function(obj, handler) {
	var that = this;
	obj = this.obj(obj);
	if(!this.attr(obj, "inedit")) {
		this.discard(obj);
		return handler();
	}
	var way = obj[this.type.way];
	way.waypoints = this.imap.save(way.id);
	
	this._saveWay(obj, way.waypoints, function(newobj) { obj[that.type.way] = newobj; that.show(obj); if(handler != null) handler();});
	this.attr(obj, "inedit", false);
}

org.sarsoft.WayObjectController.prototype._saveWay = function(obj, waypoints, handler) {
	// call this.dao.saveWaypoints or similar
}

org.sarsoft.WayObjectController.prototype.discard = function(obj) {
	obj = this.obj(obj);
	this.imap.discard(obj[this.type.way].id);
	this.attr(obj, "inedit", false);
}

org.sarsoft.WayObjectController.prototype.redraw = function(obj, onEnd, onCancel) {
	obj = this.obj(obj);
	this.imap.redraw(obj[this.type.way].id, onEnd, onCancel);
	this.attr(obj, "inedit", true);
}

org.sarsoft.WayObjectController.prototype.edit = function(obj) {
	obj = this.obj(obj);
	if(obj[this.type.way].waypoints.length > 500) {
		alert("Vertex dragging is not possible on lines with more than 500 waypoints.");
		return;
	}
	this.imap.edit(obj[this.type.way].id);
	this.attr(obj, "inedit", true);
}

org.sarsoft.WayObjectController.prototype.extend = function(obj) {
	var that = this;
	obj = this.obj(obj);
	this.imap.extend(obj[this.type.way].id, function() {
		var way = obj[that.type.way];
		way.waypoints = that.imap.save(way.id);
		that._saveWay(obj, way.waypoints, function(newobj) { obj[that.type.way] = newobj; that.show(obj); });
		that.attr(obj, "inedit", false);
	}, function() {
		that.attr(obj, "inedit", false);
	});
	
	this.attr(obj, "inedit", true);
}

org.sarsoft.WayObjectController.prototype.remove = function(obj) {
	this.imap.removeWay(obj[this.type.way]);
	org.sarsoft.MapObjectController.prototype.remove.call(this, obj);
}

org.sarsoft.WayObjectController.prototype.getObjectIdFromWay = function(way) {
	if(way == null || way.waypoints == null) return null;
	for(var key in this.dao.objs) {
		var obj = this.dao.objs[key];
		if(obj != null && obj[this.type.way].id == way.id) return key;
	}
}

org.sarsoft.WayObjectController.prototype.DNGetIcon = function(obj) {
	var obj = this.obj(obj);
	var config = this.getConfig(obj);
	
	if(obj[this.type.way].polygon) {
		var div = jQuery('<div style="height: 0.6em;"></div>');
		div.css({"border-top": '1px solid ' + config.color, "border-bottom": '1px solid ' + config.color});
		jQuery('<div style="width: 100%; height: 100%"></div>').appendTo(div).css({"background-color": config.color, filter: "alpha(opacity=" + config.fill + ")", opacity : config.fill/100});
		return div;
	} else {
		return jQuery('<div style="height: 0.5ex"></div>').css("border-top", config.weight + "px solid " + config.color);			
	}
}

org.sarsoft.WayObjectController.prototype.DNAddLine = function(obj, handler) {
	var that = this;
	var line = this.dn.add(obj.id, obj[this.dao.label], function() {
		if(handler && handler()) return;
		that.focus(obj);
	});
	line.prepend(this.DNGetIcon(obj));
	return line
}

org.sarsoft.WayObjectController.prototype.DNAddProfile = function(obj) {
	var that = this;
	this.dn.addIcon(obj.id, "Elevation Profile", '<img src="' + $.img('profile.png') + '"/>', function() {
		that.profile(obj);
	});
}

org.sarsoft.WayObjectController.prototype.DNAddEdit = function(obj, handler) {
	var that = this;
	this.dn.addIconEdit(obj.id, function() {
		that.edit(obj);
		that.dlg.show(obj, null, true);
		that.dlg.live = true;
	});
}

org.sarsoft.WayObjectController.prototype.DNAddDelete = function(obj) {
	var that = this;
	this.dn.addIconDelete(obj.id, function() {
		that.del(function() { that.dao.del(obj.id); });
	});
}


org.sarsoft.GeoRefImageDlg = function(imap, handler) {
	var that = this;
	this.imap = imap;
	var table = jQuery('<table></table>');
	var container = jQuery('<tbody></tbody>').appendTo(table);
	this.form = new Object();
	
	var round = function(n) {
		return Math.round(n*100000)/100000;
	}

	var line = jQuery('<td></td>').appendTo(jQuery('<tr><td>Image URL:</td></tr>').appendTo(container));
	this.form.url = jQuery('<input type="text" size="20"/>').appendTo(line);
	jQuery('<button>Set</button>').appendTo(line).click(function() {
		var url = that.form.url.val();
		if(url == null || url.length == 0) return;
		if(that.reference != null) {
			that.reference.set("url", url);
		} else {
			that.write({url: url});
		}
	});
	
	line.parent().append('<td rowspan="6" valign="top" style="padding-left: 20px"><b>Add Custom Layer</b><br/>You can turn any image into a custom map layer by matching two points on the image with two points on the map.<br/><br/>1. Enter the image URL and click "Set".<br/>2. Right-click on the map and select "Georeference | Mark Point" to mark image points.<br/>3. Right-click on the map and select "Georeference | Mark LatLng" to mark coordinates.</td>');
	
	var line = jQuery('<tr><td style="margin-bottom: 15px">Name:</td></tr>').appendTo(container);
	this.form.name = jQuery('<input type="text" size="20"/>').appendTo(jQuery('<td></td>').appendTo(line));
	
	jQuery('<tr><td colspan="2" height="20px"></td></tr>').appendTo(container);

	var line = jQuery('<div></div>').appendTo(jQuery('<td></td>').appendTo(jQuery('<tr><td>Opacity:</td></tr>').appendTo(container)));
	this.form.opacitySlider = org.sarsoft.view.CreateSlider(line);
	this.form.opacitySlider.subscribe('change', function() {
		if(that.reference != null) that.reference.set('opacity', that.form.opacitySlider.getValue()/100);
	});

	var line = jQuery('<td style="white-space: nowrap">=</td>').appendTo(jQuery('<tr><td style="white-space: nowrap">Reference 1:</td></tr>').appendTo(container));
	this.form.p1 = jQuery('<input type="text" size="10"/>').prependTo(line);
	this.form.l1 = jQuery('<input type="text" size="20"/>').appendTo(line);
	this.form.u1 = jQuery('<button>Update</button>').appendTo(line).click(function() {
		var str = that.form.p1.val().split(",");
		that.reference.set("p1", new google.maps.Point(Number(str[0]), Number(str[1])));
		var str = that.form.l1.val().split(",");
		that.reference.set("ll1", new google.maps.LatLng(Number(str[0]), Number(str[1])));		
	});
	var line = jQuery('<td style="white-space: nowrap">=</td>').appendTo(jQuery('<tr><td style="white-space: nowrap">Reference 2:</td></tr>').appendTo(container));
	this.form.p2 = jQuery('<input type="text" size="10"/>').prependTo(line);
	this.form.l2 = jQuery('<input type="text" size="20"/>').appendTo(line);
	this.form.u2 = jQuery('<button>Update</button>').appendTo(line).click(function() {
		var str = that.form.p2.val().split(",");
		that.reference.set("p2", new google.maps.Point(Number(str[0]), Number(str[1])));
		var str = that.form.l2.val().split(",");
		that.reference.set("ll2", new google.maps.LatLng(Number(str[0]), Number(str[1])));		
	});

	function setPoint(idx, p) {
		var pxdiv = imap.projection.fromLatLngToDivPixel(imap.projection.fromContainerPixelToLatLng(p));
		var center = new google.maps.Point(that.reference.div.width()/2, that.reference.div.height()/2);
		var translated = new google.maps.Point((pxdiv.x - that.reference.px_nw.x) - center.x, center.y - (pxdiv.y - that.reference.px_nw.y));
		var scaled = new google.maps.Point(translated.x*(that.reference.size.w/that.reference.div.width()), translated.y*(that.reference.size.h/that.reference.div.height()))
		var angle = angle = -1*GeoUtil.DegToRad(that.reference.angle);
		var rotated = new google.maps.Point(scaled.x*Math.cos(angle) + scaled.y*Math.sin(angle), scaled.y*Math.cos(angle) - scaled.x*Math.sin(angle));
		
		that.form["p" + idx].val(Math.round(that.reference.size.w/2 + rotated.x) + "," + Math.round(that.reference.size.h/2 - rotated.y));
		that.form["u" + idx].click();
	}

	function setLatLng(idx, p) {
		var ll = imap.projection.fromContainerPixelToLatLng(p);
		that.form["l" + idx].val(round(ll.lat()) + "," + round(ll.lng()));
		that.form["u" + idx].click();
	}

	this.dlg = new org.sarsoft.view.MapDialog(imap, "Layer Georeferencing", table, "Save", "Cancel", function() {
		var name = that.form.name.val();
		if(name == null || name.length == 0) {
			var url = that.reference.url.split("/");
			name = url[url.length-1];
		}
		handler({name: name, url: that.reference.url, x1: that.reference.p1.x, y1: that.reference.p1.y, x2: that.reference.p2.x, y2: that.reference.p2.y, lat1: round(that.reference.ll1.lat()), lng1: round(that.reference.ll1.lng()), lat2: round(that.reference.ll2.lat()), lng2: round(that.reference.ll2.lng())});
	});

	this.dlg.dialog.hideEvent.subscribe(function() { 
		if(that.reference != null) {
			that.reference.setMap(null);
			that.reference = null;
		}
	});

	var items = [{text: "Mark Point 1", applicable : function(obj) { return true }, handler: function(data) { setPoint(1, data.point); }},
	             {text: "Mark Point 2", applicable : function(obj) { return true }, handler: function(data) { setPoint(2, data.point); }},
	             {text: "Mark LatLng 1", applicable : function(obj) { return true }, handler: function(data) { setLatLng(1, data.point); }},
	             {text: "Mark LatLng 2", applicable : function(obj) { return true }, handler: function(data) { setLatLng(2, data.point); }},
	             ];

	this.imap.addContextMenuItems([{text : "Georeference \u2192", applicable : function(obj) { return that.reference != null }, items: items}]);
	
}

org.sarsoft.GeoRefImageDlg.prototype.write = function(gr) {
	var bounds = imap.map.getBounds();	
	this.form.opacitySlider.setValue(100);
	
	if(gr == null)  {
		this.form.p1.val("");
		this.form.p2.val("");
		this.form.l1.val("");
		this.form.l2.val("");
		this.form.name.val("");
		return;
	}
	
	if(gr.x1 == null) {
		gr.x1 = -1;
		gr.y1 = -1;
	}
	if(gr.x2 == null) {
		gr.x2 = -1;
		gr.y2 = -1;
	}
	if(gr.lat1 == null) {
		gr.lat1 = Math.round(bounds.getSouthWest().lat()*100000)/100000;
		gr.lng1 = Math.round(bounds.getSouthWest().lng()*100000)/100000;
	}
	if(gr.lat2 == null) {
		gr.lat2 = Math.round(bounds.getNorthEast().lat()*100000)/100000;
		gr.lng2 = Math.round(bounds.getNorthEast().lng()*100000)/100000;
	}

	this.form.p1.val(gr.x1 + "," + gr.y1);
	this.form.p2.val(gr.x2 + "," + gr.y2);
	this.form.l1.val(gr.lat1 + "," + gr.lng1);
	this.form.l2.val(gr.lat2 + "," + gr.lng2);
	this.form.url.val(gr.url);
	this.form.name.val(gr.name);
	
	this.reference = new org.sarsoft.GeoRefImageOverlay(this.imap.map, null, gr.url, new google.maps.Point(gr.x1, gr.y1), new google.maps.Point(gr.x2, gr.y2), new google.maps.LatLng(gr.lat1, gr.lng1), new google.maps.LatLng(gr.lat2, gr.lng2), 1, true);
}

org.sarsoft.GeoRefImageDlg.prototype.show = function(gr) {
	this.id = null;
	this.dlg.show();
	this.write(gr);
}

org.sarsoft.GeoRefDAO = function(errorHandler, baseURL) {
	org.sarsoft.MapObjectDAO.call(this, "GeoRef");
	if(typeof baseURL == "undefined") baseURL = "/rest/georef";
	this.baseURL = baseURL;
	this.errorHandler = errorHandler;
}

org.sarsoft.GeoRefDAO.prototype = new org.sarsoft.MapObjectDAO();

org.sarsoft.controller.GeoRefController = function(imap, background_load) {
	var that = this;
	org.sarsoft.MapObjectController.call(this, imap, {name: "GeoRef", dao: org.sarsoft.GeoRefDAO, label: "Geospatial Images"}, background_load);
	this.imap.register("org.sarsoft.controller.GeoRefController", this);
	this.dn.cb.css('display', 'none');
	
	if(org.sarsoft.writeable) {
		this.buildAddButton(1, "Geospatial Image", function(point) {
			that.georefDlg.show(null, point);
		});
	}
	
	this.georefDlg = new org.sarsoft.GeoRefImageDlg(imap, function(gr) {
		gr.id = that.georefDlg.id;
		that.georefDlg.id = null;
		if(gr.id == null) {
			that.dao.create(gr);
		} else {
			that.dao.save(gr.id, gr);
		}		
	});
}

org.sarsoft.controller.GeoRefController.prototype = new org.sarsoft.MapObjectController();
sarsoft.Controllers["GeoRef"] = [25, org.sarsoft.controller.GeoRefController];

org.sarsoft.controller.GeoRefController.prototype.refreshLayers = function() {
	sarsoft.map.layers_georef = this.dao.objs.filter(function(o) { return o != null });
	this.imap.map._overlaycontrol.resetMapTypes(true);
}


org.sarsoft.controller.GeoRefController.prototype.show = function(object) {
	var that = this;
	
	this.refreshLayers();
	org.sarsoft.MapObjectController.prototype.show.call(this, object);
	
	var line = this.dn.add(object.id, object.name, function() {
		var config = that.imap.getConfig();
		var alias = "_gr" + object.id;
		if(config.layers.indexOf(alias) < 0) {
			config.layers.push(alias);
			config.opacity.push(1);
		} else {
			config.opacity[config.layers.indexOf(alias)] = 1;
		}
		that.imap.setConfig(config);
	});
		
	line.prepend('<div><img src="' + object.url + '"/></div>');
	if(org.sarsoft.writeable) {	
		this.dn.addIconEdit(object.id, function() {
			var config = that.imap.getConfig();
			if(config.overlay == "_gr" + object.id) {
				config.overlay = null;
				config.opacity = 0;
				that.imap.setConfig(config);
			}
			that.georefDlg.show(object);
			that.georefDlg.id = object.id;
		});
		this.dn.addIconDelete(object.id, function() {
			that.del(function() { that.dao.del(object.id); });
		});
	}

}

org.sarsoft.controller.GeoRefController.prototype.remove = function(object) {
	org.sarsoft.MapObjectController.prototype.remove.call(this, object);
	this.refreshLayers();
}


org.sarsoft.DemShadingDlg = function(imap, handler) {
	var that = this;
	this.imap = imap;

	var table = $('<table><tbody><tr><td style="padding-right: 5px; vertical-align: top">Name</td><td><input type="text"/></td><td rowspan="2" style="width: 60%; vertical-align: top">' + 
			'Each line should have a set of conditions, a space, and then an RGB hex color code.  Conditions include s for slope, a for aspect, and e for elevation.' + 
			'  For more information, see <a href="http://caltopo.blogspot.com/2013/02/custom-dem-shading.html" target="_new">this blog post</a>.' + 
			' <table style="margin-top: 5px"><tbody><tr><td></td><td>Shade all slopes between 15 and 30 degrees red</td></tr>' +
			' <tr><td></td><td>Red-blue gradient for elevations between 1k meters and 3k meters</td></tr>' + 
			' <tr><td></td><td>Color north facing slopes 30-45&deg; steep and above 6,000\' orange</td></tr></tbody></table>' + 
			+ '</td></tr></tbody></table>');
	
	$('<span style="color: blue" class="underlineOnHover">s15-30 FF0000</span>').appendTo(table.find('table').find('td')[0]).click(function() { that.ta.val('s15-30 FF0000') });
	$('<span style="color: blue" class="underlineOnHover">e1000-3000 FF0000-0000FF</span>').appendTo(table.find('table').find('td')[2]).click(function() { that.ta.val('e1000-3000 FF0000-0000FF') });
	$('<span style="color: blue" class="underlineOnHover">s30-45a270-90e6000f-14000f FF8000</span>').appendTo(table.find('table').find('td')[4]).click(function() { that.ta.val('s30-45a270-90e6000f-14000f FF8000') });
	
	$('<tr><td style="padding-right: 5px; vertical-align: top">Shading</td><td><textarea style="width: 95%; height: 6em"></textarea></td></tr>').appendTo(table.children()[0]);
	
	this.name = table.find('input');
	this.ta = table.find('textarea');
	
	this.dlg = new org.sarsoft.view.MapDialog(imap, "Digital Elevation Model Shading", table, "Save", "Cancel", function() {
		var cfg = that.ta.val() || "";
		cfg = cfg.trim().replace(/\n/g, 'p').replace(/ /g, 'c');
		handler({name: that.name.val(), alias: "sc_" + cfg});
	});

}

org.sarsoft.DemShadingDlg.prototype.write = function(dem) {
	if(dem == null) {
		this.name.val('');
		this.ta.val('');
	} else {
		this.name.val(dem.name);
		this.ta.val(dem.alias ? dem.alias.split("_")[1].replace(/p/g, '\n').replace(/c/g, ' ') : "");
	}
}

org.sarsoft.DemShadingDlg.prototype.show = function(dem) {
	this.id = null;
	this.dlg.show();
	this.write(dem);
}

org.sarsoft.ViewshedDlg = function(imap, handler) {
	var that = this;
	this.imap = imap;

	var form = $('<form name="EntityForm_' + org.sarsoft.view.EntityForm._idx++ + '" className="EntityForm" style="width: 90%"><table style="border: 0; width: 100%"><tbody><tr></tr></tbody></table></form>');
	var left = $('<td style="width: 40%"></td>').appendTo(form.find('tr'));
	var right = $('<td style="padding-left: 20px">A viewshed analysis shows all areas that are visible from a certain point.  Simply drag the </td>').appendTo(form.find('tr'));
	$('<img src="' + $.img('icons/target.png') + '"/>').appendTo(right);
	right.append(' icon to the location you want to generate a viewshed for ' +
			'and click save.  You can also specify an eye altitude to adjust how high above ground the viewshed is run from.  Because it\'s difficult to drop the marker exactly at a high point, a value in the 10-30 meter range ' +
			'gives the best results.');
	
	this.name = jQuery('<input name="label" type="text" size="15"/>').appendTo(jQuery('<div class="item"><label style="width: 80px">Name:</label></div>').appendTo(left));	
	this.alt = jQuery('<input name="label" type="text" size="15"/>').prependTo($('<div><br/><span class="hint">meters above ground.  optional, default is 20.</span></div>').appendTo(jQuery('<div class="item"><label style="width: 80px">Eye Altitude:</label></div>').appendTo(left)));
	
	div = jQuery('<div class="item"><label for="color" style="width: 80px">Color:</label></div>').appendTo(left);
	var colorSwatch = jQuery('<div style="width: 20px; height: 20px; float: left"></div>').appendTo(div);
	div.append('<span style="float: left; margin-left: 5px">Click below or color code:</span>');
	this.color = jQuery('<input name="color" type="text" size="6" style="float: left; margin-left: 5px"/>').appendTo(div);
	this.color.change(function() {colorSwatch.css('background-color', '#' + that.color.val())});

	var colorContainer = jQuery('<div style="clear: both; margin-top: 5px"></div>').appendTo(left);
	var colors = ["#FFFFFF", "#C0C0C0", "#808080", "#000000", "#FF0000", "#800000", "#FF5500", "#FFAA00", "#FFFF00", "#808000", "#00FF00", "#008000", "#00FFFF", "#008080", "#0000FF", "#000080", "#FF00FF", "#800080"];
	for(var i = 0; i < colors.length; i++) {
		var swatch = jQuery('<div style="width: 20px; height: 20px; float: left; background-color: ' + colors[i] + '"></div>').appendTo(colorContainer);
		swatch.click(function() { var j = i; return function() {that.color.val(colors[j].substr(1)); that.color.trigger('change');}}());
	}	
	
	this.dlg = new org.sarsoft.view.MapDialog(imap, "Viewshed Analysis", form, "Save", "Cancel", function() {
		var gll = that.marker.getPosition();
		that.marker.setMap(null);
		that.marker = null;
		var cfg = (Math.round(gll.lat()*10000)/10000) + "b" + (Math.round(gll.lng()*10000)/10000);
		var alt = that.alt.val();
		if((alt || "").length > 0) cfg = cfg + "e" + alt;
		cfg = cfg + "c" + that.color.val().toUpperCase();
		handler({name: that.name.val(), alias: "vs_" + cfg});
	});

	this.dlg.dialog.hideEvent.subscribe(function() {
		if(that.marker != null) {
			that.marker.setMap(null);
			that.marker = null;
		}
	});
}

org.sarsoft.ViewshedDlg.prototype.show = function(vs) {
	var that = this;
	this.id = null;
	this.name.val(vs.name || '');
	var p1 = vs.alias.replace("vs_", "").split("c");
	var p2 = p1[0].split("e");
	var ll = p2[0].split("b");
	
	this.color.val(p1.length > 1 ? p1[1] : '#FF0000');
	this.color.trigger('change');
	if(p2.length > 1) this.alt.val(p2[1]);
	
	this.marker = new google.maps.Marker({ map: that.imap.map, draggable: true, icon : org.sarsoft.MapUtil.createIcon("target"), position: new google.maps.LatLng(Number(ll[0]), Number(ll[1])) });
	
	this.dlg.show();
}


org.sarsoft.ConfigurableLayerDAO = function(errorHandler, baseURL) {
	org.sarsoft.MapObjectDAO.call(this, "ConfiguredLayer");
	if(typeof baseURL == "undefined") baseURL = "/rest/cfglayer";
	this.baseURL = baseURL;
	this.errorHandler = errorHandler;
}

org.sarsoft.ConfigurableLayerDAO.prototype = new org.sarsoft.MapObjectDAO();

org.sarsoft.controller.ConfiguredLayerController = function(imap, background_load) {
	var that = this;
	org.sarsoft.MapObjectController.call(this, imap, {name: "ConfiguredLayer", dao: org.sarsoft.ConfigurableLayerDAO, label: "Terrain Modeling"}, background_load);
	this.imap.register("org.sarsoft.controller.ConfiguredLayerController", this);
	this.dn.cb.css('display', 'none');
	
	if(org.sarsoft.writeable) {
		
		if(imap.map._overlaymanager.getConfigFromAlias('sc') != null) this.buildAddButton(1, "DEM Shading", function(point) {
			that.demDlg.show(null, point);
		});

		if(imap.map._overlaymanager.getConfigFromAlias('vs') != null) this.buildAddButton(1, "Viewshed Analysis", function(point) {
			var gll = that.imap.map.getCenter();
			that.viewshedDlg.show({alias : ("vs_" + gll.lat() + "b" + gll.lng() + "cFF0000")}, point);
		});
	}
	
	this.demDlg = new org.sarsoft.DemShadingDlg(imap, function(dem) {
		dem.id = that.demDlg.id;
		that.demDlg.id = null;
		if(dem.id == null) {
			that.dao.create(dem, function(obj) {
				that.addToMap(obj);
			});
		} else {
			that.dao.save(dem.id, dem, function(obj) {
				that.addToMap(obj);
			});
		}
	});
	
	this.viewshedDlg = new org.sarsoft.ViewshedDlg(imap, function(vs) {
		vs.id = that.viewshedDlg.id;
		that.viewshedDlg.id = null;
		if(vs.id == null) {
			that.dao.create(vs, function(obj) {
				that.addToMap(obj);
			});
		} else {
			that.dao.save(vs.id, vs, function(obj) {
				that.addToMap(obj);
			});
		}
	});
	
}

org.sarsoft.controller.ConfiguredLayerController.prototype = new org.sarsoft.MapObjectController();
sarsoft.Controllers["ConfiguredLayer"] = [20, org.sarsoft.controller.ConfiguredLayerController];

org.sarsoft.controller.ConfiguredLayerController.prototype.refreshLayers = function() {
	sarsoft.map.layers_configured = this.dao.objs.filter(function(o) { return o != null });
	imap.map._overlaycontrol.resetMapTypes(true);
}

org.sarsoft.controller.ConfiguredLayerController.prototype.removeFromMap = function(obj) {
	var config = imap.getConfig();
	if(config.alphas == null) return;
	if(config.alphas.indexOf(obj.alias) >= 0) {
		config.alphas.splice(config.alphas.indexOf(obj.alias), 1);
		imap.setConfig(config);
	}
}

org.sarsoft.controller.ConfiguredLayerController.prototype.addToMap = function(obj) {
	var config = imap.getConfig();
	if(config.alphas == null) config.alphas = [];
	if(config.alphas.indexOf(obj.alias) == -1) {
		config.alphas.push(obj.alias);
		imap.setConfig(config);
	}
}

org.sarsoft.controller.ConfiguredLayerController.prototype.show = function(object) {
	var that = this;
	
	this.refreshLayers();
	org.sarsoft.MapObjectController.prototype.show.call(this, object);
	
	var line = this.dn.add(object.id, object.name, function() {
		var config = that.imap.getConfig();
		if(config.alphas == null) config.alphas = [];
		if(config.alphas.indexOf(object.alias) < 0) {
			config.alphas.push(object.alias);
		}
		that.imap.setConfig(config);
	});
	
	line.prepend('<div></div>');
	if(org.sarsoft.writeable) {	
		this.dn.addIconEdit(object.id, function() {
			that.removeFromMap(object);
			var dlg = (object.alias.indexOf("vs_") == 0 ? that.viewshedDlg : that.demDlg);
			dlg.show(object);
			dlg.id = object.id;
		});
		this.dn.addIconDelete(object.id, function() {
			that.del(function() { that.dao.del(object.id); });
		});
	}
	
}

org.sarsoft.controller.ConfiguredLayerController.prototype.remove = function(object) {
	this.removeFromMap(object);
	org.sarsoft.MapObjectController.prototype.remove.call(this, object);
	this.refreshLayers();
}


org.sarsoft.DEMService = function() {
}

org.sarsoft.DEMService.prototype.resamplePath = function(path, samples) {
	var length = google.maps.geometry.spherical.computeLength(path);
	var interval = length / (samples - 1);
	
	var s_index = 1;
	var leg = 0;
	var rpt = path[0];
	var resampled = []
	resampled.push(path[0])

	while(resampled.length < samples) {
		var d = google.maps.geometry.spherical.computeDistanceBetween(rpt, path[s_index]);
		if(d + leg < interval) {
			leg += d;
			rpt = path[s_index];
			s_index++;
			if(s_index >= path.length) {
				resampled.push(path[path.length-1]);
				return resampled;
			}
		} else {
			var ratio = (interval-leg)/d;
			rpt = new google.maps.LatLng(rpt.lat()*(1-ratio) + path[s_index].lat()*ratio, rpt.lng()*(1-ratio) + path[s_index].lng()*ratio);
			resampled.push(rpt);
			leg = 0;
		}
	}
	
	return resampled;
	
}

org.sarsoft.DEMService.prototype.getElevationForLocations = function(obj, handler) {
	var url = "/resource/dem?locations=";
	for(var i = 0; i < obj.length; i++) {
		url = url + (i > 0 ? "|" : "") + obj[i].lat() + "," + obj[i].lng();
	}
	YAHOO.util.Connect.asyncRequest('GET', url, { success : function(response) {
		var obj = YAHOO.lang.JSON.parse(response.responseText);
		var results = []
		for(var i = 0; i < obj.results.length; i++) {
			results[i] = { elevation: obj.results[i].elevation, slope: obj.results[i].slope, aspect: obj.results[i].aspect, location: new google.maps.LatLng(obj.results[i].location.lat, obj.results[i].location.lng)};
		}
		handler(results, obj.status);
	}, failure : function(response) {
		throw("AJAX ERROR getting elevation: " + response.responseText);
	}});
}

org.sarsoft.DEMService.prototype.getElevationAlongPath = function(obj, handler) {
	var path = this.resamplePath(obj.path, obj.samples);
	return this.getElevationForLocations(path, handler);
}

org.sarsoft.DEMStatus = { OK : "OK" }

org.sarsoft.view.ProfileGraph = function(standalone) {
	this.height=120;
	this.div = jQuery('<div style="height: ' + (this.height+20) + 'px; position: relative"></div>');
	this.service = new google.maps.ElevationService();
	this.standalone = standalone;
}

org.sarsoft.view.ProfileGraph.prototype.resample = function(path, samples) {
	var length = google.maps.geometry.spherical.computeLength(path);
	var interval = length / (samples - 1);
	
	var s_index = 1;
	var leg = 0;
	var rpt = path[0];
	var resampled = []
	resampled.push(path[0])

	while(resampled.length < samples) {
		var d = google.maps.geometry.spherical.computeDistanceBetween(rpt, path[s_index]);
		if(d + leg < interval) {
			leg += d;
			rpt = path[s_index];
			s_index++;
			if(s_index >= path.length) {
				resampled.push(path[path.length-1]);
				return resampled;
			}
		} else {
			var ratio = (interval-leg)/d;
			rpt = new google.maps.LatLng(rpt.lat()*(1-ratio) + path[s_index].lat()*ratio, rpt.lng()*(1-ratio) + path[s_index].lng()*ratio);
			resampled.push(rpt);
			leg = 0;
		}
	}
	
	return resampled;
}

org.sarsoft.view.ProfileGraph.prototype.profile = function(way, color, callback, title) {
	var that = this;
	var path = [];
	if(way.waypoints != null) {
		for(var i = 0; i < way.waypoints.length; i++) {
			path.push(new google.maps.LatLng(way.waypoints[i].lat, way.waypoints[i].lng));
		}
		if(way.polygon) path.push(new google.maps.LatLng(way.waypoints[0].lat, way.waypoints[0].lng));
	} else {
		path = way;
	}
	if(path.length > 300) path = this.resample(path, 300);
	this.service.getElevationAlongPath({path: path, samples: 200}, function(result, status) {
		if(status == google.maps.ElevationStatus.OK) {
			if(callback != null) callback();
			that.draw(result, color, title);
		} else {
			alert("An error occurred while retrieving profile data from Google Maps: " + status);
		}
	});
}

org.sarsoft.view.ProfileGraph.prototype.draw = function(series, color, title) {
	var that = this;
	this.div.empty();
	if(this.marker != null) this.marker.setMap(null);
	if(color == null) color = "#FF0000";
	var width = this.div.width();
	this.metric = false;
	
	var svg = '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" style="height: 120px; width: 100%">' +
		'<line x1="' + 0 + '" y1="' + 0 + '" x2="' + width + '" y2="' + 0 + '" style="stroke:rgb(0,0,0);stroke-width:1" />' +
		'<line x1="' + 0 + '" y1="' + this.height + '" x2="' + width + '" y2="' + this.height + '" style="stroke:rgb(0,0,0);stroke-width:1" />' +
		'<line x1="' + 0 + '" y1="' + 0 + '" x2="' + 0 + '" y2="' + this.height + '" style="stroke:rgb(0,0,0);stroke-width:1" />' +
		'<line x1="' + width + '" y1="' + 0 + '" x2="' + width + '" y2="' + this.height + '" style="stroke:rgb(0,0,0);stroke-width:1" />';
	
	var min = series[0].elevation;
	var max = series[0].elevation;
	var gross_gain = 0;
	var gross_loss = 0;
	var glls = [];
	for(var i = 0; i < series.length; i++) {
		glls[i] = series[i].location;
		min = Math.min(min, series[i].elevation);
		max = Math.max(max, series[i].elevation);
		if(i > 0) {
			if(series[i].elevation - series[i-1].elevation > 0) {
				gross_gain = gross_gain + (series[i].elevation - series[i-1].elevation);
			} else {
				gross_loss = gross_loss + Math.abs(series[i].elevation - series[i-1].elevation);
			}
		}
	}
	
	var xscale = width/(series.length-1);
	var yscale = this.height/(max-min);
	
	var total_dist = (google.maps.geometry.spherical.computeLength(glls));
	var exaggeration = (120/this.div.width())*total_dist/(max-min);
	var info = jQuery('<div stype="height: 20px"></div>').appendTo(this.div);
	if(!this.standalone) {
		info.append('<div style="float: right; font-weight: bold; color: #5a8ed7" class="underlineOnHover">print</div>').click(function() { org.sarsoft.view.ProfileGraph.print(series, color, title) });
		var ele = jQuery('<span></span>').appendTo(jQuery('<div style="display: inline-block; min-width: 20ex"></div>').appendTo(jQuery('<div style="display: inline-block; padding-left: 1ex">cursor: </div>').appendTo(info)));
	} else if(title != null) {
		$('<span style="padding-right: 10px">' + title + '</span>').appendTo(info);
	}
	
	this.stats = jQuery('<span>range: <span style="font-weight: bold">' + Math.round(min*3.2808399) + '\'</span> to <span style="font-weight: bold">' + Math.round(max*3.2808399) + '\'</span> <span style="padding-left: 10px">gross: <span style="color: green; font-weight: bold">+' + Math.round(gross_gain*3.2808399) + '\'</span> <span style="color: red; font-weight: bold">-' + Math.round(gross_loss*3.2808399) + '\'</span> <span style="padding-left: 10px">sampling interval <span style="font-weight: bold">' + Math.round(total_dist*3.2808399/series.length) + '\'</span> w/ <span style="font-weight: bold">' + (Math.round(exaggeration*10)/10) + 'x</span> vertical exaggeration</span></span>').appendTo(info);
	
	for(var i = 0; i < series.length - 1; i++) {
		var x1 = i*xscale;
		var x2 = (i+1)*xscale;
		var y1 = this.height-(series[i].elevation-min)*yscale;
		var y2 = this.height-(series[i+1].elevation-min)*yscale;
		svg = svg + '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" style="stroke:' + color + ';stroke-width:2" />';
	}
	
	var startpoint = 0;
 	var direction = series[1].elevation - series[0].elevation;

	for(var i = 1; i < series.length-1; i++) {
		var d = series[i+1].elevation - series[i].elevation;
		if(d/direction < 0 && i - startpoint < 4) {
			startpoint = i;
			direction = d;
		} else if(d/direction < 0 || (i == series.length-2 && (d/direction > 0) && i - startpoint >= 4)) {
			var testpoint = i;
			for(var j = i; j < series.length; j++) {
				if((series[j].elevation - series[startpoint].elevation) / (series[testpoint].elevation - series[startpoint].elevation) > 1) {
					testpoint = j;
				}
				var dtestdstart = (series[j].elevation - series[testpoint].elevation) / (series[testpoint].elevation - series[startpoint].elevation);
				if(dtestdstart < -0.1) break;
			}
			
			for(var j = startpoint; j >= 0; j--) {
				if((series[j].elevation - series[testpoint].elevation) / (series[startpoint].elevation - series[testpoint].elevation) > 1) {
					startpoint = j;
				}
				var dtestdstart = (series[j].elevation - series[startpoint].elevation) / (series[startpoint].elevation - series[testpoint].elevation);
				if(dtestdstart < -0.1) break;
			}

			if((testpoint-startpoint >= 6 && Math.abs((series[testpoint].elevation-series[startpoint].elevation)/(max-min)) >= 0.25) || Math.abs((series[testpoint].elevation-series[startpoint].elevation)/(max-min)) >= 0.5) {
				var x1 = startpoint*xscale;
				var y1 = this.height-(series[startpoint].elevation-min)*yscale;
				var x2 = testpoint*xscale;
				var y2 = this.height-(series[testpoint].elevation-min)*yscale;
				var y = (y1+y2)/2;
				svg = svg + '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x1 + '" y2="' + y2 + '" style="stroke:rgb(128,128,128);stroke-width:1" />';
				svg = svg + '<line x1="' + x1 + '" y1="' + y2 + '" x2="' + x2 + '" y2="' + y2 + '" style="stroke:rgb(128,128,128);stroke-width:1" />';
				de = Math.round(Math.abs(series[testpoint].elevation-series[startpoint].elevation));
				dist = google.maps.geometry.spherical.computeLength(glls.slice(startpoint, testpoint));
				dist = (Math.round(dist/160.934)/10);
				if(y2 > y1) {
					svg = svg + '<text style="text-anchor: middle; stroke:rgb(128,128,128); fill: rgb(128,128,128); stroke-width: 0.1" x="' + ((x1+x2)/2) + '" y="' + (y2-2) + '">' + dist + '\mi</text>';
					svg = svg + '<text transform="rotate(90, ' + x1 + ',' + y + ')" dy="-0.7ex" style="writing-mode: bt; text-anchor: middle; stroke:rgb(128,128,128); fill: rgb(128,128,128); stroke-width: 0.1" x="' + x1 + '" y="' + y + '">' + Math.round(de*3.2808399) + '\'</text>';
				} else {
					svg = svg + '<text dy="1em" style="text-anchor: middle; stroke:rgb(128,128,128); fill: rgb(128,128,128); stroke-width: 0.1" x="' + ((x1+x2)/2) + '" y="' + (y2+2) + '">' + dist + '\mi</text>';
					svg = svg + '<text transform="rotate(270, ' + x1 + ',' + y + ')" dy="1em" style="writing-mode: bt; text-anchor: middle; stroke:rgb(128,128,128); fill: rgb(128,128,128); stroke-width: 0.1" x="' + x1 + '" y="' + y + '">' + Math.round(de*3.2808399) + '\'</text>';
				}
			}
			
			startpoint=testpoint;
			i=testpoint;
			if(i < series.length - 1) direction = series[i+1].elevation-series[i].elevation;
		}
	}
	
	svg = svg + '</svg>';
	svg = jQuery(svg).appendTo(jQuery('<div style="background-color: white; position: relative; height: ' + this.height + 'px"></div>').appendTo(this.div));
	
	if(!this.standalone) {
		var icon = org.sarsoft.MapUtil.createFlatCircleImage(color);
		this.marker = new google.maps.Marker({icon: icon, position: series[0].location, map: map, shape: icon.shape });
		this.trace = jQuery('<div style="position: absolute; left: 0; top: 0px; width: 1px; border-left: 1px solid black; height: ' + this.height + 'px"></div>').appendTo(svg.parent());
		
		svg.mousemove(function(evt) {
			if(that.marker != null) {
				var x = (evt.pageX - svg.parent().offset().left)*(series.length-1)/width;
				x = Math.max(0, Math.min(x, series.length-1));
				var f = x - Math.floor(x);
				var elevation = series[Math.floor(x)].elevation*(1-f) + series[Math.ceil(x)].elevation*f;
				ele.html('<span><span style="font-weight: bold">' + Math.round(elevation*3.2808399) + '\'</span> at <span style="font-weight: bold">' + (Math.round((x/(series.length-1))*total_dist/16.0934)/100) + "mi</span> ");

				var l = series[Math.floor(x)].location;
				var r = series[Math.ceil(x)].location;
				
				that.marker.setPosition(new google.maps.LatLng(l.lat()*(1-f) + r.lat()*f, l.lng()*(1-f) + r.lng()*f));
				that.trace.css('left', (evt.pageX - svg.parent().offset().left) + 'px');
			}
		});
	}
	
}

org.sarsoft.view.ProfileGraph.prototype.hide = function() {
	this.div.empty();
	if(this.marker != null) {
		this.marker.setMap(null);
		this.marker = null;
	}
}

org.sarsoft.view.ProfileGraph.print = function(series, color, title) {
	var pg = org.sarsoft.view.ProfileGraph;
	if(pg.window == null || pg.window.closed) pg.window = window.open('/profile');
	if(pg.window.document != null && pg.window.document.body != null && pg.window.document.body.profile != null) {
		pg.window.document.body.profile(series, color, title);		
		pg.window.focus();
	} else {
		window.setTimeout(function() { org.sarsoft.view.ProfileGraph.print(series, color, title) }, 500);
	}
}