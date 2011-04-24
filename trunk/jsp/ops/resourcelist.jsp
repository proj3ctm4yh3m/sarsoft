<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn" %>

<h2>All Resources</h2>

<ul>
  <li><a href="/app/resource/map">Map View</a> of all resources.</li>
  <li>Create a new resource named <form action="/app/resource/new" method="POST"><input type="text" name="name" size="20"/> <input type="submit" value="GO"/></li>
</ul>
<br/>
This page shows you all available resources.

<div id="resources">
</div>

<script>

org.sarsoft.Loader.queue(function() {
  var tabView = new YAHOO.widget.TabView('tabs');
  rtable = new org.sarsoft.view.ResourceTable();
  rtable.create(document.getElementById("resources"));

  dao = new org.sarsoft.ResourceDAO();
  dao.loadAll(function(rows) {
  	rtable.table.showTableMessage("<i>No Resources Found</i>");

  	rtable.table.addRows(rows);
  });
});

</script>
