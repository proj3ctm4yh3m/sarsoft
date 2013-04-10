package org.sarsoft.markup.model;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.persistence.Entity;
import javax.persistence.Lob;
import javax.persistence.ManyToOne;
import javax.persistence.Transient;

import net.sf.json.JSONObject;

import org.hibernate.annotations.Cascade;
import org.sarsoft.common.json.JSONAnnotatedEntity;
import org.sarsoft.common.json.JSONSerializable;
import org.sarsoft.common.model.GeoMapObject;
import org.sarsoft.common.model.IPreSave;
import org.sarsoft.common.model.Way;
import org.sarsoft.common.model.Waypoint;

@JSONAnnotatedEntity
@Entity
public class Shape extends GeoMapObject implements IPreSave {

	private Way way;
	private String color;
	private Float weight;
	private Float fill;
	private String label;
	private String comments;

	@SuppressWarnings("rawtypes")
	public static Map<String, Class> classHints = new HashMap<String, Class>();

	static {
		@SuppressWarnings("rawtypes")
		Map<String, Class> m = new HashMap<String, Class>();
		m.putAll(Way.classHints);
		m.put("way", Way.class);
		classHints = Collections.unmodifiableMap(m);
	}

	public Shape() {
	}
	
	public Shape(JSONObject json) {
		from(json);
	}

	public void from(JSONObject json) {
		this.from((Shape) JSONObject.toBean(json, Shape.class, classHints));
	}
	
	public void from(Shape updated) {
		if(updated.getWeight() != null) {
			setColor(updated.getColor());
			setFill(updated.getFill());
			setWeight(updated.getWeight());
			setComments(updated.getComments());
			setLabel(updated.getLabel());
		}
		if(updated.getWay() != null) {
			if(way == null) way = new Way();
			way.from(updated.getWay());
		}
	}
	
	public JSONObject toGPX() {
		JSONObject jobj = new JSONObject();
		jobj.put("type", "route");
		String label = getLabel();
		if(label == null || label.length() == 0) label = "-No Name";
		jobj.put("name", label);
		jobj.put("color", getColor());
		jobj.put("weight", getWeight());
		jobj.put("way", json(getWay()));
		
		Map<String, String> attrs = new HashMap<String, String>();
		attrs.put("color", getColor());
		attrs.put("weight", Float.toString(getWeight()));
		attrs.put("fill", Float.toString(getFill()));
		attrs.put("comments", getComments());
		
		jobj.put("desc", encodeGPXAttrs(attrs));		
		return jobj;
	}
	
	public static Shape fromGPX(JSONObject gpx) {
		String type = gpx.getString("type");
		if(!("route".equals(type) || "track".equals(type))) return null;

		Shape shape = new Shape();
		Map<String, String> attrs = decodeGPXAttrs(gpx.getString("desc"));
		
		String label = gpx.getString("name");
		if(label != null && label.startsWith("-")) label = null;
		shape.setLabel(label);
		
		if(gpx.has("way")) {
			shape.setWay(new Way((JSONObject) gpx.get("way")));
		} else if(gpx.has("coordinates")) {
			String[] coordinates = gpx.getString("coordinates").trim().replaceAll("\n", " ").split(" ");
			List<Waypoint> waypoints = new ArrayList<Waypoint>();
			for(String coordinate : coordinates) {
				String[] ll = coordinate.trim().split(",");
				waypoints.add(new Waypoint(Double.parseDouble(ll[1].trim()), Double.parseDouble(ll[0].trim())));
			}
			shape.setWay(new Way());
			shape.getWay().setWaypoints(waypoints);
		}
		List<Waypoint> wpts = shape.getWay().getWaypoints();
		if("route".equals(type) && wpts.size() > 2 && wpts.get(0).equals(wpts.get(wpts.size() - 1))) shape.getWay().setPolygon(true);

		shape.setColor(attrs.containsKey("color") ? attrs.get("color") : "#FF0000");
		shape.setWeight(attrs.containsKey("weight") ? Float.parseFloat(attrs.get("weight")) : 2f);
		shape.setFill(attrs.containsKey("fill") ? Float.parseFloat(attrs.get("fill")) : 0f);
		shape.setComments(attrs.containsKey("comments") ? attrs.get("comments") : null);
		
		if(gpx.has("color")) shape.setColor('#' + gpx.getString("color").toUpperCase());
		if(gpx.has("weight")) shape.setWeight(Float.parseFloat(gpx.getString("weight")));

		return shape;
	}
	
	@ManyToOne
	@Cascade({org.hibernate.annotations.CascadeType.ALL,org.hibernate.annotations.CascadeType.DELETE_ORPHAN})
	@JSONSerializable
	public Way getWay() {
		return way;
	}
	
	public void setWay(Way way) {
		this.way = way;
	}
	
	@JSONSerializable
	public String getColor() {
		return color;
	}
	
	public void setColor(String color) {
		this.color = color;
	}
	
	@JSONSerializable
	public Float getWeight() {
		return weight;
	}
	
	public void setWeight(Float weight) {
		this.weight = weight;
	}
	
	@JSONSerializable
	public Float getFill() {
		return fill;
	}
	
	public void setFill(Float fill) {
		this.fill = fill;
	}
	
	@JSONSerializable
	public String getLabel() {
		return label;
	}
	
	public void setLabel(String label) {
		this.label = label;
	}
	
	@JSONSerializable
	@Transient
	public Long getLastUpdated() {
		if(getUpdated() == null) return null;
		return getUpdated().getTime();
	}
	
	public void setLastUpdated(Long time) {
		setUpdated(new Date(time));
	}
	
	public void setComments(String comments) {
		this.comments = comments;
	}
	@Lob
	@JSONSerializable
	public String getComments() {
		return comments;
	}
	
	public void preSave() {
		setUpdated(new Date());
	}

	@Transient
	@JSONSerializable
	public String getFormattedSize() {
		if(way.isPolygon()) {
			double area = way.getArea();
			return area + " km&sup2; / " + (((double) Math.round(area*38.61))/100) + "mi&sup2;";
		} else {
			double distance = way.getDistance();
			return distance + " km / " + (((double) Math.round(distance*62.137))/100) + " mi";
		}
	}
	
	public void setFormattedSize(String size) {
		// just here to make JSON-lib happy
	}

}
