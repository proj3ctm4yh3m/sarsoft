<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn" %>
<%@page import="org.sarsoft.plans.model.SearchAssignment"%>
<% pageContext.setAttribute("draft", SearchAssignment.Status.DRAFT); %>
<% pageContext.setAttribute("prepared", SearchAssignment.Status.PREPARED); %>
<% pageContext.setAttribute("inprogress", SearchAssignment.Status.INPROGRESS); %>
<% pageContext.setAttribute("completed", SearchAssignment.Status.COMPLETED); %>

<script type="text/javascript">
function exportassignment() {
  var select = document.getElementById('export');
  var format = select.options[select.selectedIndex].value;
  if(format == "gpx") window.location="/rest/assignment/${assignment.id}?format=gpx";
  if(format == "kml") window.location="/rest/assignment/${assignment.id}?format=kml";
  if(format == "garmin") document.forms['togarmin'].submit();
}

function importassignment() {
  var select = document.getElementById('import');
  var format = select.options[select.selectedIndex].value;
  if(format == "gpx") gpxdlg.dialog.show();
  if(format == "garmin") window.location="/app/fromgarmin?id=${assignment.id}";
}

function finalize() {
	var postdata = "action=finalize&preparedby=" + encodeURIComponent(document.getElementById('dlgpreparedby').value);
	YAHOO.util.Connect.resetDefaultHeaders();
	YAHOO.util.Connect.setDefaultPostHeader(false);
	YAHOO.util.Connect.initHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
	YAHOO.util.Connect.asyncRequest('POST', '/rest/assignment/${assignment.id}', { success : function(response) {
			window.location.reload();
		}, failure : function(response) {
			throw("AJAX ERROR posting to " + that.baseURL + url + ": " + response.responseText);
		}}, postdata);
}

function transition(state) {
	var postdata = "action=" + state;
	YAHOO.util.Connect.resetDefaultHeaders();
	YAHOO.util.Connect.setDefaultPostHeader(false);
	YAHOO.util.Connect.initHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
	YAHOO.util.Connect.asyncRequest('POST', '/rest/assignment/${assignment.id}', { success : function(response) {
			window.location.href = '/app/assignment/${assignment.id}';
		}, failure : function(response) {
			throw("AJAX ERROR posting to " + that.baseURL + url + ": " + response.responseText);
		}}, postdata);
}

</script>

<div style="width: 30em; position: absolute; right: 25px; top: 10px; text-align: right">
   <c:forEach var="status" varStatus="loopStatus" items="<%= org.sarsoft.plans.model.SearchAssignment.Status.values() %>">
     <c:if test="${loopStatus.index gt 0}">-</c:if>
     <c:choose><c:when test="${assignment.status eq status}"><span style="color: black">${status}</span></c:when><c:otherwise><span style="color: #CCCCCC">${status}</c:otherwise></c:choose>
   </c:forEach>

</div>

<h2>Assignment ${assignment.id}</h2>
This ${assignment.status} assignment covers ${assignment.formattedSize} with ${assignment.timeAllocated} hours allocated.
<c:if test="${assignment.trackDistance gt 0}">  ${assignment.trackDistance} km of tracks have been downloaded.</c:if>
  You can:<br/>

<ul>
<c:choose>
 <c:when test="${assignment.status eq draft}">
 	<li><a href="javascript:finalizeDlg.show()">Prepare Assignment</a> (this will allow you to print it)</li>
 </c:when>
 <c:otherwise>
    <li>Print <a target="_new" href="/app/assignment/${assignment.id}?format=print&content=maps">Maps</a> or <a target="_new" href="/app/assignment/${assignment.id}?format=print&content=forms">SAR 104 Forms</a></li>
 </c:otherwise>
</c:choose>
<c:if test="${assignment.status == prepared or assignment.status == completed}">
    <li><a href="javascript:transition('start')">Start Assignment</a></li>
</c:if>
<c:if test="${assignment.status ==  inprogress}">
	<li><a href="javascript:transition('stop')">Finish Assignment</a></li>
</c:if>

<li>Export to: <a href="javascript:document.forms['togarmin'].submit()">Garmin GPS</a>&nbsp;|&nbsp;<a href="/rest/assignment/${assignment.id}?format=gpx">GPX</a>&nbsp;|&nbsp;<a href="/rest/assignment/${assignment.id}?format=kml">KML</a></li>
<li>Import tracks from: <a href="/app/fromgarmin?id=${assignment.id}">Garmin GPS</a>&nbsp;|&nbsp;<a href="javascript:gpxdlg.dialog.show()">GPX</a></li>
</ul>

<div id="tabs" class="yui-navset">
	<ul class="yui-nav">
		<li class="selected"><a href="#details"><em>Assignment Details</em></a></li>
		<li><a href="#map"><em>Map</em></a></li>
		<li><a href="#tracks"><em>Tracks</em></a></li>
		<li><a href="#operations"><em>Ops</em></a></li>
		<li><a href="#clues"><em>Clues</em></a>
	</ul>

	<div class="yui-content">
		<div id="details">
<c:if test="${assignment.status != draft}">
<div><i>This assignment is no longer in draft mode.  It may have been printed and copies or GPS routes may already be in the field.  If you revert it and make changes,
 you must track down any existing copies in order to avoid confusion.</i></div>
</c:if>
			<form name="assignment" action="/app/assignment/${assignment.id}" method="post">
			<div style="float: left; width: 20em">
			 <table border="0">
			 <tr><td>Number</td><td>${assignment.id}</td></tr>
			 <tr><td>Resource Type</td><td>
				 <select name="resourceType" value="${assignment.resourceType}"<c:if test="${assignment.status != draft}"> disabled="disabled"</c:if>>
				  <c:forEach var="type" items="<%= SearchAssignment.ResourceType.values() %>">
				   <option value="${type}"<c:if test="${assignment.resourceType == type}"> selected="selected"</c:if>>${type}</option>
				  </c:forEach>
				 </select></td></tr>
			 <tr><td>Time Allocated</td><td><input name="timeAllocated" type="text" size="4" value="${assignment.timeAllocated}"<c:if test="${assignment.status != draft}"> disabled="disabled"</c:if>/> hours</td></tr>
			 <tr><td>POD (Responsive)</td><td>
			    <select name="responsivePOD"<c:if test="${assignment.status != draft}"> disabled="disabled"</c:if>>
			    <c:forEach var="type" items="<%= org.sarsoft.plans.model.Probability.values() %>">
			      <option value="${type}"<c:if test="${assignment.responsivePOD == type}"> selected="selected"</c:if>>${type}</option>
			    </c:forEach>
			    </select>
			  </td></tr>
			<tr><td style="padding-right: 5px">POD (Unresponsive)</td><td>
			    <select name="unresponsivePOD"<c:if test="${assignment.status != draft}"> disabled="disabled"</c:if>>
			    <c:forEach var="type" items="<%= org.sarsoft.plans.model.Probability.values() %>">
			      <option value="${type}"<c:if test="${assignment.unresponsivePOD == type}"> selected="selected"</c:if>>${type}</option>
			    </c:forEach>
			    </select>
			  </td></tr>
			<tr><td style="padding-right: 5px">POD (Clue)</td><td>
			    <select name="cluePOD"<c:if test="${assignment.status != draft}"> disabled="disabled"</c:if>>
			    <c:forEach var="type" items="<%= org.sarsoft.plans.model.Probability.values() %>">
			      <option value="${type}"<c:if test="${assignment.cluePOD == type}"> selected="selected"</c:if>>${type}</option>
			    </c:forEach>
			    </select>
			  </td></tr>
			<tr><td style="padding-right: 5px">Primary Freq</td><td><input name="primaryFrequency" type="text" size="10" value="${assignment.primaryFrequency}"<c:if test="${assignment.status != draft}"> disabled="disabled"</c:if>></td></tr>
			<tr><td style="padding-right: 5px">Secondary Freq</td><td><input name="secondaryFrequency" type="text" size="10" value="${assignment.secondaryFrequency}"<c:if test="${assignment.status != draft}"> disabled="disabled"</c:if>></td></tr>
			  </table>

			 <br/><br/>
			 <c:choose>
			 <c:when test="${assignment.status != draft}">
				 <a style="left: 20px" href="javascript:document.forms['assignment'].submit()">Revert to Draft Mode</a> to make changes
			 </c:when>
			 <c:otherwise>
				 <a style="left: 20px" href="javascript:document.forms['assignment'].submit()">Save Changes</a>
			 </c:otherwise>
			 </c:choose>

			 </div>
			 <div style="float: left; width: 40em">

			<b>Details:</b><br/>
			<textarea name="details" style="width: 100%; height: 80px"<c:if test="${assignment.status != draft}"> disabled="disabled"</c:if>>${assignment.details}</textarea>

			<br/><br/>
			<b>Previous Efforts in Search Area:</b><br/>
			<textarea name="previousEfforts" style="width: 100%; height: 80px"<c:if test="${assignment.status != draft}"> disabled="disabled"</c:if>>${assignment.previousEfforts}</textarea>

			<br/><br/>
			<b>Dropoff and Pickup Instructions:</b><br/>
			<textarea name="transportation" style="width: 100%; height: 80px"<c:if test="${assignment.status != draft}"> disabled="disabled"</c:if>>${assignment.transportation}</textarea>

			</div>

			</form>
		</div>
		<div id="map">
<div><i>Note: In order to modify the assignment's bounds, you must use the <a href="/app/operationalperiod/${assignment.operationalPeriod.id}/map">operational period map view</a>, so that
you can see how it relates to neighboring assignments.</i></div>
			<div id="mapview" style="width: 500px; height: 450px; float: left; margin-left: 20px;">
			</div>

		</div>

		<div id="tracks">
			<div style="float: left; width: 35em">
				<div id="attachedtrackscontainer">
				</div>
				<div id="attachedwptcontainer">
				</div>
			</div>
			<div id="trackmapview" style="width: 500px; height: 450px; float: left; margin-left: 20px;">
			</div>
			<div style="float: left; margin-left: 20px">
			<form name="cleanuptracks" method="POST" action="/app/assignment/${assignment.id}/cleantracks#tracks">
			<i>Clean Up Track Data:</i><br/>Remove all trackpoints waypoints more than<br/><input name="radius" type="text" size="5" value="15"/>&nbsp;km from assignment.&nbsp;&nbsp;<input type="submit" value="GO"/>
			</form>
			</div>
		</div>

		<div id="operations">
		<div style="float: left; width: 25em">
			<h4>Attach a resource</h4>
			<select id="resources">
			<c:forEach var="resource" items="${resources}">
				<option value="${resource.id}">${resource.name} (${resource.agency}) - ${resource.callsign}</option>
			</c:forEach>
			</select>
			<button onclick="attachExistingResource()">GO</button>
		</div>
		<div style="float: left; width: 30em">
			<h4>Create a new resource</h4>
<form method="POST" action="/app/resource/new#operations">
Name:&nbsp;<input type="text" name="name" size="10" value=""/>&nbsp;&nbsp;
Type:&nbsp;<select name="type"><option value="PERSON">PERSON</option><option value="EQUIPMENT">EQUIPMENT</option></select><br/>
Agency:&nbsp;<input type="text" name="agency" value="" size="10"/>&nbsp;&nbsp;
Callsign:&nbsp;<input type="text" name="callsign" value="" size="10"/><br/>
SPOT Id:&nbsp;<input type="text" name="spotId" size="10" value=""/>&nbsp;&nbsp;
SPOT Password:&nbsp;<input type="text" name="spotPassword" size="10" value="${resource.spotPassword}">
<input type="hidden" name="redirect" value="/app/assignment/${assignment.id}"/>
<input type="hidden" name="assignmentId" value="${assignment.id}"/>
<input type="submit" value="Create"/>
</form>
		</div>
		<div style="width: 100%; clear: both">
			<div id="attachedresourcecontainer">
			</div>
		</div>
		</div>
		
		<div id="clues">
			<div id="cluecontainer"></div>
		</div>
	</div>
</div>

<div style="display: none">
<form name="togarmin" action="/app/togarmin" method="GET">
	<input type="hidden" name="file" value="/rest/assignment/${assignment.id}?format=gpx"/>
	<input type="hidden" name="name" value="Assignment ${assignment.id}"/>
</form>
</div>

<div id="finalize" style="top: 150px; left: 150px; position: absolute; z-index: 200; width: 300px;">
	<div class="hd">Prepare Assignment</div>
	<div class="bd">
		<label for="dlgpreparedby">Your Name:</label>
		<input id="dlgpreparedby" length="20" type="text"/>
	</div>
</div>

<div id="steal" style="top: 250px; left: 250px; position: absolute; z-index: 2000; width: 200px;">
	<div class="hd">Steal Resource</div>
	<div class="bd">
		The resource <span id="resourcetosteal"></span> is currently attached to assignment <span id="assignmenttostealfrom"></span>.  Steal it for this assignment?
	</div>
</div>

<script type="text/javascript">
var _resources = new Object();
<c:forEach var="resource" items="${resources}">
<c:if test="${resource.assignment ne null}">_resources[${resource.id}]=${resource.assignment.id};</c:if>
</c:forEach>

function attachExistingResource() {
	var select = document.getElementById("resources");
	var id = select.options[select.selectedIndex].value
	if(_resources[id] != null) {
		document.getElementById('resourcetosteal').innerHTML=select.options[select.selectedIndex].innerHTML;
		document.getElementById('assignmenttostealfrom').innerHTML = _resources[id];
		stealDlg.show();
	} else {
		window.location="/app/resource/" + id + "/attach/${assignment.id}#operations";
	}
}

function stealResource() {
	var select = document.getElementById("resources");
	var id = select.options[select.selectedIndex].value
	window.location="/app/resource/" + id + "/attach/${assignment.id}#operations";
}

org.sarsoft.Loader.queue(function() {
    tracktable = new org.sarsoft.view.WayTable(function(way) { avtc.highlight(way);}, function(record) {
    	var way = record.getData();
    	var idx = 100;
    	for(var i = 0; i < _assignment.ways.length; i++) {
    		if(_assignment.ways[i].id == way.id) idx = i;
    	}
    	assignmentDAO.deleteWay(_assignment, idx, way);
    	_assignment.ways.splice(idx, 1);
    	tracktable.table.deleteRow(record);
	});
    tracktable.create(document.getElementById("attachedtrackscontainer"));

    wpttable = new org.sarsoft.view.WaypointTable(function(waypoint) { avtc.highlightWaypoint(waypoint);}, function(record) {
    	var waypoint = record.getData();
    	var idx = 100;
    	for(var i = 0; i < _assignment.waypoints.length; i++) {
    		if(_assignment.waypoints[i].id == waypoint.id) idx = i;
    	}
    	assignmentDAO.deleteWaypoint(_assignment, idx, waypoint);
    	_assignment.waypoints.splice(idx, 1);
    	wpttable.table.deleteRow(record);
	});
    wpttable.create(document.getElementById("attachedwptcontainer"));

    resourcetable = new org.sarsoft.view.ResourceTable(null, function(record) {
    	var resource = record.getData();
    	window.location="/app/resource/" + resource.id + "/detach/" + resource.assignmentId + "#operations";
	});

    resourcetable.create(document.getElementById("attachedresourcecontainer"));
    
    cluetable = new org.sarsoft.view.ClueTable();
    cluetable.create(document.getElementById("cluecontainer"));

	assignmentDAO = new org.sarsoft.SearchAssignmentDAO();
	assignmentDAO.load(function(obj) {
		assg = obj;
		_assignment = obj;
		if(_assignment.waypoints.length == 0) wpttable.table.showTableMessage("<i>No Waypoints Found</i>");
		for(var i = 0; i < _assignment.waypoints.length; i++) {
			wpttable.table.addRow(_assignment.waypoints[i]);
		}
		if(_assignment.resources.length == 0) resourcetable.table.showTableMessage("<i>No Resources Attached</i>");
		for(var i = 0; i < _assignment.resources.length; i++) {
			resourcetable.table.addRow(_assignment.resources[i]);
		}
		if(_assignment.clues.length == 0) cluetable.table.showTableMessage("<i>No Clues Found</i>");
		for(var i = 0; i < _assignment.clues.length; i++) {
			cluetable.table.addRow(_assignment.clues[i]);
		}
		assignmentDAO.getWays(function(ways) {
			avmc = new org.sarsoft.controller.AssignmentViewMapController(document.getElementById('mapview'), _assignment, ways, { color: "#FF0000" });
			avtc = new org.sarsoft.controller.AssignmentViewMapController(document.getElementById('trackmapview'), _assignment, ways);
			tracktable.table.showTableMessage("<i>No Tracks Found</i>");
			for(var i = 0; i < ways.length; i++) {
				if(ways[i].type == "TRACK") tracktable.table.addRow(ways[i]);
			}
		}, _assignment, 10);
	}, ${assignment.id});

	resourceDAO = new org.sarsoft.ResourceDAO();

	var tabView = new YAHOO.widget.TabView('tabs');
	var url = location.href.split('#');
	if(url[1] == "tracks") tabView.set('activeIndex', 2);
 	if(url[1] == "operations") tabView.set('activeIndex', 3);

 	gpxdlg = new org.sarsoft.view.SearchAssignmentGPXDlg(${assignment.id});

	finalizeDlg = new YAHOO.widget.Dialog("finalize", {zIndex: "2500", width: "300px"});
	finalizeDlg.cfg.queueProperty("buttons", [ { text: "Cancel", handler: function() { finalizeDlg.hide(); }}, { text : "Prepare", handler: function() { finalizeDlg.hide(); finalize();}, isDefault: true }]);
	finalizeDlg.render(document.body);
	finalizeDlg.hide();
	
	stealDlg = new YAHOO.widget.Dialog("steal", {zIndex: "1000", width: "300px"});
	stealDlg.cfg.queueProperty("buttons", [ { text: "Cancel", handler: function() { stealDlg.hide(); }}, { text : "Steal", handler: function() { finalizeDlg.hide(); stealResource();}, isDefault: true }]);
	stealDlg.render(document.body);
	stealDlg.hide();
});

</script>

