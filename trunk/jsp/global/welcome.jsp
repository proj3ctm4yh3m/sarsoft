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
<c:forEach var="srch" items="${searches}">
<li><a href="javascript:window.location='/app/setsearch/${srch.name}'">${srch.description}</a></li>
</c:forEach>
</ul>
<br/>
<p>
<form action="/app/setsearch" method="post" id="newsearch">
<b>Create a new search</b><br/>
<table border="0">
<tr><td>Search Name:</td><td><input type="text" size="15" name="name" id="name"/></td></tr>
<tr><td>Name of first operational period:</td><td><input type="text" size="15" name="op1name"/></td></tr>
</table>

<div style="padding-top: 15px">If known, enter the location of your search in UTM, Lat/Lng, or as an address:</div>
<table border="0">
<tr><td valign="top">UTM</td><td><input type="text" size="2" name="utm_zone" id="utm_zone"/><span class="hint">zone</span>&nbsp;<input type="text" size="9" name="utm_e" id="utm_e"/><span class="hint">E</span>&nbsp;<input type="text" size="9" name="utm_n" id="utm_n"/><span class="hint">N</span></td></tr>
<tr><td valign="top">Lat/Lng</td><td><input type="text" size="8" name="lat" id="lat"/>,&nbsp;<input type="text" size="8" name="lng" id="lng"/><br/><span class="hint">WGS84 decimal degrees, e.g. 39.3422, -120.2036</span></td></tr>
<tr id="address_tr"><td valign="top">Address</td><td><input type="text" size="16" name="address" id="address"/><br/><span class="hint">e.g. 'Truckee, CA'.  Requires a working internet connection.</span></td></tr>
</table>

</form>
<div style="padding-top: 15px">
<button onclick="createSearch()">Create Search</button>
</div>
</p>

<script>
if(typeof GClientGeocoder == 'undefined') {
	document.getElementById('address_tr').style.display = "none";
}

function createSearch() {
	var searchname = document.getElementById('name').value;
	if(searchname == null || searchname.length == 0) {
		alert('Please enter a name for this search.');
		return;
	}
	var zone = document.getElementById('utm_zone').value;
	if(zone != null && zone.length > 0) {
		if(zone.length > 2) zone = zone.substring(0, 2);
		var e = document.getElementById('utm_e').value;
		var n = document.getElementById('utm_n').value;
		var gll = GeoUtil.UTMToGLatLng({e: e, n: n, zone: zone});
		document.getElementById('lat').value = gll.lat();
		document.getElementById('lng').value = gll.lng();
	}
	var addr = document.getElementById('address').value;
	if(addr != null && addr.length > 0 && typeof GClientGeocoder != 'undefined') {
		var gcg = new GClientGeocoder();
		gcg.getLatLng(addr, function(gll) {
			if(gll == null) {
				alert('unable to geocode address "' + addr + '".');
			} else {
				document.getElementById('lat').value = gll.lat();
				document.getElementById('lng').value = gll.lng();
				document.forms["newsearch"].submit();
			}
		});
	} else {
		document.forms["newsearch"].submit();
	}
}
</script>

</c:otherwise>
</c:choose>