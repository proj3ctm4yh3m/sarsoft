package org.sarsoft.plans.model;

import java.util.Date;
import java.util.Set;

import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import javax.persistence.OneToMany;
import javax.persistence.Transient;

import org.hibernate.annotations.Cascade;
import org.hibernate.annotations.GenericGenerator;
import org.hibernate.annotations.LazyCollection;
import org.hibernate.annotations.LazyCollectionOption;

import org.sarsoft.common.model.JSONAnnotatedEntity;
import org.sarsoft.common.model.JSONSerializable;
import org.sarsoft.common.model.Way;
import org.sarsoft.common.model.Waypoint;
import org.sarsoft.plans.controller.SearchAssignmentController;
import net.sf.json.JSONObject;

@JSONAnnotatedEntity
@Entity
public class OperationalPeriod {

	private Integer id;
	private String description;
	private Date start;
	private Set<SearchAssignment> assignments;

	public static OperationalPeriod createFromJSON(JSONObject json) {
		return (OperationalPeriod) JSONObject.toBean(json, OperationalPeriod.class);
	}

	@Id
	@JSONSerializable
	public Integer getId() {
		return id;
	}

	public void setId(Integer id) {
		this.id = id;
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
	@Cascade({org.hibernate.annotations.CascadeType.ALL})
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
	public long getTimeAllocated() {
		long time = 0;
		if(assignments == null) return time;
		for(SearchAssignment assignment : assignments) {
			time += assignment.getTimeAllocated();
		}
		return time;
	}

	@Transient
	@JSONSerializable
	public int getNumAssignments() {
		return (assignments == null) ? 0 : assignments.size();
	}
}
