<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd"> 
<html xmlns="http://www.w3.org/TR/html4/loose.dtd">
<head>
${head}
<script type="text/javascript">

markers = new Array();

saveMap = function() {
	var center = imap.map.getCenter();
	var hash = "center=" + Math.round(center.lat()*100000)/100000 + "," + Math.round(center.lng()*100000)/100000 + "&zoom=" + map.getZoom();
	var config = imap.getConfig();
	hash = hash + "&base=" + config.base;
	if(config.overlay != null) hash = hash + "&overlay=" + config.overlay;
	if(config.opacity != null) hash = hash + "&opacity=" + config.opacity;
	if(config.alphaOverlays != null) hash = hash + "&alphaOverlays=" + config.alphaOverlays;
	var markerData = new Array();
	for(var i = 0; i < markers.length; i++) {
		if(markers[i] != null) {
			markerData.push(markers[i]);
		}
	}
	if(markerData.length > 0) {
		hash = hash + "&markers=" + encodeURIComponent(YAHOO.lang.JSON.stringify(markerData));
	}
	ignorehash=true;
	window.location.hash=hash;
	lasthash=window.location.hash
	ignorehash=false;
}

loadMap = function() {
	ignorehash=true;
	lasthash = window.location.hash;
	var hash = lasthash.slice(1);
	var props = hash.split("&");
	for(var i = 0; i < markers.length; i++) {
		imap.removeWaypoint(markers[i]);
	}
	markers = new Array();
	var mdata = new Array();
	var config = new Object();
	for(var i = 0; i < props.length; i++) {
		var prop = props[i].split("=");
		if(prop[0] == "center") {
			var latlng = prop[1].split(",");
			map.setCenter(new GLatLng(latlng[0], latlng[1]));
		}
		if(prop[0] == "zoom") imap.map.setZoom(1*prop[1]);
		if(prop[0] == "base") config.base = prop[1];
		if(prop[0] == "overlay") config.overlay = prop[1];
		if(prop[0] == "opacity") config.opacity = prop[1];
		if(prop[0] == "alphaOverlays") config.alphaOverlays = prop[1];
		if(prop[0] == "markers") mdata = YAHOO.lang.JSON.parse(decodeURIComponent(prop[1]));
	}
	if(config.overlay == null) config.overlay = config.base;
	if(config.opacity == null) config.opacity = 0;
	if(config.base != null) imap.setConfig(config);
	for(var i = 0; i < mdata.length; i++) {
		var marker = mdata[i];
		createMarker(new GLatLng(marker.lat, marker.lng), marker.name);
	}

	ignorehash=false;
}

markers = new Array();
createMarker = function(latlng, label) {
	var wpt = {lat : Math.round(latlng.lat()*100000)/100000, lng : Math.round(latlng.lng()*100000)/100000, name : label};
	wpt.id = markers.length;
	imap.addWaypoint(wpt, {color: "#FF0000"}, label, label);
	markers.push(wpt);
	saveMap();
}

removeMarker = function(marker) {
	imap.removeWaypoint(marker);
	for(var i = 0; i < markers.length; i++) {
		if(this.markers[i] == marker) {
			delete this.markers[i];
			saveMap();
			return;
		}
	}
}

function doload() {
org.sarsoft.Loader.queue(function() {

	map = org.sarsoft.EnhancedGMap.createMap(document.getElementById('map_canvas'));
	imap = new org.sarsoft.InteractiveMap(map, {standardControls : true, switchableDatum : true});

	newMarkerDialog = new YAHOO.widget.Dialog("newMarkerDlg", {zIndex: "2000"});
	var buttons = [ { text : "Create", handler: function() {
			newMarkerDialog.hide();
			createMarker(imap.map.fromContainerPixelToLatLng(newMarkerDialog._point), document.getElementById('newMarkerLabel').value);
			document.getElementById('newMarkerLabel').value="";
		}, isDefault: true}, {text : "Cancel", handler : function() { that.newMarkerDialog.hide(); }}];
	newMarkerDialog.cfg.queueProperty("buttons", buttons);
	newMarkerDialog.render(document.body);
	newMarkerDialog.hide();

	imap.addContextMenuItems([
                    	{text : "New Marker", applicable : function(obj) { return obj == null }, handler : function(data) { newMarkerDialog.moveTo(data.point.x, data.point.y); newMarkerDialog._point = data.point; newMarkerDialog.show(); }},
                    	{text : "Delete Marker", applicable : function(obj) { return obj != null; }, handler : function(data) { removeMarker(data.subject); }}
                	]);

	GEvent.addListener(map, "moveend", function() {
		if(!ignorehash) saveMap();
		});
	GEvent.addListener(map, "zoomend", function() {
		if(!ignorehash) saveMap();
	});
	GEvent.addDomListener(map._overlaydropdownmapcontrol._go, "click", function() {
		saveMap();
	});
  
	checkhashupdate();
});
}

ignorehash = false;
lasthash = "";
function checkhashupdate() {
	if(lasthash != window.location.hash) {
		loadMap();
	}
}
window.setInterval("checkhashupdate()", 500);
</script>
</head>
<body onload="doload()" onunload="GUnload()" class="yui-skin-sam" style="width: 100%; height: 100%">
<div id="map_canvas" style="width: 100%; height: 100%">
</div>
<div id="newMarkerDlg">
    <div class="hd">New Marker</div>
    <div class="bd">
            <label for="newMarkerLabel">Label:</label><input type="text" name="newMarkerLabel" id="newMarkerLabel" />
    </div>
	</div>

</body>
</html>