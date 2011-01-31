<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn" %>

<h2>Welcome to Sarsoft!</h2>
<c:if test="${message ne null}">
<div style="font-weight: bold; color: red">Error: ${message}</div>
</c:if>
<p>Before you get started, you need to select a search.  You can choose from one of the existing searches below, or create your own.</p>
<p>If the search you are trying to access is password-protected, enter it here:<br/>
<input type="text" size="15" id="password"/>
</p>
<ul>
<c:forEach var="srch" items="${searches}">
<li><a href="javascript:window.location='/app/setsearch/${srch}?password='+document.getElementById('password').value;">${srch}</a></li>
</c:forEach>
</ul>
<p>
<form action="/app/setsearch" method="post">
<b>Create a new search</b><br/>
name: <input type="text" size="15" name="name"/><br/>
<br/>
<b>Optional Information</b><br/>
Password: <input type="text" size="15" name="password"/><br/>
Name of first operational period: <input type="text" size="15" name="op1name"/><br/>
<input type="submit" value="Create Search"/>
</form>
</p>