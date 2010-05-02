package org.sarsoft.plans.model;

import java.util.Collections;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import javax.persistence.ManyToOne;
import javax.persistence.OneToMany;
import javax.persistence.Transient;

import org.sarsoft.common.model.IPreSave;
import org.sarsoft.common.model.JSONAnnotatedEntity;
import org.sarsoft.common.model.JSONSerializable;
import org.sarsoft.common.model.MapConfig;
import org.sarsoft.common.model.Way;
import org.sarsoft.common.model.WayType;
import org.sarsoft.common.model.Waypoint;
import net.sf.json.JSONObject;

import org.hibernate.annotations.Cascade;
import org.hibernate.annotations.GenericGenerator;
import org.hibernate.annotations.LazyCollection;
import org.hibernate.annotations.LazyCollectionOption;

@JSONAnnotatedEntity
@Entity
public class SearchAssignment implements IPreSave {

	public enum ResourceType {
		GROUND,MOUNTED,DOG,OHV
	}

	public enum Status {
		DRAFT,PREPARED,INPROGRESS,COMPLETED
	}

	private Long id;
	private String name;
	private String details;
	private ResourceType resourceType;
	private Status status = Status.DRAFT;
	private Integer operationalPeriodId;
	private long timeAllocated = 0;
	private String transportation;
	private Set<MapConfig> mapConfigs;
	private Probability responsivePOD;
	private Probability unresponsivePOD;
	private List<Way> ways;
	private Date updated;
	private Date preparedOn;
	private String preparedBy;
	private OperationalPeriod operationalPeriod;

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
	@Cascade({org.hibernate.annotations.CascadeType.ALL})
	@LazyCollection(LazyCollectionOption.FALSE)
	@JSONSerializable
	public List<Way> getWays() {
		return ways;
	}
	public void setWays(List<Way> ways) {
		this.ways = ways;
	}
	@Id
	@JSONSerializable
	@GenericGenerator(name = "generator", strategy="increment")
	@GeneratedValue(generator="generator")
	public Long getId() {
		return id;
	}
	public void setId(Long id) {
		this.id = id;
	}
	@JSONSerializable
	public String getName() {
		return name;
	}
	public void setName(String name) {
		this.name = name;
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
		builder.append("SearchAssignment " + id + ": (" + name + ", " + updated + ")\n[");
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
	public long getTimeAllocated() {
		return timeAllocated;
	}

	public void setTimeAllocated(long timeAllocated) {
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
	public Integer getOperationalPeriodId() {
		if(operationalPeriodId != null) return operationalPeriodId;
		return (operationalPeriod == null) ? null : operationalPeriod.getId();
	}

	public void setOperationalPeriodId(Integer operationalPeriodId) {
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
			area += way.getArea();
		}
		return area;
	}

	@Transient
	@JSONSerializable
	public double getDistance() {
		double distance = 0;
		for(Way way : ways) {
			distance += way.getDistance();
		}
		return distance;
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
	public Waypoint[] getBoundingBox() {
		Waypoint[] box = ways.get(0).getBoundingBox();
		for(Way way : ways) {
			Waypoint[] bound = way.getBoundingBox();
			if(bound[0].getLat() < box[0].getLat()) box[0] = new Waypoint(bound[0].getLat(), box[0].getLng());
			if(bound[0].getLng() < box[0].getLng()) box[0] = new Waypoint(box[0].getLat(), bound[0].getLng());
			if(bound[1].getLat() > box[1].getLat()) box[1] = new Waypoint(bound[1].getLat(), box[1].getLng());
			if(bound[1].getLng() > box[1].getLng()) box[1] = new Waypoint(box[1].getLat(), bound[1].getLng());
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

}