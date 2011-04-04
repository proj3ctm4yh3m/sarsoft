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
<link rel="stylesheet" type="text/css" href="/static/css/AppBase.css"/>
<script>

org.sarsoft.Loader.queue(function() {
  controller = new org.sarsoft.controller.AssignmentPrintMapController(document.getElementById("maps"), ${assignment.id});
});

function setSize() {
  controller.setSize(document.getElementById("width").value, document.getElementById("height").value);
}

</script>
<style type="text/css" media="print">
.noprint { display: none; }
</style>
</head>
<body>

<div class="noprint">
Width: <input type="text" size="2" id="width" value="8in"/><br/>
Height: <input type="text" size="2" id="height" value="10in"/><br/>
<button onclick="setSize()">Adjust</button>
</div>
<div id="maps">
</div>
</body>
</html>