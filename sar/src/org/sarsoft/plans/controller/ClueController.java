package org.sarsoft.plans.controller;

import java.util.List;

import javax.servlet.http.HttpServletRequest;

import net.sf.json.JSONObject;

import org.sarsoft.common.Pair;
import org.sarsoft.common.gpx.StyledGeoObject;
import org.sarsoft.common.gpx.StyledWaypoint;
import org.sarsoft.common.json.JSONForm;
import org.sarsoft.plans.model.Clue;
import org.sarsoft.plans.model.Assignment;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

@Controller
@RequestMapping("/rest/clue")
public class ClueController extends AssignmentChildController<Clue> {

	public ClueController() {
		super(Clue.class);
	}
	
	public Clue make(JSONObject json) {
		return new Clue(json);
	}
	
	public Pair<Integer, Clue> fromStyledGeo(StyledGeoObject obj) {
		if(obj instanceof StyledWaypoint) return Clue.from((StyledWaypoint) obj);
		return null;
	}
	
	public String getLabel(Clue clue) {
		return clue.getSummary() != null ? clue.getSummary() : Long.toString(clue.getId());
	}

	public void removeFrom(Assignment assignment, Clue child) {
		assignment.removeClue(child);
	}
	
	public void addTo(Assignment assignment, Clue child) {
		assignment.addClue(child);
	}
		
	@RequestMapping(value="/{id}/position", method = RequestMethod.POST)
	public String updatePosition(JSONForm params, Model model, @PathVariable("id") long id, HttpServletRequest request) {
		Clue clue = dao.load(Clue.class, id);
		clue.from(params.JSON());
		dao.save(clue);
		return json(model, clue);
	}

	@Override
	public List<Clue> dedupe(List<Clue> removeFrom, List<Clue> checkAgainst) {
		return null;
	}


}
