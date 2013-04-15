package org.sarsoft.common.gpx;

import net.sf.json.JSONObject;

public class GPXDesc extends StyledGPXObject {

	public GPXDesc() {
		super();
	}
	
	public GPXDesc(JSONObject gpx) {
		super(gpx);
	}
	
	public JSONObject toGPX() {
		JSONObject jobject = super.toGPX();
		jobject.put("type", "desc");
		return jobject;
	}
	
}
