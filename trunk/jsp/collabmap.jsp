<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"><%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<html>
<head>
${head}
<script type="text/javascript">
function doload() {
org.sarsoft.Loader.queue(function() {
  map = org.sarsoft.EnhancedGMap.createMap(document.getElementById('map_canvas'));
  imap = new org.sarsoft.InteractiveMap(map, {standardControls : true, switchableDatum : true});
  markupController = new org.sarsoft.controller.MarkupMapController(imap, true);
  configWidget = new org.sarsoft.view.PersistedConfigWidget(imap, true);
  configWidget.loadConfig();
  setInterval("imap.timer()", 10000);
});
}
</script>
</head>
<body onload="doload()" onunload="GUnload()" class="yui-skin-sam" style="border: 0px; margin: 0px; padding: 0px">
<div id="map_canvas" style="width: 100%; height: 100%"></div>

</body>
</html>