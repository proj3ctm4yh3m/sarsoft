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
import org.sarsoft.common.model.JSONAnnotatedEntity;
import org.sarsoft.common.model.JSONSerializable;
import org.sarsoft.common.model.MapConfig;
import org.sarsoft.common.model.SarModelObject;
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
public class SearchAssignment extends SarModelObject implements IPreSave {

	public enum ResourceType {
		GROUND,MOUNTED,DOG,OHV
	}

	public enum Status {
		DRAFT,PREPARED,INPROGRESS,COMPLETED
	}

	private String details;
	private ResourceType resourceType;
	private Status status = Status.DRAFT;
	private Long operationalPeriodId;
	private Double timeAllocated;
	private String previousEfforts;
	private String transportation;
	private Set<MapConfig> mapConfigs;
	private Probability responsivePOD;
	private Probability unresponsivePOD;
	private List<Way> ways;
	private List<Waypoint> waypoints;
	private Date updated;
	private Date preparedOn;
	private String preparedBy;
	private OperationalPeriod operationalPeriod;
	private Set<Resource> resources;
	private String primaryFrequency;
	private String secondaryFrequency;

	public static Map<String, Class> classHints = new HashMap<String, Class>();

	static {
		Map<String, Class> m = new HashMap<String, Class>();
		m.putAll(Way.classHints);
		m.put("mapConfigs", MapConfig.class);
		m.put("ways", Way.class);
		classHints = Collections.unmodifiableMap(m);
	}

	public static SearchAssignment createFromJSON(JSONObject json) {
		return (SearchAssignment) JSONObject.toBean(json, SearchAssignment.class, classHints);
	}

	@OneToMany
	@Cascade({org.hibernate.annotations.CascadeType.ALL,org.hibernate.annotations.CascadeType.DELETE_ORPHAN})
	@LazyCollection(LazyCollectionOption.FALSE)
	@JSONSerializable
	public List<Way> getWays() {
		if(ways == null) ways = new ArrayList<Way>();
		return ways;
	}
	public void setWays(List<Way> ways) {
		this.ways = ways;
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
	public Double getTimeAllocated() {
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

	@Transient
	@JSONSerializable
	public double getArea() {
		double area = 0;
		for(Way way : ways) {
			if(way.getType() == WayType.ROUTE && way.isPolygon() == true)
				area += way.getArea();
		}
		return area;
	}

	@Transient
	@JSONSerializable
	public double getDistance() {
		return getRouteDistance();
	}

	@Transient
	@JSONSerializable
	public double getTrackDistance() {
		double distance = 0;
		for(Way way : ways) {
			if(way.getType() == WayType.TRACK) distance += way.getDistance();
		}
		return distance;
	}

	@Transient
	@JSONSerializable
	public double getRouteDistance() {
		double distance = 0;
		for(Way way : ways) {
			if(way.getType() == WayType.ROUTE) distance += way.getDistance();
		}
		return distance;
	}

	@Transient
	@JSONSerializable
	public String getFormattedSize() {
		for(Way way : ways) {
			if(way.getType() == WayType.ROUTE) {
				if(way.isPolygon()) {
					return way.getArea() + " km&sup2;";
				} else {
					return way.getDistance() + " km";
				}
			}
		}
		return "--";
	}

	@Transient
	@JSONSerializable
	public Waypoint[] getBoundingBox() {
		Waypoint[] box = ways.get(0).getBoundingBox();
		for(Way way : ways) {
			Waypoint[] bound = way.getBoundingBox();
			if(bound != null) {
				if(bound[0].getLat() < box[0].getLat()) box[0] = new Waypoint(bound[0].getLat(), box[0].getLng());
				if(bound[0].getLng() < box[0].getLng()) box[0] = new Waypoint(box[0].getLat(), bound[0].getLng());
				if(bound[1].getLat() > box[1].getLat()) box[1] = new Waypoint(bound[1].getLat(), box[1].getLng());
				if(bound[1].getLng() > box[1].getLng()) box[1] = new Waypoint(box[1].getLat(), bound[1].getLng());
			}
		}
		return box;
	}

	@OneToMany
	@JSONSerializable
	@Cascade({org.hibernate.annotations.CascadeType.ALL})
	@LazyCollection(LazyCollectionOption.FALSE)
	public Set<MapConfig> getMapConfigs() {
		return mapConfigs;
	}

	public void setMapConfigs(Set<MapConfig> mapConfigs) {
		this.mapConfigs = mapConfigs;
	}

	@OneToMany
	@JSONSerializable
	@Cascade({org.hibernate.annotations.CascadeType.ALL})
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
