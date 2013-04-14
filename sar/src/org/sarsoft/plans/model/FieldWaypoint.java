package org.sarsoft.plans.model;

import javax.persistence.Entity;
import javax.persistence.ManyToOne;

import net.sf.json.JSONObject;

import org.hibernate.annotations.Cascade;
import org.sarsoft.common.Pair;
import org.sarsoft.common.gpx.StyledGeoObject;
import org.sarsoft.common.gpx.StyledWaypoint;
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
		if(updated.getPosition() == null || updated.getLabel() != null) {
			setAssignmentId(updated.getAssignmentId());
			setLabel(updated.getLabel());
		}
		if(updated.getPosition() != null) {
			if(position == null) position = new Waypoint();
			getPosition().setLat(updated.getPosition().getLat());
			getPosition().setLng(updated.getPosition().getLng());
		}
	}
	
	public static Pair<Integer, FieldWaypoint> from(StyledWaypoint swpt) {
		if(swpt.getWaypoint() == null) return null;
		
		int confidence = 1;
		FieldWaypoint fwpt = new FieldWaypoint();
		fwpt.setPosition(swpt.getWaypoint());
		fwpt.setLabel(swpt.getName());
		
		try {
			Long.parseLong(swpt.getName().substring(0, 5));
			fwpt.setLabel(swpt.getDesc());
			confidence = 100;
			fwpt.setAssignmentId(Long.parseLong(swpt.getName().substring(2, 5)));
		} catch (Exception e) {}

		return new Pair<Integer, FieldWaypoint>(confidence, fwpt);
	}

	public StyledGeoObject toStyledGeo() {
		StyledWaypoint swpt = new StyledWaypoint();

		swpt.setName(getLabel());
		swpt.setIcon("#FF0000");
		swpt.setWaypoint(getPosition());

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

}
