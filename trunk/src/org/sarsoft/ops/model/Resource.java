package org.sarsoft.ops.model;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import javax.persistence.Entity;
import javax.persistence.ManyToOne;
import javax.persistence.OneToMany;
import javax.persistence.OneToOne;
import javax.persistence.Transient;

import org.hibernate.annotations.Cascade;
import org.hibernate.annotations.LazyCollection;
import org.hibernate.annotations.LazyCollectionOption;
import org.sarsoft.common.model.IPreSave;
import org.sarsoft.common.model.JSONAnnotatedEntity;
import org.sarsoft.common.model.JSONSerializable;
import org.sarsoft.common.model.SarModelObject;
import org.sarsoft.common.model.Waypoint;
import org.sarsoft.plans.model.OperationalPeriod;
import org.sarsoft.plans.model.SearchAssignment;

@Entity
@JSONAnnotatedEntity
public class Resource extends SarModelObject {

	protected String name;
	protected List<LocationEnabledDevice> locators;
	protected Waypoint plk;
	protected SearchAssignment assignment;
	protected Date updated;

	@OneToMany
	@Cascade({org.hibernate.annotations.CascadeType.ALL})
	@LazyCollection(LazyCollectionOption.FALSE)
	public List<LocationEnabledDevice> getLocators() {
		if(locators == null) locators = new ArrayList<LocationEnabledDevice>();
		return locators;
	}
	public void setLocators(List<LocationEnabledDevice> locators) {
		this.locators = locators;
	}
	@JSONSerializable
	public String getName() {
		return name;
	}
	public void setName(String name) {
		this.name = name;
	}

	@JSONSerializable
	@OneToOne
	@Cascade({org.hibernate.annotations.CascadeType.ALL})
	public Waypoint getPlk() {
		return plk;
	}

	public void setPlk(Waypoint plk) {
		this.plk = plk;
	}

	@Transient
	@JSONSerializable
	public Long getAssignmentId() {
		return (assignment == null) ? null : assignment.getId();
	}

	@ManyToOne
	public SearchAssignment getAssignment() {
		return assignment;
	}

	public void setAssignment(SearchAssignment assignment) {
		this.assignment = assignment;
	}

	@JSONSerializable
	public Date getUpdated() {
		return updated;
	}
	public void setUpdated(Date updated) {
		this.updated = updated;
	}


}
