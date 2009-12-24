<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn" %>
<%@page import="org.sarsoft.plans.model.SearchAssignment"%>
<% pageContext.setAttribute("draft", SearchAssignment.Status.DRAFT); %>

<script>
function export() {
  var select = document.getElementById('export');
  var format = select.options[select.selectedIndex].value;
  if(format == "gpx") window.location="/rest/assignment/${assignment.id}?format=gpx";
  if(format == "kml") window.location="/rest/assignment/${assignment.id}?format=kml";
  if(format == "garmin") document.forms['togarmin'].submit();
}

function import() {
  var select = document.getElementById('import');
  var format = select.options[select.selectedIndex].value;
  if(format == "gpx") gpxdlg.dialog.show();
  if(format == "garmin") window.location="/app/fromgarmin?id=${assignment.id}";
}

function finalize() {
	var postdata = "action=finalize&preparedby=" + encodeURIComponent(document.getElementById('dlgpreparedby').value);
	YAHOO.util.Connect.asyncRequest('POST', '/rest/assignment/${assignment.id}', { success : function(response) {
			window.location.href = window.location.href;
		}, failure : function(response) {
			throw("AJAX ERROR posting to " + that.baseURL + url + ": " + response.responseText);
		}}, postdata);
}



</script>

<h2>Assignment ${assignment.id}: ${assignment.name}</h2>
This ${assignment.status} assignment covers ${assignment.area} km&sup2; (${assignment.distance} km perimeter) with ${assignment.timeAllocated} hours allocated.  You can:<br/>

<ul>
<c:choose>
 <c:when test="${assignment.status == draft}">
 	<li><a href="javascript:finalizeDlg.show()">Prepare Assignment</a> (this will allow you to print it)</li>
 </c:when>
 <c:otherwise>
    <li><a href="/app/assignment/${assignment.id}?format=print">Print Assignment</a></li>
 </c:otherwise>
</c:choose>
<li>Export to: <select id="export"><option value="gpx">GPX File</option><option value="kml">KML File</option><option value="garmin">Garmin GPS Device</option></select>&nbsp;<button onclick="javascript:export()">GO</button></li>
<li>Import tracks from: <select id="import"><option value="gpx">GPX File</option><option value="garmin">Garmin GPS Device</option></select>&nbsp;<button onclick="javascript:import()">GO</button></li>
</ul>

<div id="tabs" class="yui-navset">
	<ul class="yui-nav">
		<li class="selected"><a href="#details"><em>Assignment Details</em></a></li>
		<li><a href="#map"><em>Map</em></a></li>
		<li><a href="#tracks"><em>Tracks</em></a></li>
	</ul>

	<div class="yui-content">
		<div id="details">
<c:if test="${assignment.status != draft}">
<div><i>Note: This assignment is no longer in draft mode.  It may have been printed and copies or GPS routes may already be in the field.  Saving any changes will revert the assignment
back to draft status; if you do this, you must track down any existing copies in order to avoid confusion.</i></div>
</c:if>
			<form name="assignment" action="/app/assignment/${assignment.id}" method="post">
			 <table border="0">
			 <tr><td>Name</td><td><input name="name" type="text" value="${assignment.name}"/></td></tr>
			 <tr><td>Resource Type</td><td>
				 <select name="resourceType" value="${assignment.resourceType}">
				  <c:forEach var="type" items="<%= SearchAssignment.ResourceType.values() %>">
				   <option value="${type}"<c:if test="${assignment.resourceType == type}"> selected="selected"</c:if>>${type}</option>
				  </c:forEach>
				 </select></td></tr>
			 <tr><td>Time Allocated</td><td><input name="timeAllocated" type="text" size="4" value="${assignment.timeAllocated}"/> hours</td></tr>
			 <tr><td>POD (Responsive)</td><td>
			    <select name="responsivePOD">
			    <c:forEach var="type" items="<%= org.sarsoft.plans.model.Probability.values() %>">
			      <option value="${type}"<c:if test="${assignment.responsivePOD == type}"> selected="selected"</c:if>>${type}</option>
			    </c:forEach>
			    </select>
			  </td></tr>
			  <tr><td style="padding-right: 5px">POD (Unresponsive)</td><td>
			    <select name="unresponsivePOD">
			    <c:forEach var="type" items="<%= org.sarsoft.plans.model.Probability.values() %>">
			      <option value="${type}"<c:if test="${assignment.unresponsivePOD == type}"> selected="selected"</c:if>>${type}</option>
			    </c:forEach>
			    </select>
			  </td></tr>
			  </table>

			<b>Assignment:</b><br/>
			<textarea name="details" style="width: 100%; height: 100px">${assignment.details}</textarea>

			<br/><br/>
			<a style="left: 20px" href="javascript:document.forms['assignment'].submit()">Save Changes</a>
			</form>
		</div>
		<div id="map">
<div><i>Note: In order to modify the assignment's bounds, you must use the <a href="/app/operationalperiod/${assignment.operationalPeriod.id}/map">operational period map view</a>, so that
you can see how it relates to neighboring assignments.</i></div>
			<div id="attachedmapscontainer" style="float: left">
			<script>
			org.sarsoft.Loader.queue(function() {
			gpxdlg = new org.sarsoft.view.SearchAssignmentGPXDlg(${assignment.id});
			});
			org.sarsoft.Loader.queue(function() {
			  datatable = new org.sarsoft.view.MapConfigTable(function(config) { avmc.setMapConfig(config);});
			  datatable.create(document.getElementById("attachedmapscontainer"));

			  <c:forEach var="config" items="${assignment.mapConfigs}">
			    datatable.table.addRow({base : "${config.base}", overlay : "${config.overlay}", opacity : "${config.opacity}"});
			  </c:forEach>
			});
			</script>
			</div>
			<div id="mapview" style="width: 500px; height: 450px; float: left; margin-left: 20px;">
			</div>

		</div>

		<div id="tracks">
			<div id="attachedtrackscontainer" style="float: left">
			</div>
			<div id="trackmapview" style="width: 500px; height: 450px; float: left; margin-left: 20px;">
			</div>
		</div>
	</div>
</div>

<div style="display: none">
<form name="togarmin" action="/app/togarmin" method="GET">
	<input type="hidden" name="file" value="/rest/assignment/${assignment.id}?format=gpx"/>
	<input type="hidden" name="name" value="${assignment.id}"/>
</form>
</div>

<div id="finalize" style="top: 150px; left: 150px; position: absolute; z-index: 200; width: 300px;">
	<div class="hd">Finalize Assignment</div>
	<div class="bd">
		<label for="dlgpreparedby">Your Name:</label>
		<input id="dlgpreparedby" length="20" type="text"/>
	</div>
</div>

<script>
org.sarsoft.Loader.queue(function() {
    tracktable = new org.sarsoft.view.WayTable(function(way) { avtc.highlight(way);}, function(record) {
    	var way = record.getData();
    	var idx = 100;
    	for(var i = 0; i < assignment.ways.length; i++) {
    		if(assignment.ways[i].id == way.id) idx = i;
    	}
    	assignmentDAO.deleteWay(assignment, idx, way);
    	tracktable.table.deleteRow(record);
	});
    tracktable.create(document.getElementById("attachedtrackscontainer"));
	assignmentDAO = new org.sarsoft.SearchAssignmentDAO();
	assignmentDAO.load(function(obj) {
		assignment = obj;
		assignmentDAO.getWays(function(ways) {
			avmc = new org.sarsoft.controller.AssignmentViewMapController(document.getElementById('mapview'), assignment, ways, { color: "#FF0000" });
			avtc = new org.sarsoft.controller.AssignmentViewMapController(document.getElementById('trackmapview'), assignment, ways);
			for(var i = 0; i < ways.length; i++) {
				if(ways[i].type == "TRACK") tracktable.table.addRow(ways[i]);
			}
		}, assignment, 10);
	}, ${assignment.id});
	var tabView = new YAHOO.widget.TabView('tabs');
	finalizeDlg = new YAHOO.widget.Dialog("finalize", {zIndex: "200"});
	finalizeDlg.cfg.queueProperty("buttons", [ { text: "Cancel", handler: function() { finalizeDlg.hide(); }}, { text : "Prepare", handler: function() { finalizeDlg.hide(); finalize();}, isDefault: true }]);
	finalizeDlg.render(document.body);
	finalizeDlg.hide();
});
</script>

