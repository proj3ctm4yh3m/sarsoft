<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn" %>

<h2>Search Admin</h2>

<c:if test="${message ne null}">
<p style="font-weight: bold; color: red">${message}</p>
<br/>
</c:if>
<p>
<form action="/app/search" method="POST">
<table border="0">
<tr><td colspan="2"><b>Search Name and Datum</b></td></tr>
<tr><td>Name</td><td><input type="text" size="15" value="${tenant.publicName}" name="description"/></td></tr>
<tr><td>Datum</td><td><select name="datum">
  <option value="WGS84"<c:if test="${tenant.datum eq 'WGS84'}"> selected="selected"</c:if>>WGS84</option>
  <option value="NAD27 CONUS"<c:if test="$tenant.datum eq 'NAD27 CONUS'}"> selected="selected"</c:if>>NAD27 CONUS</option>
</select></td></tr>

<tr><td colspan="2" style="padding-top: 15px"><b>Sharing</b></td></tr>
<c:choose>
<c:when test="${hosted eq true}">

<tr><td colspan="2" style="padding-bottom: 15px">
<c:choose>
<c:when test="${tenant.visible}">
This search is publicly visible.  You can share it with others by giving them the following URL: <a href="${server}app/setsearch/${tenant.name}">${server}app/setsearch/${search.name}</a>.<br/>
  <c:choose>
  <c:when test="${fn:length(search.password) gt 0}">
This search is password protected; anyone with that URL will still need to know the password.
  </c:when>
  <c:otherwise>
You have not set a password; anyone with the above URL will be able to view this search.
  </c:otherwise>
  </c:choose>
</c:when>
<c:otherwise>
You are the only one allowed to view this search.
</c:otherwise>
</c:choose>
</td></tr>
<tr><td>Shared?</td><td><input type="checkbox" name="public" value="public" <c:if test="${tenant.visible}">checked="checked"</c:if>/><span class="hint">Allow others to view/edit this search.</span>
</td></tr>
<tr><td valign="top">Password</td><td><input type="password" size="15" name="password"/><br/><span class="hint">Leave blank to keep the search's current password.</span></td></tr>
</c:when>
<c:otherwise>
<tr><td colspan="2">Anyone with access to Sarsoft can view and make changes to this search.</td></tr>
</c:otherwise>
</c:choose>
</table>


<input type="submit" value="Update"/>
</form>
</p>

<c:if test="${deleteable}">
<a href="/app/search/delete">Delete this search</a>&nbsp;(Must not have any operational periods).
</c:if>
<br/>
<p>Yes, that's really all you can do on this page right now.
<br/><br/>
<a href="/">Take me home.</a>
</p>