<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"><%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<html>
<head>
${head}
<script type="text/javascript">
function doload() {
org.sarsoft.Loader.queue(function() {
  map = org.sarsoft.EnhancedGMap.createMap(document.getElementById('map_canvas'));
  imap = new org.sarsoft.InteractiveMap(map, {standardControls : true, switchableDatum : true});
  markupController = new org.sarsoft.controller.MarkupMapController(imap);
  configWidget = new org.sarsoft.view.PersistedConfigWidget(imap, true);
  configWidget.loadConfig();
  setInterval("imap.timer()", 10000);

	var configDlg = org.sarsoft.view.CreateDialog("Configuration and Sharing", "Leave map view and go to Configuration and Sharing page?", "Leave", "Cancel", function() {
		window.location = "/admin";		
	});
	var config = jQuery('<img src="/static/images/config.png" style="cursor: pointer; vertical-align: middle" title="Configuration and Sharing"/>')[0];
	GEvent.addDomListener(config, "click", function() {
		configDlg.show();
	});
	imap.addMenuItem(config, 39);

	var leaveDlg = org.sarsoft.view.CreateDialog("Leave Map View", "Leave map view and return to the home page?", "Leave", "Cancel", function() {
		window.location = "/";		
	});
	var goback = jQuery('<img src="/static/images/home.png" style="cursor: pointer; vertical-align: middle" title="Return to home page"/>')[0];
	GEvent.addDomListener(goback, "click", function() {
		leaveDlg.show();
	});
	imap.addMenuItem(goback, 40);

});
}
</script>
</head>
<body onload="doload()" onunload="GUnload()" class="yui-skin-sam" style="border: 0px; margin: 0px; padding: 0px">
<div id="map_canvas" style="width: 100%; height: 100%"></div>

</body>
</html>