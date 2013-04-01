package org.sarsoft.plans.controller;

import java.util.List;

import net.sf.json.JSONObject;

import org.sarsoft.common.model.MapObject;
import org.sarsoft.plans.model.Assignment;
import org.sarsoft.plans.model.AssignmentChildObject;
import org.sarsoft.plans.model.FieldTrack;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/rest/fieldtrack")
public class FieldTrackController extends AssignmentChildController {

	public FieldTrackController() {
		super(FieldTrack.class);
	}
	
	public FieldTrack make(JSONObject json) {
		return new FieldTrack(json);
	}
	
	public JSONObject toGPX(MapObject obj) {
		return ((FieldTrack) obj).toGPX();
	}
	
	public MapObject fromGPX(JSONObject obj) {
		return FieldTrack.fromGPX(obj);
	}
	
	public String getLabel(MapObject object) {
		FieldTrack fwpt = (FieldTrack) object;
		return fwpt.getLabel() != null ? fwpt.getLabel() : Long.toString(fwpt.getId());
	}
	
	public void removeFrom(Assignment assignment, AssignmentChildObject child) {
		assignment.removeFieldTrack((FieldTrack) child);
	}
	
	public void addTo(Assignment assignment, AssignmentChildObject child) {
		assignment.addFieldTrack((FieldTrack) child);
	}

	@Override
	public <T extends MapObject> List<MapObject> dedupe(List<T> removeFrom,
			List<T> checkAgainst) {
		// TODO Auto-generated method stub
		return null;
	}

}
