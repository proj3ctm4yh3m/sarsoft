<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn" %>

<h2>This Search Requires a Password</h2>
<p>
<input type="password" size="15" id="psswd"/>&nbsp;<a href="javascript:login()">Login</a>
</p>
<script>
function login() {
	window.location="/app/setsearch/${searchname}?password=" + document.getElementById('psswd').value;
}
</script>
