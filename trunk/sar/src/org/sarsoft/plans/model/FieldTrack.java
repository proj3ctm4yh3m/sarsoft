package org.sarsoft.plans.model;

import javax.persistence.Entity;
import javax.persistence.ManyToOne;

import net.sf.json.JSONObject;

import org.hibernate.annotations.Cascade;
import org.sarsoft.common.json.JSONAnnotatedEntity;
import org.sarsoft.common.json.JSONSerializable;
import org.sarsoft.common.model.Way;

@JSONAnnotatedEntity
@Entity
public class FieldTrack extends AssignmentChildObject {

	private String label;
	private Way way;
	
	public FieldTrack() {
	}
	
	public FieldTrack(JSONObject json) {
		from(json);
	}
	
	public void from(JSONObject json) {
		this.from((FieldTrack) JSONObject.toBean(json, FieldTrack.class));
	}

	public void from(FieldTrack updated) {
		if(updated.getLabel() != null) {
			setLabel(updated.getLabel());
		}
		if(updated.getWay() != null) {
			if(way == null) way = new Way();
			way.from(updated.getWay());
		}
	}

	public JSONObject toGPX() {
		return null;
	}
	
	public static FieldWaypoint fromGPX(JSONObject gpx) {
		return null;
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
	public String getLabel() {
		return label;
	}
	
	public void setLabel(String label) {
		this.label = label;
	}
	
}
