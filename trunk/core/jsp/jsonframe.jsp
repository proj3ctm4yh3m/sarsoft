<%@ page contentType="text/html; charset=UTF-8" %>
<% response.setHeader("Cache-Control", "no-cache"); %>
<html>
<head>

</head>
<body onload="f12()">
<script>
function f12() {
	window.parent.jsonFrameCallback(${json});
	window.parent.jsonFrameCallback = null;
}
</script>
</body>
</html>