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
${welcomeMessage}
<c:if test="${fn:length(welcomeMessage) gt 0}"><br/></c:if>
</c:otherwise>
</c:choose>
<c:if test="${message ne null}">
<div style="font-weight: bold; color: red">Error: ${message}</div>
</c:if>
<c:choose>
<c:when test="${hosted eq true and account eq null}">

<p><b>This server is connected to the Internet</b>.  In order to keep sensitive information private and 
prevent miscreants from vandalizing your data, you must log in to create new searches.
</p>
<p>
Once you create a search, you can share it with others using a secret URL; they will not need to log in.
</p>
<p>
Log in using your:
<ul>
<li><a href="/app/openidrequest?domain=google">Google account</a></li>
<li><a href="/app/openidrequest?domain=yahoo">Yahoo account</a></li>
</ul>
</p>

</c:when>
<c:otherwise>


<p>Before you get started, you need to select a search to work on.  You can choose from the list of 
<c:choose>
 <c:when test="${hosted eq true}">searches created by your account</c:when>
 <c:otherwise>all searches on this server</c:otherwise>
</c:choose>
below, or create a new one.
</p>

<b>
<c:choose>
 <c:when test="${hosted eq true}">Searches Created By Your Account</c:when>
 <c:otherwise>All Searches On This Server</c:otherwise>
</c:choose>
</b><br/>
<ul>
<c:forEach var="tenant" items="${tenants}">
<c:if test="${tenant.class.name eq 'org.sarsoft.plans.model.Search'}">
<li><a href="javascript:window.location='/app/setsearch/${tenant.name}'">${tenant.description}</a></li>
</c:if>
</c:forEach>
</ul>
<br/>

<b>
<c:choose>
 <c:when test="${hosted eq true}">Interactive Maps Created By Your Account</c:when>
 <c:otherwise>All Interactive Maps On This Server</c:otherwise>
</c:choose>
</b><br/>
<ul>
<c:forEach var="tenant" items="${tenants}">
<c:if test="${tenant.class.name eq 'org.sarsoft.markup.model.CollaborativeMap'}">
<li><a href="javascript:window.location='/map?id=${tenant.name}'">${tenant.description}</a></li>
</c:if>
</c:forEach>
</ul>
<br/>

<br/>
<p>
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
</p>

<script>
org.sarsoft.Loader.queue(function() {
	locform = new org.sarsoft.LocationEntryForm();
	locform.create(document.getElementById('searchlocation'));
});

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