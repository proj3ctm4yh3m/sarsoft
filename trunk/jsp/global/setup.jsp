<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn" %>
<%@page import="org.sarsoft.common.model.Tenant.Permission"%>
<% pageContext.setAttribute("none", Permission.NONE); %>
<% pageContext.setAttribute("read", Permission.READ); %>
<% pageContext.setAttribute("write", Permission.WRITE); %>
<% pageContext.setAttribute("admin", Permission.ADMIN); %>

<div class="phead">Setup</div>

<ul>
<c:if test="${userPermissionLevel eq admin}">
 <li><a href="/admin.html">Search Admin.</a>  Change search name and sharing.</li>
</c:if>
 <li><a href="/app/location/status">Location Tracking.</a>  Debug location tracking issues.</li>
</ul>
 
<h4>Backup and Recovery</h4>
<ul>
 <li><a href="/rest/search?format=GPX">Backup search</a> objects (assignments, tracks, clues) to a GPX file.</li>
 <li><a href="/map?id=${tenant.name}&format=GPX">Backup markup</a> (shapes, markers) to a GPX file.</li>
<c:if test="${userPermissionLevel eq write or userPermissionLevel eq admin}">
 <li style="padding-top: 1em"><a href="javascript:gpxdlg.dialog.show()">Import search</a> objects from GPX (Caution!  Recommended only for newly created searches)</li>
 <li><a href="javascript:gpxdlg2.dialog.show()">Import markup</a> from GPX</li>
</c:if>
</ul>

<script language="javascript">
org.sarsoft.Loader.queue(function() {
	gpxdlg = new org.sarsoft.view.BulkGPXDlg();
	gpxdlg2 = new org.sarsoft.view.BulkGPXDlg("gpximport2", "/map/gpxupload", "/");
});
</script>