package org.sarsoft.plans.controller;

import java.util.Date;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Set;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;

import net.sf.json.JSONArray;
import net.sf.json.JSONObject;
import net.sf.json.JSONSerializer;

import org.sarsoft.common.controller.DataManager;
import org.sarsoft.common.controller.GeoMapObjectController;
import org.sarsoft.common.json.JSONForm;
import org.sarsoft.common.model.ClientState;
import org.sarsoft.common.model.MapObject;
import org.sarsoft.common.model.Way;
import org.sarsoft.common.model.Waypoint;
import org.sarsoft.common.util.GPX;
import org.sarsoft.plans.Action;
import org.sarsoft.plans.model.Clue;
import org.sarsoft.plans.model.FieldTrack;
import org.sarsoft.plans.model.FieldWaypoint;
import org.sarsoft.plans.model.OperationalPeriod;
import org.sarsoft.plans.model.Assignment;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.ServletRequestDataBinder;
import org.springframework.web.bind.annotation.InitBinder;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.support.StringMultipartFileEditor;

@Controller
@RequestMapping("/rest/assignment")
public class AssignmentController extends GeoMapObjectController {

	@Autowired
	DataManager manager;
	
	@InitBinder
	public void initBinder(HttpServletRequest request, ServletRequestDataBinder binder) throws ServletException {
		binder.registerCustomEditor(String.class, new StringMultipartFileEditor());
	}
	
	public AssignmentController() {
		super(Assignment.class);
	}
	
	public Assignment make(JSONObject json) {
		return new Assignment(json);
	}
	
	public JSONObject toGPX(MapObject obj) {
		return ((Assignment) obj).toGPX();
	}
	
	public MapObject fromGPX(JSONObject obj) {
		return Assignment.fromGPX(obj);
	}
	
	public String getLabel(MapObject obj) {
		Assignment assignment = (Assignment) obj;
		return "Assignment " + assignment.getId();
	}
	
	public void link(MapObject obj) {
		Assignment assignment = (Assignment) obj;
		Long id = assignment.getOperationalPeriodId();
		OperationalPeriod period = assignment.getOperationalPeriod();
		if(period != null && !id.equals(period.getId())) {
			period.removeAssignment(assignment);
			dao.save(period);
			period = null;
		}
		if(period == null && id != null) {
			period = dao.load(OperationalPeriod.class, id);
			period.addAssignment(assignment);
			dao.save(period);
		}
	}
	
	public void unlink(MapObject obj) {
		Assignment assignment = (Assignment) obj;
		OperationalPeriod period = assignment.getOperationalPeriod();
		if(period != null) {
			period.removeAssignment(assignment);
			dao.save(period);
		}
		if(assignment.getClues() != null) {
			Set<Clue> copy = new HashSet<Clue>(assignment.getClues());
			for(Clue clue : copy) {
				assignment.removeClue(clue);
			}
		}
		if(assignment.getFieldWaypoints() != null) {
			Set<FieldWaypoint> copy = new HashSet<FieldWaypoint>(assignment.getFieldWaypoints());
			for(FieldWaypoint fwpt : copy) {
				assignment.removeFieldWaypoint(fwpt);
			}
		}
		if(assignment.getFieldTracks() != null) {
			Set<FieldTrack> copy = new HashSet<FieldTrack>(assignment.getFieldTracks());
			for(FieldTrack track : copy) {
				assignment.removeFieldTrack(track);
			}
		}
	}
	
	public String[] getLinkDependencies() {
		return new String[] { "OperationalPeriod" };
	}
	
	public void persist(MapObject obj) {
		super.persist(obj);
	}

	@RequestMapping(value="/{id}/transition", method = RequestMethod.POST)
	public String transition(Model model, @PathVariable("id") long id, @RequestParam("action") Action action) {
		Assignment assignment = dao.load(Assignment.class, id);
		
		switch(action) {
		case FINALIZE :
			assignment.setStatus(Assignment.Status.PREPARED);
			assignment.setPreparedOn(new Date());
			break;
		case START :
			assignment.setStatus(Assignment.Status.INPROGRESS);
			break;
		case STOP :
			assignment.setStatus(Assignment.Status.COMPLETED);
/*			Iterator<Resource> it = assignment.getResources().iterator();
			while(it.hasNext()) {
				Resource resource = it.next();
				it.remove();
				resource.setAssignment(null);
				dao.save(resource);
			}*/
			break;
		case ROLLBACK :
			if(assignment.getStatus() == Assignment.Status.INPROGRESS) assignment.setStatus(Assignment.Status.PREPARED);
			if(assignment.getStatus() == Assignment.Status.COMPLETED) assignment.setStatus(Assignment.Status.INPROGRESS);
			break;
		}
		return json(model, assignment);
	}
	
	@SuppressWarnings({ "unchecked", "deprecation" })
	@RequestMapping(value = "/{id}/segment", method = RequestMethod.POST)
	public String updateWay(Model model, JSONForm params, @PathVariable("id") long id) {
		Assignment assignment = dao.load(Assignment.class, id);
		Way route = assignment.getSegment();
		route.softCopy((List<Waypoint>) JSONArray.toList((JSONArray) JSONSerializer.toJSON(params.getJson()), Waypoint.class));
		assignment.setUpdated(new Date());
		dao.save(assignment);
		return json(model, route);
	}
	
	@RequestMapping(value = "/{id}/in", method = RequestMethod.POST)
	public String loadTracks(Model model, JSONForm params, @PathVariable("id") long id, HttpServletRequest request) {
		JSONArray gpx = GPX.parse(context, params);
		ClientState state = new ClientState();

		Iterator it = gpx.listIterator();
		while(it.hasNext()) {
			JSONObject jobject = (JSONObject) it.next();
			FieldWaypoint fwpt = FieldWaypoint.fromGPX(jobject);
			FieldTrack track = FieldTrack.fromGPX(jobject);
			if(fwpt != null) {
				fwpt.setAssignmentId(id);
				state.add("FieldWaypoint", fwpt);
			} else if(track != null) {
				track.setAssignmentId(id);
				state.add("FieldTrack", track);
			}
		}

		manager.toDB(state);

		if("frame".equals(request.getParameter("responseType"))) {
			return jsonframe(model, manager.toJSON(state));
		} else {
			return json(model, manager.toJSON(state));
		}
	}

	@Override
	public <T extends MapObject> List<MapObject> dedupe(List<T> removeFrom,
			List<T> checkAgainst) {
		// TODO Auto-generated method stub
		return null;
	}
	
	
/*	
	@RequestMapping(value="/assignment", method = RequestMethod.GET)
	public String getAssignment(Model model, HttpServletRequest request) {
		Format format = (request.getParameter("format") != null) ? Format.valueOf(request.getParameter("format").toUpperCase()) : Format.WEB;
		switch(format) {
		case PRINT:
			model.addAttribute("tenant", dao.getByAttr(Search.class, "name", RuntimeProperties.getTenant()));

			String print104 = request.getParameter("print104");
			model.addAttribute("print104", "on".equalsIgnoreCase(print104));

			String[] ids = request.getParameter("bulkIds").split(",");
			Arrays.sort(ids);
			List<SearchAssignment> assignments = new ArrayList<SearchAssignment>();
			List<SearchAssignment> rejected = new ArrayList<SearchAssignment>();
			for(String id : ids) {
				if(id.length() == 0) continue;
				SearchAssignment assignment = dao.load(SearchAssignment.class, Long.parseLong(id));
				if(assignment.getStatus() == SearchAssignment.Status.DRAFT) {
					rejected.add(assignment);
				} else {
					assignments.add(assignment);
				}
			}
			model.addAttribute("assignments", assignments);
			model.addAttribute("rejected", rejected);

			List<MapConfig> mapConfigs = new ArrayList<MapConfig>();
			List<Boolean> showPreviousEfforts = new ArrayList<Boolean>();
			for(int i = 1; i < 6; i++) {
				if(!"on".equalsIgnoreCase(request.getParameter("printmap" + i))) continue;
				String foreground = request.getParameter("map" + i + "f");
				String background = request.getParameter("map" + i + "b");
				String opacity = request.getParameter("map" + i + "o");
				String previousEfforts = request.getParameter("map" + i + "prev");
				if(foreground != null && foreground.length() > 0) {
					MapConfig config = new MapConfig();
					config.setBase(foreground);
					config.setOverlay(background);
					try {
						config.setOpacity(Integer.parseInt(opacity));
					} catch (Exception e) {
						config.setOpacity(0);
					}
					String alphaOverlays = "";
					for(MapSource source : RuntimeProperties.getMapSources()) {
						if(source.isAlphaOverlay()) {
							if("on".equalsIgnoreCase(request.getParameter("map" + i + "alpha_" + source.getAlias()))) alphaOverlays = alphaOverlays + source.getAlias() + ",";
						}
					}
					if(alphaOverlays.length() > 0) config.setAlphaOverlays(alphaOverlays.substring(0, alphaOverlays.length()-1));
					mapConfigs.add(config);
					showPreviousEfforts.add("on".equalsIgnoreCase(previousEfforts));
				}
			}
			model.addAttribute("mapConfigs", mapConfigs);
			model.addAttribute("previousEfforts", showPreviousEfforts);
			return app(model, "Assignment.PrintBulk");
		default :
			return "error";
		}
	}

	@RequestMapping(value="/assignment/{assignmentId}", method = RequestMethod.GET)
	public String getAssignment(Model model, @PathVariable("assignmentId") long assignmentId, HttpServletRequest request) {
		SearchAssignment assignment = dao.load(SearchAssignment.class, assignmentId);
		Format format = (request.getParameter("format") != null) ? Format.valueOf(request.getParameter("format").toUpperCase()) : Format.WEB;
		model.addAttribute("assignment", assignment);
		switch(format) {
		case PRINT :
			model.addAttribute("tenant", dao.getByAttr(Search.class, "name", RuntimeProperties.getTenant()));
			if("maps".equalsIgnoreCase(request.getParameter("content"))) {
				return app(model, "Assignment.PrintMaps");
			} else {
				return app(model, "Assignment.PrintForms");
			}
		default :
			model.addAttribute("resources", dao.loadAll(Resource.class));
			return app(model, "Assignment.Details");
		}
	}

	@RequestMapping(value="/assignment", method = RequestMethod.POST)
	public String setBulkAssignmentDetail(Model model, SearchAssignmentForm form, HttpServletRequest request, HttpServletResponse response) {
		Action action = (request.getParameter("action") != null) ? Action.valueOf(request.getParameter("action").toUpperCase()) : Action.UPDATE;
		OperationalPeriod period = null;
		String[] ids = form.getBulkIds().split(",");
		for(String id : ids) {
			if(id.length() == 0) continue;
			SearchAssignment assignment = dao.load(SearchAssignment.class, Long.parseLong(id));
			if(period == null) period = assignment.getOperationalPeriod();
			if(form.getResourceType() != null) assignment.setResourceType(form.getResourceType());
			if(form.getTimeAllocated() != null) assignment.setTimeAllocated(form.getTimeAllocated());
			if(form.getResponsivePOD() != null) assignment.setResponsivePOD(form.getResponsivePOD());
			if(form.getUnresponsivePOD() != null) assignment.setUnresponsivePOD(form.getUnresponsivePOD());
			if(form.getCluePOD() != null) assignment.setCluePOD(form.getCluePOD());
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
		return "redirect:/op/" + period.getId();
	}

	@RequestMapping(value="/assignment/{assignmentId}", method = RequestMethod.POST)
	public String setAssignmentDetail(Model model, @PathVariable("assignmentId") long assignmentId, SearchAssignmentForm form) {
		SearchAssignment assignment = dao.load(SearchAssignment.class, assignmentId);
//		assignment.setId(form.getId());
		assignment.setDetails(form.getDetails());
		assignment.setResourceType(form.getResourceType());
		assignment.setTimeAllocated(form.getTimeAllocated());
		assignment.setResponsivePOD(form.getResponsivePOD());
		assignment.setUnresponsivePOD(form.getUnresponsivePOD());
		assignment.setCluePOD(form.getCluePOD());
		assignment.setStatus(SearchAssignment.Status.DRAFT);
		assignment.setPrimaryFrequency(form.getPrimaryFrequency());
		assignment.setSecondaryFrequency(form.getSecondaryFrequency());
		assignment.setPreviousEfforts(form.getPreviousEfforts());
		assignment.setTransportation(form.getTransportation());
		dao.save(assignment);
		model.addAttribute("assignment", assignment);
		return app(model, "Assignment.Details");
	}

	@RequestMapping(value="/assignment/{assignmentId}/cleantracks", method = RequestMethod.POST)
	public String cleanTracks(Model model, @PathVariable("assignmentId") long assignmentId, HttpServletRequest request) {
		SearchAssignment assignment = dao.load(SearchAssignment.class, assignmentId);
		if(request.getParameter("radius") != null && request.getParameter("radius").length() > 0) {
			long radius = Math.abs(Long.parseLong(request.getParameter("radius"))*1000);
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
		} else {
			double time = Math.abs(Double.parseDouble(request.getParameter("time")));
			Date cutoff = new Date(System.currentTimeMillis() - (long) (time*60*60*1000));

			Iterator<Way> ways = assignment.getWays().iterator();
			while(ways.hasNext()) {
				Way way = ways.next();
				// clean trackpoints, deleting entire tracks if necessary
				if(way.getType() == WayType.TRACK) {
					Iterator<Waypoint> wpts = way.getWaypoints().iterator();
					while(wpts.hasNext()) {
						Waypoint wpt = wpts.next();
						if(wpt.getTime() != null && cutoff.after(wpt.getTime())) wpts.remove();
					}
					if(way.getWaypoints().size() == 0) ways.remove();
				}
			}
			Iterator<Waypoint> waypoints = assignment.getWaypoints().iterator();
			while(waypoints.hasNext()) {
				// clean stray waypoints
				Waypoint waypoint = waypoints.next();
				if(waypoint.getTime() != null && cutoff.after(waypoint.getTime())) waypoints.remove();
			}
		}
		dao.save(assignment);
		return getAssignment(model, assignmentId, request);
	}

*/

}
