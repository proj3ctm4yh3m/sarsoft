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
<p></p>
<div>
<a class="underlineOnHover" style="font-weight: bold; font-size: 150%; color: #5A8ED7" href="/map.html">Click to View and Print Topo Maps</a>
</div>
<p>
Normally, this welcome page would be replaced by information about your SAR team's specific installation.  Here are some basic pointers to help you get started.
</p>

<h2>Contact</h2>
<p>
<ul>
<li><b>Email</b> Matt Jacobs, Bay Area Mountain Rescue at <a href="mailto:info@caltopo.com">info@caltopo.com</a></li>
<li><b>Updates</b> Get the latest code and report bugs on the <a href="http://code.google.com/p/sarsoft/">Google Code site</a></li>
<li><b>Advice</b> GIS tips for custom maps on the <a href="http://caltopo.blogspot.com">CalTopo Blog</a>.
</ul>
</p>

<h2>License</h2>
<p style="white-space: pre">This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <a href="http://www.gnu.org/licenses">http://www.gnu.org/licenses</a>.
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

