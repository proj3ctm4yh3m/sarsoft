package org.sarsoft.plans.controller;

import java.util.Date;
import java.util.List;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.sarsoft.admin.model.MapSource;
import org.sarsoft.common.controller.FileUploadForm;
import org.sarsoft.common.controller.JSONBaseController;
import org.sarsoft.common.controller.JSONForm;
import org.sarsoft.common.model.Action;
import org.sarsoft.common.model.Format;
import org.sarsoft.common.model.MapConfig;
import org.sarsoft.common.model.Way;
import org.sarsoft.common.model.Waypoint;
import org.sarsoft.common.view.Breadcrumb;
import org.sarsoft.plans.model.OperationalPeriod;
import org.sarsoft.plans.model.SearchAssignment;
import net.sf.json.JSONArray;
import net.sf.json.JSONSerializer;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.ServletRequestDataBinder;
import org.springframework.web.bind.annotation.InitBinder;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.multipart.support.StringMultipartFileEditor;

@Controller
public class SearchAssignmentController extends JSONBaseController {

	@InitBinder
	public void initBinder(HttpServletRequest request, ServletRequestDataBinder binder) throws ServletException {
		binder.registerCustomEditor(String.class, new StringMultipartFileEditor());
	}

	// ASSIGNMENT APP
	@RequestMapping(value="/app/assignment/{assignmentId}", method = RequestMethod.GET)
	public String getAssignment(Model model, @PathVariable("assignmentId") long assignmentId, HttpServletRequest request) {
		SearchAssignment assignment = (SearchAssignment) dao.load(SearchAssignment.class, assignmentId);
		Format format = (request.getParameter("format") != null) ? Format.valueOf(request.getParameter("format").toUpperCase()) : Format.WEB;
		model.addAttribute("assignment", assignment);
		switch(format) {
		case PRINT :
			if("maps".equalsIgnoreCase(request.getParameter("content"))) {
				return app(model, "Assignment.PrintMaps");
			} else {
				return app(model, "Assignment.PrintForms");
			}
		default :
			return app(model, "Assignment.Details");
		}
	}

	@RequestMapping(value="/app/assignment/{assignmentId}", method = RequestMethod.POST)
	public String setAssignmentDetail(Model model, @PathVariable("assignmentId") long assignmentId, SearchAssignmentForm form) {
		SearchAssignment assignment = (SearchAssignment) dao.load(SearchAssignment.class, assignmentId);
		assignment.setName(form.getName());
		assignment.setDetails(form.getDetails());
		assignment.setResourceType(form.getResourceType());
		assignment.setTimeAllocated(form.getTimeAllocated());
		assignment.setResponsivePOD(form.getResponsivePOD());
		assignment.setUnresponsivePOD(form.getUnresponsivePOD());
		assignment.setStatus(SearchAssignment.Status.DRAFT);
		dao.save(assignment);
		model.addAttribute("assignment", assignment);
		return app(model, "Assignment.Details");
	}


	// ASSIGNMENT REST
	@RequestMapping(value="/rest/assignment", method = RequestMethod.GET)
	public String getAssignmentsRest(Model model) {
		return json(model, dao.loadAll(SearchAssignment.class));
	}

	@RequestMapping(value="/rest/assignment/{assignmentId}", method = RequestMethod.GET)
	public String getAssignmentRest(@PathVariable("assignmentId") long assignmentId, Model model, HttpServletRequest request, HttpServletResponse response) {
		SearchAssignment assignment = (SearchAssignment) dao.load(SearchAssignment.class, assignmentId);
		Format format = (request.getParameter("format") != null) ? Format.valueOf(request.getParameter("format").toUpperCase()) : Format.JSON;
		switch (format) {
		case GPX :
			response.setHeader("Content-Disposition", "attachment; filename=searchassignment" + assignment.getId() + ".gpx");
			return gpx(model, assignment, "SearchAssignment");
		case KML :
			response.setHeader("Content-Disposition", "attachment; filename=searchassignment" + assignment.getId() + ".kml");
			return kml(model, assignment, "SearchAssignment");
		default :
			return json(model, assignment);
		}
	}

	@SuppressWarnings("unchecked")
	@RequestMapping(value="/rest/assignment/since/{date}", method = RequestMethod.GET)
	public String getAssignmentsUpdatedSince(@PathVariable("date") long date, Model model) {
		return json(model, dao.loadSince(SearchAssignment.class, new Date(date)));
	}

	@RequestMapping(value="/rest/assignment", method = RequestMethod.POST)
	public String createAssignment(JSONForm params, Model model, HttpServletRequest request) {
		SearchAssignment assignment = SearchAssignment.createFromJSON(parseObject(params));
		Integer opid = assignment.getOperationalPeriodId();
		if(opid != null) {
			OperationalPeriod period = (OperationalPeriod) dao.load(OperationalPeriod.class, opid);
			period.addAssignment(assignment);
			assignment.preSave();
			dao.save(period);
		} else {
			dao.save(assignment);
		}
		return json(model, assignment);
	}

	@RequestMapping(value="/rest/assignment/{assignmentId}", method = RequestMethod.POST)
	public String updateAssignment(Model model, @PathVariable("assignmentId") long assignmentId, HttpServletRequest request) {
		SearchAssignment assignment = (SearchAssignment) dao.load(SearchAssignment.class, assignmentId);
		Action action = (request.getParameter("action") != null) ? Action.valueOf(request.getParameter("action").toUpperCase()) : Action.CREATE;
		switch(action) {
		case FINALIZE :
			assignment.setStatus(SearchAssignment.Status.PREPARED);
			assignment.setPreparedBy(request.getParameter("preparedby"));
			assignment.setPreparedOn(new Date());
			break;
		case DELETE :
			assignment.getOperationalPeriod().removeAssignment(assignment);
			dao.delete(assignment);
			return json(model, assignment);
		}
		dao.save(assignment);
		return json(model, assignment);
	}


	// WAY REST
	@RequestMapping(value = "/rest/assignment/{assignmentId}/way", method = RequestMethod.GET)
	public String getWays(@PathVariable("assignmentId") long assignmentId, Model model, HttpServletRequest request) {
		SearchAssignment assignment = (SearchAssignment) dao.load(SearchAssignment.class, assignmentId);
		int precision = 0;
		try {
			precision = Integer.parseInt(request.getParameter("precision"));
		} catch (Exception e) {
		}
		List<Way> ways = assignment.getWays();
		for(Way way : ways) {
			if(precision != 0)
				way.setPrecision(precision);
		}
		return json(model, ways);
	}

	@RequestMapping(value = "/rest/assignment/{assignmentId}/way", method= RequestMethod.POST)
	public String addWay(JSONForm params, @PathVariable("assignmentId") long assignmentId, Model model, HttpServletRequest request) {
		SearchAssignment assignment = (SearchAssignment) dao.load(SearchAssignment.class, assignmentId);
		Format format = (request.getParameter("format") != null) ? Format.valueOf(request.getParameter("format").toUpperCase()) : Format.JSON;

		Way[] ways;
		switch(format) {
		case GPX :
			String gpx = params.getFile() != null ? params.getFile() : params.getJson();
			ways = Way.createFromJSON((JSONArray) parseGPXFile(request, gpx));
			break;
		default :
			ways = new Way[] { Way.createFromJSON(parseObject(params)) };
		}

		for(Way way : ways) {
			way.setUpdated(new Date());
			assignment.getWays().add(way);
		}
		dao.save(assignment);
		return (ways.length == 1) ? json(model, ways[0]) : json(model, ways);
	}

	@RequestMapping(value = "/rest/assignment/{assignmentId}/way/{wayId}", method = RequestMethod.POST)
	public String updateWay(JSONForm params, @PathVariable("assignmentId") long assignmentId, @PathVariable("wayId") int wayId, Model model, HttpServletRequest request) {
		Action action = (request.getParameter("action") != null) ? Action.valueOf(request.getParameter("action").toUpperCase()) : Action.CREATE;
		SearchAssignment assignment = (SearchAssignment) dao.load(SearchAssignment.class, assignmentId);
		if(action == Action.DELETE) {
			Way way = assignment.getWays().get(wayId);
			assignment.getWays().remove(wayId);
			dao.save(assignment);
			dao.delete(way);
		}
		return json(model, assignment);
	}

	@RequestMapping(value = "/rest/assignment/{assignmentId}/way/{wayId}/waypoints", method= RequestMethod.POST)
	public String setRouteWaypoints(JSONForm params, @PathVariable("assignmentId") long assignmentId, @PathVariable("wayId") int wayId, Model model) {
		SearchAssignment assignment = (SearchAssignment) dao.load(SearchAssignment.class, assignmentId);
		Way way = assignment.getWays().get(wayId);
		way.setWaypoints((List<Waypoint>) JSONArray.toList((JSONArray) JSONSerializer.toJSON(params.getJson()), Waypoint.class));
		assignment.setUpdated(new Date());
		dao.save(way);
		return json(model, way);
	}

	@RequestMapping(value = "/rest/assignment/{assignmentId}/mapConfig", method= RequestMethod.POST)
	public String addMapconfig(JSONForm params, @PathVariable("assignmentId") long assignmentId, Model model) {
		SearchAssignment assignment = (SearchAssignment) dao.load(SearchAssignment.class, assignmentId);
		MapConfig config = MapConfig.createFromJSON(parseObject(params));
		assignment.getMapConfigs().add(config);
		dao.save(assignment);
		return json(model, config);
	}

	@RequestMapping(value = "/rest/assignment/{assignmentId}/mapConfig/{configId}", method= RequestMethod.POST)
	public String updateMapConfig(JSONForm params, @PathVariable("assignmentId") long assignmentId, @PathVariable("configId") long configId, Model model, HttpServletRequest request) {
		Action action = (request.getParameter("action") != null) ? Action.valueOf(request.getParameter("action").toUpperCase()) : Action.CREATE;
		SearchAssignment assignment = (SearchAssignment) dao.load(SearchAssignment.class, assignmentId);
		for(MapConfig config : assignment.getMapConfigs()) {
			if(config.getId() == configId) {
				switch(action) {
				case DELETE :
					assignment.getMapConfigs().remove(config);
					dao.save(assignment);
					dao.delete(config);
				}
				return json(model, config);
			}
		}
		return json(model, null);
	}


}
