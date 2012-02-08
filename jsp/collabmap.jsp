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
  imap = new org.sarsoft.InteractiveMap(map, {standardControls : !embed, UTM: true, switchableDatum : true});
  markupController = new org.sarsoft.controller.MarkupMapController(imap, false, embed);
  if(!embed) {
	toolsController = new org.sarsoft.controller.MapToolsController(imap);
  	setupWidget = new org.sarsoft.view.MapSetupWidget(imap);
    collabWidget = new org.sarsoft.MapCollaborationWidget(imap);
  }
  configWidget = new org.sarsoft.view.PersistedConfigWidget(imap, (!embed && org.sarsoft.userPermissionLevel != "READ"), true);
  configWidget.loadConfig();

  if(!embed) {
	imap.message("Right click on map background to create shapes", 30000);
	var leaveBody = jQuery('<span>Leave map view and return to the home page?<br/><br/>You might also want to view <a href="/guide?id=${tenant.name}">this map\'s guide</a>.<br/><br/></span>');
	var leaveCB = jQuery('<input type="checkbox" value="save">Save map settings for future page loads. Data is automatically saved as you work on it.</input>').appendTo(leaveBody);
	jQuery('<br/><br/>').appendTo(leaveBody);
	var leaveDlg = org.sarsoft.view.CreateDialog("Leave Map View", leaveBody, "Leave", "Cancel", function() {
		if(leaveCB.attr("checked")=="checked") {
			configWidget.saveConfig(function() {
				window.location = "/maps";
			});
		} else {
			window.location = "/maps";
		}
	});
	var goback = jQuery('<img src="' + org.sarsoft.imgPrefix + '/home.png" style="cursor: pointer; vertical-align: middle" title="Return to home page"/>')[0];
	GEvent.addDomListener(goback, "click", function() {
		leaveDlg.show();
	});
	imap.addMenuItem(goback, 40);

	if(org.sarsoft.userPermissionLevel == "ADMIN") {
		var goToAdmin = new Object();
		imap.register("goToAdmin", goToAdmin);
		goToAdmin.getSetupBlock = function() {
			return {
				order : 1,
				node : jQuery('<div>Visit the <a href="/admin.html">Admin Page</a> to manage sharing</div>')[0],
				handler : function() {}
			}
		}
	}
  }
	$(document).ready(function() { $(document).bind("contextmenu", function(e) { return false;})});
});
}
</script>
</head>
<body onload="doload()" onunload="GUnload()" class="yui-skin-sam" style="border: 0px; margin: 0px; padding: 0px">
<div id="map_canvas" style="width: 100%; height: 100%"></div>

</body>
</html>