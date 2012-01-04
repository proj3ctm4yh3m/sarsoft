package org.sarsoft.plans.controller;

import java.util.List;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.sarsoft.common.controller.JSONBaseController;
import org.sarsoft.common.controller.JSONForm;
import org.sarsoft.common.model.Action;
import org.sarsoft.common.model.Format;
import org.sarsoft.plans.SearchAssignmentGPXHelper;
import org.sarsoft.plans.model.OperationalPeriod;
import org.sarsoft.plans.model.SearchAssignment;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.ServletRequestDataBinder;
import org.springframework.web.bind.annotation.InitBinder;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.multipart.support.StringMultipartFileEditor;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
public class OperationalPeriodController extends JSONBaseController {

	@InitBinder
	public void initBinder(HttpServletRequest request, ServletRequestDataBinder binder) throws ServletException {
		binder.registerCustomEditor(String.class, new StringMultipartFileEditor());
	}

	@RequestMapping(value="/op/{periodId}", method = RequestMethod.GET)
	public String getAppOperationalPeriod(Model model, @PathVariable("periodId") long id, HttpServletRequest request, HttpServletResponse response) {
		OperationalPeriod period = dao.load(OperationalPeriod.class, id);
		model.addAttribute("period", period);
		model.addAttribute("periods", dao.loadAll(OperationalPeriod.class));

		Action action = (request.getParameter("action") != null) ? Action.valueOf(request.getParameter("action").toUpperCase()) : Action.CREATE;
		switch(action) {
		case DELETE:
				if(period.getAssignments() == null || period.getAssignments().size() == 0) {
					dao.delete(period);
					return "redirect:/op/" + (id-1);
				}
				break;
		case UPDATE:
			String name = request.getParameter("name");
			if(name != null && name.length() > 0) {
				period.setDescription(name);
				dao.save(period);
			}
		}
		return app(model, "OperationalPeriod.Detail");
	}

	@RequestMapping(value="/op/{periodId}/map", method = RequestMethod.GET)
	public String plansEditor(Model model, @PathVariable("periodId") long id) {
		model.addAttribute("period", dao.load(OperationalPeriod.class, id));
		return app(model, "/plans");
	}

	// REST PERIOD
	@RequestMapping(value="/rest/operationalperiod", method = RequestMethod.GET)
	public String getOperationalPeriods(Model model, HttpServletRequest request, HttpServletResponse response) {
		Format format = (request.getParameter("format") != null) ? Format.valueOf(request.getParameter("format").toUpperCase()) : Format.JSON;
		switch (format) {
		case GPX :
			response.setHeader("Content-Disposition", "attachment; filename=search.gpx");
			List<SearchAssignment> assignments = dao.loadAll(SearchAssignment.class);
			return gpx(model, SearchAssignmentGPXHelper.gpxifyAssignmentList(assignments), "SearchAssignments");
		default :
			return json(model, dao.loadAll(OperationalPeriod.class));
		}
	}
 
	@RequestMapping(value ="/rest/operationalperiod/{opid}", method = RequestMethod.GET)
	public String getOperationalPeriod(Model model, @PathVariable("opid") long id, HttpServletRequest request, HttpServletResponse response) {
		OperationalPeriod period = dao.load(OperationalPeriod.class, id);
		Format format = (request.getParameter("format") != null) ? Format.valueOf(request.getParameter("format").toUpperCase()) : Format.JSON;

		switch (format) {
		case GPX :
			response.setHeader("Content-Disposition", "attachment; filename=operationalperiod" + period.getId() + ".gpx");
			return gpx(model, SearchAssignmentGPXHelper.gpxifyAssignmentList(period.getAssignments()), "SearchAssignments");
		case KML :
			response.setHeader("Content-Disposition", "attachment; filename=operationalperiod" + period.getId() + ".kml");
			return kml(model, period.getAssignments(), "SearchAssignments");
		case CSV:
			response.setHeader("Content-Disposition", "attachment; filename=operationalperiod" + period.getId() + ".csv");
			model.addAttribute("assignments", period.getAssignments());
			return "/plans/opdetail-csv";
		default :
			return json(model, period);
		}
	}

	@RequestMapping(value="/op", method = RequestMethod.POST)
	public String createOperationalPeriod(JSONForm params, Model model, @RequestParam("id") Long id, @RequestParam(value="description",required=false) String description) {
		OperationalPeriod period = new OperationalPeriod();
		period.setId(id);
		period.setDescription(description);
		if(period.getId() == null) {
			List<OperationalPeriod> periods = dao.loadAll(OperationalPeriod.class);
			id = 0L;
			for(OperationalPeriod p : periods) {
				id = Math.max(id, p.getId());
			}
			id = id + 1;
			period.setId(id);
		}
		dao.save(period);
		return "redirect:/op/" + period.getId();
	}

	@RequestMapping(value="/rest/operationalperiod/{periodId}/assignment", method = RequestMethod.GET)
	public String getAssignmentsForOperationalPeriod(Model model, @PathVariable("periodId") long id) {
		OperationalPeriod period = dao.load(OperationalPeriod.class, id);
		return json(model, period.getAssignments());
	}

}
