<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn" %>
<%@ taglib uri="http://tiles.apache.org/tags-tiles" prefix="tiles" %>
<html>
<head>
<title>Search & Rescue Planning Software - Export to Garmin GPS</title>
<script type="text/javascript" src="http://yui.yahooapis.com/2.7.0/build/yuiloader/yuiloader-min.js" ></script>
<script src="/static/js/common.js"></script>
<script src="http://developer.garmin.com/web/communicator-api/prototype/prototype.js">&#160;</script>
<script src="http://developer.garmin.com/web/communicator-api/garmin/util/Util-Broadcaster.js"></script>
<script src="http://developer.garmin.com/web/communicator-api/garmin/util/Util-BrowserDetect.js"></script>
<script src="http://developer.garmin.com/web/communicator-api/garmin/util/Util-DateTimeFormat.js"></script>
<script src="http://developer.garmin.com/web/communicator-api/garmin/util/Util-PluginDetect.js"></script>
<script src="http://developer.garmin.com/web/communicator-api/garmin/util/Util-XmlConverter.js"></script>
<script src="http://developer.garmin.com/web/communicator-api/garmin/device/GarminObjectGenerator.js"></script>
<script src="http://developer.garmin.com/web/communicator-api/garmin/device/GarminPluginUtils.js"></script>
<script src="http://developer.garmin.com/web/communicator-api/garmin/device/GarminDevice.js"></script>
<script src="http://developer.garmin.com/web/communicator-api/garmin/device/GarminDevicePlugin.js"></script>
<script src="http://developer.garmin.com/web/communicator-api/garmin/device/GarminDeviceControl.js"></script>


<link rel="stylesheet" type="text/css" href="http://yui.yahooapis.com/2.7.0/build/fonts/fonts-min.css">
<link rel="stylesheet" type="text/css" href="http://yui.yahooapis.com/2.7.0/build/menu/assets/skins/sam/menu.css">
<link rel="stylesheet" type="text/css" href="/static/css/AppBase.css"/>

<script>


function WriteToGarmin(gpxstr, name) {
	control = new Garmin.DeviceControl();
	control.register(new GarminListener(gpxstr, name));
	console("attempting to unlock with domain, key: (${hostName}, ${garminKey})");
	var unlocked = control.unlock( ["${hostName}","${garminKey}"] );
	if(unlocked) {
		control.findDevices();
	} else {
		fail('find', 'Error unlocking Garmin control plugin.  Please verify that the Garmin plugin is installed and check your device key in the admin console');
	}
}

function GarminListener(gpxstr, name) {
	console('GPX data is:\n' + gpxstr);
	this.gpxstr = gpxstr;
	this.name = name;
}

GarminListener.prototype.onFinishFindDevices = function(obj) {
	var devices = obj.controller.getDevices();
	console("GPS Devices Found:");
    for( var i=0; i < devices.length; i++ ) {
        console((0*i+1) + ". "+devices[i].getDisplayName());
    }
	if(devices.length == 1) {
		pass('find');
		control.writeDataToDevice(Garmin.DeviceControl.FILE_TYPES.gpx, this.gpxstr, this.name);
	} else if(devices.length > 1) {
		fail('find', 'Multiple GPS devices found.  Please attach 1 GPS device at a time');
	} else {
		fail('find', 'No GPS device found');
	}
}

GarminListener.prototype.onFinishWriteToDevice = function(obj) {
	pass('copy');
	pass('done');
}

GarminListener.prototype.onCancelWriteToDevice = function(obj) {
	fai('copy', 'Operation Canceled');
}

GarminListener.prototype.onException = function(obj) {
	fail('copy', 'GPS Exception: ' + obj.msg);
}

org.sarsoft.Loader.queue(function() {
  YAHOO.util.Connect.asyncRequest('GET', '${file}', { success : function(response) {
	  		WriteToGarmin(response.responseText, '${name}');
		}, failure : function(response) {
			fail('find', 'Error loading GPX file from server');
		}});
});

function pass(id) {
	document.getElementById(id).style.color="green";
}
function fail(id, message) {
	document.getElementById(id).style.color="red";
	document.getElementById('err').innerHTML=message;
	errorDlg.show();
}
function console(str) {
  document.getElementById('console').innerHTML += str + "\n";
}
function showDetails() {
	document.getElementById('details').style.visibility="visible";
}
</script>

</head>
<body class="yui-skin-sam">

<div style="margin-left: 4em; margin-top: 4em">
<h2 id="find">Searching For Devices</h2>
<h2 id="copy">Downloading Route</h2>
<h2 id="done">All Done</h2>
</div>
<div style="margin-top: 2em; margin-left: 4em">
<a href="javascript:window.back()">Return to Assigment</a><br/><br/>
<a href="javascript:showDetails()">Show Details &gt;&gt;</a>
</div>

<div id="details" style="visibility: hidden; margin-left: 4em">
<b>Detailed Log:</b><br/>

<textarea id="console" rows="30" cols="80"></textarea>

</div>

<div style="position: absolute; left: 100px; top: 100px;">
<div id="errorDlg" style="width: 300px;">
	<div class="hd">Error Downloading to GPS Device</div>
	<div class="bd">
		<span id="err" style="font-weight: bold; font-size: 150%"></span>
	</div>
</div>
</div>
<script>
var errorDlg = new YAHOO.widget.Dialog("errorDlg");
errorDlg.cfg.queueProperty("buttons", [{ text : "Try Again", handler : function() {window.location.reload(true);}}, { text : "OK", handler : function() {errorDlg.hide();}}]);
errorDlg.render();
errorDlg.hide();
</script>
</body>
</html>