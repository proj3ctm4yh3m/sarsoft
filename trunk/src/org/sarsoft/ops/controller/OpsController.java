package org.sarsoft.ops.controller;

import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;

import org.sarsoft.admin.controller.AdminController;
import org.sarsoft.common.controller.JSONBaseController;
import org.sarsoft.common.model.Action;
import org.sarsoft.common.util.RuntimeProperties;
import org.sarsoft.ops.model.Resource;
import org.sarsoft.ops.service.location.LocationEngine;
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
	private static Map<String, LocationEngine> locationEngines = new HashMap<String, LocationEngine>();
	private static LocationEngineMonitor monitor = new LocationEngineMonitor();

	@Autowired
	SearchAssignmentController searchAssignmentController;

	public static boolean isLocationEnabled(String search) {
		return locationEngines.containsKey(search);
	}

	static {
		monitor.setEngineMap(locationEngines);
	}

	@RequestMapping(value = "/{mode}/location/start", method = RequestMethod.GET)
	public String startLocationEngine(Model model, @PathVariable("mode") String mode, HttpServletRequest request) {
		if(!monitor.isAlive()) monitor.start();
		String search = RuntimeProperties.getSearch();
		if(!locationEngines.containsKey(search)) {
			LocationEngine engine = new LocationEngine();
			locationEngines.put(search, engine);
			engine.dao = this.dao;
			engine.setSearch(search);
			engine.setAPRSRefreshInterval(getProperty("sarsoft.location.aprs.refreshInterval"));
			engine.setSpotRefreshInterval(getProperty("sarsoft.location.spot.refreshInterval"));
			engine.start();
		}
		if(REST.equals(mode)) return "/json";
		return adminController.homePage(model);
	}

	@RequestMapping(value = "/{mode}/location/stop", method = RequestMethod.GET)
	public String stopLocationEngine(Model model, @PathVariable("mode") String mode, HttpServletRequest request) {
		String search = RuntimeProperties.getSearch();
		if(locationEngines.containsKey(search)) {
			LocationEngine engine = locationEngines.get(search);
			locationEngines.remove(search);
			engine.quit();
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