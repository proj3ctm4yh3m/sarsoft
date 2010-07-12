<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn" %>

<h2>Operational Period ${period.id}: ${period.description}</h2>

This period has ${fn:length(period.assignments)} assignments, covering ${period.area} km&sup2; and ${period.timeAllocated} team-hours.
<c:if test="${period.trackDistance gt 0}">${period.trackDistance} km of tracks have been downloaded.</c:if>  You can:<br/>

<ul>
 <li><a href="/app/operationalperiod/${period.id}/map">View assignments in a map</a> (new assignments can be created on this page)</li>
 <li><a href="/rest/operationalperiod/${period.id}?format=gpx">Export as GPX</a></li>
 <li><a href="/rest/operationalperiod/${period.id}?format=kml">Export as KML</a></li>
</ul>

<div id="listcontainer">
</div>

<script>
org.sarsoft.Loader.queue(function() {
  datatable = new org.sarsoft.view.SearchAssignmentTable();
  datatable.create(document.getElementById("listcontainer"));
  dao = new org.sarsoft.OperationalPeriodDAO();
  dao.loadAssignments(function(rows) {
    if(rows == null || rows.length == 0) {
    	datatable.table.showTableMessage("<i>No Assignments Found</i>");
    } else {
	  	datatable.table.addRows(rows);
	}
  }, ${period.id});
});

</script>
