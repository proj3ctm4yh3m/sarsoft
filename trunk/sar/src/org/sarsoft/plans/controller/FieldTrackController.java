package org.sarsoft.plans.controller;

import java.util.List;

import net.sf.json.JSONArray;
import net.sf.json.JSONObject;
import net.sf.json.JSONSerializer;

import org.sarsoft.common.Pair;
import org.sarsoft.common.json.JSONForm;
import org.sarsoft.common.model.Way;
import org.sarsoft.common.model.Waypoint;
import org.sarsoft.plans.model.Assignment;
import org.sarsoft.plans.model.FieldTrack;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

@Controller
@RequestMapping("/rest/fieldtrack")
public class FieldTrackController extends AssignmentChildController<FieldTrack> {

	public FieldTrackController() {
		super(FieldTrack.class);
	}
	
	public FieldTrack make(JSONObject json) {
		return new FieldTrack(json);
	}
	
	public Pair<Integer, FieldTrack> fromGPX(JSONObject obj) {
		return FieldTrack.fromGPX(obj);
	}
	
	public String getLabel(FieldTrack track) {
		return track.getLabel() != null ? track.getLabel() : Long.toString(track.getId());
	}
	
	public void removeFrom(Assignment assignment, FieldTrack child) {
		assignment.removeFieldTrack(child);
	}
	
	public void addTo(Assignment assignment, FieldTrack child) {
		assignment.addFieldTrack(child);
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
	public List<FieldTrack> dedupe(List<FieldTrack> removeFrom, List<FieldTrack> checkAgainst) {
		return null;
	}

}
