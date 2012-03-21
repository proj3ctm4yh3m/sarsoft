<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn" %>
<%@page import="org.sarsoft.common.util.RuntimeProperties"%>
<% pageContext.setAttribute("refreshInterval", RuntimeProperties.getProperty("sarsoft.refreshInterval")); %>

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
	jQuery('<a href="javascript:leaveHandler(\'/maps\')" style="margin-left: 15px">Home Page</a>').appendTo(bottomRow);
	jQuery('<a href="javascript:leaveHandler(\'/guide?id=${tenant.name}\')" style="margin-left: 15px">Guide</a>').appendTo(bottomRow);
	if(org.sarsoft.userPermissionLevel == "ADMIN") {
		jQuery('<a href="javascript:leaveHandler(\'/admin.html\')" style="margin-left: 15px">Admin Page</a>').appendTo(bottomRow);
	}
	
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

</body>
</html>