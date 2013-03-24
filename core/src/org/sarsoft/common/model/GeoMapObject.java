package org.sarsoft.common.model;

import java.io.UnsupportedEncodingException;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.util.HashMap;
import java.util.Map;

import net.sf.json.JSONObject;

import org.sarsoft.common.model.MapObject;

public abstract class GeoMapObject extends MapObject {
	
	public abstract JSONObject toGPX();
	
	public String encodeGPXAttrs(Map<String, String> attrs) {
		StringBuffer encoded = new StringBuffer();
		for(String key : attrs.keySet()) {
			String value = attrs.get(key);
			if(value != null) {
				encoded.append(key);
				encoded.append("=");
				try {
					encoded.append(URLEncoder.encode(value, "UTF-8"));
				} catch (UnsupportedEncodingException e) {
					System.out.println("UnsupportedEncodingException while trying to URLEncode gpx attrs.  This should never, ever happen as Java explicity advises you to use UTF-8.");
				}
				encoded.append("&");
			}
		}
		encoded.deleteCharAt(encoded.length() - 1);
		return encoded.toString();
	}

	public static Map<String, String> decodeGPXAttrs(String encoded) {
		Map<String, String> attrs = new HashMap<String, String>();
		if(encoded == null) return attrs;
		for(String pair : encoded.split("&")) {
			String[] split = pair.split("=");
			String key = split[0];
			String value = (split.length > 1) ? split[1] : "";
			try {
				attrs.put(key, URLDecoder.decode(value, "UTF-8"));
			} catch (UnsupportedEncodingException e) {
				System.out.println("UnsupportedEncodingException while trying to URLDecode gpx attrs.  This should never, ever happen as Java explicity advises you to use UTF-8.");
			}
		}
		return attrs;
	}

}
