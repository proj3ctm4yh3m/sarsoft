package org.sarsoft.plans.controller;

import org.sarsoft.common.controller.GeoMapObjectController;
import org.sarsoft.common.model.MapObject;
import org.sarsoft.plans.model.Assignment;
import org.sarsoft.plans.model.AssignmentChildObject;

public abstract class AssignmentChildController extends GeoMapObjectController {

	public AssignmentChildController(Class<? extends AssignmentChildObject> c) {
		super(c);
	}
	
	public abstract void removeFrom(Assignment assignment, AssignmentChildObject aco);
	public abstract void addTo(Assignment assignemnt, AssignmentChildObject aco);
	
	public void link(MapObject obj) {
		AssignmentChildObject child = (AssignmentChildObject) obj;
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
	
	public void unlink(MapObject obj) {
		AssignmentChildObject child = (AssignmentChildObject) obj;
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
