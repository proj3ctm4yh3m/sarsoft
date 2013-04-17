package org.sarsoft.ops.model;

import java.text.SimpleDateFormat;

import javax.persistence.Entity;
import javax.persistence.OneToOne;
import javax.persistence.Transient;

import net.sf.json.JSONObject;

import org.hibernate.annotations.Cascade;
import org.sarsoft.common.gpx.StyledGeoObject;
import org.sarsoft.common.json.JSONAnnotatedEntity;
import org.sarsoft.common.json.JSONSerializable;
import org.sarsoft.common.model.Waypoint;
import org.sarsoft.plans.model.AssignmentChildObject;

@Entity
@JSONAnnotatedEntity
public class Resource extends AssignmentChildObject {

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

	public Resource() {
	}
	
	public Resource(JSONObject json) {
		from(json);
	}
	
	public void from(JSONObject json) {
		this.from((Resource) JSONObject.toBean(json, Resource.class));
	}
	
	public void from(Resource updated) {
		if(updated.getPosition() == null || updated.getName() != null) {
			setAssignmentId(updated.getAssignmentId());
			setName(updated.getName());
			setAgency(updated.getAgency());
			setCallsign(updated.getCallsign());
			setSpotId(updated.getSpotId());
			setSpotPassword(updated.getSpotPassword());
			setType(updated.getType());
			setUpdated(updated.getUpdated());
		}
		
		if(updated.getPosition() != null) {
			if(position == null) position = new Waypoint();
			getPosition().setLat(updated.getPosition().getLat());
			getPosition().setLng(updated.getPosition().getLng());
		}
	}
	
	public StyledGeoObject toStyledGeo() {
		return null;
	}
	
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
		if(position != null) setUpdated(position.getTime());
		this.position = position;
	}

	@JSONSerializable
	@Transient
	public String getLastFix() {
		if(position != null && position.getTime() != null) return new SimpleDateFormat("M/d/y HH:mm").format(position.getTime());
		return null;
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
