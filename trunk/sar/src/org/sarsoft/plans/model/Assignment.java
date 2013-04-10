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

import org.sarsoft.common.Pair;
import org.sarsoft.common.json.JSONAnnotatedEntity;
import org.sarsoft.common.json.JSONSerializable;
import org.sarsoft.common.model.GeoMapObject;
import org.sarsoft.common.model.Way;
import org.sarsoft.common.model.Waypoint;
import org.sarsoft.ops.model.Resource;

import net.sf.json.JSONObject;

import org.hibernate.annotations.Cascade;
import org.hibernate.annotations.LazyCollection;
import org.hibernate.annotations.LazyCollectionOption;

@JSONAnnotatedEntity
@Entity
public class Assignment extends GeoMapObject {

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
	private Date preparedOn;
	private String preparedBy;
	private OperationalPeriod operationalPeriod;
	private String primaryFrequency;
	private String secondaryFrequency;
	private Way segment;
	private Set<Clue> clues = new HashSet<Clue>();
	private List<FieldWaypoint> fieldWaypoints = new ArrayList<FieldWaypoint>();
	private List<FieldTrack> fieldTracks = new ArrayList<FieldTrack>();
	private Set<Resource> resources = new HashSet<Resource>();

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
	
	public static Pair<Integer, Assignment> fromGPX(JSONObject gpx) {
		String type = gpx.getString("type");
		if(!"route".equals(type)) return null;
		if(!gpx.has("way")) return null;
		
		int confidence = 1;
		Assignment assignment = new Assignment();
		
		Map<String, String> attrs = decodeGPXAttrs(gpx.getString("desc"));
		if(attrs.containsKey("details")) assignment.setDetails(attrs.get("details"));
		if(attrs.containsKey("resourceType")) assignment.setResourceType(ResourceType.valueOf(attrs.get("resourceType")));
		if(attrs.containsKey("status")) assignment.setStatus(Status.valueOf(attrs.get("status")));
		if(attrs.containsKey("timeAllocated")) assignment.setTimeAllocated(Double.parseDouble(attrs.get("timeAllocated")));
		if(attrs.containsKey("previousEfforts")) assignment.setPreviousEfforts(attrs.get("previousEfforts"));
		if(attrs.containsKey("transportation")) assignment.setTransportation(attrs.get("transportation"));
		if(attrs.containsKey("responsivePOD")) assignment.setResponsivePOD(Probability.valueOf(attrs.get("responsivePOD")));
		if(attrs.containsKey("unresponsivePOD")) assignment.setUnresponsivePOD(Probability.valueOf(attrs.get("unresponsivePOD")));
		if(attrs.containsKey("cluePOD")) assignment.setCluePOD(Probability.valueOf(attrs.get("cluePOD")));
		if(attrs.containsKey("updated")) assignment.setUpdated(new Date(Long.parseLong(attrs.get("updated"))));
		if(attrs.containsKey("preparedOn")) assignment.setPreparedOn(new Date(Long.parseLong(attrs.get("preparedOn"))));
		if(attrs.containsKey("preparedBy")) assignment.setPreparedBy(attrs.get("preparedBy"));
		if(attrs.containsKey("primaryFrequency")) assignment.setPrimaryFrequency(attrs.get("primaryFrequency"));
		if(attrs.containsKey("secondaryFrequency")) assignment.setSecondaryFrequency(attrs.get("secondaryFrequency"));
		if(attrs.containsKey("operationalPeriodId")) assignment.setOperationalPeriodId(Long.parseLong(attrs.get("operationalPeriodId")));

		Long parsed = null;
		String name = gpx.getString("name");
		try {
			if(name != null) parsed = Long.parseLong(name);
		} catch (NumberFormatException e) {}
		if(parsed != null && name.length() == 5) {
			assignment.setOperationalPeriodId(Long.parseLong(name.substring(0, 2)));
			assignment.setNumber(name.substring(2, 5));
			try { assignment.setId(Long.parseLong(assignment.getNumber())); } catch (NumberFormatException e) {}
			confidence = 100;
		} else {
			assignment.setNumber(name);
		}		
		if(assignment.getResourceType() != null) confidence = 100;
		
		assignment.setSegment(new Way((JSONObject) gpx.get("way")));
		List<Waypoint> wpts = assignment.getSegment().getWaypoints();
		if( wpts.size() > 2 && wpts.get(0).equals(wpts.get(wpts.size() - 1))) assignment.getSegment().setPolygon(true);
		
		return new Pair<Integer, Assignment>(confidence, assignment);
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
	
	public String toString() {
		return "SearchAssignment " + id + ": (" + getUpdated() + ")";
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

	@OneToMany(mappedBy="assignment")
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
	
	@OneToMany(mappedBy="assignment")
	@Cascade({org.hibernate.annotations.CascadeType.SAVE_UPDATE})
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

	@OneToMany(mappedBy="assignment")
	@Cascade({org.hibernate.annotations.CascadeType.SAVE_UPDATE})
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

	@OneToMany(mappedBy="assignment")
	@Cascade({org.hibernate.annotations.CascadeType.SAVE_UPDATE})
	@LazyCollection(LazyCollectionOption.TRUE)
	public Set<Resource> getResources() {
		return resources;
	}
	
	public void setResources(Set<Resource> resources) {
		this.resources = resources;
	}
	
	public void addResource(Resource resource) {
		this.resources.add(resource);
		resource.setAssignment(this);
	}
	
	public void removeResource(Resource resource) {
		this.resources.remove(resource);
		resource.setAssignment(null);
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
