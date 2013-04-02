package org.sarsoft.plans.controller;

import java.util.List;

import javax.servlet.http.HttpServletRequest;

import net.sf.json.JSONObject;

import org.sarsoft.common.json.JSONForm;
import org.sarsoft.common.model.MapObject;
import org.sarsoft.plans.model.Assignment;
import org.sarsoft.plans.model.AssignmentChildObject;
import org.sarsoft.plans.model.FieldWaypoint;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

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
	
	@RequestMapping(value="/{id}/position", method = RequestMethod.POST)
	public String updatePosition(JSONForm params, Model model, @PathVariable("id") long id, HttpServletRequest request) {
		FieldWaypoint fwpt = dao.load(FieldWaypoint.class, id);
		fwpt.from(params.JSON());
		dao.save(fwpt);
		return json(model, fwpt);
	}
	
	@Override
	public <T extends MapObject> List<MapObject> dedupe(List<T> removeFrom,
			List<T> checkAgainst) {
		// TODO Auto-generated method stub
		return null;
	}

}
