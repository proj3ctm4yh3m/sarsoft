<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn" %>

<script language="javascript">
function gotoAssignment() {
    var select = document.getElementById('assignmentid');
	window.location = "/app/assignment/" + select.options[select.selectedIndex].value;
}
org.sarsoft.Loader.queue(function() {
gpxdlg = new org.sarsoft.view.BulkGPXDlg();
});
</script>

<h1>Welcome to Sarsoft!</h1>

<c:if test="${account ne null}">
Logged in as ${account.email}.  <a href="/app/logout">Logout</a><br/>
</c:if>
Working on ${search.description}.  <a href="/app/setsearch">Change</a>
<c:choose>
<c:when test="${hosted eq false}">
<h4>Administration</h4>
<ul>
 <li><a href="/app/search">Search Admin</a></li>
</ul>
</c:when>
<c:when test="${search.account.name eq username}">
<h4>Administration</h4>
<ul>
 <li><a href="/app/search">Search Admin</a></li>
</ul>
</c:when>
</c:choose>
<h4>Plans</h4>
<ul>
 <li>Current Operations: &nbsp;<a href="/app/operationalperiod/${lastperiod.id}/map">Map</a>&nbsp;|&nbsp;<a href="/app/operationalperiod/${lastperiod.id}">List</a></li>
 <li>Jump to assignment&nbsp;&nbsp;&nbsp;<select id="assignmentid">
 <c:forEach var="assignment" items="${assignments}">
 <option value="${assignment.id}">${assignment.id}</option>
 </c:forEach>
 </select>
 <a href="javascript:gotoAssignment()">GO</a></li>
 <li><a href="/app/operationalperiod">List of all operational periods</a></li>
</ul>
<h4>Operations (beta)</h4>
<ul>
 <li><a href="/app/resource/">Resources</a></li>
 <li>Location Tracking: <c:choose><c:when test="${locationenabled}">ENABLED   (<a href="/app/location/stop">disable</a>)</c:when><c:otherwise>DISABLED   (<a href="/app/location/start">enable</a>)</c:otherwise></c:choose></li>
</ul>
<h4>Bulk Transfer</h4>
<ul>
 <li>Import <a href="javascript:gpxdlg.dialog.show()">from GPX</a></li>
 <li>Export <a href="/rest/search?format=GPX">to GPX</a></li>
</ul>
</ul>

