package org.sarsoft.plans.model;

import javax.persistence.Entity;
import javax.persistence.ManyToOne;

import net.sf.json.JSONObject;

import org.hibernate.annotations.Cascade;
import org.sarsoft.common.Pair;
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
	
	public JSONObject toGPX() {
		return null;
	}
	
	public static Pair<Integer, FieldWaypoint> fromGPX(JSONObject gpx) {
		String type = gpx.getString("type");
		if(!"waypoint".equals(type)) return null;
		if(!gpx.has("position")) return null;
		
		int confidence = 1;
		FieldWaypoint fwpt = new FieldWaypoint();

		String label = gpx.getString("name");
		fwpt.setLabel(label);
		
		try {
			Long.parseLong(label.substring(0, 5));
			fwpt.setLabel(gpx.getString("desc"));
			confidence = 100;
			fwpt.setAssignmentId(Long.parseLong(label.substring(2, 5)));
		} catch (Exception e) {}

		if(fwpt.getLabel() != null && fwpt.getLabel().startsWith("-")) fwpt.setLabel(null);
		fwpt.setPosition(new Waypoint((JSONObject) gpx.get("position")));

		return new Pair<Integer, FieldWaypoint>(confidence, fwpt);
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
