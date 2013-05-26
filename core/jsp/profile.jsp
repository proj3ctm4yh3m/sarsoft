<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd"> 
<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn" %>
<html xmlns="http://www.w3.org/TR/html4/loose.dtd">
<head>
<%@include file="head.jsp" %>
<script type="text/javascript">

function doload() {
org.sarsoft.Loader.queue(function() {
	document.body.profile = function(series, color, title) {
		var pg = new org.sarsoft.view.ProfileGraph(true);
		var container = $('#pgcontainer');
		if(container.children().length > 0) pg.div.css('margin-top', '20px');
		container.append(pg.div);
		pg.draw(series, color, title);
	}
});
}

</script>
</head>
<body onload="doload()" class="yui-skin-sam" style="width: 100%; height: 100%">

<div class="noprint" style="padding-bottom: 2em; padding-top: 1em">
<div style="font-size: 150%">
<button onclick="window.print()">Print Profiles</button>
</div>
<div style="padding-top: 1em">To print multiple profiles, simply leave this page open.  Additional profiles will be appended to this page rather than opening in a new window.</div>
</div>

<div id="pgcontainer" style="width: 8in; height: 10.5in">
</div>

</body>
</html>