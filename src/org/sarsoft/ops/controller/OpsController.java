package org.sarsoft.ops.controller;

import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;

import org.sarsoft.admin.controller.AdminController;
import org.sarsoft.common.controller.JSONBaseController;
import org.sarsoft.common.model.Action;
import org.sarsoft.common.model.Waypoint;
import org.sarsoft.common.util.RuntimeProperties;
import org.sarsoft.ops.model.Resource;
import org.sarsoft.ops.service.location.APRSTier2Engine;
import org.sarsoft.ops.service.location.SpotLocationEngine;
import org.sarsoft.plans.controller.SearchAssignmentController;
import org.sarsoft.plans.model.SearchAssignment;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
public class OpsController extends JSONBaseController {

	@Autowired
	AdminController adminController;
	private class EngineList {
		public APRSTier2Engine aprst2;
		public SpotLocationEngine spot;
	}
	private static Map<String, EngineList> locationEngines = new HashMap<String, EngineList>();

	@Autowired
	SearchAssignmentController searchAssignmentController;

	public static boolean isLocationEnabled(String search) {
		return locationEngines.containsKey(search);
	}

	@RequestMapping(value = "/{mode}/location/start", method = RequestMethod.GET)
	public String startLocationEngine(Model model, @PathVariable("mode") String mode, HttpServletRequest request) {
		String search = RuntimeProperties.getSearch();
		EngineList engines = locationEngines.get(search);
		if(engines == null) {
			engines = new EngineList();
			locationEngines.put(search, engines);
		}
		
		if(engines.spot != null && engines.spot.isAlive()) engines.spot.quit();
		engines.spot = new SpotLocationEngine();
		engines.spot.setDao(this.dao);
		engines.spot.setSearch(search);
		engines.spot.setRefreshInterval(getProperty("sarsoft.location.spot.refreshInterval"));
		engines.spot.start();
		
		if(engines.aprst2 != null && engines.aprst2.isAlive()) engines.aprst2.quit();
		engines.aprst2 = new APRSTier2Engine();
		engines.aprst2.setDao(this.dao);
		engines.aprst2.setSearch(search);
		engines.aprst2.start();
		
		if(REST.equals(mode)) return "/json";
		return adminController.homePage(model);
	}

	@RequestMapping(value = "/{mode}/location/stop", method = RequestMethod.GET)
	public String stopLocationEngine(Model model, @PathVariable("mode") String mode, HttpServletRequest request) {
		String search = RuntimeProperties.getSearch();
		EngineList engines = locationEngines.get(search);
		if(engines != null) {
			locationEngines.remove(search);
			if(engines.spot != null && engines.spot.isAlive()) engines.spot.quit();
			if(engines.aprst2 != null && engines.aprst2.isAlive()) engines.aprst2.quit();
		}
		if(REST.equals(mode)) return "/json";
		return adminController.homePage(model);
	}

	@RequestMapping(value="/app/resource/new", method = RequestMethod.POST)
	public String createResource(Model model, HttpServletRequest request,
		@RequestParam(value="name", required=true) String name, @RequestParam(value="callsign", required=false) String callsign, 
		@RequestParam(value="spotId", required=false) String spotId, @RequestParam(value="spotPassword", required=false) String spotPassword) {
		long maxId = 0L;
		List<Resource> resources = (List<Resource>) dao.loadAll(Resource.class);
		for(Resource resource : resources) {
			maxId = Math.max(maxId, resource.getId());
		}
		Resource resource = new Resource();
		resource.setId(maxId+1);
		resource.setName(name);
		resource.setCallsign(callsign);
		resource.setSpotId(spotId);
		resource.setSpotPassword(spotPassword);
		dao.save(resource);
		
		return "redirect:/app/resource/" + resource.getId();
	}

	@RequestMapping(value="/app/resource/{resourceid}", method = RequestMethod.POST)
	public String updateResource(Model model, HttpServletRequest request, @PathVariable("resourceid") long id, 
			@RequestParam(value="name", required=true) String name, @RequestParam(value="callsign", required=false) String callsign, 
			@RequestParam(value="spotId", required=false) String spotId, @RequestParam(value="spotPassword", required=false) String spotPassword) {
		Resource resource = (Resource) dao.load(Resource.class, id);
		if(request.getParameter("action") != null && Action.valueOf(request.getParameter("action")) == Action.DELETE) {			
			dao.delete(resource);
			return getAppResources(model);
		}
		resource.setName(name);
		resource.setCallsign(callsign);
		resource.setSpotId(spotId);
		resource.setSpotPassword(spotPassword);
		dao.save(resource);
		model.addAttribute("resource", resource);
		return app(model, "Resource.Detail");
	}
	
	@RequestMapping(value="/app/resource", method = RequestMethod.GET)
	public String getAppResources(Model model) {
			return app(model, "Resource.List");
	}
	
	@RequestMapping(value="/rest/resource", method = RequestMethod.GET)
	public String getRestResources(Model model) {
		@SuppressWarnings("rawtypes")
		List resources = dao.loadAll(Resource.class);
		return json(model, resources);
	}
	
	@RequestMapping(value="/rest/callsign", method = RequestMethod.GET)
	public String getCallsigns(Model model) {
		return getCallsignsSince(model, 1);
	}
	
	@SuppressWarnings({ "rawtypes", "unchecked" })
	@RequestMapping(value="/rest/callsign/since/{date}", method = RequestMethod.GET)
	public String getCallsignsSince(Model model, @PathVariable("date") long date) {
		EngineList engines = locationEngines.get(RuntimeProperties.getSearch());
		if(engines != null && engines.aprst2 != null) {
			Map<String, Waypoint> csmap = engines.aprst2.getCallsigns();
			List cslist = new ArrayList();
			for(String callsign : csmap.keySet()) {
				Waypoint wpt = csmap.get(callsign);
				if(wpt != null && wpt.getTime().getTime() > date) {
					Map m = new HashMap();
					m.put("callsign", callsign);
					m.put("name", callsign);
					m.put("position", csmap.get(callsign));
					cslist.add(m);
				}
			}
			return json(model, cslist);
		}
		return json(model, new Object());
	}
	
	

	@RequestMapping(value="/{mode}/resource/{resourceid}", method = RequestMethod.GET)
	public String getResource(Model model, @PathVariable("mode") String mode, @PathVariable("resourceid") long resourceid) {
		Resource resource = (Resource) dao.load(Resource.class, resourceid);
		if(REST.equals(mode)) return json(model, resource);
		model.addAttribute("resource", resource);
		return app(model, "Resource.Detail");
	}

	@RequestMapping(value="/{mode}/resource/{resourceid}/detach/{assignmentid}", method = RequestMethod.GET)
	public String detachResource(Model model, @PathVariable("mode") String mode, @PathVariable("resourceid") long resourceid, @PathVariable("assignmentid") long assignmentid, HttpServletRequest request) {
		SearchAssignment assignment = (SearchAssignment) dao.load(SearchAssignment.class, assignmentid);
		Resource resource = (Resource) dao.load(Resource.class, resourceid);
		assignment.removeResource(resource);
		dao.save(assignment);
		dao.save(resource);
		if(REST.equals(mode)) return json(model, null);
		return searchAssignmentController.getAssignment(model, assignmentid, request);
	}

	@RequestMapping(value="/{mode}/resource/{resourceid}/attach/{assignmentid}", method = RequestMethod.GET)
	public String assignResource(Model model, @PathVariable("mode") String mode, @PathVariable("resourceid") long resourceid, @PathVariable("assignmentid") long assignmentid, HttpServletRequest request) {
		SearchAssignment assignment = (SearchAssignment) dao.load(SearchAssignment.class, assignmentid);
		Resource resource = (Resource) dao.load(Resource.class, resourceid);
		assignment.addResource(resource);
		dao.save(assignment);
		if(REST.equals(mode)) return json(model, null);
		return searchAssignmentController.getAssignment(model, assignmentid, request);
	}

	@SuppressWarnings("unchecked")
	@RequestMapping(value="/rest/resource/since/{date}", method = RequestMethod.GET)
	public String getResourcesUpdatedSince(@PathVariable("date") long date, Model model) {
		return json(model, dao.loadSince(Resource.class, new Date(date)));
	}

	@RequestMapping(value="/app/resource/map", method = RequestMethod.GET)
	public String plansEditor(Model model) {
		return app(model, "/ops/resourcemap");
	}

}