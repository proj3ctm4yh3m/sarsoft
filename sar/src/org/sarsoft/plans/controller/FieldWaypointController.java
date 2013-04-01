package org.sarsoft.plans.controller;

import java.util.List;

import net.sf.json.JSONObject;

import org.sarsoft.common.model.MapObject;
import org.sarsoft.plans.model.Assignment;
import org.sarsoft.plans.model.AssignmentChildObject;
import org.sarsoft.plans.model.FieldWaypoint;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/rest/fieldwpt")
public class FieldWaypointController extends AssignmentChildController {

	public FieldWaypointController() {
		super(FieldWaypoint.class);
	}
	
	public FieldWaypoint make(JSONObject json) {
		return new FieldWaypoint(json);
	}
	
	public JSONObject toGPX(MapObject obj) {
		return ((FieldWaypoint) obj).toGPX();
	}
	
	public MapObject fromGPX(JSONObject obj) {
		return FieldWaypoint.fromGPX(obj);
	}
	
	public String getLabel(MapObject object) {
		FieldWaypoint fwpt = (FieldWaypoint) object;
		return fwpt.getLabel() != null ? fwpt.getLabel() : Long.toString(fwpt.getId());
	}
	
	public void removeFrom(Assignment assignment, AssignmentChildObject child) {
		assignment.removeFieldWaypoint((FieldWaypoint) child);
	}
	
	public void addTo(Assignment assignment, AssignmentChildObject child) {
		assignment.addFieldWaypoint((FieldWaypoint) child);
	}

	@Override
	public <T extends MapObject> List<MapObject> dedupe(List<T> removeFrom,
			List<T> checkAgainst) {
		// TODO Auto-generated method stub
		return null;
	}

}
