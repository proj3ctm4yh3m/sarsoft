<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn" %>

<h2>Clue Log</h2>

<ul>
 <li><a href="javascript:showNewClueForm()">Report New Clue</a></li>
</ul>

<div id="newclue" style="display: none">
<form method="POST" action="/app/clue/new" name="newClue">
<table border="0">
<tr><td valign="top">Summary:</td><td><input type="text" name="summary" size="20"/></td></tr>
<tr><td valign="top">Description:</td><td><textarea rows="5" cols="40" name="description"></textarea></td></tr>
<tr><td valign="top">Found By:</td><td>
 <select name="assignmentid">
  <option value="">--</option>
  <c:forEach var="assignment" items="${assignments}">
   <option value="${assignment.id}">${assignment.id}</option>
  </c:forEach>
 </select>
</td></tr>
<tr><td valign="top">Location:</td><td><textarea rows="3" cols="40" name="location"></textarea><br/><span class="hint">Descriptive location, e.g. "in storm drain"</span></td></tr>
<tr><td valign="top">UTM:</td><td><input type="text" size="2" name="utm_zone" id="utm_zone"/><span class="hint">zone</span>&nbsp;<input type="text" size="9" name="utm_e" id="utm_e"/><span class="hint">E</span>&nbsp;<input type="text" size="9" name="utm_n" id="utm_n"/><span class="hint">N</span></td></tr>
</td></tr>
</table>
<input type="hidden" name="lat" id="lat"/>
<input type="hidden" name="lng" id="lng"/>
</form>
<div style="padding-top: 15px"><button onclick="javascript:hideNewClueForm()">Cancel</button>&nbsp;&nbsp;<button onclick="createClue()">Create Clue</button></div>
</div>

<div id="clues">
</div>

<script>
org.sarsoft.Loader.queue(function() {
  cluetable = new org.sarsoft.view.ClueTable();
  cluetable.create(document.getElementById("clues"));

  dao = new org.sarsoft.ClueDAO();
  dao.loadAll(function(clues) {
  	cluetable.table.showTableMessage("<i>No Clues Found</i>");

  	cluetable.table.addRows(clues);
  });
  
  
  function clueListTimer() {
    dao.loadSince(function(clues) {
		var sortedBy = cluetable.table.get("sortedBy");
		cluetable.table.set("sortedBy", null);
		var rs = cluetable.table.getRecordSet();
		for(var i = 0; i < clues.length; i++) {
			for(var j = 0; j < rs.getLength(); j++) {
				if(rs.getRecord(j).getData().id == clues[i].id) {
					cluetable.table.deleteRow(j);
				}
			}
			cluetable.table.addRow(clues[i]);
		}
		if(sortedBy != null) cluetable.table.sortColumn(sortedBy.column, sortedBy.dir);
	});
	dao.mark();
  }
  dao.mark();
  setInterval(clueListTimer, 15000);
});

function showNewClueForm() {
  document.getElementById('newclue').style.display='block';	
}

function hideNewClueForm() {
	  document.getElementById('newclue').style.display='none';	
	}

function createClue() {
	var zone = document.getElementById('utm_zone').value;
	if(zone != null && zone.length > 0) {
		if(zone.length > 2) zone = zone.substring(0, 2);
		var e = document.getElementById('utm_e').value;
		var n = document.getElementById('utm_n').value;
		var gll = GeoUtil.toWGS84(GeoUtil.UTMToGLatLng({e: e, n: n, zone: zone}));
		document.getElementById('lat').value = gll.lat();
		document.getElementById('lng').value = gll.lng();
	}
	document.forms["newClue"].submit();
}
</script>