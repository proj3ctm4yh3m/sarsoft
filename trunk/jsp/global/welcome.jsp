<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn" %>
<%@ taglib uri="http://tiles.apache.org/tags-tiles" prefix="tiles" %>

<c:if test="${message ne null}">
<div style="font-weight: bold; color: red">Error: ${message}</div>
</c:if>

<div style="float: left; max-width: 20%">
<c:if test="${fn:contains(objects, 'search')}">
<p><a style="font-weight: bold" href="javascript:loadTenants('yourSearches')">Your Searches</a><span id="yourSearches" class="leftnav" style="visibility: hidden; padding-left: 5px">&rarr;</span></p>
</c:if>

<c:if test="${fn:contains(objects, 'map')}">
<p><a style="font-weight: bold" href="javascript:loadTenants('yourMaps')">Your Maps</a><span id="yourMaps" class="leftnav" style="visibility: hidden; padding-left: 5px">&rarr;</span></p>
</c:if>

<c:if test="${fn:contains(objects, 'map')}">
<p><a style="font-weight: bold" href="javascript:loadTenants('recentlyViewed')">Recently Viewed</a><span id="recentlyViewed" class="leftnav" style="visibility: hidden; padding-left: 5px">&rarr;</span></p>
</c:if>
</div>

<div style="float: left; margin-left: 50px; padding-left: 10px; padding-top: 10px; border-left: 1px solid #CCCCCC; max-width: 60%">

<div id="newMap">
<form action="/map" method="post" id="newmapform">
<p>
<b>Create a new Map</b><br/><br/>
<label for="name">Name</label><input type="text" size="15" name="name" id="name"/>

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
</div>

<div id="newSearch">
<form action="/search" method="post" id="newsearchform">
<b>Create a new Search</b><br/><br/>
<label for="name">Name</label><input type="text" size="15" name="name" id="name2"/>

<input type="hidden" id="lat2" name="lat"/>
<input type="hidden" id="lng2" name="lng"/>
</p>
</form>

<div style="padding-top: 15px">If known, enter the starting location in UTM, Lat/Lng, or as an address:</div>
<div id="searchlocation2">
</div>

<div style="padding-top: 15px">
<button onclick="createSearch()">Create Search</button>
</div>

</div>

<div id="existingObj" style="display: none;">
<div id="tenantlistcontainer">
</div>
<span id="clearRecent" style="visibility: hidden">
<br/>
<a href="javascript:clearRecentCookie()">clear this list</a>
</span>
</div>

</div>


<script>
org.sarsoft.Loader.queue(function() {
	
	tenantDAO = new org.sarsoft.TenantDAO();
	tenantTable = new org.sarsoft.view.TenantTable();
	tenantTable.create(document.getElementById("tenantlistcontainer"));
	tenantDAO.loadAll(function(rows) {
		if(rows != null && rows.length > 0) {
			setPane('existingObj');
			tenantTable.table.addRows(rows);
			tenantTable.table.sortColumn(tenantTable.table.getColumn(tenantTable.coldefs[0].key), YAHOO.widget.DataTable.CLASS_ASC);
		} else {
			setPane('newMap');
		}
    });
		
	locform = new org.sarsoft.LocationEntryForm();
	locform.create(document.getElementById('searchlocation'));

	locform2 = new org.sarsoft.LocationEntryForm();
	locform2.create(document.getElementById('searchlocation2'));

});

function setPane(pane) {
	$('#newMap').css("display", "none");
	$('#newSearch').css("display", "none");
	$('#existingObj').css("display", "none");
	
	$('#' + pane).css("display", "block");

	if(pane == 'newMap' || pane == 'newSearch') {
		$('.leftnav').css("visibility", "hidden");
	}
}

function loadTenants(type) {
	var className = null;
	if(type == 'yourSearches') className = 'org.sarsoft.plans.model.Search';
	else if(type == 'yourMaps') className = 'org.sarsoft.markup.model.CollaborativeMap';
	
	$('.leftnav').css("visibility", "hidden");
	$('#' + type).css("visibility", "visible");
	$('#clearRecent').css("visibility", "hidden");

	var handler = function(rows) {
		tenantTable.clear();
		if(rows != null && rows.length > 0) {
			setPane('existingObj');
			tenantTable.table.addRows(rows);
			tenantTable.table.sortColumn(tenantTable.table.getColumn(tenantTable.coldefs[0].key), YAHOO.widget.DataTable.CLASS_ASC);
		} else {
			setPane((type == 'yourSearches') ? 'newSearch' : 'newMap');
		}
	}
	
	if(className != null) tenantDAO.loadByClassName(className, handler);
	else {
		tenantDAO.loadRecent(handler);
		$('#clearRecent').css("visibility", "visible");
	}
}

function clearRecentCookie() {
	YAHOO.util.Cookie.remove("org.sarsoft.recentlyLoadedMaps");
	YAHOO.util.Cookie.remove("org.sarsoft.recentlyLoadedSearches");
	loadTenants('recentlyViewed');
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

function createSearch() {
	var searchname = document.getElementById('name2').value;
	if(searchname == null || searchname.length == 0) {
		alert('Please enter a name for this search.');
		return;
	}
	if(!locform2.read(function(gll) {
		if(gll != null) {
			document.getElementById('lat2').value = gll.lat();
			document.getElementById('lng2').value = gll.lng();
		}
		document.forms["newsearchform"].submit();
	})) document.forms["newsearchform"].submit();
}
</script>

