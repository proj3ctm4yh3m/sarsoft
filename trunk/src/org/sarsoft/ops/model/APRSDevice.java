package org.sarsoft.ops.model;

import java.io.IOException;
import java.util.Date;
import java.util.List;

import javax.persistence.Entity;
import javax.persistence.Transient;

import net.sf.ezmorph.bean.MorphDynaBean;
import net.sf.json.JSONObject;
import net.sf.json.JSONSerializer;

import org.sarsoft.common.model.Waypoint;

import com.google.api.client.googleapis.GoogleTransport;
import com.google.api.client.googleapis.json.JsonCParser;
import com.google.api.client.http.HttpRequest;
import com.google.api.client.http.HttpTransport;

public class APRSDevice {

	private static String apikey = "17392.5iMw1tOX90mZj747";
	public static HttpTransport transport = GoogleTransport.create();
	static {
		transport.addParser(new JsonCParser());
	}

	public static Waypoint checkLocation(String callsign) {
		System.out.println("checking location for " + callsign);
		HttpRequest request = transport.buildGetRequest();
		request.setUrl("http://api.aprs.fi/api/get?what=loc&apikey=" + apikey + "&format=json&name=" + callsign);
		String json;
		try {
			json = request.execute().parseAsString();
		} catch (IOException e) {
			e.printStackTrace();
			return null;
		}

		MorphDynaBean bean = (MorphDynaBean) JSONObject.toBean((JSONObject) JSONSerializer.toJSON(json));
		List entries = (List) bean.get("entries");
		if(entries.size() > 0) {
			bean = (MorphDynaBean) entries.get(0);
	
			Waypoint wpt = new Waypoint();
			wpt.setLat(Double.parseDouble((String) bean.get("lat")));
			wpt.setLng(Double.parseDouble((String) bean.get("lng")));
			wpt.setTime(new Date(Long.parseLong((String) bean.get("lasttime"))*1000));
			return wpt;
		} return null;
	}

}
