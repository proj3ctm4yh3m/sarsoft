<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn" %>
<%@ taglib uri="http://packtag.sf.net" prefix="pack" %>
<%@page import="org.sarsoft.common.util.RuntimeProperties"%>
<% pageContext.setAttribute("pack", Boolean.parseBoolean(RuntimeProperties.getProperty("sarsoft.js.pack"))); %>
<title>${version}</title>

<script>
sarsoft=${js_sarsoft}
</script>

<c:choose>
<c:when test="${js_server eq 'local'}">
<script src="/static/js/yui.js"></script>
<script src="/static/js/jquery-1.6.4.js"></script>
</c:when>
<c:otherwise>
<script type="text/javascript" src="http://yui.yahooapis.com/combo?2.9.0/build/yahoo-dom-event/yahoo-dom-event.js&2.9.0/build/connection/connection-min.js&2.9.0/build/dragdrop/dragdrop-min.js&2.9.0/build/container/container-min.js&2.9.0/build/cookie/cookie-min.js&2.9.0/build/datasource/datasource-min.js&2.9.0/build/element/element-min.js&2.9.0/build/datatable/datatable-min.js&2.9.0/build/json/json-min.js&2.9.0/build/menu/menu-min.js&2.9.0/build/slider/slider-min.js&2.9.0/build/tabview/tabview-min.js"></script>
<script src="http://code.jquery.com/jquery-1.6.4.js"></script>
</c:otherwise>
</c:choose>
<c:choose>
<c:when test="${js_mapserver eq 'google'}">
<script src="http://maps.googleapis.com/maps/api/js?sensor=false&libraries=geometry,drawing" type="text/javascript"></script></c:when>
<c:otherwise>
<script src="/static/js/openlayers.js"></script>
<script src="/static/js/gmapolwrapper.js"></script>
</c:otherwise>
</c:choose>

<pack:script enabled="${pack}">
	<src>/static/js/jquery.event.drag-1.5.js</src>
	<src>/static/js/common.js</src>
	<src>/static/js/geo.js</src>
	<src>/static/js/maps.js</src>
	<src>/static/js/core.js</src>
	<src>/static/js/markup.js</src>
	<src>/static/js/plans.js</src>
	<src>/static/js/imaging.js</src>
</pack:script>
<!--[if gte IE 9]>
<style type="text/css">
 @media print { img.olTileImage {position: absolute !important;}
 img.olAlphaImage {position: absolute !important;}
 div.olAlphaImage {position: absolute !important;}}
</style>
<![endif]-->
<pack:style>
	<src>/static/css/yui.css</src>
	<src>/static/css/AppBase.css</src>
</pack:style>

<c:if test="${fn:length(preload) gt 0}">
<script type="text/javascript">
org = org || {};
org.sarsoft = org.sarsoft || {};
org.sarsoft.preload = ${preload};
</script>
</c:if>