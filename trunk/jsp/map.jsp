<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd"> 
<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<html xmlns="http://www.w3.org/TR/html4/loose.dtd">
<head>
${head}
<script type="text/javascript">

function doload() {
org.sarsoft.Loader.queue(function() {

	map = org.sarsoft.EnhancedGMap.createMap(document.getElementById('map_canvas'));
	var embed = !(window==top);
	imap = new org.sarsoft.InteractiveMap(map, {positionWindow: !embed, UTM: true, size: !embed, find: !embed, separators: true, switchableDatum : true, suppressPermissionWidget: true, container : $('#page_container')[0]});
	urlwidget = new org.sarsoft.MapURLHashWidget(imap, embed);
	if(!embed) {
		configWidget = new org.sarsoft.view.CookieConfigWidget(imap, true);
		configWidget.loadConfig((urlwidget.config == null) ? {} : {base: urlwidget.config.base, overlay: urlwidget.config.overlay, opacity: urlwidget.config.opacity, alphaOverlays : urlwidget.config.alphaOverlays, center: {lat: map.getCenter().lat(), lng: map.getCenter().lng()}, zoom: map.getZoom()});
		toolsController = new org.sarsoft.controller.MapToolsController(imap);
	}

	$(document).ready(function() { $(document).bind("contextmenu", function(e) { return false;})});

	if(!embed) {

		var leaveImg = jQuery('<img src="' + org.sarsoft.imgPrefix + '/home.png" style="cursor: pointer; vertical-align: middle" title="Return to home page"/>');
		var leaveDD = new org.sarsoft.view.MenuDropdown(leaveImg, 'left: 0; width: 100%', imap.map._overlaydropdownmapcontrol.div);

		var leaveBody = jQuery('<div style="padding-top: 5px">Leave map view and return to the home page?<br/><br/></div>').appendTo(leaveDD.div);
		var leaveCB = jQuery('<input type="checkbox" value="save">Save map settings for future page loads</input>').appendTo(leaveBody);
		jQuery('<br/><br/>').appendTo(leaveBody);

		jQuery('<button>Leave</button>').appendTo(leaveBody).click(function() {
			if(leaveCB.attr("checked")=="checked") configWidget.saveConfig();
			window.location = "/maps";
		});

		imap.addMenuItem(leaveDD.container, 40);
	}

	<c:if test="${uimessage ne null}">
	  imap.message('${uimessage}', 20000);
	</c:if>

	imap.registered["org.sarsoft.MapFindWidget"].setState(true);
	
});
}

</script>
</head>
<body onload="doload()" onunload="GUnload()" class="yui-skin-sam" style="width: 100%; height: 100%">
<div id="page_container" style="height: 100%">
 <div id="map_left">
 </div>
 <div id="map_right" style="height: 100%">
  <div id="map_canvas" style="width: 100%; height: 100%"></div>
 </div>
</div>
</body>
</html>