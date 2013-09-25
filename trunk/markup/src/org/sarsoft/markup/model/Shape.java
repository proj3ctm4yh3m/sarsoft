package org.sarsoft.markup.model;

import java.util.Collections;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

import javax.persistence.Entity;
import javax.persistence.Lob;
import javax.persistence.ManyToOne;
import javax.persistence.Transient;

import net.sf.json.JSONObject;

import org.hibernate.annotations.Cascade;
import org.sarsoft.common.gpx.StyledGeoObject;
import org.sarsoft.common.gpx.StyledWay;
import org.sarsoft.common.json.JSONAnnotatedEntity;
import org.sarsoft.common.json.JSONSerializable;
import org.sarsoft.common.model.GeoMapObject;
import org.sarsoft.common.model.IPreSave;
import org.sarsoft.common.model.Way;

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
	
	public static Shape from(StyledWay sway) {
		Shape shape = new Shape();
		
		shape.setLabel(sway.getName());
		shape.setWay(sway.getWay());
		shape.setColor(sway.getColor());
		shape.setWeight(sway.getWeight());
		shape.setFill(sway.getFill());
		shape.setComments(sway.getAttr("comments"));

		return shape;
	}
	
	public StyledGeoObject toStyledGeo() {
		StyledWay sway = new StyledWay();

		sway.setName(getLabel());
		sway.setColor(getColor());
		sway.setWeight(getWeight());
		sway.setFill(getFill());
		sway.setWay(getWay());
		sway.setAttr("weight", "" + getWeight());
		sway.setAttr("color", getColor());
		sway.setAttr("fill", "" + getFill());
		sway.setAttr("comments", getComments());
		
		return sway;
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
			return format(area, true);
		} else {
			double distance = way.getDistance();
			String size = format(distance, false);
			if(way.getSourceDistance() > 0) {
				size = size + ", originally " + format(way.getSourceDistance(), false);
			}
			return size;
		}
	}
	
	private String format(double km, boolean polygon) {
		if(polygon) {
			return km + " km&sup2; / " + (((double) Math.round(km*38.61))/100) + "mi&sup2;";
		} else {
			return km + " km / " + (((double) Math.round(km*62.137))/100) + " mi";
		}
	}
	
	public void setFormattedSize(String size) {
		// just here to make JSON-lib happy
	}

}
