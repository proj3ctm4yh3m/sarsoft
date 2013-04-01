package org.sarsoft.plans.model;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import javax.persistence.Entity;
import javax.persistence.ManyToOne;
import javax.persistence.OneToMany;
import javax.persistence.Transient;

import org.sarsoft.common.model.IPreSave;
import org.sarsoft.common.json.JSONAnnotatedEntity;
import org.sarsoft.common.json.JSONSerializable;
import org.sarsoft.common.model.GeoMapObject;
import org.sarsoft.common.model.Way;
import org.sarsoft.common.model.WayType;
import org.sarsoft.common.model.Waypoint;
import org.sarsoft.ops.model.Resource;
import org.sarsoft.ops.model.Resource.Type;

import net.sf.json.JSONObject;

import org.hibernate.annotations.Cascade;
import org.hibernate.annotations.LazyCollection;
import org.hibernate.annotations.LazyCollectionOption;

@JSONAnnotatedEntity
@Entity
public class Assignment extends GeoMapObject implements IPreSave {

	public enum ResourceType {
		GROUND,MOUNTED,DOG,OHV
	}

	public enum Status {
		DRAFT,PREPARED,INPROGRESS,COMPLETED
	}

	private String number;
	private String details;
	private ResourceType resourceType;
	private Status status = Status.DRAFT;
	private Long operationalPeriodId;
	private Double timeAllocated = new Double(0);
	private String previousEfforts;
	private String transportation;
	private Probability responsivePOD;
	private Probability unresponsivePOD;
	private Probability cluePOD;
	private Date updated;
	private Date preparedOn;
	private String preparedBy;
	private OperationalPeriod operationalPeriod;
	private String primaryFrequency;
	private String secondaryFrequency;
	private Way segment;
	private Set<Clue> clues = new HashSet<Clue>();
	private List<FieldWaypoint> fieldWaypoints = new ArrayList<FieldWaypoint>();
	private List<FieldTrack> fieldTracks = new ArrayList<FieldTrack>();

	@SuppressWarnings("rawtypes")
	public static Map<String, Class> classHints = new HashMap<String, Class>();

	static {
		@SuppressWarnings("rawtypes")
		Map<String, Class> m = new HashMap<String, Class>();
		m.putAll(Way.classHints);
		m.put("segment", Way.class);
		classHints = Collections.unmodifiableMap(m);
	}
	
	public Assignment() {
	}
	
	public Assignment(JSONObject json) {
		from(json);
	}
	
	public void from(JSONObject json) {
		this.from((Assignment) JSONObject.toBean(json, Assignment.class, classHints));
	}
	
	public void from(Assignment updated) {
		setNumber(updated.getNumber());
		setDetails(updated.getDetails());
		setResourceType(updated.getResourceType());
		setStatus(updated.getStatus());
		setOperationalPeriodId(updated.getOperationalPeriodId());
		setTimeAllocated(updated.getTimeAllocated());
		setPreviousEfforts(updated.getPreviousEfforts());
		setTransportation(updated.getTransportation());
		setResponsivePOD(updated.getResponsivePOD());
		setUnresponsivePOD(updated.getUnresponsivePOD());
		setCluePOD(updated.getCluePOD());
		setUpdated(updated.getUpdated());
		setPreparedOn(updated.getPreparedOn());
		setPreparedBy(updated.getPreparedBy());
		setPrimaryFrequency(updated.getPrimaryFrequency());
		setSecondaryFrequency(updated.getSecondaryFrequency());
		
		if(updated.getSegment() != null) {
			if(segment == null) segment = new Way();
			segment.from(updated.getSegment());
		}
	}
	
	public JSONObject toGPX() {
		return null;
	}
	
	public static Assignment fromGPX(JSONObject gpx) {
		return null;
	}

	@ManyToOne
	@Cascade({org.hibernate.annotations.CascadeType.ALL,org.hibernate.annotations.CascadeType.DELETE_ORPHAN})
	@JSONSerializable
	public Way getSegment() {
		return segment;
	}
	
	public void setSegment(Way segment) {
		this.segment = segment;
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

	public String toString() {
		return "SearchAssignment " + id + ": (" + updated + ")";
	}

	@JSONSerializable
	public String getNumber() {
		return number;
	}
	
	public void setNumber(String number) {
		this.number = number;
	}

	@JSONSerializable
	public String getDetails() {
		return details;
	}

	public void setDetails(String details) {
		this.details = details;
	}

	@JSONSerializable
	public Probability getResponsivePOD() {
		return responsivePOD;
	}

	public void setResponsivePOD(Probability pod) {
		this.responsivePOD = pod;
	}

	@JSONSerializable
	public Probability getUnresponsivePOD() {
		return unresponsivePOD;
	}

	public void setUnresponsivePOD(Probability pod) {
		this.unresponsivePOD = pod;
	}

	@JSONSerializable
	public Probability getCluePOD() {
		return cluePOD;
	}

	public void setCluePOD(Probability pod) {
		this.cluePOD = pod;
	}

	@JSONSerializable
	public Double getTimeAllocated() {
		if(timeAllocated == null) return new Double(0);
		return timeAllocated;
	}

	public void setTimeAllocated(Double timeAllocated) {
		this.timeAllocated = timeAllocated;
	}

	@JSONSerializable
	public String getTransportation() {
		return transportation;
	}

	public void setTransportation(String transportation) {
		this.transportation = transportation;
	}

	@JSONSerializable
	public ResourceType getResourceType() {
		return resourceType;
	}

	public void setResourceType(ResourceType resourceType) {
		this.resourceType = resourceType;
	}

	@JSONSerializable
	public Status getStatus() {
		return status;
	}

	public void setStatus(Status status) {
		this.status = status;
	}

	@Transient
	@JSONSerializable
	public Long getOperationalPeriodId() {
		if(operationalPeriodId != null) return operationalPeriodId;
		return (operationalPeriod == null) ? null : operationalPeriod.getId();
	}

	public void setOperationalPeriodId(Long operationalPeriodId) {
		this.operationalPeriodId = operationalPeriodId;
	}

	@ManyToOne
	public OperationalPeriod getOperationalPeriod() {
		return operationalPeriod;
	}

	public void setOperationalPeriod(OperationalPeriod operationalPeriod) {
		this.operationalPeriod = operationalPeriod;
	}

	@OneToMany
	@Cascade({org.hibernate.annotations.CascadeType.SAVE_UPDATE})
	@LazyCollection(LazyCollectionOption.TRUE)
	public Set<Clue> getClues() {
		return clues;
	}
	
	public void setClues(Set<Clue> clues) {
		this.clues = clues;
	}
	
	public void addClue(Clue clue) {
		this.clues.add(clue);
		clue.setAssignment(this);
	}
	
	public void removeClue(Clue clue) {
		this.clues.remove(clue);
		clue.setAssignment(null);
	}
	
	@OneToMany
	@Cascade({org.hibernate.annotations.CascadeType.ALL,org.hibernate.annotations.CascadeType.DELETE_ORPHAN})
	@LazyCollection(LazyCollectionOption.TRUE)
	public List<FieldTrack> getFieldTracks() {
		return fieldTracks;
	}
	
	public void setFieldTracks(List<FieldTrack> fieldTracks) {
		this.fieldTracks = fieldTracks;
	}
	
	public void addFieldTrack(FieldTrack track) {
		this.fieldTracks.add(track);
		track.setAssignment(this);
	}
	
	public void removeFieldTrack(FieldTrack track) {
		this.fieldTracks.remove(track);
		track.setAssignment(null);
	}

	@OneToMany
	@Cascade({org.hibernate.annotations.CascadeType.ALL,org.hibernate.annotations.CascadeType.DELETE_ORPHAN})
	@LazyCollection(LazyCollectionOption.TRUE)
	public List<FieldWaypoint> getFieldWaypoints() {
		return fieldWaypoints;
	}
	
	public void setFieldWaypoints(List<FieldWaypoint> fieldWaypoints) {
		this.fieldWaypoints = fieldWaypoints;
	}
	
	public void addFieldWaypoint(FieldWaypoint fwpt) {
		this.fieldWaypoints.add(fwpt);
		fwpt.setAssignment(this);
	}
	
	public void removeFieldWaypoint(FieldWaypoint fwpt) {
		this.fieldWaypoints.remove(fwpt);
		fwpt.setAssignment(null);
	}
	
	public String getPreparedBy() {
		return preparedBy;
	}

	public void setPreparedBy(String preparedBy) {
		this.preparedBy = preparedBy;
	}

	public Date getPreparedOn() {
		return preparedOn;
	}

	public void setPreparedOn(Date preparedOn) {
		this.preparedOn = preparedOn;
	}

	public String getPrimaryFrequency() {
		return primaryFrequency;
	}

	public void setPrimaryFrequency(String primaryFrequency) {
		this.primaryFrequency = primaryFrequency;
	}

	public String getSecondaryFrequency() {
		return secondaryFrequency;
	}

	public void setSecondaryFrequency(String secondaryFrequency) {
		this.secondaryFrequency = secondaryFrequency;
	}

	public String getPreviousEfforts() {
		return previousEfforts;
	}

	public void setPreviousEfforts(String previousEfforts) {
		this.previousEfforts = previousEfforts;
	}

}
