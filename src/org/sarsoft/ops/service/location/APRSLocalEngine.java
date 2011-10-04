package org.sarsoft.ops.service.location;

import java.io.File;
import java.io.FileInputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.apache.log4j.Logger;
import org.sarsoft.common.util.RuntimeProperties;

public class APRSLocalEngine extends APRSEngine {

	private static Map<String, APRSConsoleThread> threads = new HashMap<String, APRSConsoleThread>();
	private Set<String> messages = new HashSet<String>();
	private String deviceNames = "COM1:,COM2:,COM3:,COM4:,COM5:,COM6:,COM7:,COM8:,COM9:,COM10:,COM11:,COM12:";
	private String deviceNamePrefixes ="/dev/cu.usb,/dev/ttyACM";

	public void doRun() {
		Logger logger = Logger.getLogger(APRSLocalEngine.class);
		logger.info("Now monitoring local APRS devices for search " + RuntimeProperties.getSearch());
		statusMessage = null;

		// build list of all possible linux and windows device locations
		List<String> devices = new ArrayList<String>();
		if(deviceNames != null) for(String name : deviceNames.split(",")) {
			// Windows com ports don't .exists()
			try {
				FileInputStream fis = new FileInputStream(new File(name));
				logger.debug("specified device device " + name + " exists");
				devices.add(name);
				fis.close();
			} catch (Exception e){
				logger.debug("specified device device " + name + " not found");
			}
		}
		if(deviceNamePrefixes != null) for(String prefix : deviceNamePrefixes.split(",")) {
			if(prefix != null && prefix.length() > 0 && prefix.contains("/")) {
				String dirname = prefix.substring(0, prefix.lastIndexOf('/'));
				String fileprefix = prefix.substring(prefix.lastIndexOf('/') + 1);
				File dir = new File(dirname);
				if(dir.exists()) for(String filename : dir.list()) {
					if(filename.startsWith(fileprefix)) {
						logger.debug("device found at " + dirname + "/" + filename + " based on prefix " + prefix);
						devices.add(dirname + "/" + filename);
					}
				}
			}
		}
		
		synchronized(threads) {
			for(String device : devices) {
				APRSConsoleThread thread = threads.get(device);
				if(thread != null && !thread.isAlive()) {
					logger.info("APRS device " + device + " no longer active; removing from pool");
					threads.remove(device);
					thread = null;
				}
				if(thread == null) {
					logger.info("Adding APRS device " + device + " to pool");
					thread = new APRSConsoleThread();
					thread.setDevice(device);
					threads.put(device, thread);
					thread.start();
				}
			}
			
			if(threads.size() == 0) {
				logger.info("Unable to find any physically connected APRS devices");
				statusMessage = "No Ports Found";
				try {
					sleep(60000);
				} catch (InterruptedException e) {}
				return;
			}
		
			for(APRSConsoleThread thread : threads.values()) {
				logger.debug(RuntimeProperties.getSearch() + " listening to APRS traffic on " + thread.getDevice());
				thread.addListener(messages);
			}
		}
		
		while(enabled && !timedout()) {
			if(messages.size() > 0) try {
				synchronized(messages) {
					Iterator<String> it = messages.iterator();
					while(it.hasNext()) {
						String message = it.next();
						it.remove();
						updateResource(message);
					}
				}
			} catch (Exception e) {
				logger.error("Error processing APRS message", e);
			}
			try {
				sleep(5000);					
			} catch (InterruptedException e) {
			}
		}

		for(APRSConsoleThread thread : threads.values()) {
			logger.debug(RuntimeProperties.getSearch() + " no longer listening to APRS traffic on " + thread.getDevice());
			thread.removeListener(messages);
		}
	}
	
	public void setDeviceNames(String deviceNames) {
		this.deviceNames = deviceNames;
	}
	
	public void setDeviceNamePrefixes(String deviceNamePrefixes) {
		this.deviceNamePrefixes = deviceNamePrefixes;
	}
	
	public String getStatusMessage() {
		if(statusMessage != null) return statusMessage;
		String message = "";
		for(APRSConsoleThread thread : threads.values()) {
			message += thread.getDevice() + ": " + thread.getStatusMessage() + "\n\n";
		}
		return message;
	}
	
}
