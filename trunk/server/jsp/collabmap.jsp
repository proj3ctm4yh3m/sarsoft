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

  var tc = new org.sarsoft.DNTree(imap.container.left, org.sarsoft.tenantname);
  tc._lock = true;
  tc.header.css({"text-transform": "capitalize", "margin": "0px", "padding-top": "3px", "font-weight": "bold", color: "white", "background-color": "#666666", "padding-bottom": "3px"});
  tc.header.prepend('<img style="margin-right: 2px; vertical-align: text-top" src="' + org.sarsoft.imgPrefix + '/favicon.png"/>');
  tc.body.css('padding-left', '2px');
  dn.defaults.body = tc.body;
  new org.sarsoft.widget.BrowserSettings(imap, tc.body);
  
  dn.defaults.savedAt.appendTo(tc.body);
  
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

<c:if test="${userPermission eq admin}">

<div id="deleteObject" style="height: 6em">
	Are you sure you want to delete ${tenant.publicName}?  This action cannot be undone.
</div>

</c:if>
</div>

</body>
</html>