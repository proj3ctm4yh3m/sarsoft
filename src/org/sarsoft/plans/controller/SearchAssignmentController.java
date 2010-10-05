package org.sarsoft.plans.controller;

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
import org.sarsoft.plans.model.OperationalPeriod;
import org.sarsoft.plans.model.Probability;
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
			// for new resources - need to find a better way to do this
			model.addAttribute("rehabresources", dao.getAllByAttr(Resource.class, "section", Resource.Section.REHAB));
			return app(model, "Assignment.Details");
		}
	}

	@RequestMapping(value="/app/assignment/{assignmentId}", method = RequestMethod.POST)
	public String setAssignmentDetail(Model model, @PathVariable("assignmentId") long assignmentId, SearchAssignmentForm form) {
		SearchAssignment assignment = (SearchAssignment) dao.load(SearchAssignment.class, assignmentId);
		assignment.setId(form.getId());
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
			System.out.println(assignments.size() + " assignments");
			for(SearchAssignment obj : assignments) {
				System.out.println("OBJ: " + obj);
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

	@RequestMapping(value = "/rest/search", method= RequestMethod.POST)
	public String bulkGPXUpload(JSONForm params, Model model, HttpServletRequest request) {
		Format format = (request.getParameter("format") != null) ? Format.valueOf(request.getParameter("format").toUpperCase()) : Format.GPX;

		Waypoint[] waypoints;
		Object obj;
		switch(format) {
		case GPX :
			if(params.getFile() != null) {
				obj = parseGPXFile(request, params.getFile(), "/xsl/gpx/gpx2waypoint.xsl");
			} else {
				obj = parseGPXJson(request, params.getJson(), "/xsl/gpx/gpx2waypoint.xsl");
			}
			break;
		default :
			obj = parseObject(params);
		}

		if(obj instanceof JSONArray) {
			waypoints = Waypoint.createFromJSON((JSONArray) obj);
		}


		// TODO need to handle importing named waypoints from a search-wide backup

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
			String[] attrs = way.getName().split(",");
			String name = attrs[0];

			try {
			OperationalPeriod period = (OperationalPeriod) dao.load(OperationalPeriod.class, Long.parseLong(name.substring(0, 2)));

			if(period == null) {
				System.out.println("creating new operational period");
				period = new OperationalPeriod();
				period.setDescription("Autogenerated by GPX Import");
				period.setId(Long.parseLong(name.substring(0, 2)));
				System.out.println("period id: " + period.getId());
				dao.save(period);
				period = (OperationalPeriod) dao.load(OperationalPeriod.class, Long.parseLong(name.substring(0, 2)));
			}

			if(period != null) {
				System.out.println("period id: " + period.getId());
				System.out.println("assignments: " + period.getAssignments());
				SearchAssignment assignment = (SearchAssignment) dao.load(SearchAssignment.class, Long.parseLong(name.substring(2, 5)));
				if(assignment == null) {
					assignment = new SearchAssignment();
					assignment.setId(Long.parseLong(name.substring(2, 5)));
					period.addAssignment(assignment);
					dao.save(assignment);
				}
				for(int i = 1; i < attrs.length; i++) {
					String[] kv = attrs[i].split(":");
					if(kv.length > 1) {
						if("details".equalsIgnoreCase(kv[0])) assignment.setDetails(kv[1]);
						else if ("resourceType".equalsIgnoreCase(kv[0])) assignment.setResourceType(ResourceType.valueOf(kv[1]));
						else if ("status".equalsIgnoreCase(kv[0])) assignment.setStatus(SearchAssignment.Status.valueOf(kv[1]));
						else if ("timeAllocated".equalsIgnoreCase(kv[0])) assignment.setTimeAllocated(Long.parseLong(kv[1]));
						else if ("responsivePOD".equalsIgnoreCase(kv[0])) assignment.setResponsivePOD(Probability.valueOf(kv[1]));
						else if ("unresponsivePOD".equalsIgnoreCase(kv[0])) assignment.setUnresponsivePOD(Probability.valueOf(kv[1]));
						else if ("preparedBy".equalsIgnoreCase(kv[0])) assignment.setPreparedBy(kv[1]);
						else if ("preparedOn".equalsIgnoreCase(kv[0])) assignment.setPreparedOn(new Date(kv[1]));
					}
				}
				List<Waypoint> wpts = way.getWaypoints();
				if(way.getType() == WayType.ROUTE && wpts.get(0).equals(wpts.get(wpts.size() - 1))) way.setPolygon(true);
				assignment.getWays().add(way);
				way.setUpdated(new Date());
			}
			dao.save(period);
			} catch(NumberFormatException e) {
				// continue to next entry
			}
		}

//		return (ways.length == 1) ? json(model, ways[0]) : json(model, ways);
		return "";
	}

	@RequestMapping(value ="/rest/search", method = RequestMethod.GET)
	public String bulkGPXDownload(Model model, HttpServletRequest request, HttpServletResponse response) {
		Format format = (request.getParameter("format") != null) ? Format.valueOf(request.getParameter("format").toUpperCase()) : Format.JSON;
		List assignments = dao.loadAll(SearchAssignment.class);

		switch (format) {
		case GPX :
			response.setHeader("Content-Disposition", "attachment; filename=" + RuntimeProperties.getSearch() + ".gpx");
			return gpx(model, assignments, "SearchAssignments");
		case KML :
			response.setHeader("Content-Disposition", "attachment; filename=" + RuntimeProperties.getSearch() + ".kml");
			return kml(model, assignments, "SearchAssignments");
		default :
			return json(model, assignments);
		}
	}

}
