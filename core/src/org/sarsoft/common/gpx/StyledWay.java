package org.sarsoft.common.gpx;

import java.util.ArrayList;
import java.util.List;

import net.sf.json.JSONObject;

import org.sarsoft.common.model.Way;
import org.sarsoft.common.model.WayType;
import org.sarsoft.common.model.Waypoint;

public class StyledWay extends StyledGeoObject {

	private Way way;
	private String color;
	private Float weight;
	private Float fill;
	
	public StyledWay() {
	}

	public StyledWay(JSONObject gpx) {
		super(gpx);
		
		if(gpx.has("way")) {
			way = new Way((JSONObject) gpx.get("way"));
		} else if(gpx.has("coordinates")) {
			String[] coordinates = gpx.getString("coordinates").trim().replaceAll("\n", " ").split(" ");
			List<Waypoint> waypoints = new ArrayList<Waypoint>();
			for(String coordinate : coordinates) {
				String[] ll = coordinate.trim().split(",");
				waypoints.add(new Waypoint(Double.parseDouble(ll[1].trim()), Double.parseDouble(ll[0].trim())));
			}
			way = new Way();
			way.setWaypoints(waypoints);
		}
		if(way != null) way.setType(WayType.valueOf(gpx.getString("type").toUpperCase()));
		List<Waypoint> wpts = way.getWaypoints();
		if(way.getType() == WayType.ROUTE && wpts.size() > 2 && wpts.get(0).equals(wpts.get(wpts.size() - 1))) way.setPolygon(true);

		setColor(getAttr("color", "#FF0000"));
		setWeight(Float.parseFloat(getAttr("weight", "2")));
		setFill(Float.parseFloat(getAttr("fill", "0")));
		
		if(gpx.has("color")) setColor('#' + gpx.getString("color").toUpperCase());
		if(gpx.has("weight")) setWeight(Float.parseFloat(gpx.getString("weight")));
	}
	
	public Way getWay() {
		return way;
	}
	
	public void setWay(Way way) {
		this.way = way;
	}
	
	public String getColor() {
		return color;
	}
	
	public void setColor(String color) {
		this.color = color;
	}
	
	public Float getWeight() {
		return weight;
	}
	
	public void setWeight(Float weight) {
		this.weight = weight;
	}
	
	public Float getFill() {
		return fill;
	}
	
	public void setFill(Float fill) {
		this.fill = fill;
	}

	@Override
	public JSONObject toGPX() {
		JSONObject jobject = super.toGPX();
		jobject.put("type", (way.getType() != null ? way.getType() : WayType.ROUTE).toString().toLowerCase());
		jobject.put("color", getColor());
		jobject.put("weight", getWeight());
		jobject.put("fill", getFill());
		jobject.put("way", json(getWay()));
		return jobject;
	}	

}