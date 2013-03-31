package org.sarsoft.plans.model;

import java.util.Date;

import javax.persistence.Entity;
import javax.persistence.ManyToOne;
import javax.persistence.Transient;

import net.sf.json.JSONObject;

import org.hibernate.annotations.Cascade;
import org.sarsoft.common.json.JSONAnnotatedEntity;
import org.sarsoft.common.json.JSONSerializable;
import org.sarsoft.common.model.GeoMapObject;
import org.sarsoft.common.model.IPreSave;
import org.sarsoft.common.model.Waypoint;

@JSONAnnotatedEntity
@Entity
public class Clue extends GeoMapObject implements IPreSave {
	
	public enum Disposition {
		COLLECT,MARK,IGNORE
	}

	private String description;
	private String summary;
	private String location;
	private Waypoint position;
	private Date found;
	private Date updated;
	private Long assignmentId;
	private SearchAssignment assignment;
	private Disposition instructions;
	
	public Clue() {
	}
	
	public Clue(JSONObject json) {
		from(json);
	}
	
	public void from(JSONObject json) {
		this.from((Clue) JSONObject.toBean(json, Clue.class));
	}
	
	public void from(Clue updated) {
		if(updated.getDescription() != null || updated.getSummary() != null) {
			setDescription(updated.getDescription());
			setAssignmentId(updated.getAssignmentId());
			setSummary(updated.getSummary());
			setLocation(updated.getLocation());
			setFound(updated.getFound());
			setUpdated(updated.getUpdated());
			setInstructions(updated.getInstructions());
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
	
	public static Clue fromGPX(JSONObject gpx) {
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
	public Date getFound() {
		return found;
	}
	
	public void setFound(Date found) {
		this.found = found;
	}
	
	@JSONSerializable
	public Date getUpdated() {
		return updated;
	}
	public void setUpdated(Date updated) {
		this.updated = updated;
	}
	public void preSave() {
		setUpdated(new Date());
	}

	@JSONSerializable
	public String getSummary() {
		return summary;
	}
	
	public void setSummary(String summary) {
		this.summary = summary;
	}

	@JSONSerializable
	public String getDescription() {
		return description;
	}
	
	public void setDescription(String description) {
		this.description = description;
	}
	
	@JSONSerializable
	public String getLocation() {
		return location;
	}
	
	public void setLocation(String location) {
		this.location = location;
	}
	
	@Transient
	@JSONSerializable
	public Long getAssignmentId() {
		if(assignmentId != null) return assignmentId;
		return (assignment == null) ? null : assignment.getId();
	}
	
	public void setAssignmentId(Long id) {
		this.assignmentId = id;
	}
	
	@ManyToOne
	public SearchAssignment getAssignment() {
		return assignment;
	}
	
	public void setAssignment(SearchAssignment assignment) {
		this.assignment = assignment;
	}
	
	@JSONSerializable
	public Disposition getInstructions() {
		return instructions;
	}
	
	public void setInstructions(Disposition instructions) {
		this.instructions = instructions;
	}
}
