<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn" %>

<h2>Sarsoft Admin Console</h2>

<div id="tabs" class="yui-navset">
	<ul class="yui-nav">
		<li class="selected"><a href="#server"><em>Server Control</em></a></li>
		<li><a href="#database"><em>Database</em></a></li>
		<li><a href="#api"><em>API Keys</em></a></li>
		<li><a href="#maps"><em>Map Configuration</em></a></li>
	</ul>

<div class="yui-content">
	<div id="server">
<a href="/app/shutdown">Shut Down</a>
</div>
<div id="database">

<h4>Configuration</h4>
The configuration database controls available map backgrounds, API keys, and other information related to the runtime environment rather than individual searches.
Your current configuration is <b>${config}</b>.  You can switch to one of these existing configurations:<br/>
<ul>
<c:forEach var="cfg" items="${configs}">
<li><a href="/rest/configschema/${cfg}">${cfg}</a></li>
</c:forEach>
</ul>
Or, create a new configuration: <input type="text" size="15" name="newconfig" id="newconfig"/><button onclick="document.location='/app/setsearch/'+document.getElementById('newconfig').value">Go</button>

</div>
<div id="api">
Host Name: <input type="text" size="40" name="hostname" id="hostname" value="${hostName}"/><button onclick="updateHostName()"/>Update</button><br/>
<br/>
Google Maps API Key: <input type="text" size="40" name="mapkey" id="mapkey" value="${mapkey}"/><button onclick="updateMapKey()"/>Update</button><br/>
For more information, see <a href="http://code.google.com/apis/maps/signup.html">http://code.google.com/apis/maps/signup.html</a>
<br/><br/>
Garmin GPS Key: <input type="text" size="40" name="garminkey" id="garminkey" value="${garminKey}"/><button onclick="updateGarminKey()"/>Update</button><br/>
To receive a ke, see <a href="http://developer.garmin.com/web-device/garmin-communicator-plugin/get-your-site-key/">http://developer.garmin.com/web-device/garmin-communicator-plugin/get-your-site-key/</a>
<br/><br/>
Google Latitude Domain: <input type="text" size="40" name="latitudedomain" id="latitudedomain" value="${latitudedomain}"/><button onclick="updateLatitudeDomain()"/>Update</button><br/>
Google Latitude Shared Secret: <input type="text" size="40" name="latitudesharedsecret" id="latitudesharedsecret" value="${latitudesharedsecret}"/><button onclick="updateLatitudeSharedSecret()"/>Update</button><br/>
Latitude Refresh Interval: <input type="text" size="40" name="latitudeRefreshInterval" id="locationRefreshInterval" value="${latitudeRefreshInterval}"/><button onclick="updateLatitudeRefreshInterval()"/>Update</button>(In Milliseconds)<br/>
APRS Refresh Interval: <input type="text" size="40" name="aprsRefreshInterval" id="locationRefreshInterval" value="${aprsRefreshInterval}"/><button onclick="updateAPRSRefreshInterval()"/>Update</button>(In Milliseconds)<br/>
</div>
<div id="maps">

<div id="mapTypes">
</div>
<div style="text-align: right"><a href="javascript:mapSourceDlg.show()">New Map Source</a></div>
<br/>
<br/>
You can populate this table with a set of default map sources by <a href="javascript:loadDefaults()">clicking here</a>.

<script>
org.sarsoft.Loader.queue(function() {
  var colDefs = [
    { key:"name", label : "", formatter : function(cell, record, column, data) { cell.innerHTML = "<span style='color: red; font-weight: bold; cursor: pointer'>X</span>"; cell.onclick=function() {deleteMapSource(record);} }},
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
	var types = org.sarsoft.EnhancedGMap.backupMapTypes;
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
function updateHostName() {
var configDAO = new org.sarsoft.ConfigDAO();
configDAO.save("server.name", { name: "server.name", value: YAHOO.lang.JSON.stringify(document.getElementById('hostname').value)});
}
function updateGarminKey() {
var configDAO = new org.sarsoft.ConfigDAO();
configDAO.save("garmin.key", { name: "garmin.key", value: YAHOO.lang.JSON.stringify(document.getElementById('garminkey').value)});
}
function updateLatitudeDomain() {
var configDAO = new org.sarsoft.ConfigDAO();
configDAO.save("latitude.domain", { name: "latitude.domain", value: YAHOO.lang.JSON.stringify(document.getElementById('latitudedomain').value)});
}
function updateLatitudeSharedSecret() {
var configDAO = new org.sarsoft.ConfigDAO();
configDAO.save("latitude.clientSharedSecret", { name: "latitude.clientSharedSecret", value: YAHOO.lang.JSON.stringify(document.getElementById('latitudesharedsecret').value)});
}
function updateLatitudeRefreshInterval() {
var configDAO = new org.sarsoft.ConfigDAO();
configDAO.save("location.refreshInterval.latitude", { name: "location.refreshInterval.latitude", value: YAHOO.lang.JSON.stringify(document.getElementById('latitudeRefreshInterval').value)});
}

function updateARPSRefreshInterval() {
var configDAO = new org.sarsoft.ConfigDAO();
configDAO.save("location.refreshInterval.aprs", { name: "location.refreshInterval.aprs", value: YAHOO.lang.JSON.stringify(document.getElementById('aprsRefreshInterval').value)});
}


mapSourceDlg = new org.sarsoft.view.EntityCreateDialog("New Map Source", new org.sarsoft.view.MapSourceForm(), function(obj) {
	mapDAO.create(function(source) { dataTable.addRow(source); }, obj);
});
function deleteMapSource(record) {
 	var source = record.getData();
 	mapDAO.delete(source.name);
 	dataTable.deleteRow(record);
}
</script>
</div>
</div>

<script>
var tabView = new YAHOO.widget.TabView('tabs');
</script>
