<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn" %>

<h2>Welcome to Sarsoft!</h2>
<p>Before you get started, you need to select a search.  You can choose from one of the existing searches below, or create your own.</p>
<ul>
<c:forEach var="srch" items="${searches}">
<li><a href="/app/setsearch/${srch}">${srch}</a></li>
</c:forEach>
</ul>
<br/>
Create a new search named: <input type="text" size="15" name="newsearch" id="newsearch"/>&nbsp;<button onclick="document.location='/app/dataschema/'+document.getElementById('newsearch').value">Create</button>