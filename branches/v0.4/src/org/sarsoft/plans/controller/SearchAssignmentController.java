package org.sarsoft.plans.controller;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Date;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Set;

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
import org.sarsoft.common.model.WayType;
import org.sarsoft.common.model.Waypoint;
import org.sarsoft.common.util.RuntimeProperties;
import org.sarsoft.common.view.Breadcrumb;
import org.sarsoft.ops.model.Resource;
import org.sarsoft.plans.SearchAssignmentGPXHelper;
import org.sarsoft.plans.model.OperationalPeriod;
import org.sarsoft.plans.model.Probability;
import org.sarsoft.plans.model.Search;
import org.sarsoft.plans.model.SearchAssignment;
import org.sarsoft.plans.model.SearchAssignment.ResourceType;

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
	@RequestMapping(value="/app/assignment", method = RequestMethod.GET)
	public String getAssignment(Model model, HttpServletRequest request) {
		Format format = (request.getParameter("format") != null) ? Format.valueOf(request.getParameter("format").toUpperCase()) : Format.WEB;
		switch(format) {
		case PRINT:
			model.addAttribute("search", dao.getByAttr(Search.class, "name", RuntimeProperties.getSearch()));

			String print104 = request.getParameter("print104");
			model.addAttribute("print104", print104.length() > 0 ? Boolean.parseBoolean(print104) : false);

			String[] ids = request.getParameter("bulkIds").split(",");
			Arrays.sort(ids);
			List<SearchAssignment> assignments = new ArrayList<SearchAssignment>();
			List<SearchAssignment> rejected = new ArrayList<SearchAssignment>();
			for(String id : ids) {
				if(id.length() == 0) continue;
				SearchAssignment assignment = (SearchAssignment) dao.load(SearchAssignment.class, Long.parseLong(id));
				if(assignment.getStatus() == SearchAssignment.Status.DRAFT) {
					rejected.add(assignment);
				} else {
					assignments.add(assignment);
				}
			}
			model.addAttribute("assignments", assignments);
			model.addAttribute("rejected", rejected);

			List<MapConfig> mapConfigs = new ArrayList<MapConfig>();
			for(int i = 1; i < 6; i++) {
				String foreground = request.getParameter("map" + i + "f");
				String background = request.getParameter("map" + i + "b");
				String opacity = request.getParameter("map" + i + "o");
				if(foreground != null && foreground.length() > 0) {
					MapConfig config = new MapConfig();
					config.setBase(foreground);
					config.setOverlay(background);
					try {
						config.setOpacity(Integer.parseInt(opacity));
					} catch (Exception e) {
						config.setOpacity(0);
					}
					mapConfigs.add(config);
				}
			}
			model.addAttribute("mapConfigs", mapConfigs);
			return app(model, "Assignment.PrintBulk");
		default :
			return "error";
		}
	}

	@RequestMapping(value="/app/assignment/{assignmentId}", method = RequestMethod.GET)
	public String getAssignment(Model model, @PathVariable("assignmentId") long assignmentId, HttpServletRequest request) {
		SearchAssignment assignment = (SearchAssignment) dao.load(SearchAssignment.class, assignmentId);
		Format format = (request.getParameter("format") != null) ? Format.valueOf(request.getParameter("format").toUpperCase()) : Format.WEB;
		model.addAttribute("assignment", assignment);
		switch(format) {
		case PRINT :
			model.addAttribute("search", dao.getByAttr(Search.class, "name", RuntimeProperties.getSearch()));
			if("maps".equalsIgnoreCase(request.getParameter("content"))) {
				return app(model, "Assignment.PrintMaps");
			} else {
				return app(model, "Assignment.PrintForms");
			}
		default :
			// for new resources - need to find a better way to do this
			model.addAttribute("rehabresources", dao.getAllByAttr(Resource.class, "section", Resource.Section.REHAB));
			return app(model, "Assignment.Details");
		}
	}

	@RequestMapping(value="/app/assignment", method = RequestMethod.POST)
	public String setBulkAssignmentDetail(Model model, SearchAssignmentForm form, HttpServletRequest request, HttpServletResponse response) {
		Action action = (request.getParameter("action") != null) ? Action.valueOf(request.getParameter("action").toUpperCase()) : Action.UPDATE;
		OperationalPeriod period = null;
		String[] ids = form.getBulkIds().split(",");
		for(String id : ids) {
			if(id.length() == 0) continue;
			SearchAssignment assignment = (SearchAssignment) dao.load(SearchAssignment.class, Long.parseLong(id));
			if(period == null) period = assignment.getOperationalPeriod();
			if(form.getResourceType() != null) assignment.setResourceType(form.getResourceType());
			if(form.getTimeAllocated() != null) assignment.setTimeAllocated(form.getTimeAllocated());
			if(form.getResponsivePOD() != null) assignment.setResponsivePOD(form.getResponsivePOD());
			if(form.getUnresponsivePOD() != null) assignment.setUnresponsivePOD(form.getUnresponsivePOD());
			if(form.getPrimaryFrequency() != null && form.getPrimaryFrequency().length() > 0) assignment.setPrimaryFrequency(form.getPrimaryFrequency());
			if(form.getSecondaryFrequency() != null && form.getSecondaryFrequency().length() > 0) assignment.setSecondaryFrequency(form.getSecondaryFrequency());
			if(form.getPreviousEfforts() != null && form.getPreviousEfforts().length() > 0) assignment.setPreviousEfforts(form.getPreviousEfforts());
			if(form.getTransportation() != null && form.getTransportation().length() > 0) assignment.setTransportation(form.getTransportation());
			assignment.setStatus(SearchAssignment.Status.DRAFT);
			switch(action) {
			case FINALIZE :
				assignment.setPreparedBy(form.getPreparedBy());
				assignment.setStatus(SearchAssignment.Status.PREPARED);
				break;
			}
			dao.save(assignment);
 		}
		return "redirect:/app/operationalperiod/" + period.getId();
	}

	@RequestMapping(value="/app/assignment/{assignmentId}", method = RequestMethod.POST)
	public String setAssignmentDetail(Model model, @PathVariable("assignmentId") long assignmentId, SearchAssignmentForm form) {
		SearchAssignment assignment = (SearchAssignment) dao.load(SearchAssignment.class, assignmentId);
//		assignment.setId(form.getId());
		assignment.setDetails(form.getDetails());
		assignment.setResourceType(form.getResourceType());
		assignment.setTimeAllocated(form.getTimeAllocated());
		assignment.setResponsivePOD(form.getResponsivePOD());
		assignment.setUnresponsivePOD(form.getUnresponsivePOD());
		assignment.setStatus(SearchAssignment.Status.DRAFT);
		assignment.setPrimaryFrequency(form.getPrimaryFrequency());
		assignment.setSecondaryFrequency(form.getSecondaryFrequency());
		assignment.setPreviousEfforts(form.getPreviousEfforts());
		assignment.setTransportation(form.getTransportation());
		dao.save(assignment);
		model.addAttribute("assignment", assignment);
		return app(model, "Assignment.Details");
	}

	@RequestMapping(value="/app/assignment/{assignmentId}/cleantracks", method = RequestMethod.POST)
	public String cleanTracks(Model model, @PathVariable("assignmentId") long assignmentId, HttpServletRequest request) {
		long radius = Math.abs(Long.parseLong(request.getParameter("radius"))*1000);
		SearchAssignment assignment = (SearchAssignment) dao.load(SearchAssignment.class, assignmentId);
		Waypoint center = null;
		double assignmentRadius = 0;

		// compute the center of the assignment and the maximum distance to the edge of the bounding box
		for(Way way : assignment.getWays()) {
			if(way.getType() == WayType.ROUTE) {
				Waypoint[] bounds = way.getBoundingBox();
				if(center == null)
					center = new Waypoint((bounds[0].getLat() + bounds[1].getLat()) / 2, (bounds[0].getLng() + bounds[1].getLng()) / 2);
				assignmentRadius = Math.max(assignmentRadius, Math.max(center.distanceFrom(bounds[0]), center.distanceFrom(bounds[1])));
			}
		}

		if(center != null) {
			Iterator<Way> ways = assignment.getWays().iterator();
			while(ways.hasNext()) {
				Way way = ways.next();
				// clean trackpoints, deleting entire tracks if necessary
				if(way.getType() == WayType.TRACK) {
					Iterator<Waypoint> wpts = way.getWaypoints().iterator();
					while(wpts.hasNext()) {
						Waypoint wpt = wpts.next();
						if(wpt.distanceFrom(center) > radius + assignmentRadius)
							wpts.remove();
					}
					if(way.getWaypoints().size() == 0) ways.remove();
				}
			}
			Iterator<Waypoint> waypoints = assignment.getWaypoints().iterator();
			while(waypoints.hasNext()) {
				// clean stray waypoints
				Waypoint waypoint = waypoints.next();
				if(waypoint.distanceFrom(center) > radius + assignmentRadius)
					waypoints.remove();
			}
		}

		dao.save(assignment);
		return getAssignment(model, assignmentId, request);
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
			return gpx(model, SearchAssignmentGPXHelper.gpxifyAssignment(assignment), "SearchAssignment");
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

	@SuppressWarnings("unchecked")
	@RequestMapping(value="/rest/assignment", method = RequestMethod.POST)
	public String createAssignment(JSONForm params, Model model, HttpServletRequest request) {
		SearchAssignment assignment = SearchAssignment.createFromJSON(parseObject(params));
		if(assignment.getId() != null) {
			SearchAssignment existing = (SearchAssignment) dao.load(SearchAssignment.class, assignment.getId());
			if(existing != null) assignment.setId(null);
		}
		if(assignment.getId() == null) {
			List<SearchAssignment> assignments = (List<SearchAssignment>) dao.loadAll(SearchAssignment.class);
			long maxId = 0L;
			for(SearchAssignment obj : assignments) {
				maxId = Math.max(maxId, obj.getId());
			}
			assignment.setId(maxId+1);
		}
		Long opid = assignment.getOperationalPeriodId();
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
		case START :
			assignment.setStatus(SearchAssignment.Status.INPROGRESS);
			break;
		case STOP :
			assignment.setStatus(SearchAssignment.Status.COMPLETED);
			Iterator<Resource> it = assignment.getResources().iterator();
			while(it.hasNext()) {
				Resource resource = it.next();
				it.remove();
				resource.setSection(Resource.Section.REHAB);
				dao.save(resource);
			}
			break;
		case DELETE :
			assignment.getOperationalPeriod().removeAssignment(assignment);
			for(Resource resource : assignment.getResources()) {
				assignment.removeResource(resource);
				resource.setSection(Resource.Section.REHAB);
				dao.save(resource);
			}
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
		WayType type = (request.getParameter("type") != null) ? WayType.valueOf(request.getParameter("type").toUpperCase()) : null;

		Way[] ways;
		switch(format) {
		case GPX :
			if(params.getFile() != null) {
				ways = Way.createFromJSON((JSONArray) parseGPXFile(request, params.getFile()));
			} else {
				ways = Way.createFromJSON((JSONArray) parseGPXJson(request, params.getJson()));
			}
			break;
		default :
			ways = new Way[] { Way.createFromJSON(parseObject(params)) };
		}

		for(Way way : ways) {
			if(type == null || way.getType() == type) {
				way.setUpdated(new Date());
				assignment.getWays().add(way);
			}
		}

		Waypoint[] waypoints;
		switch(format) {
		case GPX :
			if(params.getFile() != null) {
				waypoints = Waypoint.createFromJSON((JSONArray) parseGPXFile(request, params.getFile(), "/xsl/gpx/gpx2waypoint.xsl"));
			} else {
				waypoints = Waypoint.createFromJSON((JSONArray) parseGPXJson(request, params.getJson(), "/xsl/gpx/gpx2waypoint.xsl"));
			}
			break;
		default :
			waypoints = new Waypoint[] { Waypoint.createFromJSON(parseObject(params)) };
		}

		for(Waypoint waypoint : waypoints) {
			waypoint.setTime(new Date());
			assignment.getWaypoints().add(waypoint);
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

	@RequestMapping(value = "/rest/assignment/{assignmentId}/wpt/{waypointId}", method = RequestMethod.POST)
	public String updateWaypoint(JSONForm params, @PathVariable("assignmentId") long assignmentId, @PathVariable("waypointId") int waypointId, Model model, HttpServletRequest request) {
		Action action = (request.getParameter("action") != null) ? Action.valueOf(request.getParameter("action").toUpperCase()) : Action.CREATE;
		SearchAssignment assignment = (SearchAssignment) dao.load(SearchAssignment.class, assignmentId);
		if(action == Action.DELETE) {
			Waypoint waypoint = assignment.getWaypoints().get(waypointId);
			assignment.getWaypoints().remove(waypointId);
			dao.save(assignment);
			dao.delete(waypoint);
		}
		return json(model, assignment);
	}

	@RequestMapping(value = "/rest/assignment/{assignmentId}/way/{wayId}/waypoints", method= RequestMethod.POST)
	public String setRouteWaypoints(JSONForm params, @PathVariable("assignmentId") long assignmentId, @PathVariable("wayId") int wayId, Model model) {
		SearchAssignment assignment = (SearchAssignment) dao.load(SearchAssignment.class, assignmentId);
		Way way = assignment.getWays().get(wayId);
		List<Waypoint> waypoints = way.getWaypoints();
		waypoints.removeAll(waypoints);
		waypoints.addAll((List<Waypoint>) JSONArray.toList((JSONArray) JSONSerializer.toJSON(params.getJson()), Waypoint.class));
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
