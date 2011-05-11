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

<h2>List of Operational Periods</h2>

<ul>
<li><a href="javascript:newAssignmentDlg.dialog.show()">New operational period</a></li>
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


