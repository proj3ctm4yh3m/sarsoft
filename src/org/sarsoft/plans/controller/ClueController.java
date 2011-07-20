package org.sarsoft.plans.controller;

import java.util.Date;
import java.util.List;

import javax.servlet.http.HttpServletRequest;

import org.sarsoft.common.controller.JSONBaseController;
import org.sarsoft.common.model.Action;
import org.sarsoft.common.model.Waypoint;
import org.sarsoft.ops.model.Resource;
import org.sarsoft.plans.model.Clue;
import org.sarsoft.plans.model.SearchAssignment;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
public class ClueController extends JSONBaseController {

	@RequestMapping(value="/app/clue", method = RequestMethod.GET)
	public String getClueList(Model model) {
		model.addAttribute("clues", dao.loadAll(Clue.class));
		model.addAttribute("assignments", dao.loadAll(SearchAssignment.class));
		return app(model, "Clue.List");
	}
	
	@RequestMapping(value="/app/clue/new", method = RequestMethod.POST)
	public String createClue(Model model, HttpServletRequest request,
			@RequestParam(value="description", required=false) String description,
			@RequestParam(value="summary", required=true) String summary,
			@RequestParam(value="location", required=false) String location,
			@RequestParam(value="assignmentid", required=false) Long assignmentId,
			@RequestParam(value="lat", required=false) Double lat,
			@RequestParam(value="lng", required=false) Double lng) {
		
		long maxId = 0L;
		@SuppressWarnings("unchecked")
		List<Clue> clues = (List<Clue>) dao.loadAll(Clue.class);
		for(Clue clue : clues) {
			maxId = Math.max(maxId, clue.getId());
		}
		
		Clue clue = new Clue();
		clue.setId(maxId+1);
		clue.setDescription(description);
		clue.setSummary(summary);
		clue.setLocation(location);
		
		if(lat != null && lng != null && lat != 0) {
			clue.setPosition(new Waypoint(lat, lng));
		}
		
		dao.save(clue);
		
		if(assignmentId != null) {
			SearchAssignment assignment = (SearchAssignment) dao.load(SearchAssignment.class, assignmentId);
			if(assignment != null) {
				assignment.addClue(clue);
				dao.save(assignment);
			}
		}

		return "redirect:/app/clue";
	}
	
	@RequestMapping(value="/{mode}/clue/{clueid}", method = RequestMethod.GET)
	public String getClue(Model model, @PathVariable("mode") String mode, @PathVariable("clueid") long clueid) {
		Clue clue = (Clue) dao.load(Clue.class, clueid);
		if(REST.equals(mode)) return json(model, clue);
		model.addAttribute("clue", clue);
		model.addAttribute("assignments", dao.loadAll(SearchAssignment.class));
		return app(model, "Clue.Detail");
	}
	
	@RequestMapping(value="/app/clue/{clueid}/position", method = RequestMethod.POST)
	public String updateClueLocation(Model model, @PathVariable("clueid") long clueid,
			@RequestParam(value="lat", required=true) Double lat,
			@RequestParam(value="lng", required=true) Double lng) {
		
		Clue clue = (Clue) dao.load(Clue.class, clueid);
		clue.setPosition(new Waypoint(lat, lng));
		dao.save(clue);
		return "redirect:/app/clue/" + clueid;
	}
	
	@RequestMapping(value="/app/clue/{clueid}", method = RequestMethod.POST)
	public String updateClue(Model model, HttpServletRequest request, @PathVariable("clueid") long clueid,
			@RequestParam(value="description", required=false) String description,
			@RequestParam(value="summary", required=true) String summary,
			@RequestParam(value="location", required=false) String location,
			@RequestParam(value="assignmentid", required=false) Long assignmentId) {
		Clue clue = (Clue) dao.load(Clue.class, clueid);
		if(request.getParameter("action") != null && Action.valueOf(request.getParameter("action")) == Action.DELETE) {
			if(clue.getAssignment() != null) {
				SearchAssignment assignment = clue.getAssignment();
				assignment.removeClue(clue);
				dao.save(assignment);
			}
			dao.delete(clue);
			return getClueList(model);
		}
		
		clue.setDescription(description);
		clue.setSummary(summary);
		clue.setLocation(location);
		if((clue.getAssignment() != null && assignmentId != clue.getAssignment().getId())) {
			SearchAssignment assignment = clue.getAssignment();
			assignment.removeClue(clue);
			dao.save(assignment);
		}
		if(assignmentId != null && (clue.getAssignment() == null || assignmentId != clue.getAssignment().getId())) {
			SearchAssignment assignment = (SearchAssignment) dao.load(SearchAssignment.class, assignmentId);
			assignment.addClue(clue);
			dao.save(assignment);
		}
		
		dao.save(clue);
		return "redirect:/app/clue/" + clueid;
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
