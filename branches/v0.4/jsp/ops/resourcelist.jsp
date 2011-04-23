<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn" %>

<h2>All Resources</h2>

<ul>
  <li><a href="/app/resource/map">Map View</a> of all resources.</li>
  <li>Bulk import resource information from a different search:</a>
	 <select name="bulkImport" id="bulkImport">
	  <c:forEach var="search" items="${searches}">
	   <option value="${search}">${search}</option>
	  </c:forEach>
	 </select>
     <button onclick="window.location='/app/resource/bulkimport?search=' + document.getElementById('bulkImport').options[document.getElementById('bulkImport').selectedIndex].value">GO</button>
  </li>
  <li>Create a new resource named <input type="text" id="newresourcename" size="20"/> <button onclick="window.location='/app/resource/new?name='+document.getElementById('newresourcename').value">GO</button></li>
</ul>
<br/>
This page shows you all available resources, including those who have not yet responded to the search ("Out of Search Resources").

<div id="tabs" class="yui-navset">
	<ul class="yui-nav">
		<li class="selected"><a href="#insearch"><em>In-Search Resources</em></a></li>
		<li><a href="#outofsearch"><em>Out of Search Resources</em></a></li>
	</ul>

<div class="yui-content">

<div id="insearch">
</div>

<div id="outofsearch">
</div>

</div>
</div>

<script>

org.sarsoft.Loader.queue(function() {
  var tabView = new YAHOO.widget.TabView('tabs');
  intable = new org.sarsoft.view.ResourceTable(null, function(record) {
    	var resource = record.getData();
    	window.location="/app/resource/" + resource.id + "/move?sect=&view=list";
  });
  intable.create(document.getElementById("insearch"));
  outtable = new org.sarsoft.view.ResourceTable(null, function(record) {
  		var resource = record.getData();
    	var idx = 1000;
    	for(var i = 0; i < outrows.length; i++) {
    		if(outrows[i].id == resource.id) idx = i;
    	}
    	outrows.splice(idx, 1);
    	dao.deleteResource(resource);
    	outtable.table.deleteRow(record);
  });
  outtable.create(document.getElementById("outofsearch"));

  dao = new org.sarsoft.ResourceDAO();
  dao.loadAll(function(rows) {
  	intable.table.showTableMessage("<i>No Resources Found</i>");
  	outtable.table.showTableMessage("<i>No Resources Found</i>");

    if(rows != null) {
    	inrows = new Array();
    	outrows = new Array();
    	for(var i = 0; i < rows.length; i++) {
    		var row = rows[i];
    		if(row.section == null) {
    			outrows.push(row);
    		} else {
    			inrows.push(row);
    		}
    	}
    	if(inrows.length > 0)
		  	intable.table.addRows(inrows);
		if(outrows.length > 0)
		  	outtable.table.addRows(outrows);
	}
  });
});

</script>
