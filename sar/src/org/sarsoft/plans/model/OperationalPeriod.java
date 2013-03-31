package org.sarsoft.plans.model;

import java.util.HashSet;
import java.util.Set;

import javax.persistence.Entity;
import javax.persistence.OneToMany;

import net.sf.json.JSONObject;

import org.hibernate.annotations.Cascade;
import org.hibernate.annotations.LazyCollection;
import org.hibernate.annotations.LazyCollectionOption;
import org.sarsoft.common.json.JSONAnnotatedEntity;
import org.sarsoft.common.json.JSONSerializable;
import org.sarsoft.common.model.MapObject;

@JSONAnnotatedEntity
@Entity
public class OperationalPeriod extends MapObject {

	private String description;
	private Set<Assignment> assignments = new HashSet<Assignment>();

	public OperationalPeriod() {	
	}
	
	public OperationalPeriod(JSONObject json) {
		from(json);
	}
	
	public void from(JSONObject json) {
		from((OperationalPeriod) JSONObject.toBean(json, OperationalPeriod.class));
	}
	
	public void from(OperationalPeriod updated) {
		setDescription(updated.getDescription());
	}
	
	@JSONSerializable
	public String getDescription() {
		return description;
	}

	public void setDescription(String description) {
		this.description = description;
	}

	@OneToMany(mappedBy="operationalPeriod")
	@Cascade({org.hibernate.annotations.CascadeType.SAVE_UPDATE})
	@LazyCollection(LazyCollectionOption.TRUE)
	public Set<Assignment> getAssignments() {
		return assignments;
	}

	public void setAssignments(Set<Assignment> assignments) {
		this.assignments = assignments;
	}

	public void addAssignment(Assignment assignment) {
		this.assignments.add(assignment);
		assignment.setOperationalPeriod(this);
	}

	public void removeAssignment(Assignment assignment) {
		this.assignments.remove(assignment);
		assignment.setOperationalPeriod(null);
	}

}
