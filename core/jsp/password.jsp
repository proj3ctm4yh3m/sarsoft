<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn" %>
<%@ taglib uri="http://tiles.apache.org/tags-tiles" prefix="tiles" %>

<div>
<form action="/cachepassword" method="POST">
<span style="font-weight: bold; color: red">The page you are trying to reach is password protected.</span>  Please enter it below:<br/>
<label for="password">Password:</label>
<input type="password" name="password" size="10"/>
<input type="hidden" name="dest" value="${targetDest}"/>
<button type="submit">Submit</button>
</form>
</div>
