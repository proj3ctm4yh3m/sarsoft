package org.sarsoft.plans.model;

import javax.persistence.Entity;
import javax.persistence.ManyToOne;

import net.sf.json.JSONObject;

import org.hibernate.annotations.Cascade;
import org.sarsoft.common.json.JSONAnnotatedEntity;
import org.sarsoft.common.json.JSONSerializable;
import org.sarsoft.common.model.Waypoint;

@JSONAnnotatedEntity
@Entity
public class FieldWaypoint extends AssignmentChildObject {

	private String label;
	private Waypoint position;
	
	public FieldWaypoint() {
	}
	
	public FieldWaypoint(JSONObject json) {
		from(json);
	}
	
	public void from(JSONObject json) {
		this.from((FieldWaypoint) JSONObject.toBean(json, FieldWaypoint.class));
	}
	
	public void from(FieldWaypoint updated) {
		if(updated.getLabel() != null) {
			setLabel(updated.getLabel());
		}
		if(updated.getPosition() != null) {
			if(position == null) position = new Waypoint();
			getPosition().setLat(updated.getPosition().getLat());
			getPosition().setLng(updated.getPosition().getLng());
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

}
