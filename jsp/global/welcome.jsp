<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn" %>

<h2>Welcome to Sarsoft<c:if test="${account ne null}">, ${account.email}.  (<a href="/app/logout">Logout</a>)</c:if></h2>
<div>
${welcomeMessage}

<c:if test="${message ne null}">
<div style="font-weight: bold; color: red">Error: ${message}</div>
</c:if>

<c:if test="${targetDest ne null}">
<div>
<form action="/cachepassword" method="POST">
The page you are trying to reach is password protected.  Please enter it below:<br/>
<label for="password">Password:</label>
<input type="password" name="password" size="10"/>
<input type="hidden" name="dest" value="${targetDest}"/>
<button type="submit">Submit</button>
</form>
</div>
</c:if>

<c:if test="${tenant ne null}">
<c:set var="url">
<c:choose><c:when test="${tenant.class.name eq 'org.sarsoft.markup.model.CollaborativeMap'}">/map?id=${tenant.name}</c:when><c:otherwise>/search?id=${tenant.name}</c:otherwise></c:choose>
</c:set>
<div>
Continue working on: <a href="${url}">${tenant.description}</a>.
</div>
</c:if>
<div style="padding-bottom: 20px; border-bottom: 1px solid #CCCCCC">
You can always use the <a href="/app/map.html">Quick Map Viewer</a> to browse map layers if you don't need to save anything.
</div>

<div style="float: left">
<c:if test="${tenantSubclasses['org.sarsoft.plans.model.Search']}">
<p><b>Your Searches</b>
<ul>
<c:forEach var="tenant" items="${tenants}">
<c:if test="${tenant.class.name eq 'org.sarsoft.plans.model.Search'}">
<li><a href="javascript:window.location='/search?id=${tenant.name}'">${tenant.description}</a></li>
</c:if>
</c:forEach>
</ul>
</p>
</c:if>

<c:if test="${tenantSubclasses['org.sarsoft.markup.model.CollaborativeMap']}">
<p><b>Your Maps</b>
<ul>
<c:forEach var="tenant" items="${tenants}">
<c:if test="${tenant.class.name eq 'org.sarsoft.markup.model.CollaborativeMap'}">
<li><a href="javascript:window.location='/map?id=${tenant.name}'">${tenant.description}</a></li>
</c:if>
</c:forEach>
</ul>
</p>
</c:if>

<div id="recentlyLoadedSearchDiv" style="display: none">
<p><b>Recently Viewed Searches</b>
<ul id="recentlyLoadedSearchUl">
</ul>
<a href="javascript:clearRecentSearches()">Clear</a>
</p>
</div>

<div id="recentlyLoadedMapDiv" style="display: none">
<p><b>Recently Viewed Maps</b>
<ul id="recentlyLoadedMapUl">
</ul>
<a href="javascript:clearRecentMaps()">Clear</a>
</p></div>

</div>

<div style="float: left; margin-left: 50px; padding-left: 10px; border-left: 1px solid #CCCCCC">

<c:choose>
<c:when test="${hosted eq true and account eq null}">
<div style="float: left; clear: both">
<p>You need to log in with a Google or Yahoo account to create new objects.  If someone's shared a URL with you, you can visit it directly
without logging in.
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
<form action="/search" method="post" id="newsearch">
<p>
<b>Create a new object</b><br/><br/>
<label for="name">Name</label><input type="text" size="15" name="name" id="name"/>

<input type="hidden" id="lat" name="lat"/>
<input type="hidden" id="lng" name="lng"/>
</p>
</form>

<div style="padding-top: 15px">If known, enter the starting location in UTM, Lat/Lng, or as an address:</div>
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

	recentlyLoaded = YAHOO.util.Cookie.get("org.sarsoft.recentlyLoadedSearches");
	if(recentlyLoaded != null) {
		$('#recentlyLoadedSearchDiv').css("display","block");
		var searches = recentlyLoaded.split(',');
		for(var i = 0; i < searches.length; i++) {
			var search = searches[i].split('=');
			$('#recentlyLoadedSearchUl').append('<li><a href="/search?id=' + search[0] + '">' + search[1] + '</a></li>');
		}
	}
});

function clearRecentMaps() {
	YAHOO.util.Cookie.remove("org.sarsoft.recentlyLoadedMaps");
	$('#recentlyLoadedMapDiv').css("display","none");
}

function clearRecentSearches() {
	YAHOO.util.Cookie.remove("org.sarsoft.recentlyLoadedSearches");
	$('#recentlyLoadedSearchDiv').css("display","none");
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
