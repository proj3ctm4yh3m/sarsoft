package org.sarsoft.ops.controller;

import java.io.IOException;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.sarsoft.admin.controller.AdminController;
import org.sarsoft.common.controller.JSONBaseController;
import org.sarsoft.common.model.Action;
import org.sarsoft.common.util.RuntimeProperties;
import org.sarsoft.ops.model.APRSDevice;
import org.sarsoft.ops.model.LocationEnabledDevice;
import org.sarsoft.ops.model.Resource;
import org.sarsoft.ops.model.LatitudeDevice;
import org.sarsoft.ops.model.SpotDevice;
import org.sarsoft.ops.service.location.LocationEngine;
import org.sarsoft.plans.controller.SearchAssignmentController;
import org.sarsoft.plans.model.Search;
import org.sarsoft.plans.model.SearchAssignment;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

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
			if(LatitudeDevice.clientSharedSecret == null) LatitudeDevice.clientSharedSecret = getProperty("google.latitude.clientSharedSecret");
			engine.setLatitudeRefreshInterval(getProperty("google.latitude.refreshInterval"));
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

	@RequestMapping(value="/{mode}/resource/new", method = RequestMethod.GET)
	public String createResource(Model model, @PathVariable("mode") String mode, HttpServletRequest request) {
		String resourceName = request.getParameter("name");
		long maxId = 0L;
		List<Resource> resources = (List<Resource>) dao.loadAll(Resource.class);
		for(Resource resource : resources) {
			maxId = Math.max(maxId, resource.getId());
		}
		Resource resource = new Resource();
		resource.setId(maxId+1);
		resource.setName(resourceName);
		dao.save(resource);
		return getResource(model, mode, resource.getId());
	}

	@RequestMapping(value="/{mode}/resource", method = RequestMethod.GET)
	public String getResources(Model model, @PathVariable("mode") String mode, HttpServletRequest request) {
		if(APP.equals(mode)) {
			List<Search> searches = dao.getAllSearches();
//			searches.remove(RuntimeProperties.getSearch());
			model.addAttribute("resources", Boolean.TRUE);
			model.addAttribute("searches", searches);
			return app(model, "Resource.List");
		}
		String section = request.getParameter("section");
		List<Resource> resources;
		if(section != null) {
			resources = (List<Resource>) dao.getAllByAttr(Resource.class, "section", Resource.Section.valueOf(section));
		} else {
			resources = (List<Resource>) dao.loadAll(Resource.class);
		}
		return json(model, resources);
	}

	@RequestMapping(value="/{mode}/resource/{resourceid}", method = RequestMethod.GET)
	public String getResource(Model model, @PathVariable("mode") String mode, @PathVariable("resourceid") long resourceid) {
		Resource resource = (Resource) dao.load(Resource.class, resourceid);
		if(REST.equals(mode)) return json(model, resource);
		model.addAttribute("resource", resource);
		return app(model, "Resource.Detail");
	}

	@RequestMapping(value="/rest/resource/{resourceid}", method = RequestMethod.POST)
	public String modifyResource(Model model, @PathVariable("resourceid") long resourceid, HttpServletRequest request) {
		Resource resource = (Resource) dao.load(Resource.class, resourceid);
		Action action = (request.getParameter("action") != null) ? Action.valueOf(request.getParameter("action").toUpperCase()) : Action.CREATE;
		switch(action) {
		case DELETE :
			dao.delete(resource);
			return json(model, resource);
		}
		return json(model, resource);
	}

	@RequestMapping(value="/{mode}/resource/{resourceid}/detach/{assignmentid}", method = RequestMethod.GET)
	public String detachResource(Model model, @PathVariable("mode") String mode, @PathVariable("resourceid") long resourceid, @PathVariable("assignmentid") long assignmentid, HttpServletRequest request) {
		SearchAssignment assignment = (SearchAssignment) dao.load(SearchAssignment.class, assignmentid);
		Resource resource = (Resource) dao.load(Resource.class, resourceid);
		assignment.removeResource(resource);
		resource.setSection(Resource.Section.REHAB);
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
		resource.setSection(Resource.Section.FIELD);
		dao.save(assignment);
		if(REST.equals(mode)) return json(model, null);
		return searchAssignmentController.getAssignment(model, assignmentid, request);
	}

	@RequestMapping(value="/{mode}/assignment/{assignmentid}/newlatituderesource", method = RequestMethod.GET)
	public String createNewLatitudeDevice(Model model, @PathVariable("mode") String mode, @PathVariable("assignmentid") long assignmentid, HttpServletRequest request, HttpServletResponse response) {
		SearchAssignment assignment = (SearchAssignment) dao.load(SearchAssignment.class, assignmentid);
		List<Resource> resources = (List<Resource>) dao.loadAll(Resource.class);
		long maxId = 0L;
		for(Resource resource : resources) {
			maxId = Math.max(maxId, resource.getId());
		}
		Resource resource = new Resource();
		resource.setId(maxId+1);
		resource.setName(request.getParameter("name"));
		resource.setSection(Resource.Section.FIELD);
		assignment.addResource(resource);
		if(LatitudeDevice.clientSharedSecret == null) LatitudeDevice.clientSharedSecret = getProperty("google.latitude.clientSharedSecret");
		LatitudeDevice device = new LatitudeDevice();
		resource.getLocators().add(device);
		String domain = getProperty("google.latitude.domain");
		dao.save(assignment);
		try {
			response.sendRedirect(device.createAuthUrl("http://" + request.getServerName() + ":" + request.getServerPort() + "/" + mode + "/latitude/" + device.getPk() + "/callback?assignmentId=" + assignment.getId() + "#operations", domain, "SARSOFT Search and Rescue Software"));
			dao.save(device);
		} catch (Exception e) {
			e.printStackTrace();
		}
		return "/error";
	}

	@RequestMapping(value="/{mode}/assignment/{assignmentid}/newaprsresource", method = RequestMethod.GET)
	public String createNewAPRSDevice(Model model, @PathVariable("mode") String mode, @PathVariable("assignmentid") long assignmentid, HttpServletRequest request, HttpServletResponse response) {
		SearchAssignment assignment = (SearchAssignment) dao.load(SearchAssignment.class, assignmentid);
		List<Resource> resources = (List<Resource>) dao.loadAll(Resource.class);
		long maxId = 0L;
		for(Resource resource : resources) {
			maxId = Math.max(maxId, resource.getId());
		}
		Resource resource = new Resource();
		resource.setId(maxId+1);
		resource.setName(request.getParameter("name"));
		resource.setSection(Resource.Section.FIELD);
		assignment.addResource(resource);
		APRSDevice device = new APRSDevice();
		device.setDeviceId(request.getParameter("callsign"));
		resource.getLocators().add(device);
		dao.save(assignment);
		if(REST.equals(mode)) return json(model, assignment);
		return searchAssignmentController.getAssignment(model, assignmentid, request);
	}

	@SuppressWarnings("unchecked")
	@RequestMapping(value="/rest/resource/since/{date}", method = RequestMethod.GET)
	public String getResourcesUpdatedSince(@PathVariable("date") long date, Model model) {
		return json(model, dao.loadSince(Resource.class, new Date(date)));
	}

	@RequestMapping(value="/{mode}/latitude/{resourceid}/new", method = RequestMethod.GET)
	public String createLatitudeDevice(Model model, @PathVariable("mode") String mode, @PathVariable("resourceid") long resourceid, HttpServletRequest request, HttpServletResponse response) {
		try {
			Resource resource = (Resource) dao.load(Resource.class, resourceid);
			if(LatitudeDevice.clientSharedSecret == null) LatitudeDevice.clientSharedSecret = getProperty("google.latitude.clientSharedSecret");
			LatitudeDevice device = new LatitudeDevice();
			resource.getLocators().add(device);
			dao.save(resource);
			String domain = getProperty("google.latitude.domain");
			response.sendRedirect(device.createAuthUrl("http://" + request.getServerName() + ":" + request.getServerPort() + "/" + mode + "/latitude/" + device.getPk() + "/callback?resourceId=" + resource.getId(), domain, "SARSOFT Search and Rescue Software"));
			dao.save(device);
		} catch (Exception e) {
			e.printStackTrace();
		}
		return "/error";
	}

	@RequestMapping(value="/{mode}/aprs/{resourceid}/new", method = RequestMethod.GET)
	public String createAPRSDevice(Model model, @PathVariable("mode") String mode, @PathVariable("resourceid") long resourceid, HttpServletRequest request, HttpServletResponse response) {
		Resource resource = (Resource) dao.load(Resource.class, resourceid);
		APRSDevice device = new APRSDevice();
		device.setDeviceId(request.getParameter("callsign"));
		resource.getLocators().add(device);
		dao.save(resource);
		return getResource(model, mode, resourceid);
	}

	@RequestMapping(value="/{mode}/spot/{resourceid}/new", method = RequestMethod.GET)
	public String createSpotDevice(Model model, @PathVariable("mode") String mode, @PathVariable("resourceid") long resourceid, HttpServletRequest request, HttpServletResponse response) {
		Resource resource = (Resource) dao.load(Resource.class, resourceid);
		SpotDevice device = new SpotDevice();
		device.setDeviceId(request.getParameter("id"));
		String password = request.getParameter("password");
		if(password != null && password.length() > 0)device.setDeviceKey(password);
		resource.getLocators().add(device);
		dao.save(resource);
		return getResource(model, mode, resourceid);
	}

	@RequestMapping(value ="/{mode}/latitude/{pk}/callback", method = RequestMethod.GET)
	public String latitudeCallback(Model model, @PathVariable("mode") String mode, @PathVariable ("pk") long pk, HttpServletRequest request) {
		LatitudeDevice device = (LatitudeDevice) dao.loadByPk(LatitudeDevice.class, pk);
		try {
			device.handleAuthRequest(request.getParameter("oauth_token"), request.getParameter("oauth_verifier"));
			dao.save(device);
		} catch (IOException e) {
			e.printStackTrace();
			return "/error";
		}
		if(REST.equals(mode)) return json(model, device);
		String resourceId = request.getParameter("resourceId");
		if (resourceId != null && resourceId.length() > 0) return getResource(model, mode, Long.parseLong(resourceId));
		String assignmentId = request.getParameter("assignmentId");
		if (assignmentId != null && assignmentId.length() > 0) return searchAssignmentController.getAssignment(model, Long.parseLong(assignmentId), request);
		return adminController.homePage(model);
	}


	@RequestMapping(value="/app/resource/map", method = RequestMethod.GET)
	public String plansEditor(Model model) {
		return app(model, "/ops/resourcemap");
	}


	@RequestMapping(value="/app/resource/{resourceid}/move")
	public String updateResource(Model model, @PathVariable("resourceid") long resourceid, HttpServletRequest request) {
		String sect = request.getParameter("section");
		Resource.Section section = (sect == null || sect.length() == 0) ? null : Resource.Section.valueOf(sect.toUpperCase());
		Resource resource = (Resource) dao.load(Resource.class, resourceid);
		resource.setSection(section);
		if(section != Resource.Section.FIELD && resource.getAssignment() != null) {
			SearchAssignment assignment = resource.getAssignment();
			assignment.removeResource(resource);
			resource.setAssignment(null);
			dao.save(assignment);
		}
		dao.save(resource);
		if("list".equals(request.getParameter("view"))) return app(model, "Resource.List");
		return getResource(model, APP, resource.getId());
	}

	@RequestMapping(value="/app/resource/{resourceid}/locator/{locatorpk}/detach", method = RequestMethod.GET)
	public String detachLocator(Model model, @PathVariable("resourceid") long resourceid, @PathVariable("locatorpk") long locatorpk) {
		Resource resource = (Resource) dao.load(Resource.class, resourceid);
		for(LocationEnabledDevice device : resource.getLocators()) {
			if(device.getPk().equals(locatorpk)) {
				resource.getLocators().remove(device);
				dao.save(resource);
				return getResource(model, APP, resource.getId());
			}
		}
		return getResource(model, APP, resource.getId());
	}

	@RequestMapping(value="/{mode}/resource/bulkimport", method = RequestMethod.GET)
	public String bulkImport(Model model, @PathVariable("mode") String mode, HttpServletRequest request) {
		String searchToImportFrom = request.getParameter("search");
		String search = RuntimeProperties.getSearch();
		if(search.equals(searchToImportFrom)) return "";
		RuntimeProperties.setSearch(searchToImportFrom);
		List<Resource> toImport = (List<Resource>) dao.loadAll(Resource.class);
		RuntimeProperties.setSearch(search);
		List<Resource> existing = (List<Resource>) dao.loadAll(Resource.class);

		long maxId = 0L;
		for(Resource existingResource : existing) {
			maxId = Math.max(maxId, existingResource.getId());
		}

		for(Resource importResource : toImport) {
			maxId++;
			Resource newResource = new Resource();
			newResource.setId(maxId);
			newResource.setName(importResource.getName());
			for(LocationEnabledDevice importLocator : importResource.getLocators()) {
				if(importLocator instanceof APRSDevice) {
					APRSDevice device = new APRSDevice();
					device.setDeviceId(importLocator.getDeviceId());
					device.setDeviceKey(importLocator.getDeviceKey());
					newResource.getLocators().add(device);
				} else if(importLocator instanceof LatitudeDevice) {
					LatitudeDevice device = new LatitudeDevice();
					device.setDeviceId(importLocator.getDeviceId());
					device.setDeviceKey(importLocator.getDeviceKey());
					device.setDomain(((LatitudeDevice) importLocator).getDomain());
					newResource.getLocators().add(device);
				} else if(importLocator instanceof SpotDevice) {
					SpotDevice device = new SpotDevice();
					device.setDeviceId(importLocator.getDeviceId());
					device.setDeviceKey(importLocator.getDeviceKey());
					newResource.getLocators().add(device);
				}
			}
			dao.save(newResource);
		}
		return this.getResources(model, mode, request);
	}


}