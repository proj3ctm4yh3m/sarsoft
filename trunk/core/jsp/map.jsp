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
		label: true
		});

	page.imap.dn.tenant.addClose("Close Unsaved Map", function() {
		window.location.hash = "";
		window.location.reload();
	});

	new org.sarsoft.widget.URLSharing(page.imap, 'map.html');
	if(!org.sarsoft.iframe && !org.sarsoft.mobile) imap.message('<a href="http://bamru.info/caltopo" target="_new">Please donate</a> to Bay Area Mountain Rescue', 5000);

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