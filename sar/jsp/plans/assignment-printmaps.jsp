<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd"> 
<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn" %>
<%@ taglib uri="http://tiles.apache.org/tags-tiles" prefix="tiles" %>
<%@ taglib uri="http://java.sun.com/jsp/jstl/fmt" prefix="fmt" %>

<html>
<head>
<title>${tenant.publicName} - Map ${assignment.number}</title>
<%@include file="/head.jsp" %>
<script>

function doload() {
org.sarsoft.Loader.queue(function() {
  controller = new org.sarsoft.controller.AssignmentPrintMapController(document.getElementById("maps"), ${assignment.id});
});
}
</script>
<style type="text/css">
</style>
<style type="text/css" media="print">
.noprint { display: none; }
.page {
	page-break-before: always;
	border: 1px solid white;
}
</style>
</head>
<body onload="doload()" class="yui-skin-sam">

<div id="maps" style="width: 100%; height: 100%">
</div>
</body>
</html>