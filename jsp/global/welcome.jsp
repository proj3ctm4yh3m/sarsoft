<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn" %>

<c:choose>
<c:when test="${account ne null}">
<h2>Welcome to Sarsoft, ${account.email}.</h2>
<a href="/app/logout">Logout</a>
<br/>
</c:when>
<c:otherwise>
<h2>Welcome to Sarsoft!</h2>
<div>
${welcomeMessage}
</div>
</c:otherwise>
</c:choose>

<c:if test="${message ne null}">
<div style="font-weight: bold; color: red">Error: ${message}</div>
</c:if>

<c:if test="${tenant ne null}">
<c:set var="url">
<c:choose><c:when test="${tenant.class.name eq 'org.sarsoft.markup.model.CollaborativeMap'}">/map?id=${tenant.name}</c:when><c:otherwise>/app/setsearch/${tenant.name}</c:otherwise></c:choose>
</c:set>
<div style="font-size: larger; padding-bottom: 20px">
Continue working on <a href="${url}">${tenant.description}</a>.
</div>
</c:if>

<div style="float: left">
<c:if test="${tenantSubclasses['org.sarsoft.plans.model.Search']}">
<b>Your Searches</b>
<ul>
<c:forEach var="tenant" items="${tenants}">
<c:if test="${tenant.class.name eq 'org.sarsoft.plans.model.Search'}">
<li><a href="javascript:window.location='/app/setsearch/${tenant.name}'">${tenant.description}</a></li>
</c:if>
</c:forEach>
</ul>
<br/>
</c:if>

<c:if test="${tenantSubclasses['org.sarsoft.markup.model.CollaborativeMap']}">
<b>Your Maps</b>
<ul>
<c:forEach var="tenant" items="${tenants}">
<c:if test="${tenant.class.name eq 'org.sarsoft.markup.model.CollaborativeMap'}">
<li><a href="javascript:window.location='/map?id=${tenant.name}'">${tenant.description}</a></li>
</c:if>
</c:forEach>
</ul>
</c:if>

<div id="recentlyLoadedSearchDiv" style="display: none">
<b>Recently Viewed Searches</b>
<ul id="recentlyLoadedSearchUl">
</ul>
</div>

<div id="recentlyLoadedMapDiv" style="display: none">
<b>Recently Viewed Maps</b>
<ul id="recentlyLoadedMapUl">
</ul>
<a href="javascript:clearRecentMaps()">Clear</a>
</div>

</div>

<div style="float: left; margin-left: 50px; padding-left: 10px; border-left: 1px solid #CCCCCC">

<c:choose>
<c:when test="${hosted eq true and account eq null}">
<div style="float: left; clear: both">
<p>You need to log in with a Google or Yahoo account to create new maps and searches.  If someone's shared a URL with you, you don't need to log
in to use their map.
</p>
<p>
Log in using your:
<ul>
<li><a href="/app/openidrequest?domain=google">Google account</a></li>
<li><a href="/app/openidrequest?domain=yahoo">Yahoo account</a></li>
</ul>
</p>
</div>

</c:when>
<c:otherwise>
<form action="/app/setsearch" method="post" id="newsearch">
<b>Create a new search</b><br/>
<table border="0">
<tr><td>Search Name:</td><td><input type="text" size="15" name="name" id="name"/></td></tr>
<tr><td>Name of first operational period:</td><td><input type="text" size="15" name="op1name"/></td></tr>
</table>

<input type="hidden" id="lat" name="lat"/>
<input type="hidden" id="lng" name="lng"/>
</form>

<div style="padding-top: 15px">If known, enter the location of your search in UTM, Lat/Lng, or as an address:</div>
<div id="searchlocation">
</div>

<div style="padding-top: 15px">
<button onclick="createSearch()">Create Search</button>
<button onclick="createMap()">Create Map</button>
</div>
</c:otherwise>
</c:choose>
</div>

<script>
org.sarsoft.Loader.queue(function() {
	locform = new org.sarsoft.LocationEntryForm();
	locform.create(document.getElementById('searchlocation'));
	var recentlyLoaded = YAHOO.util.Cookie.get("org.sarsoft.recentlyLoadedMaps");
	if(recentlyLoaded != null) {
		$('#recentlyLoadedMapDiv').css("display","block");
		var maps = recentlyLoaded.split(',');
		for(var i = 0; i < maps.length; i++) {
			var map = maps[i].split('=');
			$('#recentlyLoadedMapUl').append('<li><a href="/map?id=' + map[0] + '">' + map[1] + '</a></li>');
		}
	}
});

function clearRecentMaps() {
	YAHOO.util.Cookie.remove("org.sarsoft.recentlyLoadedMaps");
	$('#recentlyLoadedMapDiv').css("display","none");
}

function createMap() {
	document.forms["newsearch"].action="/map";
	createSearch();
}

function createSearch() {
	var searchname = document.getElementById('name').value;
	if(searchname == null || searchname.length == 0) {
		alert('Please enter a name for this search.');
		return;
	}
	if(!locform.read(function(gll) {
		if(gll != null) {
			document.getElementById('lat').value = gll.lat();
			document.getElementById('lng').value = gll.lng();
		}
		document.forms["newsearch"].submit();
	})) document.forms["newsearch"].submit();
}
</script>
