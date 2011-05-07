<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn" %>
<%@page contentType="text/javascript" %>
<%@page import="org.sarsoft.admin.model.MapSource"%>
<% pageContext.setAttribute("tile", MapSource.Type.TILE); %>


if(typeof org == "undefined") org = new Object();
if(typeof org.sarsoft == "undefined") org.sarsoft = new Object();
if(typeof org.sarsoft.map == "undefined") org.sarsoft.map = new Object();

org.sarsoft.Constants = ${json}

org.sarsoft.map._default = new Object();
org.sarsoft.map._default.zoom = ${defaultZoom};
org.sarsoft.map._default.lat = ${defaultLat};
org.sarsoft.map._default.lng = ${defaultLng};

if(typeof org.sarsoft.EnhancedGMap == "undefined") org.sarsoft.EnhancedGMap = function() {}
org.sarsoft.EnhancedGMap.defaultMapTypes = [
<c:forEach var="mapSource" items="${mapSources}" varStatus="status">
	<c:if test="${status.index gt 0}">,</c:if>{name : "${mapSource.name}", type: "${mapSource.type}", copyright: "${mapSource.copyright}", minresolution: ${mapSource.minresolution}, maxresolution: ${mapSource.maxresolution}, png: ${mapSource.png}, template: <c:choose><c:when test="${mapSource.type eq tile and tileCacheEnabled eq true and fn:startsWith(mapSource.template, 'http')}">"/resource/imagery/tilecache/${mapSource.name}/{Z}/{X}/{Y}.png"</c:when><c:otherwise>"${mapSource.template}"</c:otherwise></c:choose>}
</c:forEach>
];

org.sarsoft.EnhancedGMap.geoRefImages = [
<c:forEach var="image" items="${geoRefImages}" varStatus="status">
<c:if test="${status.index gt 0}">,</c:if>{name : "${image.name}",  id: ${image.id}, angle: ${image.angle}, scale : ${image.scale}, originx: ${image.originx}, originy: ${image.originy}, originlat: ${image.originlat}, originlng: ${image.originlng}, width: ${image.width}, height: ${image.height}}
</c:forEach>
];

org.sarsoft.map.datum = "WGS84";