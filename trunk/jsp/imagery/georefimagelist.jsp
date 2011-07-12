<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn" %>

<h2>Map Imagery</h2>
<p>Sarsoft lets you import custom images (e.g. a scanned park trails map), align them with real-world coordinates, and then use them as a map overlay layer.  Files must be in
an image format (JPEG, PNG, etc.) - no PDFs.</p>

<c:choose>
<c:when test="${fn:length(images) gt 0}">
<h4>Imported Images</h4>
<div id="tablecontainer">
<table id="imagetable">
<thead>
<tr><th>X</th><th>Name</th><th>Width</th><th>Height</th><th>Georeferenced</th></tr>
</thead>
<tbody>
<c:forEach var="img" items="${images}">
<tr><td><a href="/app/imagery/georef/${img.id}?action=DELETE" style="color: red; font-weight: bold">X</a></td><td><a href="/app/imagery/georef/${img.id}">${img.name}</a></td><td>${img.width}</td><td>${img.height}</td><td><c:choose><c:when test="${img.refd}">Yes</c:when><c:otherwise>No</c:otherwise></c:choose></td></tr>
</c:forEach>
</tbody>
</table>
</div>
</c:when>
<c:otherwise>
<br/><br/>
<p>No images have been imported yet.</p>
</c:otherwise>
</c:choose>


<h4>Upload a New Image</h4>
<form method="post" enctype="multipart/form-data" name="newgeoref" action="/app/imagery/georef">
Name: <input type="text" size="10" name="name"/><br/>
File: <input type="file" name="binaryData"/><br/>
<input type="submit" value="Create"/>
</form>

<script>
org.sarsoft.Loader.queue(function() {
	var ds = new YAHOO.util.DataSource(YAHOO.util.Dom.get("imagetable"));
	ds.responseType = YAHOO.util.DataSource.TYPE_HTMLTABLE;
	ds.responseSchema = { fields: [{key: "X"},{key: "Name"}, {key: "Width"}, {key: "Height"}, {key: "Georeferenced"}]};
	var dt = new YAHOO.widget.DataTable("tablecontainer", [{key: "X"},{key: "Name"}, {key: "Width"}, {key: "Height"}, {key: "Georeferenced"}], ds);
	
});
</script>