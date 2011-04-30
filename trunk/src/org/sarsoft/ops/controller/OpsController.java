package org.sarsoft.ops.controller;

import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.sarsoft.admin.controller.AdminController;
import org.sarsoft.common.controller.JSONBaseController;
import org.sarsoft.common.controller.JSONForm;
import org.sarsoft.common.model.Action;
import org.sarsoft.common.model.Format;
import org.sarsoft.common.model.Waypoint;
import org.sarsoft.common.util.RuntimeProperties;
import org.sarsoft.ops.model.Resource;
import org.sarsoft.ops.model.Resource.Type;
import org.sarsoft.ops.service.location.APRSLocalEngine;
import org.sarsoft.ops.service.location.APRSTier2Engine;
import org.sarsoft.ops.service.location.SpotLocationEngine;
import org.sarsoft.ops.service.location.AsyncTransactionalEngine.Status;
import org.sarsoft.plans.SearchAssignmentGPXHelper;
import org.sarsoft.plans.controller.SearchAssignmentController;
import org.sarsoft.plans.model.SearchAssignment;
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
public class OpsController extends JSONBaseController {

	@Autowired
	AdminController adminController;
	public class EngineList {
		public APRSTier2Engine aprst2;
		public APRSLocalEngine aprsLocal;
		public SpotLocationEngine spot;

		public APRSTier2Engine getAprst2() {return aprst2;}
		public APRSLocalEngine getAprsLocal() {return aprsLocal;}
		public SpotLocationEngine getSpot() {return spot;}
	}
	private static Map<String, EngineList> locationEngines = new HashMap<String, EngineList>();

	@Autowired
	SearchAssignmentController searchAssignmentController;
	
	@InitBinder
	public void initBinder(HttpServletRequest request, ServletRequestDataBinder binder) throws ServletException {
		binder.registerCustomEditor(String.class, new StringMultipartFileEditor());
	}

	public static boolean isLocationEnabled(String search) {
		return locationEngines.containsKey(search);
	}
	
	private APRSTier2Engine createAprst2() {
		APRSTier2Engine aprst2 = new APRSTier2Engine();
		aprst2.setDao(this.dao);
		aprst2.setSearch(RuntimeProperties.getSearch());
		aprst2.setAprsFiKey(getProperty("sarsoft.location.aprs.fi.key"));
		aprst2.setUser(getProperty("sarsoft.location.aprs.is.user"));
		aprst2.setServer(getProperty("sarsoft.location.aprs.is.serverName"));
		aprst2.setPort(Integer.parseInt(getProperty("sarsoft.location.aprs.is.serverPort")));
		return aprst2;
	}
	
	private APRSLocalEngine createAprsLocal() {
		APRSLocalEngine aprsLocal = new APRSLocalEngine();
		aprsLocal.setDao(this.dao);
		aprsLocal.setSearch(RuntimeProperties.getSearch());
		aprsLocal.setAprsFiKey(getProperty("sarsoft.location.aprs.fi.key"));
		aprsLocal.setUser(getProperty("sarsoft.location.aprs.is.user"));
		return aprsLocal;
	}
	
	private SpotLocationEngine createSpot() {
		SpotLocationEngine spot = new SpotLocationEngine();
		spot.setDao(this.dao);
		spot.setSearch(RuntimeProperties.getSearch());
		spot.setRefreshInterval(getProperty("sarsoft.location.spot.refreshInterval"));
		return spot;
	}
	
	public void checkLocators() {
		String search = RuntimeProperties.getSearch();
		EngineList engines = locationEngines.get(search);
		if(engines == null) {
			engines = new EngineList();
			locationEngines.put(search, engines);
		}

		if(engines.spot == null || !engines.spot.isAlive()) {
			engines.spot = createSpot();
			engines.spot.start();
		} else {
			engines.spot.keepAlive();
		}
		
		if((engines.aprst2 == null || !engines.aprst2.isAlive()) && Boolean.parseBoolean(getProperty("sarsoft.location.aprs.is.enabled"))) {
			engines.aprst2 = createAprst2();
			engines.aprst2.start();
		} else if(engines.aprst2 != null) {
			engines.aprst2.keepAlive();
		}

		if((engines.aprsLocal == null || !engines.aprsLocal.isAlive()) && Boolean.parseBoolean(getProperty("sarsoft.location.aprs.local.enabled"))) {
			engines.aprsLocal = createAprsLocal();
			engines.aprsLocal.start();
		} else if(engines.aprsLocal != null) {
			engines.aprsLocal.keepAlive();
		}
	}
	
	@RequestMapping(value = "/app/location/status", method = RequestMethod.GET)
	public String checkLocationEngines(Model model) {
		checkLocators();
		
		model.addAttribute("engines", locationEngines.get(RuntimeProperties.getSearch()));
		
		return app(model, "Location.Status");
	}
	
	@RequestMapping(value = "/app/location/reset", method = RequestMethod.GET)
	public String resetLocationEngines(Model model) {
		EngineList engines = locationEngines.get(RuntimeProperties.getSearch());
		if(engines.spot != null) {
			engines.spot.quit();
			engines.spot = null;
		}
		if(engines.aprst2 != null) {
			engines.aprst2.quit();
			engines.aprst2 = null;
		}
		if(engines.aprsLocal != null) {
			engines.aprsLocal.quit();
			engines.aprsLocal = null;
		}
		
		checkLocators();
		
		return "redirect:/app/location/status";
	}
	
	@SuppressWarnings("unchecked")
	@RequestMapping(value = "/app/location/check", method = RequestMethod.GET)
	public String checkLocations(Model model) {
		APRSTier2Engine aprs = createAprst2();
		SpotLocationEngine spot = createSpot();
		for(Resource resource : (List<Resource>) dao.loadAll(Resource.class)) {
			aprs.checkAprsFi(resource);
			spot.checkSpot(resource);
		}			
		return "redirect:/app/location/status";
	}

	@RequestMapping(value="/app/resource/new", method = RequestMethod.POST)
	public String createResource(Model model, HttpServletRequest request,
		@RequestParam(value="name", required=true) String name, @RequestParam(value="type", required=true) String type, 
		@RequestParam(value="agency", required=false) String agency, @RequestParam(value="callsign", required=false) String callsign, 
		@RequestParam(value="spotId", required=false) String spotId, @RequestParam(value="spotPassword", required=false) String spotPassword) {
		long maxId = 0L;
		List<Resource> resources = (List<Resource>) dao.loadAll(Resource.class);
		for(Resource resource : resources) {
			maxId = Math.max(maxId, resource.getId());
		}
		Resource resource = new Resource();
		resource.setId(maxId+1);
		resource.setName(name);
		resource.setType(Type.valueOf(type));
		resource.setAgency(agency);
		resource.setCallsign(callsign);
		resource.setSpotId(spotId);
		resource.setSpotPassword(spotPassword);
		dao.save(resource);

		EngineList engines = locationEngines.get(RuntimeProperties.getSearch());		
		if(engines.aprst2 != null) engines.aprst2.updateFilter();
		
		String assignmentId = request.getParameter("assignmentId");
		if(assignmentId != null && assignmentId.length() > 0) {
			long id = Long.parseLong(assignmentId);
			SearchAssignment assignment = (SearchAssignment) dao.load(SearchAssignment.class, id);
			assignment.addResource(resource);
			dao.save(assignment);
		}
		String redirect = request.getParameter("redirect");
		if(redirect != null && redirect.length() > 0) return "redirect:" + redirect;
		return "redirect:/app/resource/" + resource.getId();
	}
	
	@RequestMapping(value="/app/resource", method = RequestMethod.POST)
	public String importResources(Model model, JSONForm params, HttpServletRequest request) {
		String csv = params.getFile();
		if(csv != null) {
			long maxId = 0L;
			List<Resource> resources = (List<Resource>) dao.loadAll(Resource.class);
			for(Resource resource : resources) {
				maxId = Math.max(maxId, resource.getId());
			}
			String[] rows = csv.split("\n");
			for(String row : rows) {
				String[] cols = row.split(",");
				String name = cols[0];
				String callsign = cols[1];
				if("callsign".equalsIgnoreCase(callsign) || "name".equalsIgnoreCase(name)) continue;
				Resource resource = (Resource) dao.getByAttr(Resource.class, "callsign", callsign);
				if(resource != null) {
					if(cols.length > 4)
						if(resource.getSpotId() == null) resource.setSpotId(cols[4]);
					if(cols.length > 5)
						if(resource.getSpotPassword() == null) resource.setSpotPassword(cols[5]);
				} else {
					resource = new Resource();
					resource.setId(maxId);
					maxId++;
					resource.setType(Type.valueOf(cols[2]));
					resource.setAgency(cols[3]);
					resource.setName(name);
					resource.setCallsign(callsign);
					if(cols.length > 4)
						resource.setSpotId(cols[4]);
					if(cols.length > 5)
						resource.setSpotPassword(cols[5]);
				}
				dao.save(resource);
			}
		}
		return "redirect:/app/resource/";
	}

	@RequestMapping(value="/app/resource/{resourceid}", method = RequestMethod.POST)
	public String updateResource(Model model, HttpServletRequest request, HttpServletResponse response, @PathVariable("resourceid") long id, 
			@RequestParam(value="name", required=true) String name, @RequestParam(value="type", required=true) String type, 
			@RequestParam(value="agency", required=false) String agency, @RequestParam(value="callsign", required=false) String callsign, 
			@RequestParam(value="spotId", required=false) String spotId, @RequestParam(value="spotPassword", required=false) String spotPassword) {
		Resource resource = (Resource) dao.load(Resource.class, id);
		if(request.getParameter("action") != null && Action.valueOf(request.getParameter("action")) == Action.DELETE) {			
			if(resource.getAssignment() != null) {
				SearchAssignment assignment = resource.getAssignment();
				assignment.removeResource(resource);
				dao.save(assignment);
			}
			dao.delete(resource);
			return getAppResources(model, request, response);
		}
		resource.setName(name);
		resource.setCallsign(callsign);
		resource.setType(Type.valueOf(type));
		resource.setAgency(agency);
		resource.setSpotId(spotId);
		resource.setSpotPassword(spotPassword);
		dao.save(resource);
		
		EngineList engines = locationEngines.get(RuntimeProperties.getSearch());		
		if(engines.aprst2 != null) engines.aprst2.updateFilter();

		model.addAttribute("resource", resource);
		return "redirect:/app/resource/" + id;
	}
	
	@RequestMapping(value="/app/resource", method = RequestMethod.GET)
	public String getAppResources(Model model, HttpServletRequest request, HttpServletResponse response) {
		Format format = (request.getParameter("format") != null) ? Format.valueOf(request.getParameter("format").toUpperCase()) : Format.WEB;

		switch (format) {
		case CSV:
			response.setHeader("Content-Disposition", "attachment; filename=resourcelist.csv");
			model.addAttribute("resources", dao.loadAll(Resource.class));
			return "/ops/resourcelist-csv";
		default:
			return app(model, "Resource.List");
		}
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
	
	@RequestMapping(value="/app/callsign/clear", method = RequestMethod.GET)
	public String clearCallsigns(Model model) {
		EngineList engines = locationEngines.get(RuntimeProperties.getSearch());
		if(engines.aprst2 != null) engines.aprst2.clearCallsigns();
		if(engines.aprsLocal != null) engines.aprsLocal.clearCallsigns();
		return "redirect:/app/resource";
	}
	
	@SuppressWarnings({ "rawtypes", "unchecked" })
	@RequestMapping(value="/rest/callsign/since/{date}", method = RequestMethod.GET)
	public String getCallsignsSince(Model model, @PathVariable("date") long date) {
		EngineList engines = locationEngines.get(RuntimeProperties.getSearch());
		if(engines != null && engines.aprsLocal != null) {
			Map<String, Waypoint> csmap = new HashMap<String, Waypoint>();
			if(engines.aprst2 != null) csmap.putAll(engines.aprst2.getCallsigns());
			if(engines.aprsLocal != null) csmap.putAll(engines.aprsLocal.getCallsigns());
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
		return "redirect:/app/assignment/" + assignment.getId();
	}

	@RequestMapping(value="/{mode}/resource/{resourceid}/attach/{assignmentid}", method = RequestMethod.GET)
	public String assignResource(Model model, @PathVariable("mode") String mode, @PathVariable("resourceid") long resourceid, @PathVariable("assignmentid") long assignmentid, HttpServletRequest request) {
		SearchAssignment assignment = (SearchAssignment) dao.load(SearchAssignment.class, assignmentid);
		Resource resource = (Resource) dao.load(Resource.class, resourceid);
		if(resource.getAssignment() != null) {
			SearchAssignment old = resource.getAssignment();
			old.removeResource(resource);
			dao.save(old);
		}
		assignment.addResource(resource);
		dao.save(assignment);
		if(REST.equals(mode)) return json(model, null);
		return "redirect:/app/assignment/" + assignment.getId();
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