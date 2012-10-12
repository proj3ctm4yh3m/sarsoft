package org.sarsoft.ops.service.location;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStreamReader;
import java.util.Date;
import java.util.HashSet;
import java.util.Set;

import org.apache.log4j.Logger;

public class APRSConsoleThread extends Thread {

	private String device;
	private boolean connected = false;
	private boolean enabled = true;
	private FileInputStream fis;
	private FileOutputStream fos;
	private BufferedReader in;
	private String statusMessage;
	private Set<Set<String>> listeners = new HashSet<Set<String>>();
	
	public void setDevice(String device) {
		this.device = device;
	}
	
	public String getDevice() {
		return device;
	}
	
	public boolean isConnected() {
		return connected;
	}
	
	public void addListener(Set<String> set) {
		synchronized(listeners) {
			listeners.add(set);
		}
	}
	
	public void removeListener(Set<String> set) {
		synchronized(listeners) {
			listeners.remove(set);
		}
	}
	
	public void run() {
		Logger logger = Logger.getLogger(APRSConsoleThread.class);
		String str = null;
		try {
			statusMessage = "Establishing connection on " + device;
			logger.info("Connecting to APRS device " + device);
			File file = new File(device);
			fis = new FileInputStream(file);
			in = new BufferedReader(new InputStreamReader(fis));
			try {
				fos = new FileOutputStream(file);
				fos.write("\r\n\r\n\r\n\r\n".getBytes());
				str = in.readLine();
				statusMessage = "Connected.  No data received yet.";
			} catch (Exception e) {
				logger.warn("APRS device " + device + " is read-only.  If it requires waking, sarsoft may be waiting indefinitely.");
				statusMessage = "Read only.  Waiting indefinitely for first transmission.";
			}

			str = in.readLine();
			
			connected = true;
			while(enabled && str != null) {
				if(str.length() > 0) {
					synchronized(listeners) {
						for(Set<String> listener : listeners) {
							synchronized(listener) {
								listener.add(str);
							}
						}
					}
					statusMessage = "Connected.  Last received \n\n" + str + "\n\nat " + new Date();
				}
				str = in.readLine();
				logger.debug("APRS data from " + device + ": " + str);
			}
			
			fis.close();
			if(fos != null) fos.close();
		} catch (Exception e) {
			logger.error("Exception on APRS device " + device, e);
		}
		statusMessage = "Connection Lost";
		logger.info("Disconnected from APRS device " + device);
	}
	
	public void quit() {
		enabled = false;
		if(in != null) try { in.close(); } catch (Exception e) {}
		if(fis != null) try { fis.close(); } catch (Exception e) {}
		if(fos != null) try { fos.close(); } catch (Exception e) {}
	}
	
	public String getStatusMessage() {
		return statusMessage;
	}
	
}
