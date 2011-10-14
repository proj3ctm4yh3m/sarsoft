<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn" %>
<%@page import="org.sarsoft.common.model.Tenant.Permission"%>
<% pageContext.setAttribute("none", Permission.NONE); %>
<% pageContext.setAttribute("read", Permission.READ); %>
<% pageContext.setAttribute("write", Permission.WRITE); %>

<h2>Search Admin</h2>

<c:if test="${message ne null}">
<p style="font-weight: bold; color: red">${message}</p>
<br/>
</c:if>
<p>
<form action="/sharing" method="POST">
<table border="0">
<tr><td colspan="2"><b>Search Name</b></td></tr>
<tr><td>Name</td><td><input type="text" size="15" value="${tenant.publicName}" name="description"/></td></tr>

<tr><td colspan="2" style="padding-top: 15px"><b>Sharing</b></td></tr>

<tr><td valign="top">All Users</td>

<td><select name="allUsers">
  <option value="NONE"<c:if test="${tenant.allUserPermission eq none}"> selected="selected"</c:if>>Nothing</option>
  <option value="READ"<c:if test="${tenant.allUserPermission eq read}"> selected="selected"</c:if>>View this map</option>
  <option value="WRITE"<c:if test="${tenant.allUserPermission eq write}"> selected="selected"</c:if>>Edit this map<option>
</select></td></tr>

<tr><td valign="top">Password-Protected Users</td>
<td>
 <c:choose>
  <c:when test="${fn:length(tenant.password) eq 0}">Please set a password:</c:when>
  <c:otherwise>Leave blank to keep the current password:</c:otherwise>
 </c:choose>
 <br/>
 <input type="password" size="15" name="password"/><br/>
 <select name="passwordUsers">
  <option value="NONE"<c:if test="${tenant.passwordProtectedUserPermission eq none}"> selected="selected"</c:if>>Nothing</option>
  <option value="READ"<c:if test="${tenant.passwordProtectedUserPermission eq read}"> selected="selected"</c:if>>View this map</option>
  <option value="WRITE"<c:if test="${tenant.passwordProtectedUserPermission eq write}"> selected="selected"</c:if>>Edit this map<option>
 </select>
</td></tr>
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