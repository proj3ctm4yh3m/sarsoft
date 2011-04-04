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
  emap = new org.sarsoft.EditableGMap(map, document.getElementById("infodiv"));
  plansController = new org.sarsoft.controller.OperationalPeriodMapController(emap, {id : ${period.id}});
  setInterval("plansController.timer()", 10000);
});
}
</script>
<link rel="stylesheet" type="text/css" href="/static/css/AppBase.css"/>
</head>
<body onload="doload()" onunload="GUnload()" class="yui-skin-sam" style="border: 0px; margin: 0px; padding: 0px">
<div id="map_canvas" style="width: 100%; height: 100%"></div>

	<div id="infodiv" style="width: 15em; height: 2.5em; z-index: 200; position: absolute; top: 30; right: 0; color: #FF9933;" class="noprint">
		<div style="width: 100%; height: 100%; z-index: -100; background-color: black; filter: alpha(opacity=40); opacity: .4"></div>
		<div id="infodiv_position" style="width: 100%; height: 1em; position: absolute; top: 0px; font-weight: bold"></div>
		<div id="infodiv_message" style="width: 100%; height: 1em; position: absolute; top: 1.3em"></div>
	</div>

</body>
</html>