<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"><%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@page import="org.sarsoft.common.util.RuntimeProperties"%>
<% pageContext.setAttribute("refreshInterval", RuntimeProperties.getProperty("sarsoft.refreshInterval")); %>
<html>
<head>
${head}
<script type="text/javascript">
function doload() {
org.sarsoft.Loader.queue(function() {
  map = org.sarsoft.EnhancedGMap.createMap(document.getElementById('map_canvas'));
  imap = new org.sarsoft.InteractiveMap(map, {standardControls : true, switchableDatum : true});
  plansController = new org.sarsoft.controller.OperationalPeriodMapController(imap, {id : ${period.id}});
  waypointController = new org.sarsoft.controller.SearchWaypointMapController(imap);
  resourceController = new org.sarsoft.controller.ResourceLocationMapController(imap);
  callsignController = new org.sarsoft.controller.CallsignMapController(imap);
  clueController = new org.sarsoft.controller.ClueLocationMapController(imap);
  markupController = new org.sarsoft.controller.MarkupMapController(imap, true);
  plansController.setupWidget = new org.sarsoft.view.MapSetupWidget(imap);
  configWidget = new org.sarsoft.view.PersistedConfigWidget(imap, (org.sarsoft.userPermissionLevel != "READ"));
  configWidget.loadConfig();
  setInterval("imap.timer()", org.sarsoft.map.refreshInterval);
});
}
</script>
</head>
<body onload="doload()" onunload="GUnload()" class="yui-skin-sam" style="border: 0px; margin: 0px; padding: 0px">
<div id="map_canvas" style="width: 100%; height: 100%"></div>

</body>
</html>