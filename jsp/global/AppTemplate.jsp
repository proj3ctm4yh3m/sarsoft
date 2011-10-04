<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn" %>
<%@ taglib uri="http://tiles.apache.org/tags-tiles" prefix="tiles" %>
<html>
<head>
<title>Search & Rescue Planning Software</title>
${mapjs}
<script src="/static/js/yui.js"></script>
<script src="/static/js/jquery-1.6.4.js"></script>
<script src="/app/constants.js"></script>
<script src="/static/js/common.js"></script>
<script src="/static/js/maps.js"></script>
<script src="/static/js/plans.js"></script>
<script src="/static/js/ops.js"></script>

<link rel="stylesheet" type="text/css" href="/static/css/yui.css"/>
<link rel="stylesheet" type="text/css" href="/static/css/AppBase.css"/>
</head>
<body class="yui-skin-sam">
<div class="headercontainer">

<tiles:importAttribute name="app"/>
<div class="header">
<div style="font-weight: bold; float: left"><a href="/" class="sarsoft">${search.description}</a>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
<c:choose>
 <c:when test="${app eq 'plans'}">
  <a href="/app/operationalperiod">Plans</a>
 </c:when>
 <c:when test="${app eq 'ops'}">
  <a href="/">Operations</a>
 </c:when>
 <c:when test="${app eq 'admin'}">
  <a href="/app/admin">Admin Console</a>
 </c:when>
</c:choose>
<c:choose>
 <c:when test="${assignment ne null}">
  &nbsp;:&nbsp;<a href="/app/operationalperiod/${assignment.operationalPeriod.id}">${assignment.operationalPeriod.description}</a>&nbsp;:&nbsp;Assignment ${assignment.id}
 </c:when>
 <c:when test="${period ne null}">
  &nbsp;:&nbsp;${period.description}
 </c:when>
 <c:when test="${resources ne null}">
 	&nbsp;:&nbsp;Resources
 </c:when>
 <c:when test="${resource ne null}">
 	&nbsp;:&nbsp;<a href="/app/resource/">Resources</a>&nbsp;:&nbsp;${resource.name}
 </c:when>
 <c:when test="${clues ne null}">
  &nbsp;:&nbspClue Log
 </c:when>
 <c:when test="${clue ne null}">
 	&nbsp;:&nbsp;<a href="/app/clue">Clue Log</a>&nbsp;:&nbsp;Clue ${clue.id}
 </c:when>
</c:choose>
</div>
<div style="font-weight: bold; text-align: right; float: right; margin-right: 3em"><span style="font-size: 200%">&nbsp;</span>SARSOFT&nbsp;<%= org.sarsoft.common.util.Constants.version %></div>
</div>
<div class="headerbottom"></div>
</div>
<div class="content">
<tiles:insertAttribute name="content"/>
</div>
</body>
</html>