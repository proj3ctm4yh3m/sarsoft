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

</body>
</html>