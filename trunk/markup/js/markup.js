if(typeof org == "undefined") org = new Object();
if(typeof org.sarsoft == "undefined") org.sarsoft = new Object();
if(typeof org.sarsoft.view == "undefined") org.sarsoft.view = new Object();
if(typeof org.sarsoft.controller == "undefined") org.sarsoft.controller = new Object();

org.sarsoft.ShapeDAO = function(errorHandler, baseURL) {
	if(typeof baseURL == "undefined") baseURL = "/rest/shape";
	this.baseURL = baseURL;
	this.errorHandler = errorHandler;
	this.nextId = 0;
}

org.sarsoft.ShapeDAO.prototype = new org.sarsoft.BaseDAO(true);

org.sarsoft.ShapeDAO.prototype.addBoundingBox = function(way) {
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

org.sarsoft.ShapeDAO.prototype.sanitize = function(obj) {
	obj.weight=1*obj.weight;
	obj.fill=1*obj.fill;
	if(this.offline && obj.way != null) {
		if(obj.way.id == null | obj.way.id == 0) {
			obj.way.id = this.nextId++;
		} else {
			this.nextId = Math.max(obj.way.id+1, this.nextId); 
		}
		if(obj.way.boundingBox == null) {
			this.addBoundingBox(obj.way);
		}
		if(obj.way.zoomAdjustedWaypoints == null) obj.way.zoomAdjustedWaypoints = obj.way.waypoints;
		if(obj.way.waypoints == null) obj.way.waypoints = obj.way.zoomAdjustedWaypoints;
	}
	return obj;
}

org.sarsoft.ShapeDAO.prototype.offlineLoad = function(shape) {
	this.sanitize(shape);
	shape.id = this.objs.length;
	this.setObj(shape.id, shape);
}

org.sarsoft.ShapeDAO.prototype.getWaypoints = function(handler, shape, precision) {
	if(this.offline) {
		handler(shape.way);
	} else {
		this._doGet("/" + shape.id + "/way?precision=" + precision, handler);
	}
}

org.sarsoft.ShapeDAO.prototype.saveWaypoints = function(shape, waypoints, handler) {
	var that = this;
	if(this.offline) {
		var way = this.getObj(shape.id).way;
		way.waypoints = waypoints;
		way.zoomAdjustedWaypoints = waypoints;
		this.addBoundingBox(way);
		if(handler != null) org.sarsoft.async(function() { handler(way) });
	} else {
		this._doPost("/" + shape.id + "/way", function(r) { that.getObj(shape.id).way = r; if(handler != null) handler(r);}, waypoints);
	}
}

org.sarsoft.MarkerDAO = function(errorHandler, baseURL) {
	if(typeof baseURL == "undefined") baseURL = "/rest/marker";
	this.baseURL = baseURL;
	this.errorHandler = errorHandler;
	this.nextId = 0;
}

org.sarsoft.MarkerDAO.prototype = new org.sarsoft.BaseDAO(true);

org.sarsoft.MarkerDAO.prototype.sanitize = function(obj) {
	if(this.offline && obj.position != null) {
		if(obj.position.id == null || obj.position.id == 0) {
			obj.position.id = this.nextId++;
		} else {
			this.nextId = Math.max(obj.position.id+1, this.nextId);
		}
	}
	return obj;
}

org.sarsoft.MarkerDAO.prototype.offlineLoad = function(marker) {
	this.sanitize(marker);
	marker.id = this.objs.length;
	this.setObj(marker.id, marker);
}

org.sarsoft.MarkerDAO.prototype.updatePosition = function(id, position, handler) {
	var that = this;
	if(this.offline) {
		var m = this.getObj(id);
		m.position.lat = position.lat;
		m.position.lng = position.lng;
		org.sarsoft.async(function() { handler(m) });
	} else {
		this._doPost("/" + id + "/position", function(r) { that.setObj(id, r); handler(r) }, {position: position});
	}
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
		
	div = jQuery('<div class="item" style="padding-top: 10px">Comments <span class="hint" style="padding-left: 1ex">(not displayed on map)</span></div>').appendTo(left);
	this.comments = jQuery('<textarea rows="5" cols="50"></textarea>').appendTo(left);

	this.specsDiv = jQuery('<div class="item" style="padding-top: 10px"></div>').appendTo(left);
	
	div = jQuery('<div class="item" style="min-height: 22px"><label for="image" style="width: 80px">Image:</label></div>').appendTo(right);
	this.imgSwatch = jQuery('<img style="width: 20px; height: 20px;" valign="top"/>').appendTo(div);
	jQuery('<img style="width: 20px; height: 20px; visibility: hidden" src="' + org.sarsoft.imgPrefix + '/blank.gif"/>').appendTo(div);

	var imageContainer = jQuery('<div style="padding-top: 5px"></div>').appendTo(right);
	this.images = {circles : ["#FF0000", "#FF5500", "#FFAA00", "#FFFF00", "#0000FF", "#8800FF", "#FF00FF"],
	        arrows : ["arr-sw","arr-w","arr-nw","arr-n","arr-ne","arr-e","arr-se","arr-s"],
			npsactivities : ["nps-ski","nps-xc","nps-skate","nps-climbing","nps-scramble","nps-caving","nps-diving","nps-canoe","nps-roadbike","nps-dirtbike","nps-4wd","nps-snowmobile","nps-camera"],
	        npssymbols : ["nps-parking","nps-lookout","nps-lighthouse","nps-info","nps-phone","nps-gas","nps-firstaid","nps-fire","nps-shower","nps-anchor","nps-rockfall","nps-slip","nps-shelter","nps-picnic","nps-water"],
	        activities : ["skiing","xc","walking","snowshoe","climbing","spelunking","windsurf","snorkel","hunting","mountainbike","bike","motorbike","car","snowmobile","camera"],
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
				that.imageInput = jQuery('<input name="image" type="text" size="8" style="margin-left: 10px"/>').appendTo(ic2);
			}
		}
		
		that.imageInput.change(function() {
			that.imageUrl = "#" + that.imageInput.val();
			that.handleChange();
		});
	}, 1200);

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
		this.imageInput.val(obj.url.substr(1));
	} else {
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
	this.value = new google.maps.LatLng(wpt.lat, wpt.lng);
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
	var right = jQuery('<td width="50%" style="padding-left: 20px"></td>').appendTo(form);
	
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
	
	div = jQuery('<div class="item" style="clear: both">Comments <span class="hint" style="padding-left: 1ex">(not displayed on map)</span></div>').appendTo(right);
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

org.sarsoft.view.MarkupIO = function(imap, controller) {
	var that = this;
	this.controller = controller;
	var dn = imap.registered["org.sarsoft.DataNavigator"];
	this.dn = new Object();
	var bn = jQuery('<div></div>');
	var pane = new org.sarsoft.view.MapRightPane(imap, bn);

	if(org.sarsoft.userPermissionLevel != "READ") {
		
		var imp = jQuery('<div><div style="font-weight: bold; margin-bottom: 10px">To import data, click on the file type you wish to import from:</div></div>');
		this.impDlg = new org.sarsoft.view.MapDialog(imap, "Import Data", imp, null, "Cancel", function() {
		});
		if(dn != null && dn.defaults.io.imp != null) dn.defaults.io.imp.click(function() { that.impcomms.clear(); that.refreshImportables(); that.impDlg.swap(); });
		
		var hastyHandler = function(data) {
			for(var i = 0; i < data.shapes.length; i++) {
				var shape = data.shapes[i];
				shape.id = null;
				shape.way.id = null;
				that.controller.shapeDAO.offlineLoad(shape);
				that.controller.show(1, shape);
			}
			for(var i = 0; i < data.markers.length; i++) {
				var marker = data.markers[i];
				marker.id = null;
				marker.position.id = null;
				that.controller.markerDAO.offlineLoad(marker);
				that.controller.show(0, marker);
			}
			that.impDlg.hide();
		}
	
		var gpsin = jQuery('<div style="cursor: pointer"><div><img style="display: block; margin-right: auto; margin-left: auto;" src="' + org.sarsoft.imgPrefix + '/gps64.png"/></div><div style="font-size: 120%; color: #5a8ed7; font-weight: bold;">Garmin GPS</div></div>');
		gpsin.appendTo(jQuery('<div style="display: inline-block; padding-right: 50px"></div>').appendTo(imp));
		gpsin.click(function() {
			that.impHeader.css('visibility', 'inherit');
			if(org.sarsoft.tenantid == null) {
				that.impcomms.init(false, "/hastyupload", "", hastyHandler);
			} else {
				that.impcomms.init(false, "/rest/gpxupload", "");
			}
		});
		
		this.gpxin = jQuery('<form name="gpsform" action="/map/gpxupload?tid=' + org.sarsoft.tenantid + '" enctype="multipart/form-data" method="post"><input type="hidden" name="format" value="gpx"/></form>');
		this.gpxfile = jQuery('<input type="file" name="file" style="margin-top: 40px; margin-left: 10px"/>').appendTo(this.gpxin);
		this.gpxval = jQuery('<div style="margin-left: 10px; margin-top: 5px"></div>').appendTo(this.gpxin);
		// TODO after cloning, this won't work
		this.gpxfile.change(function() {
			that.gpxval.html(that.gpxfile.val());
		})
		var gpxicon = jQuery('<div style="cursor: pointer"><div><img style="display: block; margin-right: auto; margin-left: auto;" src="' + org.sarsoft.imgPrefix + '/gpx64.png"/></div><div style="font-size: 120%; color: #5a8ed7; font-weight: bold; text-align: center">GPX File</div></div>');
		jQuery('<div style="display: inline-block"></div>').append(jQuery('<div style="float: left"></div').append(gpxicon)).append(jQuery('<div style="float: left"></div>').append(this.gpxin)).appendTo(imp);
		gpxicon.click(function() {
			if("" == that.gpxfile.val()) {
				alert("Please choose a GPX file to import.");
			} else {
				if(org.sarsoft.tenantid != null) {
					that.gpxin.submit();
				} else {
					if(that.bgframe == null)  {
						that.bgframe = jQuery('<iframe name="markupIOFrame" id="markupIOFrame" width="0px" height="0px" style="display: none"></iframe>').appendTo(document.body);
						that.bgform = jQuery('<form style="display: none" name="gpsform" action="/hastyupload" target="markupIOFrame" enctype="multipart/form-data" method="post"><input type="hidden" name="responseType" value="frame"/><input type="hidden" name="format" value="gpx"/></form>').appendTo(document.body);
					}
					jsonFrameCallback = hastyHandler;
					_bgframe = that.bgframe;
					that.gpxfile.appendTo(that.bgform);
					that.bgform.submit();
				}
			}
		});

		this.impHeader = jQuery('<div style="visibility: hidden; display: inline-block; vertical-align: top"><img src="' + org.sarsoft.imgPrefix + '/gps.png"/><b>GPS Console</b></div>').appendTo(imp);
		this.impcomms = new org.sarsoft.GPSComms(this.impHeader);

	} else {
		if(dn.defaults.io != null && dn.defaults.io.imp != null) dn.defaults.io.imp.css('display', 'none');
	}
	
	// TODO IE may require form to be in DOM
	this.exp = new Object();
	this.exp.form = jQuery('<form style="display: none" action="/hastymap" method="POST"></form>').appendTo(document.body);
	this.exp.format = jQuery('<input type="hidden" name="format"/>').appendTo(this.exp.form);
	this.exp.shapes = jQuery('<input type="hidden" name="shapes"/>').appendTo(this.exp.form);
	this.exp.markers = jQuery('<input type="hidden" name="markers"/>').appendTo(this.exp.form);

	var exp = jQuery('<div><div style="font-weight: bold; margin-bottom: 10px">To export data, click on the file type you wish to export to:</div></div>');
	this.expDlg = new org.sarsoft.view.MapDialog(imap, "Export Data", exp, null, "Export Complete", function() {
	});
	if(dn.defaults.io != null && dn.defaults.io.exp != null) dn.defaults.io.exp.click(function() { that.refreshExportables(); that.expcomms.clear(); that.expDlg.swap(); });

	var gpsout = jQuery('<div style="cursor: pointer"><div><img style="display: block; margin-right: auto; margin-left: auto; width:" src="' + org.sarsoft.imgPrefix + '/gps64.png"/></div><div style="font-size: 120%; color: #5a8ed7; font-weight: bold;">Garmin GPS</div></div>').appendTo(jQuery('<div style="display: inline-block; padding-right: 50px"></div>').appendTo(exp));
	gpsout.click(function() {
		that.expHeader.css('visibility', 'inherit');
		that.doexport("GPS");
	});

	var gpxout = jQuery('<div style="cursor: pointer"><div><img style="display: block; margin-right: auto; margin-left: auto;" src="' + org.sarsoft.imgPrefix + '/gpx64.png"/></div><div style="font-size: 120%; color: #5a8ed7; font-weight: bold;">GPX File</div></div>');
	gpxout.appendTo(jQuery('<div style="display: inline-block; padding-right: 50px"></div>').appendTo(exp));
	gpxout.click(function() {
		that.doexport("GPX");
	});

	var kmlout = jQuery('<div style="cursor: pointer"><div><img style="display: block; margin-right: auto; margin-left: auto;" src="' + org.sarsoft.imgPrefix + '/kml64.png"/></div><div style="font-size: 120%; color: #5a8ed7; font-weight: bold; text-align: center">Google Earth</div></div>').appendTo(jQuery('<div style="display: inline-block; padding-right: 50px"></div>').appendTo(exp));
	kmlout.click(function() {
		that.doexport("KML");
	});

	this.expHeader = jQuery('<div style="visibility: hidden; display: inline-block; vertical-align: top"><img src="' + org.sarsoft.imgPrefix + '/gps.png"/><b>GPS Console</b></div>').appendTo(exp);
	this.expcomms = new org.sarsoft.GPSComms(this.expHeader);
	this.exportables = jQuery('<div style="clear: both; width: 100%; padding-top: 10px"></div>').appendTo(exp);
}

org.sarsoft.view.MarkupIO.prototype.doexport = function(format) {
	var val = this.exportables._selected;

	var gps = false;
	if(format == "GPS") {
		gps = true;
		format = "GPX";
	}
	this.exp.format.val(format);

	var url = "";
	if(val == null) {
		url = window.location.href+"&format=" + format;
		this.exp.markers.val(YAHOO.lang.JSON.stringify(this.controller.dao[0].objs));
		this.exp.shapes.val(YAHOO.lang.JSON.stringify(this.controller.dao[1].objs));
	} else if(val.url == null) {
		url = "/rest/marker/" + val.id + "?format=" + format;
		this.exp.markers.val(YAHOO.lang.JSON.stringify([]));
		this.exp.shapes.val(YAHOO.lang.JSON.stringify([this.controller.objects[1][val.id]]));
	} else {
		url = "/rest/shape/" + val.id + "?format=" + format;
		this.exp.markers.val(YAHOO.lang.JSON.stringify([this.controller.objects[0][val.id]]));
		this.exp.shapes.val(YAHOO.lang.JSON.stringify([]));
	}
	
	if(org.sarsoft.tenantid != null) {
		if(gps) {
			this.expcomms.init(true, url, "");
		} else {
			window.location = url;
		}
	} else {
		if(gps) {
			this.expcomms.init(true, this.exp.form, "");
		} else {
			this.exp.form.submit();
		}
		
	}

}

org.sarsoft.view.MarkupIO.prototype.refreshImportables = function() {
	this.gpxfile.insertBefore(this.gpxval);
}

org.sarsoft.view.MarkupIO.prototype.refreshExportables = function() {
	var that = this;
	this.exportables.empty();
	var header = jQuery('<div style="font-size: 120%; margin-bottom: 5px"></div>').appendTo(this.exportables);
	var expcb = jQuery('<input type="checkbox" style="vertical-align: text-top"/>').appendTo(header).change(function() {
		if(!expcb[0].checked) {
			that.exportables._selected = null;
			that.exportables.children().css('background-image', 'none');
		}
	});
	header.append('Limit export to a single object:');

	for(var key in this.controller.objects[0]) {
		var marker = this.controller.objects[0][key];
		if(marker.label != null && marker.label.length > 0) {
			var m = jQuery('<div style="font-weight: bold; color: #945e3b; cursor: pointer; float: left; padding-left: 24px; margin-right: 10px; min-height: 24px; background-repeat: no-repeat no-repeat"><img style="vertical-align: middle; width: 16px; height: 16px" src="' + org.sarsoft.controller.MarkupMapController.getRealURLForMarker(marker.url) + '"/>' + org.sarsoft.htmlescape(marker.label) + '</div>').appendTo(this.exportables);
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
	for(var key in this.controller.objects[1]) {
		var shape = this.controller.objects[1][key];
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

org.sarsoft.widget.MarkupSaveAs = function(imap, container) {
	this.tree = new org.sarsoft.DNTree(container, '<img style="vertical-align: text-bottom; margin-right: 2px" src="' + org.sarsoft.imgPrefix + '/save.png"/>Save As');
	this.tree.header.css({'color': '#dc1d00'});
	this.tree.body.css({'display': 'none'});
	
	if(org.sarsoft.username != null) {
		var newform = jQuery('<form action="/map" method="post" id="savemapform">').appendTo(this.tree.body);
		var saveAsName = jQuery('<input type="text" name="name"/>').appendTo(newform);
			
		var newlat = jQuery('<input type="hidden" name="lat"/>').appendTo(newform);
		var newlng = jQuery('<input type="hidden" name="lng"/>').appendTo(newform);
		var mapcfg = jQuery('<input type="hidden" name="mapcfg"/>').appendTo(newform);
		var shapes = jQuery('<input type="hidden" name="shapes"/>').appendTo(newform);
		var markers = jQuery('<input type="hidden" name="markers"/>').appendTo(newform);
		var georefs = jQuery('<input type="hidden" name="georefs"/>').appendTo(newform);

		jQuery('<button>Save</button>').appendTo(this.tree.body).click(function(evt) {
			var name = saveAsName.val();
			if(name == null || name == "") {
				alert('Please enter a name for this map.');
				return;
			}
			shapes.val(YAHOO.lang.JSON.stringify(markupController.dao[1].objs));
			markers.val(YAHOO.lang.JSON.stringify(markupController.dao[0].objs));
			if(imap.registered["org.sarsoft.controller.CustomLayerController"] != null) georefs.val(YAHOO.lang.JSON.stringify(imap.registered["org.sarsoft.controller.CustomLayerController"].dao[0].objs));
			var center = imap.map.getCenter();
			newlat.val(center.lat());
			newlng.val(center.lng());
			var bcw = imap.registered["org.sarsoft.view.BaseConfigWidget"];
			var cfg = {}
			if(bcw != null) {
				cfg = bcw._toConfigObj();
			} else {
				cfg = imap.getConfig();
			}
			mapcfg.val(YAHOO.lang.JSON.stringify(cfg));
			newform.submit()
		});
	} else {
		this.tree.body.append('Sign to save this map.  We\'ll keep track of it while you\'re gone.')
		var login_yahoo = jQuery('<a href="#"><img style="border: none; vertical-align: middle" src="http://l.yimg.com/a/i/reg/openid/buttons/14.png"/></a>').appendTo(jQuery('<div style="padding-top: 5px"></div>').appendTo(this.tree.body));
		login_yahoo.click(function() {
			imap.registered["org.sarsoft.DataNavigator"].defaults.account.login('yahoo');			
		});
		var login_google = jQuery('<a href="#"><span style="font-weight: bold; color: #1F47B2">Sign in through G<span style="color:#C61800">o</span><span style="color:#BC2900">o</span>g<span style="color:#1BA221">l</span><span style="color:#C61800">e</span></span></a>').appendTo(jQuery('<div style="padding-top: 5px"></div>').appendTo(this.tree.body));
		login_google.click(function() {
			imap.registered["org.sarsoft.DataNavigator"].defaults.account.login('google');			
		});
	}
	
}


org.sarsoft.controller.MarkupMapController = function(imap) {
	var that = this;
	org.sarsoft.MapObjectController.call(this, imap, [{name: "markers", dao : org.sarsoft.MarkerDAO, label: "Markers"}, {name: "shapes", dao: org.sarsoft.ShapeDAO, label: "Shapes"}]);	
	this.imap.register("org.sarsoft.controller.MarkupMapController", this);
	
	if(this.dataNavigator != null) { // TODO make this work with non-markup objects like assignments
		if(org.sarsoft.tenantid == null) {
			this.saveAs = new org.sarsoft.widget.MarkupSaveAs(imap, this.dataNavigator.defaults.body);
			this.saveAs.tree.block.insertBefore(this.dataNavigator.defaults.layers.tree.block)
			this.saveAs.tree.block.css('display', 'none');
		}
		
		if(org.sarsoft.writeable) {
			this.buildAddButton(0, "+ New Marker", function(point) {
				that.markerDlg.show({url: "#FF0000"}, point);
			});
			
			this.buildAddButton(1, "+ New Line", function(point) {
				that.shapeDlg.show({create: true, weight: 2, color: "#FF0000", way : {polygon: false}, fill: 0}, point);
			}).css('margin-right', '2em');

			this.buildAddButton(1, "+ New Polygon", function(point) {
			    that.shapeDlg.show({create: true, weight: 2, color: "#FF0000", way : {polygon: true}, fill: 10}, point);
			});
		}
	}

	if(!org.sarsoft.iframe) {
		this.alertDlgDiv = document.createElement("div");
		this.alertDlg = org.sarsoft.view.AlertDialog("Comments", this.alertDlgDiv)
	
		var form = new org.sarsoft.view.MarkerForm();
		this.markerDlg = new org.sarsoft.view.MapObjectEntityDialog(imap, "Marker details", form);
		
		this.markerDlg.discardGeoInfo = function() { that.discardMarkerPosition(that.objects[0][this.object.id]); }
		this.markerDlg.saveGeoInfo = function(marker, callback) { that.saveMarkerPosition(this.object, callback); }
		this.markerDlg.saveData = function(marker) {
			marker.position = this.object.position;
			that.dao[0].save(this.object.id, marker, function(obj) { that.refresh(0, [obj]) });
		}
		this.markerDlg.create = function(marker) {
			var wpt = that.imap.projection.fromContainerPixelToLatLng(new google.maps.Point(this.point.x, this.point.y));
			marker.position = {lat: wpt.lat(), lng: wpt.lng()};
			that.dao[0].create(function(obj) { that.refresh(0, [obj])}, marker);
		}
		
		form = new org.sarsoft.view.ShapeForm();
		this.shapeDlg = new org.sarsoft.view.MapObjectEntityDialog(imap, "Shape Details", form);
		
		this.shapeDlg.discardGeoInfo = function() { that.discardShape(that.objects[1][this.object.id]); }
		this.shapeDlg.saveGeoInfo = function(shape, callback) { that.saveShape(that.objects[1][this.object.id], callback); }
		this.shapeDlg.saveData = function(shape) {
			that.dao[1].save(this.object.id, shape, function(obj) { that.refresh(1, [obj]); });
		}
		this.shapeDlg.create = function(shape) {
			shape.way = {polygon: this.object.way.polygon};
			shape.way.waypoints = that.imap.getNewWaypoints(this.point, this.object.way.polygon);
			that.dao[1].create(function(obj) {
				that.refresh(1, [obj]);
				that.redrawShape(obj, function() { that.saveShape(obj, function() { that.refresh(1, [obj]);}); }, function() { that.removeShape(obj.id); that.dao[1].del(obj.id); });
			}, shape);
		}
		
		this.pg = new org.sarsoft.view.ProfileGraph();
		this.profileDlg = new org.sarsoft.view.MapDialog(imap, "Elevation Profile", this.pg.div, "OK", null, function() { that.pg.hide(); });
		this.profileDlg.dialog.hideEvent.subscribe(function() { that.pg.hide(); });
		
		var items = [{text : "New Marker", applicable : function(obj) { return obj == null && that.visible[0]}, handler: function(data) { that.markerDlg.show({url: "#FF0000"}, data.point); }},
		    {text : "New Line", applicable : function(obj) { return obj == null && that.visible[1]}, handler: function(data) { that.shapeDlg.show({create: true, weight: 2, color: "#FF0000", way : {polygon: false}, fill: 0}, data.point); }},
		    {text : "New Polygon", applicable : function(obj) { return obj == null && that.visible[1]}, handler: function(data) { that.shapeDlg.show({create: true, weight: 2, color: "#FF0000", way : {polygon: true}, fill: 10}, data.point); }}];

		if(org.sarsoft.writeable) {
			this.imap.addContextMenuItems(items.concat([
	    		{text : "Details", applicable : function(obj) { return obj != null && that.getMarkerIdFromWpt(obj) != null}, handler: function(data) { that.markerDlg.show(that.objects[0][that.getMarkerIdFromWpt(data.subject)]) }},
	    		{text : "Drag to New Location", applicable : function(obj) { var marker = that.objects[0][that.getMarkerIdFromWpt(obj)]; return marker != null && !that.getAttr(0, marker, "inedit") && !that.markerDlg.live;}, handler: function(data) { var marker = that.objects[0][that.getMarkerIdFromWpt(data.subject)]; that.dragMarker(marker)}},
	    		{text : "Delete Marker", applicable : function(obj) { return obj != null && that.getMarkerIdFromWpt(obj) != null}, handler: function(data) { var id = that.getMarkerIdFromWpt(data.subject); that.del(function() { that.removeMarker(id); that.dao[0].del(id);}); }},
	    		{text : "Modify Points", applicable : function(obj) { var shape = that.objects[1][that.getShapeIdFromWay(obj)]; return shape != null && !that.getAttr(1, shape, "inedit"); }, handler : function(data) { that.editShape(that.objects[1][that.getShapeIdFromWay(data.subject)]) }},
	    		{text : "Details", applicable : function(obj) { var id = that.getShapeIdFromWay(obj); return obj != null && id != null && !that.getAttr(1, that.objects[1][id], "inedit") && !that.shapeDlg.live; }, handler: function(data) { that.shapeDlg.show(that.objects[1][that.getShapeIdFromWay(data.subject)], data.point) }},
	    		{text : "Profile", applicable : function(obj) { var id = that.getShapeIdFromWay(obj); return obj != null && id != null && !that.getAttr(1, that.objects[1][id], "inedit") && !that.shapeDlg.live; }, handler: function(data) { var shape = that.objects[1][that.getShapeIdFromWay(data.subject)]; that.profileShape(shape);}},
	    		{text : "Save Changes", applicable : function(obj) { var shape = that.objects[1][that.getShapeIdFromWay(obj)]; return shape != null && that.getAttr(1, shape, "inedit") && !that.shapeDlg.live; }, handler: function(data) { that.saveShape(that.objects[1][that.getShapeIdFromWay(data.subject)]) }},
	    		{text : "Discard Changes", applicable : function(obj) { var shape = that.objects[1][that.getShapeIdFromWay(obj)]; return shape != null && that.getAttr(1, shape, "inedit"); }, handler: function(data) { that.discardShape(that.objects[1][that.getShapeIdFromWay(data.subject)]) }},
	    		{text : "Delete Shape", applicable : function(obj) { var id = that.getShapeIdFromWay(obj); return obj != null && id != null && !that.getAttr(1, that.objects[1][id], "inedit");}, handler: function(data) { var id = that.getShapeIdFromWay(data.subject); that.del(function() { that.removeShape(id); that.dao[1].del(id);});}}
	     		]));
		}
	
	}

	if(!org.sarsoft.iframe) this.markupio = new org.sarsoft.view.MarkupIO(imap, this);

}

org.sarsoft.controller.MarkupMapController.prototype = new org.sarsoft.MapObjectController();

org.sarsoft.controller.MarkupMapController.prototype.growmap = function(idx, objects) {
	for(var i = 0; i < objects.length; i++) {
		if(idx == 0) {
			this.imap.growInitialMap(new google.maps.LatLng(objects[i].position.lat, objects[i].position.lng));
		} else {
			var bb = objects[i].way.boundingBox;
			this.imap.growInitialMap(new google.maps.LatLng(bb[0].lat, bb[0].lng));
			this.imap.growInitialMap(new google.maps.LatLng(bb[1].lat, bb[1].lng));
		}
	}
}

org.sarsoft.controller.MarkupMapController.prototype.checkDraftMode = function() {
	if(this.dataNavigator == null) return;
	
	var mkeys = Object.keys(this.objects[0]).length;
	var skeys = Object.keys(this.objects[1]).length;
	if(org.sarsoft.tenantid == null) {
		if(mkeys > 0 || skeys > 0) {
			if(this.saveAs.tree.block.css('display') != "block") {
				this.saveAs.tree.block.css('display', 'block');
				this.dataNavigator.defaults.sharing.sharing.css('display', 'none');
			}
		} else {
			if(this.saveAs.tree.block.css('display') != "none") {
				this.saveAs.tree.block.css('display', 'none');
				this.dataNavigator.defaults.sharing.sharing.css('display', 'block');
			}
		}
	}
	
	this.dataNavigator.defaults.io.exp.css('display', (mkeys > 0 || skeys > 0) ? 'block' : 'none');
	this.dn[0].cb.css('display', mkeys > 0 ? 'inline' : 'none');
	this.dn[1].cb.css('display', skeys > 0 ? 'inline' : 'none');
}

org.sarsoft.controller.MarkupMapController.prototype.saveShape = function(shape, handler) {
	shape.way.waypoints = this.imap.save(shape.way.id);
	this.dao[1].saveWaypoints(shape, shape.way.waypoints, function(obj) { shape.way = obj; if(handler != null) handler();});
	this.setAttr(1, shape, "inedit", false);
}

org.sarsoft.controller.MarkupMapController.prototype.discardShape = function(shape) {
	this.imap.discard(shape.way.id);
	this.setAttr(1, shape, "inedit", false);
}

org.sarsoft.controller.MarkupMapController.prototype.redrawShape = function(shape, onEnd, onCancel) {
	this.imap.redraw(shape.way.id, onEnd, onCancel);
	this.setAttr(1, shape, "inedit", true);
}

org.sarsoft.controller.MarkupMapController.prototype.editShape = function(shape) {
	this.imap.edit(shape.way.id);
	this.setAttr(1, shape, "inedit", true);
}

org.sarsoft.controller.MarkupMapController.prototype.profileShape = function(shape) {
	var that = this;
	this.pg.profile(shape.way, shape.color, function() {
		that.profileDlg.show();
	});
}

org.sarsoft.controller.MarkupMapController.prototype.editMarkerPosition = function(marker) {
	this.imap.allowDragging(marker.position);
	this.setAttr(0, marker, "inedit", true);
}

org.sarsoft.controller.MarkupMapController.prototype.saveMarkerPosition = function(marker, handler) {
	this.imap.saveDrag(marker.position);
	this.setAttr(0, marker, "inedit", false);
	this.dao[0].updatePosition(marker.id, marker.position, function() {if(handler != null) handler();});
}

org.sarsoft.controller.MarkupMapController.prototype.discardMarkerPosition = function(marker) {
	this.imap.discardDrag(marker.position);
	this.setAttr(0, marker, "inedit", false);
}


org.sarsoft.controller.MarkupMapController.prototype.dragMarker = function(marker) {
	var that = this;
	this.setAttr(0, marker, "inedit", true);
	this.imap.dragOnce(marker.position, function(gll) {
		that.setAttr(0, marker, "inedit", false);
		marker.position.lat = gll.lat();
		marker.position.lng = gll.lng();
		that.dao[0].updatePosition(marker.id, marker.position, function() {});
	});
}

org.sarsoft.controller.MarkupMapController.prototype.removeMarker = function(id) {
	if(this.objects[0][id] != null) this.imap.removeWaypoint(this.objects[0][id].position);
	this.helpRemove(0, id);
	this.checkDraftMode();
}

org.sarsoft.controller.MarkupMapController.prototype.removeShape = function(id) {
	if(this.objects[1][id] != null) this.imap.removeWay(this.objects[1][id].way);
	this.helpRemove(0, id);
	this.checkDraftMode();
}

org.sarsoft.controller.MarkupMapController.prototype.getMarkerIdFromWpt = function(wpt) {
	for(var key in this.objects[0]) {
		if(this.objects[0][key] != null && this.objects[0][key].position == wpt) return key;
	}
}

org.sarsoft.controller.MarkupMapController.prototype.getShapeIdFromWay = function(way) {
	if(way == null) return null;
	for(var key in this.objects[1]) {
		if(this.objects[1][key] != null && this.objects[1][key].way == way) return key;
	}
}

org.sarsoft.controller.MarkupMapController.prototype.buildDN = function(i, object) {
	var that = this;
	
	var line = this.DNGetLine(i, object, 0);
	
	if(i == 0) {
		line.append('<img style="vertical-align: top; padding-right: 0.5em; height: 16px; width: 16px" src="' + org.sarsoft.controller.MarkupMapController.getRealURLForMarker(object.url) + '"/>');
		var s = '<span style="cursor: pointer; font-weight: bold; color: #945e3b">' + org.sarsoft.htmlescape(object.label) + '</span>';
		if(object.label == null || object.label.length == 0) s = '<span style="cursor: pointer; font-weight: bold; color: #CCCCCC">N/A</span>'
		jQuery(s).appendTo(line).click(function() {
			if(org.sarsoft.mobile) imap.registered["org.sarsoft.DataNavigatorToggleControl"].hideDataNavigator();
			that.imap.map.setCenter(new google.maps.LatLng(object.position.lat, object.position.lng));
		});
		
		if(org.sarsoft.writeable) {
			this.DNAddIcon(i, object, "Edit", '<img src="' + org.sarsoft.imgPrefix + '/edit.png"/>').click(function() {
				that.markerDlg.show(object, null, true);
				that.markerDlg.live = true;
				that.editMarkerPosition(object);
			});
			this.DNAddIcon(i, object, "Delete", '-').css({'font-weight': 'bold', color: 'red'}).click(function() {
				that.del(function() { that.removeMarker(object.id); that.dao[0].del(object.id); });
			});
		}
		
	} else {
		line.append(org.sarsoft.controller.MarkupMapController.getIconForShape(object));
		var s = '<span style="cursor: pointer; font-weight: bold; color: #945e3b">' + org.sarsoft.htmlescape(object.label) + '</span>';
		if(object.label == null || object.label.length == 0) s = '<span style="cursor: pointer; font-weight: bold; color: #CCCCCC">N/A</span>'

		jQuery(s).appendTo(line).click(function() {
			if(org.sarsoft.mobile) imap.registered["org.sarsoft.DataNavigatorToggleControl"].hideDataNavigator();
			that.imap.setBounds(new google.maps.LatLngBounds(new google.maps.LatLng(object.way.boundingBox[0].lat, object.way.boundingBox[0].lng), new google.maps.LatLng(object.way.boundingBox[1].lat, object.way.boundingBox[1].lng)));
		});
		
		this.DNAddIcon(i, object, "Elevation Profile", '<img src="' + org.sarsoft.imgPrefix + '/profile.png"/>').click(function() {
			that.profileShape(object);
		});
		
		if(org.sarsoft.writeable) {
			this.DNAddIcon(i, object, "Edit", '<img src="' + org.sarsoft.imgPrefix + '/edit.png"/>').click(function() {
				 that.shapeDlg.show(object, null, true); that.shapeDlg.live = true; that.editShape(object);
			});
			this.DNAddIcon(i, object, "Delete", '-').css({'font-weight': 'bold', color: 'red'}).click(function() {
				that.del(function() { that.removeShape(object.id); that.dao[1].del(object.id); });
			});
		}
	}
	
	if(object.comments != null && object.comments.length > 0) this.DNAddComments(i, object, object.comments);
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

org.sarsoft.controller.MarkupMapController.prototype.show = function(i, object) {
	if(this.objects[i][object.id] != null) {
		if(i == 0) {
			this.imap.removeWaypoint(this.objects[0][object.id].position);
		} else {
			this.imap.removeWay(this.objects[1][object.id].way);		
		}
	}
	if(object.way == null && object.position == null) return;
	
	if(i == 1) {
		object.way.waypoints = object.way.zoomAdjustedWaypoints;
		object.way.displayMessage = org.sarsoft.htmlescape(object.label) + " (" + object.formattedSize + ")";
	}
	this.helpShow(i, object);
	if(!this.visible[i]) return; // need lines above this in case the user re-enables markup

	if(i == 0) {
		var marker = object;
		var config = new Object();	
		var tooltip = org.sarsoft.htmlescape(marker.label);
		if(marker.comments != null && marker.comments.length > 0) tooltip = org.sarsoft.htmlescape(marker.comments);
		if(!org.sarsoft.iframe && (org.sarsoft.writeable || (marker.comments != null && marker.comments.length > 0))) config.clickable = true;
		
		if(marker.url == null || marker.url.length == 0) {
			config.color = "#FF0000";
		} else if(marker.url.indexOf('#') == 0) {
			config.color = marker.url;
		} else if(marker.url.indexOf('/') == -1 && marker.url.indexOf('.') == -1) {
			config.icon = org.sarsoft.MapUtil.createImage(20, org.sarsoft.imgPrefix + "/icons/" + marker.url + ".png");
		} else {
			config.icon = org.sarsoft.MapUtil.createImage(20, marker.url);
		}
		this.imap.addWaypoint(marker.position, config, tooltip, org.sarsoft.htmlescape(marker.label));
	} else {
		var shape = object;
		this.imap.addWay(shape.way, {clickable : (!org.sarsoft.iframe && (org.sarsoft.writeable || (shape.comments != null && shape.comments.length > 0))), fill: shape.fill, color: shape.color, weight: shape.weight}, org.sarsoft.htmlescape(shape.label));
	}	
	this.checkDraftMode();
}


org.sarsoft.controller.MarkupMapController.prototype.handleSetupChange = function(i) {
	if(!this.visible[i]) {
		for(var key in this.objects[i]) {
			if(i == 0) this.imap.removeWaypoint(this.objects[i][key].position);
			else this.imap.removeWay(this.objects[i][key].way);
		}
	} else {
		for(var key in this.objects[i]) {
			this.show(i, this.objects[key]);
		}
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
	$(document).unbind("keydown", this._escHandler);
	this.imap.drawingManager.setOptions({drawingMode: null});

	this.pg.profile(this.imap._getPath(poly).getArray(), "#000000", function() {
		that.profileDlg.show();
	});
}

org.sarsoft.controller.MapToolsController.prototype._escHandler = function(e) {
	if(e.which == 27) {
		this.imap.drawingManager.setOptions({drawingMode: null});
		if(this.complete != null) {
			google.maps.event.removeListener(this.complete);
			this.complete = null;
		}
	}
}

org.sarsoft.controller.MapToolsController.prototype.profile = function() {
	var that = this;
	this.imap.lockContextMenu();
	
	this.imap.drawingManager.setOptions({polylineOptions: {strokeColor: "#000000", strokeOpacity: 1, strokeWeight: 1}});
	this.imap.drawingManager.setDrawingMode(google.maps.drawing.OverlayType.POLYLINE);
	
	$(document).bind("keydown", this._escHandler);
	
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
	
org.sarsoft.controller.MapToolsController.prototype.measure = function(point, polygon) {
	var that = this;
	this.imap.lockContextMenu();

	this.imap.drawingManager.setOptions({polygonOptions: {strokeColor: "#000000", strokeOpacity: 1, strokeWeight: 2, fillColor: "#000000", fillOpacity: 0.2},
		polylineOptions: {strokeColor: "#000000", strokeOpacity: 1, strokeWeight: 1}});
	this.imap.drawingManager.setDrawingMode(polygon ? google.maps.drawing.OverlayType.POLYGON : google.maps.drawing.OverlayType.POLYLINE);
	
	var handler = function(poly) {
		google.maps.event.removeListener(that.complete);
		that.imap.unlockContextMenu();
		$(document).unbind("keydown", that.fn);
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

	this.fn = function(e) {
		if(e.which == 27) {
			that.imap.drawingManager.setOptions({drawingMode: null});
		}
	}
	$(document).bind("keydown", this.fn);
	
	this.complete = google.maps.event.addListener(this.imap.drawingManager, polygon ? "polygoncomplete" : "polylinecomplete", function(poly) {
		window.setTimeout(function() { handler(poly) }, 100);
	});

}
