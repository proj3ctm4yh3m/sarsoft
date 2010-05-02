<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn" %>
<%@ taglib uri="http://tiles.apache.org/tags-tiles" prefix="tiles" %>
<%@ taglib uri="http://java.sun.com/jsp/jstl/fmt" prefix="fmt" %>

<%@page import="org.sarsoft.plans.model.SearchAssignment"%>
<html>
<head>
<title>Assigment Number ${assignment.name}</title>
<script src="http://maps.google.com/maps?file=api&amp;v=2&amp;key=${mapkey}" type="text/javascript"></script>
<script type="text/javascript" src="http://yui.yahooapis.com/2.7.0/build/yuiloader/yuiloader-min.js" ></script>
<script src="/app/constants.js"></script>
<script src="/static/js/common.js"></script>
<script src="/static/js/maps.js"></script>
<script src="/static/js/plans.js"></script>
<link rel="stylesheet" type="text/css" href="/static/css/AppBase.css"/>
<style tyle="text/css">
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
<style type="text/css" media="print">
@page {
	size: 8.5in 11in;
	margin: 0pt;
	border: 0pt;
	padding: 0pt;
}
.page {
	page-break-before: always;
	border: 1px solid white;
}
</style>
</head>
<body>

<c:forEach var="copy" items='<%= new String[][] {{"White Copy - Team", "#DDDDDD"}, {"Yellow Copy - Operations","yellow"}, {"Pink Copy - Plans","pink"}, {"Green Copy - Communications","green"}} %>' varStatus='status'>
<div style="height: 10in; font-size: 12pt" <c:if test="${status.index ne 0}">class="page"</c:if>>

<div style="width: 100%; height: 16pt; border-top: 2px solid ${copy[1]}; padding: 0px;">
	<div style="width: 30%; float: left">${copy[0]}</div>
	<div style="width: 69%; float: left; border-top: 12px solid ${copy[1]}"></div>
</div>

<div style="width: 100%; height: 24pt; border-bottom: 1px solid black">
	<div class="lbox" style="width: 25%;"><b>TEAM ASSIGNMENT</b></div>
	<div class="box" style="width: 25%"><div class="label">1. INCIDENT NAME</div>CURRENT SEARCH</div>
	<div class="box" style="width: 25%"><div class="label">2. OPERATIONAL PERIOD</div>${assignment.operationalPeriod.id}</div>
	<div class="box" style="width: 24%"><div class="label">3. ASSIGNMENT NUMBER</div>${assignment.name}</div>
</div>

<div style="width: 100%; height: 16pt; border-bottom: 1px solid black">
	<div class="lbox" style="width: 100%; text-align: left"><div class="label" style="float: left">4. RESOURCE TYPE</div>&nbsp;&nbsp;${assignment.resourceType}</div>
</div>

<div style="width: 100%; height: 135pt; border-bottom: 1px solid black">
<div class="label">5. PERSONNEL ASSIGNED <span style="width: 144pt">&nbsp;</span> L -- TEAM LEADER &nbsp;&nbsp; M -- MEDICAL</div>

<table cellspacing="0" class="personnel" style="width: 100%">
<tr><th style="width: 2%">&nbsp;</th><th style="width: 33%">NAME</th><th style="width: 15%">AGENCY</th><th style="width: 2%">&nbsp;</th><th style="width: 33%">NAME</th><th style="width: 15%">AGENCY</th></tr>
<tr><td>1</td><td>&nbsp;</td><td>&nbsp;</td><td>6</td><td>&nbsp;</td><td>&nbsp;</td></tr>
<tr><td>2</td><td>&nbsp;</td><td>&nbsp;</td><td>7</td><td>&nbsp;</td><td>&nbsp;</td></tr>
<tr><td>2</td><td>&nbsp;</td><td>&nbsp;</td><td>8</td><td>&nbsp;</td><td>&nbsp;</td></tr>
<tr><td>4</td><td>&nbsp;</td><td>&nbsp;</td><td>9</td><td>&nbsp;</td><td>&nbsp;</td></tr>
<tr><td>5</td><td>&nbsp;</td><td>&nbsp;</td><td colspan="3">[&nbsp;&nbsp;] additional names attached</td></tr>
</table>
</div>

<div style="width: 100%; height: 144pt; border-bottom: 1px dotted black">
	<div class="lbox" style="width: 100%; text-align: left"><div class="label">6. ASSIGNMENT</div>
	<div style="white-space: pre">${assignment.details}</div>
	  </div>
</div>
<div style="width: 100%; height: 14pt; border-bottom: 1px solid black">
	<div style="float: right">MAP(S) ATTACHED</div>
</div>

<div style="width: 100%; height: 72pt; border-bottom: 1px solid black">
	<div class="lbox" style="width: 100%; text-align: left"><div class="label">7. PREVIOUS AND PRESENT SEARCH EFFORTS IN AREA</div>&nbsp;</div>
</div>

<div style="width: 100%; height: 24pt; border-bottom: 1px solid black">
	<div class="lbox" style="width: 25%"><div class="label">8. TIME ALLOCATED</div>${assignment.timeAllocated} hours</div>
	<div class="box" style="width: 30%"><div class="label">9. SIZE OF ASSIGNMENT</div>${assignment.area} km&sup2; / ${assignment.routeDistance} km</div>
	<div class="box" style="width: 44%"><div class="label">10. EXPECTED P.O.D.</div><b>${assignment.responsivePOD}</b> (responsive), <b>${assignment.unresponsivePOD}</b> (unresponsive)</div>
</div>

<div style="width: 100%; height: 60pt; border-bottom: 1px solid black">
	<div class="lbox" style="width: 100%"><div class="label">11. DROP OFF AND PICKUP INSTRUCTIONS</div>&nbsp;</div>
</div>

<div style="width: 100%; height: 16pt; border-bottom: 1px solid #CCCCCC">
	<div class="lbox" style="width: 30%"><div class="label">12. COMMUNICATIONS</div></div>
	<div class="box" style="width: 69%"><div class="label">RADIO CALL</div></div>
</div>
<table style="width: 100%; border-bottom: 1px solid black cellspacing="0" class="comms">
<tr><th style="width: 25%" class="label">FUNCTION</th><th style="width: 25%" class="label">FREQUENCY</th><th style="width: 30%" class="label">CHANNEL DESCRIPTION</th><th style="width: 20%" class="label">CHANNEL</th></tr>
<tr><td class="label">COMMAND (TEAM -- BASE)</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>
<tr><td class="label">COMMAND (TEAM -- TEAM)</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>
</table>

<div style="width: 100%; height: 24pt; border-bottom: 1px solid black">
	<div class="lbox" style="width: 65%"><div class="label">13. PREPARED BY</div>${assignment.preparedBy}</div>
	<div class="box" style="width: 34%"><div class="label">14 AND 15. DATE PREPARED</div><fmt:formatDate value="${assignment.preparedOn}" type="both" timeStyle="short" dateStyle="short"/></div>
</div>

<div style="width: 100%; height: 36pt; border-bottom: 1px solid black">
	<div class="lbox" style="width: 100%"><div class="label">16. EQUIPMENT ISSUED</div>&nbsp;</div>
</div>

<div style="width: 100%; height: 36pt; border-bottom: 1px solid black">
	<div class="lbox" style="width: 33%"><div class="label">17. BRIEFER</div>&nbsp;</div>
	<div class="box" style="width: 22%"><div class="label">18. TIME BRIEFED</div>&nbsp;</div>
	<div class="box" style="width: 22%"><div class="label">19. TIME OUT</div>&nbsp;</div>
	<div class="box" style="width: 22%"><div class="label">20. TIME RETURNED</div>&nbsp;</div>
</div>

<div style="width: 100%; height: 52pt; border-bottom: 1px solid black">
	<div class="lbox" style="width: 19%; font-size: 200%"><b>SAR 104</b></div>
	<div class="box" style="width: 25%">
		<div class="label" style="float: left">COPIES</div>
		<div style="float: right; font-size: 90%; text-align: left">
			[&nbsp;&nbsp;] PLANS<br/>
			[&nbsp;&nbsp;] COMMUNICATIONS<br/>
			[&nbsp;&nbsp;] OPERATIONS<br/>
			[&nbsp;&nbsp;] TEAM<br/>
		</div>
	</div>
	<div class="box" style="width: 55%">
		<div class="label">NOTES</div>
	</div>
</div>

<div class="label">USE CARBON SHEETS WHEN FILLING IN MISSING DATA.  PRESS HARD 4 COPIES.</div>

</div>

</c:forEach>

</body>
</html>