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
public class SearchAssignment extends GeoMapObject implements IPreSave {

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
	private List<Way> ways;
	private List<Waypoint> waypoints;
	private Date updated;
	private Date preparedOn;
	private String preparedBy;
	private OperationalPeriod operationalPeriod;
	private Set<Resource> resources;
	private String primaryFrequency;
	private String secondaryFrequency;
	private Set<Clue> clues = new HashSet<Clue>();

	@SuppressWarnings("rawtypes")
	public static Map<String, Class> classHints = new HashMap<String, Class>();

	static {
		@SuppressWarnings("rawtypes")
		Map<String, Class> m = new HashMap<String, Class>();
		m.putAll(Way.classHints);
		m.put("ways", Way.class);
		m.put("route", Way.class);
		classHints = Collections.unmodifiableMap(m);
	}
	
	public SearchAssignment() {
	}
	
	public SearchAssignment(JSONObject json) {
		from(json);
	}
	
	public void from(JSONObject json) {
		this.from((SearchAssignment) JSONObject.toBean(json, SearchAssignment.class, classHints));
	}
	
	public void from(SearchAssignment updated) {
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
		
//		setResources(updated.getResources());
//		setClues(updated.getClues());

		setPrimaryFrequency(updated.getPrimaryFrequency());
		setSecondaryFrequency(updated.getSecondaryFrequency());
		
		if(updated.getRoute() != null) setRoute(updated.getRoute());
	}
	
	public JSONObject toGPX() {
		return null;
	}
	
	public static SearchAssignment fromGPX(JSONObject gpx) {
		return null;
	}

	@OneToMany
	@Cascade({org.hibernate.annotations.CascadeType.ALL,org.hibernate.annotations.CascadeType.DELETE_ORPHAN})
	@LazyCollection(LazyCollectionOption.FALSE)
	public List<Way> getWays() {
		if(ways == null) ways = new ArrayList<Way>();
		return ways;
	}
	public void setWays(List<Way> ways) {
		this.ways = ways;
	}
	
	@JSONSerializable
	@Transient
	public Way getRoute() {
		if(ways == null) return null;
		for(Way way : ways) {
			if(way.getType() == WayType.ROUTE) return way;
		}
		return null;
	}
	
	@JSONSerializable
	@Transient
	public void setRoute(Way route) {
		Way myroute = getRoute();
		if(myroute == null) {
			myroute = new Way();
			if(this.ways == null) this.ways = new ArrayList<Way>();
			this.ways.add(myroute);
		}
		myroute.from(route);
		myroute.setType(WayType.ROUTE);
	}
	
	@JSONSerializable
	@Transient
	public List<Way> getTracks() {
		if(ways == null) return null;
		ArrayList<Way> tracks = new ArrayList<Way>();
		for(int i = 0; i < ways.size(); i++) {
			Way way = ways.get(i);
			if(way != null && way.getType() == WayType.TRACK) tracks.add(way);
		}
		return tracks;
	}

	@OneToMany
	@Cascade({org.hibernate.annotations.CascadeType.ALL,org.hibernate.annotations.CascadeType.DELETE_ORPHAN})
	@LazyCollection(LazyCollectionOption.FALSE)
	@JSONSerializable
	public List<Waypoint> getWaypoints() {
		if(waypoints == null) waypoints = new ArrayList<Waypoint>();
		return waypoints;
	}
	public void setWaypoints(List<Waypoint> waypoints) {
		this.waypoints = waypoints;
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
		StringBuilder builder = new StringBuilder();
		builder.append("SearchAssignment " + id + ": (" + updated + ")\n[");
		for(Way way : ways) {
			builder.append(way.toString() + ",");
		}
		builder.append("]");
		return builder.toString();
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
	@JSONSerializable
	@Cascade({org.hibernate.annotations.CascadeType.SAVE_UPDATE})
	@LazyCollection(LazyCollectionOption.FALSE)
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
		if(resources.contains(resource)) {
			resources.remove(resource);
			resource.setAssignment(null);
		}
	}
	
	@Transient
	public List<Resource> getPeople() {
		if(resources == null) return null;
		List<Resource> people = new ArrayList<Resource>();
		for(Resource resource : resources) {
			if(resource.getType() == Type.PERSON) people.add(resource);
		}
		return people;
	}

	@Transient
	public List<Resource> getEquipment() {
		if(resources == null) return null;
		List<Resource> equipment = new ArrayList<Resource>();
		for(Resource resource : resources) {
			if(resource.getType() == Type.EQUIPMENT) equipment.add(resource);
		}
		return equipment;
	}
	
	@OneToMany
	@Cascade({org.hibernate.annotations.CascadeType.SAVE_UPDATE})
	@LazyCollection(LazyCollectionOption.FALSE)
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
