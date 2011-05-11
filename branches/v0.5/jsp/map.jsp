<html>
<head>
${mapjs}
<script src="/static/js/yui.js"></script>
<script src="/app/constants.js"></script>
<script src="/static/js/common.js"></script>
<script src="/static/js/maps.js"></script>
<script src="/static/js/plans.js"></script>
<script src="/static/js/ops.js"></script>
<script type="text/javascript">

markers = new Array();

org.sarsoft.EnhancedGMap.prototype.saveMap = function() {
	var center = this.map.getCenter();
	var hash = "center=" + center.lat() + "," + center.lng() + "&zoom=" + map.getZoom();
	var config = emap.getConfig();
	hash = hash + "&base=" + config.base;
	if(config.overlay != null) hash = hash + "&overlay=" + config.overlay;
	if(config.opacity != null) hash = hash + "&opacity=" + config.opacity;
	var markerData = new Array();
	for(var i = 0; i < markers.length; i++) {
		if(markers[i] != null) {
			var marker = markers[i];
			markerData.push({ title : marker.getTitle(), lat: marker.getLatLng().lat(), lng: marker.getLatLng().lng() });
		}
	}
	if(markerData.length > 0) {
		hash = hash + "&markers=" + encodeURIComponent(YAHOO.lang.JSON.stringify(markerData));
	}
	ignorehash=true;
	window.location.hash=hash;
	this.lasthash=window.location.hash
	ignorehash=false;
}

org.sarsoft.EnhancedGMap.prototype.loadMap = function() {
	ignorehash=true;
	this.lasthash = window.location.hash;
	var hash = this.lasthash.slice(1);
	var props = hash.split("&");
	for(var i = 0; i < markers.length; i++) {
		this.map.removeOverlay(markers[i]);
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
		if(prop[0] == "zoom") this.map.setZoom(1*prop[1]);
		if(prop[0] == "base") config.base = prop[1];
		if(prop[0] == "overlay") config.overlay = prop[1];
		if(prop[0] == "opacity") config.opacity = prop[1];
		if(prop[0] == "markers") mdata = YAHOO.lang.JSON.parse(decodeURIComponent(prop[1]));
	}
	if(config.overlay == null) config.overlay = config.base;
	if(config.opacity == null) config.opacity = 0;
	if(config.base != null) emap.setConfig(config);
	for(var i = 0; i < mdata.length; i++) {
		var marker = mdata[i];
		this.addMarker(new GLatLng(marker.lat, marker.lng), marker.title);
	}

	ignorehash=false;
}

function doload() {
org.sarsoft.Loader.queue(function() {
  egm = new org.sarsoft.EnhancedGMap();
  map = egm.createMap(document.getElementById('map_canvas'));
  emap = new org.sarsoft.EditableGMap(map);
	GEvent.addListener(map, "moveend", function() {
		if(!ignorehash) egm.saveMap();
		});
	GEvent.addListener(map, "zoomend", function() {
		if(!ignorehash) egm.saveMap();
	});
	GEvent.addDomListener(map._overlaydropdownmapcontrol._go, "click", function() {
		egm.saveMap();
	});
  
});
}

ignorehash = false;
function checkhashupdate() {
	if(egm.lasthash != window.location.hash) {
		egm.loadMap();
	}
}
window.setInterval("checkhashupdate()", 500);
</script>
<link rel="stylesheet" type="text/css" href="/static/css/yui.css"/>
<link rel="stylesheet" type="text/css" href="/static/css/AppBase.css"/>
</head>
<body onload="doload()" onunload="GUnload()" class="yui-skin-sam" style="border: 0px; margin: 0px; padding: 0px">
<div id="map_canvas" style="width: 100%; height: 100%"></div>

</body>
</html>