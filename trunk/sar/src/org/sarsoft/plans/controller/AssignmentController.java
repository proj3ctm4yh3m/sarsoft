package org.sarsoft.plans.controller;

import java.util.ArrayList;
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

import org.sarsoft.common.Pair;
import org.sarsoft.common.controller.DataManager;
import org.sarsoft.common.controller.GeoMapObjectController;
import org.sarsoft.common.gpx.GPX;
import org.sarsoft.common.gpx.StyledGeoObject;
import org.sarsoft.common.gpx.StyledWay;
import org.sarsoft.common.gpx.StyledWaypoint;
import org.sarsoft.common.json.JSONForm;
import org.sarsoft.common.model.ClientState;
import org.sarsoft.common.model.GeoMapObject;
import org.sarsoft.common.model.Way;
import org.sarsoft.common.model.Waypoint;
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
public class AssignmentController extends GeoMapObjectController<Assignment> {

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
	
	public Pair<Integer, Assignment> fromStyledGeo(StyledGeoObject obj) {
		if(obj instanceof StyledWay) return Assignment.from((StyledWay) obj);
		return null;
	}
	
	public String getLabel(Assignment assignment) {
		return "Assignment " + assignment.getId();
	}
	
	public void link(Assignment assignment) {
		Long id = assignment.getOperationalPeriodId();
		OperationalPeriod period = assignment.getOperationalPeriod();
		if(period != null && !id.equals(period.getId())) {
			period.removeAssignment(assignment);
			dao.save(period);
			period = null;
		}
		if(period == null && id != null) {
			period = dao.load(OperationalPeriod.class, id);
			if(period != null) {
				period.addAssignment(assignment);
				dao.save(period);
			}
		}
	}
	
	public void unlink(Assignment assignment) {
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
		List<StyledGeoObject> items = GPX.StyledGeo(context, params).getSecond();
		ClientState state = new ClientState();

		for(StyledGeoObject item : items) {
			if(item instanceof StyledWaypoint) {
				Pair<Integer, FieldWaypoint> pfwpt = FieldWaypoint.from((StyledWaypoint) item);
				if(pfwpt != null) {
					FieldWaypoint fwpt = pfwpt.getSecond();
					fwpt.setAssignmentId(id);
					state.add("FieldWaypoint", fwpt);
				}
			} else if(item instanceof StyledWay && ((StyledWay) item).getWay().getWaypoints().size() > 1) {
				Pair<Integer, FieldTrack> ptrack = FieldTrack.from((StyledWay) item);
				if(ptrack != null) {
					FieldTrack track = ptrack.getSecond();
					track.setAssignmentId(id);
					state.add("FieldTrack", track);
				}
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
	public List<Assignment> dedupe(List<Assignment> removeFrom, List<Assignment> checkAgainst) {
		// TODO Auto-generated method stub
		return null;
	}
	
	@RequestMapping(value="/{id}/clean", method = RequestMethod.POST)
	public String cleanTracks(Model model, @PathVariable("id") long id, @RequestParam(value="radius", required=false) Double radius, @RequestParam(value="time", required=false) Double time, HttpServletRequest request) {
		Assignment assignment = dao.load(Assignment.class, id);
		ClientState state = new ClientState();
		List<GeoMapObject> remove = new ArrayList<GeoMapObject>();
		
		Date cutoff = null;
		Waypoint[] bounds = assignment.getSegment().getBoundingBox();
		Waypoint center = new Waypoint((bounds[0].getLat() + bounds[1].getLat()) / 2, (bounds[0].getLng() + bounds[1].getLng()) / 2);
		
		if(radius != null) {
			radius = radius*1000;
			radius = radius + center.distanceFrom(bounds[0]);
		}
		if(time != null) {
			cutoff = new Date(System.currentTimeMillis() - (long) (time*60*60*1000));
		}
			
		Iterator<FieldTrack> tracks = assignment.getFieldTracks().iterator();
		while(tracks.hasNext()) {
			FieldTrack track = tracks.next();
			Iterator<Waypoint> waypoints = track.getWay().getWaypoints().listIterator();
			boolean modified = false;
			while(waypoints.hasNext()) {
				Waypoint wpt = waypoints.next();
				if((radius != null && wpt.distanceFrom(center) > radius) || (cutoff != null && wpt.getTime() != null && cutoff.after(wpt.getTime()))) {
					modified = true;
					waypoints.remove();
				}
			}
			if(modified) state.add("FieldTrack", track);
			if(track.getWay().getWaypoints().size() < 2) {
				remove.add(track);
				tracks.remove();
			}
		}
		
		Iterator<FieldWaypoint> waypoints = assignment.getFieldWaypoints().listIterator();
		while(waypoints.hasNext()) {
			FieldWaypoint fwpt = waypoints.next();
			Waypoint wpt = fwpt.getPosition();
			if((radius != null && wpt.distanceFrom(center) > radius) || (cutoff != null && wpt.getTime() != null && cutoff.after(wpt.getTime()))) {
				state.add("FieldWaypoint", fwpt);
				remove.add(fwpt);
				waypoints.remove();
			}
		}

		dao.save(assignment);
		
		for(GeoMapObject obj : remove) {
			dao.delete(obj);
		}
		
		return json(model, manager.toJSON(state));
	}

}
