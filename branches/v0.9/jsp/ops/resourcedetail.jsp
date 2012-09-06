<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn" %>
<%@page import="org.sarsoft.ops.model.Resource"%>
<%@page import="org.sarsoft.common.model.Tenant.Permission"%>
<% pageContext.setAttribute("none", Permission.NONE); %>
<% pageContext.setAttribute("read", Permission.READ); %>
<% pageContext.setAttribute("write", Permission.WRITE); %>
<% pageContext.setAttribute("admin", Permission.ADMIN); %>

<h2>Resource ${resource.name}: ${period.description}</h2>

<c:choose>
<c:when test="${resource.assignment ne null}">
Attached to <a href="/assignment/${resource.assignment.id}">assignment ${resource.assignment.id}</a>.  Please visit the assignment page to change its section.
</c:when>
<c:otherwise>
Not currently on assignment.
</c:otherwise>
</c:choose>

<br/><br/>

<div style="width: 30em; float: left">

<c:choose>
<c:when test="${resource.position ne null}">
Latest position: <span id="latestposition"></span> at ${resource.lastFix}
<script>
document.getElementById('latestposition').innerHTML = GeoUtil.GLatLngToUTM(GeoUtil.fromWGS84(new google.maps.LatLng(${resource.position.lat}, ${resource.position.lng}))).toHTMLString();
</script>
</c:when>
<c:otherwise>
${resource.name}'s location is unknown.
</c:otherwise>
</c:choose>

<br/>

<form method="POST" action="/resource/${resource.id}">
<table border="0">
<tr><td>Name:</td><td><input type="text" name="name" size="10" value="${resource.name}"/></td></tr>
<tr><td>Type:</td><td><select name="type">
   <c:forEach var="type" items="<%= org.sarsoft.ops.model.Resource.Type.values() %>">
     <option value="${type}"<c:if test="${resource.type == type}"> selected="selected"</c:if>>${type}</option>
   </c:forEach>
</select></td></tr>
<tr><td>Agency:</td><td><input type="text" name="agency" value="${resource.agency}" size="10"/></td></tr>
<tr><td>Callsign:</td><td><input type="text" name="callsign" value="${resource.callsign}" size="10"/></td></tr>
<tr><td>SPOT Id:</td><td><input type="text" name="spotId" size="10" value="${resource.spotId}"/></td></tr>
<tr><td>SPOT Password:</td><td><input type="text" name="spotPassword" size="10" value="${resource.spotPassword}"></td></tr>
</table>
<input type="submit" value="Update"/>
</form>

<br/>
<br/>

Current Location:<br/>
<input type="text" size="2" name="utm_zone" id="utm_zone"/><span class="hint">zone</span>&nbsp;<input type="text" size="9" name="utm_e" id="utm_e"/><span class="hint">E</span>&nbsp;<input type="text" size="9" name="utm_n" id="utm_n"/><span class="hint">N</span>
<button onclick="updateLocation()">Update Location</button>

<form method="POST" action="/resource/${resource.id}/position" name="updatePosition">
<input type="hidden" name="lat" id="lat"/>
<input type="hidden" name="lng" id="lng"/>
</form>
<br/>
<br/>

You can delete ${resource.name}, but this action cannot be undone.
<form method="POST" action="/resource/${resource.id}">
<input type="hidden" name="action" value="DELETE"/>
<input type="hidden" name="name" value="whatever"/>
<input type="hidden" name="type" value="whatever"/>
<input type="submit" value="Delete"/>
</form>

<br/>
<br/>
<br/>
<a href="/resource/">Return to List of All Resources</a><br/>

</div>


<div id="map">
  <div id="mapview" style="width: 500px; height: 450px; float: left;">
  </div>
</div>


<script>
org.sarsoft.Loader.queue(function() {

<c:if test="${userPermissionLevel ne write and userPermissionLevel ne admin}">
$('input').attr("disabled", true);
</c:if>
	
  var map = org.sarsoft.EnhancedGMap.createMap(document.getElementById('mapview'));
  var imap = new org.sarsoft.InteractiveMap(map);

  rvmc = new org.sarsoft.controller.ResourceViewMapController(${resource.id}, imap);
  waypointController = new org.sarsoft.controller.SearchWaypointMapController(imap);
  configWidget = new org.sarsoft.view.PersistedConfigWidget(imap);
  configWidget.loadConfig();
});

function updateLocation() {
	var zone = document.getElementById('utm_zone').value;
	if(zone != null && zone.length > 0) {
		if(zone.length > 2) zone = zone.substring(0, 2);
		var e = document.getElementById('utm_e').value;
		var n = document.getElementById('utm_n').value;
		var gll = GeoUtil.toWGS84(GeoUtil.UTMToGLatLng({e: e, n: n, zone: zone}));
		document.getElementById('lat').value = gll.lat();
		document.getElementById('lng').value = gll.lng();
	}
	document.forms["updatePosition"].submit();
}

<c:if test="${resource.position ne null}">

var utm = GeoUtil.GLatLngToUTM(GeoUtil.fromWGS84(new google.maps.LatLng(${resource.position.lat}, ${resource.position.lng})));
document.getElementById('utm_zone').value = utm.zone;
document.getElementById('utm_e').value = utm.e;
document.getElementById('utm_n').value = utm.n;

</c:if>
</script>