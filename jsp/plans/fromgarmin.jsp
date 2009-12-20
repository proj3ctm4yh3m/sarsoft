<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn" %>
<%@ taglib uri="http://tiles.apache.org/tags-tiles" prefix="tiles" %>
<html>
<head>
<title>Search & Rescue Planning Software - Export to Garmin GPS</title>
<script type="text/javascript" src="http://yui.yahooapis.com/2.7.0/build/yuiloader/yuiloader-min.js" ></script>
<script src="/static/js/common.js"></script>
<script src="/static/js/plans.js"></script>
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

function console(str) {
  document.getElementById('console').value += str + "\n";
}


    var control;
    //create a call-back listener class
    var listener = Class.create();
    var fn = function() {};
    listener.prototype = {
        initialize: function() { },
        onFinishFindDevices: function(json) {
            var devices = json.controller.getDevices();
            var str = "Devices Found: "+devices.length+"\n";
            if (json.controller.numDevices > 0) {
                for( var i=0; i < devices.length; i++ ) {
                    str += " -"+devices[i].getDisplayName()+"\n";
                }
            }
            console(str);
            console('device support for GPX is: ' + control.checkDeviceReadSupport(Garmin.DeviceControl.FILE_TYPES.gpx));
			console('reading GPX data');
			control.readFromDevice();
        },
        onFinishReadFromDevice : function(json) {
        	var gpx = control.gpsDataString;
        	console('gpx is ' + gpx);
			var dao = new org.sarsoft.SearchAssignmentDAO();
			dao.createWaysFromGpx(function() { console('all done'); }, '${id}', {gpx: gpx});
        },
        onCancelReadFromDevice : function(json) { console('read cancelled'); },
        onException : function(json) { console(json.msg);}
    }

    function load() {
        try {
            document.getElementById('console').value='';
            control = new Garmin.DeviceControl();
            control.register(new listener());
            var unlocked = control.unlock( ["http://mydomain.com","pasteYourKeyInHere"] );
            console("Found Plugin, unlocked="+unlocked);
            control.findDevices();
        } catch(e) { alert(e); }
    }
</script>

</head>
<body class="yui-skin-sam" onload="load()">

<textarea id="console" rows="20" cols="60"></textarea>

</body>
</html>