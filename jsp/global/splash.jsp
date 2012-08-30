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
<c:when test="${hosted eq false}">
<p>
Normally, this welcome page would be replaced by information about your SAR team's specific installation.  Here are some basic pointers to help you get started.
<br/><br/>
Questions?  Contact Matt Jacobs, Bay Area Mountain Rescue at <a href="mailto:info@caltopo.com">info@caltopo.com</a><br/>
Get the latest code and report bugs on the <a href="http://code.google.com/p/sarsoft/">Google Code site</a>.<br/>
Site updates and mapping/GIS advice on the <a href="http://caltopo.blogspot.com">CalTopo Blog</a>.
</p>

</c:when>
<c:otherwise>
<h2>Sign In</h2>
<p>
You can sign in to ${version} using either a Google or Yahoo account.  You'll be sent to one of their login pages; ${version} never sees
your password and is not able to access to your account, read your email, or scan your address book.  Using an existing login prevents you from having
to create and remember a new username and password just for ${version}.
</p>
<p style="margin-top: 1em; font-size: 130%">
<a href="/app/openidrequest?domain=yahoo"><img src="http://l.yimg.com/a/i/reg/openid/buttons/2_new.png"/></a><br/><br/>
<a href="/app/openidrequest?domain=google"><span style="font-weight: bold; color: #1F47B2">Sign in through G<span style="color:#C61800">o</span><span style="color:#BC2900">o</span>g<span style="color:#1BA221">l</span><span style="color:#C61800">e</span></span></a>
</p>

</c:otherwise>
</c:choose>

