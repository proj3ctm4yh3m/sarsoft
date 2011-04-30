package org.sarsoft.ops.model;

import java.util.Date;

import javax.persistence.Entity;
import javax.persistence.ManyToOne;
import javax.persistence.OneToOne;
import javax.persistence.Transient;

import org.hibernate.annotations.Cascade;
import org.sarsoft.common.model.JSONAnnotatedEntity;
import org.sarsoft.common.model.JSONSerializable;
import org.sarsoft.common.model.SarModelObject;
import org.sarsoft.common.model.Waypoint;
import org.sarsoft.plans.model.SearchAssignment;

@Entity
@JSONAnnotatedEntity
public class Resource extends SarModelObject {

	public enum Type {
		PERSON, EQUIPMENT
	}

	protected String name;
	protected String agency;
	protected String callsign;
	protected String spotId;
	protected String spotPassword;
	protected Type type;
	protected Waypoint position;
	protected SearchAssignment assignment;
	protected Date updated;

	@JSONSerializable
	public String getName() {
		return name;
	}
	public void setName(String name) {
		this.name = name;
	}
	
	@JSONSerializable
	public String getAgency() {
		return agency;
	}
	
	public void setAgency(String agency) {
		this.agency = agency;
	}
	
	@JSONSerializable
	public Type getType() {
		return type;
	}
	public void setType(Type type) {
		this.type = type;
	}	

	@JSONSerializable
	@OneToOne
	@Cascade({org.hibernate.annotations.CascadeType.SAVE_UPDATE, org.hibernate.annotations.CascadeType.PERSIST, org.hibernate.annotations.CascadeType.DELETE_ORPHAN})
	public Waypoint getPosition() {
		return position;
	}

	public void setPosition(Waypoint position) {
		if(position != null) updated = position.getTime();
		this.position = position;
	}

	@Transient
	@JSONSerializable
	public String getAssignmentId() {
		return (assignment == null) ? null : Long.toString(assignment.getId());
	}

	@ManyToOne
	public SearchAssignment getAssignment() {
		return assignment;
	}

	public void setAssignment(SearchAssignment assignment) {
		this.assignment = assignment;
	}

	public void setUpdated(Date updated) {
		this.updated = updated;
	}
		
	@JSONSerializable
	public Date getUpdated() {
		return updated;
	}
	
	@JSONSerializable
	public String getCallsign() {
		return callsign;
	}
	public void setCallsign(String callsign) {
		this.callsign = callsign;
	}

	@JSONSerializable
	public String getSpotId() {
		return spotId;
	}
	public void setSpotId(String spotId) {
		this.spotId = spotId;
	}

	public String getSpotPassword() {
		return spotPassword;
	}
	public void setSpotPassword(String spotPassword) {
		this.spotPassword = spotPassword;
	}
	
}
