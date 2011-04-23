<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn" %>

<h2>Search Admin</h2>

<c:if test="${message ne null}">
<p style="font-weight: bold; color: red">${message}</p>
<br/>
</c:if>
<b>Update Public Name</b><br/>
<p>
You can update the following search attributes.
<br/>
<form action="/app/search" method="POST">
<table border="0">
<tr><td>Name</td><td><input type="text" size="15" value="${search.publicName}" name="description"/></td></tr>
<c:if test="${hosted eq true}">
<tr><td>Public?</td><td><input type="checkbox" name="public" value="public" <c:if test="${search.visible}">checked="checked"</c:if>/></td></tr>
<tr><td>Password</td><td><input type="password" size="15" name="password"/></td></tr>
</c:if>
</table>

<input type="submit" value="Update"/>
</form>
</p>

<c:if test="${search.visible eq true}">
<br/>
<b>Sharing</b><br/>
<p>
This search is publicly visible.  You can share it with others by giving them the following URL: <a href="${server}app/setsearch/${search.name}">${server}app/setsearch/${search.name}</a>
</p>
</c:if>

<c:if test="${deleteable}">
<a href="/app/search/delete">Delete this search</a>&nbsp;(Must not have any operational periods).
</c:if>
<br/>
<p>Yes, that's really all you can do on this page right now.
<br/><br/>
<a href="/">Take me home.</a>
</p>