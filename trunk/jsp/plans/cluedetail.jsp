<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn" %>

<h2>Clue ${clue.id}: ${clue.summary}</h2>


<div style="width: 30em; float: left">


<form method="POST" action="/app/clue/${clue.id}">
<table border="0">
<tr><td valign="top">Summary:</td><td><input type="text" name="summary" size="20" value="${clue.summary}"/></td></tr>
<tr><td valign="top">Description:</td><td><textarea rows="5" cols="40" name="description">${clue.description}</textarea></td></tr>
<tr><td valign="top">Found By:</td><td>
 <select name="assignmentid">
  <option value="">--</option>
  <c:forEach var="assignment" items="${assignments}">
   <option value="${assignment.id}"<c:if test="${assignment.id eq clue.assignmentId}"> selected="selected"</c:if>>${assignment.id}</option>
  </c:forEach>
 </select>
</td></tr>
<tr><td valign="top">Location:</td><td><textarea rows="3" cols="40" name="location">${clue.location}</textarea><br/><span class="hint">Descriptive location, e.g. "in storm drain"</span></td></tr>
</td></tr>
</table>
<input type="submit" value="Update Details"/>
</form>

<br/><br/>
Location Found:<br/>
<input type="text" size="2" name="utm_zone" id="utm_zone"/><span class="hint">zone</span>&nbsp;<input type="text" size="9" name="utm_e" id="utm_e"/><span class="hint">E</span>&nbsp;<input type="text" size="9" name="utm_n" id="utm_n"/><span class="hint">N</span>
<button onclick="updateLocation()">Update Location</button>

<form method="POST" action="/app/clue/${clue.id}/position" name="updatePosition">
<input type="hidden" name="lat" id="lat"/>
<input type="hidden" name="lng" id="lng"/>
</form>
<br/>
<br/>
You can delete Clue ${clue.id}, but this action cannot be undone.
<form method="POST" action="/app/clue/${clue.id}">
<input type="hidden" name="action" value="DELETE"/>
<input type="hidden" name="summary" value="whatever"/>
<input type="hidden" name="description" value="whatever"/>
<input type="hidden" name="location" value="whatever"/>
<input type="submit" value="Delete"/>
</form>

<br/>
<br/>
<a href="/app/clue">Return to Clue Log</a><br/>

</div>


<div id="map">
  <div id="mapview" style="width: 500px; height: 450px; float: left;">
  </div>
</div>

<script>

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

<c:if test="${clue.position ne null}">

var utm = GeoUtil.GLatLngToUTM(GeoUtil.fromWGS84(new GLatLng(${clue.position.lat}, ${clue.position.lng})));
document.getElementById('utm_zone').value = utm.zone;
document.getElementById('utm_e').value = utm.e;
document.getElementById('utm_n').value = utm.n;

org.sarsoft.Loader.queue(function() {
  
  var map = new org.sarsoft.EnhancedGMap().createMap(document.getElementById('mapview'));
  var imap = new org.sarsoft.InteractiveMap(map);

  cvmc = new org.sarsoft.controller.ClueViewMapController(${clue.id}, imap);
  waypointController = new org.sarsoft.controller.SearchWaypointMapController(imap);
  configWidget = new org.sarsoft.view.PersistedConfigWidget(imap);
  configWidget.loadConfig();
  
});
</script>
</c:if>