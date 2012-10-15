<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd"> 
<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn" %>
<html xmlns="http://www.w3.org/TR/html4/loose.dtd">
<head>
<meta content='True' name='HandheldFriendly' />
<meta name="viewport" content="initial-scale=1.0, maximum-scale=1.0, user-scalable=0"/>
<meta name="format-detection" content="telephone=no" />
${head}
<script type="text/javascript">

function doload() {
org.sarsoft.Loader.queue(function() {
	
	org.sarsoft.userPermissionLevel="ADMIN";

	map = org.sarsoft.EnhancedGMap.createMap(document.getElementById('map_canvas'));
	var embed = !(window==top);
	var opts = {UTM: true, switchableDatum: true}
	if(!embed) {
		opts.positionWindow = true;
		opts.size = !org.sarsoft.mobile;
		opts.separators = true;
		opts.find = true;
		opts.label = true;
		opts.container = $('#page_container')[0];
	}
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
	  
	var tc = new org.sarsoft.DNTree(imap.container.left, "Unsaved Map");
	tc._lock = true;
	tc.header.css({"text-transform": "capitalize", "margin": "0px", "padding-top": "3px", "font-weight": "bold", color: "white", "background-color": "#666666", "padding-bottom": "3px"});
	tc.header.prepend('<img style="margin-right: 2px; vertical-align: text-top" src="' + org.sarsoft.imgPrefix + '/favicon.png"/>');
	tc.body.css('padding-left', '2px');
	dn.defaults.body = tc.body;

	dn.defaults.sharing = new org.sarsoft.widget.Sharing(imap, tc.body);
	  
	dn.defaults.layers = new org.sarsoft.widget.MapLayers(imap, tc.body);
	dn.defaults.io = new org.sarsoft.widget.ImportExport(imap, tc.body);
	  
	jQuery('<div style="float: right; color: red; cursor: pointer; margin-right: 2px">X</div>').prependTo(tc.header).click(function() {
		window.location.hash = "";
		window.location.reload();
	}).attr("title", "Close Unsaved Map");

		
	urlwidget = new org.sarsoft.MapURLHashWidget(imap, embed);
	if(!embed) {
		markupController = new org.sarsoft.controller.MarkupMapController(imap, false, embed);
		<c:if test="${fn:length(clientState)>0}">
			var clientState = YAHOO.lang.JSON.parse('${clientState}');
			markupController.rehydrate(clientState["org.sarsoft.controller.MarkupMapController"]);
		</c:if>
		configWidget = new org.sarsoft.view.CookieConfigWidget(imap, true);
		configWidget.loadConfig((urlwidget.config == null) ? {} : {base: urlwidget.config.base, overlay: urlwidget.config.overlay, opacity: urlwidget.config.opacity, alphaOverlays : urlwidget.config.alphaOverlays, center: {lat: map.getCenter().lat(), lng: map.getCenter().lng()}, zoom: map.getZoom()});
		toolsController = new org.sarsoft.controller.MapToolsController(imap);
		georefController = new org.sarsoft.controller.CustomLayerController(imap);
		if(urlwidget.config != null && urlwidget.config.georef != null) georefController.rehydrate(urlwidget.config.georef);
		org.sarsoft.BrowserCheck();
	}

	$(document).ready(function() { $(document).bind("contextmenu", function(e) { return false;})});

	<c:if test="${uimessage ne null}">
	  imap.message('${uimessage}', 20000);
	</c:if>

	if(!org.sarsoft.mobile) {
		imap.registered["org.sarsoft.MapFindWidget"].setState(true);
	}
	
	google.maps.event.trigger(map, "resize");

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