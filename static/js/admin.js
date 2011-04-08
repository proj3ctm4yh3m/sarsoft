if(typeof org == "undefined") org = new Object();
if(typeof org.sarsoft == "undefined") org.sarsoft = new Object();
if(typeof org.sarsoft.controller == "undefined") org.sarsoft.controller = new Object();
if(typeof org.sarsoft.view == "undefined") org.sarsoft.view = new Object();

org.sarsoft.MapSourceDAO = function(errorHandler, baseURL) {
	if(baseURL == undefined) baseURL = "/rest/mapsource";
	this.baseURL = baseURL;
	this.errorHandler = errorHandler;
}

org.sarsoft.MapSourceDAO.prototype = new org.sarsoft.BaseDAO();

org.sarsoft.view.MapSourceForm = function() {
	var fields = [
		{ name : "name", type : "string" },
		{ name : "type", type : ["NATIVE","TILE","WMS"]},
		{ name : "copyright", type : "string"},
		{ name : "minresolution", type : "number"},
		{ name : "maxresolution", type : "number"},
		{ name : "png", type : "boolean"},
		{ name : "template", type : "string"}
	];
	org.sarsoft.view.EntityForm.call(this, fields);
}

org.sarsoft.view.MapSourceForm.prototype = new org.sarsoft.view.EntityForm();

org.sarsoft.GeoRefImageDAO = function(errorHandler, baseURL) {
	if(baseURL == undefined) baseURL = "/rest/georefimage";
	this.baseURL = baseURL;
	this.errorHandler = errorHandler;
}
org.sarsoft.GeoRefImageDAO.prototype = new org.sarsoft.BaseDAO();
