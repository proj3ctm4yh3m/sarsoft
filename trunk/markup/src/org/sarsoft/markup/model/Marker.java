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
import org.sarsoft.common.json.JSONAnnotatedEntity;
import org.sarsoft.common.json.JSONSerializable;
import org.sarsoft.common.model.Waypoint;

@JSONAnnotatedEntity
@Entity
public class Marker extends GeoMapObject implements IPreSave {
	
	private Waypoint position;
	private String label;
	private String comments;
	private String url;
	private Date updated;

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
	
	public static Marker fromGPX(JSONObject gpx) {
		String type = gpx.getString("type");
		if(!"waypoint".equals(type)) return null;

		Marker marker = new Marker();
		String label = gpx.getString("name");
		if(label != null && label.startsWith("-")) label = null;
		marker.setLabel(label);
		marker.setPosition(new Waypoint((JSONObject) gpx.get("position")));

		Map<String, String> attrs = decodeGPXAttrs(gpx.getString("desc"));
		marker.setUrl(attrs.containsKey("url") ? attrs.get("url") : "#FF0000");
		marker.setComments(attrs.containsKey("comments") ? attrs.get("comments") : null);

		return marker;
	}
	
	public JSONObject toGPX() {
		JSONObject jobj = new JSONObject();
		jobj.put("type", "waypoint");
		String label = getLabel();
		if(label == null || label.length() == 0) label = "-No Name";
		jobj.put("name", label);
		jobj.put("icon", getUrl());
		jobj.put("position", json(getPosition()));
		
		Map<String, String> attrs = new HashMap<String, String>();
		attrs.put("url", getUrl());
		attrs.put("comments", getComments());
		
		jobj.put("desc", encodeGPXAttrs(attrs));
		
		return jobj;
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

}
