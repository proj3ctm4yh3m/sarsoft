<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn" %>
<%@ taglib uri="http://tiles.apache.org/tags-tiles" prefix="tiles" %>


${welcomeMessage}

<c:if test="${message ne null}">
<div style="font-weight: bold; color: red">Error: ${message}</div>
</c:if>

<c:choose>
<c:when test="${fn:length(welcomeHTML) gt 0}">
${welcomeHTML}
</c:when>
<c:otherwise>
<p>You need to log in with a Google or Yahoo account to create new objects.  If someone's shared a URL with you, you can visit it directly
without logging in.
</p>
<p>
Log in using your:
<ul>
<li><a href="/app/openidrequest?domain=google">Google account</a></li>
<li><a href="/app/openidrequest?domain=yahoo">Yahoo account</a></li>
</ul>
</p>
</c:otherwise>
</c:choose>

