<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd"> 
<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn" %>
<%@ taglib uri="http://tiles.apache.org/tags-tiles" prefix="tiles" %>

<html>
<head>
<title>Sarsoft Map Printout</title>
<%@include file="/head.jsp" %>
<script>
function doload() {
org.sarsoft.Loader.queue(function() {
  bulkprint = new org.sarsoft.AssignmentPrintMapController($('#maps')<c:if test="${not empty ids}">, "${ids}".split(",")</c:if>);
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
<h3>Check Before You Print!</h3>
<p>It may take a while to load all the map imagery.  Please double check the page and/or print preview window before firing off 100 pages.</p>
</div>

<div id="maps">
</div>
</body>
</html>