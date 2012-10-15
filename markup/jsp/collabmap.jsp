<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn" %>
<%@page import="org.sarsoft.common.util.RuntimeProperties"%>
<%@page import="org.sarsoft.common.model.Tenant.Permission"%>
<% pageContext.setAttribute("refreshInterval", RuntimeProperties.getProperty("sarsoft.refreshInterval")); %>
<% pageContext.setAttribute("userPermission", RuntimeProperties.getUserPermission()); %>
<% pageContext.setAttribute("serverUrl", RuntimeProperties.getServerUrl()); %>
<% pageContext.setAttribute("none", Permission.NONE); %>
<% pageContext.setAttribute("read", Permission.READ); %>
<% pageContext.setAttribute("write", Permission.WRITE); %>
<% pageContext.setAttribute("admin", Permission.ADMIN); %>

<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"><%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<html>
<head>
<meta content='True' name='HandheldFriendly' />
<meta name="viewport" content="initial-scale=1.0, maximum-scale=1.0, user-scalable=0"/>
<meta name="format-detection" content="telephone=no" />
${head}
<script type="text/javascript">
function doload() {
org.sarsoft.Loader.queue(function() {
  map = org.sarsoft.EnhancedGMap.createMap(document.getElementById('map_canvas')<c:if test="${not empty tenant.defaultCenter}">, new google.maps.LatLng(${tenant.defaultCenter.lat}, ${tenant.defaultCenter.lng}), 14</c:if>);
  var embed = !(window==top);
  var opts = {UTM: true, switchableDatum: true, label: true, standardControls: !embed, container: (embed ? null : $('#page_container')[0])}
  imap = new org.sarsoft.InteractiveMap(map, opts);
  var dn = imap.registered["org.sarsoft.DataNavigator"];

  var account = new org.sarsoft.DNTree(imap.container.left, org.sarsoft.username == null ? "Not Signed In" : org.sarsoft.username);
  account._lock = true;
  account.header.css({"padding-top": "3px", "margin": "0px", "font-weight": "bold", color: "white", "background-color": "#666666", "padding-bottom": "3px"});
  account.header.prepend(jQuery('<img style="vertical-align: text-bottom; margin-right: 2px" src="' + org.sarsoft.imgPrefix + '/folder.png"/>'));
  account.body.css('padding-left', '2px');

  if(org.sarsoft.username != null) {
    dn.defaults.account = new org.sarsoft.widget.Account(imap, account.body);
  } else {
    dn.defaults.account = new org.sarsoft.widget.NoAccount(imap, account.body);
  }

  new org.sarsoft.widget.BrowserSettings(imap, account.body);
  
  var tc = new org.sarsoft.DNTree(imap.container.left, org.sarsoft.tenantname);
  tc._lock = true;
  tc.header.css({"text-transform": "capitalize", "margin": "0px", "padding-top": "3px", "font-weight": "bold", color: "white", "background-color": "#666666", "padding-bottom": "3px"});
  tc.header.prepend('<img style="margin-right: 2px; vertical-align: text-top" src="' + org.sarsoft.imgPrefix + '/favicon.png"/>');
  tc.body.css('padding-left', '2px');
  dn.defaults.body = tc.body;
  
  dn.defaults.savedAt.appendTo(tc.body);
  dn.defaults.sharing = new org.sarsoft.widget.Sharing(imap, tc.body);
  $('#sharingpermissions').appendTo(dn.defaults.sharing.settings).css('display', 'block');
  if(org.sarsoft.userPermissionLevel == "READ") {
		var pwd = jQuery('<div style="padding-top: 1em"></div>').appendTo(dn.defaults.sharing.collaborate);
		var pwdform = jQuery('<form action="/password" method="post"><input type="hidden" name="dest" value="' + window.location + '"/></form>').appendTo(pwd);
		pwdform.append('If this map\'s owner has set a password, you can enter it for write acess:');
		pwdform.append('<input type="password" name="password"/>');
		jQuery('<button>Enter Password</button>').appendTo(pwdform).click(function() { pwdform.submit(); });
  }
  
  dn.defaults.layers = new org.sarsoft.widget.MapLayers(imap, tc.body);
  dn.defaults.io = new org.sarsoft.widget.ImportExport(imap, tc.body);
  
	jQuery('<div style="float: right; color: red; cursor: pointer; margin-right: 2px">X</div>').prependTo(tc.header).click(function() {
		window.location="/map.html#" + org.sarsoft.MapURLHashWidget.createConfigStr(imap);
	}).attr("title", "Close " + org.sarsoft.tenantname);
  

  markupController = new org.sarsoft.controller.MarkupMapController(imap, false, embed);
  if(!embed) {
	toolsController = new org.sarsoft.controller.MapToolsController(imap);
	georefController = new org.sarsoft.controller.CustomLayerController(imap);
	org.sarsoft.BrowserCheck();
  }
  configWidget = new org.sarsoft.view.PersistedConfigWidget(imap, (!embed && org.sarsoft.userPermissionLevel != "READ"), true);
  configWidget.loadConfig();

  <c:if test="${userPermission eq admin}">
	dn.defaults.sharing.handler = function() { $('#sharingform').submit(); }
	var detailslink = jQuery('<div style="margin-bottom: 3px; margin-top: 3px; font-weight: bold; color: #5a8ed7; cursor: pointer; margin-right: 2px"><img style="vertical-align: text-bottom; margin-right: 2px" src="' + org.sarsoft.imgPrefix + '/details.png"/>Details</div>').insertBefore(dn.defaults.layers.tree.block);
	var settings_details = jQuery('<div></div>').append($('#detailsform').css('display', 'block'));
	var detailsDlg = new org.sarsoft.view.MapDialog(imap, "Details", settings_details, "OK", "Cancel", function() {
		$('#detailsform').submit();
	});
	detailslink.click(function() {detailsDlg.swap();});

	deleteDlg = new org.sarsoft.view.MapDialog(imap, "Delete ${tenant.publicName}", $('#deleteObject'), "OK", "Cancel", function() {
		window.location="/admin/delete?id=${tenant.name}&dest=/map.html#" + org.sarsoft.MapURLHashWidget.createConfigStr(imap);
	});
	</c:if>
  if(!embed) {
	google.maps.event.trigger(map, "resize");	
  }
	$(document).ready(function() { $(document).bind("contextmenu", function(e) { return false;})});
});
}
</script>
</head>
<body onload="doload()" class="yui-skin-sam" style="border: 0px; margin: 0px; padding: 0px">
<div id="page_container" style="height: 100%">
 <div id="map_left">
 </div>
 <div id="map_right" style="height: 100%">
  <div id="map_canvas" style="width: 100%; height: 100%"></div>
 </div>
</div>

<c:if test="${userPermission eq admin}">
<form action="/admin.html" method="post" id="detailsform" style="display: none">
<input type="hidden" name="tid" value="${tenant.name}"/>
<input type="hidden" name="type" value="map"/>
<table border="0" style="width: 90%"><tbody>
<tr><td valign="top" style="width: 10em">Name</td><td><input type="text" size="30" value="${tenant.publicName}" name="description"/></td></tr>
<tr><td valign="top">Comments</td><td><textarea style="width: 100%; height: 6em" name="comments">${tenant.comments}</textarea></td></tr>
</tbody></table>
<div style="padding-top: 20px">
You can also <a href="javascript:deleteDlg.show()">delete this map</a>.
</div>
</form>
</c:if>

<div style="display: none" id="sharingpermissions">

Share this map by giving people the following URL: <a href="${serverUrl}/map?id=${tenant.name}">${serverUrl}/map?id=${tenant.name}</a>
<br/><br/>
Embed it in a webpage or forum:
<textarea rows="2" cols="60" style="vertical-align: text-top">
&lt;iframe width="500px" height="500px" src="${serverUrl}/map?id=${tenant.name}"&gt;&lt;/iframe&gt;
</textarea>

<c:if test="${userPermission eq admin}">
<form action="/admin.html" method="post" id="sharingform">

<input type="hidden" name="type" value="map"/>
<input type="hidden" name="tid" value="${tenant.name}"/>

<c:if test="${hosted}">
<div>

<div style="font-size: 120%; color: #5a8ed7; padding-top: 5px">Permissions</div>
<input type="checkbox" name="shared" value="true" id="sharedcb"<c:if test="${tenant.shared}"> checked="checked"</c:if>/> 
 <span>Allow people to <a href="/find" target="_new">find this map</a> without the URL.<br/>
<label for="allUsers">Grant</label>
<select name="allUsers" id="allusersdd">
  <option value="NONE"<c:if test="${tenant.allUserPermission eq none}"> selected="selected"</c:if>>No</option>
  <option value="READ"<c:if test="${tenant.allUserPermission eq read}"> selected="selected"</c:if>>Read</option>
  <option value="WRITE"<c:if test="${tenant.allUserPermission eq write}"> selected="selected"</c:if>>Write</option>
</select> access to all users
<br/>

<label for="passwordUsers">Grant</label>
<select name="passwordUsers">
 <option value="NONE"<c:if test="${tenant.passwordProtectedUserPermission eq none}"> selected="selected"</c:if>>No</option>
 <option value="READ"<c:if test="${tenant.passwordProtectedUserPermission eq read}"> selected="selected"</c:if>>Read</option>
 <option value="WRITE"<c:if test="${tenant.passwordProtectedUserPermission eq write}"> selected="selected"</c:if>>Write</option>
</select> access to users with the password (if set):
<br/>

<span style="padding-left: 3em">Password:
<input type="password" size="15" name="password"/> 
<span class="hint">
 <c:choose>
 <c:when test="${fn:length(tenant.password) eq 0}">No password currently set</c:when>
 <c:otherwise>Leave blank to keep the current password</c:otherwise>
</c:choose>
</span>
</span>
</div>
</c:if>

</form>

<div id="deleteObject" style="height: 6em">
	Are you sure you want to delete ${tenant.publicName}?  This action cannot be undone.
</div>

<script>
$('#allusersdd').change(function() { var val = $('#sharedcb').prop('checked'); var val2 = $('#allusersdd').val(); if(val && val2 == 'NONE') $('#sharedcb').prop('checked', false)});
$('#sharedcb').change(function() { var val = $('#sharedcb').prop('checked'); var val2 = $('#allusersdd').val(); if(val && val2 == 'NONE') $('#allusersdd').val('READ')});
</script>

</c:if>
</div>

</body>
</html>