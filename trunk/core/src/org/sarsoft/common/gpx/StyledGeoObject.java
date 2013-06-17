package org.sarsoft.common.gpx;

import java.util.HashMap;

import org.sarsoft.common.json.JSONAnnotatedPropertyFilter;

import net.sf.json.JSONArray;
import net.sf.json.JSONObject;

public abstract class StyledGeoObject extends StyledGPXObject {

	private HashMap<String, String> attrs = new HashMap<String, String>();
	protected String name;
	protected String desc;

	public StyledGeoObject() {
		super();
	}

	public StyledGeoObject(JSONObject gpx) {
		super(gpx);
		name = gpx.getString("name");
		if(name != null && name.startsWith("-")) name = null;
		if(gpx.get("name") instanceof JSONArray) name = null; // jsonlib will translate empty name tag to [] for some reason
	}

	public String getName() {
		return name;
	}
	
	public void setName(String name) {
		this.name = name;
	}
	
	public JSONObject toGPX() {
		JSONObject jobj = super.toGPX();
		jobj.put("name", (name == null || name.length() == 0 ? "-No Name" : name));

		return jobj;
	}
		
	public static JSONObject json(Object obj){
		return JSONAnnotatedPropertyFilter.fromObject(obj);
	}

}
