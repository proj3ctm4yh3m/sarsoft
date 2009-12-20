<html>
<head>
<script src="http://maps.google.com/maps?file=api&amp;v=2&amp;key=${map.key}" type="text/javascript"></script>
<script type="text/javascript" src="http://yui.yahooapis.com/2.7.0/build/yuiloader/yuiloader-min.js" ></script>
<script src="/static/js/common.js"></script>
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
  dataTable = new YAHOO.widget.DataTable("data", colDefs, dataSource, { caption: "Available Map Types"});

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
</script>
<script src="/static/js/admin.js"></script>
<script src="/static/js/maps.js"></script>
<script src="/static/js/plans.js"></script>
<link rel="stylesheet" type="text/css" href="http://yui.yahooapis.com/2.7.0/build/fonts/fonts-min.css">
<link rel="stylesheet" type="text/css" href="http://yui.yahooapis.com/2.7.0/build/menu/assets/skins/sam/menu.css">
</head>
<body class="yui-skin-sam">

<div id="data">
</div>
<br/>
<br/>
<button onclick="loadDefaults()">Load Defaults</button>
</body>
</html>