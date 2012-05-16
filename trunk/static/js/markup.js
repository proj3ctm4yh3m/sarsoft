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
		if(dn.defaults.imp != null) dn.defaults.imp.click(function() { that.impcomms.clear(); that.impDlg.swap(); });
	
		var gpsin = jQuery('<div style="cursor: pointer"><div><img style="display: block; margin-right: auto; margin-left: auto;" src="' + org.sarsoft.imgPrefix + '/gps64.png"/></div><div style="font-size: 120%; color: #5a8ed7; font-weight: bold;">Garmin GPS</div></div>');
		gpsin.appendTo(jQuery('<div style="display: inline-block; padding-right: 50px"></div>').appendTo(imp));
		gpsin.click(function() {
			that.impHeader.css('visibility', 'inherit');
			that.impcomms.init(false, "/map/restgpxupload", "");
		});
		
		var gpxin = jQuery('<form name="gpsform" action="/map/gpxupload?tid=' + org.sarsoft.tenantid + '" enctype="multipart/form-data" method="post"><input type="hidden" name="format" value="gpx"/></form>');
		var gpxfile = jQuery('<input type="file" name="file" style="margin-top: 40px; margin-left: 10px"/>').appendTo(gpxin);
		var gpxval = jQuery('<div style="margin-left: 10px; margin-top: 5px"></div>').appendTo(gpxin);
		gpxfile.change(function() {
			gpxval.html(gpxfile.val());
		})
		var gpxicon = jQuery('<div style="cursor: pointer"><div><img style="display: block; margin-right: auto; margin-left: auto;" src="' + org.sarsoft.imgPrefix + '/gpx64.png"/></div><div style="font-size: 120%; color: #5a8ed7; font-weight: bold; text-align: center">GPX File</div></div>');
		jQuery('<div style="display: inline-block"></div>').append(jQuery('<div style="float: left"></div').append(gpxicon)).append(jQuery('<div style="float: left"></div>').append(gpxin)).appendTo(imp);
		gpxicon.click(function() {
			if("" == gpxfile.val()) {
				alert("Please choose a GPX file to import.");
			} else {
				gpxin.submit();
			}
		});

		this.impHeader = jQuery('<div style="visibility: hidden; display: inline-block; vertical-align: top"><img src="' + org.sarsoft.imgPrefix + '/gps.png"/><b>GPS Console</b></div>').appendTo(imp);
		this.impcomms = new org.sarsoft.GPSComms(this.impHeader);

	} else {
		if(dn.defaults.imp != null) dn.defaults.imp.css('display', 'none');
	}
	
	var exp = jQuery('<div><div style="font-weight: bold; margin-bottom: 10px">To export data, click on the file type you wish to export to:</div></div>');
	this.expDlg = new org.sarsoft.view.MapDialog(imap, "Export Data", exp, null, "Export Complete", function() {
	});
	if(dn.defaults.exp != null) dn.defaults.exp.click(function() { that.refreshExportables(); that.expcomms.clear(); that.expDlg.swap(); });

	var gpsout = jQuery('<div style="cursor: pointer"><div><img style="display: block; margin-right: auto; margin-left: auto; width:" src="' + org.sarsoft.imgPrefix + '/gps64.png"/></div><div style="font-size: 120%; color: #5a8ed7; font-weight: bold;">Garmin GPS</div></div>').appendTo(jQuery('<div style="display: inline-block; padding-right: 50px"></div>').appendTo(exp));
	gpsout.click(function() {
		that.expHeader.css('visibility', 'inherit');
		var val = that.exportables._selected;
		var url = ""
		if(val == null) {
			url=window.location.href+'&format=GPX';
		} else if(val.url == null) {
			url="/rest/shape/" + val.id + "?format=GPX";
		} else {
			url="/rest/marker/" + val.id + "?format=GPX";
		}
		that.expcomms.init(true, url, "");
	});

	var gpxout = jQuery('<div style="cursor: pointer"><div><img style="display: block; margin-right: auto; margin-left: auto;" src="' + org.sarsoft.imgPrefix + '/gpx64.png"/></div><div style="font-size: 120%; color: #5a8ed7; font-weight: bold;">GPX File</div></div>');
	gpxout.appendTo(jQuery('<div style="display: inline-block; padding-right: 50px"></div>').appendTo(exp));
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

	var kmlout = jQuery('<div style="cursor: pointer"><div><img style="display: block; margin-right: auto; margin-left: auto;" src="' + org.sarsoft.imgPrefix + '/kml64.png"/></div><div style="font-size: 120%; color: #5a8ed7; font-weight: bold; text-align: center">Google Earth</div></div>').appendTo(jQuery('<div style="display: inline-block; padding-right: 50px"></div>').appendTo(exp));
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

	
	this.expHeader = jQuery('<div style="visibility: hidden; display: inline-block; vertical-align: top"><img src="' + org.sarsoft.imgPrefix + '/gps.png"/><b>GPS Console</b></div>').appendTo(exp);
	this.expcomms = new org.sarsoft.GPSComms(this.expHeader);
	this.exportables = jQuery('<div style="clear: both; width: 100%; padding-top: 10px"></div>').appendTo(exp);
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

	for(var key in this.controller.markers) {
		var marker = this.controller.markers[key];
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
	this._markerAttrs = new Object();
	this._shapeAttrs = new Object();
	this.showMarkers = true;
	this.showShapes = true;
	this.embedded = embedded;
	
	var dcbody = jQuery('<div>Delete - Are You Sure?</div>');
	this.delconfirm = new org.sarsoft.view.MapDialog(imap, "Delete?", dcbody, "Delete", "Cancel", function() {
		that.dchandler();
		that.dchandler = null;
	});
	this.del = function(handler) {
		that.dchandler = handler;
		that.delconfirm.show();
	}
	
	if(imap.registered["org.sarsoft.DataNavigator"] != null) {
		var dn = imap.registered["org.sarsoft.DataNavigator"];
		this.dn = new Object();
		var mtree = dn.addDataType("Markers");
		mtree.header.css({"font-size": "120%", "font-weight": "bold", "margin-top": "0.5em", "border-top": "1px solid #CCCCCC"});
		this.dn.markerdiv = jQuery('<div></div>').appendTo(mtree.body);
		this.dn.markers = new Object();
		this.dn.markertoggle = jQuery('<div style="float: right; font-size: 83%; cursor: pointer">(shown)</div>').prependTo(mtree.header).click(function(evt) {
			that.showMarkers=!that.showMarkers;
			that.handleMarkerSetupChange();
			if(that.showMarkers) {
				that.dn.markertoggle.html('(shown)');
			} else {
				that.dn.markertoggle.html('(hidden)');
			}
			evt.stopPropagation();
		});
		
		var stree = dn.addDataType("Shapes");
		stree.header.css({"font-size": "120%", "font-weight": "bold", "margin-top": "0.5em", "border-top": "1px solid #CCCCCC"});
		this.dn.shapediv = jQuery('<div></div>').appendTo(stree.body);
		this.dn.shapes = new Object();
		this.dn.shapetoggle = jQuery('<div style="float: right; font-size: 83%; cursor: pointer">(shown)</div>').prependTo(stree.header).click(function(evt) {
			that.showShapes=!that.showShapes;
			that.handleShapeSetupChange();
			if(that.showShapes) {
				that.dn.shapetoggle.html('(shown)');
			} else {
				that.dn.shapetoggle.html('(hidden)');
			}
			evt.stopPropagation();
		});

		if((org.sarsoft.userPermissionLevel == "WRITE" || org.sarsoft.userPermissionLevel == "ADMIN")) {
			jQuery('<span style="color: green; cursor: pointer">+ New Marker</span>').appendTo(jQuery('<div style="padding-top: 1em; font-size: 120%"></div>').appendTo(mtree.body)).click(function() {
				var center = that.imap.map.getCenter();
    			that.markerDlg.entityform.write({url: "#FF0000"});
    			that.markerDlg.point=that.imap.projection.fromLatLngToContainerPixel(center);
    			that.markerDlg.show();
			});

			jQuery('<div style="float: left; padding-top: 1em; margin-right: 2em; cursor: pointer; color: green; font-size: 120%">+ New Line</div>').appendTo(stree.body).click(function() {
			    that.shapeDlg.shape=null;
			    that.shapeDlg.polygon=false;
			    that.shapeDlg.entityform.write({create: true, weight: 2, color: "#FF0000", way : {polygon: false}, fill: 0});
			    var div = $(that.imap.map.getDiv());
			    that.shapeDlg.point=new google.maps.Point(Math.round(div.width()/2), Math.round(div.height()/2));
			    that.shapeDlg.show();
			});
			jQuery('<div style="float: left; padding-top: 1em; cursor: pointer; color: green; font-size: 120%">+ New Polygon</div>').appendTo(stree.body).click(function() {
			    that.shapeDlg.shape=null;
			    that.shapeDlg.polygon=true;
			    that.shapeDlg.entityform.write({create: true, weight: 2, color: "#FF0000", way : {polygon: true}, fill: 10});
			    var div = $(that.imap.map.getDiv());
			    that.shapeDlg.point=new google.maps.Point(Math.round(div.width()/2), Math.round(div.height()/2));
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
				var fn = function() {
					marker.position = that.markerDlg.marker.position;
					that.markerDAO.save(that.markerDlg.marker.id, marker, function(obj) {
						that.refreshMarkers([obj]);
					});
				}
				if(that.markerDlg.inedit) {
					that.markerDlg.inedit = false;
					that.saveMarkerPosition(that.markerDlg.marker, fn);
				} else {
					marker.position = that.markerDlg.marker.position;
					fn();
				}
			} else {
				var wpt = this.imap.projection.fromContainerPixelToLatLng(new google.maps.Point(that.markerDlg.point.x, that.markerDlg.point.y));
				marker.position = {lat: wpt.lat(), lng: wpt.lng()};
				that.markerDAO.create(function(obj) {
					that.refreshMarkers([obj]);
				}, marker);
			}}, "OK");
		form.labelInput.keydown(function(event) { if(event.keyCode == 13) that.markerDlg.dialog.ok();});
		this.markerDlg.dialog.dialog.hideEvent.subscribe(function() { 
			if(that.markerDlg.inedit) {
				that.markerDlg.inedit = false;
				that.discardMarkerPosition(that.markers[that.markerDlg.marker.id]);
			}
		});

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
		});

		form = new org.sarsoft.view.ShapeForm();
		this.shapeDlg = new org.sarsoft.view.MapEntityDialog(imap, "Shape Details", form , function(shape) {
			if(that.shapeDlg.shape != null) {
				var fn = function() { that.shapeDAO.save(that.shapeDlg.shape.id, shape, function(obj) {
					that.refreshShapes([obj]);
				});}
				if(that.shapeDlg.inedit) {
					that.shapeDlg.inedit = false;
					that.saveShape(that.shapes[that.shapeDlg.shape.id], function() {
						fn();
					});
				} else {
					fn();
				}
			} else {
				shape.way = {polygon: that.shapeDlg.polygon};
				shape.way.waypoints = that.imap.getNewWaypoints(that.shapeDlg.point, that.shapeDlg.polygon);
				that.shapeDAO.create(function(obj) {
					that.refreshShapes([obj]);
					that.redrawShape(obj, function() { that.saveShape(obj); }, function() { that.removeShape(obj.id); that.shapeDAO.del(obj.id); });
				}, shape);
			}}, "OK");
		this.shapeDlg.dialog.dialog.hideEvent.subscribe(function() { 
			if(that.shapeDlg.inedit) {
				that.shapeDlg.inedit = false;
				that.discardShape(that.shapes[that.shapeDlg.shape.id]);
			}
		});
		form.labelInput.keydown(function(event) { if(event.keyCode == 13) that.shapeDlg.dialog.ok();});
		
		this.pg = new org.sarsoft.view.ProfileGraph();
		this.profileDlg = new org.sarsoft.view.MapDialog(imap, "Elevation Profile", this.pg.div, "OK", null, function() { that.pg.hide(); });
		this.profileDlg.dialog.hideEvent.subscribe(function() { that.pg.hide(); });
		
		var items = [{text : "New Marker", applicable : function(obj) { return obj == null && that.showMarkers}, handler: function(data) { that.markerDlg.marker=null; that.markerDlg.entityform.write({url: "#FF0000"});that.markerDlg.point=data.point; that.markerDlg.show(); }},
		    {text : "New Line", applicable : function(obj) { return obj == null && that.showShapes}, handler: function(data) { that.shapeDlg.shape=null; that.shapeDlg.polygon=false; that.shapeDlg.entityform.write({create: true, weight: 2, color: "#FF0000", way : {polygon: false}, fill: 0});that.shapeDlg.point=data.point; that.shapeDlg.show(); }},
		    {text : "New Polygon", applicable : function(obj) { return obj == null && that.showShapes}, handler: function(data) { that.shapeDlg.shape=null; that.shapeDlg.polygon=true; that.shapeDlg.entityform.write({create: true, weight: 2, color: "#FF0000", way : {polygon: true}, fill: 10});that.shapeDlg.point=data.point; that.shapeDlg.show(); }}];
	
		if(nestMenuItems) {
			items = [{text : "Markup \u2192", applicable : function(obj) { return obj == null }, items: items}];
		}

		if((org.sarsoft.userPermissionLevel == "WRITE" || org.sarsoft.userPermissionLevel == "ADMIN") && nestMenuItems != "none") {
			this.imap.addContextMenuItems(items.concat([
	    		{text : "Details", applicable : function(obj) { return obj != null && that.getMarkerIdFromWpt(obj) != null}, handler: function(data) { var marker = that.markers[that.getMarkerIdFromWpt(data.subject)]; that.markerDlg.entityform.write(marker); that.markerDlg.show(); that.markerDlg.marker=marker; }},
	    		{text : "Drag to New Location", applicable : function(obj) { var marker = that.markers[that.getMarkerIdFromWpt(obj)]; return marker != null && !that.getMarkerAttr(marker, "inedit") && !that.markerDlg.inedit;}, handler: function(data) { var marker = that.markers[that.getMarkerIdFromWpt(data.subject)]; that.dragMarker(marker)}},
	    		{text : "Delete Marker", applicable : function(obj) { return obj != null && that.getMarkerIdFromWpt(obj) != null}, handler: function(data) { var id = that.getMarkerIdFromWpt(data.subject); that.del(function() { that.removeMarker(id); that.markerDAO.del(id);}); }},
	    		{text : "Modify Points", applicable : function(obj) { var shape = that.shapes[that.getShapeIdFromWay(obj)]; return shape != null && !that.getShapeAttr(shape, "inedit"); }, handler : function(data) { that.editShape(that.shapes[that.getShapeIdFromWay(data.subject)]) }},
	    		{text : "Details", applicable : function(obj) { var id = that.getShapeIdFromWay(obj); return obj != null && id != null && !that.getShapeAttr(that.shapes[id], "inedit") && !that.shapeDlg.inedit; }, handler: function(data) { var shape = that.shapes[that.getShapeIdFromWay(data.subject)]; that.shapeDlg.entityform.write(shape); that.shapeDlg.show(); that.shapeDlg.shape=shape;}},
	    		{text : "Profile", applicable : function(obj) { var id = that.getShapeIdFromWay(obj); return obj != null && id != null && !that.getShapeAttr(that.shapes[id], "inedit") && !that.shapeDlg.inedit; }, handler: function(data) { var shape = that.shapes[that.getShapeIdFromWay(data.subject)]; that.profileShape(shape);}},
	    		{text : "Save Changes", applicable : function(obj) { var shape = that.shapes[that.getShapeIdFromWay(obj)]; return shape != null && that.getShapeAttr(shape, "inedit") && !that.shapeDlg.inedit; }, handler: function(data) { that.saveShape(that.shapes[that.getShapeIdFromWay(data.subject)]) }},
	    		{text : "Discard Changes", applicable : function(obj) { var shape = that.shapes[that.getShapeIdFromWay(obj)]; return shape != null && that.getShapeAttr(shape, "inedit"); }, handler: function(data) { that.discardShape(that.shapes[that.getShapeIdFromWay(data.subject)]) }},
	    		{text : "Delete Shape", applicable : function(obj) { var id = that.getShapeIdFromWay(obj); return obj != null && id != null && !that.getShapeAttr(that.shapes[id], "inedit");}, handler: function(data) { var id = that.getShapeIdFromWay(data.subject); that.del(function() { that.removeShape(id); that.shapeDAO.del(id);});}}
	     		]));
		}
	
	}

	if(!nestMenuItems && !embedded) {
		this.markupio = new org.sarsoft.view.MarkupIO(imap, this);
	}

	this.markerDAO.loadAll(function(markers) {
		that.refreshMarkers(markers);
		for(var i = 0; i < markers.length; i++) {
			that.imap.growInitialMap(new google.maps.LatLng(markers[i].position.lat, markers[i].position.lng));
		}
	});		
	this.markerDAO.mark();

	this.shapeDAO.loadAll(function(shapes) {
		that.refreshShapes(shapes);
		for(var i = 0; i < shapes.length; i++) {
			var bb = shapes[i].way.boundingBox;
			that.imap.growInitialMap(new google.maps.LatLng(bb[0].lat, bb[0].lng));
			that.imap.growInitialMap(new google.maps.LatLng(bb[1].lat, bb[1].lng));
		}
	});
	this.shapeDAO.mark();	
}

org.sarsoft.controller.MarkupMapController.prototype.setMarkerAttr = function(marker, key, value) {
	if(marker == null) return null;
	if(typeof this._markerAttrs[marker.id] == "undefined") {
		this._markerAttrs[marker.id] = new Object();
	}
	this._markerAttrs[marker.id][key] = value;
}

org.sarsoft.controller.MarkupMapController.prototype.getMarkerAttr = function(marker, key) {
	if(marker == null) return null;
	if(typeof this._markerAttrs[marker.id] == "undefined") return null;
	return this._markerAttrs[marker.id][key];
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


org.sarsoft.controller.MarkupMapController.prototype.saveShape = function(shape, handler) {
	shape.way.waypoints = this.imap.save(shape.way.id);
	this.shapeDAO.saveWaypoints(shape, shape.way.waypoints, function(obj) { shape.way = obj; if(handler != null) handler();});
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

org.sarsoft.controller.MarkupMapController.prototype.profileShape = function(shape) {
	var that = this;
	var service = new google.maps.ElevationService();
	var path = [];
	for(var i = 0; i < shape.way.waypoints.length; i++) {
		path.push(new google.maps.LatLng(shape.way.waypoints[i].lat, shape.way.waypoints[i].lng));
	}
	if(shape.way.polygon) path.push(new google.maps.LatLng(shape.way.waypoints[0].lat, shape.way.waypoints[0].lng));
	service.getElevationAlongPath({path: path, samples: 100}, function(result, status) {
		if(status == google.maps.ElevationStatus.OK) {
			that.profileDlg.show();
			that.pg.draw(result, shape.color);
		} else {
			alert("An error occurred while retrieving profile data from Google Maps: " + status);
		}
	});
}

org.sarsoft.controller.MarkupMapController.prototype.editMarkerPosition = function(marker) {
	this.imap.allowDragging(marker.position);
	this.setMarkerAttr(marker, "inedit", true);
}

org.sarsoft.controller.MarkupMapController.prototype.saveMarkerPosition = function(marker, handler) {
	this.imap.saveDrag(marker.position);
	this.setMarkerAttr(marker, "inedit", false);
	this.markerDAO.updatePosition(marker.id, marker.position, function() {if(handler != null) handler();});
}

org.sarsoft.controller.MarkupMapController.prototype.discardMarkerPosition = function(marker) {
	this.imap.discardDrag(marker.position);
	this.setMarkerAttr(marker, "inedit", false);
}


org.sarsoft.controller.MarkupMapController.prototype.dragMarker = function(marker) {
	var that = this;
	this.setMarkerAttr(marker, "inedit", true);
	this.imap.dragOnce(marker.position, function(gll) {
		that.setMarkerAttr(marker, "inedit", false);
		marker.position.lat = gll.lat();
		marker.position.lng = gll.lng();
		that.markerDAO.updatePosition(marker.id, marker.position, function() {});
	});
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

	var line = jQuery('<div style="padding-top: 0.5em"></div>').appendTo(this.dn.markers[marker.id]);
	line.append('<img style="vertical-align: middle; padding-right: 0.5em; height: 16px; width: 16px" src="' + org.sarsoft.controller.MarkupMapController.getRealURLForMarker(marker.url) + '"/>');
	var s = '<span style="cursor: pointer; font-weight: bold; color: #945e3b">' + org.sarsoft.htmlescape(marker.label) + '</span>';
	if(marker.label == null || marker.label.length == 0) s = '<span style="cursor: pointer; font-weight: bold; color: #CCCCCC">N/A</span>'
	jQuery(s).appendTo(line).click(function() {
		if(org.sarsoft.mobile) imap.registered["org.sarsoft.DataNavigatorToggleControl"].hideDataNavigator();
		that.imap.map.setCenter(new google.maps.LatLng(marker.position.lat, marker.position.lng));
	});
	
	if((org.sarsoft.userPermissionLevel == "WRITE" || org.sarsoft.userPermissionLevel == "ADMIN")) {	
		jQuery('<span title="Delete" style="cursor: pointer; float: right; margin-right: 10px; font-weight: bold; color: red">-</span>').appendTo(line).click(function() {
			that.del(function() { that.removeMarker(marker.id); that.markerDAO.del(marker.id); });
		});
		jQuery('<span title="Edit" style="cursor: pointer; float: right; margin-right: 5px;"><img src="' + org.sarsoft.imgPrefix + '/edit.png"/></span>').appendTo(line).click(function() {
			that.markerDlg.entityform.write(marker); that.markerDlg.show(); that.markerDlg.marker=marker; that.markerDlg.inedit = true; that.editMarkerPosition(marker);
		});
	}
	
	var line = jQuery('<div></div>').appendTo(this.dn.markers[marker.id]);
	if(marker.comments != null && marker.comments.length > 0) {
		line.append(jQuery('<div style="border-left: 1px solid #945e3b; padding-left: 1ex" class="marker_desc_line_item pre"></div>').append(marker.comments));
	}
}


org.sarsoft.controller.MarkupMapController.prototype.showMarker = function(marker) {
	if(this.markers[marker.id] != null) this.imap.removeWaypoint(this.markers[marker.id].position);
	if(marker.position == null) return;
	this.markers[marker.id] = marker;
	if(!this.showMarkers) return; // need lines above this in case the user re-enables clues

	var config = new Object();	
	var tooltip = org.sarsoft.htmlescape(marker.label);
	if(marker.comments != null && marker.comments.length > 0) tooltip = org.sarsoft.htmlescape(marker.comments);
	if(!this.embedded && ((org.sarsoft.userPermissionLevel == "WRITE" || org.sarsoft.userPermissionLevel == "ADMIN") || (marker.comments != null && marker.comments.length > 0))) config.clickable = true;
	
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
	
	var line = jQuery('<div style="padding-top: 0.5em"></div>').appendTo(this.dn.shapes[shape.id]);
	line.append(org.sarsoft.controller.MarkupMapController.getIconForShape(shape));

	var s = '<span style="cursor: pointer; font-weight: bold; color: #945e3b">' + org.sarsoft.htmlescape(shape.label) + '</span>';
	if(shape.label == null || shape.label.length == 0) s = '<span style="cursor: pointer; font-weight: bold; color: #CCCCCC">N/A</span>'

	jQuery(s).appendTo(line).click(function() {
		if(org.sarsoft.mobile) imap.registered["org.sarsoft.DataNavigatorToggleControl"].hideDataNavigator();
		that.imap.setBounds(new google.maps.LatLngBounds(new google.maps.LatLng(shape.way.boundingBox[0].lat, shape.way.boundingBox[0].lng), new google.maps.LatLng(shape.way.boundingBox[1].lat, shape.way.boundingBox[1].lng)));
	});
	
	
	if((org.sarsoft.userPermissionLevel == "WRITE" || org.sarsoft.userPermissionLevel == "ADMIN")) {	
		jQuery('<span title="Delete" style="cursor: pointer; float: right; margin-right: 10px; font-weight: bold; color: red">-</span>').appendTo(line).click(function() {
			that.del(function() { that.removeShape(shape.id); that.shapeDAO.del(shape.id); });
		});
		jQuery('<span title="Edit" style="cursor: pointer; float: right; margin-right: 5px;"><img src="' + org.sarsoft.imgPrefix + '/edit.png"/></span>').appendTo(line).click(function() {
			 that.shapeDlg.entityform.write(shape); that.shapeDlg.show(); that.shapeDlg.shape=shape; that.shapeDlg.inedit = true; that.editShape(shape);
			});
	}

	jQuery('<span title="Elevation Profile" style="cursor: pointer; float: right; margin-right: 5px;"><img src="' + org.sarsoft.imgPrefix + '/profile.png"/></span>').appendTo(line).click(function() {
			that.profileShape(shape);
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
	if(!this.showShapes) return; // need lines above this in case the user re-enables clues

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

org.sarsoft.controller.MarkupMapController.prototype.handleMarkerSetupChange = function() {
	if(!this.showMarkers) {
		for(var key in this.markers) {
			this.imap.removeWaypoint(this.markers[key].position);
		}
	} else {
		for(var key in this.markers) {
			this.showMarker(this.markers[key]);
		}
	}
}

org.sarsoft.controller.MarkupMapController.prototype.handleShapeSetupChange = function() {
	if(!this.showShapes) {
		for(var key in this.shapes) {
			this.imap.removeWay(this.shapes[key].way);
		}
	} else {
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
