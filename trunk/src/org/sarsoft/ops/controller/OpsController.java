package org.sarsoft.ops.controller;

import java.io.IOException;
import java.util.Date;
import java.util.List;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.sarsoft.common.controller.JSONBaseController;
import org.sarsoft.common.util.RuntimeProperties;
import org.sarsoft.ops.model.APRSDevice;
import org.sarsoft.ops.model.Resource;
import org.sarsoft.ops.model.LatitudeDevice;
import org.sarsoft.ops.service.location.LocationEngine;
import org.sarsoft.plans.model.SearchAssignment;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

@Controller
public class OpsController extends JSONBaseController {

	private LocationEngine locationEngine = new LocationEngine();

	@RequestMapping(value = "/rest/location/start", method = RequestMethod.GET)
	public String startLocationEngine(Model model) {
		locationEngine.dao = this.dao;
		locationEngine.setSearch(RuntimeProperties.getSearch());
		locationEngine.start();
		return "/json";
	}

	@RequestMapping(value="/rest/resource/new", method = RequestMethod.GET)
	public String createResource(Model model, HttpServletRequest request) {
		String resourceName = request.getParameter("name");
		Long id = Long.parseLong(request.getParameter("id"));
		Resource resource = new Resource();
		resource.setName(resourceName);
		resource.setId(id);
		dao.save(resource);
		return json(model, resource);
	}

	@RequestMapping(value="/rest/resource/{resourceid}/detach/{assignmentid}", method = RequestMethod.GET)
	public String detachResource(Model model, @PathVariable("resourceid") long resourceid, @PathVariable("assignmentid") long assignmentid, HttpServletRequest request) {
		SearchAssignment assignment = (SearchAssignment) dao.load(SearchAssignment.class, assignmentid);
		Resource resource = (Resource) dao.load(Resource.class, resourceid);
		assignment.removeResource(resource);
		dao.save(assignment);
		return json(model, null);
	}

	@RequestMapping(value="/rest/resource/{resourceid}/assign/{assignmentid}", method = RequestMethod.GET)
	public String assignResource(Model model, @PathVariable("resourceid") long resourceid, @PathVariable("assignmentid") long assignmentid, HttpServletRequest request) {
		SearchAssignment assignment = (SearchAssignment) dao.load(SearchAssignment.class, assignmentid);
		Resource resource = (Resource) dao.load(Resource.class, resourceid);
		assignment.addResource(resource);
		dao.save(assignment);
		return json(model, null);
	}

	@RequestMapping(value="/rest/assignment/{assignmentid}/newlatituderesource", method = RequestMethod.GET)
	public String createNewLatitudeDevice(Model mode, @PathVariable("assignmentid") long assignmentid, HttpServletRequest request, HttpServletResponse response) {
		SearchAssignment assignment = (SearchAssignment) dao.load(SearchAssignment.class, assignmentid);
		List<Resource> resources = (List<Resource>) dao.loadAll(Resource.class);
		long maxId = 0L;
		for(Resource resource : resources) {
			maxId = Math.max(maxId, resource.getId());
		}
		Resource resource = new Resource();
		resource.setId(maxId+1);
		resource.setName(request.getParameter("name"));
		assignment.addResource(resource);
		LatitudeDevice device = new LatitudeDevice();
		resource.getLocators().add(device);
		dao.save(assignment);
		try {
			response.sendRedirect(device.createAuthUrl("http://localhost:8080/rest/latitude/" + device.getPk() + "/callback", "mattj.net", "SARSOFT Search and Rescue Software"));
			dao.save(device);
		} catch (Exception e) {
			e.printStackTrace();
		}
		return "/error";
	}

	@RequestMapping(value="/rest/assignment/{assignmentid}/newaprsresource", method = RequestMethod.GET)
	public String createNewAPRSDevice(Model model, @PathVariable("assignmentid") long assignmentid, HttpServletRequest request, HttpServletResponse response) {
		SearchAssignment assignment = (SearchAssignment) dao.load(SearchAssignment.class, assignmentid);
		List<Resource> resources = (List<Resource>) dao.loadAll(Resource.class);
		long maxId = 0L;
		for(Resource resource : resources) {
			maxId = Math.max(maxId, resource.getId());
		}
		Resource resource = new Resource();
		resource.setId(maxId+1);
		resource.setName(request.getParameter("name"));
		assignment.addResource(resource);
		APRSDevice device = new APRSDevice();
		device.setDeviceId(request.getParameter("callsign"));
		resource.getLocators().add(device);
		dao.save(assignment);
		return json(model, assignment);
	}

	@SuppressWarnings("unchecked")
	@RequestMapping(value="/rest/resource/since/{date}", method = RequestMethod.GET)
	public String getResourcesUpdatedSince(@PathVariable("date") long date, Model model) {
		return json(model, dao.loadSince(Resource.class, new Date(date)));
	}

	@RequestMapping(value="/rest/latitude/{resourceid}/new", method = RequestMethod.GET)
	public String createLatitudeDevice(Model model, @PathVariable("resourceid") long resourceid, HttpServletRequest request, HttpServletResponse response) {
		try {
			Resource resource = (Resource) dao.load(Resource.class, resourceid);
			LatitudeDevice device = new LatitudeDevice();
			resource.getLocators().add(device);
			dao.save(resource);
			response.sendRedirect(device.createAuthUrl("http://localhost:8080/rest/latitude/" + device.getPk() + "/callback", "mattj.net", "SARSOFT Search and Rescue Software"));
			dao.save(device);
		} catch (Exception e) {
			e.printStackTrace();
		}
		return "/error";
	}

	@RequestMapping(value ="/rest/latitude/{pk}/callback", method = RequestMethod.GET)
	public String latitudeCallback(Model model, @PathVariable ("pk") long pk, HttpServletRequest request) {
		LatitudeDevice device = (LatitudeDevice) dao.loadByPk(LatitudeDevice.class, pk);
		try {
			device.handleAuthRequest(request.getParameter("oauth_token"), request.getParameter("oauth_verifier"));
			dao.save(device);
		} catch (IOException e) {
			e.printStackTrace();
			return "error";
		}
		return json(model, device);
	}


}