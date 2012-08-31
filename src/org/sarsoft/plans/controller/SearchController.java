package org.sarsoft.plans.controller;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.servlet.ServletException;
import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import net.sf.json.JSONObject;

import org.sarsoft.common.controller.AdminController;
import org.sarsoft.common.controller.JSONBaseController;
import org.sarsoft.common.controller.JSONForm;
import org.sarsoft.common.model.Action;
import org.sarsoft.common.model.Format;
import org.sarsoft.common.model.Tenant;
import org.sarsoft.common.model.Waypoint;
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
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
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
	
	@SuppressWarnings("unused")
	@RequestMapping(value="/searches", method = RequestMethod.GET)
	public String searchesPage(Model model) {
		String tenant = RuntimeProperties.getTenant();
		if(tenant != null) {
			// Pre-load search object so that it gets instantiated as a Search and not as a Tenant
			Search search = dao.getByAttr(Search.class, "name", tenant);
		}
		return app(model, "Pages.Searches");
	}
	
	@RequestMapping(value="/plans", method = RequestMethod.GET)
	public String homePage(Model model) {
		OperationalPeriod lastPeriod = null;
		List<OperationalPeriod> periods = dao.loadAll(OperationalPeriod.class);
		for(OperationalPeriod period : periods) {
			if(lastPeriod == null || lastPeriod.getId() < period.getId()) lastPeriod = period;
		}
		model.addAttribute("period", lastPeriod);
		model.addAttribute("periods", periods);
		model.addAttribute("assignments", dao.loadAll(SearchAssignment.class));
		opsController.checkLocators();
		return app(model, "OperationalPeriod.Detail");
	}
	
	@RequestMapping(value="/setup", method = RequestMethod.GET)
	public String setup(Model model) {
		model.addAttribute("server", RuntimeProperties.getServerUrl());
		return app(model, "Search.Setup");
	}

	@RequestMapping(value="search", method = RequestMethod.GET)
	public String setAppDataSchema(Model model, @RequestParam(value="id", required=false) String name, HttpServletRequest request, HttpServletResponse response) {
		if(name == null) return bounce(model);
		String val = adminController.setTenant(model, name, Search.class, request);
		opsController.checkLocators();
		if(val != null) return val;
		if(name != null) {
			Cookie[] cookies = request.getCookies();
			Cookie myCookie = null;
			if(cookies != null) for(Cookie cookie : cookies) {
				if("org.sarsoft.recentlyLoadedSearches".equals(cookie.getName())) {
					myCookie = cookie;
				}
			}
			if(myCookie != null && myCookie.getValue() != null) {
				String value = myCookie.getValue();
				value = value.replaceAll("(^|,)" + name + "(,|$)", ",");
				value = value.replaceAll(",,", ",");
				if(value.length() > 0 && !value.endsWith(",")) value = value + ",";
				if(value.startsWith(",")) value = value.substring(1);
				myCookie.setValue(value);
			} else {
				myCookie = new Cookie("org.sarsoft.recentlyLoadedSearches","");
			}
			Tenant tenant = dao.getByPk(Tenant.class, RuntimeProperties.getTenant());
			myCookie.setValue(myCookie.getValue() + name);
			myCookie.setMaxAge(7776000);
			response.addCookie(myCookie);
		}
		return homePage(model);
	}
	
	@RequestMapping(value="/search", method = RequestMethod.POST)
	public String createNewAppDataSchema(Model model, HttpServletRequest request) {
		String val = adminController.createNewTenant(model, Search.class, request);
		if(val == null) {
			Search search = dao.getByAttr(Search.class, "name", RuntimeProperties.getTenant());
			if(search != null) {
				String lat = request.getParameter("lat");
				String lng = request.getParameter("lng");
				if(lat != null && lat.length() > 0 && lng != null && lng.length() > 0) {
					Waypoint lkp = new Waypoint(Double.parseDouble(lat), Double.parseDouble(lng));
					search.setLkp(lkp);
				}

				dao.save(search);

				String op1name = request.getParameter("op1name");				
                OperationalPeriod period = new OperationalPeriod();
                period.setDescription((op1name != null && op1name.length() > 0) ? op1name : "first operational period");
                period.setId(1L);
                dao.save(period);                
			}
			return "redirect:/search?id=" + RuntimeProperties.getTenant();
		}
		return val;
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
			response.sendRedirect("/plans");
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
