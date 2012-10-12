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
import org.sarsoft.common.model.IPreSave;
import org.sarsoft.common.model.JSONAnnotatedEntity;
import org.sarsoft.common.model.JSONSerializable;
import org.sarsoft.common.model.SarModelObject;
import org.sarsoft.common.model.Way;
import org.sarsoft.common.model.WayType;
import org.springframework.web.util.HtmlUtils;

@JSONAnnotatedEntity
@Entity
public class Shape extends SarModelObject implements IPreSave {

	private Way way;
	private String color;
	private Float weight;
	private Float fill;
	private String label;
	private String comments;
	private Date updated;

	@SuppressWarnings("rawtypes")
	public static Map<String, Class> classHints = new HashMap<String, Class>();

	static {
		@SuppressWarnings("rawtypes")
		Map<String, Class> m = new HashMap<String, Class>();
		m.putAll(Way.classHints);
		m.put("way", Way.class);
		classHints = Collections.unmodifiableMap(m);
	}

	public static Shape createFromJSON(JSONObject json) {
		return (Shape) JSONObject.toBean(json, Shape.class, classHints);
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
	public float getWeight() {
		return weight;
	}
	
	public void setWeight(float weight) {
		this.weight = weight;
	}
	
	@JSONSerializable
	public float getFill() {
		return fill;
	}
	
	public void setFill(float fill) {
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
	public Date getUpdated() {
		return updated;
	}
	public void setUpdated(Date updated) {
		this.updated = updated;
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

}
