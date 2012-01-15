<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn" %>
<%@page import="org.sarsoft.common.model.Tenant.Permission"%>
<% pageContext.setAttribute("none", Permission.NONE); %>
<% pageContext.setAttribute("read", Permission.READ); %>
<% pageContext.setAttribute("write", Permission.WRITE); %>

<c:set var="tenanttype">
<c:choose><c:when test="${tenant.class.name eq 'org.sarsoft.plans.model.Search'}">search</c:when><c:otherwise>map</c:otherwise></c:choose>
</c:set>

<h2><c:choose><c:when test="${tenant.class.name eq 'org.sarsoft.plans.model.Search'}">Search</c:when><c:otherwise>Map</c:otherwise></c:choose> Admin</h2>

<c:if test="${message ne null}">
<p style="font-weight: bold; color: red">${message}</p>
<br/>
</c:if>

<form action="/admin.html" method="POST">

<table border="0"><tbody>
<tr><td valign="top">Name</td><td><input type="text" size="30" value="${tenant.publicName}" name="description"/></td></tr>
<tr><td valign="top">Comments</td><td><textarea cols="60" rows="5" name="comments">${tenant.comments}</textarea></td></tr>
</tbody></table>

<p>
<c:set var="myLayers" value=",${tenant.layers},"/>
<div style="font-size: larger; font-weight: bold">Layers</div>
<div style="padding-bottom: 1em">
Control which layers are visible on this ${tenanttype}.  Uncheck all boxes to return to the ${friendlyName} defaults.
</div>
<c:forEach var="source" items="${mapSources}">
<div style="width: 350px; float: left; padding-right: 1em; padding-bottom: 1em">
<c:set var="thisLayer" value=",${source.alias},"/>
<input type="checkbox" name="ml_${source.alias}" value="true" <c:if test="${fn:contains(myLayers, thisLayer)}">checked="checked"</c:if>/><b>${source.name}</b>
<br/>
${source.description}

</div>
</c:forEach>
</p>

<div style="clear: both; height: 2em"></div>

<c:if test="${hosted}">
<p>
<div style="font-size: larger; font-weight: bold">Sharing</div>
<input type="checkbox" name="shared" value="true" id="sharedcb"<c:if test="${tenant.shared}"> checked="checked"</c:if>/> <span style="font-weight: bold; color: #5a8ed7">Share this <c:choose><c:when test="${tenant.class.name eq 'org.sarsoft.plans.model.Search'}">search</c:when><c:otherwise>map</c:otherwise></c:choose>.</span>  Allow others to find it on ${version}.<br/><br/>
<label for="allUsers">All Users can</label>
<select name="allUsers" id="allusersdd">
  <option value="NONE"<c:if test="${tenant.allUserPermission eq none}"> selected="selected"</c:if>>Nothing</option>
  <option value="READ"<c:if test="${tenant.allUserPermission eq read}"> selected="selected"</c:if>>View this map</option>
  <option value="WRITE"<c:if test="${tenant.allUserPermission eq write}"> selected="selected"</c:if>>Edit this map</option>
</select>
<br/>

<label for="passwordUsers">Users who know the password can</label>
<select name="passwordUsers">
 <option value="NONE"<c:if test="${tenant.passwordProtectedUserPermission eq none}"> selected="selected"</c:if>>Nothing</option>
 <option value="READ"<c:if test="${tenant.passwordProtectedUserPermission eq read}"> selected="selected"</c:if>>View this map</option>
 <option value="WRITE"<c:if test="${tenant.passwordProtectedUserPermission eq write}"> selected="selected"</c:if>>Edit this map</option>
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
<input type="submit" value="Save Changes"/> &mdash; or, <a href="<c:choose><c:when test="${tenant.class.name eq 'org.sarsoft.plans.model.Search'}">/searches</c:when><c:otherwise>/maps</c:otherwise></c:choose>">return without saving.</a>
</form>

<c:if test="${deleteable}">
<p style="padding-top: 30px">
You can also <a href="javascript:deleteDlg.show()">delete this <c:choose><c:when test="${tenant.class.name eq 'org.sarsoft.plans.model.Search'}">search</c:when><c:otherwise>map</c:otherwise></c:choose></a>.
</p>
</c:if>

<div id="deleteObject" style="top: 150px; left: 150px; position: absolute; z-index: 200; width: 300px;">
	<div class="hd">Delete</div>
	<div class="bd">
	Are you sure you want to delete ${tenant.description}?  This action cannot be undone.
	</div>
</div>

<script>
org.sarsoft.Loader.queue(function() {
	deleteDlg = new YAHOO.widget.Dialog("deleteObject", {zIndex: "2500", width: "300px"});
	deleteDlg.cfg.queueProperty("buttons", [ { text : "Delete", handler: function() { window.location="/admin/delete?id=${tenant.name}" } }, { text: "Cancel", isDefault: true, handler: function() { deleteDlg.hide(); }} ]);
	deleteDlg.render(document.body);
	deleteDlg.hide();
});
$('#allusersdd').change(function() { var val = $('#sharedcb').prop('checked'); var val2 = $('#allusersdd').val(); if(val && val2 == 'NONE') $('#sharedcb').prop('checked', false)});
$('#sharedcb').change(function() { var val = $('#sharedcb').prop('checked'); var val2 = $('#allusersdd').val(); if(val && val2 == 'NONE') $('#allusersdd').val('READ')});
</script>