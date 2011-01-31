<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn" %>

<h2>Search Admin</h2>

<b>Update Public Name</b><br/>
<p>
Once you've picked a name for your search, you can't change it.  However, you can control what shows up on printed maps and SAR 104 forms
by updating the public name below.
<br/>
<form action="/app/search" method="POST">
<input type="text" size="15" value="${search.publicName}" name="description"/>
<input type="submit" value="Update"/>
</form>
</p>
<br/>
<p>Yes, that's really all you can do on this page right now.
<br/><br/>
<a href="/">Take me home.</a>
</p>