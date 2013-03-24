package org.sarsoft.plans.model;

import java.util.Date;

import javax.persistence.Entity;
import javax.persistence.ManyToOne;
import javax.persistence.Transient;

import net.sf.json.JSONObject;

import org.hibernate.annotations.Cascade;
import org.sarsoft.common.model.IPreSave;
import org.sarsoft.common.json.JSONAnnotatedEntity;
import org.sarsoft.common.json.JSONSerializable;
import org.sarsoft.common.model.SarModelObject;
import org.sarsoft.common.model.Waypoint;

@JSONAnnotatedEntity
@Entity
public class Clue extends SarModelObject implements IPreSave {
	
	public enum Disposition {
		COLLECT,MARK,IGNORE
	}

	private String description;
	private String summary;
	private String location;
	private Waypoint position;
	private Date found;
	private Date updated;
	private SearchAssignment assignment;
	private Disposition instructions;
	
	public static Clue createFromJSON(JSONObject json) {
		return (Clue) JSONObject.toBean(json, Clue.class);
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
	public String getAssignmentId() {
		if(assignment != null) return assignment.getId().toString();
		return null;
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
