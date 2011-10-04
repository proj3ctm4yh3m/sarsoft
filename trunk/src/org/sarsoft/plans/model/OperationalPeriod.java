package org.sarsoft.plans.model;

import java.util.Date;
import java.util.HashSet;
import java.util.Set;

import javax.persistence.Entity;
import javax.persistence.OneToMany;
import javax.persistence.Transient;

import net.sf.json.JSONObject;

import org.hibernate.annotations.Cascade;
import org.hibernate.annotations.LazyCollection;
import org.hibernate.annotations.LazyCollectionOption;
import org.sarsoft.common.model.JSONAnnotatedEntity;
import org.sarsoft.common.model.JSONSerializable;
import org.sarsoft.common.model.SarModelObject;
import org.sarsoft.common.model.Waypoint;

@JSONAnnotatedEntity
@Entity
public class OperationalPeriod extends SarModelObject {

	private String description;
	private Date start;
	private Set<SearchAssignment> assignments = new HashSet<SearchAssignment>();

	public static OperationalPeriod createFromJSON(JSONObject json) {
		return (OperationalPeriod) JSONObject.toBean(json, OperationalPeriod.class);
	}

	@JSONSerializable
	public String getDescription() {
		return description;
	}

	public void setDescription(String description) {
		this.description = description;
	}

	@JSONSerializable
	public Date getStart() {
		return start;
	}

	public void setStart(Date start) {
		this.start = start;
	}

	@OneToMany(mappedBy="operationalPeriod")
	@Cascade({org.hibernate.annotations.CascadeType.ALL,org.hibernate.annotations.CascadeType.DELETE_ORPHAN})
	@LazyCollection(LazyCollectionOption.FALSE)
	public Set<SearchAssignment> getAssignments() {
		return assignments;
	}

	public void setAssignments(Set<SearchAssignment> assignments) {
		this.assignments = assignments;
	}

	public void addAssignment(SearchAssignment assignment) {
		this.assignments.add(assignment);
		assignment.setOperationalPeriod(this);
	}

	public void removeAssignment(SearchAssignment assignment) {
		this.assignments.remove(assignment);
		assignment.setOperationalPeriod(null);
	}

	@Transient
	@JSONSerializable
	public double getArea() {
		double area = 0;
		if(assignments == null) return area;
		for(SearchAssignment assignment : assignments) {
			area += assignment.getArea();
		}
		return area;
	}
	
	@Transient
	@JSONSerializable
	public double getPerimeter() {
		double perimeter = 0;
		if(assignments == null) return perimeter;
		for(SearchAssignment assignment : assignments) {
			if(!assignment.isPolygon()) perimeter += assignment.getRouteDistance();
		}
		return perimeter;
	}

	@Transient
	@JSONSerializable
	public double getTrackDistance() {
		double trackDistance = 0;
		if(assignments == null) return trackDistance;
		for(SearchAssignment assignment : assignments) {
			trackDistance += assignment.getTrackDistance();
		}
		return trackDistance;
	}


	@Transient
	@JSONSerializable
	public Waypoint[] getBoundingBox() {
		Waypoint[] box = null;
		for(SearchAssignment assignment : assignments) {
			if(box == null) box = assignment.getBoundingBox();
			Waypoint[] bound = assignment.getBoundingBox();
			if(bound[0].getLat() < box[0].getLat()) box[0] = new Waypoint(bound[0].getLat(), box[0].getLng());
			if(bound[0].getLng() < box[0].getLng()) box[0] = new Waypoint(box[0].getLat(), bound[0].getLng());
			if(bound[1].getLat() > box[1].getLat()) box[1] = new Waypoint(bound[1].getLat(), box[1].getLng());
			if(bound[1].getLng() > box[1].getLng()) box[1] = new Waypoint(box[1].getLat(), bound[1].getLng());
		}
		return box;
	}


	@Transient
	@JSONSerializable
	public long getTimeAllocated() {
		if(assignments == null) return 0;
		double time = 0;
		for(SearchAssignment assignment : assignments) {
			time += assignment.getTimeAllocated();
		}
		return Math.round(time);
	}

	@Transient
	@JSONSerializable
	public int getNumAssignments() {
		return (assignments == null) ? 0 : assignments.size();
	}
}
