<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn" %>

<div style="padding-left: 1.5em">

<c:if test="${message ne null}">
<div style="font-weight: bold; color: red">Error: ${message}</div>
</c:if>

<h2>Your Account</h2>

<div style="max-width: 500px">
Your email is <b><c:out value="${account.email}"/></b>.
By default, your account name will show up as a shortened version of your email.  You can choose a different username by entering it below, or leave the box blank to use the default name.<br/><br/>
Your current username is <b><c:out value="${account.handle}"/></b>
</div>

<form action="/account.html" method="post" style="padding-top: 2em">
Username:
<input type="text" size="15" name="alias" value="${account.alias}"/>
<input type="submit" value="GO"/>
</form>

</div>