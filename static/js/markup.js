if(typeof org == "undefined") org = new Object();
if(typeof org.sarsoft == "undefined") org.sarsoft = new Object();
if(typeof org.sarsoft.view == "undefined") org.sarsoft.view = new Object();
if(typeof org.sarsoft.controller == "undefined") org.sarsoft.controller = new Object();

org.sarsoft.ShapeDAO = function(errorHandler, baseURL) {
	if(typeof baseURL == "undefined") baseURL = "/rest/shape";
	this.baseURL = baseURL;
	this.errorHandler = errorHandler;
}

org.sarsoft.ShapeDAO.prototype = new org.sarsoft.BaseDAO();

org.sarsoft.ShapeDAO.prototype.getWaypoints = function(handler, shape, precision) {
	this._doGet("/" + shape.id + "/way?precision=" + precision, handler);
}

org.sarsoft.ShapeDAO.prototype.saveWaypoints = function(shape, waypoints, handler) {
	this._doPost("/" + shape.id + "/way", (handler == null) ? function() {} : handler, waypoints);
}

org.sarsoft.MarkerDAO = function(errorHandler, baseURL) {
	if(typeof baseURL == "undefined") baseURL = "/rest/marker";
	this.baseURL = baseURL;
	this.errorHandler = errorHandler;
}

org.sarsoft.MarkerDAO.prototype = new org.sarsoft.BaseDAO();

org.sarsoft.MarkerDAO.prototype.updatePosition = function(id, position, handler) {
	this._doPost("/" + id + "/position", handler, {position: position}, handler);
}

org.sarsoft.view.MarkerForm = function() {
}

org.sarsoft.view.MarkerForm.prototype.create = function(container) {
	var that = this;
	var form = jQuery('<form name="EntityForm_' + org.sarsoft.view.EntityForm._idx++ + '" className="EntityForm"></form>').appendTo(container);
	var div = jQuery('<div class="item"><label for="label" style="width: 80px">Label:</label></div>').appendTo(form);
	this.labelInput = jQuery('<input name="label" type="text" size="15"/>').appendTo(div);
	
	div = jQuery('<div class="item"><label for="image" style="width: 80px">Image:</label>Currently:</div>').appendTo(form);
	this.imgSwatch = jQuery('<img style="width: 20px; height: 20px; padding-left: 5px; padding-right: 5px" valign="top"/>').appendTo(div);
	div.append('<span style="padding-left: 5px; padding-right: 5px">Show me</span>');
	this.imgDD = jQuery('<select><option value="circles">Circles</option><option value="activities">Activities</option><option value="symbols">Symbols</option><option value="npsactivities">NPS Activities</option><option value="npssymbols">NPS Symbols</option><option value="arrows">Arrows</option></select>').appendTo(div);

	this.imgDDonChange = function() {
		var val = that.imgDD.val();
		for(var key in that.icDivs) {
			if(key == val) {
				that.icDivs[key].css('display', 'block');
			} else {
				that.icDivs[key].css('display', 'none');
			}
		}
	}
	this.imgDD.change(this.imgDDonChange);

	var imageContainer = jQuery('<div style="padding-top: 5px"></div>').appendTo(form);
	this.images = {npsactivities : ["nps-ski","nps-xc","nps-skate","nps-climbing","nps-scramble","nps-caving","nps-diving","nps-canoe","nps-roadbike","nps-dirtbike","nps-4wd","nps-snowmobile","nps-camera"],
	        npssymbols : ["nps-parking","nps-lookout","nps-lighthouse","nps-info","nps-phone","nps-gas","nps-firstaid","nps-fire","nps-shower","nps-anchor","nps-rockfall","nps-slip","nps-shelter","nps-picnic","nps-water"],
	        arrows : ["arr-sw","arr-w","arr-nw","arr-n","arr-ne","arr-e","arr-se","arr-s"],
	        activities : ["skiing","xc","walking","snowshoe","climbing","spelunking","windsurf","snorkel","hunting","mountainbike","bike","motorbike","car","snowmobile","camera"],
	        symbols : ["cp","clue","warning","crossbones","antenna","avy1","binoculars","fire","flag","plus","rescue","tent","waterfall","wetland","harbor","rocks","shelter","picnic","drinkingwater"],
			circles : ["#FF0000", "#FF5500", "#FFAA00", "#FFFF00", "#0000FF", "#8800FF", "#FF00FF"]}
	this.icDivs = {};
	for(var key in this.images) {
		var ic2 = jQuery('<div></div>').appendTo(imageContainer);
		this.icDivs[key] = ic2;
		for(var i = 0; i < this.images[key].length; i++) {
			var url = this.images[key][i];
			if(url.indexOf("#") == 0) {
				var swatch = jQuery('<img style="width: 16px; height: 16px" src="/resource/imagery/icons/circle/' + url.substr(1) + '.png"></div>').appendTo(ic2);
				swatch.click(function() { var j = i; return function() {that.imageInput.val(that.images["circles"][j].substr(1)); that.imageInput.trigger('change');}}());
			} else {
				var swatch = jQuery('<img style="width: 20px; height: 20px" src="' + org.sarsoft.imgPrefix + '/icons/' + url + '.png"/>').appendTo(ic2);
				swatch.click(function() { var j = i; var l = key; return function() {
					that.imageInput.val(""); that.imageUrl = that.images[l][j]; that.handleChange();}}());
			}
		}
		if(key == "circles") {
			ic2.append('<span style="padding-left: 5px">or color code</span>');
			this.imageInput = jQuery('<input name="image" type="text" size="8" style="margin-left: 10px"/>').appendTo(ic2);
		}
	}
	
	this.imageInput.change(function() {
		that.imageUrl = "#" + that.imageInput.val();
		that.handleChange();
	});

	div = jQuery('<div class="item" style="padding-top: 10px">Comments <span class="hint" style="padding-left: 1ex">(not displayed on map)</span></div>').appendTo(form);
	this.comments = jQuery('<textarea rows="5" cols="50"></textarea>').appendTo(form);

	this.specsDiv = jQuery('<div class="item" style="padding-top: 10px"></div>').appendTo(form);
}


org.sarsoft.view.MarkerForm.prototype.handleChange = function() {
	var url = this.imageUrl;
	if(url == null) url = "";
	var size = "20px";
	var margin = "0px";
	if(url.indexOf('#') == 0) {
		size = "16px";
		margin = "4px";
		url = '/resource/imagery/icons/circle/' + url.substr(1) + '.png';
	} else if(url.indexOf('/') == -1 && url.indexOf('.') == -1) {
		url = org.sarsoft.imgPrefix + '/icons/' + url + '.png';
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
	if(this.imageUrl != null && this.imageUrl.indexOf("#")==0) {
		this.imgDD.val("circles");
		this.imgDDonChange();
		this.imageInput.val(obj.url.substr(1));
	} else {
		for(var key in this.images) {
			for(var i = 0; i < this.images[key].length; i++) {
				if(this.images[key][i] == this.imageUrl) {
					this.imgDD.val(key);
					this.imgDDonChange();
				}
			}
		}
		this.imageInput.val("");
	}
	this.comments.val(obj.comments);
	if(obj.updated != null) {
		this.specsDiv.html("Last updated on " + new Date(1*obj.updated).toDateString());
	} else {
		this.specsDiv.html("");
	}
	this.handleChange();
}

org.sarsoft.view.MarkerLocationForm = function() {
}

org.sarsoft.view.MarkerLocationForm.prototype.create = function(container, callback) {
	var that = this;
	var form = jQuery('<div></div>').appendTo(container);
	jQuery('<div><span style="font-weight: bold">Current Location</span></div>').appendTo(form);
	var div = jQuery('<div class="item"></div>').appendTo(form);
	this.currentSelect = jQuery('<select><option value="UTM">UTM</option><option value="DD">DD</option><option value="DDMMHH">DDMMHH</option></select>').appendTo(div);
	this.currentLocation = jQuery('<span style="margin-left: 10px"></span>').appendTo(div);
	
	jQuery('<div style="padding-top: 1em"><span style="font-weight: bold; padding-top: 1em">Enter New Location</span></div>').appendTo(form);
	var div = jQuery('<div class="item" style="clear: both"></div>').appendTo(form);

	this.locationEntryForm = new org.sarsoft.LocationEntryForm();
	this.locationEntryForm.create(div, callback, true);

	this.currentSelect.change(function() {
		that.updateCurrentLocation();
	});
}

org.sarsoft.view.MarkerLocationForm.prototype.updateCurrentLocation = function() {
	var type = this.currentSelect.val();
	var html = "";
	if(type == "UTM") {
		html = GeoUtil.GLatLngToUTM(this.value).toHTMLString();
	} else if(type == "DD") {
		html = GeoUtil.formatDD(this.value.lat()) + ", " + GeoUtil.formatDD(this.value.lng());
	} else if(type == "DDMMHH") {
		html = GeoUtil.formatDDMMHH(this.value.lat()) + ", " + GeoUtil.formatDDMMHH(this.value.lng());
	}
	this.currentLocation.html(html);
}

org.sarsoft.view.MarkerLocationForm.prototype.write = function(wpt) {
	this.value = new GLatLng(wpt.lat, wpt.lng);
	this.currentSelect.val("utm");
	this.updateCurrentLocation();
	this.locationEntryForm.clear();
}

org.sarsoft.view.MarkerLocationForm.prototype.read = function(callback) {
	return this.locationEntryForm.read(callback);
}

org.sarsoft.view.ShapeForm = function() {
}

org.sarsoft.view.ShapeForm.prototype.create = function(container) {
	var that = this;
	var form = jQuery('<form name="EntityForm_' + org.sarsoft.view.EntityForm._idx++ + '" className="EntityForm"></form>').appendTo(container);
	
	var div = jQuery('<div class="item"><label for="label" style="width: 80px">Label:</label></div>').appendTo(form);
	this.labelInput = jQuery('<input name="label" type="text" size="15"/>').appendTo(div);	

	div = jQuery('<div class="item" style="clear: both"><label for="color" style="width: 80px">Weight:</label></div>').appendTo(form);
	this.weightInput = jQuery('<select name="weight"><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option></select>').appendTo(div);

	this.fillDiv = jQuery('<div class="item"><label for="color" style="width: 80px">Fill:</label></div>').appendTo(form);
	this.fillInput = jQuery('<select name="fill"><option value="0">None</option><option value="10">10%</option>' + 
			'<option value="20">20%</option><option value="30">30%</option><option value="40">40%</option><option value="50">50%</option>' +
			'<option value="60">60%</option><option value="70">70%</option><option value="80">80%</option><option value="90">90%</option>' +
			'<option value="100">Solid</option>/select>').appendTo(this.fillDiv);

	div = jQuery('<div class="item"><label for="color" style="width: 80px">Color:</label></div>').appendTo(form);
	var colorSwatch = jQuery('<div style="width: 20px; height: 20px; float: left"></div>').appendTo(div);
	div.append('<span style="float: left; margin-left: 5px">Click below or color code:</span>');
	this.colorInput = jQuery('<input name="color" type="text" size="6" style="float: left; margin-left: 5px"/>').appendTo(div);
	this.colorInput.change(function() {colorSwatch.css('background-color', '#' + that.colorInput.val())});
	
	var colorContainer = jQuery('<div style="clear: both; margin-top: 5px"></div>').appendTo(form);
	var colors = ["#FFFFFF", "#C0C0C0", "#808080", "#000000", "#FF0000", "#800000", "#FF5500", "#FFAA00", "#FFFF00", "#808000", "#00FF00", "#008000", "#00FFFF", "#008080", "#0000FF", "#000080", "#FF00FF", "#800080"];
	for(var i = 0; i < colors.length; i++) {
		var swatch = jQuery('<div style="width: 20px; height: 20px; float: left; background-color: ' + colors[i] + '"></div>').appendTo(colorContainer);
		swatch.click(function() { var j = i; return function() {that.colorInput.val(colors[j].substr(1)); that.colorInput.trigger('change');}}());
	}	
	
	div = jQuery('<div class="item" style="padding-top: 5px; clear: both">Comments <span class="hint" style="padding-left: 1ex">(not displayed on map)</span></div>').appendTo(form);
	this.comments = jQuery('<textarea rows="5" cols="50"></textarea>').appendTo(form);

	this.specsDiv = jQuery('<div class="item" style="padding-top: 10px"></div>').appendTo(form);
}

org.sarsoft.view.ShapeForm.prototype.read = function() {
	return {label : this.labelInput.val(), color : "#" + this.colorInput.val(), fill: this.fillInput.val(), weight: this.weightInput.val(), comments: this.comments.val()};
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
		this.specsDiv.html("Size is " + obj.formattedSize + "<br/>" + "Last updated on " + new Date(1*obj.updated).toDateString());
	} else {
		this.specsDiv.html("");
	}
}

org.sarsoft.controller.MarkupMapController = function(imap, nestMenuItems, embedded) {
	var that = this;
	this.imap = imap;
	this.imap.register("org.sarsoft.controller.MarkupMapController", this);
	this.shapeDAO = new org.sarsoft.ShapeDAO(function () { that.imap.message("Server Communication Error"); });
	this.markerDAO = new org.sarsoft.MarkerDAO(function () { that.imap.message("Server Communication Error"); });
	this.markers = new Object();
	this.shapes = new Object();
	this._shapeAttrs = new Object();
	this.showMarkup = true;
	this.embedded = embedded;
	if(!embedded) {
		this.alertDlgDiv = document.createElement("div");
		this.alertDlg = org.sarsoft.view.AlertDialog("Comments", this.alertDlgDiv)
	
		var form = new org.sarsoft.view.MarkerForm();
		this.markerDlg = new org.sarsoft.view.EntityCreateDialog("Marker Details", form, function(marker) {
			if(that.markerDlg.marker != null) {
				marker.position = that.markerDlg.marker.position;
				that.markerDAO.save(that.markerDlg.marker.id, marker, function(obj) {
					that.refreshMarkers([obj]);
				});
			} else {
				var wpt = this.imap.map.fromContainerPixelToLatLng(new GPoint(that.markerDlg.point.x, that.markerDlg.point.y));
				marker.position = {lat: wpt.lat(), lng: wpt.lng()};
				that.markerDAO.create(function(obj) {
					that.refreshMarkers([obj]);
				}, marker);
			}}, "OK");
		form.labelInput.keydown(function(event) { if(event.keyCode == 13) that.markerDlg.dialog.ok();});

		this.markerLocationForm = new org.sarsoft.view.MarkerLocationForm();
		
		var lbody = document.createElement("div");
		var doit = function(gll) {
			that.markerDAO.updatePosition(that.markerLocationForm.id, {lat: gll.lat(), lng: gll.lng()}, function(obj) {
				that.refreshMarkers([obj]);
			});
		}
		this.markerLocationForm.create(lbody,  function(obj) {
			that.markerLocationDlg.hide();
			that.markerLocationForm.read(doit);
		});
		this.markerLocationDlg = org.sarsoft.view.CreateDialog("Marker Location", lbody, "OK", "Cancel", function() {
			if(that.markerLocationDlg.handler != null) {
				that.markerLocationDlg.handler();
			} else {
				that.markerLocationForm.read(doit);
			}
		},  {left: "100px", width: "450px"});

		form = new org.sarsoft.view.ShapeForm();
		this.shapeDlg = new org.sarsoft.view.EntityCreateDialog("Shape Details",form , function(shape) {
			if(that.shapeDlg.shape != null) {
				that.shapeDAO.save(that.shapeDlg.shape.id, shape, function(obj) {
					that.refreshShapes([obj]);
				});
			} else {
				shape.way = {polygon: that.shapeDlg.polygon};
				shape.way.waypoints = that.imap.getNewWaypoints(that.shapeDlg.point, that.shapeDlg.polygon);
				that.shapeDAO.create(function(obj) {
					that.refreshShapes([obj]);
					that.redrawShape(obj, function() { that.saveShape(obj); }, function() { that.removeShape(obj.id); that.shapeDAO.del(obj.id); });
				}, shape);
			}}, "OK");
		form.labelInput.keydown(function(event) { if(event.keyCode == 13) that.shapeDlg.dialog.ok();});
		
		var items = [{text : "New Marker", applicable : function(obj) { return obj == null }, handler: function(data) { that.markerDlg.marker=null; that.markerDlg.entityform.write({url: "#FF0000"});that.markerDlg.point=data.point; that.markerDlg.show(); }},
		    {text : "New Line", applicable : function(obj) { return obj == null }, handler: function(data) { that.shapeDlg.shape=null; that.shapeDlg.polygon=false; that.shapeDlg.entityform.write({create: true, weight: 2, color: "#FF0000", way : {polygon: false}, fill: 0});that.shapeDlg.point=data.point; that.shapeDlg.show(); }},
		    {text : "New Polygon", applicable : function(obj) { return obj == null }, handler: function(data) { that.shapeDlg.shape=null; that.shapeDlg.polygon=true; that.shapeDlg.entityform.write({create: true, weight: 2, color: "#FF0000", way : {polygon: true}, fill: 10});that.shapeDlg.point=data.point; that.shapeDlg.show(); }}];
	
		if(nestMenuItems) {
			items = [{text : "Markup \u2192", applicable : function(obj) { return obj == null }, items: items}];
		}
	
		if((org.sarsoft.userPermissionLevel == "WRITE" || org.sarsoft.userPermissionLevel == "ADMIN") && nestMenuItems != "none") {
			this.imap.addContextMenuItems(items.concat([
	    		{text : "Details", applicable : function(obj) { return obj != null && that.getMarkerIdFromWpt(obj) != null}, handler: function(data) { var marker = that.markers[that.getMarkerIdFromWpt(data.subject)]; that.markerDlg.marker=marker; that.markerDlg.entityform.write(marker); that.markerDlg.show();}},
	    		{text : "Move", applicable : function(obj) { return obj != null && that.getMarkerIdFromWpt(obj) != null}, handler: function(data) { var marker = that.markers[that.getMarkerIdFromWpt(data.subject)]; that.markerLocationForm.write(marker.position); that.markerLocationForm.id = marker.id; that.markerLocationDlg.show();}},
	    		{text : "Delete Marker", applicable : function(obj) { return obj != null && that.getMarkerIdFromWpt(obj) != null}, handler: function(data) { var id = that.getMarkerIdFromWpt(data.subject); that.removeMarker(id); that.markerDAO.del(id);}},
	    		{text : "Modify Points", applicable : function(obj) { var shape = that.shapes[that.getShapeIdFromWay(obj)]; return shape != null && !that.getShapeAttr(shape, "inedit"); }, handler : function(data) { that.editShape(that.shapes[that.getShapeIdFromWay(data.subject)]) }},
	    		{text : "Details", applicable : function(obj) { var id = that.getShapeIdFromWay(obj); return obj != null && id != null && !that.getShapeAttr(that.shapes[id], "inedit");}, handler: function(data) { var shape = that.shapes[that.getShapeIdFromWay(data.subject)]; that.shapeDlg.shape=shape; that.shapeDlg.entityform.write(shape); that.shapeDlg.show();}},
	    		{text : "Save Changes", applicable : function(obj) { var shape = that.shapes[that.getShapeIdFromWay(obj)]; return shape != null && that.getShapeAttr(shape, "inedit"); }, handler: function(data) { that.saveShape(that.shapes[that.getShapeIdFromWay(data.subject)]) }},
	    		{text : "Discard Changes", applicable : function(obj) { var shape = that.shapes[that.getShapeIdFromWay(obj)]; return shape != null && that.getShapeAttr(shape, "inedit"); }, handler: function(data) { that.discardShape(that.shapes[that.getShapeIdFromWay(data.subject)]) }},
	    		{text : "Delete Shape", applicable : function(obj) { var id = that.getShapeIdFromWay(obj); return obj != null && id != null && !that.getShapeAttr(that.shapes[id], "inedit");}, handler: function(data) { var id = that.getShapeIdFromWay(data.subject); that.removeShape(id); that.shapeDAO.del(id);}}
	     		]));
		} else if(nestMenuItems != "none") {
			this.imap.addContextMenuItems([
	            {text : "View Comments", applicable : function(obj) {if(obj == null) return false; var mrkid = that.getMarkerIdFromWpt(obj); if(mrkid == null) return false; var mrk = that.markers[mrkid]; return mrk.comments != null && mrk.comments.length > 0}, 
	            	handler: function(data) { var mrkid = that.getMarkerIdFromWpt(data.subject); var mrk=that.markers[mrkid]; $(that.alertDlgDiv).html(org.sarsoft.htmlescape(mrk.comments, true)); that.alertDlg.show()}},
	            {text : "View Comments", applicable : function(obj) {if(obj == null) return false; var shpid = that.getShapeIdFromWay(obj); if(shpid == null) return false; var shp = that.shapes[shpid]; return shp.comments != null && shp.comments.length > 0}, 
	            	handler: function(data) { var shpid = that.getShapeIdFromWay(data.subject); var shp=that.shapes[shpid]; $(that.alertDlgDiv).html(org.sarsoft.htmlescape(shp.comments, true)); that.alertDlg.show()}}
	            ]);
		}
	
		if((org.sarsoft.userPermissionLevel == "WRITE" || org.sarsoft.userPermissionLevel == "ADMIN") && nestMenuItems != "none") {
			this.newMarkup = new Object();

			var tPlus = jQuery('<span style="position: relative"></span>');
			var tps = jQuery('<span><img src="' + org.sarsoft.imgPrefix + '/new.png" style="vertical-align: middle; cursor: pointer" title="New Shape or Marker"/></span>').appendTo(tPlus);

			var tDiv = jQuery('<div style="visibility: hidden; background: white; position: absolute; right: 0; ' + ($.browser.msie ? 'top: 0.6em; ' : 'top: 0.5em; padding-top: 1em; z-index: -1; ') + 'width: 10em"></div>').appendTo(tPlus);

			GEvent.addDomListener(tps[0], "click", function() {
				if(tDiv.css("visibility")=="hidden") {
					tDiv.css("visibility","visible");
				} else {
					tDiv.css("visibility", "hidden");
				}
				});
			
			var links = jQuery('<div style="color: black; font-weight: normal; padding-top: 2px"></div>').appendTo(tDiv);
			var upArrow = jQuery('<span style="color: red; font-weight: bold; cursor: pointer; float: right; margin-right: 5px; font-size: larger">&uarr;</span>').appendTo(links);
			var newMarker = jQuery('<div style="margin-left: 2px; cursor: pointer">New Marker</div>').appendTo(links);
			var newLine = jQuery('<div style="margin-left: 2px; cursor: pointer">New Line</div>').appendTo(links);
			var newPolygon = jQuery('<div style="margin-left: 2px; cursor: pointer">New Polygon</div>').appendTo(links);
			
			upArrow.click(function() {tDiv.css("visibility", "hidden");});
			
			newMarker.click(function() {
				tDiv.css("visibility", "hidden");
				var center = that.imap.map.getCenter();
	    		that.markerLocationForm.write({lat: center.lat(), lng: center.lng()});
	    		that.markerLocationDlg.handler = function() {
	    			that.markerDlg.marker=null;
	    			that.markerLocationDlg.handler=null;
					if(!that.markerLocationForm.read(function(gll) {
		    			that.markerDlg.entityform.write({url: "#FF0000"});
		    			that.markerDlg.point=that.imap.map.fromLatLngToContainerPixel(gll);
		    			that.markerDlg.show();
					})) {
		    			that.markerDlg.entityform.write({url: "#FF0000"});
		    			that.markerDlg.point=that.imap.map.fromLatLngToContainerPixel(center);
		    			that.markerDlg.show();
					}
	    		}
	    		that.markerLocationDlg.show();
			});
			newLine.click(function() {
				tDiv.css("visibility", "hidden");
			    that.shapeDlg.shape=null;
			    that.shapeDlg.polygon=false;
			    that.shapeDlg.entityform.write({create: true, weight: 2, color: "#FF0000", way : {polygon: false}, fill: 0});
			    that.shapeDlg.point=new GPoint(Math.round(that.imap.map.getSize().width/2), Math.round(that.imap.map.getSize().height/2));
			    that.shapeDlg.show();
			});

			newPolygon.click(function() {
				tDiv.css("visibility", "hidden");
			    that.shapeDlg.shape=null;
			    that.shapeDlg.polygon=true;
			    that.shapeDlg.entityform.write({create: true, weight: 2, color: "#FF0000", way : {polygon: true}, fill: 10});
			    that.shapeDlg.point=new GPoint(Math.round(that.imap.map.getSize().width/2), Math.round(that.imap.map.getSize().height/2));
			    that.shapeDlg.show();
			});
			
			this.newMarkup.tDiv = tDiv;
			
			imap.addMenuItem(tPlus[0], 21);
		}
				
	}

	var showHide = new org.sarsoft.ToggleControl("MRK", "Show/Hide Markup", function(value) {
		that.showMarkup = value;
		that.handleSetupChange();
	});
	this.showHide = showHide;
	this.imap.addMenuItem(showHide.node, 19);

	if(!nestMenuItems && !embedded) {
		this.garmindlg = new org.sarsoft.GPSDlg();
		
		this.gps = new Object();
		this.gps.form = jQuery('<form name="gpsform" action="/map/gpxupload?tid=' + org.sarsoft.tenantid + '" enctype="multipart/form-data" method="post">I want to:</form>');
		this.gps.io = jQuery('<select style="margin-left: 15px"><option value="export">Export</option>' + ((org.sarsoft.userPermissionLevel != "READ") ? '<option value="import">Import</option>' : '') + '</select').appendTo(this.gps.form);
		this.gps.form.append("<br/><br/>");

		this.gps.exp = jQuery('<div></div>').appendTo(this.gps.form);
		var d1 = jQuery('<div></div>').appendTo(this.gps.exp);
		this.gps.exportAll = jQuery('<input type="radio" name="gpsexport" value="all" checked="yes">The entire map</input>').appendTo(d1);
		this.gps.shapeDiv = jQuery('<div></div>').appendTo(this.gps.exp);
		this.gps.exportShape = jQuery('<input type="radio" name="gpsexport" value="shape">A single shape:</input>').appendTo(this.gps.shapeDiv);
		this.gps.shape = jQuery('<select style="margin-left: 15px">').appendTo(this.gps.shapeDiv);

		this.gps.markerDiv = jQuery('<div></div>').appendTo(this.gps.exp);
		this.gps.exportMarker = jQuery('<input type="radio" name="gpsexport" value="marker">A single marker:</input>').appendTo(this.gps.markerDiv);
		this.gps.marker = jQuery('<select style="margin-left: 15px">').appendTo(this.gps.markerDiv);
		this.gps.exp.append("<br/>to:");
		this.gps.expFormat = jQuery('<select style="margin-left: 15px"><option value="GPX">GPX</option><option value="KML">KML</option><option value="GPS">Garmin GPS</option></select>').appendTo(this.gps.exp);
		
		this.gps.imp = jQuery('<div style="display: none"></div>').appendTo(this.gps.form);
		this.gps.imp.append("from:");
		this.gps.impFormat = jQuery('<select style="margin-left: 15px"><option value="GPX">GPX</option><option value="GPS">Garmin GPS</option></select>').appendTo(this.gps.imp);
		this.gps.imp.append('<br/>GPX File:<input type="hidden" name="format" value="gpx"/>');
		this.gps.impFile = jQuery('<input type="file" name="file" style="margin-left: 15px"/>').appendTo(this.gps.imp);
		
		this.gps.io.change(function() {
			var impexp = that.gps.io.val();
			if(impexp == "export") { that.gps.exp.css("display", "block"); that.gps.imp.css("display", "none"); }
			else { that.gps.exp.css("display", "none"); that.gps.imp.css("display", "block"); }
		});
		
		this.gps.impFormat.change(function() { that.gps.impFile.attr("disabled", that.gps.impFormat.val() != "GPX"); });

		var download = function(url, format) {
			if(format == "GPX" || format == "KML") {
				window.location = url + format;
			} else {
				url = url + "GPX";
				that.garmindlg.show(true, url, "");
			}
		}
		this.gps.dlg = new org.sarsoft.view.CreateDialog("Import / Export", this.gps.form[0], "GO", "Cancel", function() {
			var impexp = that.gps.io.val();
			if(impexp == "export") {
				var val = $("input[@name=gpsexport]:checked").val();
				var format = that.gps.expFormat.val();
				if(val == "all") {
					download(window.location+'&format=', format);
				} else if(val == "shape") {
					download("/rest/shape/" + that.gps.shape.val() + "?format=", format);
				} else if(val == "marker") {
					download("/rest/marker/" + that.gps.marker.val() + "?format=", format);
				}
			} else {
				var format = that.gps.impFormat.val();
				if(format == "GPS") {
					that.garmindlg.show(false, "/map/restgpxupload", "");
				} else if("" == that.gps.impFile.val()) {
					that.gps.dlg.show();
					alert("Please select a GPX file to import.");
				} else {
					that.gps.form.submit();
				}
			}
		});
		
		var icon = jQuery('<img src="' + org.sarsoft.imgPrefix + '/gps.png" style="cursor: pointer; vertical-align: middle" title="Export"/>')[0];
		GEvent.addDomListener(icon, "click", function() {
			that.gps.shape.empty();
			for(var key in that.shapes) {
				if(that.shapes[key].label != null && that.shapes[key].label.length > 0) that.gps.shape.append('<option value="' + that.shapes[key].id + '">' + org.sarsoft.htmlescape(that.shapes[key].label) + '</option>')
			}
			if(that.gps.shape.children().length == 0) {
				that.gps.shapeDiv.css("display", "none");
			} else {
				that.gps.shapeDiv.css("display", "block");
			}
			that.gps.marker.empty();
			for(var key in that.markers) {
				if(that.markers[key].label != null && that.markers[key].label.length > 0) that.gps.marker.append('<option value="' + that.markers[key].id + '">' + org.sarsoft.htmlescape(that.markers[key].label) + '</option>')
			}
			if(that.gps.marker.children().length == 0) {
				that.gps.markerDiv.css("display", "none");
			} else {
				that.gps.markerDiv.css("display", "block");
			}
			that.gps.dlg.show();
		});
		imap.addMenuItem(icon, 40);
	}

	this.markerDAO.loadAll(function(markers) {
		that.refreshMarkers(markers);
		for(var i = 0; i < markers.length; i++) {
			that.imap.growInitialMap(new GLatLng(markers[i].position.lat, markers[i].position.lng));
		}
	});		
	this.markerDAO.mark();

	this.shapeDAO.loadAll(function(shapes) {
		that.refreshShapes(shapes);
		for(var i = 0; i < shapes.length; i++) {
			var bb = shapes[i].way.boundingBox;
			that.imap.growInitialMap(new GLatLng(bb[0].lat, bb[0].lng));
			that.imap.growInitialMap(new GLatLng(bb[1].lat, bb[1].lng));
		}
	});
	this.shapeDAO.mark();	
}

org.sarsoft.controller.MarkupMapController.prototype.setShapeAttr = function(shape, key, value) {
	if(shape == null) return null;
	if(typeof this._shapeAttrs[shape.id] == "undefined") {
		this._shapeAttrs[shape.id] = new Object();
	}
	this._shapeAttrs[shape.id][key] = value;
}

org.sarsoft.controller.MarkupMapController.prototype.getShapeAttr = function(shape, key) {
	if(shape == null) return null;
	if(typeof this._shapeAttrs[shape.id] == "undefined") return null;
	return this._shapeAttrs[shape.id][key];
}


org.sarsoft.controller.MarkupMapController.prototype.saveShape = function(shape) {
	shape.way.waypoints = this.imap.save(shape.way.id);
	this.shapeDAO.saveWaypoints(shape, shape.way.waypoints, function(obj) { shape.way = obj});
	this.setShapeAttr(shape, "inedit", false);
}

org.sarsoft.controller.MarkupMapController.prototype.discardShape = function(shape) {
	this.imap.discard(shape.way.id);
	this.setShapeAttr(shape, "inedit", false);
}

org.sarsoft.controller.MarkupMapController.prototype.redrawShape = function(shape, onEnd, onCancel) {
	this.imap.redraw(shape.way.id, onEnd, onCancel);
	this.setShapeAttr(shape, "inedit", true);
}

org.sarsoft.controller.MarkupMapController.prototype.editShape = function(shape) {
	this.imap.edit(shape.way.id);
	this.setShapeAttr(shape, "inedit", true);
}

org.sarsoft.controller.MarkupMapController.prototype.removeMarker = function(id) {
	if(this.markers[id] != null) this.imap.removeWaypoint(this.markers[id].position);
	delete this.markers[id];
}

org.sarsoft.controller.MarkupMapController.prototype.removeShape = function(id) {
	this.setShapeAttr(this.shapes[id], "inedit", false);
	if(this.shapes[id] != null) this.imap.removeWay(this.shapes[id].way);
	delete this.shapes[id];
}

org.sarsoft.controller.MarkupMapController.prototype.setConfig = function(config) {
	if(config.MarkupMapController == null || config.MarkupMapController.showClues == null) return;
	this.showMarkup = config.MarkupMapController.showMarkup;
	this.handleSetupChange();
}

org.sarsoft.controller.MarkupMapController.prototype.getConfig = function(config) {
	if(config == null) config = new Object();
	if(config.MarkupMapController == null) config.MarkupMapController = new Object();
	config.MarkupMapController.showMarkup = this.showMarkup;
	return config;
}

org.sarsoft.controller.MarkupMapController.prototype.getMarkerIdFromWpt = function(wpt) {
	for(var key in this.markers) {
		if(this.markers[key] != null && this.markers[key].position == wpt) return key;
	}
}

org.sarsoft.controller.MarkupMapController.prototype.getShapeIdFromWay = function(way) {
	if(way == null) return null;
	for(var key in this.shapes) {
		if(this.shapes[key] != null && this.shapes[key].way.id == way.id) return key;
	}
}

org.sarsoft.controller.MarkupMapController.prototype.timer = function() {
	var that = this;
	this.markerDAO.loadSince(function(markers) {
		that.refreshMarkers(markers);
	});
	that.markerDAO.mark();
	this.shapeDAO.loadSince(function(shapes) {
		that.refreshShapes(shapes);
	});
	that.shapeDAO.mark();
}

org.sarsoft.controller.MarkupMapController.prototype.showMarker = function(marker) {
	if(this.markers[marker.id] != null) this.imap.removeWaypoint(this.markers[marker.id].position);
	if(marker.position == null) return;
	this.markers[marker.id] = marker;
	if(!this.showMarkup) return; // need lines above this in case the user re-enables clues

	var config = new Object();	
	var tooltip = org.sarsoft.htmlescape(marker.label);
	if(marker.comments != null && marker.comments.length > 0) tooltip = org.sarsoft.htmlescape(marker.comments);
	if(!this.embedded && ((org.sarsoft.userPermissionLevel == "WRITE" || org.sarsoft.userPermissionLevel == "ADMIN") || (marker.comments != null && marker.comments.length > 0))) config.clickable = true;
	
	if(marker.url == null || marker.url.length == 0) {
		config.color = "#FF0000";
	} else if(marker.url.indexOf('#') == 0) {
		config.color = marker.url;
	} else if(marker.url.indexOf('/') == -1 && marker.url.indexOf('.') == -1) {
		config.icon = org.sarsoft.MapUtil.createIcon(20, org.sarsoft.imgPrefix + "/icons/" + marker.url + ".png");
	} else {
		config.icon = org.sarsoft.MapUtil.createIcon(20, marker.url);
	}
	this.imap.addWaypoint(marker.position, config, tooltip, org.sarsoft.htmlescape(marker.label));
}

org.sarsoft.controller.MarkupMapController.getRealURLForMarker = function(url) {
	if(url == null || url.length == 0) {
		url  = "#FF0000";
	}
	if(url.indexOf('#') == 0) {
		url = url.substring(1);
		return "/resource/imagery/icons/circle/" + url + ".png"
	} else if(url.indexOf('/') == -1 && url.indexOf('.') == -1) {
		return org.sarsoft.imgPrefix + "/icons/" + url + ".png";
	} else {
		return url;
	}
}

org.sarsoft.controller.MarkupMapController.prototype.showShape = function(shape) {
	if(this.shapes[shape.id] != null) this.imap.removeWay(this.shapes[shape.id].way);
	if(shape.way == null) return;
	this.shapes[shape.id] = shape;
	shape.way.waypoints = shape.way.zoomAdjustedWaypoints;
	shape.way.displayMessage = org.sarsoft.htmlescape(shape.label) + " (" + shape.formattedSize + ")";
	if(!this.showMarkup) return; // need lines above this in case the user re-enables clues

	this.imap.addWay(shape.way, {clickable : (!this.embedded && ((org.sarsoft.userPermissionLevel == "WRITE" || org.sarsoft.userPermissionLevel == "ADMIN") || (shape.comments != null && shape.comments.length > 0))), fill: shape.fill, color: shape.color, weight: shape.weight}, org.sarsoft.htmlescape(shape.label));
}

org.sarsoft.controller.MarkupMapController.prototype.refreshMarkers = function(markers) {
	var that = this;

	var timestamp = this.markerDAO._timestamp;
	for(var i = 0; i < markers.length; i++) {
		this.showMarker(markers[i]);
	}
}

org.sarsoft.controller.MarkupMapController.prototype.refreshShapes = function(shapes) {
	var that = this;

	var timestamp = this.shapeDAO._timestamp;
	for(var i = 0; i < shapes.length; i++) {
		if(!this.getShapeAttr(shapes[i], "inedit"))
				this.showShape(shapes[i]);
	}
}

org.sarsoft.controller.MarkupMapController.prototype.handleSetupChange = function() {
	this.showHide.setValue(this.showMarkup);
	if(!this.showMarkup) {
		for(var key in this.markers) {
			this.imap.removeWaypoint(this.markers[key].position);
		}
		for(var key in this.shapes) {
			this.imap.removeWay(this.shapes[key].way);
		}
	} else {
		for(var key in this.markers) {
			this.showMarker(this.markers[key]);
		}
		for(var key in this.shapes) {
			this.showShape(this.shapes[key]);
		}
	}
}

org.sarsoft.controller.MarkupMapController.prototype.getFindBlock = function() {
	var that = this;
	var node = jQuery('<div></div>');
	var node1 = jQuery('<div>Marker:</div>').appendTo(node);
	var select1 = jQuery('<select><option value="--">--</option></select>').appendTo(node1);
	for(var id in this.markers) {
		var label = this.markers[id].label;
		if(label != null && label.length > 0) {
			jQuery('<option value="' + id + '">' + org.sarsoft.htmlescape(label) + '</option>').appendTo(select1);
		}
	}
	if(select1.children().length == 1) node1.css("display", "none");

	var node2 = jQuery('<div>Shape:</div>').appendTo(node);
	var select2 = jQuery('<select><option value="--">--</option></select>').appendTo(node2);
	for(var id in this.shapes) {
		var label = this.shapes[id].label;
		if(label != null && label.length > 0) {
			jQuery('<option value="' + id + '">' + org.sarsoft.htmlescape(label) + '</option>').appendTo(select2);
		}
	}
	if(select2.children().length == 1) node2.css("display", "none");

	this._findBlock = {order : 10, node : node[0], handler : function() {
		var id = select1.val();
		if(id != "--") {
			var wpt = that.markers[id].position;
			that.imap.map.setCenter(new GLatLng(wpt.lat, wpt.lng), 15);
			return true;
		}
		id = select2.val();
		if(id != "--") {
			var bb = that.shapes[id].way.boundingBox;
			that.imap.setBounds(new GLatLngBounds(new GLatLng(bb[0].lat, bb[0].lng), new GLatLng(bb[1].lat, bb[1].lng)));
			return true;
		}
		return false;
	}};

	return this._findBlock;
}

org.sarsoft.controller.MapToolsController = function(imap) {
	var that = this;
	this.imap = imap;
	this.imap.register("org.sarsoft.controller.MapToolsController", this);
	
	this.alertDiv = document.createElement("div");
	this.dlg = new org.sarsoft.view.AlertDialog("Measure", this.alertDiv);

	var items = [{text: "Measure \u2192", applicable: function(obj) { return obj == null }, items:
		[{text: "Distance", applicable : function(obj) { return obj == null }, handler: function(data) { that.measure(data.point, false);}},
		 {text: "Area", applicable : function(obj) { return obj == null }, handler: function(data) { that.measure(data.point, true);}}]
	}];
	
	this.imap.addContextMenuItems(items);
}
	
org.sarsoft.controller.MapToolsController.prototype.measure = function(point, polygon) {
	var that = this;
	var poly = (polygon) ? new GPolygon([], "#000000",2,1,"#000000",0.2) : new GPolyline([], "#000000", 2, 1);
	this.imap.lockContextMenu();
	this.imap.map.addOverlay(poly);
	poly.enableDrawing();
	poly.enableDrawing();
	
	this.fn = function(e) {
		if(e.which == 27) {
			$(document).unbind("keydown", that.fn);
			poly.disableEditing();
			GEvent.trigger(poly, "endline");
		}
	}
	$(document).bind("keydown", this.fn);

	GEvent.addListener(poly, "endline", function() {
		$(document).unbind("keydown", that.fn);
		that.imap.unlockContextMenu();
		if(polygon) {
			var area = poly.getArea();
			that.alertDiv.innerHTML = "Area is " + (Math.round(area/1000)/1000) + " sq km / " + (Math.round(area/1000*0.3861)/1000) + " sq mi";
		} else {
			var length = poly.getLength();
			that.alertDiv.innerHTML = "Distance is " + (Math.round(length)/1000) + " km / " + (Math.round(length*0.62137)/1000) + " mi";
		}
		that.imap.map.removeOverlay(poly);
		that.dlg.show();
	});
	GEvent.addListener(poly, "cancelline", function() {
		$(document).unbind("keydown", that.fn);
		that.imap.unlockContextMenu();
		that.imap.map.removeOverlay(poly);
	});
}
