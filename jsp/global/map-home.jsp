<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn" %>

<h2>Sarsoft Home Page - ${tenant.description}</h2>
<ul>
<c:if test="${hosted eq true and search.visible}">
 <li>Share this map with others using the following url: <a href="${server}map?id=${tenant.name}">${server}map?id=${tenant.name}</a>.
</c:if>
 <li><a href="/map">Work on a different map</a>.</li>

<c:if test="${account ne null}">
<li>Logged in as ${account.email}.  <a href="/app/logout">Logout</a></li>
</c:if>
</ul>

<ul>
<li>View your <a href="/map.html">map.</a></li>
<c:choose>
<c:when test="${hosted eq false}">
 <li><a href="/app/search">Map Admin.</a>  Change map datum and search name.</li>
</c:when>
<c:when test="${tenant.account.name eq username}">
 <li><a href="/app/search">Map Admin.</a>  Map datum, sharing and password protection.</li>
</c:when>
</c:choose>
</ul>
