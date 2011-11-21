<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn" %>
<%@page import="org.sarsoft.common.model.Tenant.Permission"%>
<% pageContext.setAttribute("none", Permission.NONE); %>
<% pageContext.setAttribute("read", Permission.READ); %>
<% pageContext.setAttribute("write", Permission.WRITE); %>
<% pageContext.setAttribute("admin", Permission.ADMIN); %>

<script language="javascript">
function gotoAssignment() {
    var select = document.getElementById('assignmentid');
	window.location = "/app/assignment/" + select.options[select.selectedIndex].value;
}
org.sarsoft.Loader.queue(function() {
gpxdlg = new org.sarsoft.view.BulkGPXDlg();
gpxdlg2 = new org.sarsoft.view.BulkGPXDlg("gpximport2", "/map/gpxupload", "/");
});
</script>

<h2>Sarsoft Home Page - ${tenant.description}</h2>
<ul>
 <li>Lost?  You probably want to click on the <a href="/app/operationalperiod/${lastperiod.id}/map">Map</a> link
to start creating assignments or the <a href="/app/operationalperiod/${lastperiod.id}">List</a> link to edit existing assignments and print maps and ICS forms.</li>
</ul>


<h4>Plans</h4>
<ul>
 <li>Current Operational Period (${lastperiod.id}): &nbsp;<a href="/app/operationalperiod/${lastperiod.id}/map">Map</a>&nbsp;|&nbsp;<a href="/app/operationalperiod/${lastperiod.id}">List</a></li>
 <c:if test="${fn:length(assignments) gt 0}">
 <li>Jump to assignment&nbsp;&nbsp;&nbsp;<select id="assignmentid">
 <c:forEach var="assignment" items="${assignments}">
 <option value="${assignment.id}">${assignment.id}</option>
 </c:forEach>
 </select>
 <a href="javascript:gotoAssignment()">GO</a></li>
 </c:if>
 <li><a href="/app/operationalperiod">Other Operational Periods</a></li>
</ul>
<h4>Operations</h4>
<ul>
 <li><a href="/app/resource/">Resources</a></li>
 <li><a href="/app/clue">Clue Reports</a></li>
</ul>
<h4>Administration and Configuration</h4>
<ul>
<c:if test="${userPermissionLevel eq admin}">
 <li><a href="/admin.html">Search Admin.</a>  Change search name and sharing.</li>
</c:if>
 <c:if test="${imageUploadEnabled and (userPermissionLevel eq write or userPermissionLevel eq admin)}">
  <li><a href="/app/imagery/georef">Map Imagery.</a>  Turn JPEG files into custom map backgrounds.</li>
 </c:if>
 <li><a href="/app/location/status">Location Tracking.</a>  Debug location tracking issues.</li>
</ul>
 
<h4>Import and Export</h4>
<ul>
 <li><a href="/rest/search?format=GPX">Backup search</a> objects (assignments, tracks, clues) to a GPX file.</li>
 <li><a href="/map?id=${tenant.name}&format=GPX">Backup markup</a> (shapes, markers) to a GPX file.</li>
<c:if test="${userPermissionLevel eq write or userPermissionLevel eq admin}">
 <li><a href="javascript:gpxdlg.dialog.show()">Import search</a> objects from GPX (Caution!  Recommended only for newly created searches)</li>
 <li><a href="javascript:gpxdlg2.dialog.show()">Import markup</a> from GPX</li>
</c:if>
</ul>

