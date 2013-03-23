package org.sarsoft.markup.model;

import java.util.Date;

import javax.persistence.Entity;
import javax.persistence.Lob;
import javax.persistence.ManyToOne;
import javax.persistence.Transient;

import net.sf.json.JSONObject;

import org.hibernate.annotations.Cascade;
import org.sarsoft.common.model.IPreSave;
import org.sarsoft.common.model.JSONAnnotatedEntity;
import org.sarsoft.common.model.JSONSerializable;
import org.sarsoft.common.model.MapObject;
import org.sarsoft.common.model.SarModelObject;
import org.sarsoft.common.model.Waypoint;
import org.springframework.web.util.HtmlUtils;

@JSONAnnotatedEntity
@Entity
public class Marker extends MapObject implements IPreSave {
	
	private Waypoint position;
	private String label;
	private String comments;
	private String url;
	private Date updated;

	public static Marker createFromJSON(JSONObject json) {
		return (Marker) JSONObject.toBean(json, Marker.class);
	}
	
	public void from (JSONObject json) {
		Marker updated = createFromJSON(json);
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
