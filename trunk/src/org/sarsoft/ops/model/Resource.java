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
import org.sarsoft.common.model.JSONAnnotatedEntity;
import org.sarsoft.common.model.JSONSerializable;
import org.sarsoft.common.model.SarModelObject;
import org.sarsoft.common.model.Waypoint;
import org.sarsoft.plans.model.SearchAssignment;

@Entity
@JSONAnnotatedEntity
public class Resource extends SarModelObject {

	public enum Section {
		ENROUTE, CP, REHAB, FIELD
	}

	protected String name;
	protected List<LocationEnabledDevice> locators;
	protected Waypoint plk;
	protected SearchAssignment assignment;
	protected Date updated;
	protected Section section;

	@OneToMany
	@Cascade({org.hibernate.annotations.CascadeType.SAVE_UPDATE, org.hibernate.annotations.CascadeType.PERSIST, org.hibernate.annotations.CascadeType.DELETE_ORPHAN})
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
	public Section getSection() {
		return section;
	}
	public void setSection(Section section) {
		this.section = section;
	}

	@JSONSerializable
	@OneToOne
	@Cascade({org.hibernate.annotations.CascadeType.SAVE_UPDATE, org.hibernate.annotations.CascadeType.PERSIST, org.hibernate.annotations.CascadeType.DELETE_ORPHAN})
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

	@JSONSerializable
	@Transient
	public String getLocatorDesc() {
		String desc = "";
		boolean first = true;
		for(LocationEnabledDevice locator : locators) {
			if(first) {
				first = false;
			} else {
				desc += ", ";
			}
			desc += locator.getDescription();
		}
		return desc;
	}

}
