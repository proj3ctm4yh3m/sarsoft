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

<h2>Sarsoft Home Page - ${search.description}</h2>
This is Sarsoft's initial landing page.  If you're unsure what to do, you probably want to click on the <a href="/app/operationalperiod/${lastperiod.id}/map">Map</a> link
to start creating assignments or the <a href="/app/operationalperiod/${lastperiod.id}">List</a> link to edit existing assignments and print maps and ICS forms.  Not 
looking for ${search.description}?  <a href="/app/setsearch">Work on a different search</a>.

<c:if test="${account ne null}">
<br/>Logged in as ${account.email}.  <a href="/app/logout">Logout</a><br/>
</c:if>

<h4>Plans</h4>
<ul>
 <li>Current Operational Period (${lastperiod.id}): &nbsp;<a href="/app/operationalperiod/${lastperiod.id}/map">Map</a>&nbsp;|&nbsp;<a href="/app/operationalperiod/${lastperiod.id}">List</a></li>
 <li>Jump to assignment&nbsp;&nbsp;&nbsp;<select id="assignmentid">
 <c:forEach var="assignment" items="${assignments}">
 <option value="${assignment.id}">${assignment.id}</option>
 </c:forEach>
 </select>
 <a href="javascript:gotoAssignment()">GO</a></li>
 <li><a href="/app/operationalperiod">Other Operational Periods</a></li>
</ul>
<h4>Operations</h4>
<ul>
 <li><a href="/app/resource/">Resources</a></li>
</ul>
<h4>Administration and Configuration</h4>
<ul>
<c:choose>
<c:when test="${hosted eq false}">
 <li><a href="/app/search">Search Admin.</a>  Change map datum and search name.</li>
</c:when>
<c:when test="${search.account.name eq username}">
 <li><a href="/app/search">Search Admin.</a>  Map datum, sharing and password protection.</li>
</c:when>
</c:choose>
 <c:if test="${imageUploadEnabled}">
  <li><a href="/app/imagery/georef">Map Imagery.</a>  Turn JPEG files into custom map backgrounds.</li>
 </c:if>
 <li><a href="/app/location/status">Location Tracking.</a>  Debug location tracking issues.</li>
</ul>
 
<h4>Import and Export</h4>
<ul>
 <li><a href="/rest/search?format=GPX">Backup search</a> to a GPX file.</li>
 <li><a href="javascript:gpxdlg.dialog.show()">Import assignments</a> from GPX (Caution!  Recommended only for newly created searches)</li>
</ul>

