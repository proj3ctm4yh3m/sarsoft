package org.sarsoft.plans.model;

import javax.persistence.ManyToOne;
import javax.persistence.MappedSuperclass;
import javax.persistence.Transient;

import org.sarsoft.common.json.JSONSerializable;
import org.sarsoft.common.model.GeoMapObject;

@MappedSuperclass
public abstract class AssignmentChildObject extends GeoMapObject {

	private Long assignmentId;
	private Assignment assignment;

	@Transient
	@JSONSerializable
	public Long getAssignmentId() {
		if(assignmentId != null) return assignmentId;
		return (assignment == null) ? null : assignment.getId();
	}
	
	public void setAssignmentId(Long id) {
		this.assignmentId = id;
	}
	
	@ManyToOne
	public Assignment getAssignment() {
		return assignment;
	}
	
	public void setAssignment(Assignment assignment) {
		this.assignment = assignment;
	}

}
