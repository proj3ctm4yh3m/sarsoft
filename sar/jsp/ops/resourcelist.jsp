<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn" %>
<%@page import="org.sarsoft.common.model.Tenant.Permission"%>
<% pageContext.setAttribute("none", Permission.NONE); %>
<% pageContext.setAttribute("read", Permission.READ); %>
<% pageContext.setAttribute("write", Permission.WRITE); %>
<% pageContext.setAttribute("admin", Permission.ADMIN); %>

Show:

<select id="resourceSwitcher">
  <option value="resources" selected="selected">All Resources</option>
  <option value="callsigns">Nearby Callsigns</option>
</select>

<ul>
<c:if test="${userPermissionLevel eq write or userPermissionLevel eq admin}">
  <li>Create new resource:&nbsp;<a href="javascript:showNewResourceForm()">Manually</a>&nbsp;|&nbsp;<a href="javascript:uploadDlg.dialog.show()">From CSV</a>
</c:if>
  <li id="expcsv">Export to <a href="/resource?format=CSV">CSV</a>.
</ul>

<div id="newresource" style="display: none">
<form method="POST" action="/resource/new" name="newResource">
<table border="0">
<tr><td>Name:</td><td><input type="text" id="new_name" name="name" size="10" value="${resource.name}"/></td></tr>
<tr><td>Type:</td><td><select name="type"><option value="PERSON">PERSON</option><option value="EQUIPMENT">EQUIPMENT</option></select></td></tr>
<tr><td>Agency:</td><td><input type="text" name="agency" value="${resource.agency}" size="10"/></td></tr>
<tr><td>Callsign:</td><td><input type="text" id="new_callsign" name="callsign" value="${resource.callsign}" size="10"/></td></tr>
<tr><td>SPOT Id:</td><td><input type="text" name="spotId" size="10" value="${resource.spotId}"/></td></tr>
<tr><td>SPOT Password:</td><td><input type="text" name="spotPassword" size="10" value="${resource.spotPassword}"></td></tr>
</table>
<input type="hidden" name="redirect" value="/resource"/>
<a href="javascript:hideNewResourceForm()">Cancel</button>&nbsp;&nbsp;<a href="javascript:document.forms['newResource'].submit()">Create</a>
</form>
</div>

<div id="resourceContainer">
<div id="resources">
</div>
<p class="hint">A resource is anything that goes out on assignment; they are broadly categorized into people and equipment (e.g. vehicles) and can be tracked via
APRS transmissions or SPOT beacons.  This page allows you to create, track and delete resources; resource-assignment pairings should be managed from the assignment detail 
page.</p>
</div>

<div id="callsignContainer" style="display: none">
<div id="callsigns">
</div>
<p class="hint">The following callsigns have been picked up near the search.  You can use them to identify resources you'd like to add to the search, or <a href="/app/callsign/clear">clear the list</a>.</p>
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
  rtable = new org.sarsoft.view.ResourceTable(null, null, 'Resources');
  rtable.create(document.getElementById("resources"));
  dao = new org.sarsoft.ResourceDAO();
  dao.loadAll(function(rows) {
  	rtable.table.showTableMessage("<i>No Resources Found</i>");

  	rtable.update(rows);
  });
  
  
  function resourceListTimer() {
    dao.loadSince(function(resources) {
    	rtable.update(resources);
	});
	dao.mark();
  }
  dao.mark();
  setInterval(resourceListTimer, 15000);
  
  ctable = new org.sarsoft.view.ResourceTable(function(resource) {
	  document.getElementById("new_name").value = resource.callsign;
	  document.getElementById("new_callsign").value = resource.callsign;
	  showNewResourceForm();
  }, null, 'Callsigns');
  ctable.create(document.getElementById("callsigns"));
  cdao = new org.sarsoft.ResourceDAO(function() {}, "/rest/callsign");
  cdao.loadAll(function(rows) {
	 ctable.table.showTableMessage("<i>No Callsigns Found</i>");
	 ctable.update(rows);
  });
  
  
  function callsignListTimer() {
    cdao.loadSince(function(callsigns) {
    	ctable.update(callsigns);
	});
	cdao.mark();
  }
  cdao.mark();
  setInterval(callsignListTimer, 15000);


  uploadDlg = new org.sarsoft.view.ResourceImportDlg();
  
  $('#resourceSwitcher').change(function() {
	 if($('#resourceSwitcher').val() == "resources") {
		 $('#resourceContainer').css('display', 'block');
		 $('#callsignContainer').css('display', 'none');
		 $('#expcsv').css('display', 'list-item');
	 } else {
		 $('#resourceContainer').css('display', 'none');
		 $('#callsignContainer').css('display', 'block');
		 $('#expcsv').css('display', 'none');
	 }
  });
});

</script>
