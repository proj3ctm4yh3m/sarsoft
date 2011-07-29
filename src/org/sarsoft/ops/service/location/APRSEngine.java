package org.sarsoft.ops.service.location;

import java.io.IOException;
import java.io.OutputStream;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import net.sf.ezmorph.bean.MorphDynaBean;
import net.sf.json.JSONObject;
import net.sf.json.JSONSerializer;

import org.apache.log4j.Logger;
import org.sarsoft.common.model.Way;
import org.sarsoft.common.model.WayType;
import org.sarsoft.common.model.Waypoint;
import org.sarsoft.ops.model.Resource;
import org.sarsoft.plans.model.SearchAssignment;

import com.google.api.client.googleapis.GoogleTransport;
import com.google.api.client.googleapis.json.JsonCParser;
import com.google.api.client.http.HttpRequest;
import com.google.api.client.http.HttpTransport;

public abstract class APRSEngine extends AsyncTransactionalEngine {
	
	protected String user = null;
	protected String aprsFiKey = null;
	protected Map<String, Waypoint> callsigns = new HashMap<String, Waypoint>();
	private Logger logger = Logger.getLogger(APRSEngine.class);
		
	public void setUser(String user) {
		this.user = user;
	}
	
	public void setAprsFiKey(String key) {
		aprsFiKey = key;
	}

	public Map<String, Waypoint> getCallsigns() {
		return Collections.unmodifiableMap(callsigns);
	}
	
	public void clearCallsigns() {
		callsigns.clear();
	}
	
	protected void writeLine(OutputStream out, String str) throws IOException {
		str = str + "\r\n";
		out.write(str.getBytes());
	}
		
	protected static Waypoint parseCompressed(String data) {
		String lat91 = data.substring(1,5);
		String lng91 = data.substring(5,9);
		
		double lat = 0;
		double lng = 0;
		
		for(int i = 0; i < 4; i++) {
			lat = lat+(lat91.charAt(i)-33)*Math.pow(91, 3-i);
			lng = lng+(lng91.charAt(i)-33)*Math.pow(91, 3-i);			
		}
		
		lat = 90-lat/380926;
		lng = lng/190463-180;
				
		return new Waypoint(lat, lng);
	}
	
	private static int micELat(char c) {
		if(c >= 48 && c <= 57) return c - 48;
		if(c >= 65 && c <= 74) return c - 65;
		if(c >= 80 && c <= 89) return c - 80;
		return 0;
	}
	
	protected static Waypoint parseMicE(String dest, String data) {
		int latD = micELat(dest.charAt(0))*10 + micELat(dest.charAt(1));
		int latM = micELat(dest.charAt(2))*10 + micELat(dest.charAt(3));
		int latH = micELat(dest.charAt(4))*10 + micELat(dest.charAt(5));
		double lat = latD + ((double)latM)/60 + ((double) latH)/6000;
		if(dest.charAt(3) < 'P') lat = lat*-1;
		
		int lngOffset = 0;
		if(dest.charAt(4) >= 'P') lngOffset = 100;
		
		boolean east = true;
		if(dest.charAt(5) >= 'P') east = false;
		
		int lngD = data.charAt(1)-28+lngOffset;
		if(lngD >= 180 && lngD <= 189) lngD = lngD - 80;
		if(lngD >= 190 && lngD <=199) lngD = lngD - 190;
		
		int lngM = data.charAt(2)-28;
		if(lngM >= 60) lngM = lngM - 60;
		
		int lngH = data.charAt(3)-28;
		
		double lng = lngD + ((double)lngM)/60 + ((double) lngH)/6000;
		if(!east) lng = lng*-1;
		
		return new Waypoint(lat, lng);
	}
	
	protected Waypoint positToWpt(String posit) {
		try {
			if(posit.charAt(0) < '0' || posit.charAt(0) > '9') return parseCompressed(posit);
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
		} catch (IndexOutOfBoundsException e) {
			// IndexOutOfBoundsException is normal behavior for non-posit threads
			return null;
		}
	}
	
	protected Waypoint gpwplToWpt(String gpwpl) {
		String[] parts = gpwpl.split(",");

		String latD = parts[1].substring(0, 2);
		String latM = parts[1].substring(2,4);
		String lath = parts[1].substring(5, 7);
		char latHemisphere = parts[2].charAt(0);
		String lngD = parts[3].substring(0,3);
		String lngM = parts[3].substring(3, 5);
		String lngh = parts[3].substring(6, 8);
		char lngHemisphere = parts[4].charAt(0);
		
		double lat = Double.parseDouble(latD) + (Double.parseDouble(latM)/60) + (Double.parseDouble(lath)/6000);
		if(latHemisphere == 'S' || latHemisphere == 's') lat = lat*-1;
		double lng = Double.parseDouble(lngD) + (Double.parseDouble(lngM)/60) + (Double.parseDouble(lngh)/6000);
		if(lngHemisphere == 'W' || lngHemisphere == 'w') lng = lng*-1;
		return new Waypoint(lat, lng);
	}

	protected void updateResource(String str) {
		String from = null;
		Waypoint wpt = null;
		if(str.startsWith("#") || str.length() < 10) return;
		if(str.startsWith("$GPWPL")) {
			String[] parts = str.split(",");
			from = parts[5];
			if(from.indexOf('*') > 0) from = from.substring(0, from.indexOf('*'));
			wpt = gpwplToWpt(str);
		} else if(!str.startsWith("$")){
			int s1 = str.indexOf('>');
			int s2 = str.indexOf(':');
			if(s1 == -1 || s1 > 10) return;
			from = str.substring(0, s1);
			String to = str.substring(s1 + 1, s2);
			String message= str.substring(s2 + 1);
			char c = message.charAt(0);
			if(c == '!' || c == '=') {	// no timestamp
				wpt = positToWpt(message.substring(1));
			} else if(c == '/' || c == '@') {	// has timestamp
				wpt = positToWpt(message.substring(8));
			} else if(c == '`' || c == '\'') {  // MicE encoded
				wpt = parseMicE(to.substring(0, 6), message);
			}
		}
		if(wpt != null) {
			logger.debug("Sniffed APRS position (" + wpt.getLat() + ", " + wpt.getLng() + ") from " + from);
			wpt.setTime(new Date());
			try {
				beginTransaction();
				Resource resource = (Resource) dao.getByAttr(Resource.class, "callsign", from);
				if(resource != null) {
					logger.debug("Updating resource " + resource.getName() + "/" + resource.getAgency() + " based on APRS callsign " + from);
					Waypoint oldPosition = resource.getPosition();
					resource.setPosition(wpt);
					dao.save(resource);
					if(resource.getAssignment() != null) {
						SearchAssignment assignment = resource.getAssignment();
						boolean updated = false;
						for(Way way : assignment.getWays()) {
							if(way != null && from.equalsIgnoreCase(way.getName())) {
								way.getWaypoints().add(wpt.clone());
								dao.save(way);
								dao.save(assignment);
								updated = true;
							}
						}
						if(!updated && oldPosition != null) {
							Way way = new Way();
							way.setType(WayType.TRACK);
							way.setName(from);
							way.setPolygon(false);
							ArrayList<Waypoint> waypoints = new ArrayList<Waypoint>();
							waypoints.add(wpt.clone());
							waypoints.add(oldPosition.clone());
							way.setWaypoints(waypoints);
							assignment.getWays().add(way);
							dao.save(assignment);
						}
					}
				} else {
					logger.debug("No resource found for " + from + "; adding to callsign list");
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
			HttpRequest request = transport.buildGetRequest();
			request.setUrl("http://api.aprs.fi/api/get?what=loc&apikey=" + aprsFiKey + "&format=json&name=" + resource.getCallsign());
			Waypoint fresh = null;
			String json;
			try {
				json = request.execute().parseAsString();
			} catch (IOException e) {
				logger.error("IOException checking aprs.fi for " + resource.getCallsign(), e);
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

}
