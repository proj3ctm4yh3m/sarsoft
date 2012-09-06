package org.sarsoft.ops.service.location;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.Socket;
import java.util.List;

import org.apache.log4j.Logger;
import org.sarsoft.common.model.Waypoint;
import org.sarsoft.plans.Constants;
import org.sarsoft.common.util.RuntimeProperties;
import org.sarsoft.ops.model.Resource;
import org.sarsoft.plans.model.Search;

public class APRSTier2Engine extends APRSEngine {
	
	private String t2server = "noam.aprs2.net";
	private int t2port = 14580;
	private BufferedReader in;
	private OutputStream out;
	private Logger logger = Logger.getLogger(APRSTier2Engine.class);
	
	public void setServer(String server) {
		t2server = server;
	}
	
	public void setPort(int port) {
		t2port = port;
	}
	
	public void setUser(String user) {
		this.user = user;
	}
	
	protected String constructFilter(boolean createTransaction) {
		String filter = "#filter";
		try {
			if(createTransaction) beginTransaction();
			Search search = dao.getByAttr(Search.class, "name", RuntimeProperties.getTenant());
			Waypoint wpt = search.getPls();
			if(search.getCP() != null) wpt = search.getCP();
			if(search.getLkp() != null) wpt = search.getLkp();
			if(wpt != null) {
				String lat = Double.toString(wpt.getLat());
				if(lat.length() > 10) lat = lat.substring(0, 10);
				String lng = Double.toString(wpt.getLng());
				if(lng.length() > 10) lng = lng.substring(0, 10);
				filter += " r/" + lat + "/" + lng + "/20";
			}
			
			boolean b = false;
			List<Resource> resources = dao.loadAll(Resource.class);
			for(Resource resource : resources) {
				if(resource.getAssignment() != null  && resource.getCallsign() != null  && resource.getCallsign().length() > 0) {
					if(!b) {
						filter += " b";
						b = true;
					}
					if(filter.length() + resource.getCallsign().length() + 4 < 512) filter +="/" + resource.getCallsign();
				}
			}
			for(Resource resource : resources) {
				if(resource.getAssignment() == null  && resource.getCallsign() != null  && resource.getCallsign().length() > 0) {
					if(!b) {
						filter += " b";
						b = true;
					}
					if(filter.length() + resource.getCallsign().length() + 4 < 512) filter +="/" + resource.getCallsign();
				}
			}
		} finally {
			if(createTransaction) closeTransaction();
		}
		
		logger.debug("Filter for " + RuntimeProperties.getTenant() + " on " + t2server + ":" + t2port + " is " + filter);
		return filter + "\r\n";
	}
	
	public void updateFilter() {
		updateFilter(false);
	}
	
	protected void updateFilter(boolean createTransaction) {
		String filter = constructFilter(createTransaction);
		try {
		writeLine(out, filter);
		} catch (IOException e) {
			statusMessage = "IOException setting filter.  Parameters " + t2server + ":" + t2port + " " + filter;
			logger.error(statusMessage, e);
			return;
		} catch (NullPointerException e) {
			statusMessage = "NullPointerException setting filter for " + t2server + ":" + t2port + ".  Possible connection error?";
			logger.error(statusMessage, e);
			return;
		}
		statusMessage = "Listening on " + t2server + ":" + t2port + " for " + filter;
	}
	
	public void doRun() {
		try {
			logger.info("Connecting to APRS Tier 2 server " + t2server + ":" + t2port + " for search " + RuntimeProperties.getTenant());
			Socket socket = new Socket(t2server, t2port);
			
			in = new BufferedReader(new InputStreamReader(socket.getInputStream()));
			out = socket.getOutputStream();

			String str = in.readLine();	

			String login = "user " + user + " pass -1 vers Sarsoft beta\r\n";

			writeLine(out, login);
			String message = in.readLine();
			if(!message.contains(user)) {
				statusMessage = "Invalid login response: " + message;
				socket.close();
				sleep(60000);
				return;
			}

			updateFilter(true);
			long lastFilterUpdate = System.currentTimeMillis();

			while(enabled && !timedout() && str != null) {
				str = in.readLine();
				logger.debug("APRS data from " + t2server + ":" + t2port + " " + str);
				updateResource(str);
				if(System.currentTimeMillis() - lastFilterUpdate > 180000) {
					updateFilter(true);
					lastFilterUpdate = System.currentTimeMillis();
				}
			}
						
			socket.close();
			
			if(enabled && !timedout()) {
				logger.info("Lost connection to " + t2server + ":" + t2port);
				statusMessage = t2server + ":" + t2port + " Connection Lost";
			} else if(timedout()){
				logger.info("Idling APRS Tier 2 connection for search " + RuntimeProperties.getTenant() + " due to inactivity");
			} else {
				logger.info("APRS Tier 2 connection for search " + RuntimeProperties.getTenant() + " stopped by user");
			}
			
		} catch (Exception e) {
			logger.error("General error talking to APRS Tier 2 server " + t2server + ":" + t2port, e);
			statusMessage = e.getMessage();
		}
		
	}

}
