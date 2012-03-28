<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn" %>
<%@page import="org.sarsoft.common.util.RuntimeProperties"%>
<%@page import="org.sarsoft.common.model.Tenant.Permission"%>
<% pageContext.setAttribute("refreshInterval", RuntimeProperties.getProperty("sarsoft.refreshInterval")); %>
<% pageContext.setAttribute("userPermission", RuntimeProperties.getUserPermission()); %>
<% pageContext.setAttribute("none", Permission.NONE); %>
<% pageContext.setAttribute("read", Permission.READ); %>
<% pageContext.setAttribute("write", Permission.WRITE); %>
<% pageContext.setAttribute("admin", Permission.ADMIN); %>

<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"><%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<html>
<head>
${head}
<script type="text/javascript">
function doload() {
org.sarsoft.Loader.queue(function() {
  <c:choose>
  <c:when test="${tenant.class.name ne 'org.sarsoft.markup.model.CollaborativeMap' or empty tenant.defaultCenter}">
    map = org.sarsoft.EnhancedGMap.createMap(document.getElementById('map_canvas'));
  </c:when>
  <c:otherwise>
   map = org.sarsoft.EnhancedGMap.createMap(document.getElementById('map_canvas'), new GLatLng(${tenant.defaultCenter.lat}, ${tenant.defaultCenter.lng}), 14);
  </c:otherwise>
  </c:choose>
  var embed = !(window==top);
  imap = new org.sarsoft.InteractiveMap(map, {standardControls : !embed, UTM: true, switchableDatum : true, container : $('#page_container')[0]});
  markupController = new org.sarsoft.controller.MarkupMapController(imap, false, embed);
  if(!embed) {
	toolsController = new org.sarsoft.controller.MapToolsController(imap);
    collabWidget = new org.sarsoft.MapCollaborationWidget(imap);
  }
  configWidget = new org.sarsoft.view.PersistedConfigWidget(imap, (!embed && org.sarsoft.userPermissionLevel != "READ"), true);
  configWidget.loadConfig();

  <c:if test="${userPermission eq admin}">
  	$('#sharingpermissions').appendTo(imap.registered["org.sarsoft.DataNavigator"].settings_tenant).css('display', 'block');
  	imap.registered["org.sarsoft.DataNavigator"].settings_tenant.css('display', 'block');
  </c:if>
  if(!embed) {
	imap.message("Right click on map background to create shapes", 30000);

	var leaveImg = jQuery('<img src="' + org.sarsoft.imgPrefix + '/home.png" style="cursor: pointer; vertical-align: middle" title="Return to home page"/>');
	var leaveDD = new org.sarsoft.view.MenuDropdown(leaveImg, 'left: 0; width: 100%', imap.map._overlaydropdownmapcontrol.div);

	var leaveBody = jQuery('<div style="padding-top: 5px">Leave map view?<br/><br/></div>').appendTo(leaveDD.div);
	var leaveCB = jQuery('<input type="checkbox" value="save">Save map settings for future page loads (data is automatically saved as you work on it)</input>');
	if(org.sarsoft.userPermissionLevel == "ADMIN" || org.sarsoft.userPermissionLevel == "WRITE") {
		leaveCB.appendTo(leaveBody);
		jQuery('<br/><br/>').appendTo(leaveBody);
	}
	
	leaveHandler = function(url) {
		if(leaveCB.attr("checked")=="checked") {
			configWidget.saveConfig(function() {
				window.location = url;
			});
		} else {
			window.location = url;
		}
	}
	var bottomRow = jQuery('<div>Go To:</div>').appendTo(leaveBody);
	jQuery('<a href="javascript:leaveHandler(\'/maps\')" style="margin-left: 5px">Home Page</a>').appendTo(bottomRow);
	jQuery('<a href="javascript:leaveHandler(\'/guide?id=${tenant.name}\')" style="margin-left: 20px">Printable Guide</a>').appendTo(bottomRow);
	
	imap.addMenuItem(leaveDD.container, 40);

  }
	$(document).ready(function() { $(document).bind("contextmenu", function(e) { return false;})});
});
}
</script>
</head>
<body onload="doload()" onunload="GUnload()" class="yui-skin-sam" style="border: 0px; margin: 0px; padding: 0px">
<div id="page_container" style="height: 100%">
 <div id="map_left">
 </div>
 <div id="map_right" style="height: 100%">
  <div id="map_canvas" style="width: 100%; height: 100%"></div>
 </div>
</div>

<c:if test="${userPermission eq admin}">
<div style="display: none" id="sharingpermissions">
<form action="/admin.html" method="post" id="sharingform">

<input type="hidden" name="type" value="map"/>
<input type="hidden" name="tid" value="${tenant.name}"/>
<table border="0" style="width: 90%"><tbody>
<tr><td valign="top" style="width: 10em">Name</td><td><input type="text" size="30" value="${tenant.publicName}" name="description"/></td></tr>
<tr><td valign="top">Comments</td><td><textarea style="width: 100%; height: 10em" name="comments">${tenant.comments}</textarea></td></tr>
</tbody></table>

<c:if test="${hosted}">
<div style="padding-bottom: 5px; padding-top: 10px">
<input type="checkbox" name="shared" value="true" id="sharedcb"<c:if test="${tenant.shared}"> checked="checked"</c:if>/> 
 <span>Make this <c:choose><c:when test="${tenant.class.name eq 'org.sarsoft.plans.model.Search'}">search</c:when><c:otherwise>map</c:otherwise></c:choose></span> <a href="/find" target="_new">visible to everyone</a>.<br/><br/>
<label for="allUsers">Allow anyone you share this <c:choose><c:when test="${tenant.class.name eq 'org.sarsoft.plans.model.Search'}">search</c:when><c:otherwise>map</c:otherwise></c:choose> with to</label>
<select name="allUsers" id="allusersdd">
  <option value="NONE"<c:if test="${tenant.allUserPermission eq none}"> selected="selected"</c:if>>do nothing - data is password protected</option>
  <option value="READ"<c:if test="${tenant.allUserPermission eq read}"> selected="selected"</c:if>>view the map</option>
  <option value="WRITE"<c:if test="${tenant.allUserPermission eq write}"> selected="selected"</c:if>>edit the map</option>
</select>
<br/>

<label for="passwordUsers">If you set a password below and give it to someone, they can</label>
<select name="passwordUsers">
 <option value="NONE"<c:if test="${tenant.passwordProtectedUserPermission eq none}"> selected="selected"</c:if>>do nothing - data is private</option>
 <option value="READ"<c:if test="${tenant.passwordProtectedUserPermission eq read}"> selected="selected"</c:if>>view the map</option>
 <option value="WRITE"<c:if test="${tenant.passwordProtectedUserPermission eq write}"> selected="selected"</c:if>>edit the map</option>
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
</div>
</c:if>

<button id="sharingsubmit">Save Changes to Sharing and Permissions</button>

</form>

<script>
$('#sharingsubmit').click(function() { $('#sharingform').submit()});
$('#allusersdd').change(function() { var val = $('#sharedcb').prop('checked'); var val2 = $('#allusersdd').val(); if(val && val2 == 'NONE') $('#sharedcb').prop('checked', false)});
$('#sharedcb').change(function() { var val = $('#sharedcb').prop('checked'); var val2 = $('#allusersdd').val(); if(val && val2 == 'NONE') $('#allusersdd').val('READ')});
</script>

</div>
</c:if>

</body>
</html>