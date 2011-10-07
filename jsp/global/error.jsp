<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn" %>
<%@ taglib uri="http://tiles.apache.org/tags-tiles" prefix="tiles" %>
<html>
<head>
</head>
<body>
<h1>Sorry, something seems to have gone wrong!</h1>

<% if(session.getAttribute("tenant") == null) { %>
<p>
It looks like you're not currently working on a search <% if(session.getAttribute("username") == null) { %> or logged in. <% } %><br/>
If you've left your computer idle for a while, your browser session might have expired.<br/>
<br/>
To continue, please either <a href="/">log in</a> to work on one of your own searches, or if you were given a direct link to someone else's shared search, revisit it.
</p>
<% } else { %>
<a href="/">Return to the Sarsoft home page</a>
<% } %>
</body>
</html>