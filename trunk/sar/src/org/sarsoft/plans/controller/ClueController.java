package org.sarsoft.plans.controller;

import java.util.List;

import javax.servlet.http.HttpServletRequest;

import net.sf.json.JSONObject;

import org.sarsoft.common.controller.GeoMapObjectController;
import org.sarsoft.common.json.JSONForm;
import org.sarsoft.common.model.MapObject;
import org.sarsoft.plans.model.AssignmentChildObject;
import org.sarsoft.plans.model.Clue;
import org.sarsoft.plans.model.Assignment;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

@Controller
@RequestMapping("/rest/clue")
public class ClueController extends AssignmentChildController {

	public ClueController() {
		super(Clue.class);
	}
	
	public Clue make(JSONObject json) {
		return new Clue(json);
	}
	
	public JSONObject toGPX(MapObject obj) {
		return ((Clue) obj).toGPX();
	}
	
	public MapObject fromGPX(JSONObject obj) {
		return Clue.fromGPX(obj);
	}
	
	public String getLabel(MapObject object) {
		Clue clue = (Clue) object;
		return clue.getSummary() != null ? clue.getSummary() : Long.toString(clue.getId());
	}

	public void removeFrom(Assignment assignment, AssignmentChildObject child) {
		assignment.removeClue((Clue) child);
	}
	
	public void addTo(Assignment assignment, AssignmentChildObject child) {
		assignment.addClue((Clue) child);
	}
	
	@RequestMapping(value="/{id}/position", method = RequestMethod.POST)
	public String updatePosition(JSONForm params, Model model, @PathVariable("id") long id, HttpServletRequest request) {
		Clue clue = dao.load(Clue.class, id);
		clue.from(params.JSON());
		dao.save(clue);
		return json(model, clue);
	}

	@Override
	public <T extends MapObject> List<MapObject> dedupe(List<T> removeFrom,
			List<T> checkAgainst) {
		// TODO Auto-generated method stub
		return null;
	}

}
