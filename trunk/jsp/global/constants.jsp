<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn" %>

if(typeof org == "undefined") org = new Object();
if(typeof org.sarsoft == "undefined") org.sarsoft = new Object();

org.sarsoft.Constants = ${json}

if(org.sarsoft.EnhancedGMap == undefined) org.sarsoft.EnhancedGMap = function() {}
org.sarsoft.EnhancedGMap.defaultMapTypes = [
<c:forEach var="mapSource" items="${mapSources}" varStatus="status">
	<c:if test="${status.index gt 0}">,</c:if>{name : "${mapSource.name}", type: "${mapSource.type}", copyright: "${mapSource.copyright}", minresolution: ${mapSource.minresolution}, maxresolution: ${mapSource.maxresolution}, png: ${mapSource.png}, template: "${mapSource.template}"}
</c:forEach>
];