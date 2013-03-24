package org.sarsoft.plans.controller;

import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;

import net.sf.json.JSONObject;

import org.sarsoft.common.controller.JSONBaseController;
import org.sarsoft.common.controller.JSONForm;
import org.sarsoft.common.model.Action;
import org.sarsoft.common.model.Format;
import org.sarsoft.common.model.Waypoint;
import org.sarsoft.common.util.RuntimeProperties;
import org.sarsoft.plans.model.Clue;
import org.sarsoft.plans.model.Search;
import org.sarsoft.plans.model.SearchAssignment;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
public class ClueController extends JSONBaseController {

	@RequestMapping(value="/clue", method = RequestMethod.GET)
	public String getClueList(Model model, @RequestParam(value="format", required=false) Format format) {
		model.addAttribute("clues", dao.loadAll(Clue.class));
		model.addAttribute("assignments", dao.loadAll(SearchAssignment.class));
		if(format == Format.PRINT) return app(model, "Clue.Log");
		return app(model, "Clue.List");
	}
	
	public Clue createClue(String description, String summary, String location, Long assignmentId, Clue.Disposition instructions, Waypoint wpt) {
		long maxId = 0L;
		List<Clue> clues = dao.loadAll(Clue.class);
		for(Clue clue : clues) {
			maxId = Math.max(maxId, clue.getId());
		}
		
		Clue clue = new Clue();
		clue.setId(maxId+1);
		clue.setDescription(description);
		clue.setSummary(summary);
		clue.setInstructions(instructions);
		clue.setLocation(location);
		clue.setPosition(wpt);
		
		return clue;
	}
	
	@RequestMapping(value="/clue/new", method = RequestMethod.POST)
	public String createClue(Model model, HttpServletRequest request,
			@RequestParam(value="description", required=false) String description,
			@RequestParam(value="summary", required=true) String summary,
			@RequestParam(value="location", required=false) String location,
			@RequestParam(value="assignmentid", required=false) Long assignmentId,
			@RequestParam(value="instructions", required=false) Clue.Disposition instructions,
			@RequestParam(value="lat", required=false) Double lat,
			@RequestParam(value="lng", required=false) Double lng,
			@RequestParam(value="wptid", required=false) Long wptid) {
		
		Waypoint waypoint = null;
		if(lat != null && lng != null && lat != 0) {
			waypoint = new Waypoint(lat, lng);
		}
		Clue clue = createClue(description, summary, location, assignmentId, instructions, waypoint);
				
		dao.save(clue);
		
		if(assignmentId != null) {
			SearchAssignment assignment = dao.load(SearchAssignment.class, assignmentId);
			if(assignment != null) {
				assignment.addClue(clue);
				if(wptid != null) {
					Waypoint wpt = dao.load(Waypoint.class, wptid);
					if(wpt != null && assignment.getWaypoints().contains(wpt)) assignment.getWaypoints().remove(wpt);
				}
				dao.save(assignment);
			}
		}

		if(wptid != null) return getClue(model, clue.getId());
		return "redirect:/clue";
	}
	
	@RequestMapping(value="/rest/clue", method = RequestMethod.POST)
	public String createRestClue(Model model, JSONForm params) {

		JSONObject obj = params.JSON();
		JSONObject pos = obj.getJSONObject("position");
		
		Waypoint waypoint = null;
		if(pos.getString("lat") != null && pos.getString("lng") != null && pos.getDouble("lat") != 0) {
			waypoint = new Waypoint(pos.getDouble("lat"), pos.getDouble("lng"));
		}
		Clue clue = createClue(obj.getString("description"), obj.getString("summary"), obj.getString("location"), null, Clue.Disposition.valueOf(obj.getString("instructions")), waypoint);

		dao.save(clue);
		
		return json(model, clue);
	}
	
	
	@RequestMapping(value="/clue/{clueid}", method = RequestMethod.GET)
	public String getClue(Model model, @PathVariable("clueid") long clueid) {
		Clue clue = dao.load(Clue.class, clueid);
		model.addAttribute("clue", clue);
		model.addAttribute("assignments", dao.loadAll(SearchAssignment.class));
		return app(model, "Clue.Detail");
	}
	
	@RequestMapping(value="/rest/clue/{clueid}", method = RequestMethod.POST)
	public String updateClue(Model model, @PathVariable("clueid") long clueid, JSONForm params, HttpServletRequest request) {
		Clue clue = dao.load(Clue.class, clueid);

		if(request.getParameter("action") != null && Action.valueOf(request.getParameter("action").toUpperCase()) == Action.DELETE) {
			if(clue.getAssignment() != null) {
				SearchAssignment assignment = clue.getAssignment();
				assignment.removeClue(clue);
				dao.save(assignment);
			}
			dao.delete(clue);
			return json(model, new Object());
		}

		
		Clue updated = Clue.createFromJSON(params.JSON());
		
		clue.setDescription(updated.getDescription());
		clue.setSummary(updated.getSummary());
		clue.setLocation(updated.getLocation());
		clue.setInstructions(updated.getInstructions());
		
		Long aid = null;
		try {
			aid = params.JSON().getLong("assignmentId");
		} catch (Exception e) {/* null aid will throw a JSONException */}

		if((clue.getAssignment() != null && aid != clue.getAssignment().getId())) {
			SearchAssignment assignment = clue.getAssignment();
			assignment.removeClue(clue);
			dao.save(assignment);
		}

		if(aid != null && (clue.getAssignment() == null || aid != clue.getAssignment().getId())) {
			SearchAssignment assignment = dao.load(SearchAssignment.class, aid);
			if(assignment != null) {
				assignment.addClue(clue);
				dao.save(assignment);
			}
		}
		
		dao.save(clue);

		return json(model, clue);
	}

	@RequestMapping(value="/rest/clue/{clueid}", method = RequestMethod.GET)
	public String getRestClue(Model model, @PathVariable("clueid") long clueid) {
		return json(model, dao.load(Clue.class, clueid));
	}
	
	@SuppressWarnings("rawtypes")
	@RequestMapping(value="/rest/clue/{clueid}/position", method = RequestMethod.POST)
	public String restUpdateClueLocation(Model model, @PathVariable("clueid") long clueid, JSONForm params) {
		Map<String, Class> classHints = new HashMap<String, Class>();
		classHints.put("position", Waypoint.class);
		Map m = (Map) JSONObject.toBean(params.JSON(), HashMap.class, classHints);
		Waypoint position = (Waypoint) m.get("position");

		Clue clue = dao.load(Clue.class, clueid);
		clue.setPosition(position);
		
		dao.save(clue);
		
		return json(model, clue);
	}
	
	@RequestMapping(value="/clue/{clueid}/position", method = RequestMethod.POST)
	public String updateClueLocation(Model model, @PathVariable("clueid") long clueid,
			@RequestParam(value="lat", required=true) Double lat,
			@RequestParam(value="lng", required=true) Double lng) {
		
		Clue clue = dao.load(Clue.class, clueid);
		clue.setPosition(new Waypoint(lat, lng));
		dao.save(clue);
		return "redirect:/clue/" + clueid;
	}
	
	@RequestMapping(value="/clue/{clueid}", method = RequestMethod.POST)
	public String updateClue(Model model, HttpServletRequest request, @PathVariable("clueid") long clueid,
			@RequestParam(value="description", required=false) String description,
			@RequestParam(value="summary", required=true) String summary,
			@RequestParam(value="location", required=false) String location,
			@RequestParam(value="instructions", required=false) Clue.Disposition instructions,
			@RequestParam(value="assignmentid", required=false) Long assignmentId) {
		Clue clue = dao.load(Clue.class, clueid);
		if(request.getParameter("action") != null && Action.valueOf(request.getParameter("action")) == Action.DELETE) {
			if(clue.getAssignment() != null) {
				SearchAssignment assignment = clue.getAssignment();
				assignment.removeClue(clue);
				dao.save(assignment);
			}
			dao.delete(clue);
			return getClueList(model, Format.WEB);
		}
		
		clue.setDescription(description);
		clue.setSummary(summary);
		clue.setLocation(location);
		clue.setInstructions(instructions);
		if((clue.getAssignment() != null && assignmentId != clue.getAssignment().getId())) {
			SearchAssignment assignment = clue.getAssignment();
			assignment.removeClue(clue);
			dao.save(assignment);
		}
		if(assignmentId != null && (clue.getAssignment() == null || assignmentId != clue.getAssignment().getId())) {
			SearchAssignment assignment = dao.load(SearchAssignment.class, assignmentId);
			assignment.addClue(clue);
			dao.save(assignment);
		}
		
		dao.save(clue);
		return "redirect:/clue/" + clueid;
	}
	
	@RequestMapping(value="/rest/clue", method = RequestMethod.GET)
	public String getRestClues(Model model) {
		@SuppressWarnings("rawtypes")
		List clues = dao.loadAll(Clue.class);
		return json(model, clues);
	}
	
	@RequestMapping(value="/rest/clue/since/{date}", method = RequestMethod.GET)
	public String getCluesSince(Model model, @PathVariable("date") long date) {
		return json(model, dao.loadSince(Clue.class, new Date(date)));
	}
}
