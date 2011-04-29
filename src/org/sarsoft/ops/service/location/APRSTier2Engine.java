package org.sarsoft.ops.service.location;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.Socket;
import java.util.Collections;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import net.sf.ezmorph.bean.MorphDynaBean;
import net.sf.json.JSONObject;
import net.sf.json.JSONSerializer;

import org.sarsoft.common.model.Waypoint;
import org.sarsoft.common.util.RuntimeProperties;
import org.sarsoft.ops.model.Resource;
import org.sarsoft.plans.model.Search;

import com.google.api.client.googleapis.GoogleTransport;
import com.google.api.client.googleapis.json.JsonCParser;
import com.google.api.client.http.HttpRequest;
import com.google.api.client.http.HttpTransport;

public class APRSTier2Engine extends APRSEngine {
	
	private String t2server = "noam.aprs2.net";
	private int t2port = 14580;
	private BufferedReader in;
	private OutputStream out;
	
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
			Search search = (Search) dao.getByAttr(Search.class, "name", RuntimeProperties.getSearch());
			if(search.getLkp() != null) {
				String lat = Double.toString(search.getLkp().getLat());
				if(lat.length() > 10) lat = lat.substring(0, 10);
				String lng = Double.toString(search.getLkp().getLng());
				if(lng.length() > 10) lng = lng.substring(0, 10);
				filter += " r/" + lat + "/" + lng + "/30";
			}
			
			boolean b = false;
			@SuppressWarnings("unchecked")
			List<Resource> resources = (List<Resource>) dao.loadAll(Resource.class);
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
			return;
		}
		statusMessage = "Listening on " + t2server + ":" + t2port + " for " + filter;
	}
	
	public void doRun() {
		try {
			Socket socket = new Socket(t2server, t2port);
			
			in = new BufferedReader(new InputStreamReader(socket.getInputStream()));
			out = socket.getOutputStream();

			String str = in.readLine();	

			String login = "user " + user + " pass -1 vers testsoftware 1.0\r\n";

			writeLine(out, login);
			String message = in.readLine();
			if(!message.contains(user)) {
				statusMessage = "Invalid login response: " + message;
				socket.close();
				return;
			}

			updateFilter(true);
			long lastFilterUpdate = System.currentTimeMillis();

			while(enabled && !timedout() && str != null) {
				str = in.readLine();
				updateResource(str);
				if(System.currentTimeMillis() - lastFilterUpdate > 180000) {
					updateFilter(true);
					lastFilterUpdate = System.currentTimeMillis();
				}
			}
						
			socket.close();
			
			if(enabled && !timedout()) {
				statusMessage = t2server + ":" + t2port + " Connection Lost";
			}
			
		} catch (Exception e) {
			e.printStackTrace();
			statusMessage = e.getMessage();
		}
		
	}

}
