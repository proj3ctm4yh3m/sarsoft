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
import org.sarsoft.common.model.JSONAnnotatedEntity;
import org.sarsoft.common.model.JSONSerializable;
import org.sarsoft.common.model.Waypoint;

@JSONAnnotatedEntity
@Entity
public class Marker extends GeoMapObject implements IPreSave {
	
	private Waypoint position;
	private String label;
	private String comments;
	private String url;
	private Date updated;

	public static Marker fromJSON(JSONObject json) {
		return (Marker) JSONObject.toBean(json, Marker.class);
	}
	
	public static Marker fromGPX(JSONObject gpx) {
		String type = gpx.getString("type");
		if(!"waypoint".equals(type)) return null;

		Marker marker = new Marker();
		Map<String, String> attrs = decodeGPXAttrs(gpx.getString("desc"));
		
		marker.setPosition(Waypoint.createFromJSON((JSONObject) gpx.get("position")));

		marker.setUrl(attrs.containsKey("url") ? attrs.get("url") : "#FF0000");
		marker.setComments(attrs.containsKey("comments") ? attrs.get("comments") : null);

		return marker;
	}
	
	public void from(JSONObject json) {
		Marker updated = fromJSON(json);
		from(updated);
	}

	public void from(Marker updated) {
		if(updated.getUrl() != null) {
			setLabel(updated.getLabel());
			setUrl(updated.getUrl());
			setComments(updated.getComments());
		}
		if(updated.getPosition() != null) {
			setPosition(updated.getPosition());
		}
	}
	
	public JSONObject toGPX() {
		JSONObject jobj = new JSONObject();
		jobj.put("type", "waypoint");
		jobj.put("name", getLabel());
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
