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

public class APRSTier2Engine extends AsyncTransactionalEngine {
	
	private String t2server = "oregon.aprs2.net";
	private int t2port = 14580;
	private String user = "KJ6LZA";
	private static String aprsFiKey = "17392.5iMw1tOX90mZj747";
	private Map<String, Waypoint> callsigns = new HashMap<String, Waypoint>();

	public Map<String, Waypoint> getCallsigns() {
		return Collections.unmodifiableMap(callsigns);
	}
	
	protected void writeLine(OutputStream out, String str) throws IOException {
		str = str + "\r\n";
		out.write(str.getBytes());
	}
	
	private Waypoint positToWpt(String posit) {
		try {
			String latD = posit.substring(0, 2);
			String latM = posit.substring(2, 4);
			String lath = posit.substring(5, 7);
			char latHemisphere = posit.charAt(7);
			String lngD = posit.substring(9,12);
			String lngM = posit.substring(12, 14);
			String lngh = posit.substring(15, 17);
			char lngHemisphere = posit.charAt(17);
			
			double lat = Double.parseDouble(latD) + (Double.parseDouble(latM)/60) + (Double.parseDouble(lath)/6000);
			if(latHemisphere == 'S' || latHemisphere == 's') lat = lat*-1;
			double lng = Double.parseDouble(lngD) + (Double.parseDouble(lngM)/60) + (Double.parseDouble(lngh)/6000);
			if(lngHemisphere == 'W' || lngHemisphere == 'w') lng = lng*-1;
			return new Waypoint(lat, lng);
		} catch (Exception e) {
			return null;
		}
	}
	
	protected String constructFilter() {
		String filter = "#filter";
		try {
			beginTransaction();
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
			closeTransaction();
		}
		
		return filter + "\r\n";
	}
	
	protected void parse(String str) {
		if(str.startsWith("#")) return;
		int s1 = str.indexOf('>');
		int s2 = str.indexOf(':');
		String from = str.substring(0, s1);
		String to = str.substring(s1 + 1, s2);
		String message= str.substring(s2 + 1);
		Waypoint wpt = null;
		char c = message.charAt(0);
		if(c == '!' || c == '=') {
			wpt = positToWpt(message.substring(1));
		} else if(c == '/' || c == '@'){
			wpt = positToWpt(message.substring(8));
		}
		if(wpt != null) {
			wpt.setTime(new Date());
			try {
				beginTransaction();
				Resource resource = (Resource) dao.getByAttr(Resource.class, "callsign", from);
				if(resource != null) {
					resource.setPosition(wpt);
					dao.save(resource);
				} else {
					callsigns.put(from, wpt);
				}
			} finally {
				closeTransaction();
			}
		}
	}
	
	public void checkAprsFi(Resource resource) {
		HttpTransport transport = GoogleTransport.create();
		transport.addParser(new JsonCParser());
		if(resource.getCallsign() != null && resource.getCallsign().length() > 0) {
			System.out.println("APRSFi request for " + resource.getCallsign());
			HttpRequest request = transport.buildGetRequest();
			request.setUrl("http://api.aprs.fi/api/get?what=loc&apikey=" + aprsFiKey + "&format=json&name=" + resource.getCallsign());
			Waypoint fresh = null;
			String json;
			try {
				json = request.execute().parseAsString();
			} catch (IOException e) {
				e.printStackTrace();
				return;
			}

			MorphDynaBean bean = (MorphDynaBean) JSONObject.toBean((JSONObject) JSONSerializer.toJSON(json));
			List entries = (List) bean.get("entries");
			if(entries.size() > 0) {
				bean = (MorphDynaBean) entries.get(0);
		
				fresh = new Waypoint();
				fresh.setLat(Double.parseDouble((String) bean.get("lat")));
				fresh.setLng(Double.parseDouble((String) bean.get("lng")));
				fresh.setTime(new Date(Long.parseLong((String) bean.get("lasttime"))*1000));
			} 
			Waypoint stale = resource.getPosition();
			if(fresh != null && (stale == null || stale.getTime() == null || fresh.getTime().after(stale.getTime()))) {
				resource.setPosition(fresh);
				dao.save(resource);
			}
		}
	}

	public void doRun() {
		try {
			beginTransaction();
			@SuppressWarnings("unchecked")
			List<Resource> resources = (List<Resource>) dao.loadAll(Resource.class);
			for(Resource resource : resources) {
				checkAprsFi(resource);
			}
		} finally {
			closeTransaction();
		}

		try {
			Socket socket = new Socket(t2server, t2port);
			
			BufferedReader in = new BufferedReader(new InputStreamReader(socket.getInputStream()));
			OutputStream out = socket.getOutputStream();

			System.out.println("Socket Connect is " + socket.isConnected());
			String str = in.readLine();
			System.out.println(str);
			
			String login = "user " + user + " pass -1 vers testsoftware 1.0\r\n";
			String filter = constructFilter();

			System.out.print(login);
			writeLine(out, login);
			System.out.println(in.readLine());
			System.out.print(filter);
			writeLine(out, filter);

			long start = System.currentTimeMillis();

			while(enabled && System.currentTimeMillis() - start < 28800000 && str != null) {
				parse(str);
				str = in.readLine();
			}
						
			System.out.println("\n\n++Disconnected on " + str);
			socket.close();
			
		} catch (Exception e) {
			e.printStackTrace();
		}
		
	}

}
