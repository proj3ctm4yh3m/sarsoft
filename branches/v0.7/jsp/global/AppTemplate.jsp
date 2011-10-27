<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn" %>
<%@ taglib uri="http://tiles.apache.org/tags-tiles" prefix="tiles" %>
<html>
<head>
<title>${version}</title>
${head}
</head>
<body class="yui-skin-sam">

<tiles:importAttribute name="app"/>
<div class="header" style="${headerStyle}">
<div style="font-weight: bold; position: absolute; top: 0px; right: 20px"><span style="font-size: 200%">${version}</span></div>
<h1 style="margin: 0; padding: 0; border: 0"><a href="/" class="sarsoft">${tenant.description}</a>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
<span style="font-size: smaller">
<c:choose>
 <c:when test="${app eq 'plans'}">
  <a href="/app/operationalperiod">Plans</a>
 </c:when>
 <c:when test="${app eq 'ops'}">
  <a href="/">Operations</a>
 </c:when>
 <c:when test="${app eq 'admin'}">
  Administration & Sharing
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
</span>
</h1>
</div>
<div>
<tiles:insertAttribute name="content"/>
</div>
</body>
</html>