<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn" %>

<div>
<h2>Bulk Operations - <c:choose><c:when test="${not empty period}">${period.description}</c:when><c:otherwise>All Assignments</c:otherwise></c:choose></h2>
<p>Use shift+click and ctrl+click to select assignments from the list.</p>
</div>

<div id="listcontainer">
</div>

<div style="margin-top: 20px">
<a href="javascript:submitbulkforms()">Print 104 Forms</a><a style="margin-left: 20px" href="javascript:submitbulkprint()">Print Maps (Browser)</a>
<a style="margin-left: 20px" href="javascript:showbulkpdf();">Print Maps (Auto PDF)</a><a style="margin-left: 20px" href="javascript:custompdf();">Print Maps (Custom PDF)</a><a style="margin-left: 20px" href="javascript:showbulkupdate()">Update</a>
</div>

<div id="bulkpdf" style="display: none; margin-top: 20px">
</div>

<div id="bulkupdate" style="display: none; margin-top: 20px">
Fill in all fields you want to update.  Blank fields will be ignored; you can not clear fields through bulk update.

			<form name="assignment" action="/sar/bulk" method="post">
			 <input type="hidden" value="" name="ids" id="ids"/>
			 <input type="hidden" value="UPDATE" name="action" id="action"/>
			 <table border="0">
			 <tr><td>
			 <table border="0">
			 <tr><td>Operational Period</td><td>
				 <select name="operationalPeriodId" value="">
				  <option value="">--</option>
				  <c:forEach var="period" items="${periods}">
				   <option value="${period.id}">${period.description}</option>
				  </c:forEach>
				 </select></td></tr>
			 <tr><td>Resource Type</td><td>
				 <select name="resourceType" value="">
				  <option value="">--</option>
				  <c:forEach var="type" items="<%= org.sarsoft.plans.model.Assignment.ResourceType.values() %>">
				   <option value="${type}">${type}</option>
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

<script>
org.sarsoft.Loader.queue(function() {
  datatable = new org.sarsoft.AssignmentTable();
  datatable.create(document.getElementById("listcontainer"));
  var dao = new org.sarsoft.AssignmentDAO();
  dao.loadAll(function(assignment) {
<c:if test="${not empty period}">if(assignment.operationalPeriodId != ${period.id}) return;</c:if>
	datatable.table.addRow(assignment);
  });
  if(org.sarsoft.PDFLayerControl != null) window.plc = new org.sarsoft.PDFLayerControl($('#bulkpdf'));
  $('<a style="margin-top: 20px" href="javascript:submitbulkpdf()">Generate PDF</a>').appendTo($('#bulkpdf'));
});

function submitbulkupdate(finalize) {
	var data = datatable.getSelectedData();
	if(data.length == 0) {
		alert("Please select at least one assignment to update.");
	} else {
		var value = "";
		for(var i = 0; i < data.length; i++) {
			value = value + data[i].id + ",";
		}
		document.getElementById("ids").value=value;
		if(finalize) document.getElementById("action").value="FINALIZE";
		document.forms['assignment'].submit();
	}
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
		
		window.location="/sar/maps/browser?ids=" + value;
	}
}

function submitbulkforms() {
	var data = datatable.getSelectedData();
	if(data.length == 0) {
		alert("Please select at least one assignment to print.");
	} else {
		var url = '/sar/104?ids=';
		for(var i = 0; i < data.length; i++) {
			url = url + data[i].id + ",";
		}
		window.open(url, '_blank');
	}
}

function submitbulkpdf() {
	var data = datatable.getSelectedData();
	if(data.length == 0) {
		alert("Please select at least one assignment to print.");
	} else {
		var url = '/sar/maps/pdf?ids=';
		for(var i = 0; i < data.length; i++) {
			url = url + data[i].id + ",";
		}
		var config = window.plc.read();
		if(config != null) url = url + "&layer=" + org.sarsoft.EnhancedGMap.toLayerStr(config);
		window.open(url, '_blank');
	}
}

function custompdf() {
	var data = datatable.getSelectedData();
	if(data.length == 0) {
		alert("Please select at least one assignment to print.");
	} else {
		var url = '/sar/print?ids=';
		for(var i = 0; i < data.length; i++) {
			url = url + data[i].id + ",";
		}
		window.open(url, '_blank');
	}
}

function showbulkpdf() {
	$('#bulkpdf').css('display', 'block');
	$('#bulkupdate').css('display', 'none');
	return false;
}

function showbulkupdate() {
	$('#bulkpdf').css('display', 'none');
	$('#bulkupdate').css('display', 'block');
	return false;
}

</script>

