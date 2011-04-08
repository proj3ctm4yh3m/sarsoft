<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn" %>

<script>
function newgeoref() {
	window.location='/app/imagery/georef/' + document.getElementById('newfilename').value;
}
</script>
<a href="javascript:newgeoref()">Georeference a new image</a> named&nbsp;<input type="text" size="20" id="newfilename"/>
<br/>
<br/>
<c:forEach var="iamge" items="${images}">
<a href="/app/imagery/georef/${image.filename}?action=DELETE" style="color: red; font-weight: bold">X</a>&nbsp;<a href="/app/imagery/georef/${image.filename}">${image.filename}</a>
</c:forEach>