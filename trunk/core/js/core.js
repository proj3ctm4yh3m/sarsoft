org.sarsoft.widget.Sharing = function(imap, dn) {
	var that = this;
	
	this.settings = jQuery('<div></div>');
	var body = jQuery('<div></div>').append(this.settings);
	var sharingDlg = new org.sarsoft.view.MapDialog(imap, "Sharing", body, "OK", "Cancel", function() {
		if(that.handler != null) that.handler();
	});
	dn.defaults.share.click(function() {sharingDlg.swap();});

	if(org.sarsoft.tenantid != null) {

		body.prepend('<div style="font-size: 120%; color: #5a8ed7">Share</div>');
		
		this.collaborate = jQuery('<div><div style="font-size: 120%; color: #5a8ed7; padding-top: 5px">Collaborate</div></div>').appendTo(body);
				
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
				that.timer = setInterval(function() {that.imap.timer();}, 10000);
				that.killswitch = setTimeout(function() { that.toggle.setValue(false); clearInterval(that.timer); that.timer = null; that.killswitch = null}, 3600000)
			}
		});

		if(org.sarsoft.map.autoRefresh) {
			this.sync.attr("checked", "checked");
		}
	}
	
}

org.sarsoft.StructuredDataNavigator = function(imap) {
	var that = this;
	org.sarsoft.DataNavigator.call(this, imap);

	this.account = this._getHeader(org.sarsoft.username == null ? "Not Signed In" : org.sarsoft.username, "account.png");
	if(org.sarsoft.username != null) {
	  this.defaults.account = new org.sarsoft.widget.Account(imap, this.account.body, this.account.header);
	} else {
	  this.defaults.account = new org.sarsoft.widget.NoAccount(imap, this.account.body);
	  this.account.block.css('padding-bottom', '5px');
	}

	this.tenant = this._getHeader(org.sarsoft.tenantname || "Unsaved Map", "favicon.png");
	this.defaults.io = $('<div style="font-weight: bold; color: black; padding-top: 5px"></div>').appendTo(this.tenant.body);
	this.defaults.iobody = $('<div></div>').appendTo(this.tenant.body);
	$('<div style="clear: both; padding-bottom: 5px">').appendTo(this.tenant.body);
	this.defaults.save = $('<div class="underlineOnHover" style="display: none; float: left; margin-right: 10px; color: red; font-weight: bold" title="Save This to ' + org.sarsoft.version + '"><img style="vertical-align: text-bottom; margin-right: 2px" src="' + org.sarsoft.imgPrefix + '/save.png"/>Save</span>').appendTo(this.defaults.io);
	this.defaults.share = jQuery('<div class="underlineOnHover" style="float: left; margin-right: 10px; font-weight: bold; color: black; cursor: pointer" title="Share via Email, or Embed in a Forum Post"><img style="vertical-align: text-bottom; margin-right: 2px" src="' + org.sarsoft.imgPrefix + '/sharing.png"/>Share</span>').appendTo(this.defaults.io);
	
	this.defaults.sharing = new org.sarsoft.widget.Sharing(imap, this);
	this.defaults.body = $('<div></div>').appendTo(this.tenant.body);
	
	var div = $('<div style="padding-top: 5px; padding-bottom: 10px; clear: both; font-size: 120%; color: green"></div>').appendTo(this.tenant.body).css('display', org.sarsoft.writeable ? 'block' : 'none');
	
	this.addobjlink = new org.sarsoft.view.DropSelect("+ Add New Object", {color: "green", "font-weight": "normal"});
	this.addobjlink.container.appendTo(div);
	
	$('<div style="margin-top: 10px"></div>').appendTo(div);

	this.addlayerlink = new org.sarsoft.view.DropSelect("+ Add New Layer", {color: "green", "font-weight": "normal"});
	this.addlayerlink.container.appendTo(div);

	var settings = this.addDataType("Settings");
	settings.body.css({'padding-left': '0px', 'padding-top': '5px'});
	settings.block.css({'margin-bottom': '10px'});
	this.defaults.settings = settings.body;
	if(org.sarsoft.writeable) this.defaults.settings.save = settings.getTool().addClass('underlineOnHover').css({'font-size': '83%', 'display': 'none', 'padding-top': '1px'}).html('<img style="vertical-align: text-bottom; margin-right: 2px; height: 14px; width: 14px" src="' + org.sarsoft.imgPrefix + '/save.png" style="cursor: pointer; vertical-align: middle"/>Save').
		attr("title", 'Save These and Other Map Settings for Future Visits');

	new org.sarsoft.widget.MapLayers(imap, this.defaults.body);

	if(org.sarsoft.userPermissionLevel == "WRITE" || org.sarsoft.userPermissionLevel == "ADMIN") {
		this.savedAt = jQuery('<div style="display: none; color: #CCCCCC; font-style: italic">Map Not Modified</div>').insertBefore(this.defaults.io);
		org.sarsoft.BaseDAO.addListener(function(success) {
			if(success) {
				var d = new Date();
				var pm = false;
				var hours = d.getHours();
				if(hours > 12) {
					hours = hours - 12;
					pm = true;
				}
				that.savedAt.css('display', 'block').html('Last saved at ' + hours + ':' + (d.getMinutes() < 10 ? '0' : '') + d.getMinutes() + ':' + (d.getSeconds() < 10 ? '0' : '') + d.getSeconds() + (pm ? ' PM' : ' AM'));
			} else {
				that.savedAt.css({'display': 'block', 'font-style': 'normal', 'font-weight': 'bold', 'color': 'red'}).html('CHANGES NOT SAVED');
			}
		});
	}

}

org.sarsoft.StructuredDataNavigator.prototype = new org.sarsoft.DataNavigator();

org.sarsoft.StructuredDataNavigator.prototype._getHeader = function(text, icon) {
	var tree = new org.sarsoft.DNTree(this.left, text);
	tree.lock = true;
	tree.header.addClass('dnheader').css('cursor', 'hand');
	tree.header.prepend(jQuery('<img style="vertical-align: text-bottom; margin-right: 2px" src="' + org.sarsoft.imgPrefix + '/' + icon + '"/>'));
	tree.body.css('padding-left', '2px');
	return tree;
}

org.sarsoft.StructuredDataNavigator.prototype.setDraftMode = function(draft) {
	this.defaults.save.css('display', draft ? 'block' : 'none');
	this.defaults.share.css('display', draft ? 'none' : 'block');
}

org.sarsoft.StructuredDataNavigator.prototype.addNewOption = function(idx, text, handler) {
	if(idx == 0) {
		this.addobjlink.addItem(text, handler);
	} else {
		this.addlayerlink.addItem(text, handler);
	}
}

org.sarsoft.AdjustableBox = function(imap, sw, ne) {
	var that = this;
	if(imap == null) return;
	this.imap = imap;
	
	this.g = new Array();
	this.g.push(new google.maps.LatLng(sw.lat(), sw.lng()));
	this.g.push(new google.maps.LatLng(ne.lat(), sw.lng()));
	this.g.push(new google.maps.LatLng(ne.lat(), ne.lng()));
	this.g.push(new google.maps.LatLng(sw.lat(), ne.lng()));

	this.poly = new google.maps.Polygon({map: this.imap.map, path: this.g, strokeColor: "#FF0000", strokeOpacity: 1, strokeWeight: 2, fillOpacity: 0.1, fillColor: "#FF0000"});

	this.m = new Array();

	for(var i = 0; i < 4; i++) {
		var corner = "sw";
		if(i == 1) corner = "nw";
		if(i == 2) corner = "ne";
		if(i == 3) corner = "se";
		var icon = org.sarsoft.MapUtil.createImage(24, org.sarsoft.imgPrefix + "/icons/arr-" + corner + ".png");
		that.m[i] = new google.maps.Marker({icon: icon, position: that.g[i], map: this.imap.map, shape: icon.shape, draggable: true});
		
		google.maps.event.addListener(that.m[i], "drag", function(j) { return function() {that.update(j)}}(i));
		google.maps.event.addListener(that.m[i], "dragend", function(j) { return function() {that.update(j)}}(i));
	}
	
	var icon = org.sarsoft.MapUtil.createFlatCircleImage(12, "#FF0000");
	that.m[5] = new google.maps.Marker({icon: icon, position: new google.maps.LatLng((this.g[0].lat() + this.g[1].lat()) / 2, (this.g[1].lng() + this.g[2].lng()) / 2), map: this.imap.map, shape: icon.shape, draggable: true});

	google.maps.event.addListener(that.m[5], "drag", function() {that.update(5)});
	google.maps.event.addListener(that.m[5], "dragend", function() {that.update(5)});

}

org.sarsoft.AdjustableBox.prototype.remove = function() {
	if(this.poly != null) this.poly.setMap(null);
	for(var i = 0; i <= 5; i++) {
		if(this.m[i] != null) this.m[i].setMap(null);
	}
}

org.sarsoft.AdjustableBox.prototype.update = function(corner) {
	var p = this.m[corner].getPosition();
	if(corner < 4) this.g[corner] = p;
	if(corner == 0) {
		this.g[1] = new google.maps.LatLng(this.g[1].lat(), p.lng());
		this.g[3] = new google.maps.LatLng(p.lat(), this.g[3].lng());
	} else if(corner == 1) {
		this.g[0] = new google.maps.LatLng(this.g[0].lat(), p.lng());
		this.g[2] = new google.maps.LatLng(p.lat(), this.g[2].lng());
	} else if(corner == 2) {
		this.g[3] = new google.maps.LatLng(this.g[3].lat(), p.lng());
		this.g[1] = new google.maps.LatLng(p.lat(), this.g[1].lng());		
	} else if(corner == 3) {
		this.g[2] = new google.maps.LatLng(this.g[2].lat(), p.lng());
		this.g[0] = new google.maps.LatLng(p.lat(), this.g[0].lng());
	} else if(corner == 5) {
		var dlat = (this.g[1].lat() - this.g[0].lat()) / 2;
		var dlng = (this.g[2].lng() - this.g[1].lng()) / 2;
		this.g[0] = new google.maps.LatLng(p.lat() - dlat, p.lng() - dlng);
		this.g[1] = new google.maps.LatLng(p.lat() + dlat, p.lng() - dlng);
		this.g[2] = new google.maps.LatLng(p.lat() + dlat, p.lng() + dlng);
		this.g[3] = new google.maps.LatLng(p.lat() - dlat, p.lng() + dlng);
	}
	
	this.check(corner);	
	this.redraw();
}

org.sarsoft.AdjustableBox.prototype.redraw = function() {
	this.poly.setPath(this.g);
	for(var i = 0; i < 4; i++) {
		this.m[i].setPosition(this.g[i]);
	}
	this.m[5].setPosition(new google.maps.LatLng((this.g[0].lat() + this.g[1].lat()) / 2, (this.g[1].lng() + this.g[2].lng()) / 2));
	if(this.listener != null) this.listener();
}

org.sarsoft.AdjustablePrintBox = function(imap, sw, ne, aspect, scale) {
	org.sarsoft.AdjustableBox.call(this, imap, sw, ne);
	this.aspect = aspect;
	this.scale = scale;	
}

org.sarsoft.AdjustablePrintBox.prototype = new org.sarsoft.AdjustableBox();

org.sarsoft.AdjustablePrintBox.prototype.check = function(corner) {
	if(this.scale != null) {
		var scale = (google.maps.geometry.spherical.computeDistanceBetween(this.g[2], this.g[0]) * 39.3701) / Math.sqrt(this.in_h*this.in_h + this.in_w*this.in_w);
		if(corner == 1 || corner == 2) {
			var south = this.g[1].lat() - (this.g[1].lat() - this.g[0].lat())*(this.scale/scale);
			this.g[0] = new google.maps.LatLng(south, this.g[0].lng());
			this.g[3] = new google.maps.LatLng(south, this.g[3].lng());
		} else {
			var north = this.g[0].lat() + (this.g[1].lat() - this.g[0].lat())*(this.scale/scale);
			this.g[1] = new google.maps.LatLng(north, this.g[1].lng());
			this.g[2] = new google.maps.LatLng(north, this.g[2].lng());
		}
	}
	if(this.aspect != null) {
		var px_nw = this.imap.projection.fromLatLngToDivPixel(this.g[1]);
		var px_sw = this.imap.projection.fromLatLngToDivPixel(this.g[0]);
		var px_ne = this.imap.projection.fromLatLngToDivPixel(this.g[2]);
		var width = px_ne.x - px_nw.x;
		var height = px_sw.y - px_nw.y;
		if(width/height != this.aspect) {
			width = height * this.aspect;
			if((corner <= 1 && this.scale == null) || (corner >= 2 && this.scale != null)) {
				var west = this.imap.projection.fromDivPixelToLatLng(new google.maps.Point(px_ne.x - width, px_ne.y)).lng();
				this.g[0] = new google.maps.LatLng(this.g[0].lat(), west);
				this.g[1] = new google.maps.LatLng(this.g[1].lat(), west);
			} else {
				var east = this.imap.projection.fromDivPixelToLatLng(new google.maps.Point(px_nw.x + width, px_ne.y)).lng();
				this.g[2] = new google.maps.LatLng(this.g[2].lat(), east);
				this.g[3] = new google.maps.LatLng(this.g[3].lat(), east);
			}
			this.m[corner].setPosition(this.g[corner]);
		}
	}
}

org.sarsoft.AdjustableTileBox = function(imap, sw, ne, zoom, max) {
	org.sarsoft.AdjustableBox.call(this, imap, sw, ne);
	this.wm = new org.sarsoft.WebMercator();
	this.zoom = zoom;
	this.max = max;
}

org.sarsoft.AdjustableTileBox.prototype = new org.sarsoft.AdjustableBox();

org.sarsoft.AdjustableTileBox.prototype.check = function(corner) {
	// compute tile bounds based on zoom level
	var m_sw = this.wm.latLngToMeters(this.g[0].lat(), this.g[0].lng());
	var m_ne = this.wm.latLngToMeters(this.g[2].lat(), this.g[2].lng());
	var t_sw = this.wm.metersToDecimalTile(m_sw[0], m_sw[1], this.zoom);
	var t_ne = this.wm.metersToDecimalTile(m_ne[0], m_ne[1], this.zoom);
	var t_w = Math.round(t_ne[0] - t_sw[0]);
	var t_h = Math.round(t_ne[1] - t_sw[1]);

	t_sw = [Math.round(t_sw[0]), Math.round(t_sw[1])];
	if(corner == 5) {
		t_ne = [t_sw[0] + t_w, t_sw[1] + t_h];
	} else {
		t_ne = [Math.round(t_ne[0]), Math.round(t_ne[1])];
	}
	if(t_sw[0] == t_ne[0]) t_ne[0] = t_ne[0]+1;
	if(t_sw[1] == t_ne[1]) t_ne[1] = t_ne[1]+1;
	
	this.t_sw = t_sw;
	this.t_ne = t_ne;
		
	var area = (t_ne[0] - t_sw[0])*(t_ne[1] - t_sw[1]);
	this.area = area // TODO compensate for area
	
	if(corner == 0 || corner == 1 || corner == 5) {
		var w = this.wm.tileLatLngBounds(t_sw[0], t_sw[1], this.zoom)[1]; // miny, minx, maxy, maxx
		this.g[0] = new google.maps.LatLng(this.g[0].lat(), w);
		this.g[1] = new google.maps.LatLng(this.g[1].lat(), w);
	}
	if(corner == 1 || corner == 2 || corner == 5) {
		var n = this.wm.tileLatLngBounds(t_sw[0], t_ne[1], this.zoom)[0];
		this.g[1] = new google.maps.LatLng(n, this.g[1].lng());
		this.g[2] = new google.maps.LatLng(n, this.g[2].lng());
	}
	if(corner == 2 || corner == 3 || corner == 5) {
		var e = this.wm.tileLatLngBounds(t_ne[0], t_ne[1], this.zoom)[1];
		this.g[2] = new google.maps.LatLng(this.g[2].lat(), e);
		this.g[3] = new google.maps.LatLng(this.g[3].lat(), e);
	}
	if(corner == 3 || corner == 0 || corner == 5) {
		var s = this.wm.tileLatLngBounds(t_sw[0], t_sw[1], this.zoom)[0];
		this.g[3] = new google.maps.LatLng(s, this.g[3].lng());
		this.g[0] = new google.maps.LatLng(s, this.g[0].lng());
	}
}

org.sarsoft.MapObjectController = function(imap, types, background_load) {
	if(imap == null) return;
	var that = this;
	this.imap = imap;
	this.types = types;
	this.bgload = background_load;

	this.delconfirm = new org.sarsoft.view.MapDialog(imap, "Delete?", $('<div>Delete - Are You Sure?</div>'), "Delete", "Cancel", function() {
			that.dchandler();
			that.dchandler = null;
		});

	this.dao = [];
	this.objects = [];
	this.attrs = [];
	this.visible = [];

	this.dataNavigator = imap.registered["org.sarsoft.DataNavigator"]
	if(this.dataNavigator != null && !this.bgload) {
		this.dn = [];		
		this.tree = [];
	}
	for(var i = 0; i < this.types.length; i++) {
		var type = this.types[i];
		this.dao[i] = new type.dao(function () { that.imap.message("Server Communication Error"); });
		this.objects[i] = new Object();
		this.attrs[i] = new Object();
		this.visible[i] = true;
		if(this.dn != null) this.dn[i] = new Object();
		if(this.tree != null) this.buildTree(i);
	}
		
	for(var i = 0; i < this.types.length; i++) {
		var type = this.types[i];
		if(org.sarsoft.preload[type.name] != null) this.dao[i].rehydrate(org.sarsoft.preload[type.name]);
 		new function(idx) {
			that.dao[idx].loadAll(function(objects) {
				if(objects.length > 0 && that.tree != null) that.tree[idx].body.css('display', 'block');
				that.refresh(idx, objects);
				that.growmap(idx, objects);
			});
		}(i);
		this.dao[i].mark();
	}
}

org.sarsoft.MapObjectController.prototype.buildTree = function(i) {
	var that = this;
	var tree = this.tree[i] = this.dataNavigator.addDataType(this.types[i].label);
	tree.block.css({'display': 'none', 'margin-bottom': '10px'});
	tree.body.css('padding-top', '5px');
	this.dn[i].div = $('<div></div>').appendTo(tree.body);
	this.dn[i].lines = new Object();
	this.dn[i].cb = $('<input type="checkbox"' + (that.visible[i] ? ' checked="checked"' : '') + '/>').prependTo(tree.header).click(function(evt) {
		var val = that.dn[i].cb[0].checked;
		that.visible[i] = val;
		tree.body.css('display', val ? 'block' : 'none');
		tree.lock = !val;
		evt.stopPropagation();
		that.handleSetupChange(i);
	});
}

org.sarsoft.MapObjectController.prototype.buildAddButton = function(idx, text, handler) {
	var that = this;
	this.imap.dataNavigator.addNewOption(idx, "Add " + text, function() {
		var center = that.imap.map.getCenter();
		handler(that.imap.projection.fromLatLngToContainerPixel(center));
	});
}

org.sarsoft.MapObjectController.prototype.growmap = function(i, objects) {
	// override this stub
}

org.sarsoft.MapObjectController.prototype.dehydrate = function() {
	if(this.types.length == 1) return this.dao[0].dehydrate();
	var state = new Object();
	for(var i = 0; i < this.types.length; i++) {
		state[this.types[i].name] = this.dao[i].dehydrate();
	}
	return state;
}

org.sarsoft.MapObjectController.prototype.rehydrate = function(state) {
	if(this.types.length == 1 || state.length >= 0) {
		this.dao[0].rehydrate(state);
	} else {
		for(var i = 0; i < this.types.length; i++) {
			this.dao[i].rehydrate(state[this.types[i].name]);
		}
	}
}

org.sarsoft.MapObjectController.prototype.setAttr = function(i, object, key, value) {
	if(object == null) return null;
	if(typeof this.attrs[i][object.id] == "undefined") this.attrs[i][object.id] = new Object();
	this.attrs[i][object.id][key] = value;
}

org.sarsoft.MapObjectController.prototype.getAttr = function(i, object, key) {
	if(object == null || typeof this.attrs[i][object.id] == "undefined") return null;
	return this.attrs[i][object.id][key];
}

org.sarsoft.MapObjectController.prototype.timer = function() {
	var that = this;
	for(var i = 0; i < this.types.length; i++) {
		new function(idx) {
			this.dao[idx].loadSince(function(objects) {
				that.refresh(idx, objects);
			});
		}(i);
		this.dao[i].mark();
	}
}

org.sarsoft.MapObjectController.prototype.DNAdd = function(i, object) {
	var that = this;
	if(this.dn == null) return;
	
	if(this.dn[i].lines[object.id] == null) this.dn[i].lines[object.id] = $('<div class="dn-obj"></div>').appendTo(this.dn[i].div);
	this.dn[i].lines[object.id].html('<div class="dn-obj-left"></div><div class="dn-obj-right"></div>');
	
	var line = this.DNGetLine(i, object, 0);
	var fn = this.buildDN(i, object, line);
	line.click(function() {
		if(org.sarsoft.mobile) that.imap.dnToggle.hideDataNavigator();
		fn();
	});
}

org.sarsoft.MapObjectController.prototype.DNAddIcon = function(i, object, title, html, handler) {
	$('<span class="dn-obj-icon" title="' + title + '"></span>').html(html || '').appendTo(this.DNGetLine(i, object, 1)).click(handler);
}

org.sarsoft.MapObjectController.prototype.DNAddComments = function(i, object, comments) {
	var that = this;
	var line = that.DNGetLine(i, object, 0);
	$('<div class="dn-obj-comments"></div>').append(comments).appendTo(this.DNGetLine(i, object)).click(function() {
		line.click();
	}).hover(function() { line.css('text-decoration', 'underline') }, function() { line.css('text-decoration', '') });
}

org.sarsoft.MapObjectController.prototype.DNGetLine = function(i, object, child) {
	var line = this.dn[i].lines[object.id];
	return (child == null) ? line : $(line.children()[child]);
}

org.sarsoft.MapObjectController.prototype.buildDN = function(i, object) {
	// override this stub
}

org.sarsoft.MapObjectController.prototype.helpRemove = function(i, id) {
	this.setAttr(i, this.objects[i][id], "inedit", false);
	if(this.dn != null && this.dn[i].lines[id] != null) {
		this.dn[i].lines[id].remove();
		this.dn[i].lines[id] = null;
	}
	delete this.objects[i][id];
	this.checkForObjects(i);
}

org.sarsoft.MapObjectController.prototype.helpShow = function(i, object) {
	this.objects[i][object.id] = object;
	this.setAttr(i, object, "inedit", false);
	if(!this.visible[i]) return;
	this.DNAdd(i, object);
	this.checkForObjects(i);
}

org.sarsoft.MapObjectController.prototype.show = function(i, object) {
	// override this stub
	this.helpShow(i, object);
}

org.sarsoft.MapObjectController.prototype.del = function(handler) {
	this.dchandler = handler;
	this.delconfirm.show();
}

org.sarsoft.MapObjectController.prototype.refresh = function(i, objects) {
	var that = this;
	for(var j = 0; j < objects.length; j++) {
		if(!this.getAttr(i, objects[j], "inedit"))
			this.show(i, objects[j]);
	}
}

org.sarsoft.MapObjectController.prototype.handleSetupChange = function(i) {
	// override this stub
}

org.sarsoft.MapObjectController.prototype.checkForObjects = function(i) {
	var keys = Object.keys(this.objects[i]).length;
	this.tree[i].block.css('display', keys > 0 ? 'block' : 'none');
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
		that.reference.set("p1", new google.maps.Point(1*str[0], 1*str[1]));
		var str = that.form.l1.val().split(",");
		that.reference.set("ll1", new google.maps.LatLng(1*str[0], 1*str[1]));		
	});
	var line = jQuery('<td style="white-space: nowrap">=</td>').appendTo(jQuery('<tr><td style="white-space: nowrap">Reference 2:</td></tr>').appendTo(container));
	this.form.p2 = jQuery('<input type="text" size="10"/>').prependTo(line);
	this.form.l2 = jQuery('<input type="text" size="20"/>').appendTo(line);
	this.form.u2 = jQuery('<button>Update</button>').appendTo(line).click(function() {
		var str = that.form.p2.val().split(",");
		that.reference.set("p2", new google.maps.Point(1*str[0], 1*str[1]));
		var str = that.form.l2.val().split(",");
		that.reference.set("ll2", new google.maps.LatLng(1*str[0], 1*str[1]));		
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
	if(typeof baseURL == "undefined") baseURL = "/rest/georef";
	this.baseURL = baseURL;
	this.errorHandler = errorHandler;
	this.nextId = 0;
}

org.sarsoft.GeoRefDAO.prototype = new org.sarsoft.BaseDAO(true);

org.sarsoft.GeoRefDAO.prototype.offlineLoad = function(georef) {
	this.sanitize(georef);
	georef.id = this.objs.length;
	this.setObj(georef.id, georef);
}

org.sarsoft.DemShadingDlg = function(imap, handler) {
	var that = this;
	this.imap = imap;
	
	var div = $('<div></div>');
	this.name = $('<input type="text"/>').appendTo($('<div>Name:</div>').appendTo(div));
	this.ta = jQuery('<textarea style="width: 80%; height: 5em"></textarea>').appendTo(div);
	div.append('<div><a href="http://caltopo.blogspot.com/2013/02/custom-dem-shading.html" target="_new">documentation</a></div>');
	
	this.dlg = new org.sarsoft.view.MapDialog(imap, "Custom DEM Shading", div, "Save", "Cancel", function() {
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

org.sarsoft.ConfigurableLayerDAO = function(errorHandler, baseURL) {
	if(typeof baseURL == "undefined") baseURL = "/rest/cfglayer";
	this.baseURL = baseURL;
	this.errorHandler = errorHandler;
	this.nextId = 0;
}

org.sarsoft.ConfigurableLayerDAO.prototype = new org.sarsoft.BaseDAO(true);

org.sarsoft.ConfigurableLayerDAO.prototype.offlineLoad = function(cfg) {
	this.sanitize(cfg);
	cfg.id = this.objs.length;
	this.setObj(cfg.id, cfg);
}

org.sarsoft.controller.CustomLayerController = function(imap) {
	var that = this;
	org.sarsoft.MapObjectController.call(this, imap, [{name: "georefs", dao: org.sarsoft.GeoRefDAO, label: "Geospatial Images"}, {name: "cfglayers", dao: org.sarsoft.ConfigurableLayerDAO, label: "DEM Shading"}]);
	this.imap.register("org.sarsoft.controller.CustomLayerController", this);
	this.tree[1].block.insertBefore(this.tree[0].block);
	this.dn[0].cb.css('display', 'none');
	this.dn[1].cb.css('display', 'none');
	
	if(this.dataNavigator != null) {
		if(org.sarsoft.writeable) {
			this.buildAddButton(1, "DEM Shading", function(point) {
				that.demDlg.show(null, point);
			});
			this.buildAddButton(1, "Geospatial Image", function(point) {
				that.georefDlg.show(null, point);
			});
		}
	}
	
	this.georefDlg = new org.sarsoft.GeoRefImageDlg(imap, function(gr) {
		gr.id = that.georefDlg.id;
		that.georefDlg.id = null;
		if(gr.id == null) {
			that.dao[0].create(function(obj) {
				that.refreshLayers();
				that.show(0, obj);
			}, gr);
		} else {
			that.dao[0].save(gr.id, gr, function(obj) {
				that.refreshLayers();
				that.show(0, obj);
			});
		}		
	});
	
	this.demDlg = new org.sarsoft.DemShadingDlg(imap, function(dem) {
		dem.id = that.demDlg.id;
		that.demDlg.id = null;
		if(dem.id == null) {
			that.dao[1].create(function(obj) {
				that.refreshLayers();
				that.show(1, obj);
				that.addToMap(1, obj);
			}, dem);
		} else {
			that.dao[1].save(dem.id, dem, function(obj) {
				that.refreshLayers();
				that.addToMap(1, obj);
				that.show(1, obj);
			});
		}
	});
	
}

org.sarsoft.controller.CustomLayerController.prototype = new org.sarsoft.MapObjectController();

org.sarsoft.controller.CustomLayerController.prototype.refreshLayers = function() {
	org.sarsoft.EnhancedGMap.geoRefImages = this.dao[0].objs.filter(function(o) { return o != null });
	org.sarsoft.EnhancedGMap.configuredLayers = this.dao[1].objs.filter(function(o) { return o != null });
	var config = imap.getConfig();
	imap.map._overlaycontrol.resetMapTypes();
	imap.setConfig(config);
}

org.sarsoft.controller.CustomLayerController.prototype.rehydrate = function(state) {
	org.sarsoft.MapObjectController.prototype.rehydrate.call(this, state);
	if(this.dao[0].objs.length > 0 || this.dao[1].objs.length > 0) this.refreshLayers();
}


org.sarsoft.controller.CustomLayerController.prototype.removeFromMap = function(i, obj) {
	if(i == 1) {
		var config = imap.getConfig();
		if(config.alphas == null) return;
		if(config.alphas.indexOf(obj.alias) >= 0) {
			config.alphas.splice(config.alphas.indexOf(obj.alias), 1);
			imap.setConfig(config);
		}
	}
}

org.sarsoft.controller.CustomLayerController.prototype.addToMap = function(i, obj) {
	if(i == 1) {
		var config = imap.getConfig();
		if(config.alphas == null) config.alphas = [];
		if(config.alphas.indexOf(obj.alias) == -1) {
			config.alphas.push(obj.alias);
			imap.setConfig(config);
		}
	}
}

org.sarsoft.controller.CustomLayerController.prototype.show = function(i, obj) {
	this.helpShow(i, obj);
}

org.sarsoft.controller.CustomLayerController.prototype.buildDN = function(i, obj, line) {
	var that = this;

	line.append((obj.name || "").length == 0 ? '<span style="color: #CCCCCC">N/A</span>' : org.sarsoft.htmlescape(obj.name));
	if(i == 0) {
		line.prepend('<img src="' + obj.url + '"/>');
		if(org.sarsoft.writeable) {	
			this.DNAddIcon(i, obj, "Edit", '<img src="' + org.sarsoft.imgPrefix + '/edit.png"/>', function() {
				var config = that.imap.getConfig();
				if(config.overlay == "_gr" + obj.id) {
					config.overlay = null;
					config.opacity = 0;
					that.imap.setConfig(config);
				}
				that.georefDlg.show(obj);
				that.georefDlg.id = obj.id;
			});
			this.DNAddIcon(i, obj, "Delete", '<span style="font-weight: bold; color: red">-</span>', function() {
				that.del(function() { that.remove(i, obj.id); that.dao[0].del(obj.id); });
			});
		}

		return function() {
			var config = that.imap.getConfig();
			var alias = "_gr" + obj.id;
			if(config.layers.indexOf(alias) < 0) {
				config.layers.push(alias);
				config.opacity.push(1);
			} else {
				config.opacity[config.layers.indexOf(alias)] = 1;
			}
			that.imap.setConfig(config);
		}
	} else {
		if(org.sarsoft.writeable) {	
			this.DNAddIcon(i, obj, "Edit", '<img src="' + org.sarsoft.imgPrefix + '/edit.png"/>', function() {
				that.removeFromMap(i, obj);
				that.demDlg.show(obj);
				that.demDlg.id = obj.id;
			});
			this.DNAddIcon(i, obj, "Delete", '<span style="font-weight: bold; color: red">-</span>', function() {
				that.del(function() { that.removeFromMap(i, obj); that.remove(i, obj.id); that.dao[1].del(obj.id, function() { that.refreshLayers(); }); });
			});
		}
		
		return function() {
			var config = that.imap.getConfig();
			if(config.alphas == null) config.alphas = [];
			if(config.alphas.indexOf(obj.alias) < 0) {
				config.alphas.push(obj.alias);
			}
			that.imap.setConfig(config);
		}
	}
	
}

org.sarsoft.controller.CustomLayerController.prototype.remove = function(i, id) {
	this.helpRemove(i, id);
}

org.sarsoft.PrintBoxController = function(imap, div) {
	var that = this;
	this.imap = imap;
	this.div = div;
	this.boxes = [];
	this.lines = [];
	this.dd_orientations = [];

	imap.register("org.sarsoft.PrintBoxController", this);
	
	var line = jQuery('<div><span style="display: inline-block; min-width: 10ex">Page Size</span></div>').appendTo(div);
	this.dd_size = jQuery('<select><option value="8.5x11">8.5x11</option><option>13x19</option></select>').appendTo(line);
	this.dd_size.change(function() { that.updateBoxes() });
	
	var line = jQuery('<div><span style="display: inline-block; min-width: 10ex">Scale</span></div>').appendTo(div);
	this.dd_scale = jQuery('<select><option value="0">Not Fixed</option><option value="24000">1:24,000</option><option value="25000">1:25,000</option><option value="50000">1:50,000</option><option value="62500">1:62,500</option><option value="63360">1:63,360</option></selet>').appendTo(line).change(function() {
		that.updateBoxes();
	});
	
	var line = jQuery('<div style="margin-top: 1em"></div>').appendTo(div);
	this.dd_datum = jQuery('<select><option value="WGS84" selected="selected">WGS84</option><option value="NAD27">NAD27</option></select>').appendTo(jQuery('<div><span style="display: inline-block; min-width: 10ex">Datum</span></div>').appendTo(line));
	this.cb_utm = jQuery('<input type="checkbox"/>').prependTo(jQuery('<span>UTM Grid</span>').appendTo(jQuery('<div></div>').appendTo(line))).change(function() { that.updateBoxes(); });
	this.cb_dd = jQuery('<input type="checkbox"/>').prependTo(jQuery('<span>Lat/Long Grid</span>').appendTo(jQuery('<div></div>').appendTo(line))).change(function() { that.updateBoxes(); });

	var line = jQuery('<div style="padding-top: 1em"></div>').appendTo(div);
	this.list = jQuery('<tbody></tbody>').appendTo(jQuery('<table border="0" style="margin-bottom: 0.5em"><thead><tr><th style="font-weight: bold; text-align: left">Page</th><th style="font-weight: bold; text-align: left; padding-left: 2ex">Scale</th><th style="font-weight: bold; text-align: left; padding-left: 2ex">Orientation</th></tr></thead></table>').appendTo(line));
	var link_new = jQuery('<span style="color: green; cursor: pointer; font-size: 120%">+ Add Page</span>').appendTo(line).click(function() {
		that.addBox();
	});
	var link_redraw = jQuery('<span style="margin-left: 40px; color: red; cursor: pointer; font-size: 120%">X Start Over</span>').appendTo(line).click(function() {
		that.reset();
	});

}

org.sarsoft.PrintBoxController.prototype.reset = function() {
	for(var i = 0; i < this.boxes.length; i++) {
		this.boxes[i].remove();
	}
	this.list.empty();
	this.lines = [];
	this.boxes = [];
	
	this.addBox();
}

org.sarsoft.PrintBoxController.prototype.addBox = function(box) {
	var that = this;
	var idx = this.boxes.length;
	if(idx >= 15) {
		alert("Sorry, there is a 15 page limit for this service");
		return;
	}
	if(box == null) {
		var bounds = this.imap.map.getBounds();
		var y_off = (bounds.getNorthEast().lat() - bounds.getSouthWest().lat())/10;
		var x_off = (bounds.getNorthEast().lng() - bounds.getSouthWest().lng())/10;
		box = new org.sarsoft.AdjustablePrintBox(this.imap, new google.maps.LatLng(bounds.getSouthWest().lat() + y_off, bounds.getSouthWest().lng() + x_off), new google.maps.LatLng(bounds.getNorthEast().lat() - y_off, bounds.getNorthEast().lng() - x_off), 8.5/11);
	}

	this.lines[idx] = jQuery('<tr><td>' + (idx + 1) + '</td><td style="padding-left: 2ex"></td><td style="padding-left: 2ex"></td></tr>').appendTo(this.list);
	this.dd_orientations[idx] = jQuery('<select><option value="p">Portrait</option><option value="l">Landscape</option></select>').appendTo(this.lines[idx].children()[2]).val(box.aspect < 1 ? "p" : "l");
	this.dd_orientations[idx].change(function() { that.updateBoxes() });

	this.boxes.push(box);
	this.boxes[idx].listener = function() {
		var scale = google.maps.geometry.spherical.computeDistanceBetween(that.boxes[idx].g[0], that.boxes[idx].g[1]) / (that.boxes[idx].in_h*0.0254);
		$(that.lines[idx].children()[1]).html('1:' + Math.round(scale));
	}
	this.boxes[idx].m[5].set("title", "Page " + (idx+1));
	this.boxes[idx].redraw();
	this.updateBoxes();
}

org.sarsoft.PrintBoxController.prototype.updateBoxes = function() {
	var size = this.dd_size.val();
	var do_utm = (this.cb_utm.attr("checked")=="checked");
	var do_dd = (this.cb_dd.attr("checked")=="checked");
	var margin = 1;
	if(do_utm || do_dd) margin = 1.25;
	if(do_utm && do_dd) margin = 1.5;
	for(var i = 0; i < this.boxes.length; i++) {
		var adjbox = this.boxes[i];
		if(adjbox != null) {
			var landscape = ("l" == this.dd_orientations[i].val());
			var w = 1*(landscape ? size.split("x")[1] : size.split("x")[0]);
			var h = 1*(landscape ? size.split("x")[0] : size.split("x")[1]);
			adjbox.in_w = w - margin;
			adjbox.in_h = h - margin - 0.75;
			adjbox.in_p_w = w;
			adjbox.in_p_h = h;
			adjbox.aspect = adjbox.in_w/adjbox.in_h;
			var scale = this.dd_scale.val();
			if(scale > 0) {
				adjbox.scale = scale;
				adjbox.update(1);
			} else {
				adjbox.scale = null;
			}
			adjbox.update(2);
			adjbox.update(2); // need to call twice for proper scale and aspect after an orientation change
		}
	}
}

org.sarsoft.PrintBoxController.prototype.getURLState = function() {
	var state = {}
	state.size = this.dd_size.val();
	state.scale = this.dd_scale.val();
	state.grid_utm = (this.cb_utm.attr("checked")=="checked");
	state.grid_dd = (this.cb_dd.attr("checked")=="checked");
	state.datum = this.dd_datum.val();
	state.boxes = [];
	for(var i = 0; i < this.boxes.length; i++) {
		var adjbox = this.boxes[i];
		if(adjbox != null) {
			state.boxes.push({s: adjbox.g[0].lat(), w: adjbox.g[0].lng(), n: adjbox.g[2].lat(), e: adjbox.g[2].lng(), aspect: adjbox.aspect});
		}
	}
	return state;
}

org.sarsoft.PrintBoxController.prototype.setURLState = function(state) {
	var that = this;
	if(!imap.projection) {
		window.setTimeout(function() {
			that.setURLState(state);
		}, 500);
		return;
	}
	this.dd_size.val(state.size);
	this.dd_scale.val(state.scale);
	this.dd_datum.val(state.datum);
	this.cb_utm[0].checked = state.grid_utm;
	this.cb_dd[0].checked = state.grid_dd;
	
	for(var i = 0; i < this.boxes.length; i++) {
		this.boxes[i].remove();
	}
	this.list.empty();
	this.lines = [];
	this.boxes = [];
	
	for(var i = 0; i < state.boxes.length; i++) {
		var b = state.boxes[i];
		this.addBox(new org.sarsoft.AdjustablePrintBox(this.imap, new google.maps.LatLng(b.s, b.w), new google.maps.LatLng(b.n, b.e), b.aspect));
	}
	this.updateBoxes();
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

org.sarsoft.view.ProfileGraph = function() {
	this.height=120;
	this.div = jQuery('<div style="height: ' + (this.height+20) + 'px; position: relative"></div>');
	this.service = new google.maps.ElevationService();
}

org.sarsoft.view.ProfileGraph.prototype.profile = function(way, color, callback) {
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
	this.service.getElevationAlongPath({path: path, samples: 200}, function(result, status) {
		if(status == google.maps.ElevationStatus.OK) {
			if(callback != null) callback();
			that.draw(result, color);
		} else {
			alert("An error occurred while retrieving profile data from Google Maps: " + status);
		}
	});
}

org.sarsoft.view.ProfileGraph.prototype.draw = function(series, color) {
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
	var ele = jQuery('<span></span>').appendTo(jQuery('<div style="display: inline-block; min-width: 20ex"></div>').appendTo(jQuery('<div style="display: inline-block; padding-left: 1ex">cursor: </div>').appendTo(info)));
	
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
	
	var icon =org.sarsoft.MapUtil.createFlatCircleImage(12, color);
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

org.sarsoft.view.ProfileGraph.prototype.hide = function() {
	this.div.empty();
	if(this.marker != null) {
		this.marker.setMap(null);
		this.marker = null;
	}
}
