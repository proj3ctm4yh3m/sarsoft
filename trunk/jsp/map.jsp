<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd"> 
<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<html xmlns="http://www.w3.org/TR/html4/loose.dtd">
<head>
${head}
<script type="text/javascript">

function doload() {
org.sarsoft.Loader.queue(function() {

	map = org.sarsoft.EnhancedGMap.createMap(document.getElementById('map_canvas'));
	imap = new org.sarsoft.InteractiveMap(map, {positionWindow: true, UTM: true, size: true, find: true, separators: true, switchableDatum : true});
	setupWidget = new org.sarsoft.view.MapSetupWidget(imap);
    urlwidget = new org.sarsoft.MapURLHashWidget(imap);
	configWidget = new org.sarsoft.view.CookieConfigWidget(imap);
	configWidget.loadConfig((urlwidget.config == null) ? {} : {base: urlwidget.config.base, overlay: urlwidget.config.overlay, opacity: urlwidget.config.opacity});
	$(document).ready(function() { $(document).bind("contextmenu", function(e) { return false;})});

	var leaveDlg = org.sarsoft.view.CreateDialog("Leave Map View", "Leave map view and return to the home page?", "Leave", "Cancel", function() {
		window.location = "/";		
	});
	var goback = jQuery('<img src="/static/images/home.png" style="cursor: pointer; vertical-align: middle" title="Return to home page"/>')[0];
	GEvent.addDomListener(goback, "click", function() {
		leaveDlg.show();
	});
	imap.addMenuItem(goback, 40);
	
	<c:if test="${uimessage ne null}">
	  imap.message('${uimessage}', 20000);
	</c:if>
	
});
}

</script>
</head>
<body onload="doload()" onunload="GUnload()" class="yui-skin-sam" style="width: 100%; height: 100%">
<div id="map_canvas" style="width: 100%; height: 100%">
</div>
</body>
</html>