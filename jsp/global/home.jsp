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

<c:if test="${hosted eq false or search.account.name eq username or imageUploadEnabled}">
<h4>Administration</h4>
<ul>
<c:choose>
<c:when test="${hosted eq false}">
 <li><a href="/app/search">Search Admin</a></li>
</c:when>
<c:when test="${search.account.name eq username}">
 <li><a href="/app/search">Search Admin</a></li>
</c:when>
</c:choose>
 <c:if test="${imageUploadEnabled}">
  <li><a href="/app/imagery/georef">Map Imagery</a></li>
 </c:if>
</ul>
</c:if>

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
<h4>Operations</h4>
<ul>
 <li><a href="/app/resource/">Resources</a></li>
 <li><a href="/app/location/status">Location Tracking</a></li>
</ul>
<h4>Bulk Transfer</h4>
<ul>
 <li>Import <a href="javascript:gpxdlg.dialog.show()">from GPX</a></li>
 <li>Export <a href="/rest/search?format=GPX">to GPX</a></li>
</ul>
</ul>

