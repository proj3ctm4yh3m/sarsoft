package org.sarsoft.plans.controller;

import org.sarsoft.common.controller.GeoMapObjectController;
import org.sarsoft.plans.model.Assignment;
import org.sarsoft.plans.model.AssignmentChildObject;

public abstract class AssignmentChildController <T extends AssignmentChildObject> extends GeoMapObjectController<T> {

	public AssignmentChildController(Class<T> cls) {
		super(cls);
	}
	
	public abstract void removeFrom(Assignment assignment, T aco);
	public abstract void addTo(Assignment assignemnt, T aco);
	
	public void link(T child) {
		Long id = child.getAssignmentId();
		Assignment assignment = child.getAssignment();
		if(assignment != null && !id.equals(assignment.getId())) {
			removeFrom(assignment, child);
			dao.save(assignment);
			assignment = null;
		}
		if(assignment == null && id != null) {
			assignment = dao.load(Assignment.class, id);
			addTo(assignment, child);
			dao.save(assignment);
		}
	}
	
	public void unlink(T child) {
		Assignment assignment = child.getAssignment();
		if(assignment != null) {
			removeFrom(assignment, child);
			dao.save(assignment);
		}
	}

	public String[] getLinkDependencies() {
		return new String[] { "Assignment" };
	}

}
