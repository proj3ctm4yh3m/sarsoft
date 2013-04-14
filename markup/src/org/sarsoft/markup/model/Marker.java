package org.sarsoft.markup.model;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;

import javax.persistence.Entity;
import javax.persistence.Lob;
import javax.persistence.ManyToOne;

import net.sf.json.JSONObject;

import org.hibernate.annotations.Cascade;
import org.sarsoft.common.model.GeoMapObject;
import org.sarsoft.common.model.IPreSave;
import org.sarsoft.common.gpx.StyledGeoObject;
import org.sarsoft.common.gpx.StyledWaypoint;
import org.sarsoft.common.json.JSONAnnotatedEntity;
import org.sarsoft.common.json.JSONSerializable;
import org.sarsoft.common.model.Waypoint;
import org.sarsoft.common.util.RuntimeProperties;

@JSONAnnotatedEntity
@Entity
public class Marker extends GeoMapObject {
	
	private Waypoint position;
	private String label;
	private String comments;
	private String url;

	public Marker() {
	}
	
	public Marker(JSONObject json) {
		from(json);
	}
	
	public void from(JSONObject json) {
		from((Marker) JSONObject.toBean(json, Marker.class));
	}
	
	public void from(Marker updated) {
		if(updated.getUrl() != null) {
			setLabel(updated.getLabel());
			setUrl(updated.getUrl());
			setComments(updated.getComments());
		}
		if(updated.getPosition() != null) {
			if(position == null) position = new Waypoint();
			getPosition().setLat(updated.getPosition().getLat());
			getPosition().setLng(updated.getPosition().getLng());
		}
	}
	
	public static Marker from(StyledWaypoint swpt) {
		Marker marker = new Marker();

		marker.setLabel(swpt.getName());
		marker.setPosition(swpt.getWaypoint());
		marker.setUrl(swpt.getIcon());
		marker.setComments(swpt.getAttr("comments"));
		
		return marker;
	}
	
	public StyledGeoObject toStyledGeo() {
		StyledWaypoint swpt = new StyledWaypoint();

		swpt.setName(getLabel());
		swpt.setIcon(getUrl());
		swpt.setWaypoint(getPosition());
		swpt.setAttr("url", getUrl());
		swpt.setAttr("comments", getComments());

		return swpt;
	}

	@ManyToOne
	@Cascade({org.hibernate.annotations.CascadeType.ALL,org.hibernate.annotations.CascadeType.DELETE_ORPHAN})
	@JSONSerializable
	public Waypoint getPosition() {
		return position;
	}

	public void setPosition(Waypoint position) {
		this.position = position;
	}

	@JSONSerializable
	public String getLabel() {
		return label;
	}
	
	public void setLabel(String label) {
		this.label = label;
	}

	@JSONSerializable
	public String getUrl() {
		return url;
	}
	
	public void setUrl(String url) {
		this.url = url;
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

}
