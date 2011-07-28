<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn" %>
<%@page import="org.sarsoft.plans.model.Clue"%>

<h2>Clue Log for ${search.description}</h2>
<table border="0">
<c:forEach var="clue" items="${clues}">
<tr><td colspan="2" style="padding-top: 10px; font-weight: bold; font-size: larger">${clue.id}: ${clue.summary}</td></tr>
<tr><td style="padding-left: 2em" valign="top">Description</td><td>${clue.description}</td></tr>
<tr><td style="padding-left: 2em" valign="top">Found By:</td><td><c:if test="${clue.assignment ne null}">Team ${clue.assignmentId}</c:if></td></tr>
<tr><td style="padding-left: 2em" valign="top">Location:</td><td><c:if test="${clue.location ne null}">${clue.location}<br/></c:if>
<c:if test="${clue.position ne null}"><span id="utm_zone_${clue.id}"></span>&nbsp;<span id="utm_e_${clue.id}"></span><span class="hint">E</span>&nbsp;<span id="utm_n_${clue.id}"></span><span class="hint">N</span></c:if>
</td></tr>
<tr><td style="padding-left: 2em">Instructions:</td><td>${clue.instructions}</td></tr>
</c:forEach>
</table>

<script>
<c:forEach var="clue" items="${clues}">

<c:if test="${clue.position ne null}">
var utm = GeoUtil.GLatLngToUTM(GeoUtil.fromWGS84(new GLatLng(${clue.position.lat}, ${clue.position.lng})));
document.getElementById('utm_zone_${clue.id}').innerHTML = utm.zone;
document.getElementById('utm_e_${clue.id}').innerHTML = utm.e;
document.getElementById('utm_n_${clue.id}').innerHTML = utm.n;
</c:if>
</c:forEach>
</script>