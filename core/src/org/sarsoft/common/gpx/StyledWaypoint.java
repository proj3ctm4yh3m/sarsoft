package org.sarsoft.common.gpx;

import net.sf.json.JSONObject;

import org.sarsoft.common.model.Waypoint;

public class StyledWaypoint extends StyledGeoObject {
	
	private String icon;
	private Waypoint waypoint;
	
	public StyledWaypoint() {
		super();
	}
	
	public StyledWaypoint(JSONObject gpx) {
		super(gpx);
		setWaypoint(new Waypoint((JSONObject) gpx.get("position")));

		setIcon(getAttr("url", "#FF0000"));
		
		if(gpx.containsKey("url")) {
			icon = gpx.getString("url");
			if(icon.startsWith("http://caltopo")) icon = icon.replaceAll("http://caltopo.com/resource/imagery/icons/circle/", "#").replaceAll("http://caltopo.com/static/images/icons/", "").replaceAll(".png", "");
		}
	}
	
	public String getIcon() {
		return icon;
	}
	
	public void setIcon(String icon) {
		this.icon = icon;
	}

	public Waypoint getWaypoint() {
		return waypoint;
	}

	public void setWaypoint(Waypoint waypoint) {
		this.waypoint = waypoint;
	}

	@Override
	public JSONObject toGPX() {
		JSONObject jobject = super.toGPX();
		jobject.put("type", "waypoint");
		jobject.put("icon", icon);
		jobject.put("position", json(getWaypoint()));
		return jobject;
	}

}
