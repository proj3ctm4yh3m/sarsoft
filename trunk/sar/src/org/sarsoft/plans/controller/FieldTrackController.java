package org.sarsoft.plans.controller;

import java.util.List;

import net.sf.json.JSONArray;
import net.sf.json.JSONObject;
import net.sf.json.JSONSerializer;

import org.sarsoft.common.json.JSONForm;
import org.sarsoft.common.model.MapObject;
import org.sarsoft.common.model.Way;
import org.sarsoft.common.model.Waypoint;
import org.sarsoft.plans.model.Assignment;
import org.sarsoft.plans.model.AssignmentChildObject;
import org.sarsoft.plans.model.FieldTrack;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

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
	
	@SuppressWarnings({ "unchecked", "deprecation" })
	@RequestMapping(value="/{id}/way", method = RequestMethod.POST)
	public String updateWay(JSONForm params, @PathVariable("id") long id, Model model) {
		FieldTrack track = dao.load(FieldTrack.class, id);
		Way way = track.getWay();
		way.softCopy((List<Waypoint>) JSONArray.toList((JSONArray) JSONSerializer.toJSON(params.getJson()), Waypoint.class));
		dao.save(track);
		return json(model, way);
	}
	

	@Override
	public <T extends MapObject> List<MapObject> dedupe(List<T> removeFrom,
			List<T> checkAgainst) {
		// TODO Auto-generated method stub
		return null;
	}

}
