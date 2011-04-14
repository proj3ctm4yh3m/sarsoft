<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn" %>

Georeference a new image:
<form method="post" enctype="multipart/form-data" name="newgeoref" action="/app/imagery/georef">
Name: <input type="text" size="10" name="name"/><br/>
File: <input type="file" name="binaryData"/><br/>
<input type="submit" value="Create"/>
</form>

<br/>
<br/>
<c:forEach var="image" items="${images}">
<a href="/app/imagery/georef/${image.id}?action=DELETE" style="color: red; font-weight: bold">X</a>&nbsp;<a href="/app/imagery/georef/${image.id}">${image.name}</a><br/>
</c:forEach>