<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn" %>

<script>
handler = function(period) {
	dao.create(function(obj) {
		datatable.table.addRow(obj);
	}, period);
}
org.sarsoft.Loader.queue(function() {
newAssignmentDlg = new org.sarsoft.view.EntityCreateDialog("New Operational Period", new org.sarsoft.view.OperationalPeriodForm(), handler);
});
</script>

<h2>All Operational Periods</h2>

<p>This is a list of all operational periods that have been created for the ${tenant.description} search.  If you're lost, you probably want to click on an operational period
and then onto either the map view or an individual assignment's details.</p>

<ul>
<li><a href="javascript:newAssignmentDlg.dialog.show()">Create</a> a new operational period</li>
</ul>

<div id="listcontainer">
</div>

<script>
org.sarsoft.Loader.queue(function() {
  datatable = new org.sarsoft.view.OperationalPeriodTable();
  datatable.create(document.getElementById("listcontainer"));
  dao = new org.sarsoft.OperationalPeriodDAO();
  dao.loadAll(function(rows) {
  	datatable.table.addRows(rows);
  });
});

</script>


