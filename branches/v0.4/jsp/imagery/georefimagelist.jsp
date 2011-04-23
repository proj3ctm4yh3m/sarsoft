<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn" %>

<h2>Georeferenced Imagery</h2>
If you have scanned documents like a park trails map, you can upload them, align them with the map through a process called georeferencing, and
then use them as an overlay layer.
<br/>
<br/>
<br/>
<b>Upload a New Image</b>
<form method="post" enctype="multipart/form-data" name="newgeoref" action="/app/imagery/georef">
Name: <input type="text" size="10" name="name"/><br/>
File: <input type="file" name="binaryData"/><br/>
<input type="submit" value="Create"/>
</form>

<br/>
<br/>
<b>Current Images</b><br/>
<c:forEach var="image" items="${images}">
<a href="/app/imagery/georef/${image.id}?action=DELETE" style="color: red; font-weight: bold">X</a>&nbsp;<a href="/app/imagery/georef/${image.id}">${image.name}</a><br/>
</c:forEach>