<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn" %>
<html>
<head>
${mapjs}
<script src="/static/js/yui.js"></script>
<script src="/app/constants.js"></script>
<script src="/static/js/common.js"></script>
<script src="/static/js/maps.js"></script>
<script src="/static/js/admin.js"></script>
<script src="/static/js/ops.js"></script>
<script type="text/javascript">
function doload() {
org.sarsoft.Loader.queue(function() {
  egm = new org.sarsoft.EnhancedGMap();
  map = egm.createMap(document.getElementById('map_canvas'));
  map.setCenter(new GLatLng(38, -122), 8);
  egm2 = new org.sarsoft.EnhancedGMap();
  map2 = egm.createMap(document.getElementById('combined_canvas'));

  document.getElementById("image").addEventListener("click", function(e) {imageContextMenu.show({x: e.offsetX?(e.offsetX):e.pageX-document.getElementById("image").offsetLeft, y: e.offsetY?(e.offsetY):e.pageY-document.getElementById("image").offsetTop});}, false);
	GEvent.addListener(map, "singlerightclick", function(point, src, overlay) {
		mapContextMenu.show(point);
	});

  GeoRefIMGForm = function() {
	 	var fields = [
	 		{ name : "angle", label: "Angle", type: "number"},
	 		{ name : "scale", label: "Scale", type: "number"},
	 		{ name : "originx", label: "Origin x", type : "number"},
	 		{ name : "originy", label: "Origin y", type : "number"},
	 		{ name : "originlat", label: "Origin lat", type : "number"},
	 		{ name : "originlng", label: "Origin lng", type : "number"},
	 		{ name : "width", label: "Width", type : "number"},
	 		{ name : "height", label: "Height", type : "number"},
	 		{ name : "opacity", label: "Opacity", type : "number"}
	 	];
	 	org.sarsoft.view.EntityForm.call(this, fields);
	 }

	GeoRefIMGForm.prototype = new org.sarsoft.view.EntityForm();
	parameterForm = new GeoRefIMGForm();
  parameterForm.create(document.getElementById('paramform'));

});
}


imageContextMenu = new org.sarsoft.view.ContextMenu();
imageContextMenu.setItems([
	{text : "Mark Image Point 1", applicable : function(obj) { return true}, handler : function(data) { setImageRef(0, data.point); }},
	{text : "Mark Image Point 2", applicable : function(obj) { return true}, handler : function(data) { setImageRef(1, data.point); }}
	]);


mapContextMenu = new org.sarsoft.view.ContextMenu();
mapContextMenu.setItems([
	{text : "Mark Map Point 1", applicable : function(obj) { return true}, handler : function(data) { setMapRef(0, data.point); }},
	{text : "Mark Map Point 2", applicable : function(obj) { return true}, handler : function(data) { setMapRef(1, data.point); }}
	]);


imageRef = new Array();
function setImageRef(id, point) {
	imageRef[id] = point;
	checkCombined();
}

mapRef = new Array();
function setMapRef(id, point) {
	mapRef[id] = map.fromContainerPixelToLatLng(point);
	checkCombined();
}

function checkCombined() {
	if(imageRef[0] == null || imageRef[1] == null || mapRef[0] == null || mapRef[1] == null)
		return;

	lat1=mapRef[1].lat()*Math.PI/180;
	lat2=mapRef[0].lat()*Math.PI/180;
	dLon=(mapRef[1].lng()-mapRef[0].lng())*Math.PI/180;
	y = Math.sin(dLon) * Math.cos(lat2);
	 x = Math.cos(lat1)*Math.sin(lat2) -
	        Math.sin(lat1)*Math.cos(lat2)*Math.cos(dLon);
	mapAngle = Math.atan2(y, -x)*180/Math.PI;

	dy = imageRef[0].y - imageRef[1].y;
	dx = imageRef[1].x - imageRef[0].x;
	imageAngle = Math.atan(dx/dy)*180/Math.PI;
	if(dy < 0 && dx < 0) imageAngle = imageAngle - 180;
	if(dy < 0 && dx > 0) imageAngle = imageAngle + 180;
	
	georef.angle = mapAngle - imageAngle;
	georef.scale = mapRef[1].distanceFrom(mapRef[0])/Math.sqrt(dx*dx+dy*dy);
	georef.originx = imageRef[0].x;
	georef.originy = imageRef[0].y;
	georef.originlat = mapRef[0].lat();
	georef.originlng = mapRef[0].lng();
	
	parameterForm.write(georef);
	updateCombinedView();
}

overlay = null;

function updateCombinedView() {
	georef = parameterForm.read();
	if(overlay != null) map2.removeOverlay(overlay);
	overlay = new GeoRefImageOverlay(new GPoint(1*georef.originx, 1*georef.originy), new GLatLng(1*georef.originlat, 1*georef.originlng), georef.angle, georef.scale, "${image.filename}", new GSize(1*georef.width, 1*georef.height), georef.opacity);
	map2.addOverlay(overlay);
	map2.setCenter(new GLatLng(1*georef.originlat, 1*georef.originlng), 12);
	tabView.set('activeIndex', 2);
}

function save() {
  var dao = new org.sarsoft.GeoRefImageDAO();
  dao.save('${image.filename}', georef);
}

var tabView = new YAHOO.widget.TabView('tabs');

georef = new Object();
georef.width = ${width};
georef.height = ${height};
georef.opacity = 0.6;
<c:if test="${image.angle ne null}">
org.sarsoft.Loader.queue(function() {
	georef.angle = ${image.angle};
	georef.scale = ${image.scale};
	georef.originx = ${image.originx};
	georef.originy = ${image.originy};
	georef.originlat = ${image.originlat};
	georef.originlng = ${image.originlng};
//	parameterForm.write(georef);
//	updateCombinedView();
});
</c:if>

</script>
<link rel="stylesheet" type="text/css" href="/static/css/yui.css"/>
<link rel="stylesheet" type="text/css" href="/static/css/AppBase.css"/>
</head>
<body onload="doload()" onunload="GUnload()" class="yui-skin-sam" style="border: 0px; margin: 0px; padding: 0px">

<div id="tabs" class="yui-navset">
<ul class="yui-nav">
	<li class="selected"><a href="#image"><em>Image</em></a></li>
	<li><a href="#map"><em>Map</em></a></li>
	<li><a href="#combined"><em>Result</em></a></li>
	<li><a href="#parameters"><em>Parameters</em></a></li>
</ul>

<div class="yui-content">

<div id="image">
<img src="/resource/imagery/georef/${image.filename}" id="image"/>
</div>

<div id="map">
<div id="map_canvas" style="width: 100%; height: 100%;"></div>
</div>

<div id="combined">
<div id="combined_canvas" style="width: 100%; height: 100%;"></div>
</div>

<div id="parameters">
<div id="paramform"></div>
<br/>
<a href="javascript:updateCombinedView()">Update to match manually entered parameters.</a><br/>
<a href="javascript:save()">Save these parameters.</a>
</div>
</div>
</div>


</body>
</html>