if(typeof org == "undefined") org = new Object();
if(typeof org.sarsoft == "undefined") org.sarsoft = new Object();

org.sarsoft.MapSourceDAO = function(errorHandler, baseURL) {
	if(baseURL == undefined) baseURL = "/rest/mapsource";
	this.baseURL = baseURL;
	this.errorHandler = errorHandler;
}

org.sarsoft.MapSourceDAO.prototype = new org.sarsoft.BaseDAO();
