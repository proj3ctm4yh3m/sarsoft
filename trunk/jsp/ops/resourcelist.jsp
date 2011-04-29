<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn" %>

<h2>All Resources</h2>

<ul>
  <li><a href="/app/resource/map">Map View</a> of all resources.</li>
  <li><a href="javascript:showNewResourceForm()">Create</a> a new resource.</li>
</ul>

<div id="newresource" style="display: none">
<form method="POST" action="/app/resource/new">
<table border="0">
<tr><td>Name:</td><td><input type="text" name="name" size="10" value="${resource.name}"/></td></tr>
<tr><td>Callsign:</td><td><input type="text" name="callsign" value="${resource.callsign}" size="10"/></td></tr>
<tr><td>SPOT Id:</td><td><input type="text" name="spotId" size="10" value="${resource.spotId}"/></td></tr>
<tr><td>SPOT Password:</td><td><input type="text" name="spotPassword" size="10" value="${resource.spotPassword}"></td></tr>
</table>
<button onclick="hideNewResourceForm()">Cancel</button>&nbsp;&nbsp;<input type="submit" value="Create"/>
</form>
</div>

<br/>
This page shows you all available resources.

<div id="resources">
</div>

<h2>Nearby Callsigns</h2>
The following callsigns have been picked up near the LKP.  You can use them to identify resources you'd like to add to the search.

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
  
  ctable = new org.sarsoft.view.ResourceTable(function() {});
  ctable.create(document.getElementById("callsigns"));
  cdao = new org.sarsoft.ResourceDAO(function() {}, "/rest/callsign");
  cdao.loadAll(function(rows) {
	 ctable.table.showTableMessage("<i>No Callsigns Found</i>");
	 ctable.table.addRows(rows);
  });
});

</script>
