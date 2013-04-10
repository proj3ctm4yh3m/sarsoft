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
<%@include file="head.jsp" %>
<script type="text/javascript">
function doload() {
org.sarsoft.Loader.queue(function() {
	
	page = new sarsoft.Page({
		dnclass: org.sarsoft.StructuredDataNavigator,
		config: org.sarsoft.view.PersistedConfigWidget,
		url: false,
		bgload: false,
		position: true,
		size: true,
		find: true,
		label: true,
		tools: !org.sarsoft.iframe
		 <c:if test="${not empty tenant.defaultCenter}">, center: new google.maps.LatLng(${tenant.defaultCenter.lat}, ${tenant.defaultCenter.lng}), zoom: 14</c:if>
	});

	periods = new org.sarsoft.OperationalPeriodController(page.imap, false);
	assignments = new org.sarsoft.AssignmentController(page.imap, false);
	clues = new org.sarsoft.ClueController(page.imap, false);
	ftracks = new org.sarsoft.FieldTrackController(page.imap, false);
	fwpts = new org.sarsoft.FieldWaypointController(page.imap, false);
	resources = new org.sarsoft.ResourceController(page.imap, false);
	callsigns = new org.sarsoft.CallsignController(page.imap, false);

 	page.imap.dn.tenant.addClose("Close " + sarsoft.tenant.publicName, function(e) {
		e.stopPropagation();
		window.location="/map.html#" + org.sarsoft.MapURLHashWidget.createConfigStr(imap);
	});

  var sharing = new org.sarsoft.widget.TenantSharing(page.imap, 'map');
  <c:if test="${userPermission eq admin and hosted}">
  $('<div><div style="font-size: 120%; color: #5a8ed7; padding-top: 5px">Permissions</div>' +
  '<input type="checkbox" value="true" id="sharedcb"/>' +
  '<span>Allow people to <a href="/find" target="_new">find this map</a> without the URL.<br/>' +
  '<label for="allUsers">Grant</label>' +
  '<select id="allusersdd">' +
  '  <option value="NONE"<c:if test="${tenant.allUserPermission eq none}"> selected="selected"</c:if>>No</option>' +
  '  <option value="READ"<c:if test="${tenant.allUserPermission eq read}"> selected="selected"</c:if>>Read</option>' +
  '  <option value="WRITE"<c:if test="${tenant.allUserPermission eq write}"> selected="selected"</c:if>>Write</option>' +
  '</select> access to all users<br/>' +
  '<label for="passwordUsers">Grant</label>' +
  '<select id="passwordusersdd">' +
  ' <option value="NONE"<c:if test="${tenant.passwordProtectedUserPermission eq none}"> selected="selected"</c:if>>No</option>' +
  ' <option value="READ"<c:if test="${tenant.passwordProtectedUserPermission eq read}"> selected="selected"</c:if>>Read</option>' +
  ' <option value="WRITE"<c:if test="${tenant.passwordProtectedUserPermission eq write}"> selected="selected"</c:if>>Write</option>' +
  '</select> access to users with the password (if set):<br/>' +
  '<span style="padding-left: 3em">Password: <input type="password" size="15" id="inpassword"/>' +
  '<span class="hint"><c:choose><c:when test="${fn:length(tenant.password) eq 0}">No password currently set</c:when><c:otherwise>Leave blank to keep the current password</c:otherwise></c:choose></span></span></div>').insertAfter(sharing.share);

  <c:if test="${tenant.shared}">$('#sharedcb').attr("checked", "checked");</c:if>
  $('#allusersdd').change(function() { var val = $('#sharedcb').prop('checked'); var val2 = $('#allusersdd').val(); if(val && val2 == 'NONE') $('#sharedcb').prop('checked', false)});
  $('#sharedcb').change(function() { var val = $('#sharedcb').prop('checked'); var val2 = $('#allusersdd').val(); if(val && val2 == 'NONE') $('#allusersdd').val('READ')});

  sharing.save = function() {
	  var dao = new org.sarsoft.CollaborativeMapDAO();
		dao.save('${tenant.name}', {'shared': $('#sharedcb').is(':checked'), 'allUserPermission': $('#allusersdd').val(), 'passwordProtectedUserPermission': $('#passwordusersdd').val(), 'password': $('#inpassword').val()});
  }
  </c:if>

  <c:if test="${userPermission eq admin}">
	deleteDlg = new org.sarsoft.view.MapDialog(page.imap, "Delete " + sarsoft.tenant.publicName, $('<div id="deleteObject" style="height: 6em">Are you sure you want to delete ' + sarsoft.tenant.publicName + '?  This action cannot be undone.</div>'), "OK", "Cancel", function() {
		var dao = new org.sarsoft.CollaborativeMapDAO();
		dao.del('${tenant.name}', function() {
			window.location='/map.html';
		});
	});
  
	var settings_details = $('<div></div>');
	var settings_table = $('<tbody></tbody>').appendTo($('<table border="0" style="width: 90%"></table>').appendTo(settings_details));
	
	var details_name = jQuery('<input type="text" size="30" value=""/>').val(sarsoft.tenant.publicName).appendTo($('<td></td>').appendTo($('<tr><td valign="top" style="width: 10em">Name</td></tr>').appendTo(settings_table)));
	var details_comments = jQuery('<textarea style="width: 100%; height: 6em"></textarea>').val(sarsoft.tenant.comments).appendTo($('<td></td>').appendTo($('<tr><td valign="top">Comments</td></tr>').appendTo(settings_table)));
	
	settings_details.append('<div style="padding-top: 20px">You can also <a href="javascript:deleteDlg.show()">delete this map</a>.</div>');	
	
	var detailsDlg = new org.sarsoft.view.MapDialog(page.imap, "Details", settings_details, "OK", "Cancel", function() {
		var dao = new org.sarsoft.CollaborativeMapDAO();
		dao.save('${tenant.name}', {'description': details_name.val(), 'comments': details_comments.val()});
	});
	page.imap.dn.tenant.header.attr("title", "click for details").click(function() {detailsDlg.swap();});

	</c:if>
	
	if(!org.sarsoft.iframe) {
	    wprint = new org.sarsoft.widget.Print(page.imap);
		jQuery('<button style="margin-left: 20px; cursor; pointer">Print Key</button>').insertAfter(wprint.pageSizeForm.printButton).click(function() {
			window.open('/guide?id=' + sarsoft.tenant.name + "&print=true", '_blank');
		});
		jQuery('<span class="underlineOnHover" style="color: #5a8ed7; font-weight: bold;">&rarr; Create a PDF</span>').prependTo(jQuery('<div style="margin-top: 1ex; margin-bottom: 1ex"> (<span style="color: #dc1d00; font-weight: bold">New!</span>) Higher quality, exact scales, and multi-page map packs.  Not all layers available.</div>').appendTo(wprint.print_options.div)).click(function(e) {
			e.stopPropagation();
			window.location="/print?id=" + sarsoft.tenant.name;
		});
	}
  
  <c:if test="${message ne null}">
    alert("Error: ${message}");
  </c:if>

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

</body>
</html>