<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn" %>
<%@page import="org.sarsoft.plans.model.SearchAssignment"%>

<h2>Operational Period ${period.id}: ${period.description}</h2>

<c:set var="area" value="${period.area*10}"/>
<c:set var="perimeter" value="${period.perimeter*10}"/>
This period has ${fn:length(period.assignments)} assignments, covering ${(area+((area%1 ge 0.5)?(1-(area%1))%1:-(area%1)))/10} km&sup2; of grid searching,
 ${(perimeter+((perimeter%1 ge 0.5)?(1-(perimeter%1))%1:-(perimeter%1)))/10} km of trails and ${period.timeAllocated} team-hours.
<c:set var="distance" value="${period.trackDistance*10}"/>
<c:if test="${distance gt 0}">${(distance+((distance%1 ge 0.5)?(1-(distance%1))%1:-(distance%1)))/10} km of tracks have been downloaded.</c:if>  You can:<br/>

<ul>
 <li><a href="/app/operationalperiod/${period.id}/map">Switch to a map view</a> to create assignments and edit segments.</li>
 <li>Export as:&nbsp;<a href="/rest/operationalperiod/${period.id}?format=gpx">GPX</a>&nbsp;|&nbsp;<a href="/rest/operationalperiod/${period.id}?format=kml">KML</a>&nbsp;|&nbsp;<a href="/rest/operationalperiod/${period.id}?format=csv">CSV</a></li>
 <li><a href="javascript:showbulkupdate()">Update</a> or <a href="javascript:showbulkprint()">Print</a> multiple assignments at once.</li>
<c:choose>
 <c:when test="${fn:length(period.assignments) eq 0}">
 <li><a href="/app/operationalperiod/${period.id}?action=DELETE">Delete Operational Period</a> (must not contain any assignments).</li>
 </c:when>
 <c:otherwise>
 <li><a href="javascript:showrename()">Rename</a> this operational period.</li>
 </c:otherwise>
</c:choose>
</ul>

<div id="rename" style="display: none">
<p>Rename this operational period.</p>
Name: <input type="text" size="15" value="${period.description}" id="renamestr"/>
<br/><br/>
 <a style="left: 20px" href="javascript:submitrename()">Rename</a>
 &nbsp;&nbsp;
 <a style="left: 20px" href="javascript:hiderename()">Cancel</a>
</div>

<div id="bulkupdate" style="display: none">
<h3>Bulk Update Assignments</h3>

<p>Update multiple assignments at once.  Use shift+click and ctrl+click to select assignments from the list, and fill in all fields you want to update.  Blank fields will be ignored;
you can not clear fields through bulk update.</p>


			<form name="assignment" action="/app/assignment" method="post">
			 <input type="hidden" value="" name="bulkIds" id="bulkIds"/>
			 <input type="hidden" value="UPDATE" name="action" id="action"/>
			 <table border="0">
			 <tr><td>
			 <table border="0">
			 <tr><td>Resource Type</td><td>
				 <select name="resourceType" value="">
				  <option value="">--</option>
				  <c:forEach var="type" items="<%= SearchAssignment.ResourceType.values() %>">
				   <option value="${type}"<c:if test="${assignment.resourceType == type}"> selected="selected"</c:if>>${type}</option>
				  </c:forEach>
				 </select></td></tr>
			 <tr><td>Time Allocated</td><td><input name="timeAllocated" type="text" size="4" value=""/> hours</td></tr>
			 <tr><td>POD (Responsive)</td><td>
			    <select name="responsivePOD">
			    <option value="">--</option>
			    <c:forEach var="type" items="<%= org.sarsoft.plans.model.Probability.values() %>">
			      <option value="${type}">${type}</option>
			    </c:forEach>
			    </select>
			  </td></tr>
			<tr><td style="padding-right: 5px">POD (Unresponsive)</td><td>
			    <select name="unresponsivePOD">
			    <option value="">--</option>
			    <c:forEach var="type" items="<%= org.sarsoft.plans.model.Probability.values() %>">
			      <option value="${type}">${type}</option>
			    </c:forEach>
			    </select>
			  </td></tr>
			<tr><td style="padding-right: 5px">POD (Clue)</td><td>
			    <select name="cluePOD">
			    <option value="">--</option>
			    <c:forEach var="type" items="<%= org.sarsoft.plans.model.Probability.values() %>">
			      <option value="${type}">${type}</option>
			    </c:forEach>
			    </select>
			  </td></tr>
			<tr><td style="padding-right: 5px">Primary Freq</td><td><input name="primaryFrequency" type="text" size="10" value=""></td></tr>
			<tr><td style="padding-right: 5px">Secondary Freq</td><td><input name="secondaryFrequency" type="text" size="10" value=""></td></tr>
			  </table>
</td><td style="padding-left: 3em">
			<b>Previous Efforts in Search Area:</b><br/>
			<textarea name="previousEfforts" style="width: 30em; height: 80px"></textarea>

			<br/><br/>
			<b>Dropoff and Pickup Instructions:</b><br/>
			<textarea name="transportation" style="width: 30em; height: 80px"></textarea>

</td></tr></table>

			If you'd like to prepare these assignments, please enter your name here:<br/>
			<input type="text" size="20" name="preparedBy"/><br/><br/>
			 <a style="left: 20px" href="javascript:submitbulkupdate(false)">Save Changes</a>
			 &nbsp;&nbsp;
			 <a style="left: 20px" href="javascript:submitbulkupdate(true)">Save Changes and Prepare Assignment</a>
			 &nbsp;&nbsp;
			 <a style="left: 20px" href="javascript:hidebulkupdate()">Cancel</a>

			</form>

</div>

<div id="bulkprint" style="display: none">
<h3>Bulk Print</h3>

<p>Print multiple assignments at once.  Use shift+click and ctrl+click to select assignments from the list, and choose the forms/maps you wish to print.</p>

<input type="checkbox" name="print104" id="print104">Print SAR 104 forms</input><br/><br/>

<c:forEach var="num" items='<%= new Integer[] {1,2,3,4,5} %>' varStatus='status'>
<input type="checkbox" name="printmap${num}" id="printmap${num}">Print this map:</input>
Base&nbsp;<select name="map${num}f" id="map${num}f">
  <c:forEach var="source" items="${mapSources}">
  <option value="${source.name}">${source.name}</option>
  </c:forEach>
</select>
,&nbsp;&nbsp;Overlay&nbsp;
<select name="map${num}b" id="map${num}b">
  <c:forEach var="source" items="${mapSources}">
  <option value="${source.name}">${source.name}</option>
  </c:forEach>
  <c:forEach var="image" items="${geoRefImages}">
  <option value="${image.name}">${image.name}</option>
  </c:forEach>
</select>
,&nbsp;&nbsp;Opacity&nbsp;
<input type="text" id="map${num}o" name="map${num}o" value="0" size="2"> percent
,&nbsp;&nbsp;<input type="checkbox" name="map${num}prev" id="map${num}prev"}>Show Previous Efforts</input><br/>
</c:forEach>

<br/>
 <a style="left: 20px" href="javascript:submitbulkprint()">Print</a>
 &nbsp;&nbsp;
 <a style="left: 20px" href="javascript:hidebulkprint()">Cancel</a>

</div>

<div id="listcontainer">
</div>

<script>
org.sarsoft.Loader.queue(function() {
  datatable = new org.sarsoft.view.SearchAssignmentTable();
  datatable.create(document.getElementById("listcontainer"));
  var dao = new org.sarsoft.OperationalPeriodDAO();
  dao.loadAssignments(function(rows) {
    if(rows == null || rows.length == 0) {
    	datatable.table.showTableMessage("<i>No Assignments Found</i>");
    } else {
	  	datatable.table.addRows(rows);
	}
  }, ${period.id});
  
  assignmentDAO = new org.sarsoft.SearchAssignmentDAO();
  assignmentDAO.mark();
});

function assignmentListTimer() {
	if(document.getElementById('bulkupdate').style.display == "block" || document.getElementById('bulkprint').style.display == "block") return;
	assignmentDAO.loadSince(function(assignments) {
		var sortedBy = datatable.table.get("sortedBy");
		datatable.table.set("sortedBy", null);
		var rs = datatable.table.getRecordSet();
		for(var i = 0; i < assignments.length; i++) {
			if(assignments[i].operationalPeriodId==${period.id}) {
				for(var j = 0; j < rs.getLength(); j++) {
					if(rs.getRecord(j).getData().id == assignments[i].id) {
						datatable.table.deleteRow(j);
					}
				}
				datatable.table.addRow(assignments[i]);
			}
		}
		datatable.table.sortColumn(sortedBy.column, sortedBy.dir);
	});
	assignmentDAO.mark();
}

setInterval("assignmentListTimer()", 15000);

function showbulkupdate() {
hidebulkprint();
datatable.setClickOverride(false);
document.getElementById('bulkupdate').style.display="block";
}

function hidebulkupdate() {
datatable.setClickOverride(true);
document.getElementById('bulkupdate').style.display="none";
}

function submitbulkupdate(finalize) {
var data = datatable.getSelectedData();
if(data.length == 0) {
	alert("Please select at least one assignment to update.");
} else {
	var value = "";
	for(var i = 0; i < data.length; i++) {
		value = value + data[i].id + ",";
	}
	document.getElementById("bulkIds").value=value;
	if(finalize) document.getElementById("action").value="FINALIZE";
	document.forms['assignment'].submit();
}
}

function showbulkprint() {
  hidebulkupdate();
  datatable.setClickOverride(false);
  document.getElementById('bulkprint').style.display="block";
}

function hidebulkprint() {
  datatable.setClickOverride(true);
  document.getElementById('bulkprint').style.display="none";
}

function submitbulkprint() {
var data = datatable.getSelectedData();
if(data.length == 0) {
	alert("Please select at least one assignment to print.");
} else {
	var value = "";
	for(var i = 0; i < data.length; i++) {
		value = value + data[i].id + ",";
	}
	var url = "/app/assignment?format=print&bulkIds=" + value;
	url = url + "&print104=" + document.getElementById('print104').checked;
	for(var i = 1; i < 6; i++) {
    if(document.getElementById("printmap" + i).checked) {
		url = url + "&map" + i + "f=" + document.getElementById("map" + i + "f").value + "&map" + i + "b=" + document.getElementById("map" + i + "b").value +
			"&map" + i + "o=" + document.getElementById("map" + i + "o").value;
		if(document.getElementById("map" + i + "prev").checked) url = url + "&map" + i + "prev=true";
	}
  	}
  	window.location=url;
}
}

function showrename() {
	hidebulkupdate();
	hidebulkprint();
	document.getElementById('rename').style.display="block";
}

function hiderename() {
	document.getElementById('rename').style.display="none";
}

function submitrename() {
	window.location="/app/operationalperiod/${period.id}?action=UPDATE&name=" + document.getElementById("renamestr").value;
}
</script>
