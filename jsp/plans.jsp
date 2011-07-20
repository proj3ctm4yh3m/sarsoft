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
  emap = new org.sarsoft.EditableGMap(map, true);
  mapController = new org.sarsoft.MapController(emap);
  plansController = new org.sarsoft.controller.OperationalPeriodMapController(emap, {id : ${period.id}}, mapController);
  waypointController = new org.sarsoft.controller.SearchWaypointMapController(mapController);
  resourceController = new org.sarsoft.controller.ResourceLocationMapController(mapController);
  callsignController = new org.sarsoft.controller.CallsignMapController(mapController);
  clueController = new org.sarsoft.controller.ClueLocationMapController(mapController);
  plansController.setupWidget = new org.sarsoft.view.MapSetupWidget(mapController);
  configWidget = new org.sarsoft.view.PersistedConfigWidget(mapController, true);
  configWidget.loadConfig();
  setInterval("mapController.timer()", 10000);
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