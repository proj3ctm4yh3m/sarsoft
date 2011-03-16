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
<span style="font-weight: bold; color: red">This is a demo server running dev/test code.  Not for production use.  Data may be deleted without warning.</span>
<br/>
</c:otherwise>
</c:choose>
<c:if test="${message ne null}">
<div style="font-weight: bold; color: red">Error: ${message}</div>
</c:if>
<c:choose>
<c:when test="${hosted eq true and account eq null}">

<p><b>This version of sarsoft is hosted.</b><br/>
In order to maintain privacy and security, you must log in to create new searches.  If someone else has
created a search that you want to view, you can get a direct-access URL from them.
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

<p>Before you get started, you need to select a search.  You can choose from one of the existing searches below, or create your own.</p>
</p>
<b>Select an existing search</b><br/>
<ul>
<c:forEach var="srch" items="${searches}">
<li><a href="javascript:window.location='/app/setsearch/${srch.name}'">${srch.description}</a></li>
</c:forEach>
</ul>
<br/>
<p>
<form action="/app/setsearch" method="post">
<b>Create a new search</b><br/>
<table border="0">
<tr><td>Search Name:</td><td><input type="text" size="15" name="name"/></td></tr>
<tr><td>Name of first operational period:</td><td><input type="text" size="15" name="op1name"/></td></tr>
<c:if test="${hosted eq true}">
<tr><td>Public?</td><td><input type="checkbox" name="public" checked="checked" value="public"/></td></tr>
<tr><td>Password:</td><td><input type="text" size="15" name="password"/></td></tr>
</c:if>
</table>
<c:if test="${hosted eq true}">
<div style="width: 400px">
Other users will only be able to access your search if you supply them with a unique code.  However, with this code,
they will have the ability to make any changes you can.  You can restrict access by password-protecting the search,
or by preventing the public from accessing it even if they do know your search's unique ID.
</div>
</c:if>
<input type="submit" value="Create Search"/>
</form>
</p>

</c:otherwise>
</c:choose>