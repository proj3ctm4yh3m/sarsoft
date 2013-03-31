<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn" %>
<%@ taglib uri="http://tiles.apache.org/tags-tiles" prefix="tiles" %>
<html>
<head>
<%@include file="head.jsp" %>
</head>
<body class="yui-skin-sam">

<tiles:importAttribute name="app"/>
<tiles:importAttribute name="subHeader"/>

<div class="header noprint" style="background-image: url(/static/images/header.jpg); background-repeat: repeat-x;">
<div style="font-weight: bold; margin-left: 1.5em;"><span style="font-size: 200%">${version}</span></div>
</div>
<div style="padding-left: 1.5em">
<tiles:insertAttribute name="content"/>
</div>
</body>
</html>