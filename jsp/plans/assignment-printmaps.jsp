<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn" %>
<%@ taglib uri="http://tiles.apache.org/tags-tiles" prefix="tiles" %>
<%@ taglib uri="http://java.sun.com/jsp/jstl/fmt" prefix="fmt" %>

<%@page import="org.sarsoft.plans.model.SearchAssignment"%>
<html>
<head>
<title>${search.publicName} - Map ${assignment.id}</title>
${mapjs}
<script src="/static/js/yui.js"></script>
<script src="/app/constants.js"></script>
<script src="/static/js/common.js"></script>
<script src="/static/js/maps.js"></script>
<script src="/static/js/plans.js"></script>
<link rel="stylesheet" type="text/css" href="/static/css/yui.css"/>
<link rel="stylesheet" type="text/css" href="/static/css/AppBase.css"/>
<script>

function doload() {
org.sarsoft.Loader.queue(function() {
  controller = new org.sarsoft.controller.AssignmentPrintMapController(document.getElementById("maps"), ${assignment.id});
});
}
</script>
<style type="text/css" media="print">
.noprint { display: none; }
</style>
</head>
<body onload="doload()" class="yui-skin-sam" style="padding: 1px">

<div class="noprint">
Click on the page size control in the top right toolbar.
</div>
<div id="maps">
</div>
</body>
</html>