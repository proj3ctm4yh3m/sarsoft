package org.sarsoft.common.gpx;

import java.io.UnsupportedEncodingException;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.util.HashMap;
import java.util.Set;

import net.sf.json.JSONObject;

public class StyledGPXObject {

	private HashMap<String, String> attrs = new HashMap<String, String>();
	protected String desc;
	
	public StyledGPXObject() {
	}
	
	public StyledGPXObject(JSONObject gpx) {
		attrs = new HashMap<String, String>();
		desc = gpx.getString("desc");
		decode();
	}

	public String getDesc() {
		return desc;
	}
	
	public void setDesc(String desc) {
		this.desc = desc;
	}

	public void setAttr(String name, String value) {
		this.attrs.put(name, value);
	}
	
	public String getAttr(String name) {
		return getAttr(name, null);
	}

	public String getAttr(String name, String fallback) {
		if(!hasAttr(name)) return fallback;
		return this.attrs.get(name);
	}
	
	public boolean hasAttr(String name) {
		return this.attrs.containsKey(name);
	}
	
	public Set<String> getAttrs() {
		return this.attrs.keySet();
	}
	
	public void decode() {
		if(desc != null && desc.indexOf("=") > 0) {
			for(String pair : desc.split("&")) {
				String[] split = pair.split("=");
				String key = split[0];
				String value = (split.length > 1) ? split[1] : "";
				try {
					attrs.put(key, URLDecoder.decode(value, "UTF-8"));
				} catch (UnsupportedEncodingException e) {
					System.out.println("UnsupportedEncodingException while trying to URLDecode gpx attrs.  This should never, ever happen as Java explicity advises you to use UTF-8.");
				}
			}
		} else {
			this.attrs = new HashMap<String, String>();
		}
	}
	
	public void encode() {
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
		if(encoded.length() > 0) {
			encoded.deleteCharAt(encoded.length() - 1);
			desc = encoded.toString();
		} else {
			desc = null;
		}
	}

	public JSONObject toGPX() {
		JSONObject jobj = new JSONObject();
		encode();
		if(desc != null) jobj.put("desc", desc);
		return jobj;
	}
	
}
