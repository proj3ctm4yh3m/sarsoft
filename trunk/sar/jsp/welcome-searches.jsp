<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn" %>
<%@ taglib uri="http://tiles.apache.org/tags-tiles" prefix="tiles" %>

<c:if test="${message ne null}">
<div style="font-weight: bold; color: red">Error: ${message}</div>
</c:if>

<div style="padding-left: 14em; padding-right: 1em; padding-top: 15px;">

<div style="position: relative; float: left; width: 13em; margin-left: -14em; border-right: 1px solid #5a8ed7; height: 15em">
<div id="newLink" class="lmenu"><span style="padding-right: 5px" id="newArrow">&#x25B8;</span><a href="javascript:setPane('new')">New</a></div>
<div id="yourLink" class="lmenu"><span style="padding-right: 5px" id="yourArrow">&#x25B8;</span><a href="javascript:setPane('your')">Your Searches</a></div>
</div>

<div style="position: relative; float: left; width: 100%">

<div id="newContent">
<div style="color: #5a8ed7; font-size: 1.5em; font-weight: bold; padding-bottom: 5px">Create a New Search</div>
<form action="/search" method="post" id="newsearchform">

<table border="0"><tbody>
<tr><td valign="top">Name</td><td><input type="text" size="30" id="name" name="name"/></td></tr>
<tr><td valign="top">Comments</td><td><textarea cols="60" rows="5" id="comments" name="comments"></textarea></td></tr>
</tbody></table>

<input type="hidden" id="lat" name="lat"/>
<input type="hidden" id="lng" name="lng"/>
</p>
</form>

<div style="padding-top: 15px">If known, enter the initial location in UTM, Lat/Lng, or as an address or place name:</div>
<div id="searchlocation">
</div>

<div style="padding-top: 15px">
<button onclick="createSearch()">Create Search</button>
</div>

</div>

<div id="yourContent" style="display: none;">
<div id="yourList" class="growYUITable">
</div>
</div>


</div>

<script>

panes = ["new","your"];

function setPane(pane) {
	for(var i = 0; i < panes.length; i++) {
		$('#' + panes[i] + 'Arrow').css("visibility", "hidden");
		$('#' + panes[i] + 'Content').css("display", "none");
		$('#' + panes[i] + 'Link').css("color", "#333333");
	}

	$('#' + pane + 'Arrow').css("visibility", "visible");
	$('#' + pane + 'Content').css("display", "block");
	$('#' + pane + 'Link').css("color", "#945e3b");
}

function createSearch() {
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
		document.forms["newsearchform"].submit();
	})) document.forms["newsearchform"].submit();
}

org.sarsoft.Loader.queue(function() {
	
	tenantDAO = new org.sarsoft.TenantDAO();
	yourTable = new org.sarsoft.view.TenantTable();
	yourTable.create(document.getElementById("yourList"));

	tenantDAO.loadByClassName("org.sarsoft.plans.model.Search", function(rows) {
		yourTable.update(rows);
		if(rows == null || rows.length == 0) setPane('new');
	});
		
	locform = new org.sarsoft.LocationEntryForm();
	locform.create(document.getElementById('searchlocation'));
	
	setPane('your');
});

</script>

