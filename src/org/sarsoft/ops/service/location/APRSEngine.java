package org.sarsoft.ops.service.location;

import java.io.IOException;
import java.io.OutputStream;
import java.util.Collections;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import net.sf.ezmorph.bean.MorphDynaBean;
import net.sf.json.JSONObject;
import net.sf.json.JSONSerializer;

import org.sarsoft.common.model.Waypoint;
import org.sarsoft.ops.model.Resource;

import com.google.api.client.googleapis.GoogleTransport;
import com.google.api.client.googleapis.json.JsonCParser;
import com.google.api.client.http.HttpRequest;
import com.google.api.client.http.HttpTransport;

public abstract class APRSEngine extends AsyncTransactionalEngine {
	
	protected String user = null;
	protected String aprsFiKey = null;
	protected Map<String, Waypoint> callsigns = new HashMap<String, Waypoint>();
		
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
	
	protected Waypoint positToWpt(String posit) {
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

	protected void updateResource(String str) {
		if(str.startsWith("#") || str.length() < 10) return;
		int s1 = str.indexOf('>');
		int s2 = str.indexOf(':');
		if(s1 == -1 || s1 > 10) return;
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

}
