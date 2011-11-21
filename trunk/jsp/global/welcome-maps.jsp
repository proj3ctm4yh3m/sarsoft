<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn" %>
<%@ taglib uri="http://tiles.apache.org/tags-tiles" prefix="tiles" %>

<c:if test="${message ne null}">
<div style="font-weight: bold; color: red">Error: ${message}</div>
</c:if>

<div style="float: left; max-width: 20%; padding-top: 15px; padding-left: 1.5em; margin-right: 20px; padding-right: 20px; border-right: 1px solid #5a8ed7; min-height: 60%">
<div id="newLink" class="lmenu"><span style="padding-right: 5px" id="newArrow">&#x25B8;</span><a href="javascript:setPane('new')">New</a></div>
<div id="yourLink" class="lmenu"><span style="padding-right: 5px" id="yourArrow">&#x25B8;</span><a href="javascript:setPane('your')">Your Maps</a></div>
<div id="recentLink" class="lmenu"><span style="padding-right: 5px" id="recentArrow">&#x25B8;</span><a href="javascript:setPane('recent')">Recent</a></div>
</div>

<div style="float: left; padding-top: 10px; max-width: 75%">

<div id="newContent">
<form action="/map" method="post" id="newmapform">
<p>
<h2 style="color: #5a8ed7">Create a New Map</h2>

<table border="0"><tbody>
<tr><td valign="top">Name</td><td><input type="text" size="30" id="name" name="name"/></td></tr>
<tr><td valign="top">Comments</td><td><textarea cols="60" rows="5" id="comments" name="comments"></textarea></td></tr>
</tbody></table>

<input type="hidden" id="lat" name="lat"/>
<input type="hidden" id="lng" name="lng"/>
</p>
</form>

<div style="padding-top: 15px">If known, enter the initial location in UTM, Lat/Lng, or as an address:</div>
<div id="searchlocation">
</div>

<div style="padding-top: 15px">
<button onclick="createMap()">Create Map</button>
</div>

<p style="padding-top: 2em;">
Creating a map allows you to draw routes, mark waypoints, transfer data to a GPS, share with others and more.  Once the map is created, right-click anywhere on the map to begin.
</p>
</div>

<div id="yourContent" style="display: none;">
<div id="yourList">
</div>
</div>

<div id="recentContent" style="display: none;">
<div id="recentList">
</div>
<span id="clearRecent" style="visibility: hidden">
<br/>
<a href="javascript:clearRecentCookie()">clear this list</a>
</span>
</div>
</div>


<script>

panes = ["new","your","recent"];

function setPane(pane) {
	for(var i = 0; i < panes.length; i++) {
		$('#' + panes[i] + 'Arrow').css("visibility", "hidden");
		$('#' + panes[i] + 'Content').css("display", "none");
		$('#' + panes[i] + 'Link').css("color", "#333333");
	}

	$('#' + pane + 'Arrow').css("visibility", "visible");
	$('#' + pane + 'Content').css("display", "block");
	$('#' + pane + 'Link').css("color", "945e3b");
}

function clearRecentCookie() {
	YAHOO.util.Cookie.remove("org.sarsoft.recentlyLoadedMaps");
	recentTable.clear();
}

function createMap() {
	var searchname = document.getElementById('name').value;
	if(searchname == null || searchname.length == 0) {
		alert('Please enter a name for this map.');
		return;
	}
	if(!locform.read(function(gll) {
		if(gll != null) {
			document.getElementById('lat').value = gll.lat();
			document.getElementById('lng').value = gll.lng();
		}
		document.forms["newmapform"].submit();
	})) document.forms["newmapform"].submit();
}

org.sarsoft.Loader.queue(function() {
	
	tenantDAO = new org.sarsoft.TenantDAO();
	yourTable = new org.sarsoft.view.TenantTable();
	yourTable.create(document.getElementById("yourList"));
	recentTable = new org.sarsoft.view.TenantTable();
	recentTable.create(document.getElementById("recentList"));

	tenantDAO.loadRecent(function(rows) {
		recentTable.table.addRows(rows);
		if(rows != null && rows.length > 0) $('#clearRecent').css("visibility", "visible");
	});
	tenantDAO.loadByClassName("org.sarsoft.markup.model.CollaborativeMap", function(rows) {
		yourTable.table.addRows(rows);
	});
		
	locform = new org.sarsoft.LocationEntryForm();
	locform.create(document.getElementById('searchlocation'));
	
	setPane('new');
});

</script>

