package org.sarsoft.plans.controller;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import net.sf.json.JSONObject;

import org.sarsoft.common.controller.AdminController;
import org.sarsoft.common.controller.CommonController;
import org.sarsoft.common.controller.JSONBaseController;
import org.sarsoft.common.controller.JSONForm;
import org.sarsoft.common.model.Action;
import org.sarsoft.common.model.Format;
import org.sarsoft.common.model.GeoRefImage;
import org.sarsoft.common.model.JSONAnnotatedPropertyFilter;
import org.sarsoft.common.model.Tenant;
import org.sarsoft.common.model.UserAccount;
import org.sarsoft.common.model.Waypoint;
import org.sarsoft.plans.Constants;
import org.sarsoft.common.util.RuntimeProperties;
import org.sarsoft.ops.controller.OpsController;
import org.sarsoft.plans.SearchAssignmentGPXHelper;
import org.sarsoft.plans.model.OperationalPeriod;
import org.sarsoft.plans.model.Search;
import org.sarsoft.plans.model.SearchAssignment;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.ServletRequestDataBinder;
import org.springframework.web.bind.annotation.InitBinder;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.multipart.support.StringMultipartFileEditor;

@Controller
public class SearchController extends JSONBaseController {

	@Autowired
	OpsController opsController;

	@Autowired
	AdminController adminController;
	
	@InitBinder
	public void initBinder(HttpServletRequest request, ServletRequestDataBinder binder) throws ServletException {
		binder.registerCustomEditor(String.class, new StringMultipartFileEditor());
	}
	
	public void addConstantsToModel(Model model) {
		model.addAttribute("json", JSONAnnotatedPropertyFilter.fromObject(Constants.all));
		model.addAttribute("mapSources", getMapSources());
		model.addAttribute("tileCacheEnabled", Boolean.parseBoolean(getProperty("sarsoft.map.tileCacheEnabled")));
		model.addAttribute("geoRefImages", dao.getAllByAttr(GeoRefImage.class, "referenced", Boolean.TRUE));
		model.addAttribute("defaultZoom", getProperty("sarsoft.map.default.zoom"));
		model.addAttribute("defaultLat", getProperty("sarsoft.map.default.lat"));
		model.addAttribute("defaultLng", getProperty("sarsoft.map.default.lng"));
	}
	
	@RequestMapping(value="/app/constants.js", method = RequestMethod.GET)
	public String getConstants(Model model) {
		addConstantsToModel(model);
		Search search = dao.getByAttr(Search.class, "name", RuntimeProperties.getTenant());
		if(getProperty("sarsoft.map.datum") != null) model.addAttribute("datum", getProperty("sarsoft.map.datum"));
		if(search != null && search.getDatum() != null) model.addAttribute("datum", search.getDatum());
		return "/global/constants";
	}

	@RequestMapping(value="/app/index.html", method = RequestMethod.GET)
	public String homePage(Model model) {
		OperationalPeriod lastPeriod = null;
		List<OperationalPeriod> periods = dao.loadAll(OperationalPeriod.class);
		for(OperationalPeriod period : periods) {
			if(lastPeriod == null || lastPeriod.getId() < period.getId()) lastPeriod = period;
		}
		model.addAttribute("lastperiod", lastPeriod);
		model.addAttribute("periods", periods);
		model.addAttribute("assignments", dao.loadAll(SearchAssignment.class));
		model.addAttribute("imageUploadEnabled", Boolean.parseBoolean(getProperty("sarsoft.map.imageUploadEnabled")));
		model.addAttribute("server", RuntimeProperties.getServerUrl());
		opsController.checkLocators();
		return app(model, "Pages.Home");
	}

	@RequestMapping(value="/app/setsearch", method = RequestMethod.GET)
	public String chooseNewSearch(Model model, HttpServletRequest request) {
		return bounce(model);
	}
	
	@RequestMapping(value="/app/setsearch/{ds}", method = RequestMethod.GET)
	public String setAppDataSchema(Model model, @PathVariable("ds") String name, HttpServletRequest request) {
		String val = adminController.setTenant(model, name, Search.class, request);
		opsController.checkLocators();
		if(val != null) return val;
		return homePage(model);
	}
	
	@RequestMapping(value="/app/setsearch", method = RequestMethod.POST)
	public String createNewAppDataSchema(Model model, HttpServletRequest request) {
		String val = adminController.createNewTenant(model, Search.class, request);
		if(val == null) {
			Search search = dao.getByAttr(Search.class, "name", request.getParameter("name"));
			if(search != null) {
				String op1name = request.getParameter("op1name");
				String lat = request.getParameter("lat");
				String lng = request.getParameter("lng");
				if(getProperty("sarsoft.map.datum") != null) search.setDatum(getProperty("sarsoft.map.datum"));
				OperationalPeriod period = new OperationalPeriod();
				period.setDescription((op1name != null && op1name.length() > 0) ? op1name : "first operational period");
				period.setId(1L);
				dao.save(period);
				if(lat != null && lat.length() > 0 && lng != null && lng.length() > 0) {
					Waypoint lkp = new Waypoint(Double.parseDouble(lat), Double.parseDouble(lng));
					search.setLkp(lkp);
				}
				dao.save(search);

			}
			return homePage(model);
		}
		return val;
	}
		
	@RequestMapping(value ="/rest/search/mapConfig", method = RequestMethod.GET)
	public String getSearchProperty(Model model, HttpServletRequest request, HttpServletResponse response) {
		Search search = dao.getByAttr(Search.class, "name", RuntimeProperties.getTenant());
		Map<String, String> map = new HashMap<String, String>();
		map.put("value", search.getMapConfig());
		return json(model, map);
	}

	@SuppressWarnings("rawtypes")
	@RequestMapping(value = "/rest/search/mapConfig", method = RequestMethod.POST)
	public String setSearchProperty(Model model, JSONForm params) {
		Map m = (Map) JSONObject.toBean(parseObject(params), HashMap.class);
		Search search = dao.getByAttr(Search.class, "name", RuntimeProperties.getTenant());
		search.setMapConfig((String) m.get("value"));
		dao.save(search);
		return json(model, search);
	}

	@RequestMapping(value = "/rest/search/lkp", method = RequestMethod.GET)
	public String getLkp(Model model, HttpServletRequest request, HttpServletResponse response) {
		Search search = dao.getByAttr(Search.class, "name", RuntimeProperties.getTenant());
		Map<String, Object> map = new HashMap<String, Object>();
		map.put("value", search.getLkp());
		return json(model, map);
	}

	@RequestMapping(value = "/rest/search/pls", method = RequestMethod.GET)
	public String getPls(Model model, HttpServletRequest request, HttpServletResponse response) {
		Search search = dao.getByAttr(Search.class, "name", RuntimeProperties.getTenant());
		Map<String, Object> map = new HashMap<String, Object>();
		map.put("value", search.getPls());
		return json(model, map);
	}

	@RequestMapping(value = "/rest/search/cp", method = RequestMethod.GET)
	public String getCP(Model model, HttpServletRequest request, HttpServletResponse response) {
		Search search = dao.getByAttr(Search.class, "name", RuntimeProperties.getTenant());
		Map<String, Object> map = new HashMap<String, Object>();
		map.put("value", search.getCP());
		return json(model, map);
	}

	@SuppressWarnings("rawtypes")
	protected Waypoint getSearchWpt(JSONForm params) {
		Map<String, Class> classHints = new HashMap<String, Class>();
		classHints.put("value", Waypoint.class);
		Map m = (Map) JSONObject.toBean(parseObject(params), HashMap.class, classHints);
		return (Waypoint) m.get("value");
	}

	@RequestMapping(value = "/rest/search/lkp", method = RequestMethod.POST)
	public String setLkp(Model model, JSONForm params, HttpServletRequest request) {
		Search search = dao.getByAttr(Search.class, "name", RuntimeProperties.getTenant());
		Action action = (request.getParameter("action") != null) ? Action.valueOf(request.getParameter("action").toUpperCase()) : Action.UPDATE;
		switch(action) {
		case UPDATE : 
			search.setLkp(getSearchWpt(params));
			break;
		case DELETE :
			search.setLkp(null);
			break;
		}
		dao.save(search);
		return json(model, search);
	}

	@RequestMapping(value = "/rest/search/pls", method = RequestMethod.POST)
	public String setPls(Model model, JSONForm params, HttpServletRequest request) {
		Search search = dao.getByAttr(Search.class, "name", RuntimeProperties.getTenant());
		Action action = (request.getParameter("action") != null) ? Action.valueOf(request.getParameter("action").toUpperCase()) : Action.UPDATE;
		switch(action) {
		case UPDATE : 
			search.setPls(getSearchWpt(params));
			break;
		case DELETE :
			search.setPls(null);
			break;
		}
		dao.save(search);
		return json(model, search);
	}

	@RequestMapping(value = "/rest/search/cp", method = RequestMethod.POST)
	public String setCP(Model model, JSONForm params, HttpServletRequest request) {
		Search search = dao.getByAttr(Search.class, "name", RuntimeProperties.getTenant());
		Action action = (request.getParameter("action") != null) ? Action.valueOf(request.getParameter("action").toUpperCase()) : Action.UPDATE;
		switch(action) {
		case UPDATE : 
			search.setCP(getSearchWpt(params));
			break;
		case DELETE :
			search.setCP(null);
			break;
		}
		dao.save(search);
		return json(model, search);
	}

	@RequestMapping(value="/app/search/delete", method = RequestMethod.GET)
	public String delete(Model model, HttpServletRequest request) {
		boolean isOwner = false;
		String name = RuntimeProperties.getTenant();
		UserAccount account = dao.getByAttr(UserAccount.class, "name", RuntimeProperties.getUsername());
		if(account != null) {
			for(Tenant tenant : account.getTenants()) {
				if(name.equalsIgnoreCase(tenant.getName())) isOwner = true;
			}
		}
		if(isHosted() && isOwner == false) {
			model.addAttribute("message", "You can only admin this search if you own it.");
			return admin(model, request);
		}
		List<OperationalPeriod> l = dao.loadAll(OperationalPeriod.class);
		if(l == null || l.size() == 0) {
			Search search = dao.getByAttr(Search.class, "name", RuntimeProperties.getTenant());
			search.getAccount().getTenants().remove(search);
			dao.save(account);
			RuntimeProperties.setTenant(null);
			request.getSession(true).removeAttribute("tenant");
			return bounce(model);
		}
		else return admin(model, request);
	}

	@RequestMapping(value="/app/search", method = RequestMethod.GET)
	public String admin(Model model, HttpServletRequest request) {
		boolean isOwner = false;
		String name = RuntimeProperties.getTenant();
		UserAccount account = (UserAccount) dao.getByAttr(UserAccount.class, "name", RuntimeProperties.getUsername());
		if(account != null) {
			for(Tenant tenant : account.getTenants()) {
				if(name.equalsIgnoreCase(tenant.getName())) isOwner = true;
			}
		}
		if(isHosted() && isOwner == false) {
			model.addAttribute("message", "You can only admin this search if you own it.");
			return "error";
		}
		model.addAttribute("tenant", dao.getByAttr(Search.class, "name", RuntimeProperties.getTenant()));
		model.addAttribute("hosted", isHosted());
		model.addAttribute("server", RuntimeProperties.getServerUrl());
		List<OperationalPeriod> l = dao.loadAll(OperationalPeriod.class);
		model.addAttribute("deleteable", (l == null || l.size() == 0) ? true : false);
		return app(model, "Pages.Search");
	}

	@RequestMapping(value="/app/search", method = RequestMethod.POST)
	public String update(Model model, HttpServletRequest request) {
		boolean isOwner = false;
		String name = RuntimeProperties.getTenant();
		UserAccount account = dao.getByAttr(UserAccount.class, "name", RuntimeProperties.getUsername());
		if(account != null) {
			for(Tenant tenant : account.getTenants()) {
				if(name.equalsIgnoreCase(tenant.getName())) isOwner = true;
			}
		}
		if(isHosted() && isOwner == false) {
			model.addAttribute("message", "You can only admin this search if you own it.");
			return "error";
		}
		Search search = dao.getByAttr(Search.class, "name", RuntimeProperties.getTenant());
		if(request.getParameter("description") != null && request.getParameter("description").length() > 0) {
			search.setDescription(request.getParameter("description"));
			dao.save(search);
		}
		search.setVisible("public".equalsIgnoreCase(request.getParameter("public")));
		if(request.getParameter("password") != null && request.getParameter("password").length() > 0) {
			search.setPassword(hash(request.getParameter("password")));
		}
		search.setDatum(request.getParameter("datum"));
		dao.save(search);
		List<OperationalPeriod> l = dao.loadAll(OperationalPeriod.class);
		model.addAttribute("deleteable", (l == null || l.size() == 0) ? true : false);
		model.addAttribute("tenant", search);
		model.addAttribute("server", RuntimeProperties.getServerUrl());
		return app(model, "Pages.Search");
	}

	@RequestMapping(value = "/rest/search", method= RequestMethod.POST)
	public void bulkGPXUpload(JSONForm params, Model model, HttpServletRequest request, HttpServletResponse response) {
		Format format = (request.getParameter("format") != null) ? Format.valueOf(request.getParameter("format").toUpperCase()) : Format.GPX;

		Object obj;
		switch(format) {
		case GPX :
			if(params.getFile() != null) {
				obj = parseGPXFile(request, params.getFile(), "/xsl/gpx/gpx2search.xsl");
			} else {
				obj = parseGPXJson(request, params.getJson(), "/xsl/gpx/gpx2search.xsl");
			}
			break;
		default :
			obj = parseObject(params);
		}

		SearchAssignmentGPXHelper.updateSearch((JSONObject) obj, dao);

		try {
			response.sendRedirect("/app/index.html");
		} catch (IOException e) {}
	}

	@RequestMapping(value ="/rest/search", method = RequestMethod.GET)
	public String bulkGPXDownload(Model model, HttpServletRequest request, HttpServletResponse response) {
		Format format = (request.getParameter("format") != null) ? Format.valueOf(request.getParameter("format").toUpperCase()) : Format.JSON;
		List<SearchAssignment >assignments = dao.loadAll(SearchAssignment.class);

		switch (format) {
		case GPX :
			response.setHeader("Content-Disposition", "attachment; filename=" + RuntimeProperties.getTenant() + ".gpx");
			return gpx(model, SearchAssignmentGPXHelper.gpxifySearch(dao.getByAttr(Search.class, "name", RuntimeProperties.getTenant()), dao), "Search");
		case KML :
			response.setHeader("Content-Disposition", "attachment; filename=" + RuntimeProperties.getTenant() + ".kml");
			return kml(model, assignments, "SearchAssignments");
		default :
			return json(model, assignments);
		}
	}
		
}
