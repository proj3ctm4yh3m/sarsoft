<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn" %>

<script language="javascript">
function gotoAssignment() {
	window.location = "/app/assignment/" + document.getElementById("assignmentid").value;
}
org.sarsoft.Loader.queue(function() {
gpxdlg = new org.sarsoft.view.BulkGPXDlg();
});
</script>

<h1>Welcome to Sarsoft!</h1>
<h4>Administration</h4>
<ul><li><a href="/app/admin">Administration Console</a></li></ul>
<h4>Plans</h4>
<ul>
<li><a href="/app/operationalperiod">View a list</a> of operational periods</li>
<li><a href="/app/operationalperiod/${lastperiod.id}">List view</a> of the most recent Operational Period</a></li>
<li><a href="/app/operationalperiod/${lastperiod.id}/map">Map view</a> of the most recent Operational Period</a></li>
<li><a href="javascript:gotoAssignment()">Jump to</a> assignment number <input id="assignmentid" length="4" type="text"/></li>
 <li><a href="javascript:gpxdlg.dialog.show()">Bulk import from GPX</a></li>
</ul>


