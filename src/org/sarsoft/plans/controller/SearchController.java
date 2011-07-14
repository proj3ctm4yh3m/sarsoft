package org.sarsoft.plans.controller;

import java.io.File;
import java.io.IOException;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import net.sf.json.JSONArray;
import net.sf.json.JSONObject;

import org.sarsoft.common.controller.JSONBaseController;
import org.sarsoft.common.controller.JSONForm;
import org.sarsoft.common.dao.GenericHibernateDAO;
import org.sarsoft.common.model.Action;
import org.sarsoft.common.model.Format;
import org.sarsoft.common.model.UserAccount;
import org.sarsoft.common.model.Waypoint;
import org.sarsoft.common.util.RuntimeProperties;
import org.sarsoft.plans.SearchAssignmentGPXHelper;
import org.sarsoft.plans.model.OperationalPeriod;
import org.sarsoft.plans.model.Search;
import org.sarsoft.plans.model.SearchAssignment;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.ServletRequestDataBinder;
import org.springframework.web.bind.annotation.InitBinder;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.multipart.support.StringMultipartFileEditor;

@Controller
public class SearchController extends JSONBaseController {

	@InitBinder
	public void initBinder(HttpServletRequest request, ServletRequestDataBinder binder) throws ServletException {
		binder.registerCustomEditor(String.class, new StringMultipartFileEditor());
	}	
	
	@RequestMapping(value ="/rest/search/mapConfig", method = RequestMethod.GET)
	public String getSearchProperty(Model model, HttpServletRequest request, HttpServletResponse response) {
		Search search = (Search) dao.getByAttr(Search.class, "name", RuntimeProperties.getSearch());
		Map<String, String> map = new HashMap<String, String>();
		map.put("value", search.getMapConfig());
		return json(model, map);
	}

	@RequestMapping(value = "/rest/search/mapConfig", method = RequestMethod.POST)
	public String setSearchProperty(Model model, JSONForm params) {
		Map m = (Map) JSONObject.toBean(parseObject(params), HashMap.class);
		Search search = (Search) dao.getByAttr(Search.class, "name", RuntimeProperties.getSearch());
		search.setMapConfig((String) m.get("value"));
		dao.save(search);
		return json(model, search);
	}

	@RequestMapping(value = "/rest/search/lkp", method = RequestMethod.GET)
	public String getLkp(Model model, HttpServletRequest request, HttpServletResponse response) {
		Search search = (Search) dao.getByAttr(Search.class, "name", RuntimeProperties.getSearch());
		Map<String, Object> map = new HashMap<String, Object>();
		map.put("value", search.getLkp());
		return json(model, map);
	}

	@RequestMapping(value = "/rest/search/pls", method = RequestMethod.GET)
	public String getPls(Model model, HttpServletRequest request, HttpServletResponse response) {
		Search search = (Search) dao.getByAttr(Search.class, "name", RuntimeProperties.getSearch());
		Map<String, Object> map = new HashMap<String, Object>();
		map.put("value", search.getPls());
		return json(model, map);
	}

	@RequestMapping(value = "/rest/search/cp", method = RequestMethod.GET)
	public String getCP(Model model, HttpServletRequest request, HttpServletResponse response) {
		Search search = (Search) dao.getByAttr(Search.class, "name", RuntimeProperties.getSearch());
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
		Search search = (Search) dao.getByAttr(Search.class, "name", RuntimeProperties.getSearch());
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
		Search search = (Search) dao.getByAttr(Search.class, "name", RuntimeProperties.getSearch());
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
		Search search = (Search) dao.getByAttr(Search.class, "name", RuntimeProperties.getSearch());
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
		String name = RuntimeProperties.getSearch();
		UserAccount account = (UserAccount) dao.getByAttr(UserAccount.class, "name", RuntimeProperties.getUsername());
		if(account != null) {
			for(Search srch : account.getSearches()) {
				if(name.equalsIgnoreCase(srch.getName())) isOwner = true;
			}
		}
		if(isHosted() && isOwner == false) {
			model.addAttribute("message", "You can only admin this search if you own it.");
			return admin(model, request);
		}
		List l = dao.loadAll(OperationalPeriod.class);
		if(l == null || l.size() == 0) {
			Search search = (Search) dao.getByAttr(Search.class, "name", RuntimeProperties.getSearch());
			search.getAccount().getSearches().remove(search);
			dao.save(account);
			RuntimeProperties.setSearch(null);
			request.getSession(true).removeAttribute("search");
			return bounce(model);
		}
		else return admin(model, request);
	}

	@RequestMapping(value="/app/search", method = RequestMethod.GET)
	public String admin(Model model, HttpServletRequest request) {
		boolean isOwner = false;
		String name = RuntimeProperties.getSearch();
		UserAccount account = (UserAccount) dao.getByAttr(UserAccount.class, "name", RuntimeProperties.getUsername());
		if(account != null) {
			for(Search srch : account.getSearches()) {
				if(name.equalsIgnoreCase(srch.getName())) isOwner = true;
			}
		}
		if(isHosted() && isOwner == false) {
			model.addAttribute("message", "You can only admin this search if you own it.");
			return "error";
		}
		model.addAttribute("search", dao.getByAttr(Search.class, "name", RuntimeProperties.getSearch()));
		model.addAttribute("hosted", isHosted());
		model.addAttribute("server", RuntimeProperties.getServerUrl());
		List l = dao.loadAll(OperationalPeriod.class);
		model.addAttribute("deleteable", (l == null || l.size() == 0) ? true : false);
		return app(model, "Pages.Search");
	}

	@RequestMapping(value="/app/search", method = RequestMethod.POST)
	public String update(Model model, HttpServletRequest request) {
		boolean isOwner = false;
		String name = RuntimeProperties.getSearch();
		UserAccount account = (UserAccount) dao.getByAttr(UserAccount.class, "name", RuntimeProperties.getUsername());
		if(account != null) {
			for(Search srch : account.getSearches()) {
				if(name.equalsIgnoreCase(srch.getName())) isOwner = true;
			}
		}
		if(isHosted() && isOwner == false) {
			model.addAttribute("message", "You can only admin this search if you own it.");
			return "error";
		}
		Search search = (Search) dao.getByAttr(Search.class, "name", RuntimeProperties.getSearch());
		if(request.getParameter("description") != null && request.getParameter("description").length() > 0) {
			search.setDescription(request.getParameter("description"));
			dao.save(search);
		}
		search.setVisible("public".equalsIgnoreCase(request.getParameter("public")));
		if(request.getParameter("pasword") != null && request.getParameter("password").length() > 0) {
			search.setPassword(hash(request.getParameter("password")));
		}
		search.setDatum(request.getParameter("datum"));
		dao.save(search);
		List l = dao.loadAll(OperationalPeriod.class);
		model.addAttribute("deleteable", (l == null || l.size() == 0) ? true : false);
		model.addAttribute("search", search);
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

	@SuppressWarnings("unchecked")
	@RequestMapping(value ="/rest/search", method = RequestMethod.GET)
	public String bulkGPXDownload(Model model, HttpServletRequest request, HttpServletResponse response) {
		Format format = (request.getParameter("format") != null) ? Format.valueOf(request.getParameter("format").toUpperCase()) : Format.JSON;
		List<SearchAssignment >assignments = (List<SearchAssignment>) dao.loadAll(SearchAssignment.class);

		switch (format) {
		case GPX :
			response.setHeader("Content-Disposition", "attachment; filename=" + RuntimeProperties.getSearch() + ".gpx");
			return gpx(model, SearchAssignmentGPXHelper.gpxifySearch((Search) dao.getByAttr(Search.class, "name", RuntimeProperties.getSearch()), dao), "Search");
		case KML :
			response.setHeader("Content-Disposition", "attachment; filename=" + RuntimeProperties.getSearch() + ".kml");
			return kml(model, assignments, "SearchAssignments");
		default :
			return json(model, assignments);
		}
	}
		
}
