<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd"> 
<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn" %>
<%@ taglib uri="http://tiles.apache.org/tags-tiles" prefix="tiles" %>
<%@ taglib uri="http://java.sun.com/jsp/jstl/fmt" prefix="fmt" %>

<%@page import="org.sarsoft.plans.model.SearchAssignment"%>
<html>
<head>
<title>Sarsoft Map Printout</title>
${head}
<script>

function doload() {
org.sarsoft.Loader.queue(function() {
  controllers = new Array();
  <c:forEach var="assignment" items="${assignments}" varStatus="status">
    controllers[${status.index}] = new Array();
    <c:forEach var="mapConfig" items="${mapConfigs}" varStatus="status2">
      controllers[${status.index}][${status2.index}] = new org.sarsoft.controller.AssignmentPrintMapController(document.getElementById("maps${status.index}_${status2.index}"), ${assignment.id}, {base: "${mapConfig.base}", overlay: "${mapConfig.overlay}", opacity: ${mapConfig.opacity/100}<c:if test="${fn:length(mapConfig.alphaOverlays) gt 0}">, alphaOverlays: "${mapConfig.alphaOverlays}"</c:if>}, ${previousEfforts[status2.index]});
    </c:forEach>
  </c:forEach>
});
}
</script>
<style type="text/css" media="print">
.noprint { display: none; }
.page {
	page-break-before: always;
	border: 1px solid white;
}
</style>
<style tyle="text/css">
@page {
	size: 8.5in 11in;
	margin: 0.25in;
	border: 0pt;
	padding: 0pt;
}
.box {
	border-left: 1px solid black; float: left; height: 100%; overflow: hidden;
	text-align: center;
}
.lbox {
	float: left; height: 100%;
	text-align: center;
}
.label {
	font-size: 50%;
	text-align: left;
	padding-left: 4pt;
}
TABLE.personnel {
	border: 1px solid #AAAAAA;
}

TABLE.personnel TR {
	height: 20pt;
}

TABLE.personnel TD,TH {
	border-left: 1px solid #AAAAAA;
	border-bottom: 1px solid #AAAAAA;
	font-weight: normal;
}

TABLE.comms TR {
	height: 20pt;
}

TABLE.comms TD,TH {
	border-left: 1px solid #AAAAAA;
	border-bottom: 1px solid #AAAAAA;
	font-weight: normal;
}
</style>
</head>
<body onload="doload()" class="yui-skin-sam">

<div class="noprint">
<c:if test="${fn:length(rejected) gt 0}">
<div style="font-weight: bold; color: red">NOTE: The following assignments will not print because they are still in a draft state: &nbsp;
<c:forEach var="reject" items="${rejected}">
${reject.id},&nbsp;
</c:forEach>
</div>
</c:if>
<h3>Check Before You Print!</h3>
<p>It may take a while to load all the map imagery.  Please double check the page and/or print preview window before firing off 100 pages.</p>
</div>

<div>
<h2>Printed Assignments</h2>
<div style="font-size: 150%">
<c:forEach var="assignment" items="${assignments}">
${assignment.id}: ${assignment.timeAllocated} hour, ${assignment.formattedSize} ${assignment.resourceType}<br/>
</c:forEach>
</div>
</div>

<c:set var="printPageBreak" scope="request" value="${true}"/>
<c:forEach var="assignment" items="${assignments}" varStatus="status">
<c:if test="${print104 eq true}">
<c:set var="assignment" scope="request" value="${assignment}"/>
<jsp:include page="assignment-printbody.jsp"/>
</c:if>
<c:forEach var="mapConfig" items="${mapConfigs}" varStatus="status2">
<div id="maps${status.index}_${status2.index}" class="page" style="width: 100%; height: 100%">
</div>
</c:forEach>
</c:forEach>
</body>
</html>