<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn" %>

<h3>Upload User Content</h3>
<p>This page allows you to upload content to ${version} so that it can be served over the local CP network.  Use
it to host images for georeferencing, or simply for offline file sharing.  Files will be stored in sardata/usercontent.
</p>

<form method="post" enctype="multipart/form-data" name="newcontent" action="/resource/usercontent">
Name: <input type="text" size="10" name="name"/><br/>
File: <input type="file" name="binaryData"/><br/>
<input type="submit" value="Create"/>
</form>

<h3>Existing Content</h3>
<ul>
<c:forEach var="file" items="${files}">
<li><a href="/resource/usercontent/${file}">${file}</a></li>
</c:forEach>
</ul>