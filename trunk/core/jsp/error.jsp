<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn" %>
<%@ taglib uri="http://tiles.apache.org/tags-tiles" prefix="tiles" %>
<html>
<head>
</head>
<body>
<h1>Sorry, something seems to have gone wrong!</h1>

<c:if test="${message ne null}">
<p style="font-weight: bold; color: red">${message}</p>
</c:if>

<p>
You may be seeing this page because your session timed out.  Try logging in again.
</p>
<c:if test="${not empty errorid}"><p>Please reference the following error id: ${errorid}</p></c:if>
<ul>
<li>Return to the <a href="/map.html">Map Viewer</a>.</li>
</ul>
</body>
</html>