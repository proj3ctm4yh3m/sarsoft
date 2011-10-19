<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn" %>
<%@page import="org.sarsoft.common.model.Tenant.Permission"%>
<% pageContext.setAttribute("none", Permission.NONE); %>
<% pageContext.setAttribute("read", Permission.READ); %>
<% pageContext.setAttribute("write", Permission.WRITE); %>

<h2><c:choose><c:when test="${tenant.class.name eq 'org.sarsoft.plans.model.Search'}">Search</c:when><c:otherwise>Map</c:otherwise></c:choose> Admin</h2>

<c:if test="${message ne null}">
<p style="font-weight: bold; color: red">${message}</p>
<br/>
</c:if>

<form action="/admin.html" method="POST">

<p>
<label for="description">Name</label>
<input type="text" size="30" value="${tenant.publicName}" name="description"/>
</p>

<c:if test="${hosted}">
<p>
<h3>Sharing</h3>
<label for="allUsers">All Users can</label>
<select name="allUsers">
  <option value="NONE"<c:if test="${tenant.allUserPermission eq none}"> selected="selected"</c:if>>Nothing</option>
  <option value="READ"<c:if test="${tenant.allUserPermission eq read}"> selected="selected"</c:if>>View this map</option>
  <option value="WRITE"<c:if test="${tenant.allUserPermission eq write}"> selected="selected"</c:if>>Edit this map<option>
</select>
<br/>

<label for="passwordUsers">Users who know the password can</label>
<select name="passwordUsers">
 <option value="NONE"<c:if test="${tenant.passwordProtectedUserPermission eq none}"> selected="selected"</c:if>>Nothing</option>
 <option value="READ"<c:if test="${tenant.passwordProtectedUserPermission eq read}"> selected="selected"</c:if>>View this map</option>
 <option value="WRITE"<c:if test="${tenant.passwordProtectedUserPermission eq write}"> selected="selected"</c:if>>Edit this map<option>
</select>
<br/>

Password:
<input type="password" size="15" name="password"/> 
<span class="hint">
 <c:choose>
 <c:when test="${fn:length(tenant.password) eq 0}">No password currently set</c:when>
 <c:otherwise>Leave blank to keep the current password</c:otherwise>
</c:choose>
</span>
</p>
</c:if>
<input type="submit" value="Update"/>
</form>

<c:if test="${deleteable}">
<p style="padding-top: 20px">
<a href="javascript:deleteDlg.show()">Delete this object</a>.
</p>
</c:if>
<p style="padding-top: 20px"><a href="/">Take me home.</a></p>

<div id="deleteObject" style="top: 150px; left: 150px; position: absolute; z-index: 200; width: 300px;">
	<div class="hd">Delete</div>
	<div class="bd">
	Are you sure you want to delete ${tenant.description}?  This action cannot be undone.
	</div>
</div>

<script>
org.sarsoft.Loader.queue(function() {
	deleteDlg = new YAHOO.widget.Dialog("deleteObject", {zIndex: "2500", width: "300px"});
	deleteDlg.cfg.queueProperty("buttons", [ { text: "Cancel", isDefault: true, handler: function() { deleteDlg.hide(); }}, { text : "Delete", handler: function() { window.location="/admin/delete?id=${tenant.name}" } }]);
	deleteDlg.render(document.body);
	deleteDlg.hide();
});
</script>