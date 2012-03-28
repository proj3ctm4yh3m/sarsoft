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
	var row = jQuery('<tr></tr>').appendTo(jQuery('<tbody></tbody>').appendTo(jQuery('<table style="border: 0"></table>').appendTo(form)));
	var left = jQuery('<td width="50%"></td>').appendTo(form);
	var right = jQuery('<td width="50%"></td>').appendTo(form);
	var div = jQuery('<div class="item"><label for="label" style="width: 80px">Label:</label></div>').appendTo(left);
	this.labelInput = jQuery('<input name="label" type="text" size="15"/>').appendTo(div);
	
	div = jQuery('<div class="item"><label for="image" style="width: 80px">Image:</label>Currently:</div>').appendTo(left);
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

	var imageContainer = jQuery('<div style="padding-top: 5px"></div>').appendTo(left);
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

	div = jQuery('<div class="item" style="padding-top: 10px">Comments <span class="hint" style="padding-left: 1ex">(not displayed on map)</span></div>').appendTo(right);
	this.comments = jQuery('<textarea rows="5" cols="50"></textarea>').appendTo(right);

	this.specsDiv = jQuery('<div class="item" style="padding-top: 10px"></div>').appendTo(right);
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
	this.currentSelect = jQuery('<select><option value="UTM">UTM</option><option value="DD">DD</option><option value="DDMMHH">DMH</option><option value="DDMMSS">DMS</option></select>').appendTo(div);
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
	} else if(type == "DDMMSS") {
		html = GeoUtil.formatDDMMSS(this.value.lat()) + ", " + GeoUtil.formatDDMMSS(this.value.lng());
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
	var row = jQuery('<tr></tr>').appendTo(jQuery('<tbody></tbody>').appendTo(jQuery('<table style="border: 0"></table>').appendTo(form)));
	var left = jQuery('<td width="50%"></td>').appendTo(form);
	var right = jQuery('<td width="50%"></td>').appendTo(form);
	
	var div = jQuery('<div class="item"><label for="label" style="width: 80px">Label:</label></div>').appendTo(left);
	this.labelInput = jQuery('<input name="label" type="text" size="15"/>').appendTo(div);	

	div = jQuery('<div class="item" style="clear: both"><label for="color" style="width: 80px">Weight:</label></div>').appendTo(left);
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
	
	div = jQuery('<div class="item" style="padding-top: 5px; clear: both">Comments <span class="hint" style="padding-left: 1ex">(not displayed on map)</span></div>').appendTo(right);
	this.comments = jQuery('<textarea rows="5" cols="50"></textarea>').appendTo(right);

	this.specsDiv = jQuery('<div class="item" style="padding-top: 10px"></div>').appendTo(right);
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

org.sarsoft.view.MarkerIOPane = function(imap, controller) {
	var that = this;
	this.controller = controller;
	var dn = imap.registered["org.sarsoft.DataNavigator"];
	this.dn = new Object();
	var bn = jQuery('<div></div>');
	var pane = new org.sarsoft.view.MapRightPane(imap, bn);

	var imp = jQuery('<div></div>').appendTo(bn).append('<div style="font-size: 150%; font-weight: bold; margin-bottom: 1em">Import Data From</div>');

	var gpsin = jQuery('<div style="cursor: pointer"><div><img style="display: block; margin-right: auto; margin-left: auto;" src="' + org.sarsoft.imgPrefix + '/gps64.png"/></div><div style="font-size: 120%; color: #5a8ed7; font-weight: bold;">Garmin GPS</div></div>');
	gpsin.appendTo(jQuery('<div style="float: left; padding-right: 50px"></div>').appendTo(imp));
	gpsin.click(function() {
		that.gpsHeader.css('visibility', 'visible');
		that.comms.init(false, "/map/restgpxupload", "");
	});
	
	var gpxin = jQuery('<form name="gpsform" action="/map/gpxupload?tid=' + org.sarsoft.tenantid + '" enctype="multipart/form-data" method="post"><input type="hidden" name="format" value="gpx"/></form>');
	var gpxfile = jQuery('<input type="file" name="file" style="margin-top: 64px; margin-left: 10px"/>').appendTo(gpxin);
	var gpxicon = jQuery('<div style="cursor: pointer"><div><img style="display: block; margin-right: auto; margin-left: auto;" src="' + org.sarsoft.imgPrefix + '/gpx64.png"/></div><div style="font-size: 120%; color: #5a8ed7; font-weight: bold; text-align: center">GPX File</div></div>');
	jQuery('<div style="float: left"></div>').append(jQuery('<div style="float: left"></div').append(gpxicon)).append(jQuery('<div style="float: left"></div>').append(gpxin)).appendTo(imp);
	gpxicon.click(function() {
		if("" == gpxfile.val()) {
			alert("Please choose a GPX file to import.");
		} else {
			gpxin.submit();
		}
	});
	
	if(org.sarsoft.userPermissionLevel != "READ") {
		var exp = jQuery('<div style="clear: both; padding-top: 2em"></div>').appendTo(bn).append('<div style="font-size: 150%; font-weight: bold; margin-bottom: 1em">Export This Map To</div>');
		
		var gpsout = jQuery('<div style="cursor: pointer"><div><img style="display: block; margin-right: auto; margin-left: auto; width:" src="' + org.sarsoft.imgPrefix + '/gps64.png"/></div><div style="font-size: 120%; color: #5a8ed7; font-weight: bold;">Garmin GPS</div></div>').appendTo(jQuery('<div style="float: left; padding-right: 50px"></div>').appendTo(exp));
		gpsout.click(function() {
			that.gpsHeader.css('visibility', 'visible');
			var val = that.exportables._selected;
			var url = ""
			if(val == null) {
				url=window.location.href+'&format=GPX';
			} else if(val.url == null) {
				url="/rest/shape/" + val.id + "?format=GPX";
			} else {
				url="/rest/marker/" + val.id + "?format=GPX";
			}
			that.comms.init(true, url, "");
		});

		var gpxout = jQuery('<div style="cursor: pointer"><div><img style="display: block; margin-right: auto; margin-left: auto;" src="' + org.sarsoft.imgPrefix + '/gpx64.png"/></div><div style="font-size: 120%; color: #5a8ed7; font-weight: bold;">GPX File</div></div>');
		gpxout.appendTo(jQuery('<div style="float: left; padding-right: 50px"></div>').appendTo(exp));
		gpxout.click(function() {
			var val = that.exportables._selected;
			if(val == null) {
				window.location=window.location.href+'&format=GPX';
			} else if(val.url == null) {
				window.location="/rest/shape/" + val.id + "?format=GPX";
			} else {
				window.location="/rest/marker/" + val.id + "?format=GPX";
			}
		});

		var kmlout = jQuery('<div style="cursor: pointer"><div><img style="display: block; margin-right: auto; margin-left: auto;" src="' + org.sarsoft.imgPrefix + '/kml64.png"/></div><div style="font-size: 120%; color: #5a8ed7; font-weight: bold; text-align: center">Google Earth</div></div>').appendTo(jQuery('<div style="float: left; padding-right: 50px"></div>').appendTo(exp));
		kmlout.click(function() {
			var val = that.exportables._selected;
			if(val == null) {
				window.location=window.location.href+'&format=KML';
			} else if(val.url == null) {
				window.location="/rest/shape/" + val.id + "?format=KML";
			} else {
				window.location="/rest/marker/" + val.id + "?format=KML";
			}
		});

		this.exportables = jQuery('<div></div>').appendTo(exp);
	}
	
	this.gpsHeader = jQuery('<div style="visibility: hidden; clear: both; padding-top: 20px"><img src="' + org.sarsoft.imgPrefix + '/gps.png"/><b>GPS Console</b></div>').appendTo(bn);
	this.comms = new org.sarsoft.GPSComms(jQuery('<div></div>').appendTo(bn));

	jQuery('<button style="font-size: 150%; margin-top: 20px">Transfer Complete - Close Window</button>').appendTo(bn).click(function() { pane.hide(); });

	dn.defaults.io.click(function() {
		if(pane.visible()) {
			pane.hide();
		} else {
			that.refreshExportables();
			pane.show();
		}
	});
	
}

org.sarsoft.view.MarkerIOPane.prototype.refreshExportables = function() {
	var that = this;
	this.exportables.empty();
	this.exportables.append('<div style="clear: both; height: 2em"></div>');
	var header = jQuery('<div style="font-size: 120%; margin-bottom: 5px"></div>').appendTo(this.exportables);
	var expcb = jQuery('<input type="checkbox" style="vertical-align: text-top"/>').appendTo(header).change(function() {
		if(!expcb[0].checked) {
			that.exportables._selected = null;
			that.exportables.children().css('background-image', 'none');
		}
	});
	header.append('Limit export to a single object:');

	for(var key in this.controller.markers) {
		var marker = this.controller.markers[key];
		if(marker.label != null && marker.label.length > 0) {
			var m = jQuery('<div style="font-weight: bold; color: #945e3b; cursor: pointer; float: left; padding-left: 24px; margin-right: 10px; min-height: 24px; background-repeat: no-repeat no-repeat"><img style="vertical-align: middle" src="' + org.sarsoft.controller.MarkupMapController.getRealURLForMarker(marker.url) + '"/>' + org.sarsoft.htmlescape(marker.label) + '</div>').appendTo(this.exportables);
			var devnull = function(dom, obj) {
				dom.click(function() {
					expcb[0].checked = true;
					that.exportables._selected = obj;
					that.exportables.children().css('background-image', 'none');
					dom.css('background-image', 'url(' + org.sarsoft.imgPrefix + '/ok.png)');
				});
			}(m, marker);
		}
	}
	for(var key in this.controller.shapes) {
		var shape = this.controller.shapes[key];
		if(shape.label != null && shape.label.length > 0) {
			var s = jQuery('<div style="font-weight: bold; color: #945e3b; cursor: pointer; float: left; padding-left: 24px; margin-right: 10px; min-height: 24px; background-repeat: no-repeat no-repeat"></div>').append(org.sarsoft.controller.MarkupMapController.getIconForShape(shape)).append(org.sarsoft.htmlescape(shape.label)).appendTo(this.exportables);
			var devnull = function(dom, obj) {
				dom.click(function() {
					expcb[0].checked = true;
					that.exportables._selected = obj;
					that.exportables.children().css('background-image', 'none');
					dom.css('background-image', 'url(' + org.sarsoft.imgPrefix + '/ok.png)');
				});
			}(s, shape);
		}
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
	
	if(imap.registered["org.sarsoft.DataNavigator"] != null) {
		var dn = imap.registered["org.sarsoft.DataNavigator"];
		this.dn = new Object();
		var markerdiv = dn.addDataType("Markers");
		this.dn.markertoggle = jQuery('<span style="float: right; font-size: 50%; margin-top: 0.75em; cursor: pointer">(<span style="color: #5a8ed7">hide details</span>)</span>').appendTo(dn.titleblocks["Markers"]);
		this.dn.markertoggle._on = true;
		this.dn.markertoggle.click(function() {
			that.dn.markertoggle._on = !that.dn.markertoggle._on;
			if(that.dn.markertoggle._on) {
				that.dn.markertoggle.html('(<span style="color: #5a8ed7">hide details</span>)');
				$('.marker_desc_line_item').css('display', 'block');
			} else {
				that.dn.markertoggle.html('(<span style="color: #5a8ed7">show details</span>)');
				$('.marker_desc_line_item').css('display', 'none');
			}
		});
		this.dn.markerdiv = jQuery('<div></div>').appendTo(markerdiv);
		this.dn.markers = new Object();
		var shapediv = dn.addDataType("Shapes");
		this.dn.shapetoggle = jQuery('<span style="float: right; font-size: 50%; margin-top: 0.75em; cursor: pointer">(<span style="color: #5a8ed7">hide details</span>)</span>').appendTo(dn.titleblocks["Shapes"]);
		this.dn.shapetoggle._on = true;
		this.dn.shapetoggle.click(function() {
			that.dn.shapetoggle._on = !that.dn.shapetoggle._on;
			if(that.dn.shapetoggle._on) {
				that.dn.shapetoggle.html('(<span style="color: #5a8ed7">hide details</span>)');
				$('.shape_desc_line_item').css('display', 'block');
			} else {
				that.dn.shapetoggle.html('(<span style="color: #5a8ed7">show details</span>)');
				$('.shape_desc_line_item').css('display', 'none');
			}
		});
		this.dn.shapediv = jQuery('<div></div>').appendTo(shapediv);
		this.dn.shapes = new Object();

		if((org.sarsoft.userPermissionLevel == "WRITE" || org.sarsoft.userPermissionLevel == "ADMIN")) {
			jQuery('<span style="color: green; cursor: pointer">+ New Marker</span>').appendTo(jQuery('<div style="padding-top: 1em; font-size: 120%"></div>').appendTo(markerdiv)).click(function() {
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

			jQuery('<div style="float: left; padding-top: 1em; margin-right: 2em; cursor: pointer; color: green; font-size: 120%">+ New Line</div>').appendTo(shapediv).click(function() {
				dd.hide();
			    that.shapeDlg.shape=null;
			    that.shapeDlg.polygon=false;
			    that.shapeDlg.entityform.write({create: true, weight: 2, color: "#FF0000", way : {polygon: false}, fill: 0});
			    that.shapeDlg.point=new GPoint(Math.round(that.imap.map.getSize().width/2), Math.round(that.imap.map.getSize().height/2));
			    that.shapeDlg.show();
			});
			jQuery('<div style="float: left; padding-top: 1em; cursor: pointer; color: green; font-size: 120%">+ New Polygon</div>').appendTo(shapediv).click(function() {
				dd.hide();
			    that.shapeDlg.shape=null;
			    that.shapeDlg.polygon=true;
			    that.shapeDlg.entityform.write({create: true, weight: 2, color: "#FF0000", way : {polygon: true}, fill: 10});
			    that.shapeDlg.point=new GPoint(Math.round(that.imap.map.getSize().width/2), Math.round(that.imap.map.getSize().height/2));
			    that.shapeDlg.show();
			});
		}
	}

	if(!embedded) {
		this.alertDlgDiv = document.createElement("div");
		this.alertDlg = org.sarsoft.view.AlertDialog("Comments", this.alertDlgDiv)
	
		var form = new org.sarsoft.view.MarkerForm();
		this.markerDlg = new org.sarsoft.view.MapEntityDialog(imap, "Marker Details", form, function(marker) {
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
		this.markerLocationDlg = new org.sarsoft.view.MapDialog(imap, "Marker Location", lbody, "OK", "Cancel", function() {
			if(that.markerLocationDlg.handler != null) {
				that.markerLocationDlg.handler();
			} else {
				that.markerLocationForm.read(doit);
			}
		},  {left: "100px", width: "450px"});

		form = new org.sarsoft.view.ShapeForm();
		this.shapeDlg = new org.sarsoft.view.MapEntityDialog(imap, "Shape Details",form , function(shape) {
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
	
	}

	var showHide = new org.sarsoft.ToggleControl("MRK", "Show/Hide Markup", function(value) {
		that.showMarkup = value;
		that.handleSetupChange();
	});
	this.showHide = showHide;
	this.imap.addMenuItem(showHide.node, 19);

	if(!nestMenuItems && !embedded) {
		this.markerio = new org.sarsoft.view.MarkerIOPane(imap, this);
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
	if(this.dn.markerdiv != null && this.dn.markers[id] != null) {
		this.dn.markers[id].empty();
	}
	delete this.markers[id];
}

org.sarsoft.controller.MarkupMapController.prototype.removeShape = function(id) {
	this.setShapeAttr(this.shapes[id], "inedit", false);
	if(this.shapes[id] != null) this.imap.removeWay(this.shapes[id].way);
	if(this.dn.shapediv != null && this.dn.shapes[id] != null) {
		this.dn.shapes[id].empty();
	}
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

org.sarsoft.controller.MarkupMapController.prototype.DNAddMarker = function(marker) {
	var that = this;
	if(this.dn.markerdiv == null) return;

	if(this.dn.markers[marker.id] == null) {
		this.dn.markers[marker.id] = jQuery('<div></div>').appendTo(this.dn.markerdiv);
	}
	this.dn.markers[marker.id].empty();

	var line = jQuery('<div style="padding-top: 1em"></div>').appendTo(this.dn.markers[marker.id]);
	line.append('<img style="vertical-align: middle; padding-right: 0.5em" src="' + org.sarsoft.controller.MarkupMapController.getRealURLForMarker(marker.url) + '"/>');
	jQuery('<span style="cursor: pointer; font-weight: bold; color: #945e3b">' + org.sarsoft.htmlescape(marker.label) + '</span>').appendTo(line).click(function() {
		that.imap.map.setCenter(new GLatLng(marker.position.lat, marker.position.lng));
	});
	
	if((org.sarsoft.userPermissionLevel == "WRITE" || org.sarsoft.userPermissionLevel == "ADMIN")) {	
		jQuery('<span title="Delete" style="cursor: pointer; float: right; margin-right: 10px; font-weight: bold; color: red">-</span>').appendTo(line).click(function() {
			that.removeMarker(marker.id); that.markerDAO.del(marker.id);
		});
	}
	jQuery('<span title="Edit" style="cursor: pointer; float: right; margin-right: 5px;"><img src="' + org.sarsoft.imgPrefix + '/edit.png"/></span>').appendTo(line).click(function() {
		that.markerDlg.marker=marker; that.markerDlg.entityform.write(marker); that.markerDlg.show();
	});
	
	var line = jQuery('<div></div>').appendTo(this.dn.markers[marker.id]);
	if(marker.comments != null && marker.comments.length > 0) {
		line.append(jQuery('<div style="border-left: 1px solid #945e3b; padding-left: 1ex" class="marker_desc_line_item pre"></div>').append(marker.comments));
	}
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
	this.DNAddMarker(marker);
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

org.sarsoft.controller.MarkupMapController.getIconForShape = function(shape) {
	if(shape.way.polygon) {
		var div = jQuery('<div style="float: left; height: 0.6em; width: 1.5em; margin-right: 0.5em"></div>');
		div.css({"border-top": shape.weight + 'px solid ' + shape.color, "border-bottom": shape.weight + 'px solid ' + shape.color});
		jQuery('<div style="width: 100%; height: 100%"></div>').appendTo(div).css({"background-color": shape.color, filter: "alpha(opacity=" + shape.fill + ")", opacity : shape.fill/100});
		return div;
	} else {
		return jQuery('<div style="float: left; height: 0.5em; width: 1.5em; margin-right: 0.5em"></div>').css("border-bottom", shape.weight + "px solid " + shape.color);			
	}
}

org.sarsoft.controller.MarkupMapController.prototype.DNAddShape = function(shape) {
	var that = this;
	if(this.dn.shapediv == null) return;

	if(this.dn.shapes[shape.id] == null) {
		this.dn.shapes[shape.id] = jQuery('<div></div>').appendTo(this.dn.shapediv);
	}
	this.dn.shapes[shape.id].empty();
	
	if(shape.label == null || shape.label.length == 0) return;

	var line = jQuery('<div style="padding-top: 1em"></div>').appendTo(this.dn.shapes[shape.id]);
	line.append(org.sarsoft.controller.MarkupMapController.getIconForShape(shape));

	jQuery('<span style="cursor: pointer; font-weight: bold; color: #945e3b">' + org.sarsoft.htmlescape(shape.label) + '</span>').appendTo(line).click(function() {
		that.imap.setBounds(new GLatLngBounds(new GLatLng(shape.way.boundingBox[0].lat, shape.way.boundingBox[0].lng), new GLatLng(shape.way.boundingBox[1].lat, shape.way.boundingBox[1].lng)));
	});
	
	
	if((org.sarsoft.userPermissionLevel == "WRITE" || org.sarsoft.userPermissionLevel == "ADMIN")) {	
		jQuery('<span title="Delete" style="cursor: pointer; float: right; margin-right: 10px; font-weight: bold; color: red">-</span>').appendTo(line).click(function() {
			that.removeShape(shape.id); that.shapeDAO.del(shape.id);
		});
	}
	jQuery('<span title="Edit" style="cursor: pointer; float: right; margin-right: 5px;"><img src="' + org.sarsoft.imgPrefix + '/edit.png"/></span>').appendTo(line).click(function() {
		that.shapeDlg.shape=shape; that.shapeDlg.entityform.write(shape); that.shapeDlg.show();
		});
	
	var line = jQuery('<div></div>').appendTo(this.dn.shapes[shape.id]);
	if(shape.comments != null && shape.comments.length > 0) {
		jQuery('<div style="border-left: 1px solid #945e3b; padding-left: 1ex" class="shape_desc_line_item pre"></div>').append(shape.comments).appendTo(line);
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
	this.DNAddShape(shape);
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
