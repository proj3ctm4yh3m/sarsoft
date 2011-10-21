<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn" %>

<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"><%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<html>
<head>
${head}
<script type="text/javascript">
function doload() {
org.sarsoft.Loader.queue(function() {
  <c:choose>
  <c:when test="${empty tenant.defaultCenter}">
    map = org.sarsoft.EnhancedGMap.createMap(document.getElementById('map_canvas'));
  </c:when>
  <c:otherwise>
   map = org.sarsoft.EnhancedGMap.createMap(document.getElementById('map_canvas'), new GLatLng(${tenant.defaultCenter.lat}, ${tenant.defaultCenter.lng}), 14);
  </c:otherwise>
  </c:choose>
  imap = new org.sarsoft.InteractiveMap(map, {standardControls : true, switchableDatum : true});
  markupController = new org.sarsoft.controller.MarkupMapController(imap);
  setupWidget = new org.sarsoft.view.MapSetupWidget(imap);
  configWidget = new org.sarsoft.view.PersistedConfigWidget(imap, (org.sarsoft.userPermissionLevel != "READ"));
  configWidget.loadConfig();
  setInterval("imap.timer()", 30000);

  imap.message("Right click on map background to create shapes", 30000);

	var leaveDlg = org.sarsoft.view.CreateDialog("Leave Map View", "Leave map view and return to the home page?", "Leave", "Cancel", function() {
		window.location = "/";		
	});
	var goback = jQuery('<img src="/static/images/home.png" style="cursor: pointer; vertical-align: middle" title="Return to home page"/>')[0];
	GEvent.addDomListener(goback, "click", function() {
		leaveDlg.show();
	});
	imap.addMenuItem(goback, 40);

	if(org.sarsoft.userPermissionLevel == "ADMIN") {
		var goToAdmin = new Object();
		imap.register("goToAdmin", goToAdmin);
		goToAdmin.getSetupBlock = function() {
			return {
				order : 1,
				node : jQuery('<div>Visit the <a href="/admin.html">Admin Page</a> to manage sharing</div>')[0],
				handler : function() {}
			}
		}
	}
	$(document).ready(function() { $(document).bind("contextmenu", function(e) { return false;})});
});
}
</script>
</head>
<body onload="doload()" onunload="GUnload()" class="yui-skin-sam" style="border: 0px; margin: 0px; padding: 0px">
<div id="map_canvas" style="width: 100%; height: 100%"></div>

</body>
</html>