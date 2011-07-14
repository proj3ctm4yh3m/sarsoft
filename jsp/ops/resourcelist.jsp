<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn" %>

<h2>All Resources</h2>

<ul>
  <li><a href="/app/resource/map">Switch to a map view</a> of all resources and nearby callsigns.</li>
  <li>Create new resource:&nbsp;<a href="javascript:showNewResourceForm()">Manually</a>&nbsp;|&nbsp;<a href="javascript:uploadDlg.dialog.show()">From CSV</a>
  <li>Export to <a href="/app/resource?format=CSV">CSV</a>.
</ul>

<div id="newresource" style="display: none">
<form method="POST" action="/app/resource/new" name="newResource">
<table border="0">
<tr><td>Name:</td><td><input type="text" name="name" size="10" value="${resource.name}"/></td></tr>
<tr><td>Type:</td><td><select name="type"><option value="PERSON">PERSON</option><option value="EQUIPMENT">EQUIPMENT</option></select></td></tr>
<tr><td>Agency:</td><td><input type="text" name="agency" value="${resource.agency}" size="10"/></td></tr>
<tr><td>Callsign:</td><td><input type="text" name="callsign" value="${resource.callsign}" size="10"/></td></tr>
<tr><td>SPOT Id:</td><td><input type="text" name="spotId" size="10" value="${resource.spotId}"/></td></tr>
<tr><td>SPOT Password:</td><td><input type="text" name="spotPassword" size="10" value="${resource.spotPassword}"></td></tr>
</table>
<a href="javascript:hideNewResourceForm()">Cancel</button>&nbsp;&nbsp;<a href="javascript:document.forms['newResource'].submit()">Create</a>
</form>
</div>

<p>A resource is anything that goes out on assignment; they are broadly categorized into people and equipment (e.g. vehicles, APRS transponders) and can be tracked via
APRS transmissions or SPOT beacons.  This page allows you to create, track and delete resources; resource-assignment pairings should be managed from the assignment detail 
page.  The table below lists all resources known to Sarsoft.</p>

<div id="resources">
</div>

<h2>Nearby Callsigns</h2>
The following callsigns have been picked up near the LKP.  You can use them to identify resources you'd like to add to the search, or <a href="/app/callsign/clear">clear the list</a>.

<div id="callsigns">
</div>

<script>

function showNewResourceForm() {
	document.getElementById("newresource").style.display = "block";
}

function hideNewResourceForm() {
	document.getElementById("newresource").style.display = "none";
}

org.sarsoft.Loader.queue(function() {
  var tabView = new YAHOO.widget.TabView('tabs');
  rtable = new org.sarsoft.view.ResourceTable();
  rtable.create(document.getElementById("resources"));

  dao = new org.sarsoft.ResourceDAO();
  dao.loadAll(function(rows) {
  	rtable.table.showTableMessage("<i>No Resources Found</i>");

  	rtable.table.addRows(rows);
  });
  
  
  function resourceListTimer() {
    dao.loadSince(function(resources) {
		var sortedBy = rtable.table.get("sortedBy");
		rtable.table.set("sortedBy", null);
		var rs = rtable.table.getRecordSet();
		for(var i = 0; i < resources.length; i++) {
			for(var j = 0; j < rs.getLength(); j++) {
				if(rs.getRecord(j).getData().id == resources[i].id) {
					rtable.table.deleteRow(j);
				}
			}
			rtable.table.addRow(resources[i]);
		}
		if(sortedBy != null) rtable.table.sortColumn(sortedBy.column, sortedBy.dir);
	});
	dao.mark();
  }
  dao.mark();
  setInterval(resourceListTimer, 15000);
  
  ctable = new org.sarsoft.view.ResourceTable(function() {});
  ctable.create(document.getElementById("callsigns"));
  cdao = new org.sarsoft.ResourceDAO(function() {}, "/rest/callsign");
  cdao.loadAll(function(rows) {
	 ctable.table.showTableMessage("<i>No Callsigns Found</i>");
	 ctable.table.addRows(rows);
  });
  
  
  function callsignListTimer() {
    cdao.loadSince(function(callsigns) {
		var sortedBy = ctable.table.get("sortedBy");
		ctable.table.set("sortedBy", null);
		var rs = ctable.table.getRecordSet();
		for(var i = 0; i < callsigns.length; i++) {
			for(var j = 0; j < rs.getLength(); j++) {
				if(rs.getRecord(j).getData().callsign == callsigns[i].callsign) {
					ctable.table.deleteRow(j);
				}
			}
			ctable.table.addRow(callsigns[i]);
		}
		if(sortedBy != null) ctable.table.sortColumn(sortedBy.column, sortedBy.dir);
	});
	cdao.mark();
  }
  cdao.mark();
  setInterval(callsignListTimer, 15000);
  
  
  uploadDlg = new org.sarsoft.view.ResourceImportDlg();
});

</script>
