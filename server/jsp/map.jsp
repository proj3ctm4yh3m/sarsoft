<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd"> 
<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn" %>
<html xmlns="http://www.w3.org/TR/html4/loose.dtd">
<head>
<meta content='True' name='HandheldFriendly' />
<meta name="viewport" content="initial-scale=1.0, maximum-scale=1.0, user-scalable=0"/>
<meta name="format-detection" content="telephone=no" />
<%@include file="head.jsp" %>
<script type="text/javascript">

function doload() {
org.sarsoft.Loader.queue(function() {
	sarsoft.permission="ADMIN";

	page = new sarsoft.Page({
		dnclass: org.sarsoft.StructuredDataNavigator,
		config: org.sarsoft.view.CookieConfigWidget,
		url: true,
		bgload: false,
		position: true,
		size: true,
		find: true,
		label: true,
		tools: !org.sarsoft.iframe
		});
	
	periods = new org.sarsoft.OperationalPeriodController(page.imap, false);
	assignments = new org.sarsoft.AssignmentController(page.imap, false);
	clues = new org.sarsoft.ClueController(page.imap, false);
	ftracks = new org.sarsoft.FieldTrackController(page.imap, false);
	fwpts = new org.sarsoft.FieldWaypointController(page.imap, false);

	page.imap.dn.tenant.addClose("Close Unsaved Map", function() {
		window.location.hash = "";
		window.location.reload();
	});

	new org.sarsoft.widget.URLSharing(page.imap, 'map.html');

	if(!org.sarsoft.iframe) {
		wprint = new org.sarsoft.widget.Print(page.imap);
		jQuery('<span class="underlineOnHover" style="color: #5a8ed7; font-weight: bold;">&rarr; Create a PDF</span>').prependTo(jQuery('<div style="margin-top: 1ex; margin-bottom: 1ex"> (<span style="color: #dc1d00; font-weight: bold">New!</span>) Higher quality, exact scales, and multi-page map packs.  Not all layers available.</div>').appendTo(wprint.print_options.div)).click(function(e) {
			e.stopPropagation();
			if(!imap.controls.action.draftmode) {
				window.location="/print.html#" + org.sarsoft.MapURLHashWidget.createConfigStr(imap);
			} else {
				var form = jQuery('<form style="display: none" action="/hastyprint" method="POST" target="_new"></form>').appendTo(document.body);
				var clientstate = jQuery('<input type="hidden" name="state"/>').appendTo(form);
				clientstate.val(YAHOO.lang.JSON.stringify(org.sarsoft.MapState.get(imap)));
				
				form.submit();
			}
		
		});
	}
	
	if(!org.sarsoft.iframe && !org.sarsoft.mobile) imap.message('<a href="http://bamru.info/caltopo" target="_new">Please donate</a> to Bay Area Mountain Rescue', 5000);

	<c:if test="${message ne null}">
	alert('Error: ${message}');
	</c:if>

	if(!org.sarsoft.mobile && !org.sarsoft.iframe) imap.registered["org.sarsoft.MapFindWidget"].setState(true);
});
}

</script>
</head>
<body onload="doload()" class="yui-skin-sam" style="width: 100%; height: 100%">
<div id="page_container" style="height: 100%">
 <div id="map_left">
 </div>
 <div id="map_right" style="height: 100%">
  <div id="map_canvas" style="width: 100%; height: 100%"></div>
 </div>
</div>
</body>
</html>