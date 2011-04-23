package org.sarsoft.ops.controller;

import java.util.HashMap;
import java.util.Map;

import org.sarsoft.ops.service.location.LocationEngine;

public class LocationEngineMonitor extends Thread {

	private static Map<String, LocationEngine> locationEngines;
	private static Map<String, Long> times = new HashMap<String, Long>();

	public void setEngineMap(Map<String, LocationEngine> m) {
		locationEngines = m;
	}

	public void run() {
		while(true) {
			try {
				if(locationEngines != null) {
					for(String name : locationEngines.keySet()) {
						if(!times.containsKey(name)) times.put(name, System.currentTimeMillis());
						if(System.currentTimeMillis() - times.get(name) > 28800000) {
							LocationEngine e = locationEngines.get(name);
							e.quit();
							locationEngines.remove(name);
						}
					}
				}
				sleep(600000);
			} catch (InterruptedException e) {
			}
		}
	}

}
