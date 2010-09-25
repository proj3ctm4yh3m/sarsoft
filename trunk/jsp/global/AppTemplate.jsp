<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn" %>
<%@ taglib uri="http://tiles.apache.org/tags-tiles" prefix="tiles" %>
<html>
<head>
<title>Search & Rescue Planning Software</title>
<script src="http://maps.google.com/maps?file=api&amp;v=2&amp;key=${mapkey}" type="text/javascript"></script>
<script type="text/javascript" src="http://yui.yahooapis.com/2.7.0/build/yuiloader/yuiloader-min.js" ></script>
<script src="/app/constants.js"></script>
<script src="/static/js/common.js"></script>
<script src="/static/js/maps.js"></script>
<script src="/static/js/plans.js"></script>
<script src="/static/js/admin.js"></script>
<script src="/static/js/uilib.js"></script>
<script src="/static/js/ops.js"></script>

<link rel="stylesheet" type="text/css" href="http://yui.yahooapis.com/2.7.0/build/fonts/fonts-min.css">
<link rel="stylesheet" type="text/css" href="http://yui.yahooapis.com/2.7.0/build/menu/assets/skins/sam/menu.css">
<link rel="stylesheet" type="text/css" href="/static/css/AppBase.css"/>
</head>
<body class="yui-skin-sam">
<div class="headercontainer">

<tiles:importAttribute name="app"/>
<div class="header">
<div style="font-weight: bold; float: left"><a href="/" class="sarsoft">SARSOFT</a>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
<c:choose>
 <c:when test="${app eq 'plans'}">
  <a href="/app/operationalperiod">Plans</a>
 </c:when>
 <c:when test="${app eq 'admin'}">
  <a href="/app/admin">admin console</a>
 </c:when>
</c:choose>
<c:choose>
 <c:when test="${assignment ne null}">
  &nbsp;:&nbsp;<a href="/app/operationalperiod/${assignment.operationalPeriod.id}">${assignment.operationalPeriod.description}</a>&nbsp;:&nbsp;Assignment ${assignment.id}
 </c:when>
 <c:when test="${period ne null}">
  &nbsp;:&nbsp;${period.description}
 </c:when>
</c:choose>
</div>
<div style="font-weight: bold; text-align: right; float: right; margin-right: 3em"><span style="font-size: 200%">&nbsp;</span>${searchName}</div>
</div>
<div class="headerbottom"></div>
</div>
<div class="content">
<tiles:insertAttribute name="content"/>
</div>
</body>
</html>