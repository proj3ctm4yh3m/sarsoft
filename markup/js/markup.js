if(typeof org == "undefined") org = new Object();
if(typeof org.sarsoft == "undefined") org.sarsoft = new Object();
if(typeof org.sarsoft.view == "undefined") org.sarsoft.view = new Object();
if(typeof org.sarsoft.controller == "undefined") org.sarsoft.controller = new Object();

org.sarsoft.MarkerDAO = function(errorHandler, baseURL) {
	org.sarsoft.WaypointObjectDAO.call(this, "Marker");
	if(typeof baseURL == "undefined") baseURL = "/rest/marker";
	this.baseURL = baseURL;
	this.errorHandler = errorHandler;
	this.geo = true;
}

org.sarsoft.MarkerDAO.prototype = new org.sarsoft.WaypointObjectDAO;

org.sarsoft.view.MarkerForm = function() {
}

org.sarsoft.view.MarkerForm.prototype.create = function(container) {
	var that = this;
	var form = $('<form name="EntityForm_' + org.sarsoft.view.EntityForm._idx++ + '" className="EntityForm"><table style="border: 0"><tbody><tr></tr></tbody></table></form>').appendTo(container);
	var left = $('<td width="50%"></td>').appendTo(form.find('tr'));
	var right = $('<td width="50%"></td>').appendTo(form.find('tr'));
	
	this.labelInput = $('<input name="label" type="text" size="15"/>').appendTo($('<div class="item"><label for="label" style="width: 80px">Label:</label></div>').appendTo(left));

	var div = $('<div class="item" style="padding-top: 10px">Comments <span class="hint" style="padding-left: 1ex">(not displayed on map)</span></div>').appendTo(left);
	this.comments = $('<textarea rows="5" cols="50"></textarea>').appendTo(left);
	this.specsDiv = $('<div class="item" style="padding-top: 10px"></div>').appendTo(left);
	
	div = $('<div class="item" style="min-height: 20px; vertical-align: bottom">Image:</div>').appendTo(right);
	jQuery('<img style="width: 10px; height: 20px; visibility: hidden" src="' + $.img('blank.gif') + '"/>').appendTo(div);
	this.imgSwatch = jQuery('<img style="width: 20px; height: 20px; vertical-align: bottom"/>').appendTo(div);
	
	var div = $('<div></div>').appendTo(right);	
	div.append('Color Code or Custom URL: ');
	this.imageInput = $('<input type="text" size="20" style="margin-left: 10px"/>').appendTo(div).change(function() {
		that.imageUrl = that.imageInput.val();
		that.handleChange();
	});

	var imageContainer = jQuery('<div style="padding-top: 5px"></div>').appendTo(right);
	this.images = {
	        arrows : ["#FF0000", "#FF5500", "#FFAA00", "#FFFF00", "#0000FF", "#8800FF", "#FF00FF", "arr-sw","arr-w","arr-nw","arr-n","arr-ne","arr-e","arr-se","arr-s"],
			npsactivities : ["nps-ski","nps-xc","nps-skate","nps-climbing","nps-scramble","nps-caving","nps-diving","nps-canoe","nps-roadbike","nps-dirtbike","nps-4wd","nps-snowmobile","nps-camera"],
	        npssymbols : ["nps-parking","nps-lookout","nps-lighthouse","nps-info","nps-phone","nps-gas","nps-firstaid","nps-fire","nps-shower","nps-anchor","nps-rockfall","nps-slip","nps-shelter","nps-picnic","nps-water"],
	        activities : ["skiing","xc","walking","snowshoe","climbing","spelunking","windsurf","snorkel","hunting","mountainbike","bike","motorbike","car","snowmobile","camera","circle","target"],
	        symbols : ["cp","clue","warning","crossbones","antenna","avy1","binoculars","fire","flag","plus","rescue","tent","waterfall","wetland","harbor","rocks","shelter","picnic","drinkingwater"]}
	this.icDivs = {};
	
	// prioritize page loading
	window.setTimeout(function() {
		for(var key in that.images) {
			var ic2 = jQuery('<div></div>').appendTo(imageContainer);
			that.icDivs[key] = ic2;
			for(var i = 0; i < that.images[key].length; i++) {
				var url = that.images[key][i];
				if(url.indexOf("#") == 0) {
					var swatch = jQuery('<img style="cursor: pointer; width: 16px; height: 16px" src="/resource/imagery/icons/circle/' + url.substr(1) + '.png"></div>').appendTo(ic2);
					swatch.click(function() { var j = i; return function() {that.imageInput.val(that.images["arrows"][j]); that.imageInput.trigger('change');}}());
				} else {
					var icon = sarsoft.map.icons[url];
					if(icon && !google.maps._openlayers) {
						var swatch = $('<img src="' + $.img('blank.gif') + '" style="cursor: pointer; width: 20px; height: 20px; background-image: url(' + $.img('icons/sprite2.png') + '); background-position: -' + (icon.offset*20) + 'px 0px"></div>').appendTo(ic2);
					} else {
						var swatch = jQuery('<img style="cursor: pointer; width: 20px; height: 20px" src="' + $.img('icons/' + url + '.png') + '"/>').appendTo(ic2);
					}
					swatch.click(function() { var j = i; var l = key; return function() {
						that.imageInput.val(""); that.imageUrl = that.images[l][j]; that.handleChange();}}());
				}
			}
		}
	}, 1200);

}


org.sarsoft.view.MarkerForm.prototype.handleChange = function() {
	var url = this.imageUrl;
	if(url == null) url = "#FF0000";
	var size = "20px";
	var margin = "0px";
	if(url.indexOf('#') == 0) {
		size = "16px";
		margin = "4px";
		url = '/resource/imagery/icons/circle/' + url.substr(1) + '.png';
	} else if(url.indexOf('/') == -1 && url.indexOf('.') == -1) {
		url = $.img('/icons/' + url + '.png');
	}
	this.imgSwatch.css("width", size);
	this.imgSwatch.css("height", size);
	this.imgSwatch.css("margin-right", margin);
	this.imgSwatch.attr("src", url);
}

org.sarsoft.view.MarkerForm.prototype.read = function() {
	return {label : this.labelInput.val(), url: this.imageUrl, comments: this.comments.val()};
}

org.sarsoft.view.MarkerForm.prototype.write = function(obj) {
	this.labelInput.val(obj.label);
	this.imageUrl = obj.url;
	this.imageInput.val((this.imageUrl != null && (this.imageUrl.indexOf("#")==0 || this.imageUrl.indexOf("http")==0)) ? this.imageUrl : "");

	this.comments.val(obj.comments);
	if(obj.lastUpdated != null) {
		this.specsDiv.html("Last updated on " + new Date(1*obj.lastUpdated).toDateString());
	} else {
		this.specsDiv.html("");
	}
	this.handleChange();
}

org.sarsoft.controller.MarkerController = function(imap, background_load) {
	var that = this;
	org.sarsoft.WaypointObjectController.call(this, imap, {name: "Marker", dao : org.sarsoft.MarkerDAO, label: "Markers", geo: true, waypoint: "position"}, background_load);
	
	if(org.sarsoft.writeable && !background_load) {
		this.buildAddButton(0, "Marker", function(point) {
			that.dlg.show({url: "#FF0000"}, point);
		});
	}

	if(!org.sarsoft.iframe && !this.bgload) {
		this.dlg = new org.sarsoft.view.MapObjectEntityDialog(imap, "Marker Details",  new org.sarsoft.view.MarkerForm(), this);
		this.dlg.create = function(marker) {
			var wpt = that.imap.projection.fromContainerPixelToLatLng(new google.maps.Point(this.point.x, this.point.y));
			marker.position = {lat: wpt.lat(), lng: wpt.lng()};
			that.dao.create(marker);
		}

		var pc = function(obj) { return that._contextMenuCheck(obj) }
		
		if(org.sarsoft.writeable) {
			this.imap.addContextMenuItems([
			    {text : "New Marker", applicable : this.cm.a_none, handler: function(data) { that.dlg.show({url: "#FF0000"}, data.point); }},
	    		{text : "Details", precheck: pc, applicable : that.cm.a_noedit, handler: that.cm.h_details },
	    		{text : "Drag to New Location", precheck: pc, applicable : that.cm.a_noedit, handler: that.cm.h_drag},
	    		{text : "Delete Marker", precheck: pc, applicable : that.cm.a_noedit, handler:  that.cm.h_del}
	    		]);
		}
	}

}

org.sarsoft.controller.MarkerController.prototype = new org.sarsoft.WaypointObjectController();
sarsoft.Controllers["Marker"] = [5, org.sarsoft.controller.MarkerController];

org.sarsoft.controller.MarkerController.prototype._saveWaypoint = function(id, waypoint, handler) {
	this.dao.updatePosition(id, waypoint, handler);
}

org.sarsoft.controller.MarkerController.getRealURLForMarker = function(url) {
	if(url.url != null) url = url.url;
	if(url == null || url.length == 0) {
		url  = "#FF0000";
	}
	if(url.indexOf('#') == 0) {
		url = url.substring(1);
		return "/resource/imagery/icons/circle/" + url + ".png"
	} else if(url.indexOf('/') == -1 && url.indexOf('.') == -1) {
		return $.img('icons/' + url + ".png");
	} else {
		return url;
	}
}

org.sarsoft.controller.MarkerController.prototype.DNGetIcon = function(obj) {
	return $('<div><img src="' + org.sarsoft.controller.MarkerController.getRealURLForMarker(obj.url) + '"/></div>');
}

org.sarsoft.controller.MarkerController.prototype.show = function(object) {
	var that = this;
	this.imap.removeWaypoint(object.position);

	org.sarsoft.MapObjectController.prototype.show.call(this, object);

	this.DNAddLine(object);
	if((object.comments || "").length > 0) this.dn.addComments(object.id, object.comments);
	
	if(org.sarsoft.writeable) {
		this.DNAddEdit(object);
		this.DNAddDelete(object);
	}
	
	if(this.dn.visible) {
		var marker = object;
		var config = new Object();	
		var tooltip = org.sarsoft.htmlescape(marker.label);
		if(marker.comments != null && marker.comments.length > 0) tooltip = org.sarsoft.htmlescape(marker.comments);
		if(!org.sarsoft.iframe && (org.sarsoft.writeable || (marker.comments != null && marker.comments.length > 0))) config.clickable = true;
		
		if(marker.url == null || marker.url.length == 0) {
			config.color = "#FF0000";
		} else {
			config.icon = org.sarsoft.MapUtil.createIcon(marker.url);
		}
	
		this.imap.addWaypoint(marker.position, config, tooltip, org.sarsoft.htmlescape(marker.label));
	}
}

org.sarsoft.ShapeDAO = function(errorHandler, baseURL) {
	org.sarsoft.WayObjectDAO.call(this, "Shape", "/rest/shape", "way");
}

org.sarsoft.ShapeDAO.prototype = new org.sarsoft.WayObjectDAO();

org.sarsoft.ShapeDAO.prototype.validate = function(obj) {
	obj = org.sarsoft.WayObjectDAO.prototype.validate.call(this, obj);

	if(obj.lastUpdated == null) obj.lastUpdated = new Date().getTime();
	if(obj.way.boundingBox == null) this.addBoundingBox(obj.way);
	if(obj.formattedSize == null) {
		if(obj.way.polygon) {
			var area = google.maps.geometry.spherical.computeArea(GeoUtil.wpts2path(obj.way.waypoints))/1000000;
			obj.formattedSize = Math.round(area*100)/100 + " km&sup2; / " + (Math.round(area*38.61)/100) + "mi&sup2;";
		} else {
			var distance = google.maps.geometry.spherical.computeLength(GeoUtil.wpts2path(obj.way.waypoints))/1000;
			obj.formattedSize = Math.round(distance*100)/100 + " km / " + (Math.round(distance*62.137)/100) + " mi";
		}
	}
	return obj;
}

org.sarsoft.ShapeDAO.prototype.saveWaypoints = function(shape, waypoints, handler) {
	var that = this;
	this.saveWay(shape, waypoints, function(obj) {
		if(handler) handler(obj);
	});
}

org.sarsoft.view.ShapeForm = function() {
}

org.sarsoft.view.ShapeForm.prototype.create = function(container) {
	var that = this;
	var form = $('<form name="EntityForm_' + org.sarsoft.view.EntityForm._idx++ + '" className="EntityForm"><table style="border: 0"><tbody><tr></tr></tbody></table></form>').appendTo(container);
	var left = $('<td width="50%"></td>').appendTo(form.find('tr'));
	var right = $('<td width="50%"></td>').appendTo(form.find('tr'));
	
	this.labelInput = jQuery('<input name="label" type="text" size="15"/>').appendTo(jQuery('<div class="item"><label for="label" style="width: 80px">Label:</label></div>').appendTo(left));	

	var div = jQuery('<div class="item" style="clear: both"><label for="color" style="width: 80px">Weight:</label></div>').appendTo(left);
	this.weightInput = jQuery('<select name="weight"><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option></select>').appendTo(div);

	this.fillDiv = jQuery('<div class="item"><label for="color" style="width: 80px">Fill:</label></div>').appendTo(left);
	this.fillInput = jQuery('<select name="fill"><option value="0">None</option><option value="10">10%</option>' + 
			'<option value="20">20%</option><option value="30">30%</option><option value="40">40%</option><option value="50">50%</option>' +
			'<option value="60">60%</option><option value="70">70%</option><option value="80">80%</option><option value="90">90%</option>' +
			'<option value="100">Solid</option>/select>').appendTo(this.fillDiv);

	div = jQuery('<div class="item"><label for="color" style="width: 80px">Color:</label></div>').appendTo(left);
	var colorSwatch = jQuery('<div style="width: 20px; height: 20px; float: left"></div>').appendTo(div);
	div.append('<span style="float: left; margin-left: 5px">Click below or color code:</span>');
	this.colorInput = jQuery('<input name="color" type="text" size="6" style="float: left; margin-left: 5px"/>').appendTo(div);
	this.colorInput.change(function() {colorSwatch.css('background-color', '#' + that.colorInput.val())});
	
	var colorContainer = jQuery('<div style="clear: both; margin-top: 5px"></div>').appendTo(left);
	var colors = ["#FFFFFF", "#C0C0C0", "#808080", "#000000", "#FF0000", "#800000", "#FF5500", "#FFAA00", "#FFFF00", "#808000", "#00FF00", "#008000", "#00FFFF", "#008080", "#0000FF", "#000080", "#FF00FF", "#800080"];
	for(var i = 0; i < colors.length; i++) {
		var swatch = jQuery('<div style="width: 20px; height: 20px; float: left; background-color: ' + colors[i] + '"></div>').appendTo(colorContainer);
		swatch.click(function() { var j = i; return function() {that.colorInput.val(colors[j].substr(1)); that.colorInput.trigger('change');}}());
	}	
	
	div = jQuery('<div class="item" style="clear: both">Comments <span class="hint" style="padding-left: 1ex">(not displayed on map)</span></div>').appendTo(right);
	this.comments = jQuery('<textarea rows="5" cols="50"></textarea>').appendTo(right);

	this.specsDiv = jQuery('<div class="item" style="padding-top: 10px"></div>').appendTo(right);
}

org.sarsoft.view.ShapeForm.prototype.read = function() {
	return {label : this.labelInput.val(), color : "#" + this.colorInput.val(), fill: Number(this.fillInput.val()), weight: Number(this.weightInput.val()), comments: this.comments.val()};
}

org.sarsoft.view.ShapeForm.prototype.write = function(obj) {
	this.colorInput.val(obj.color != null ? obj.color.substr(1) : "");
	this.colorInput.trigger('change');
	this.fillInput.val(obj.fill);
	this.weightInput.val(obj.weight);
	this.labelInput.val(obj.label);
	this.comments.val(obj.comments);
	if(obj.way != null) this.fillDiv.css("display", (obj.way.polygon ? "block" : "none"));
	if(obj.formattedSize != null) {
		this.specsDiv.html("Size is " + obj.formattedSize + "<br/>" + "Last updated on " + new Date(1*obj.lastUpdated).toDateString());
	} else {
		this.specsDiv.html("");
	}
}

org.sarsoft.controller.ShapeController = function(imap, background_load) {
	var that = this;
	org.sarsoft.WayObjectController.call(this, imap, {name: "Shape", dao: org.sarsoft.ShapeDAO, label: "Shapes", geo: true, way: "way"}, background_load);	
	
	if(org.sarsoft.writeable && !background_load) {
		this.buildAddButton(0, "Line", function(point) {
			that.dlg.show({create: true, weight: 2, color: "#FF0000", way : {polygon: false}, fill: 0}, point);
		});

		this.buildAddButton(0, "Polygon", function(point) {
		    that.dlg.show({create: true, weight: 2, color: "#FF0000", way : {polygon: true}, fill: 10}, point);
		});
	}

	if(!org.sarsoft.iframe && !this.bgload) {
	
		this.dlg = new org.sarsoft.view.MapObjectEntityDialog(imap, "Shape Details", new org.sarsoft.view.ShapeForm(), this);
		
		this.dlg.create = function(shape) {
			shape.way = {polygon: this.object.way.polygon};
			shape.way.waypoints = that.imap.getNewWaypoints(this.point, this.object.way.polygon);
			that.dao.create(shape, function(obj) {
				that.redraw(obj, function() { that.save(obj, function() { that.show(obj);}); }, function() { that.dao.del(obj.id); });
			});
		}
		
		this.sizewarning = $('<div style="font-weight: bold; color: red; display: none"></div>').prependTo(this.dlg.body);
		this.dlg.dialog.dialog.hideEvent.subscribe(function() {
			that.sizewarning.css('display', 'none');
		});
		
		this.joinSelect = $('<select style="margin-left: 1ex"></select>');
		this.joinDlg = new org.sarsoft.view.MapDialog(imap, "Join Lines?", $('<div>Join with another named line:</div>').append(this.joinSelect), "Join", "Cancel", function() {
			var shape1 = that.joinDlg.object;
			var shape2 = that.dao.getObj([that.joinSelect.val()]);
			
			var w1 = shape1.way.waypoints;
			var w2 = that.obj(that.joinSelect.val()).way.waypoints;
			
			var d1 = google.maps.geometry.spherical.computeDistanceBetween(GeoUtil.wpt2gll(w1[0]), GeoUtil.wpt2gll(w2[0]));
			var d2 = google.maps.geometry.spherical.computeDistanceBetween(GeoUtil.wpt2gll(w1[0]), GeoUtil.wpt2gll(w2[w2.length-1]));
			var d3 = google.maps.geometry.spherical.computeDistanceBetween(GeoUtil.wpt2gll(w1[w1.length-1]), GeoUtil.wpt2gll(w2[w2.length-1]));
			var d4 = google.maps.geometry.spherical.computeDistanceBetween(GeoUtil.wpt2gll(w1[w1.length-1]), GeoUtil.wpt2gll(w2[0]));
			var dmin = Math.min(d1, d2, d3, d4);
			
			var waypoints = [];
			if(d1 == dmin) {
				waypoints = w1.slice(0, w1.length).reverse().concat(w2);
			} else if(d2 == dmin) {
				waypoints = w2.concat(w1);
			} else if(d3 == dmin) {
				waypoints = w1.concat(w2.slice(0, w2.length).reverse());
			} else {
				waypoints = w1.concat(w2);
			}
			
			shape1.way.waypoints = waypoints;
			that.dao.saveWaypoints(shape1, waypoints, function(obj) {
				shape1.way=obj;
				that.show(shape1);
				that.dao.del(shape2.id);
			});
		});
		this.joinDlg.show = function(shape) {
			that.joinDlg.object=shape;
			that.joinSelect.empty();
			for(var jid in that.dao.objs) {
				var join = that.dao.getObj(jid);
				if(!join.way.polygon && (join.label || "").length > 0 && join.id != shape.id) that.joinSelect.append('<option value="' + join.id + '">' + join.label + '</option>');
			}
			org.sarsoft.view.MapDialog.prototype.show.call(this);
		}
		
		var pc = function(obj) { return that._contextMenuCheck(obj) }
		var pc2 = function(obj) { return that._contextMenuCheck(obj) }

		if(org.sarsoft.writeable) {
			this.imap.addContextMenuItems([
				{text : "New Line", applicable : this.cm.a_none, handler: function(data) { that.dlg.show({create: true, weight: 2, color: "#FF0000", way : {polygon: false}, fill: 0}, data.point); }},
				{text : "New Polygon", applicable : this.cm.a_none, handler: function(data) { that.dlg.show({create: true, weight: 2, color: "#FF0000", way : {polygon: true}, fill: 10}, data.point); }},
	    		{text : "Details", precheck: pc, applicable : this.cm.a_noedit, handler: this.cm.h_details},
	    		{text : "Profile", precheck: pc, applicable : this.cm.a_noedit, handler: this.cm.h_profile},
	    		{text: "Modify \u2192", precheck: pc, applicable: that.cm.a_noedit, items:
	    			[{text : "Drag Vertices", precheck: pc2, applicable : function(obj) { return obj.obj.way.waypoints.length <= 500 }, handler : this.cm.h_drag },
		    		{text : "Split Here", precheck: pc2, applicable: function(obj) { return !obj.obj.way.polygon}, handler: function(data) { that.splitLineAt(data.pc.obj, that.imap.projection.fromContainerPixelToLatLng(data.point)); }},
		    		{text : "Join Lines", precheck: pc2, applicable: function(obj) { return !obj.obj.way.polygon}, handler: function(data) { that.joinDlg.show(data.pc.obj); }}]},
	    		{text : "Save Changes", precheck: pc, applicable : this.cm.a_editnodlg, handler: this.cm.h_save },
	    		{text : "Discard Changes", precheck: pc, applicable : this.cm.a_editnodlg, handler: this.cm.h_discard },
	    		{text : "Delete Shape", precheck: pc, applicable : this.cm.a_noedit, handler: this.cm.h_del }
	     		]);
		}
	}

}

org.sarsoft.controller.ShapeController.prototype = new org.sarsoft.WayObjectController();
sarsoft.Controllers["Shape"] = [10, org.sarsoft.controller.ShapeController];

org.sarsoft.controller.ShapeController.prototype._saveWay = function(obj, waypoints, handler) {
	this.dao.saveWaypoints(obj, waypoints, handler);
}

org.sarsoft.controller.ShapeController.prototype.splitLineAt = function(shape, gll) {
	shape = this.obj(shape);
	var that = this;
	var dmin = 10000000;
	for(var i = 0; i < shape.way.waypoints.length-1; i++) {
		var p1 = GeoUtil.wpt2gll(shape.way.waypoints[i]);
		var p2 = GeoUtil.wpt2gll(shape.way.waypoints[i+1]);
		
		var d1 = google.maps.geometry.spherical.computeDistanceBetween(gll, p1);
		var d2 = google.maps.geometry.spherical.computeDistanceBetween(gll, p2);
		
		var p3 = google.maps.geometry.spherical.interpolate(p1, p2, d1/(d1 + d2));
		var d3 = google.maps.geometry.spherical.computeDistanceBetween(gll, p3);
		
		if(d3 < dmin) {
			dmin = d3;
			pmin = p3;
			imin = i;
		}
	}
	
	var shape2 = { label: shape.label, color: shape.color, fill: shape.fill, weight: shape.weight, comments: shape.comments}
	shape2.way = { polygon: false, waypoints: shape.way.waypoints.slice(imin, shape.way.waypoints.length)};
	shape2.way.waypoints[0] = {lat: pmin.lat(), lng: pmin.lng()}
	shape.way.waypoints = shape.way.waypoints.slice(0,imin+1);
	shape.way.waypoints.push({lat: pmin.lat(), lng: pmin.lng()});
	this.dao.saveWaypoints(shape, shape.way.waypoints, function(obj) {
		shape.way=obj;
		that.show(shape);
		that.dao.create(shape2);
	});
}

org.sarsoft.controller.ShapeController.prototype.getConfig = function(shape) {
	return { color: shape.color, weight: shape.weight, fill: shape.fill }
}

org.sarsoft.controller.ShapeController.prototype.show = function(object) {
	var that = this;
	this.imap.removeWay(object.way);
	if(object.way == null) return;	
	
	org.sarsoft.MapObjectController.prototype.show.call(this, object);

	var line = this.DNAddLine(object);
	if((object.comments || "").length > 0) this.dn.addComments(object.id, object.comments);

	this.DNAddProfile(object);
	if(org.sarsoft.writeable) {
		this.dn.addIconEdit(object.id, function() {
			 if(object.way.waypoints.length <= 500) {
				 that.edit(object);
			 } else {
				 that.sizewarning.css('display', 'block').html('Vertex editing is not possible on shapes with more than 500 waypoints (this one has ' + object.way.waypoints.length + ').  Please split into multiple segments to edit vertices.');
			 }
			 that.dlg.show(object, null, true);
			 that.dlg.live = true;
		});
		this.DNAddDelete(object);
	}
	
	if(this.dn.visible) {
		this.imap.addWay(object.way, {displayMessage: org.sarsoft.htmlescape(object.label) + " (" + object.formattedSize + ")", clickable : (!org.sarsoft.iframe && (org.sarsoft.writeable || (object.comments != null && object.comments.length > 0))), fill: object.fill, color: object.color, weight: object.weight}, org.sarsoft.htmlescape(object.label));
	}
}

org.sarsoft.controller.MapToolsController = function(imap) {
	var that = this;
	this.imap = imap;
	this.imap.register("org.sarsoft.controller.MapToolsController", this);
	
	this.alertDiv = document.createElement("div");
	this.dlg = new org.sarsoft.view.AlertDialog("Measure", this.alertDiv);
	
	this.pg = new org.sarsoft.view.ProfileGraph();
	this.profileDlg = new org.sarsoft.view.MapDialog(imap, "Elevation Profile", this.pg.div, "OK", null, function() { that.pg.hide(); });
	
	this.pointinfo = jQuery('<div></div>');
	this.pointDlg = new org.sarsoft.view.MapDialog(imap, "Point Info", this.pointinfo, "OK", null, function() { that.pointinfo.empty(); });
	
	this.profileDlg.dialog.hideEvent.subscribe(function() { 
		that.pg.hide(); if(that.poly != null) { that.poly.setMap(null); that.poly = null; } 
		});	

	var items = [{text: "Measure \u2192", applicable: function(obj) { return obj == null }, items:
		[{text: "Distance", applicable : function(obj) { return obj == null }, handler: function(data) { that.measure(data.point, false);}},
		 {text: "Area", applicable : function(obj) { return obj == null }, handler: function(data) { that.measure(data.point, true);}},
		 {text: "Profile", applicable : function(obj) { return obj == null}, handler: function(data) { that.profile(data.point)}},
		 {text: "Take Bearing", applicable : function(obj) { return obj == null }, handler: function(data) { that.bearing(data.point);}},
		 {text: "Point Info", applicable : function(obj) { return obj == null}, handler: function(data) { that.pointdata(data.point)}}]
	}];
	
	this.imap.addContextMenuItems(items);
}

org.sarsoft.controller.MapToolsController.prototype._profileHandler = function(poly) {
	var that = this;
	if(this.poly != null) {
		this.profileDlg.hide();
	}
	this.poly = poly;
	google.maps.event.removeListener(this.complete);
	this.imap.unlockContextMenu();
	this.imap.drawingManager.setOptions({drawingMode: null});

	this.pg.profile(this.imap._getPath(poly).getArray(), "#000000", function() {
		that.profileDlg.show();
	});
}

org.sarsoft.controller.MapToolsController.prototype.profile = function() {
	var that = this;
	this.imap.lockContextMenu();
	
	this.imap.drawingManager.setOptions({polylineOptions: {strokeColor: "#000000", strokeOpacity: 1, strokeWeight: 1}});
	this.imap.drawingManager.setDrawingMode(google.maps.drawing.OverlayType.POLYLINE);
	
	this.complete = google.maps.event.addListener(this.imap.drawingManager, "polylinecomplete", function(poly) {
		google.maps.event.removeListener(that.complete);
		that.complete = null;
		window.setTimeout(function() { that._profileHandler(poly) }, 100);
	});
	
}

org.sarsoft.controller.MapToolsController.prototype.pointdata = function(point) {
	var that = this;
	var service = new org.sarsoft.DEMService();
	var gll = this.imap.projection.fromContainerPixelToLatLng(point);
	service.getElevationForLocations([gll], function(result, status) {
		if(status == google.maps.ElevationStatus.OK) {
			that.pointinfo.empty();
			that.pointinfo.append('<span>' + Math.round(result[0].location.lat()*10000)/10000 + ', ' + Math.round(result[0].location.lng()*10000)/10000 + ': Elevation <b>' + Math.round(result[0].elevation*3.2808399) + '</b>\' Slope <b>' + result[0].slope + '</b>\u00B0 Aspect <b>' + result[0].aspect + '</b>\u00B0</span>');
			that.pointDlg.show();
		} else {
			alert("An error occurred while retrieving profile data from CalTopo: " + status);
		}
	});
}

org.sarsoft.controller.MapToolsController.prototype.bearing = function(point) {
	var that = this;
	this.imap.lockContextMenu();
	
	this.imap.drawingManager.setOptions({polylineOptions: {strokeColor: "#000000", strokeOpacity: 1, strokeWeight: 1}});
	this.imap.drawingManager.setDrawingMode(google.maps.drawing.OverlayType.POLYLINE);
	
	var handler = function(poly) {
		google.maps.event.removeListener(that.complete);
		that.imap.unlockContextMenu();
		that.imap.drawingManager.setOptions({drawingMode: null});
		$(that.imap.map.getDiv()).unbind('click', that.bearingHandler);
		var path = that.imap._getPath(poly);
		poly.setMap(null);
		var message = (path.getLength() > 2 ? "Measurements reflect a single line and ignore all intermediate points<br/><br/>" : "");
		
		var heading = google.maps.geometry.spherical.computeHeading(path.getAt(0), path.getAt(path.getLength()-1));
		if(heading < 0) heading = 360 + heading;
		var magnetic = heading - GeoUtil.Declination.compute(path.getAt(0));
		if(magnetic > 360) magnetic = magnetic - 360;
		if(magnetic < 0) magnetic = 360 + magnetic;

		var distance = google.maps.geometry.spherical.computeDistanceBetween(path.getAt(0), path.getAt(path.getLength()-1));
		message += "Bearing " + Math.round(heading*10)/10 + "\u00B0 True " + Math.round(magnetic*10)/10 + "\u00B0 Magnetic<br/>";
		message += "Distance " + (Math.round(distance)/1000) + " km / " + (Math.round(distance*0.62137)/1000) + " mi";
		that.alertDiv.innerHTML = message;
		that.dlg.show();
	}
	
	if(this.bearingHandler == null) this.bearingHandler = function() {
		if(that.clickcheck == 0) {
			that.clickcheck = 1;
			return;
		}
		that.clickcheck = null;
		that.imap.drawingManager.setOptions({drawingMode: null});
	};
	this.clickcheck = 0;
	$(this.imap.map.getDiv()).bind('click', this.bearingHandler);

	this.complete = google.maps.event.addListener(this.imap.drawingManager, "polylinecomplete", function(poly) {
		window.setTimeout(function() { handler(poly) }, 100);
	});

}
	
org.sarsoft.controller.MapToolsController.prototype.measure = function(point, polygon) {
	var that = this;
	this.imap.lockContextMenu();

	this.imap.drawingManager.setOptions({polygonOptions: {strokeColor: "#000000", strokeOpacity: 1, strokeWeight: 2, fillColor: "#000000", fillOpacity: 0.2},
		polylineOptions: {strokeColor: "#000000", strokeOpacity: 1, strokeWeight: 1}});
	this.imap.drawingManager.setDrawingMode(polygon ? google.maps.drawing.OverlayType.POLYGON : google.maps.drawing.OverlayType.POLYLINE);
	
	var handler = function(poly) {
		google.maps.event.removeListener(that.complete);
		that.imap.unlockContextMenu();
		that.imap.drawingManager.setOptions({drawingMode: null});
		var path = that.imap._getPath(poly);
		poly.setMap(null);
		if(polygon) {
			var area = google.maps.geometry.spherical.computeArea(path);
			that.alertDiv.innerHTML = "Area is " + (Math.round(area/1000)/1000) + " sq km / " + (Math.round(area/1000*0.3861)/1000) + " sq mi";
		} else {
			var length = google.maps.geometry.spherical.computeLength(path);
			that.alertDiv.innerHTML = "Distance is " + (Math.round(length)/1000) + " km / " + (Math.round(length*0.62137)/1000) + " mi";
		}
		that.dlg.show();
	}

	this.complete = google.maps.event.addListener(this.imap.drawingManager, polygon ? "polygoncomplete" : "polylinecomplete", function(poly) {
		window.setTimeout(function() { handler(poly) }, 100);
	});

}
