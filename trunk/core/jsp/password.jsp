<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn" %>
<%@ taglib uri="http://tiles.apache.org/tags-tiles" prefix="tiles" %>

<c:if test="${message ne null}">
<p style="font-weight: bold; color: red">${message}</p>
</c:if>
<div>
<form action="/cachepassword" method="POST">
<span style="font-weight: bold; color: red">The page you are trying to reach may be password protected.</span>  If you have a password please enter it below:<br/>
<label for="password">Password:</label>
<input type="password" name="password" size="10"/>
<input type="hidden" name="dest" value="${targetDest}"/>
<button type="submit">Submit</button>
</form>
</div>
