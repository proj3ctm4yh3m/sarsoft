package org.sarsoft.plans.controller;

import java.util.List;

import javax.servlet.http.HttpServletRequest;

import net.sf.json.JSONObject;

import org.sarsoft.common.Pair;
import org.sarsoft.common.gpx.StyledGeoObject;
import org.sarsoft.common.gpx.StyledWaypoint;
import org.sarsoft.common.json.JSONForm;
import org.sarsoft.plans.model.Assignment;
import org.sarsoft.plans.model.FieldWaypoint;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

@Controller
@RequestMapping("/rest/fieldwpt")
public class FieldWaypointController extends AssignmentChildController<FieldWaypoint> {

	public FieldWaypointController() {
		super(FieldWaypoint.class);
	}
	
	public FieldWaypoint make(JSONObject json) {
		return new FieldWaypoint(json);
	}
	
	public Pair<Integer, FieldWaypoint> fromStyledGeo(StyledGeoObject obj) {
		if(obj instanceof StyledWaypoint) return FieldWaypoint.from((StyledWaypoint) obj);
		return null;
	}
	
	public String getLabel(FieldWaypoint fwpt) {
		return fwpt.getLabel() != null ? fwpt.getLabel() : Long.toString(fwpt.getId());
	}
	
	public void removeFrom(Assignment assignment, FieldWaypoint child) {
		assignment.removeFieldWaypoint(child);
	}
	
	public void addTo(Assignment assignment, FieldWaypoint child) {
		assignment.addFieldWaypoint(child);
	}
	
	@RequestMapping(value="/{id}/position", method = RequestMethod.POST)
	public String updatePosition(JSONForm params, Model model, @PathVariable("id") long id, HttpServletRequest request) {
		FieldWaypoint fwpt = dao.load(FieldWaypoint.class, id);
		fwpt.from(params.JSON());
		dao.save(fwpt);
		return json(model, fwpt);
	}
	
	@Override
	public List<FieldWaypoint> dedupe(List<FieldWaypoint> removeFrom, List<FieldWaypoint> checkAgainst) {
		return null;
	}

}
