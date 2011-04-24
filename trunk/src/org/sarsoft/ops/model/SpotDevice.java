package org.sarsoft.ops.model;

import java.io.IOException;
import java.util.Date;
import java.util.List;

import net.sf.ezmorph.bean.MorphDynaBean;
import net.sf.json.JSONObject;
import net.sf.json.JSONSerializer;

import org.sarsoft.common.model.Waypoint;

import com.google.api.client.googleapis.GoogleTransport;
import com.google.api.client.googleapis.json.JsonCParser;
import com.google.api.client.http.HttpRequest;
import com.google.api.client.http.HttpTransport;

public class SpotDevice {

	public static HttpTransport transport = GoogleTransport.create();

	static {
		transport.addParser(new JsonCParser());
	}

	public static Waypoint checkLocation(String id, String password) {
		HttpRequest request = transport.buildGetRequest();
		String url = "http://share.findmespot.com/spot-adventures/rest-api/1.0/public/feed/" + id + "/message?&sort=timeInMili&dir=DESC";
		if(id != null) url += "&feedPassword=" + password;
		request.setUrl(url);
		String json;
		try {
			json = request.execute().parseAsString();

			MorphDynaBean bean = (MorphDynaBean) JSONObject.toBean((JSONObject) JSONSerializer.toJSON(json));
			List messages = (List) ((MorphDynaBean) ((MorphDynaBean) ((MorphDynaBean) bean.get("response")).get("feedMessageResponse")).get("messages")).get("message");
			MorphDynaBean message = (MorphDynaBean) messages.get(0);

			Waypoint wpt = new Waypoint();
			wpt.setLat((Double) message.get("latitude"));
			wpt.setLng((Double) message.get("longitude"));
			wpt.setTime(new Date(((long) ((Integer) message.get("timeInSec"))*1000)));
			return wpt;

		} catch (IOException e) {
			e.printStackTrace();
			return null;
		}
	}

}
