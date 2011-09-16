<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"><%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
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
function doload() {
org.sarsoft.Loader.queue(function() {
  egm = new org.sarsoft.EnhancedGMap();
  map = egm.createMap(document.getElementById('map_canvas'));
  imap = new org.sarsoft.InteractiveMap(map, {standardControls : true, switchableDatum : true});
  plansController = new org.sarsoft.controller.OperationalPeriodMapController(imap, {id : ${period.id}});
  waypointController = new org.sarsoft.controller.SearchWaypointMapController(imap);
  resourceController = new org.sarsoft.controller.ResourceLocationMapController(imap);
  callsignController = new org.sarsoft.controller.CallsignMapController(imap);
  clueController = new org.sarsoft.controller.ClueLocationMapController(imap);
  plansController.setupWidget = new org.sarsoft.view.MapSetupWidget(imap);
  configWidget = new org.sarsoft.view.PersistedConfigWidget(imap, true);
  configWidget.loadConfig();
  setInterval("imap.timer()", 10000);
});
}
</script>
<link rel="stylesheet" type="text/css" href="/static/css/yui.css"/>
<link rel="stylesheet" type="text/css" href="/static/css/AppBase.css"/>
</head>
<body onload="doload()" onunload="GUnload()" class="yui-skin-sam" style="border: 0px; margin: 0px; padding: 0px">
<div id="map_canvas" style="width: 100%; height: 100%"></div>

</body>
</html>