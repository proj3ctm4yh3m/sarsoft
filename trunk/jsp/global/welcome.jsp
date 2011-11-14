<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn" %>

<div style="padding-left: 10px">
<h2>Welcome to ${friendlyName}<c:if test="${account ne null}">, ${account.email}.  (<a href="/app/logout">Logout</a>)</c:if></h2>
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


<c:choose>
<c:when test="${hosted eq true and account eq null}">
<c:choose>
<c:when test="${fn:length(welcomeHTML) gt 0}">
${welcomeHTML}
</c:when>
<c:otherwise>
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
</c:otherwise>
</c:choose>
</c:when>


<c:otherwise>
<div style="height: 2px; width: 100%; border-bottom: 1px solid #CCCCCC"></div>
<div style="float: left; max-width: 20%">
<c:if test="${fn:contains(objects, 'search')}">
<p><b>Your Searches</b>
<ul>
<c:set var="tenantFound" value="${false}"/>
<c:forEach var="tenant" items="${tenants}">
<c:if test="${tenant.class.name eq 'org.sarsoft.plans.model.Search'}">
<c:set var="tenantFound" value="${true}"/>
<li><a href="/search?id=${tenant.name}">${tenant.description}</a></li>
</c:if>
</c:forEach>
</ul>
<c:if test="${tenantFound eq false}">
Create a search to get started.
</c:if>
</p>
</c:if>

<c:if test="${fn:contains(objects, 'map')}">
<p><b>Your Maps</b>
<ul>
<c:set var="tenantFound" value="${false}"/>
<c:forEach var="tenant" items="${tenants}">
<c:if test="${tenant.class.name eq 'org.sarsoft.markup.model.CollaborativeMap'}">
<c:set var="tenantFound" value="${true}"/>
<li><a href="/map?id=${tenant.name}">${tenant.description}</a></li>
</c:if>
</c:forEach>
</ul>
<c:if test="${tenantFound eq false}">
Create a map to get started.
</c:if>
</p>
</c:if>

<div id="recentlyLoadedSearchDiv" style="display: none">
<p><b>Recently Viewed Searches</b>
<ul id="recentlyLoadedSearchUl">
</ul>
<a href="javascript:clearRecentSearches()">Clear Recent Searches</a>
</p>
</div>

<div id="recentlyLoadedMapDiv" style="display: none">
<p><b>Recently Viewed Maps</b>
<ul id="recentlyLoadedMapUl">
</ul>
<a href="javascript:clearRecentMaps()">Clear Recent Maps</a>
</p></div>

</div>

<div style="float: left; margin-left: 50px; padding-left: 10px; border-left: 1px solid #CCCCCC; max-width: 60%">

<form action="/search" method="post" id="newsearch">
<c:set var="objname">
<c:choose><c:when test="${objects eq 'map'}">map</c:when><c:otherwise>object</c:otherwise></c:choose></c:set>
<p>
<b style="text-transform: capitalize">create a new ${objname}</b><br/>
Get started working with ${friendlyName} by creating a new ${objname} (you can change this
information later).<c:if test="${hosted eq true}">  New ${objname}s will be accessible (read-only) by others,
but only if you give them the URL.  You can control this on the admin page (inside the setup dialog for maps).
</c:if>  You can back up ${objname}s by exporting to the GPX file format.  ${friendlyName} will store additional
 metadata in the GPX file so that all everything can be recreated when the GPX is imported.

<br/><br/>
<label for="name">Name</label><input type="text" size="15" name="name" id="name"/>

<input type="hidden" id="lat" name="lat"/>
<input type="hidden" id="lng" name="lng"/>
</p>
</form>

<div style="padding-top: 15px">If known, enter the starting location in UTM, Lat/Lng, or as an address:</div>
<div id="searchlocation">
</div>

<div style="padding-top: 15px">
<c:if test="${fn:contains(objects, 'search')}"><button onclick="createSearch()">Create Search</button></c:if>
<c:if test="${fn:contains(objects, 'map')}"><button onclick="createMap()">Create Map</button></c:if>
</div>
</div>

<script>
org.sarsoft.Loader.queue(function() {
	locform = new org.sarsoft.LocationEntryForm();
	locform.create(document.getElementById('searchlocation'));

	var recentlyLoaded = YAHOO.util.Cookie.get("org.sarsoft.recentlyLoadedMaps");
	if(recentlyLoaded != null) {
		if(recentlyLoaded.indexOf('"') == 0) recentlyLoaded = recentlyLoaded.substring(1, recentlyLoaded.length - 1);
		$('#recentlyLoadedMapDiv').css("display","block");
		var maps = recentlyLoaded.split(',');
		for(var i = 0; i < maps.length; i++) {
			var map = maps[i].split('=');
			$('#recentlyLoadedMapUl').append('<li><a href="/map?id=' + map[0] + '">' + map[1] + '</a></li>');
		}
	}

	recentlyLoaded = YAHOO.util.Cookie.get("org.sarsoft.recentlyLoadedSearches");
	if(recentlyLoaded != null) {
		if(recentlyLoaded.indexOf('"') == 0) recentlyLoaded = recentlyLoaded.substring(1, recentlyLoaded.length - 1);
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
</c:otherwise>
</c:choose>

</div>
