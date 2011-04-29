package org.sarsoft.ops.service.location;

import java.io.File;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.Map;
import java.util.Set;

import org.sarsoft.common.model.Waypoint;

import edu.emory.mathcs.backport.java.util.Collections;

public class APRSLocalEngine extends APRSEngine {

	private static Map<String, APRSConsoleThread> threads = new HashMap<String, APRSConsoleThread>();
	private Set<String> messages = new HashSet<String>();

	public void doRun() {

		statusMessage = null;

		synchronized(threads) {
			File dir=new File("/dev");
			for(String filename : dir.list()) {
				if(filename.startsWith("cu.usb")) {
					String device = "/dev/" + filename;
					APRSConsoleThread thread = threads.get(device);
					if(thread != null && !thread.isAlive()) {
						threads.remove(device);
						thread = null;
					}
					if(thread == null) {
						thread = new APRSConsoleThread();
						thread.setDevice(device);
						threads.put(device, thread);
						thread.start();
					}
				}
			}
			
			if(threads.size() == 0) {
				statusMessage = "No Ports Found";
				return;
			}
		
			for(APRSConsoleThread thread : threads.values()) {
				thread.addListener(messages);
			}
		}
		
		while(enabled && !timedout()) {
			if(messages.size() > 0) try {
				beginTransaction();
				synchronized(messages) {
					Iterator<String> it = messages.iterator();
					while(it.hasNext()) {
						String message = it.next();
						it.remove();
						updateResource(message);
					}
				}
			} finally {
				closeTransaction();
			}
			try {
				sleep(5000);					
			} catch (InterruptedException e) {
			}
		}

		for(APRSConsoleThread thread : threads.values()) {
			thread.removeListener(messages);
		}
	}
	
	public String getStatusMessage() {
		if(statusMessage != null) return statusMessage;
		String message = "";
		for(APRSConsoleThread thread : threads.values()) {
			message += thread.getDevice() + ": " + thread.getStatusMessage() + "\n";
		}
		return message;
	}
	
}
