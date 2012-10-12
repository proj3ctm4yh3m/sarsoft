/**
 * Copyright &copy; 2007-2010 Garmin Ltd. or its subsidiaries.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License')
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * 
 * @fileoverview Garmin.Broadcaster is for registering listeners and dispatching call-back metheds.
 * @version 1.8
 */


if (Garmin == undefined) Garmin = {};
var detectableWithVB = false;
var PluginDetect = {

	detectFlash: function() {
	    var pluginFound = PluginDetect.detectPlugin('Shockwave','Flash'); 
	    // if not found, try to detect with VisualBasic
	    if(!pluginFound && detectableWithVB) {
			pluginFound = detectActiveXControl('ShockwaveFlash.ShockwaveFlash.1');
	    }
	    // check for redirection
	    return pluginFound;
	},
	
	detectGarminCommunicatorPlugin: function() {
	    var pluginFound = PluginDetect.detectPlugin('Garmin Communicator');
	    // if not found, try to detect with VisualBasic
	    if(!pluginFound && detectableWithVB) {
			pluginFound = detectActiveXControl('GARMINAXCONTROL.GarminAxControl_t.1');
	    }
	    return pluginFound;		
	},
	
	detectPlugin: function() {
	    // allow for multiple checks in a single pass
	    var daPlugins = PluginDetect.detectPlugin.arguments;
	    // consider pluginFound to be false until proven true
	    var pluginFound = false;
	    // if plugins array is there and not fake
	    if (navigator.plugins && navigator.plugins.length > 0) {
			var pluginsArrayLength = navigator.plugins.length;
			// for each plugin...
			for (pluginsArrayCounter=0; pluginsArrayCounter < pluginsArrayLength; pluginsArrayCounter++ ) {
			    // loop through all desired names and check each against the current plugin name
			    var numFound = 0;
			    for(namesCounter=0; namesCounter < daPlugins.length; namesCounter++) {
				// if desired plugin name is found in either plugin name or description
					if( (navigator.plugins[pluginsArrayCounter].name.indexOf(daPlugins[namesCounter]) >= 0) || 
					    (navigator.plugins[pluginsArrayCounter].description.indexOf(daPlugins[namesCounter]) >= 0) ) {
					    // this name was found
					    numFound++;
					}   
			    }
			    // now that we have checked all the required names against this one plugin,
			    // if the number we found matches the total number provided then we were successful
			    if(numFound == daPlugins.length) {
					pluginFound = true;
					// if we've found the plugin, we can stop looking through at the rest of the plugins
					break;
			    }
			}
	    } else if($.browser.msie) {
	    	try {
	    		control = new ActiveXObject('GARMINAXCONTROL.GarminAxControl_t.1');
	    		if(control) pluginFound = true;
	    	} catch(e) {
	    	}
	    }
	    return pluginFound;		
	}
}



if (Garmin == undefined) var Garmin = {};
/**
 * Copyright &copy; 2007-2010 Garmin Ltd. or its subsidiaries.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License')
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * 
 * @fileoverview Garmin.XmlConverter A class for converting between xml strings and DOM objects.
 * @version 1.8
 */
/**
 * @class Garmin.XmlConverter
 * Convert XML text to a DOM and back.
 * @constructor 
 */
Garmin.XmlConverter = function(){}; //just here for jsdoc
Garmin.XmlConverter = {
    /**
     * Returns an xml document based on the string passed in
     * @param {String} fromString is the xml string to convert
     * @returns {Document}
     * @member Garmin.XmlConverter
     */
    toDocument: function(fromString) {
        try {
		    var theDocument = new ActiveXObject("Microsoft.XMLDOM");
		    theDocument.async = "false";
		    theDocument.loadXML( fromString );
		    return theDocument;
        } catch (e) {
		    return new DOMParser().parseFromString(fromString, "text/xml");
        }
    },
    
    /**
     * Converts a document to a string, and then returns the string
     * @param {Document} fromDocument is the DOM Object to convert
     * @returns {String}
     * @member Garmin.XmlConverter
     */  
    toString: function(fromDocument) {
		if( window.ActiveXObject ) {
			return fromDocument.xml
		}
		else {
			var theXmlSerializer = new XMLSerializer();
			return theXmlSerializer.serializeToString( fromDocument );
		}
    }
};




/**
 * Copyright &copy; 2007-2010 Garmin Ltd. or its subsidiaries.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License')
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * 
 * @fileoverview Generate and insert the object tag
 * only when the browser reports that the plugin is installed.
 * @version 1.8
 */

/**
 * This snippet of code is required to generate the object tag
 * only when the browser reports that the plugin is installed.
 * 
 * @requires PluginDetect
 */
function installGarminPlugin() {
	// Insert object tag based on browser
	if($.browser.msie) {
        $('<object id="GarminActiveXControl" style="WIDTH: 0px; HEIGHT: 0px; visible: hidden" height="0" width="0" classid="CLSID:099B5A62-DE20-48C6-BF9E-290A9D1D8CB5">&#160;</object>').appendTo(document.body);
	} else if($.browser.webkit || $.browser.mozilla) {
    	$('<div style="height:0px; width:0px;"><object id="GarminNetscapePlugin" type="application/vnd-garmin.mygarmin" width="0" height="0">&#160;</object></div>').appendTo(document.body);
	} else {
    	$('<div style="height:0px; width:0px;"><object id="GarminActiveXControl" style="WIDTH: 0px; HEIGHT: 0px; visible: hidden" height="0" width="0" classid="CLSID:099B5A62-DE20-48C6-BF9E-290A9D1D8CB5">' +
		'<object id="GarminNetscapePlugin" type="application/vnd-garmin.mygarmin" width="0" height="0">&#160;</object></object></div>').appendTo(document.body);
	}
	__garminPluginCreated = true;	
}



/** Plugin-specific utility functions.
 *
 * @class Garmin.PluginUtils
 * @constructor 
 */
Garmin.PluginUtils = function(){}; //just here for jsdoc
Garmin.PluginUtils = {
//Garmin.PluginUtils.prototype = {

	/** Parse device xml string into device objects.  
	 * 
	 * Each device object contains the following:
	 * 1) device display name
	 * 2) device number
	 * 3) device XML as an XML document
	 *
	 * 
	 * @param garminPlugin - the GarminDevicePlugin object having access to the device XML data.
	 * @param getDetailedDeviceData - boolean indicating if you want to get the entire device XML 
	 *  as an XML document (rather than the few essentials)
	 * @returns {Array} an array of {@link Garmin.Device} objects
	 */ 
	parseDeviceXml: function(garminPlugin, getDetailedDeviceData) {
        var xmlDevicesString = garminPlugin.getDevicesXml();
        var xmlDevicesDoc = Garmin.XmlConverter.toDocument(xmlDevicesString); 
        
        var deviceList = xmlDevicesDoc.getElementsByTagName("Device");
        var devices = new Array();
        var numDevices = deviceList.length;
        
    	for( var i=0; i < numDevices; i++ ) {
			var displayName = deviceList[i].getAttribute("DisplayName");        		
    		var deviceNumber = parseInt( deviceList[i].getAttribute("Number") );
    		var deviceDescriptionDoc = null;
    		if (getDetailedDeviceData) {
				var deviceDescriptionXml = garminPlugin.getDeviceDescriptionXml(deviceNumber);
				deviceDescriptionDoc = Garmin.XmlConverter.toDocument(deviceDescriptionXml);    
    		}
    		var theDevice = Garmin.PluginUtils._createDeviceFromXml(displayName, deviceNumber, deviceDescriptionDoc);
    		theDevice.setIsFileBased(garminPlugin.isDeviceFileBased(deviceNumber));
    		devices.push(theDevice);
    	}
    	return devices;
	},
	
	/** Create a Garmin.Device instance for each connected device found.
	 * @private
	 */
	_createDeviceFromXml: function(displayName, deviceNumber, deviceDescriptionDoc) {
   		var device = new Garmin.Device(displayName, deviceNumber);

   		if(deviceDescriptionDoc) {						
			var partNumber = deviceDescriptionDoc.getElementsByTagName("PartNumber")[0].childNodes[0].nodeValue;
			var softwareVersion = deviceDescriptionDoc.getElementsByTagName("SoftwareVersion")[0].childNodes[0].nodeValue;
			var description = deviceDescriptionDoc.getElementsByTagName("Description")[0].childNodes[0].nodeValue;
			var id = deviceDescriptionDoc.getElementsByTagName("Id")[0].childNodes[0].nodeValue;
			
			device.setPartNumber(partNumber);
			device.setSoftwareVersion(softwareVersion);
			device.setDescription(description);
			device.setId(id);
			
			var dataTypeList = deviceDescriptionDoc.getElementsByTagName("MassStorageMode")[0].getElementsByTagName("DataType");
			var numOfDataTypes = dataTypeList.length;
	
			for ( var j = 0; j < numOfDataTypes; j++ ) {
				var dataName = dataTypeList[j].getElementsByTagName("Name")[0].childNodes[0].nodeValue;					
				var dataExt = dataTypeList[j].getElementsByTagName("FileExtension")[0].childNodes[0].nodeValue;
				
				if(dataExt == "GPX") {
					var dataType = new Garmin.DeviceDataType(dataName, dataExt);
					var fileList = dataTypeList[j].getElementsByTagName("File");
					
					var numOfFiles = fileList.length;
					
					for ( var k = 0; k < numOfFiles; k++ ) {
						// Path is an optional element in the schema
						var pathList = fileList[k].getElementsByTagName("Path");
						var transferDir = fileList[k].getElementsByTagName("TransferDirection")[0].childNodes[0].nodeValue;											
						
						if ((transferDir == Garmin.DeviceControl.TRANSFER_DIRECTIONS.read)) {
							dataType.setReadAccess(true);
							
							if (pathList.length > 0) {
							    var filePath = pathList[0].childNodes[0].nodeValue;
							    dataType.setReadFilePath(filePath);							
							}
						} else if ((transferDir == Garmin.DeviceControl.TRANSFER_DIRECTIONS.write)) {			
							dataType.setWriteAccess(true);
							
							if (pathList.length > 0) {
	                            var filePath = pathList[0].childNodes[0].nodeValue;
	                            dataType.setWriteFilePath(filePath);                         
	                        }
						} else if ((transferDir == Garmin.DeviceControl.TRANSFER_DIRECTIONS.both)) {		
							dataType.setReadAccess(true);
							dataType.setWriteAccess(true);
							
							if (pathList.length > 0) {
	                            var filePath = pathList[0].childNodes[0].nodeValue;
	                            dataType.setReadFilePath(filePath);
	                            dataType.setWriteFilePath(filePath);                         
	                        }
						}
	
	                    // Deprecated! Need to be removed at some point.
						if( pathList.length > 0) {
							var filePath = pathList[0].childNodes[0].nodeValue;
							dataType.setFilePath(filePath);
						}
						
						// Identifier is optional
						var identifierList = fileList[k].getElementsByTagName("Identifier");
						if( identifierList.length > 0) {
							var identifier = identifierList[0].childNodes[0].nodeValue;
							dataType.setIdentifier(identifier);
						}
					}			
				}
				device._gpxType = dataType;
			}   			
   		}
		return device;
	},
	
	/** Is this a device XML error message.
	 * @param {String} xml string or Error instance with embedded xml
	 * @type Boolean
	 * @return true if error is device-generared error
	 */
	isDeviceErrorXml: function(error) {
		var msg = (typeof(error)=="string") ? error : error.name + ": " + error.message;
		return ( (msg.indexOf("<ErrorReport") > 0) );
	},
	
	/** Best effort to convert XML error message to a String.
	 * @param {String} xml string or Error instance with embedded xml
	 * @type String
	 * @return Human readable interpretation of XML message
	 */
	getDeviceErrorMessage: function(error) {
		var msg = (typeof(error)=="string") ? error : error.name + ": " + error.message;
		var startPos = msg.indexOf("<ErrorReport");
		if (startPos>0) { //strip off any text surrounding the xml
			var endPos = msg.indexOf("</ErrorReport>") + "</ErrorReport>".length;
			msg = msg.substring(startPos, endPos);
		}
        var xmlDoc = Garmin.XmlConverter.toDocument(msg); 
        var errorMessage = Garmin.PluginUtils._getElementValue(xmlDoc, "Extra");
        var sourceFileName = Garmin.PluginUtils._getElementValue(xmlDoc, "SourceFileName");
        var sourceFileLine = Garmin.PluginUtils._getElementValue(xmlDoc, "SourceFileLine");
        var msg = "";
        if (errorMessage) {
        	msg = errorMessage;
        } else { // gota show something :-(
        	msg = "Plugin error: ";
	        if (sourceFileName)
	        	msg += "source: "+sourceFileName;
	        if (sourceFileLine)
	        	msg += ", line: "+sourceFileLine;
        }
		return msg;
	},

	/** Get the value of a document element
	 * @param doc - the document that the element is contained in
	 * @param elementName - the name of the element to get the value from
	 * @return the value of the element identified by elementName 
	 */	
	_getElementValue: function(doc, elementName) {
        var elementNameNodes = doc.getElementsByTagName(elementName);
        var value = (elementNameNodes && elementNameNodes.length>0) ? elementNameNodes[0].childNodes[0].nodeValue : null;
 		return value;		
	}
};


/** GPI XML generation utility.
 *
 * @class Garmin.PluginUtils
 * @constructor 
 **/
Garmin.GpiUtil = function(){};
Garmin.GpiUtil = {
	
	/** Build a single DeviceDownload XML for multiple file downloads.  
	 * 
	 * @param descriptionArray - Even sized array with matching source and destination pairs.
	 * @param regionId - Optional parameter designating RegionId attribute of File.  For now, this single
	 * regionId will be applied to all files in the descriptionArray if provided at all.    
	 * 
	 */
	buildMultipleDeviceDownloadsXML: function(descriptionArray) {
		if(descriptionArray.length % 2 != 0) {
			throw new Error("buildMultipleDeviceDownloadsXML expects even sized array with matching source and destination pairs");
		}
		var xml =
		'<?xml version="1.0" encoding="UTF-8"?>\n' +
		'<DeviceDownload xmlns="http://www.garmin.com/xmlschemas/PluginAPI/v1"\n' +
		' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\n' +
		' xsi:schemaLocation="http://www.garmin.com/xmlschemas/PluginAPI/v1 http://www.garmin.com/xmlschemas/GarminPluginAPIV1.xsd">\n';

		for(var i=0;i<descriptionArray.length;i+=2) {
			var source = descriptionArray[i];
			var destination = descriptionArray[i+1];
		
//			if(!Garmin.GpiUtil.isDestinationValid(destinationArray[i])) {
//				throw new Error("Destination filename contains invalid characters: [" + destinationArray[i] + "]");
//			}
			xml += ' <File Source="'+source+'" Destination="'+destination+'" RegionId="46" />\n';
		}
		xml += '</DeviceDownload>';
		return xml;
	},
	
	buildDeviceDownloadXML: function(source, destination) {
		return Garmin.GpiUtil.buildMultipleDeviceDownloadsXML([source, destination]);
	},
	
	isDestinationValid: function(destination) {
		var splitPath = destination.split("/");
		var filename = splitPath[splitPath.length-1];

		var lengthBefore = filename.length;
		
		var stringAfter = Garmin.GpiUtil.cleanUpFilename(filename);
		
		return(lengthBefore == stringAfter.length);
	},
	
	cleanUpFilename: function(filename) {
		var result = filename;

		var replacement = "";						// see http://www.asciitable.com/
		result = result.stripTags();
		result = result.replace(/&amp;/, replacement);
		result = result.replace(/[\x21-\x2F]/g, replacement); 	// using range "!" through "/"
		result = result.replace(/[\x5B-\x60]/g, replacement);	// using range "[" through "`"
		result = result.replace(/[\x3A-\x40]/g, replacement);	// using range ":" through "@"
		result = result.strip();
		
		return result;
	}
};




if (Garmin == undefined) var Garmin = {};
/** Copyright &copy; 2007-2010 Garmin Ltd. or its subsidiaries.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License')
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * 
 * @fileoverview Garmin.Device A place-holder for Garmin device information. <br/>
 * Source: 
 * <a href="http://developer.garmin.com/web/communicator-api/garmin/device/GarminDevice.js">Hosted Distribution</a> &nbsp;
 * <a href="https://svn.garmindeveloper.com/web/trunk/communicator/communicator-api/src/main/webapp/garmin/device/GarminDevice.js">Source Control</a><br/>
 * @version 1.8
 */
/** A place-holder for Garmin device information.
 * @class Garmin.Device
 *
 * @constructor 
 * @param {String} displayName for the device
 * @param {Number} number of the model
 */
Garmin.Device = function(displayName, number){
    this.displayName = displayName;
    this.number = number;
    
    this.partNumber = null;
    this.softwareVersion = null;
    this.description = null;
    this.id = null;
    this.fileBased = false;
}
Garmin.Device.prototype = {

	/** The display name of this device.
	 * @type String
	 * @return display name
	 * @member Garmin.Device
	 */
	getDisplayName: function() {
		return this.displayName;
	},
	
	/** The device number that the plug-in uses to identify this device
	 * @type Number
	 * @return device number
	 */
	getNumber: function() {
		return this.number;
	},
	
	/** Set part number of device
	 * @param {String} part number
	 */
	setPartNumber: function(partNumber) {
		this.partNumber = partNumber;
	},

	/** The part number of the device
	 * @type String
	 * @return The part number of the device
	 */
	getPartNumber: function() {
		return this.partNumber;
	},

	/** Software version installed on device
	 * @param {String} Garmin.Device
	 */
	setSoftwareVersion: function(softwareVersion) {
		this.softwareVersion = softwareVersion;
	},

	/** The software version currently on the device
	 * @type String
	 * @return software version
	 */
	getSoftwareVersion: function() {
		return this.softwareVersion;
	},

	/** Set description of the device
	 * @param {String} device description
	 */
	setDescription: function(description) {
		this.description = description;
	},

	/** A description of the device.  This usually represents the model name of the device
	 * and includes the software version, i.e. "Forerunner 405  Jun 27 2008 2.17"
	 * In the GarminDevice XML, this is Model > Description.
	 * @type String
	 * @return device description
	 */
	getDescription: function() {
		return this.description;
	},

	/** set device id
	 * @param {String} device id
	 */
	setId: function(id) {
		this.id = id;
	},

	/** The device id
	 * @type String
	 * @return The device id
	 */
	getId: function() {
		return this.id;
	},

	/**
	 * Set if device is a File-based device.
     * @param {Boolean} set if device is file based
     */
	setIsFileBased: function(aBool) {
	   this.fileBased = aBool;	
	},

	/**
	 * Check if device is a File-based device.<br\>
	 * Will return false for all devices on plug-in versions prior to 2.8.1.0 <br\>
	 * @see Garmin.DevicePlugin#isDeviceFileBased
     * @returns {Boolean} true if device is file based
     */
	isFileBased: function() {
	   return this.fileBased;	
	},
	
	toString: function() {
		return "Device["+this.getDisplayName()+", "+this.getDescription()+", "+this.getNumber()+"]";
	}
	
};

/** A place-holder for Garmin Device Data Type information
 * @class Garmin.DeviceDataType
 *
 * @constructor 
 * @param {String} typeName for the data type
 * @param {String} extension file extension for the data type
 */
Garmin.DeviceDataType = function(typeName, fileExtension){
	this.typeName = typeName;
	this.fileExtension = fileExtension;
	this.readAccess = false;
	this.writeAccess = false;
	this.filePath = null;
	this.readFilePath = null;
	this.writeFilePath = null;
	this.identifier = null;
}
Garmin.DeviceDataType.prototype = {
	
	/**
	 * @type String
	 * @return The type name of this data type
	 */
	getTypeName: function() {
		return this.typeName;
	},
	
	/** 
	 * @deprecated
	 * @type String
	 * @return The type/display name of this data type
	 */
	getDisplayName: function() {
		return this.getTypeName();
	},
	
	/**
	 * @type String
	 * @return The file extension of this data type
	 */
	getFileExtension: function() {
		return this.fileExtension;
	},
	
	/**
	 * @type String
	 * @return The file path for this data type
	 */
	getFilePath: function() {
		return this.filePath;
	},
	
	/**
	 * @param filePath - the filepath for this datatype
	 */
	setFilePath: function(filePath) {
		this.filePath = filePath;
	},
	
	/**
     * @param readFilePath - the readFilePath for this datatype
     */
	getReadFilePath: function() {
	   return this.readFilePath;	
	},
	
	/**
	 * @type String
     * @return The read file path for this data type
     */
	setReadFilePath: function(readFilePath) {
		this.readFilePath = readFilePath;
	},
	
	/**
     * @param writeFilePath - the readFilePath for this datatype
     */
    getWriteFilePath: function() {
       return this.writeFilePath;    
    },
    
    /**
     * @type String
     * @return The write file path for this data type
     */
    setWriteFilePath: function(writeFilePath) {
        this.writeFilePath = writeFilePath;
    },
	
	/**
	 * @type String
	 * @return The identifier for this data type
	 */
	getIdentifier: function() {
		return this.identifier;
	},
	
	/**
	 * @param identifier- the identifier for this datatype
	 */
	setIdentifier: function(identifier) {
		this.identifier = identifier;
	},
	
	/**
	 * @param readAccess True == has read access
	 */
	setReadAccess: function(readAccess) {
		this.readAccess = readAccess;
	},
	
	/** Returns value indicating if the device supports read access for this file type
	 * @type Boolean
	 * @return supports read access for this file type
	 */
	hasReadAccess: function() {
		return this.readAccess;
	},
	
	/**
	 * @param {Boolean} has write access
	 */	
	setWriteAccess: function(writeAccess) {
		this.writeAccess = writeAccess;
	},
	
	/** return the value indicating if the device supports write access for this file type
	 * @type Boolean
	 * @return supports write access for this file type
	 */
	hasWriteAccess: function() {
		return this.writeAccess;
	}	
};




if(Garmin == undefined){
    /**
    *@namespace Garmin The Garmin namespace object.
    */
    var Garmin = {};
}
/** Copyright &copy; 2007-2010 Garmin Ltd. or its subsidiaries.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License')
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * 
 * @fileoverview GarminDevicePlugin wraps the Garmin ActiveX/Netscape plugin that should be installed on your machine inorder to talk to a Garmin Gps Device.
 * The plugin is available for download from http://www8.garmin.com/support/download_details.jsp?id=3608
 * More information is available about this plugin from http://www8.garmin.com/products/communicator/
 * @version 1.8
 */

/** This api provides a set of functions to accomplish the following tasks with a Gps Device:
 * <br/>
 * <br/>  1) Unlocking devices allowing them to be found and accessed.
 * <br/>  2) Finding avaliable devices plugged into this machine.
 * <br/>  3) Reading from the device.
 * <br/>  4) Writing gpx files to the device.
 * <br/>  5) Downloading data to the device.
 * <br/>  6) Geting messages, getting transfer status/progress and version information from the device.
 * <br/><br/>
 * Note that the GarminPluginAPIV1.xsd is referenced throughout this API. Please find more information about the GarminPluginAPIV1.xsd from http://
 *  
 * @class
 * requires Prototype
 * @param pluginElement element that references the Garmin GPS Control Web Plugin that should be installed.
 * 
 * constructor 
 * @return a new GarminDevicePlugin
 **/
Garmin.DevicePlugin = function(pluginElement){
    this.plugin = pluginElement;
    this.unlocked = false;
}
Garmin.DevicePlugin.prototype = {
	
	/** Unlocks the GpsControl object to be used at the given web address.  
     * More than one set of path-key pairs my be passed in, for example:
     * ['http://myDomain.com/', 'xxx','http://www.myDomain.com/', 'yyy']
     * See documentation site for more info on getting a key. <br/>
     * <br/>
     * Minimum plugin version 2.0.0.4
     * 
     * @param pathKeyPairsArray {Array}- baseURL and key pairs.  
     * @type Boolean
     * @return true if successfully unlocked or undefined otherwise
     */
	unlock: function(pathKeyPairsArray) {
	    var len = pathKeyPairsArray ? pathKeyPairsArray.length / 2 : 0;
	    for(var i=0;i<len;i++) {
	    	if (this.plugin.Unlock(pathKeyPairsArray[i*2], pathKeyPairsArray[i*2+1])){
	    		this.unlocked = true;
	    		return this.unlocked;
	    	}
	    }
	    
	    // Unlock codes for local development
	    this.tryUnlock = this.plugin.Unlock("file:///","cb1492ae040612408d87cc53e3f7ff3c")
        	|| this.plugin.Unlock("http://localhost","45517b532362fc3149e4211ade14c9b2")
        	|| this.plugin.Unlock("http://127.0.0.1","40cd4860f7988c53b15b8491693de133");
        
        this.unlocked = !this.plugin.Locked;
        	
	    return this.unlocked;
	},
	
	/** Returns true if the plug-in is unlocked.
	 */
	isUnlocked: function() {
		return this.unlocked;
	},
	
	/**
	* Check to see if plugin supports this function.  We are having to pass in the string due
	* to IE evaluating the function when passed in as a parameter.
	*
	* @param pluginFunctionName {String} - name of the plugin function.
	* @return true - if function is available in the plugin.  False otherwise.
	*/
	_getPluginFunctionExists: function(pluginFunctionName) {
		var pluginFunction = "this.plugin." + pluginFunctionName;
		
	    try {
		    if( typeof eval(pluginFunction) == "function" ) {
		        return true;
		    }
		    else if(eval(pluginFunction)) {
		        return true;
		    }
		    else {
		        return false;
		    }
		}
		catch( e ) {
		    // For a supported function Internet Explorer says type is undefined but
		    // throws when the call is made.
		    return true;
    	}
	},

	/**
	* Check to see if plugin supports this field.
	*
	* @param pluginField {String} - name of the plugin field.
	* @return true - if the field is available in the plugin.  False otherwise.
	*/
	_getPluginFieldExists: function(pluginField) {
	    try {
		    if( typeof pluginField == "string" ) {
		        return true;
		    }
		    else if( pluginField ) {
		        return true;
		    }
		    else {
		        return false;
		    }
		}
		catch( e ) {
		    // For a supported function Internet Explorer says type is undefined but
		    // throws when the call is made.
		    return true;
    	}
	},
	
	/** Lazy-logic accessor to fitness write support var.
	 * This is used to detect whether the user's installed plugin supports fitness writing.
	 * Fitness writing capability has a minimum requirement of plugin version 2.2.0.1.
	 * This should NOT be called until the plug-in has been unlocked.
	 */
	getSupportsFitnessWrite: function() {
	    return this._getPluginFunctionExists("StartWriteFitnessData"); 
	},
	
	/** Lazy-logic accessor to fitness write support var.
	 * This is used to detect whether the user's installed plugin supports fitness directory reading,
	 * which has a minimum requirement of plugin version 2.2.0.2.
	 * This should NOT be called until the plug-in has been unlocked.
	 */
	getSupportsFitnessDirectoryRead: function() {	
		return this._getPluginFunctionExists("StartReadFitnessDirectory");
	},

	/** Lazy-logic accessor to FIT read support var.
	 * This is used to detect whether the user's installed plugin supports FIT directory reading,
	 * which has a minimum requirement of plugin version 2.8.1.0.
	 * This should NOT be called until the plug-in has been unlocked.
	 */
	getSupportsFitDirectoryRead: function() {		
        return this._getPluginFunctionExists("StartReadFITDirectory");
	},
	
	/** Lazy-logic accessor to fitness read compressed support var.
	 * This is used to detect whether the user's installed plugin supports fitness reading in compressed format,
	 * which has a minimum requirement of plugin version 2.2.0.2.
	 * This should NOT be called until the plug-in has been unlocked.
	 */
	getSupportsFitnessReadCompressed: function() {
	    return this._getPluginFieldExists(this.plugin.TcdXmlz);
	},
	
	/** This is used to detect whether the user's installed plugin supports readable file listing.
	 * Readable file listing has a minimum requirement of plugin version 2.8.1.0.
	 * This should NOT be called until the plug-in has been unlocked.
	 */
	getSupportsReadableFileListing: function() {		
        return this._getPluginFunctionExists("StartReadableFileListing");
	},

	/** Initiates a find Gps devices action on the plugin. 
	 * Poll with finishFindDevices to determine when the plugin has completed this action.
	 * Use getDeviceXmlString to inspect xml contents for and array of Device nodes.<br/>
	 * <br/>
	 * Minimum plugin version 2.0.0.4
	 * 
	 * @see #finishFindDevices
	 * @see #cancelFindDevices
	 */
	startFindDevices: function() {
		this.plugin.StartFindDevices();
	},

	/** Cancels the current find devices interaction. <br/>
	 * <br/>
	 * Minimum plugin version 2.0.0.4
	 * 
	 * @see #startFindDevices
	 * @see #finishFindDevices
	 */
	cancelFindDevices: function() {
        this.plugin.CancelFindDevices();
	},

	/** Poll - with this function to determine completion of startFindDevices. Used after 
	 * the call to startFindDevices(). <br/>
	 * <br/>
	 * Minimum plugin version 2.0.0.4
	 * 
	 * @type Boolean
	 * @return Returns true if completed finding devices otherwise false.
	 * @see #startFindDevices
	 * @see #cancelFindDevices
	 */
	finishFindDevices: function() {
    	return this.plugin.FinishFindDevices();
	},
	
	/** Returns information about the number of devices connected to this machine as 
	 * well as the names of those devices.  Refer to the 
	 * <a href="http://developer.garmin.com/schemas/device/v2/xmlspy/index.html#Link04DDFE88">Devices_t</a>
	 * element in the Device XML schema for what is included.
	 * The xml returned should contain a 'Device' element with 'DisplayName' and 'Number'
	 * if there is a device actually connected. <br/>
	 * <br/>
	 * Minimum plugin version 2.0.0.4
	 * 
	 * @type String
	 * @return Xml string with detailed device info
	 * @see #getDeviceDescriptionXml
	 */
	getDevicesXml: function(){
		return this.plugin.DevicesXmlString();
	},

	/** Returns information about the specified Device indicated by the device Number. 
	 * See the getDevicesXml function to get the actual deviceNumber assigned.
	 * Refer to the 
	 * <a href="http://developer.garmin.com/schemas/device/v2/xmlspy/index.html#Link04DDFE88">Devices_t</a>
	 * element in the Device XML schema for what is included in the XML. <br/>
	 * <br/>
	 * Minimum plugin version 2.0.0.4
	 * 
	 * @param deviceNumber {Number} Assigned by the plugin, see getDevicesXml for 
	 * assignment of that number.
	 * @type String
	 * @return Xml string with detailed device info
	 * @see #getDevicesXml
	 */
	getDeviceDescriptionXml: function(deviceNumber){
		return this.plugin.DeviceDescription(deviceNumber);
	},
	
	// Read Methods
	
	/** Initiates the read from the gps device conneted. Use finishReadFromGps and getGpsProgressXml to 
	 * determine when the plugin is done with this operation. Also, use getGpsXml to extract the
	 * actual data from the device. <br/>
	 * <br/>
	 * Minimum plugin version 2.0.0.4
	 * 
	 * @param deviceNumber {Number} assigned by the plugin, see getDevicesXml for 
	 * assignment of that number.
	 * @see #finishReadFromGps
	 * @see #cancelReadFromGps
	 * @see #getDevicesXml
	 */
	startReadFromGps: function(deviceNumber) {
		 this.plugin.StartReadFromGps( deviceNumber );
	},

	/** Indicates the status of the read process. It will return an integer
	 * know as the completion state.  The purpose is to show the 
 	 * user information about what is happening to the plugin while it 
 	 * is servicing your request. Used after startReadFromGps(). <br/>
 	 * <br/>
 	 * Minimum plugin version 2.0.0.4
 	 * 
	 * @type Number
	 * @return Completion state - The completion state can be one of the following: <br/>
	 *  <br/>
	 *	0 = idle <br/>
 	 * 	1 = working <br/>
 	 * 	2 = waiting <br/>
 	 * 	3 = finished <br/>
 	 * @see #startReadFromGps
	 * @see #cancelReadFromGps
	 */
	finishReadFromGps: function() {
		return this.plugin.FinishReadFromGps();
	},
	
	/** Cancels the current read from the device. <br/>
	 * <br/>
	 * Minimum plugin version 2.0.0.4
	 * @see #startReadFromGps
	 * @see #finishReadFromGps
     */	
	cancelReadFromGps: function() {
		this.plugin.CancelReadFromGps();
	},
	
	/** Start the asynchronous ReadFitnessData operation. <br/>
	 * <br/>
	 * Minimum plugin version 2.1.0.3 for FitnessHistory type<br/>
     * Minimum plugin version 2.2.0.1 for FitnessWorkouts, FitnessUserProfile, FitnessCourses
	 * 
	 * @param deviceNumber {Number} assigned by the plugin, see getDevicesXmlString for 
	 * assignment of that number.
	 * @param dataTypeName {String} a fitness datatype from the 
	 * <a href="http://developer.garmin.com/schemas/device/v2">Garmin Device XML</a> 
	 * retrieved with getDeviceDescriptionXml
	 * @see #finishReadFitnessData  
	 * @see #cancelReadFitnessData
	 * @see #getDeviceDescriptionXml
	 * @see Garmin.DeviceControl#FILE_TYPES
	 */
	startReadFitnessData: function(deviceNumber, dataTypeName) {
		if( !this.checkPluginVersionSupport([2,1,0,3]) ) {
			throw new Error("Your Communicator Plug-in version (" + this.getPluginVersionString() + ") does not support reading this type of fitness data.");
		}

		 this.plugin.StartReadFitnessData( deviceNumber, dataTypeName );
	},

	/** Poll for completion of the asynchronous ReadFitnessData operation. <br/>
     * <br/>
     * If the CompletionState is eMessageWaiting, call MessageBoxXml
     * to get a description of the message box to be displayed to
     * the user, and then call RespondToMessageBox with the value of the
     * selected button to resume operation.<br/>
     * <br/>
     * Minimum plugin version 2.1.0.3 for FitnessHistory type <br/>
     * Minimum plugin version 2.2.0.1 for FitnessWorkouts, FitnessUserProfile, FitnessCourses
	 * 
	 * @type Number
	 * @return Completion state - The completion state can be one of the following: <br/>
	 *  <br/>
	 *	0 = idle <br/>
 	 * 	1 = working <br/>
 	 * 	2 = waiting <br/>
 	 * 	3 = finished <br/>
 	 * @see #startReadFitnessData  
	 * @see #cancelReadFitnessData
	 */
	finishReadFitnessData: function() {
	 	 return  this.plugin.FinishReadFitnessData();
	},
	
	/** Cancel the asynchronous ReadFitnessData operation. <br/>
	 * <br/>
	 * Minimum plugin version 2.1.0.3 for FitnessHistory type <br/>
     * Minimum plugin version 2.2.0.1 for FitnessWorkouts, FitnessUserProfile, FitnessCourses
     * 
     * @see #startReadFitnessData  
	 * @see #finishReadFitnessData
     */	
	cancelReadFitnessData: function() {
		this.plugin.CancelReadFitnessData();
	},
	
	/**
	 * List all of the FIT files on the device. Starts an asynchronous directory listing operation for the device.
	 * Poll for finished with FinishReadFitDirectory. The result can be retrieved with {@link #getDirectoryXml}.
	 * 
	 * Minimum plugin version 2.7.2.0
	 * @see #finishReadFitDirectory
	 */
	startReadFitDirectory: function(deviceNumber) {
	    if( !this.getSupportsFitDirectoryRead() ) {
			throw new Error("Your Communicator Plug-in version (" + this.getPluginVersionString() + ") does not support reading directory listing data.");
		}
	    this.plugin.StartReadFITDirectory(deviceNumber);
	},
	
	/** Poll for completion of the asynchronous startReadFitDirectory operation. <br/>
     * <br/>
	 * Minimum plugin version 2.7.2.0
	 * 
	 * @type Number
	 * @return Completion state - The completion state can be one of the following: <br/>
	 *  <br/>
	 *	0 = idle <br/>
 	 * 	1 = working <br/>
 	 * 	2 = waiting <br/>
 	 * 	3 = finished <br/>
	 * 
	 * @see #startReadFitDirectory
	 * @see #cancelReadFitDirectory
	 * @see #getMessageBoxXml
	 * @see #respondToMessageBox
	 */
	finishReadFitDirectory: function() {
		return this.plugin.FinishReadFITDirectory();
	},
	
	/** Start the asynchronous ReadFitnessDirectory operation. <br/>
	 * <br/>
	 * Minimum plugin version 2.2.0.2
	 * 
	 * @param deviceNumber {Number} assigned by the plugin, see getDevicesXmlString for 
	 * assignment of that number.
	 * @param dataTypeName a Fitness DataType from the GarminDevice.xml retrieved with DeviceDescription
	 * @see #finishReadFitnessDirectory
	 * @see #cancelReadFitnessDirectory
	 * @see Garmin.DeviceControl#FILE_TYPES
	 */
	startReadFitnessDirectory: function(deviceNumber, dataTypeName) {
		if( !this.getSupportsFitnessDirectoryRead() ) {
			throw new Error("Your Communicator Plug-in version (" + this.getPluginVersionString() + ") does not support reading fitness directory data.");
		}
		this.plugin.StartReadFitnessDirectory( deviceNumber, dataTypeName);
	},
	
	/** Poll for completion of the asynchronous ReadFitnessDirectory operation. <br/>
     * <br/>
     * If the CompletionState is eMessageWaiting, call getMessageBoxXml
     * to get a description of the message box to be displayed to
     * the user, and then call respondToMessageBox with the value of the
     * selected button to resume operation.<br/>
	 * <br/>
	 * Minimum plugin version 2.2.0.2
	 * 
	 * @type Number
	 * @return Completion state - The completion state can be one of the following: <br/>
	 *  <br/>
	 *	0 = idle <br/>
 	 * 	1 = working <br/>
 	 * 	2 = waiting <br/>
 	 * 	3 = finished <br/>
	 * 
	 * @see #startReadFitnessDirectory
	 * @see #cancelReadFitnessDirectory
	 * @see #getMessageBoxXml
	 * @see #respondToMessageBox
	 */
	finishReadFitnessDirectory: function() {
		return this.plugin.FinishReadFitnessDirectory();
	},
	
	/** Cancel the asynchronous ReadFitnessDirectory operation. <br/>
	 * <br/>
	 * Minimum plugin version 2.2.0.2
	 * 
	 * @see #startReadFitnessDirectory
	 * @see #finishReadFitnessDirectory
     */	
	cancelReadFitnessDirectory: function() {
		this.plugin.CancelReadFitnessDirectory();
	},

	/** Cancel the asynchronous ReadFitDirectory operation. <br/>
	 * <br/>
	 * Minimum plugin version 2.7.2.0
	 * 
	 * @see #startReadFitDirectory
	 * @see #finishReadFitDirectory
     */	
	cancelReadFitDirectory: function() {
		this.plugin.CancelReadFitDirectory();
	},
	
	/** Start the asynchronous ReadFitnessDetail operation. <br/>
	 * <br/>
	 * Minimum plugin version 2.2.0.2
	 * 
	 * @param deviceNumber assigned by the plugin, see getDevicesXmlString for 
	 * assignment of that number.
	 * @param dataTypeName a Fitness DataType from the GarminDevice.xml retrieved with DeviceDescription
	 * @see #finishReadFitnessDetail
	 * @see #cancelReadFitnessDetail
	 * @see Garmin.DeviceControl#FILE_TYPES
	 */
	startReadFitnessDetail: function(deviceNumber, dataTypeName, dataId) {
		if( !this.checkPluginVersionSupport([2,2,0,2]) ) {
			throw new Error("Your Communicator Plug-in version (" + this.getPluginVersionString() + ") does not support reading fitness detail.");
		}
		
		this.plugin.StartReadFitnessDetail(deviceNumber, dataTypeName, dataId);
	},
	
	/** Poll for completion of the asynchronous ReadFitnessDetail operation. <br/>
     * <br/>
     * If the CompletionState is eMessageWaiting, call MessageBoxXml
     * to get a description of the message box to be displayed to
     * the user, and then call RespondToMessageBox with the value of the
     * selected button to resume operation.<br/>
     * <br/>
     * Minimum plugin version 2.2.0.2
	 * 
	 * @type Number
	 * @return Completion state - The completion state can be one of the following: <br/>
	 *  <br/>
	 *	0 = idle <br/>
 	 * 	1 = working <br/>
 	 * 	2 = waiting <br/>
 	 * 	3 = finished <br/>
	 * 
	 */
	finishReadFitnessDetail: function() {
		return this.plugin.FinishReadFitnessDetail();
	},
	
	/** Cancel the asynchronous ReadFitnessDirectory operation. <br/>
	 * <br/>
	 * Minimum version 2.2.0.2
	 * 
	 * @see #startReadFitnessDetail
	 * @see #finishReadFitnessDetail
     */	
	cancelReadFitnessDetail: function() {
		this.plugin.CancelReadFitnessDetail();
	},


   /** Starts an asynchronous file listing operation for a Mass Storage mode device. <br/>
	* Only files that are output from the device are listed. </br>
	* The result can be retrieved with {@link #getDirectoryXml}.
	* Minimum plugin version 2.8.1.0 <br/>
    *
	* @param {Number} deviceNumber assigned by the plugin, see getDevicesXmlString for 
	* assignment of that number.
	* @param {String} dataTypeName a DataType from GarminDevice.xml retrieved with DeviceDescription
	* @param {String} fileTypeName a Specification Identifier for a File in dataTypeName from GarminDevice.xml
    * @param {Boolean} computeMD5 If true, the plug-in will generate an MD5 checksum for each readable file. 
	*
	* @see #finishReadableFileListing
	* @see #cancelReadableFileListing
	* @see Garmin.DeviceControl.FILE_TYPES
	*/
	startReadableFileListing: function( deviceNumber, dataTypeName, fileTypeName, computeMD5 ) 
	{
		if( !this.checkPluginVersionSupport([2,8,1,0]) ) 
		{
			throw new Error("Your Communicator Plug-in version (" + this.getPluginVersionString() + ") does not support listing readable files.");
		}
		
		this.plugin.StartReadableFileListing(deviceNumber, dataTypeName, fileTypeName, computeMD5);
	},
	
   /** Cancel the asynchronous ReadableFileListing operation <br/>
    * Minimum version 2.8.1.0 <br/>
    *
 	* @see #startReadableFileListing
 	* @see #finishReadableFileListing
 	*/
	cancelReadableFileListing: function() 
	{
		this.plugin.CancelReadableFileListing();	
	},

	/** Poll for completion of the asynchronous ReadableFileListing operation. <br/>
     * <br/>
     * If the CompletionState is eMessageWaiting, call MessageBoxXml
     * to get a description of the message box to be displayed to
     * the user, and then call RespondToMessageBox with the value of the
     * selected button to resume operation.<br/>
     * <br/>
     * Minimum version 2.8.1.0 <br/>
	 * 
	 * @type Number
	 * @return Completion state - The completion state can be one of the following: <br/>
	 *  <br/>
	 *	0 = idle <br/>
 	 * 	1 = working <br/>
 	 * 	2 = waiting <br/>
 	 * 	3 = finished <br/>
	 * 
	 */
	finishReadableFileListing: function()
	{
		return this.plugin.FinishReadableFileListing();
	},

	// Write Methods
	
	/** Initates writing the gpsXml to the device specified by deviceNumber with a filename set by filename.
	 * The gpsXml is typically in GPX fomat and the filename is only the name without the extension. The 
	 * plugin will append the .gpx extension automatically.<br/>
	 * <br/>
	 * Use finishWriteToGps to poll when the write operation/plugin is complete.<br/>
	 * <br/>
	 * Uses the helper functions to set the xml info and the filename.  <br/>
	 * <br/>
	 * Minimum plugin version 2.0.0.4<br/>
     * Minimum plugin version 2.2.0.1 for writes of GPX to SD Card
	 * 
	 * @param gpsXml {String} the gps/gpx information that should be transferred to the device.
	 * @param filename {String} the desired filename for the gpsXml that shall end up on the device.
	 * @param deviceNumber {Number} the device number assigned by the plugin.
	 * @see #finishWriteToGps
	 * @see #cancelWriteToGps  
	 */
	startWriteToGps: function(gpsXml, filename, deviceNumber) {
		this._setWriteGpsXml(gpsXml);
		this._setWriteFilename(filename);
	    this.plugin.StartWriteToGps(deviceNumber);
	},

	/** Sets the gps xml content that will end up on the device once the transfer is complete.
	 * Use in conjunction with startWriteToGps to initiate the actual write.
	 *
	 * @private 
	 * @param gpsXml {String} xml data that is to be written to the device. Must be in GPX format.
	 */
	_setWriteGpsXml: function(gpsXml) {
    	this.plugin.GpsXml = gpsXml;
	},

	/** This the filename that wil contain the gps xml once the transfer is complete. Use with 
	 * setWriteGpsXml to set what the file contents will be. Also, use startWriteToGps to 
	 * actually make the write happen.
	 * 
	 * @private
	 * @param filename {String} the actual filename that will end up on the device. Should only be the
	 * name and not the extension. The plugin will append the extension portion to the file name--typically .gpx.
	 * @see #setWriteGpsXml, #startWriteToGps, #startWriteFitnessData
	 */
	_setWriteFilename: function(filename) {
    	this.plugin.FileName = filename;
	},

	/** This is used to indicate the status of the write process. It will return an integer
	 * know as the completion state.  The purpose is to show the 
 	 * user information about what is happening to the plugin while it 
 	 * is servicing your request. <br/>
 	 * <br/>
 	 * Minimum plugin version 2.0.0.4<br/>
     * Minimum plugin version 2.2.0.1 for writes of GPX to SD Card 
 	 * 
	 * @type Number
	 * @return Completion state - The completion state can be one of the following: <br/>
	 *  <br/>
	 *	0 = idle <br/>
 	 * 	1 = working <br/>
 	 * 	2 = waiting <br/>
 	 * 	3 = finished <br/>
 	 * @see #startWriteToGps
	 * @see #cancelWriteToGps  
 	 */
	finishWriteToGps: function() {
		//console.debug("Plugin.finishWriteToGps");
	   	return  this.plugin.FinishWriteToGps();
	},
    
	/** Cancels the current write operation to the gps device. <br/>
	 * <br/>
	 * Minimum plugin version 2.0.0.4<br/>
     * Minimum plugin version 2.2.0.1 for writes of GPX to SD Card
     * 
     * @see #startWriteToGps
	 * @see #finishWriteToGps  
     */	
	cancelWriteToGps: function() {
		this.plugin.CancelWriteToGps();
	},

	/** Start the asynchronous StartWriteFitnessData operation. <br/>
	 * <br/>
	 * Minimum plugin version 2.2.0.1
	 * 
	 * @param tcdXml {String} XML of TCD data
	 * @param deviceNumber {Number} the device number, assigned by the plugin. See getDevicesXmlString for 
	 * assignment of that number.
	 * @param filename {String} the filename to write to on the device.
	 * @param dataTypeName {String} a Fitness DataType from the GarminDevice.xml retrieved with DeviceDescription
	 * @see #finishWriteFitnessData  
	 * @see #cancelWriteFitnessData
	 * @see Garmin.DeviceControl#FILE_TYPES
	 */
	startWriteFitnessData: function(tcdXml, deviceNumber, filename, dataTypeName) {	
		if( !this.checkPluginVersionSupport([2,2,0,1]) ) {
			throw new Error("Your Communicator Plug-in version (" + this.getPluginVersionString() + ") does not support writing fitness data.");
		}
		
		this._setWriteTcdXml(tcdXml);
		this._setWriteFilename(filename);
		this.plugin.StartWriteFitnessData(deviceNumber, dataTypeName);
	},
	
	/** This is used to indicate the status of the write process for fitness data. It will return an integer
	 * know as the completion state.  The purpose is to show the 
 	 * user information about what is happening to the plugin while it 
 	 * is servicing your request. <br/>
 	 * <br/>
 	 * Minimum plugin version 2.2.0.1
 	 * 
	 * @type Number
	 * @return Completion state - The completion state can be one of the following: <br/>
	 *  <br/>
	 *	0 = idle <br/>
 	 * 	1 = working <br/>
 	 * 	2 = waiting <br/>
 	 * 	3 = finished <br/>
 	 * @see #startWriteFitnessData  
	 * @see #cancelWriteFitnessData
	 */
	finishWriteFitnessData: function() {
	 	return  this.plugin.FinishWriteFitnessData();
	},
	
	/** Cancel the asynchronous ReadFitnessData operation. <br/>
	 * <br/>
	 * Minimum plugin version 2.2.0.1
	 * 
	 * @see #startWriteFitnessData  
	 * @see #finishWriteFitnessData
     */	
	cancelWriteFitnessData: function() {
		this.plugin.CancelWriteFitnessData();
	},
	
	/** Sets the tcd xml content that will end up on the device once the transfer is complete.
	 * Use in conjunction with startWriteFitnessData to initiate the actual write.
	 *
	 * @private 
	 * @param tcdXml {String} xml data that is to be written to the device. Must be in TCX format.
	 */
	_setWriteTcdXml: function(tcdXml) {
    	this.plugin.TcdXml = tcdXml;
	},
	
	/**
	 * Determine the amount of space available on a Mass Storage Mode Device Volume.
	 * 
	 * @param {Number} deviceNumber - the device number assigned by the plugin. See {@link getDevicesXmlString} for 
	 * assignment of that number.
	 * @param {String} relativeFilePath - if a file is being replaced, set to relative path on device, otherwise set to empty string.
	 * @return -1 for non-mass storage mode devices.  
	 */
	bytesAvailable: function(deviceNumber, relativeFilePath) {
	    return this.plugin.BytesAvailable(deviceNumber, relativeFilePath);
	},

	/**
	 * Determine if device is file-based. <br/>
	 * File-based devices include Mass Storage Mode Devices such as Nuvi, Oregon, Edge 705,
	 * as well as ANT Proxy Devices.<br/>
	 * 
	 * Minimum plugin version 2.8.1.0 <br/>
	 * @param {Number} deviceNumber the device number assigned by the plugin. See {@link getDevicesXmlString} for 
	 * assignment of that number.
	 * @returns {Boolean} true for file based devices, false otherwise
	 */
	isDeviceFileBased: function(deviceNumber) {
        var theReturn = true;
        //do a dummy file listing
        try {
            this.startReadableFileListing( deviceNumber, 'FileBasedTest', 'FileBasedTest', false );
	        while( this.finishReadableFileListing() == 1 ) {
            //wait until done. Only safe to do because fxn returns quickly because of test name and id!
            }
        } catch(e) {
            theReturn = false;
        }
        return theReturn;
	},

    /** Responds to a message box on the device. <br/>
     * <br/>
     * Minimum plugin version 2.0.0.4
     *   
     * @param response should be an int which corresponds to a button value from this.plugin.MessageBoxXml
     */
    respondToMessageBox: function(response) {
        this.plugin.RespondToMessageBox(response);
    },

	/** Initates downloading the gpsDataString to the device specified by deviceNumber.
	 * The gpsDataString is typically in GPI fomat and the filename is only the name without the extension. The 
	 * plugin will append the .gpx extension automatically.<br/>
	 * <br/>
	 * Use finishWriteToGps to poll when the write operation/plugin is complete.<br/>
	 * <br/>
	 * Uses the helper functions to set the xml info and the filename.  <br/>
	 * <br/>
	 * Minimum plugin version 2.0.0.4
	 *  
	 * @param gpsDataString {String} the gpi information that should be transferred to the device.
	 * @param filename {String} the filename to write to on the device.
	 * @param deviceNumber {Number} the device number assigned by the plugin. 
	 * @see #finishDownloadData  
	 * @see #cancelDownloadData
	 */
	startDownloadData: function(gpsDataString, deviceNumber) {
		//console.debug("Plugin.startDownloadData gpsDataString="+gpsDataString);
		this.plugin.StartDownloadData(gpsDataString, deviceNumber);
	},

	/** This is used to indicate the status of the download process. It will return an integer
	 * know as the completion state.  The purpose is to show the 
 	 * user information about what is happening to the plugin while it 
 	 * is servicing your request.<br/>
	 * <br/>
	 * Minimum plugin version 2.0.0.4
	 * 
	 * @type Number
	 * @return Completion state - The completion state can be one of the following: <br/>
	 *  <br/>
	 *	0 = idle <br/>
 	 * 	1 = working <br/>
 	 * 	2 = waiting <br/>
 	 * 	3 = finished <br/>
 	 * @see #startDownloadData  
	 * @see #cancelDownloadData
	 */
	finishDownloadData: function() {
		//console.debug("Plugin.finishDownloadData");
		return this.plugin.FinishDownloadData();
	},

	/** Cancel the asynchronous Download Data operation. <br/>
	 * <br/>
	 * Minimum plugin version 2.0.0.4
	 * 
	 * @see #startDownloadData  
	 * @see #finishDownloadData
	 */
	cancelDownloadData: function() {
		this.plugin.CancelDownloadData();
	},

    /** Indicates success of StartDownloadData operation. <br/>
     * <br/>
     * Minimum plugin version 2.0.0.4
     * 
     * @type Boolean
     * @return True if the last StartDownloadData operation was successful
     */
    downloadDataSucceeded: function() {
		return this.plugin.DownloadDataSucceeded;
    },

    /** Download and install a list of unit software updates.  Start the asynchronous 
     * StartUnitSoftwareUpdate operation.
     * 
     * Check for completion with the FinishUnitSoftwareUpdate() method.  After
     * completion check the DownloadDataSucceeded property to make sure that all of the downloads 
     * were successfully placed on the device. 
     * 
     * See the Schema UnitSoftwareUpdatev3.xsd for the format of the UpdateResponsesXml description
     *
     * @see Garmin.DevicePlugin.finishUnitSoftwareUpdate
     * @see Garmin.DevicePlugin.cancelUnitSoftwareUpdate
     * @see Garmin.DevicePlugin.downloadDataSucceeded
     * @version plugin v2.6.2.0
     */
    startUnitSoftwareUpdate: function(updateResponsesXml, deviceNumber) {
        this.plugin.StartUnitSoftwareUpdate(updateResponsesXml, deviceNumber);
    },
    
    /** Poll for completion of the asynchronous Unit Software Update operation. It will return an integer
	 * know as the completion state.  The purpose is to show the 
 	 * user information about what is happening to the plugin while it 
 	 * is servicing your request.<br/>
 	 * @type Number 
     * @version plugin v2.6.2.0
     * @return Completion state - The completion state can be one of the following: <br/>
	 *  <br/>
	 *	0 = idle <br/>
 	 * 	1 = working <br/>
 	 * 	2 = waiting <br/>
 	 * 	3 = finished <br/>
 	 * @see Garmin.DevicePlugin.startUnitSoftwareUpdate
 	 * @see Garmin.DevicePlugin.cancelUnitSoftwareUpdate
     */
    finishUnitSoftwareUpdate: function() {
        return this.plugin.FinishUnitSoftwareUpdate();  
    },
    
    /** Cancel the asynchrous Download Data operation
     * @version plugin v2.6.2.0
     */
    cancelUnitSoftwareUpdate: function() {
        this.plugin.CancelUnitSoftwareUpdate();
    },
    
    /** Get the UnitSoftwareUpdateRequests for a given device.
     * This request retrieves the main system software (system region only.)
     * @param deviceNumber {Number} the device number to retrieve unit software information for. 
     * @return {String} XML string of the document format in the namespace below, or
     * the most current version of that xms namespace
     * http://www.garmin.com/xmlschemas/UnitSoftwareUpdate/v3
     * @version plugin v2.6.2.0
     * @see Garmin.DevicePlugin.getAdditionalSoftwareUpdateRequests
     */
//    getUnitSoftwareUpdateRequests: function(deviceNumber) {
//        return this.plugin.UnitSoftwareUpdateRequests(deviceNumber);
//    },
    
    /** Get the AdditionalSoftwareUpdateRequests for a given device.
     * This request retrieves the additional system software (all software except for system region.)
     * @param deviceNumber {Number} the device number to retrieve unit software information for.
     * @return {String} XML string of the document format in the namespace below, or
     * the most current version of that xms namespace
     * http://www.garmin.com/xmlschemas/UnitSoftwareUpdate/v3
     * @version plugin v2.6.2.0
     * @see Garmin.DevicePlugin.getUnitSoftwareUpdateRequests
     */
//    getAdditionalSoftwareUpdateRequests: function(deviceNumber) {
//        return this.plugin.AdditionalSoftwareUpdateRequests(deviceNumber);
//    },
    
    /** Indicates success of WriteToGps operation. <br/>
     * <br/>
     * Minimum plugin version 2.0.0.4
     * 
     * @type Boolean
     * @return True if the last ReadFromGps or WriteToGps operation was successful
     */
    gpsTransferSucceeded: function() {
		return this.plugin.GpsTransferSucceeded;
    },

    /** Indicates success of ReadFitnessData or WriteFitnessData operation. <br/>
     * <br/>
     * Minimum plugin version 2.1.0.3
     * 
     * @type Boolean
     * @return True if the last ReadFitnessData or WriteFitnessData operation succeeded
     */
    fitnessTransferSucceeded: function() {
		return this.plugin.FitnessTransferSucceeded;
    },
    
    /** Return the specified file as a UU-Encoded string
     * <br/>
     * Minimum version 2.6.3.1
     * 
     * If the file is known to be compressed, compressed should be
     * set to false. Otherwise, set compressed to true to retrieve a
     * gzipped and uuencoded file.
     * 
     * @param relativeFilePath {String} path relative to the Garmin folder on the device
     */
    getBinaryFile: function(deviceNumber, relativeFilePath, compressed) {
        return this.plugin.GetBinaryFile(deviceNumber, relativeFilePath, compressed);
    },
    
    /** This is the GpsXml information from the device. Typically called after a read operation.
     * 
     * @see #finishReadFromGps
     */
	getGpsXml: function(){
		return this.plugin.GpsXml;
	},

    /** This is the fitness data Xml information from the device. Typically called after a ReadFitnessData operation. <br/>
	 * <br/>
     * Schemas for the TrainingCenterDatabase format are available at
     * <a href="http://developer.garmin.com/schemas/tcx/v2/">http://developer.garmin.com/schemas/tcx/v2/</a><br/>
     * <br/>
     * Minimum plugin version 2.1.0.3
     * 
     * @see #finishReadFitnessData
     * @see #finishReadFitnessDirectory
     * @see #finishReadFitnessDetail
     */
	getTcdXml: function(){
		return this.plugin.TcdXml;
	},
	
	 /** Returns last read fitness xml data in compressed format.  The xml is compressed as gzp and base64 expanded. <br/>
	  * <br/>
	  * Minimum plugin version 2.2.0.2
	  * 
	  * @return The read xml data in compressed gzp and base64 expanded format.
	  * @see #finishReadFitnessData
      * @see #finishReadFitnessDirectory
      * @see #finishReadFitnessDetail
	  */
	getTcdXmlz: function() {
		return this.plugin.TcdXmlz;
	},

	 /** Returns last read directory xml data.<br/>
	  * <br/>
	  * 
	  * @return The directory xml data
	  * @see #finishReadFitDirectory
	  */
	getDirectoryXml: function() {
		return this.plugin.DirectoryListingXml;
	},
	
    /** Returns the xml describing the message when the plug-in is waiting for input from the user.
     * @type String
     * @return The xml describing the message when the plug-in is waiting for input from the user.
     */
	getMessageBoxXml: function(){
		return this.plugin.MessageBoxXml;
	},
    
	/** Get the status/progress of the current state or transfer.
     * @type String
     * @return The xml describing the current progress state of the plug-in.
     */	
	getProgressXml: function() {
		return this.plugin.ProgressXml;
	},

	/** Returns metadata information about the plugin version. 
     * @type String
     * @return The xml describing the user's version of the plug-in.
	 */
	getVersionXml: function() {
		return this.plugin.VersionXml;
	},
	
	/** Gets a string of the version number for the plugin the user has currently installed.
     * @type String 
     * @return A string of the format "versionMajor.versionMinor.buildMajor.buildMinor", ex: "2.0.0.4"
     */	
	getPluginVersionString: function() {
		var versionArray = this.getPluginVersion();
	
		var versionString = versionArray[0] + "." + versionArray[1] + "." + versionArray[2] + "." + versionArray[3];
	    return versionString;
	},
	
	/** Gets the version number for the plugin the user has currently installed.
     * @type Array 
     * @return An array of the format: [versionMajor, versionMinor, buildMajor, buildMinor].
     */	
	getPluginVersion: function() {
    	var versionMajor = parseInt(this._getElementValue(this.getVersionXml(), "VersionMajor"));
    	var versionMinor = parseInt(this._getElementValue(this.getVersionXml(), "VersionMinor"));
    	var buildMajor = parseInt(this._getElementValue(this.getVersionXml(), "BuildMajor"));
    	var buildMinor = parseInt(this._getElementValue(this.getVersionXml(), "BuildMinor"));

	    var versionArray = [versionMajor, versionMinor, buildMajor, buildMinor];
	    return versionArray;
	},
	
	/** Sets the required plugin version number for the application.
	 * @param reqVersionArray {Array} The required version to set to.  In the format [versionMajor, versionMinor, buildMajor, buildMinor]
	 * 			i.e. [2,2,0,1]
	 */
	setPluginRequiredVersion: function(reqVersionArray) {
		Garmin.DevicePlugin.REQUIRED_VERSION.versionMajor = reqVersionArray[0];
		Garmin.DevicePlugin.REQUIRED_VERSION.versionMinor = reqVersionArray[1];
		Garmin.DevicePlugin.REQUIRED_VERSION.buildMajor = reqVersionArray[2];
		Garmin.DevicePlugin.REQUIRED_VERSION.buildMinor = reqVersionArray[3];
	},
	
	/** Sets the latest plugin version number.  This represents the latest version available for download at Garmin.
	 * We will attempt to keep the default value of this up to date with each API release, but this is not guaranteed,
	 * so set this to be safe or if you don't want to upgrade to the latest API.
	 * 
	 * @param reqVersionArray {Array} The latest version to set to.  In the format [versionMajor, versionMinor, buildMajor, buildMinor]
	 * 			i.e. [2,2,0,1]
	 */
	setPluginLatestVersion: function(reqVersionArray) {
		Garmin.DevicePlugin.LATEST_VERSION.versionMajor = reqVersionArray[0];
		Garmin.DevicePlugin.LATEST_VERSION.versionMinor = reqVersionArray[1];
		Garmin.DevicePlugin.LATEST_VERSION.buildMajor = reqVersionArray[2];
		Garmin.DevicePlugin.LATEST_VERSION.buildMinor = reqVersionArray[3];
	},
	
	/** Used to check if the user's installed plugin version meets the required version for feature support purposes.
	 *  
	 * @param {Array} reqVersionArray An array representing the required version, in the format: [versionMajor, versionMinor, buildMajor, buildMinor]. 
	 * @return {boolean} true if the passed in required version is met by the user's plugin version (user's version is equal to or greater), false otherwise.
	 * @see setPluginRequiredVersion
	 */
	checkPluginVersionSupport: function(reqVersionArray) {
		
		var pVersion = this._versionToNumber(this.getPluginVersion());
   		var rVersion = this._versionToNumber(reqVersionArray);
        return (pVersion >= rVersion);
	},
	
	/**
	 * @private
	 */
	_versionToNumber: function(versionArray) {
		if (versionArray[1] > 99 || versionArray[2] > 99 || versionArray[3] > 99)
			throw new Error("version segment is greater than 99: "+versionArray);
		return 1000000*versionArray[0] + 10000*versionArray[1] + 100*versionArray[2] + versionArray[3];
	},
	
	/** Determines if the Garmin plugin is at least the required version for the application.
     * @type Boolean
     * @see setPluginRequiredVersion
	 */
	isPluginOutOfDate: function() {
    	var pVersion = this._versionToNumber(this.getPluginVersion());
   		var rVersion = this._versionToNumber(Garmin.DevicePlugin.REQUIRED_VERSION.toArray());
        return (pVersion < rVersion);
	},
	
	/** Checks if plugin is the most recent version released, for those that want the latest and greatest.
     */
    isUpdateAvailable: function() {
    	var pVersion = this._versionToNumber(this.getPluginVersion());
   		var cVersion = this._versionToNumber(Garmin.DevicePlugin.LATEST_VERSION.toArray());
        return (pVersion < cVersion);
    },
	
	/** Pulls value from xml given an element name or null if no tag exists with that name.
	 * @private
	 */
	_getElementValue: function(xml, tagName) {
		var start = xml.indexOf("<"+tagName+">");
		if (start == -1)
			return null;
		start += tagName.length+2;
		var end = xml.indexOf("</"+tagName+">");
		var result = xml.substring(start, end);
		return result;
	}
	
};

/** Latest version (not required) of the Garmin Communicator Plugin, and a complementary toString function to print it out with
 */
Garmin.DevicePlugin.LATEST_VERSION = {
    versionMajor: 2,
    versionMinor: 7,
    buildMajor: 3,
    buildMinor: 0,
    
    toString: function() {
        return this.versionMajor + "." + this.versionMinor + "." + this.buildMajor + "." + this.buildMinor;
    },
    
    toArray: function() {
        return [this.versionMajor, this.versionMinor, this.buildMajor, this.buildMinor];
    }	
}; 
 
 
/** Latest required version of the Garmin Communicator Plugin, and a complementary toString function to print it out with. 
 */
Garmin.DevicePlugin.REQUIRED_VERSION = {
    versionMajor: 2,
    versionMinor: 1,
    buildMajor: 0,
    buildMinor: 1,
    
    toString: function() {
        return this.versionMajor + "." + this.versionMinor + "." + this.buildMajor + "." + this.buildMinor;
    },
    
    toArray: function() {
        return [this.versionMajor, this.versionMinor, this.buildMajor, this.buildMinor];
    }	
};



if (Garmin == undefined) var Garmin = {};
/** Copyright &copy; 2007-2010 Garmin Ltd. or its subsidiaries.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License')
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * 
 * @fileoverview Garmin.DeviceControl A high-level JavaScript API which supports listener and callback functionality.
 * @version 1.8
 */
/** A controller object that can retrieve and send data to a Garmin 
 * device.<br><br>
 * @class Garmin.DeviceControl
 * 
 * The controller must be unlocked before anything can be done with it.  
 * Then you'll have to find a device before you can start to read data from
 * and write data to the device.<br><br>
 * 
 * We use the <a href="http://en.wikipedia.org/wiki/Observer_pattern">observer pattern</a> 
 * to handle the asynchronous nature of device communication.  You must register
 * your class as a listener to this Object and then implement methods that will 
 * get called on certain events.<br><br>
 * 
 * Events:<br><br>
 *     onStartFindDevices called when starting to search for devices.
 *       the object returned is {controller: this}<br><br>
 *
 *     onCancelFindDevices is called when the controller is told to cancel finding
 *         devices {controller: this}<br><br>
 *
 *     onFinishFindDevices called when the devices are found.
 *       the object returned is {controller: this}<br><br>
 *
 *     onException is called when an exception occurs in a method
 *         object passed back is {msg: exception}<br><br>
 *
 *	   onInteractionWithNoDevice is called when the device is lazy loaded, but finds no devices,
 * 			yet still attempts a read/write action {controller: this}<br><br>
 * 
 *     onStartReadFromDevice is called when the controller is about to start
 *         reading from the device {controller: this}<br><br>
 * 
 *     onFinishReadFromDevice is called when the controller is done reading 
 *         the device.  the read is either a success or failure, which is 
 *         communicated via json.  object passed back contains 
 *         {success:this.garminPlugin.GpsTransferSucceeded, controller: this} <br><br>
 *
 *     onWaitingReadFromDevice is called when the controller is waiting for input
 *         from the user about the device.  object passed back contains: 
 *         {message: this.garminPlugin.MessageBoxXml, controller: this}<br><br>
 *
 *     onProgressReadFromDevice is called when the controller is still reading information
 *         from the device.  in this case the message is a percent complete/ 
 *         {progress: this.getDeviceStatus(), controller: this}<br><br>
 *
 *     onCancelReadFromDevice is called when the controller is told to cancel reading
 *         from the device {controller: this}<br><br>
 *
 *     onFinishWriteToDevice is called when the controller is done writing to 
 *         the device.  the write is either a success or failure, which is 
 *         communicated via json.  object passed back contains 
 *         {success:this.garminPlugin.GpsTransferSucceeded, controller: this}<br><br>
 *
 *     onWaitingWriteToDevice is called when the controller is waiting for input
 *         from the user about the device.  object passed back contains: 
 *         {message: this.garminPlugin.MessageBoxXml, controller: this}<br><br>
 *
 *     onProgressWriteToDevice is called when the controller is still writing information
 *         to the device.  in this case the message is a percent complete/ 
 *         {progress: this.getDeviceStatus(), controller: this}<br><br>
 *
 *     onCancelWriteToDevice is called when the controller is told to cancel writing
 *         to the device {controller: this}<br><br>
 *
 * @constructor 
 *
 * requires Prototype
 * @requires Garmin.DevicePlugin
 * @requires Garmin.XmlConverter
 */
Garmin.DeviceControl = function(listener){

	this.pluginUnlocked = false;
	this.dirInterval = null;
	//keep state when doing multi-type file listings
	this.fileListingOptions = null;
	this.fileListingIndex = 0;
	this.listener = listener;

	try {
		if (typeof(Garmin.DevicePlugin) == 'undefined') throw '';
	} catch(e) {
		throw new Error(Garmin.DeviceControl.MESSAGES.deviceControlMissing);
	};

	// make sure the browser has the plugin installed
	if (!PluginDetect.detectGarminCommunicatorPlugin()) {
 	    var notInstalled = new Error(Garmin.DeviceControl.MESSAGES.pluginNotInstalled);
	    notInstalled.name = "PluginNotInstalledException";
	    throw notInstalled;			
	}
			
	// grab the plugin object on the page
	var pluginElement;
	if( window.ActiveXObject ) { // IE
		pluginElement = $("#GarminActiveXControl")[0];
	} else { // FireFox
		pluginElement = $("#GarminNetscapePlugin")[0];
	}
	
	// make sure the plugin object exists on the page
	if (pluginElement == null) {
		var error = new Error(Garmin.DeviceControl.MESSAGES.missingPluginTag);
		error.name = "HtmlTagNotFoundException";
		throw error;			
	}
	
	// instantiate a garmin plugin
	this.garminPlugin = new Garmin.DevicePlugin(pluginElement);
	 
	// validate the garmin plugin
	this.validatePlugin();
	
	this.getDetailedDeviceData = true;
	this.devices = new Array();
	this.deviceNumber = null;
	this.numDevices = 0;

	this.gpsData = null;
	this.gpsDataType = null; //used by both read and write methods to track data context
	this.gpsDataString = "";
	this.gpsDataStringCompressed = "";  // Compresed version of gpsDataString.  gzip compressed and base 64 expanded.
	
	//this.wasMessageHack = false; //needed because garminPlugin.finishDownloadData returns true after out-of-memory error message is returned
}
Garmin.DeviceControl.prototype = {


	/////////////////////// Initialization Code ///////////////////////	


	/** Checks plugin validity: browser support, installation and required version.
	 * @private
     * @throws BrowserNotSupportedException
     * @throws PluginNotInstalledException
     * @throws OutOfDatePluginException
     */
    validatePlugin: function() {
		if (!this.isPluginInstalled()) {
     	    var notInstalled = new Error(Garmin.DeviceControl.MESSAGES.pluginNotInstalled);
    	    notInstalled.name = "PluginNotInstalledException";
    	    throw notInstalled;
        }
		if(this.garminPlugin.isPluginOutOfDate()) {
    	    var outOfDate = new Error(Garmin.DeviceControl.MESSAGES.outOfDatePlugin1+Garmin.DevicePlugin.REQUIRED_VERSION.toString()+Garmin.DeviceControl.MESSAGES.outOfDatePlugin2+this.getPluginVersionString());
    	    outOfDate.name = "OutOfDatePluginException";
    	    outOfDate.version = this.getPluginVersionString();
    	    throw outOfDate;
        }
    },
    
    /** Checks plugin for updates.  Throws an exception if the user's plugin version is
     * older than the one set by the API.
     * 
     * Plugin updates are not required so use this function with caution.
     * @see #setPluginLatestVersion
     */
    checkForUpdates: function() {
    	if(this.garminPlugin.isUpdateAvailable()) {
    		var notLatest = new Error(Garmin.DeviceControl.MESSAGES.updatePlugin1+Garmin.DevicePlugin.LATEST_VERSION.toString()+Garmin.DeviceControl.MESSAGES.updatePlugin2+this.getPluginVersionString());
    	    notLatest.name = "UpdatePluginException";
    	    notLatest.version = this.getPluginVersionString();
    	    throw notLatest;
    	}
    },
    
	/////////////////////// Device Handling Methods ///////////////////////	

	/** Finds any connected Garmin Devices.  
     * When it's done finding the devices, onFinishFindDevices is dispatched <br/>
     * <br/>
     * this.numDevices = the number of devices found<br/>
     * this.deviceNumber is the device that we'll use to communicate with<br/>
     * <br/>
     * Use this.getDevices() to get an array of the found devices and 
     * this.setDeviceNumber({Number}) to change the device. <br/>
     * <br/>
     * Minimum Plugin version 2.0.0.4
     * 
     * @see #getDevices
     * @see #setDeviceNumber
     */	
	findDevices: function() {
		if (!this.isUnlocked())
			throw new Error(Garmin.DeviceControl.MESSAGES.pluginNotUnlocked);
        this.garminPlugin.startFindDevices();
//        this.listener.onStartFindDevices();
        setTimeout(function() { this._finishFindDevices() }.bind(this), 1000);
	},

	/** Cancels the current find devices interaction. <br/>
	 * <br/>
	 * Minimum Plugin version 2.0.0.4
     */	
	cancelFindDevices: function() {
		this.garminPlugin.cancelFindDevices();
		this.listener.onCancelFindDevices();
	},

	/** Loads device data into devices array.
	 * 
	 * Minimum Plugin version 2.0.0.4
	 * 
	 * @private
     */	
	_finishFindDevices: function() {
    	if(this.garminPlugin.finishFindDevices()) {
            this.devices = Garmin.PluginUtils.parseDeviceXml(this.garminPlugin, this.getDetailedDeviceData);
            this.numDevices = this.devices.length;
       		this.deviceNumber = 0;
       		this.listener.onFinishFindDevices();
    	} else {
    		setTimeout(function() { this._finishFindDevices() }.bind(this), 500);
    	}
	},

	/** Sets the deviceNumber variable which determines which connected device to talk to.
     * @param {Number} deviceNumber The device number
     */	
	setDeviceNumber: function(deviceNumber) {
		this.deviceNumber = deviceNumber;
	},
	
	/**
	 * Get the device number of the connected device to communicate with (multiple devices may
	 * be connected simultaneously, but the plugin only transfers data with one at a time).
	 * @return the device number (assigned by the plugin) determining which connected device
	 * to talk to.
	 */
	getDeviceNumber: function() {
        return this.deviceNumber;
	},

	/** Get a list of the devices found
     * @type Array<Garmin.Device>
     */	
	getDevices: function() {
		return this.devices;
	},
	
	/** Returns the DeviceXML of the current device, as a string.
	 */
	getCurrentDeviceXml: function() {
		return this.garminPlugin.getDeviceDescriptionXml(this.deviceNumber);		
	},
	
	/** Returns the FIT Directory XML of the current device, as a string.
	 * @private
     * @returns {String}
	 */
	getCurrentDeviceFitDirectoryXml: function() {
		try
		{
			this.garminPlugin.startReadFitDirectory(this.deviceNumber);
			this.waitForReadToFinish();
			this.pause(1000);
		}
		catch(aException)
		{}
		
		var xml = this.garminPlugin.getDirectoryXml();
		if(xml == "")
		{
			//this.garminPlugin.resetDirectoryXml();
		}
		return xml;		
	},
	
	/** Returns true if FIT health data can be read from the device.
     * @returns {Boolean}
	 */
	doesCurrentDeviceSupportHealth: function(){
    	var supported = false;
    	var directoryXml = this.getCurrentDeviceFitDirectoryXml();
		if(directoryXml != "")
		{
			var files = Garmin.DirectoryFactory.parseString(directoryXml);
			if(Garmin.DirectoryFactory.getHealthDataFiles(files).length > 0)
			{
				supported = true;
			}
		}
		return supported;
    },

	/*@private*/
	pause: function(millis)
	{
		var date = new Date();
		var curDate = null;

		do { curDate = new Date(); }
		while(curDate-date < millis);
	},
	
	/*@private*/
	waitForReadToFinish: function()
	{
		var complete = false;
		
		while(complete == false)
		{
			try
			{
				var theCompletionState =this.garminPlugin.finishReadFitDirectory();
				//alert("thecompletionState = " + theCompletionState);
				if( theCompletionState == 3 ) //Finished
				{
					complete = true;
				}
				else if( theCompletionState == 2 ) //Message Waiting
				{
					complete = true;
				}
				else
				{
				}
			}
			catch( aException )
			{
				complete = true;
			}
		}
	},


	/////////////////////// Read Methods ///////////////////////
	
	/** Generic read method, supporting GPX and TCX Fitness types: Courses, Workouts, User Profiles, Activity Goals, 
	 * TCX activity directory, and various directory reads. <br/>
	 * <br/>
	 * Fitness detail reading (one specific activity) is not supported by this read method, refer to 
	 * readDetailFromDevice for that. <br/><br/>
     * <strong>Examples:</strong>
     *@example
     * myControl.readDataFromDevice( Garmin.DeviceControl.FILE_TYPES.gpx ); 
     *
	 * @example
     * var theListOptions = [{dataTypeName: 'UserDataSync',
     *                         dataTypeID: 'http://www.topografix.com/GPX/1/1',
     *                         computeMD5: false}];
	 * myControl.readDataFromDevice( Garmin.DeviceControl.FILE_TYPES.readableDir,
	 *                               theListOptions );
     *
	 * @param {String} fileType The filetype to read from device.  Possible values for fileType are located in Garmin.DeviceControl.FILE_TYPES -- detail types are not supported. <br/>
     * @param {Object[]} [fileListingOptions] Array of objects that define file listing options. <br/>
     * <strong>fileListingOptions properties:</strong> <br/>
     * {String} dataTypeName: Name from GarminDevice.xml <br/>
     * {String} dataTypeID: Identifier from GarminDevice.xml<br/>
     * {Boolean} computeMD5: compute MD5 checksum for each listed file<br/>
     * @see #readDetailFromDevice, Garmin.DeviceControl#FILE_TYPES
	 * @throws InvalidTypeException, UnsupportedTransferTypeException
     */	
	readDataFromDevice: function(fileType, fileListingOptions) {
		if (!this.isUnlocked())
			throw new Error(Garmin.DeviceControl.MESSAGES.pluginNotUnlocked);
		if (this.numDevices == 0)
			throw new Error(Garmin.DeviceControl.MESSAGES.noDevicesConnected);
		if( fileType == Garmin.DeviceControl.FILE_TYPES.readableDir && 
		    fileListingOptions === undefined ) {
			var error = new Error("You have specified invalid or conflicting fileListingOptions");
			error.name = "InvalidParameterException";
			throw error;
		}
		// Make sure the device supports this type of data transfer for this type
		var device = this._getDeviceByNumber(this.deviceNumber);
		if( !device._gpxType.writeAccess) {
		    var error = new Error(Garmin.DeviceControl.MESSAGES.unsupportedReadDataType + fileType);
    	    error.name = "UnsupportedDataTypeException";
			throw error;
		}
		this.gpsDataType = fileType;
		this.gpsData = null;		
		this.gpsDataString = null;
		this.idle = false;
		this.fileListingOptions = fileListingOptions;
		this.fileListingIndex = 0;
		try {
			this.garminPlugin.startReadFromGps( this.deviceNumber );
		} catch(e) {
		    this._reportException(e);
		}
		this._progressRead();
	},
	
	/** Generic detail read method, which reads a specific fitness activity from the device given an activity ID.  
	 * Supported detail types are history activities and course activities.  The resulting data read is available 
	 * in via gpsData as an XML DOM and gpsDataString as an XML string once the read successfully finishes. 
	 * Typically used after calling readDataFromDevice to read a fitness directory.<br/> 
	 * <br/>
	 * Minimum plugin version 2.2.0.2
	 * 
	 * @param {String} fileType Filetype to be read from the device.  Supported values are 
	 * Garmin.DeviceControl.FILE_TYPES.tcxDetail and Garmin.DeviceControl.FILE_TYPES.crsDetail
	 * @param {String} dataId The ID of the data to be read from the device.  The format of these values depends 
	 * on the type of data being read (i.e. course data or history data). The CourseName element in the course schema 
	 * is used to identify courses, and the Id element is used to identify history activities.
	 * @see #readDataFromDevice, #readHistoryDetailFromFitnessDevice, #readCourseDetailFromFitnessDevice
	 * @throws InvalidTypeException, UnsupportedTransferTypeException
	 */
	readDetailFromDevice: function(fileType, dataId) {
		if (!this.isUnlocked())
			throw new Error(Garmin.DeviceControl.MESSAGES.pluginNotUnlocked);
		if (this.numDevices == 0)
			throw new Error(Garmin.DeviceControl.MESSAGES.noDevicesConnected);
		if ( ! this._isAMember(fileType, [Garmin.DeviceControl.FILE_TYPES.tcxDetail, Garmin.DeviceControl.FILE_TYPES.crsDetail])) {
			var error = new Error(Garmin.DeviceControl.MESSAGES.invalidFileType + fileType);
			error.name = "InvalidTypeException";
			throw error;
		}
		if( !this.checkDeviceReadSupport(fileType) ) {
			throw new Error(Garmin.DeviceControl.MESSAGES.unsupportedReadDataType + fileType);
		}
		
		this.gpsDataType = fileType;
		this.gpsData = null;		
		this.gpsDataString = null;
		this.idle = false;
		
		try {
        	switch(this.gpsDataType) {
        		case Garmin.DeviceControl.FILE_TYPES.tcxDetail:
        			this.garminPlugin.startReadFitnessDetail(this.deviceNumber, Garmin.DeviceControl.FILE_TYPES.tcx, dataId);
        			break;
        		case Garmin.DeviceControl.FILE_TYPES.crsDetail:
        			this.garminPlugin.startReadFitnessDetail(this.deviceNumber, Garmin.DeviceControl.FILE_TYPES.crs, dataId);
        			break;
        	} 
		    this._progressRead();
		} catch(e) {
		    this._reportException(e);
		}
	},
	
	/** Asynchronously reads GPX data from the connected device.  Only handles reading
     * from the device in this.deviceNumber. <br/>
     * <br/>
     * When the data has been gathered, the onFinishedReadFromDevice is fired, and the
     * data is stored in this.gpsDataString and this.gpsData
     * 
     * @see #readDataFromDevice
     */
	readFromDevice: function() {
		this.readDataFromDevice(Garmin.DeviceControl.FILE_TYPES.gpx);
	},
	
	/** Asynchronously reads a single fitness history record from the connected device as TCX format.
	 * Only handles reading from the device in this.deviceNumber.<br/>
	 * <br/>
     * When the data has been gathered, the onFinishedReadFromDevice is fired, and the
     * data is stored in this.gpsDataString
     * 
     * Minimum plugin version 2.2.0.2
     * 
     * @param {String} historyId The ID of the history record on the device.
     * 
     * @see #readDetailFromDevice
     */	
	readHistoryDetailFromFitnessDevice: function(historyId) {
		this.readDetailFromDevice(Garmin.DeviceControl.FILE_TYPES.tcx, historyId)
	},
	
	/** Asynchronously reads a single fitness course from the connected device as TCX format.
	 * Only handles reading from the device in this.deviceNumber. <br/>
     * <br/>
     * When the data has been gathered, the onFinishedReadFromDevice is fired, and the
     * data is stored in this.gpsDataString<br/>
     * <br/>
     * Minimum plugin version 2.2.0.2
     * 
     * @param {String} courseId The name of the course on the device.
     * 
     * @see #readDetailFromDevice
     */			
	readCourseDetailFromFitnessDevice: function(courseId){
		this.readDetailFromDevice(Garmin.DeviceControl.FILE_TYPES.crs, courseId)
	},
	
	/** Asynchronously reads entire fitness history data (TCX) from the connected device.  
	 * Only handles reading from the device in this.deviceNumber. <br/>
     * <br/>
     * When the data has been gathered, the onFinishedReadFromDevice is fired, and the
     * data is stored in this.gpsDataString<br/>
     * <br/>
     * Minimum plugin version 2.1.0.3
     * 
     * @see #readDataFromDevice
     */	
	readHistoryFromFitnessDevice: function() {	
		this.readDataFromDevice(Garmin.DeviceControl.FILE_TYPES.tcx);
	},
	
	/** Asynchronously reads entire fitness course data (CRS) from the connected device.  
	 * Only handles reading from the device in this.deviceNumber<br/>
     * <br/>
     * When the data has been gathered, the onFinishedReadFromDevice is fired, and the
     * data is stored in this.gpsDataString<br/>
     * <br/>
     * Minimum plugin version 2.2.0.1
     * 
     * @see #readDataFromDevice
     */	
	readCoursesFromFitnessDevice: function() {
		this.readDataFromDevice(Garmin.DeviceControl.FILE_TYPES.crs);
	},
	
	/** Asynchronously reads fitness workout data (WKT) from the connected device.  
	 * Only handles reading from the device in this.deviceNumber<br/>
     * <br/>
     * When the data has been gathered, the onFinishedReadFromDevice is fired, and the
     * data is stored in this.gpsDataString<br/>
     * <br/>
     * Minimum plugin version 2.2.0.1
     * 
     * @see #readDataFromDevice
     */	
	readWorkoutsFromFitnessDevice: function() {
		this.readDataFromDevice(Garmin.DeviceControl.FILE_TYPES.wkt);
	},
	
	/** Asynchronously reads fitness profile data (TCX) from the connected device.
	 * Only handles reading from the device in this.deviceNumber<br/>
     * <br/>
     * When the data has been gathered, the onFinishedReadFromDevice is fired, and the
     * data is stored in this.gpsDataString<br/>
     * <br/>
     * Minimum plugin version 2.2.0.1
     * 
     * @see #readDataFromDevice
     */	
	readUserProfileFromFitnessDevice: function() {
		this.readDataFromDevice(Garmin.DeviceControl.FILE_TYPES.tcxProfile);
	},

	/** Asynchronously reads fitness goals data (TCX) from the connected device.
	 * Only handles reading from the device in this.deviceNumber<br/>
     * <br/>
     * When the data has been gathered, the onFinishedReadFromDevice is fired, and the
     * data is stored in this.gpsDataString<br/>
     * <br/>
     * Minimum plugin version 2.2.0.1
     * 
     * @see #readDataFromDevice
     */	
	readGoalsFromFitnessDevice: function() {
		this.readDataFromDevice(Garmin.DeviceControl.FILE_TYPES.goals);
	},
	
	
	
	/** Returns the GPS data that was last read as an XML DOM. <br/> 
	 * Pre-requisite - Read function was called successfully.  <br/> 
	 * <br/>
	 * Minimum plugin version 2.1.0.3
	 * 
	 * @return XML DOM of read GPS data
	 * @see #readDataFromDevice
	 * @see #readHistoryFromFitnessDevice
	 * @see #readHistoryDetailFromFitnessDevice
	 * @see #readCourseDetailFromFitnessDevice
	 */
	getGpsData: function() {
		
		if (!this.isUnlocked())
			throw new Error(Garmin.DeviceControl.MESSAGES.pluginNotUnlocked);
		if (this.numDevices == 0)
			throw new Error(Garmin.DeviceControl.MESSAGES.noDevicesConnected);
		if( this.getReadCompletionState != Garmin.DeviceControl.FINISH_STATES.finished ) {
			throw new Error(Garmin.DeviceControl.MESSAGES.incompleteRead);
		}
		
		return this.gpsData;
	},
	
	/** Returns the GPS data that was last read as an XML string. <br/>  
	 * Pre-requisite - Read function was called successfully. <br/>
	 * <br/>
	 * Minimum plugin version 2.1.0.3
	 * 
	 * @return XML string of read GPS data
	 * @see #readDataFromDevice
	 * @see #readHistoryFromFitnessDevice
	 * @see #readHistoryDetailFromFitnessDevice
	 * @see #readCourseDetailFromFitnessDevice
	 */
	getGpsDataString: function() {
		if (!this.isUnlocked())
			throw new Error(Garmin.DeviceControl.MESSAGES.pluginNotUnlocked);
		if (this.numDevices == 0)
			throw new Error(Garmin.DeviceControl.MESSAGES.noDevicesConnected);
		if( this.getReadCompletionState != Garmin.DeviceControl.FINISH_STATES.finished ) {
			throw new Error(Garmin.DeviceControl.MESSAGES.incompleteRead);
		}
		
		return this.gpsDataString;
	},
	
	/** Returns the last read fitness data in compressed format.  A fitness read method must be called and the read must
	 * finish successfully before this function returns good data. <br/>
	 * <br/>
	 * Minimum plugin version 2.2.0.2
	 * 
	 * @return Compressed fitness XML data from the last successful read.  The data is gzp compressed and base64 expanded.
	 * @see #readDataFromDevice
	 * @see #readHistoryFromFitnessDevice
	 * @see #readHistoryDetailFromFitnessDevice
	 * @see #readCourseDetailFromFitnessDevice
	 */
	getCompressedFitnessData: function() {
		
		if (!this.isUnlocked())
			throw new Error(Garmin.DeviceControl.MESSAGES.pluginNotUnlocked);
		if (this.numDevices == 0)
			throw new Error(Garmin.DeviceControl.MESSAGES.noDevicesConnected);
		if( this.getReadCompletionState != Garmin.DeviceControl.FINISH_STATES.finished ) {
			throw new Error(Garmin.DeviceControl.MESSAGES.incompleteRead);
		}

		try{
			this.garminPlugin.getTcdXmlz();
		}
		catch( aException ) {
 			this._reportException( aException );
		}
	},

	/** Returns the completion state of the current read.  This function can be used with
	 * GPX and TCX (fitness) reads.
	 * 
	 * @type Number
	 * @return {Number} The completion state of the current read.  The completion state can be one of the following: <br/>
	 *  <br/>
	 *	0 = idle <br/>
 	 * 	1 = working <br/>
 	 * 	2 = waiting <br/>
 	 * 	3 = finished <br/>
	 */	
	getReadCompletionState: function() {
		return this.garminPlugin.finishReadFromGps();
	},
	
	/** Internal read dispatching and polling delay.
	 * @private
     */	
	_progressRead: function() {
        setTimeout(function() { this._finishReadFromDevice() }.bind(this), 200); //200		 
	},
	
	/** Internal read state logic. <br/>
	 * <br/>
	 * Minimum plugin version 2.0.0.4 for GPX and TCX history read.<br/>
	 * Minimum plugin version 2.2.0.2 for directory and detail read.<br/>
	 * Minimum plugin version 2.2.0.2 for compressed file get.
	 * 
	 * @private
     */	
	_finishReadFromDevice: function() {
		var completionState = this.getReadCompletionState();
		
		//console.debug("control._finishReadFromDevice this.gpsDataType="+this.gpsDataType+" completionState="+completionState)
        try {
        	
			if( completionState == Garmin.DeviceControl.FINISH_STATES.finished ) {
			    var theSuccess = false;
    			theSuccess = this.garminPlugin.gpsTransferSucceeded();
    			if (theSuccess) {
        			this.gpsDataString = this.garminPlugin.getGpsXml();
					this.gpsData = Garmin.XmlConverter.toDocument(this.gpsDataString);
					this.listener.onFinishReadFromDevice(theSuccess);
    			}
			} else if( completionState == Garmin.DeviceControl.FINISH_STATES.messageWaiting ) {
				var msg = this._messageWaiting();
			} else {
	    	    this._progressRead();
			}
		} catch( aException ) {
 			this._reportException( aException );
		}
    },

	/** User canceled the read. <br/>
	 * <br/>
	 * Minimum plugin version 2.0.0.4
     */	
	cancelReadFromDevice: function() {
		if (this.gpsDataType == Garmin.DeviceControl.FILE_TYPES.gpx) {
			this.garminPlugin.cancelReadFromGps();
		} else {
			this.garminPlugin.cancelReadFitnessData();
		}
    	this.listener.onCancelReadFromDevice();
	},
	
	
	/** Return the specified file as a UU-Encoded string
     * <br/>
     * Minimum version 2.6.3.1
     * 
     * If the file is known to be compressed, compressed should be
     * set to false. Otherwise, set compressed to true to retrieve a
     * gzipped and uuencoded file.
     * 
     * @param {String} relativeFilePath path relative to the Garmin folder on the device
     */
     getBinaryFile: function(deviceNumber, relativeFilePath) {
        if (!this.isUnlocked())
			throw new Error(Garmin.DeviceControl.MESSAGES.pluginNotUnlocked);
		if(this.numDevices == 0)
			throw new Error(Garmin.DeviceControl.MESSAGES.noDevicesConnected);
        // Attempt to detect Fit file
        if(relativeFilePath.capitalize().endsWith(".fit")) {
            // Capitalize makes all but first letters lowercase. I can't believe prototype doesn't have a lowercase method. :(
            this.gpsDataType = Garmin.DeviceControl.FILE_TYPES.fit;
        } else {
    		this.gpsDataType = Garmin.DeviceControl.FILE_TYPES.binary;
        }
		var success;
		try {
		    this.gpsDataString = this.garminPlugin.getBinaryFile(deviceNumber, relativeFilePath, false);
		    this.gpsDataStringCompressed = this.garminPlugin.getBinaryFile(deviceNumber, relativeFilePath, true);
		    success = true;
	    } catch(e) {
	        success = false;
			this._reportException(e);
	    }
	    
	    this.listener.onFinishReadFromDevice(success);
        return this.gpsData;
     },

	/////////////////////// Web Drop Methods (Write) ///////////////////////
	
    /** Writes an address to the currently selected device.
     * 
     * @param {String} address The address to be written to the device. This doesn't check validity
     */	
	writeAddressToDevice: function(address) {
		if (!this.isUnlocked())
			throw new Error(Garmin.DeviceControl.MESSAGES.pluginNotUnlocked);
		if (!this.geocoder) {
			this.geocoder = new Garmin.Geocode();
			this.geocoder.register(this);
		}
		this.geocoder.findLatLng(address);
	},

	/** Handles call-back from geocoder and forwards call to onException on registered listeners.
	 * @private
     * @param {Error} json error wrapped in JSON 'msg' object.
     */
	onException: function(json) {
		this._reportException(json.msg);
	},
	
	/** Handles call-back from geocoder and forwards call to writeToDevice.
	 * Registered listeners will recieve an onFinishedFindLatLon call before writeToDevice is invoked.
	 * Listeners can change the 'fileName' if they choose avoiding overwritting old waypoints on
	 * some devices.
	 * @private
     * @param {Object} json waypoint, fileName and controller in JSON wrapper.
     */
	onFinishedFindLatLon: function(json) {
		json.fileName = "address.gpx";
		json.controller = this;
   		var factory = new Garmin.GpsDataFactory();
		var gpxStr = factory.produceGpxString(null, [json.waypoint]);
		this.writeToDevice(gpxStr, json.fileName);
	},

	/////////////////////// More Write Methods ///////////////////////	
    /**
     * Generic write method for GPX and TCX file formats.  For binary write, use {@link downloadToDevice}.
     * 
     * @param {String} dataType - the datatype to write to device.  Possible values are located in {@link #Garmin.DeviceControl.FILE_TYPES}
     * @param {String} dataString - the datastring to write to device.  Should be in the format of the dataType value.
     * @param {String} fileName - the filename to write the data to on the device. File extension is not necessary, 
     * but is suggested for device compatibility.  This parameter is ignored when the dataType value is FitnessActivityGoals (see {@link #writeGoalsToFitnessDevice}).
     * @see #writeToDevice, #writeFitnessToDevice
     * @throws InvalidTypeException, UnsupportedTransferTypeException
     */ 
    writeDataToDevice: function(dataType, dataString, fileName) {
        if (!this.isUnlocked()) {
			throw new Error(Garmin.DeviceControl.MESSAGES.pluginNotUnlocked);
        }
        
		if (this.numDevices == 0) {
			throw new Error(Garmin.DeviceControl.MESSAGES.noDevicesConnected);
        }

		this.gpsDataType = dataType;
		var device = this._getDeviceByNumber(this.deviceNumber);        
		if (!device._gpxType.writeAccess) {
			throw new Error(Garmin.DeviceControl.MESSAGES.unsupportedWriteDataType + this.gpsDataType);
		}
		
		try {
//        	this._broadcaster.dispatch("onStartWriteToDevice", {controller: this});
            
        	switch(this.gpsDataType) {
            	case Garmin.DeviceControl.FILE_TYPES.gpx:
        			this.garminPlugin.startWriteToGps(dataString, fileName, this.deviceNumber);
        			break;
        		case Garmin.DeviceControl.FILE_TYPES.crs:
        		case Garmin.DeviceControl.FILE_TYPES.wkt:
        		case Garmin.DeviceControl.FILE_TYPES.goals:
        		case Garmin.DeviceControl.FILE_TYPES.tcxProfile:
        		case Garmin.DeviceControl.FILE_TYPES.nlf:                
        			this.garminPlugin.startWriteFitnessData(dataString, this.deviceNumber, fileName, this.gpsDataType);
        			break;
        		default:
					throw new Error(Garmin.DeviceControl.MESSAGES.unsupportedWriteDataType + this.gpsDataType);
        	}
		    this._progressWrite();
	    } catch(e) {
			this._reportException(e);
	   	}
    },
    
    /** Writes the given GPX XML string to the device selected in this.deviceNumber. <br/>
     * <br/>
     * Minimum plugin version 2.0.0.4
     * 
     * @param gpxString XML to be written to the device. This doesn't check validity.
     * @param fileName The filename to write data to.  Validity is not checked here.
     */	
	writeToDevice: function(gpxString, fileName) {
        this.writeDataToDevice(Garmin.DeviceControl.FILE_TYPES.gpx, gpxString, fileName);	    
	},

	/** DEPRECATED - See {@link #writeCoursesToFitnessDevice}<br/> 
	 * <br/>
	 * Writes fitness course data (TCX) to the device selected in this.deviceNumber. <br/>
	 * <br/>
	 * Minimum plugin version 2.2.0.1
	 * 
     * @param tcxString {String} TCX Course XML string to be written to the device. This doesn't check validity.
     * @param fileName {String} filename to write data to on the device.  Validity is not checked here.
     */	
	writeFitnessToDevice: function(tcxString, fileName) {
		this.writeDataToDevice(Garmin.DeviceControl.FILE_TYPES.crs, tcxString, fileName);
	},

	/** Writes fitness course data (TCX) to the device selected in this.deviceNumber. <br/>
	 * <br/>
	 * Minimum plugin version 2.2.0.1
	 * 
     * @param tcxString {String} TCX Course XML string to be written to the device. This doesn't check validity.
     * @param fileName {String} filename to write data to on the device.  Validity is not checked here.
     */	
	writeCoursesToFitnessDevice: function(tcxString, fileName) {
		this.writeDataToDevice(Garmin.DeviceControl.FILE_TYPES.crs, tcxString, fileName);
	},

	/** Writes fitness goals data (TCX) string to the device selected in this.deviceNumber. All fitness goals
	 * are written to the filename 'ActivityGoals.TCX' in the device's goals directory, in order for the device
	 * to recognize the file.<br/> 
	 * <br/>
	 * Minimum plugin version 2.2.0.1
	 * 
     * @param tcxString {String} ActivityGoals TCX string to be written to the device. This doesn't check validity.
     */	
	writeGoalsToFitnessDevice: function(tcxString) {
		this.writeDataToDevice(Garmin.DeviceControl.FILE_TYPES.goals, tcxString, '');
	},
	
	/** Writes fitness workouts data (XML) string to the device selected in this.deviceNumber. <br/>
	 * <br/>
	 * Minimum plugin version 2.2.0.1
	 * 
     * @param tcxString XML (workouts) string to be written to the device. This doesn't check validity.
     * @param fileName String of filename to write it to on the device.  Validity is not checked here.
     */	
	writeWorkoutsToFitnessDevice: function(tcxString, fileName) {
		this.writeDataToDevice(Garmin.DeviceControl.FILE_TYPES.wkt, tcxString, fileName);
	},
	
	/** Writes fitness user profile data (TCX) string to the device selected in this.deviceNumber. <br/>
	 * <br/>
	 * Minimum plugin version 2.2.0.1
	 * 
     * @param tcxString XML (user profile) string to be written to the device. This doesn't check validity.
     * @param fileName String of filename to write it to on the device.  Validity is not checked here.
     */	
	writeUserProfileToFitnessDevice: function(tcxString, fileName) {
		this.writeDataToDevice(Garmin.DeviceControl.FILE_TYPES.tcxProfile, tcxString, fileName);
	},
	
	/** Downloads and writes binary data asynchronously to device. <br/>
	 * <br/>
	 * Minimum plugin version 2.0.0.4
     *
     * @param xmlDownloadDescription {String} xml string containing information about the files to be downloaded onto the device.
     * @param fileName {String} this parameter is ignored!  We will remove this param from the API in a future compatibility release.
     */	
	downloadToDevice: function(xmlDownloadDescription) {
		if (!this.isUnlocked())
			throw new Error(Garmin.DeviceControl.MESSAGES.pluginNotUnlocked);
		if(this.numDevices == 0)
			throw new Error(Garmin.DeviceControl.MESSAGES.noDevicesConnected);
		this.gpsDataType = Garmin.DeviceControl.FILE_TYPES.binary;
		try {
		    this.garminPlugin.startDownloadData(xmlDownloadDescription, this.deviceNumber );
		    this._progressWrite();
	    } catch(e) {
			this._reportException(e);
	    }
	},
	
	/** Internal dispatch and polling delay.
	 * @private
     */	
	_progressWrite: function() {
		//console.debug("control._progressWrite gpsDataType="+this.gpsDataType)		
        setTimeout(function() { this._finishWriteToDevice() }.bind(this), 200);
	},
	
	/** Internal write lifecycle handling.
	 * @private
     */	
	_finishWriteToDevice: function() {
        try {
			var completionState;
			var success;
			
			switch( this.gpsDataType ) {
				
				case Garmin.DeviceControl.FILE_TYPES.gpx : 
					completionState = this.garminPlugin.finishWriteToGps();
					success = this.garminPlugin.gpsTransferSucceeded();
					break;
				case Garmin.DeviceControl.FILE_TYPES.crs :
				case Garmin.DeviceControl.FILE_TYPES.goals :
				case Garmin.DeviceControl.FILE_TYPES.wkt :
				case Garmin.DeviceControl.FILE_TYPES.tcxProfile :
				case Garmin.DeviceControl.FILE_TYPES.nlf :
					completionState = this.garminPlugin.finishWriteFitnessData();
					success = this.garminPlugin.fitnessTransferSucceeded();
					break;
				case Garmin.DeviceControl.FILE_TYPES.gpi :
				case Garmin.DeviceControl.FILE_TYPES.fitCourse :
				case Garmin.DeviceControl.FILE_TYPES.fitSettings :
				case Garmin.DeviceControl.FILE_TYPES.fitSport :
				case Garmin.DeviceControl.FILE_TYPES.binary :
					completionState = this.garminPlugin.finishDownloadData();
					success = this.garminPlugin.downloadDataSucceeded();
					break;				
				case Garmin.DeviceControl.FILE_TYPES.firmware :
					completionState = this.garminPlugin.finishUnitSoftwareUpdate();
					success = this.garminPlugin.downloadDataSucceeded();
					break;				
				default:
					throw new Error(Garmin.DeviceControl.MESSAGES.unsupportedWriteDataType + this.gpsDataType);
			}
			
			if( completionState == Garmin.DeviceControl.FINISH_STATES.finished ) {
				this.listener.onFinishWriteToDevice(success);
			} else if( completionState == Garmin.DeviceControl.FINISH_STATES.messageWaiting ) {
			} else {
	    	     this._progressWrite();
			}
		} catch( aException ) {
 			this._reportException( aException );
		}
	},

	/** Cancels the current write transfer to the device. <br/>
	 * <br/>
	 * Minimum plugin version 2.0.0.4<br/>
     * Minimum plugin version 2.2.0.1 for writes of GPX to SD Card
     */	
	cancelWriteToDevice: function() {
		switch( this.gpsDataType) {
			case Garmin.DeviceControl.FILE_TYPES.gpx:
				this.garminPlugin.cancelWriteToGps();
				break;
			case Garmin.DeviceControl.FILE_TYPES.gpi:
			case Garmin.DeviceControl.FILE_TYPES.binary:
				this.garminPlugin.cancelDownloadData();
				break;
			case Garmin.DeviceControl.FILE_TYPES.firmware:
				this.garminPlugin.cancelUnitSoftwareUpdate();
				break;
			case Garmin.DeviceControl.FILE_TYPES.crs:
			case Garmin.DeviceControl.FILE_TYPES.goals:
			case Garmin.DeviceControl.FILE_TYPES.wkt:
			case Garmin.DeviceControl.FILE_TYPES.tcxProfile:
			case Garmin.DeviceControl.FILE_TYPES.nlf:
				this.garminPlugin.cancelWriteFitnessData();
				break;
		}
		this.listener.onCancelWriteToDevice();
	},

    /**
	 * Determine the amount of space available on a mass storage mode device (the
	 * currently selected device according to this.deviceNumber). 
	 * <br/> 
	 * Minimum Plugin version 2.5.1
	 * 
	 * @param {String} relativeFilePath - if a file is being replaced, set to relative path on device, otherwise set to empty string.
	 * @return -1 for non-mass storage mode devices.
	 * @see downloadToDevice 
	 */
	bytesAvailable: function(relativeFilePath) {
	    return this.garminPlugin.bytesAvailable(this.getDeviceNumber(), relativeFilePath);
	},
	
	/** Download and install a list of unit software updates.  Start the asynchronous 
     * StartUnitSoftwareUpdate operation.
     * 
     * Check for completion with the FinishUnitSoftwareUpdate() method.  After
     * completion check the DownloadDataSucceeded property to make sure that all of the downloads 
     * were successfully placed on the device. 
     * 
     * See the Schema UnitSoftwareUpdatev3.xsd for the format of the UpdateResponsesXml description
     *
     * @see Garmin.DeviceControl.cancelWriteToDevice
     * @see Garmin.DevicePlugin.downloadDataSucceeded
     * @see Garmin.DevicePlugin._finishWriteToDevice
     * @version plugin v2.6.2.0
     */
    downloadFirmwareToDevice: function(updateResponsesXml) {
        if (!this.isUnlocked())
			throw new Error(Garmin.DeviceControl.MESSAGES.pluginNotUnlocked);
		if(this.numDevices == 0)
			throw new Error(Garmin.DeviceControl.MESSAGES.noDevicesConnected);
		this.gpsDataType = Garmin.DeviceControl.FILE_TYPES.firmware;
		try {
            this.garminPlugin.startUnitSoftwareUpdate(updateResponsesXml, this.deviceNumber);
		    this._progressWrite();
	    } catch(e) {
			this._reportException(e);
	    }
    },
    
	/////////////////////// Support Methods ///////////////////////	


	/** Unlocks the GpsControl object to be used at the given web address. <br/>
     * <br/>
     * Minimum Plugin version 2.0.0.4
     * 
     * @param {Array} pathKeyPairsArray baseURL and key pairs.  
     * @type Boolean 
     * @return True if the plug-in was unlocked successfully
     */
	unlock: function(pathKeyPairsArray) {
		this.pluginUnlocked = this.garminPlugin.unlock(pathKeyPairsArray);
		return this.pluginUnlocked;
	},


	/** True if plugin has been successfully created and unlocked.
	 * @type Boolean
	 */
	 isUnlocked: function() {
	 	return this.pluginUnlocked;
	 },
	 
    /** Responds to a message box on the device.
     * 
     * Minimum version 2.0.0.4
     * 
     * @param {Number} response should be an int which corresponds to a button value from this.garminPlugin.MessageBoxXml
     */
    // TODO: this method only works with writes - should it work with reads?
    respondToMessageBox: function(response) {
        this.garminPlugin.respondToMessageBox(response ? 1 : 2);
        this._progressWrite();
    },

	/** Called when device generates a message.
	 * This occurs when completionState == Garmin.DeviceControl.FINISH_STATES.messageWaiting.
	 * @private
     */	
	_messageWaiting: function() {
		var messageDoc = Garmin.XmlConverter.toDocument(this.garminPlugin.getMessageBoxXml());
		//var type = messageDoc.getElementsByTagName("Icon")[0].childNodes[0].nodeValue;
		var text = messageDoc.getElementsByTagName("Text")[0].childNodes[0].nodeValue;
		
		var message = new Garmin.MessageBox("Question",text);
		
		var buttonNodes = messageDoc.getElementsByTagName("Button");
		for(var i=0; i<buttonNodes.length; i++) {
			var caption = buttonNodes[i].getAttribute("Caption");
			var value = buttonNodes[i].getAttribute("Value");
			message.addButton(caption, value);
		}
		return message;
	},

	/** Get the status/progress of the current state or transfer
     * @type Garmin.TransferProgress
     */	
	getDeviceStatus: function() {
		var aProgressXml = this.garminPlugin.getProgressXml();
		var theProgressDoc = Garmin.XmlConverter.toDocument(aProgressXml);
		
		var title = "";
		if(theProgressDoc.getElementsByTagName("Title").length > 0) {
			title = theProgressDoc.getElementsByTagName("Title")[0].childNodes[0].nodeValue;
		}
		
		var progress = new Garmin.TransferProgress(title);

		var textNodes = theProgressDoc.getElementsByTagName("Text");
		for( var i=0; i < textNodes.length; i++ ) {
			if(textNodes[i].childNodes.length > 0) {
				var text = textNodes[i].childNodes[0].nodeValue;
				if(text != "") progress.addText(text);
			}
		}
		
		var percentageNode = theProgressDoc.getElementsByTagName("ProgressBar")[0];
		if(percentageNode != undefined) {
			if(percentageNode.getAttribute("Type") == "Percentage") {
				progress.setPercentage(percentageNode.getAttribute("Value"));
			} else if (percentageNode.getAttribute("Type") == "Indefinite") {
				progress.setPercentage(100);			
			}
		}

		return progress;
	},
		
	/**
	 * @private
	 */
	_isAMember: function(element, array) {
		return array.any( function(str){ return str==element; } );
	},
	
	/** Gets the version number for the plugin the user has currently installed.
     * @type Array 
     * @return An array of the format [versionMajor, versionMinor, buildMajor, buildMinor].
     * @see #getPluginVersionString
     */	
	getPluginVersion: function() {
		
    	return this.garminPlugin.getPluginVersion();
	},

	/** Gets a string of the version number for the plugin the user has currently installed.
     * @type String 
     * @return A string of the format "versionMajor.versionMinor.buildMajor.buildMinor", i.e. "2.0.0.4"
     * @see #getPluginVersion
     */	
	getPluginVersionString: function() {
		return this.garminPlugin.getPluginVersionString();
	},
	
	/** Sets the required version number for the plugin for the application.
	 * @param reqVersionArray {Array} The required version to set to.  In the format [versionMajor, versionMinor, buildMajor, buildMinor]
	 * 			i.e. [2,2,0,1]
	 */
	setPluginRequiredVersion: function(reqVersionArray) {
		if( reqVersionArray != null ) {
			this.garminPlugin.setPluginRequiredVersion(reqVersionArray);
		}
	},
	
	/** Sets the latest plugin version number.  This represents the latest version available for download at Garmin.
	 * We will attempt to keep the default value of this up to date with each API release, but this is not guaranteed,
	 * so set this to be safe or if you don't want to upgrade to the latest API.
	 * 
	 * @param reqVersionArray {Array} The latest version to set to.  In the format [versionMajor, versionMinor, buildMajor, buildMinor]
	 * 			i.e. [2,2,0,1]
	 */
	setPluginLatestVersion: function(reqVersionArray) {
		if( reqVersionArray != null ) {
			this.garminPlugin.setPluginLatestVersion(reqVersionArray);
		}
	},
	
	/** Determines if the plugin is initialized
     * @type Boolean
     */	
	isPluginInitialized: function() {
		return (this.garminPlugin != null);
	},

	/** Determines if the plugin is installed on the user's machine
     * @type Boolean
     */	
	isPluginInstalled: function() {
		return (this.garminPlugin.getVersionXml() != undefined);
	},

	/** Internal exception handling for asynchronous calls.
	 * @private
      */	
	_reportException: function(exception) {
//		this._broadcaster.dispatch("onException", {msg: exception, controller: this});
		this.listener.onException(exception);
	},
	
	/** Number of devices detected by plugin.
	 * @type Number
}    */	
	getDevicesCount: function() {
	    return this.numDevices;
	},
	
	/** Retrieve a device from the list of found devices by device number. 
	 * @return Garmin.Device
	 */
	_getDeviceByNumber: function(deviceNum) {
		for( var index = 0; index < this.devices.length; index++) {
			if( this.devices[index].getNumber() == deviceNum){
				return this.devices[index];
			}
		}		
	},
	
   /* Internal helper to properly append directory listings
    * @param {String} Raw Directory V1 XML
	* @private
	*/
	_appendDirXml: function(aXml)
	{
		if(!this.gpsDataString) {
			this.gpsDataString = aXml;
			this.gpsData = Garmin.XmlConverter.toDocument(this.gpsDataString);
		} else {
			//merge
			this.gpsData = Garmin.DirectoryUtils.merge(this.gpsDataString, aXml);
			this.gpsDataString = Garmin.XmlConverter.toString(this.gpsData);
		}
	},
	
	/** String representation of instance.
	 * @type String
     */	
	toString: function() {
	    return "Garmin Javascript GPS Controller managing " + this.numDevices + " device(s)";
	}
};


/** Constants defining possible errors messages for various errors on the page
 */
Garmin.DeviceControl.MESSAGES = {
	deviceControlMissing: "Garmin.DeviceControl depends on the Garmin.DevicePlugin framework.",
	missingPluginTag: "Plug-In HTML tag not found.",
	browserNotSupported: "Your browser is not supported by the Garmin Communicator Plug-In.",
	pluginNotInstalled: "Garmin Communicator Plugin NOT detected.",
	outOfDatePlugin1: "Your version of the Garmin Communicator Plug-In is out of date.<br/>Required: ",
	outOfDatePlugin2: "Current: ",
	updatePlugin1: "Your version of the Garmin Communicator Plug-In is not the latest version. Latest version: ",
	updatePlugin2: ", current: ",
	pluginNotUnlocked: "Garmin Plugin has not been unlocked",
	noDevicesConnected: "No device connected, can't communicate with device.",
	invalidFileType: "Cannot process the device file type: ",
	incompleteRead: "Incomplete read, cannot get compressed format.",
	unsupportedReadDataType: "Your device does not support reading of the type: ",
	unsupportedWriteDataType: "Your device does not support writing of the type: "
};

/** Constants defining possible states when you poll the finishActions
 */
Garmin.DeviceControl.FINISH_STATES = {
	idle: 0,
	working: 1,
	messageWaiting: 2,
	finished: 3	
};

/** Constants defining possible file types associated with read and write methods.  File types can
 * be accessed in a static way, like so:<br/>
 * <br/>
 * Garmin.DeviceControl.FILE_TYPES.gpx<br/>
 * <br/>
 * NOTE: 'gpi' is being deprecated--please use 'binary' instead for gpi and other binary data. 
 */
Garmin.DeviceControl.FILE_TYPES = {
	gpx:               "GPSData",
	tcx:               "FitnessHistory",
	gpi:               "gpi", //deprecated, use binary instead
	crs:               "FitnessCourses",
	wkt:               "FitnessWorkouts",
	goals:             "FitnessActivityGoals",
	tcxProfile:        "FitnessUserProfile",
	binary:            "BinaryData", // Not in Device XML, so writing this type is "supported" for all devices. For FIT data, use fitFile.
	voices:            "Voices",
	nlf:               "FitnessNewLeaf",
	fit:               "FITBinary",
	fitCourse:         "FIT_TYPE_6",
	fitSettings:       "FIT_TYPE_2",
	fitSport:          "FIT_TYPE_3",
	fitHealthData:	   "FIT_TYPE_9",
	
	// The following types are internal types used by the API only and cannot be found in the Device XML.
	// NOTE: When adding or removing types to this internal list, modify checkDeviceReadSupport() accordingly.
	readableDir:       "ReadableFilesDirectory",
	tcxDir: 		   "FitnessHistoryDirectory",
	crsDir: 		   "FitnessCoursesDirectory",
	gpxDir: 		   "GPSDataDirectory",
	tcxDetail:         "FitnessHistoryDetail",
	crsDetail: 		   "FitnessCoursesDetail",
	gpxDetail:         "GPSDataDetail",
	deviceXml: 	       "DeviceXml",
	fitDir:     	   "FitDirectory",
	fitFile:    	   "FitFile",
	firmware:          "Firmware"
};

/** Constants defining the strings used by the Device.xml to indicate 
 * transfer direction of each file type
 */
Garmin.DeviceControl.TRANSFER_DIRECTIONS = {
	read:              "OutputFromUnit",
	write:             "InputToUnit",
	both:              "InputOutput"
};

/** Encapsulates the data provided by the device for the current process' progress.
 * Use this to relay progress information to the user.
 * @class Garmin.TransferProgress
 * @constructor 
 */
Garmin.TransferProgress = function(title) {
	this.title = title;
	this.text = new Array();
	this.percentage = null;
	
}
Garmin.TransferProgress.prototype = {
	addText: function(textString) {
		this.text.push(textString);
	},

    /** Get all the text entries for the transfer
     * @type Array
     */	 
	getText: function() {
		return this.text;
	},

    /** Get the title for the transfer
     * @type String
     */	 
	getTitle: function() {
		return this.title;
	},
	
	setPercentage: function(percentage) {
		this.percentage = percentage;
	},

    /** Get the completed percentage value for the transfer
     * @type Number
     */
	getPercentage: function() {
		return this.percentage;
	},

    /** String representation of instance.
     * @type String
     */	 	
	toString: function() {
		var progressString = "";
		if(this.getTitle() != null) {
			progressString += this.getTitle();
		}
		if(this.getPercentage() != null) {
			progressString += ": " + this.getPercentage() + "%";
		}
		return progressString;
	}
};


/** Encapsulates the data to display a message box to the user when the plug-in is waiting for feedback
 * @class Garmin.MessageBox
 * @constructor 
 */
Garmin.MessageBox = function(type, text) {
	this.type = type;
	this.text = text;
	this.buttons = new Array();	
}
Garmin.MessageBox.prototype = {
    /** Get the type of the message box
     * @type String
     */	 
	getType: function() {
		return this.type;
	},

    /** Get the text entry for the message box
     * @type String
     */	 
	getText: function() {
		return this.text;
	},

    /** Get the text entry for the message box
     */	 
	addButton: function(caption, value) {
		this.buttons.push({caption: caption, value: value});
	},

    /** Get the buttons for the message box
     * @type Array
     */	 
	getButtons: function() {
		return this.buttons;
	},
	
	getButtonValue: function(caption) {
		for(var i=0; i< this.buttons.length; i++) {
			if(this.buttons[i].caption == caption) {
				return this.buttons[i].value;
			}
		}
		return null;
	},

    /**
	 * @type String
     */	 
	toString: function() {
		return this.getText();
	}
};

__garminJSLoaded = true;
__garminPluginCreated = false;

