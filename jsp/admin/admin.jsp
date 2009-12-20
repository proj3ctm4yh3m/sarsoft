<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn" %>

<h2>Sarsoft Admin Console</h2>

<div id="tabs" class="yui-navset">
	<ul class="yui-nav">
		<li class="selected"><a href="#server"><em>Server Control</em></a></li>
		<li><a href="#searches"><em>Searches</em></a></li>
		<li><a href="#maps"><em>Map Configuration</em></a></li>
	</ul>

<div class="yui-content">
	<div id="server">
<a href="/app/shutdown">Shut Down</a>
</div>
<div id="searches">

<h4>Searches</h4>
You are currently working with the search <b>${search}</b>.  You can switch to one of these existing searches:<br/>
<ul>
<c:forEach var="srch" items="${searches}">
<li><a href="/rest/dataschema/${srch}">${srch}</a></li>
</c:forEach>
</ul>
Or, create a new search: <input type="text" size="15" name="newsearch" id="newsearch"/><button onclick="document.location='/rest/dataschema/'+document.getElementById('newsearch').value">Go</button>

</div>
<div id="maps">

Google Maps API Key: <input type="text" size="40" name="mapkey" id="mapkey" value="${mapkey}"/><button onclick="updateMapKey()"/>Update</button><br/>
For more information, see <a href="http://code.google.com/apis/maps/signup.html">http://code.google.com/apis/maps/signup.html</a>

<div id="mapTypes">
</div>
<br/>
<br/>
<button onclick="loadDefaults()">Load Defaults</button>

<script>
org.sarsoft.Loader.queue(function() {
  var colDefs = [
  	{ key:"name", sortable: false, resizeable: false},
  	{ key:"type", sortable: false, resizeable: false},
	{ key:"copyright", sortable: false, resizeable: false},
	{ key:"minresolution", sortable: false, resizeable: false, formatter: YAHOO.widget.DataTable.formatNumber},
	{ key:"maxresolution", sortable: false, resizeable: false, formatter: YAHOO.widget.DataTable.formatNumber},
	{ key:"png", sortable: false, resizeable: false, formatter: YAHOO.widget.DataTable.formatBoolean},
	{ key:"template", sortable: false, resizeable: false}
  ];

  dataSource = new YAHOO.util.DataSource([]);
  dataSource.responseType = YAHOO.util.DataSource.TYPE_JSARRAY;
  dataSource.responseSchema = { fields: ["name","type","copyright","minresolution","maxresolution","png","template"]};
  dataTable = new YAHOO.widget.DataTable("mapTypes", colDefs, dataSource, { caption: "Available Map Types"});

  mapDAO = new org.sarsoft.MapSourceDAO();

  mapDAO.loadAll(function(data) {
  	dataTable.addRows(data);
  });

});

function loadDefaults() {
	var types = org.sarsoft.EnhancedGMap.defaultMapTypes;
	for(var i = 0; i < types.length; i++) {
		mapDAO.create(function(obj) {
			dataTable.addRow(obj);
		}, types[i]);
	}
}

function updateMapKey() {
var configDAO = new org.sarsoft.ConfigDAO();
configDAO.save("maps.key", { name: "maps.key", value: YAHOO.lang.JSON.stringify(document.getElementById('mapkey').value)});
}
</script>
</div>
</div>

<script>
var tabView = new YAHOO.widget.TabView('tabs');
</script>
