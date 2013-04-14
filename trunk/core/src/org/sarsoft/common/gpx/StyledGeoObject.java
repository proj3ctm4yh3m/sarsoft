package org.sarsoft.common.gpx;

import java.io.UnsupportedEncodingException;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.util.HashMap;

import org.sarsoft.common.json.JSONAnnotatedPropertyFilter;

import net.sf.json.JSONObject;

public abstract class StyledGeoObject {

	private HashMap<String, String> attrs = new HashMap<String, String>();
	protected String name;
	protected String desc;

	public StyledGeoObject() {
	}

	public StyledGeoObject(JSONObject gpx) {
		name = gpx.getString("name");
		if(name != null && name.startsWith("-")) name = null;

		attrs = new HashMap<String, String>();
		desc = gpx.getString("desc");
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
		}
	}

	public String getName() {
		return name;
	}
	
	public void setName(String name) {
		this.name = name;
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
		
	public JSONObject toGPX() {
		JSONObject jobj = new JSONObject();
		jobj.put("name", (name == null || name.length() == 0 ? "-No Name" : name));

		if(attrs.size() > 0) {
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
			jobj.put("desc", encoded.toString());
		}

		return jobj;
	}
		
	public static JSONObject json(Object obj){
		return JSONAnnotatedPropertyFilter.fromObject(obj);
	}

}
