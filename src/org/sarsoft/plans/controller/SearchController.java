package org.sarsoft.plans.controller;

import java.io.File;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import net.sf.json.JSONObject;

import org.sarsoft.common.controller.JSONBaseController;
import org.sarsoft.common.controller.JSONForm;
import org.sarsoft.common.model.UserAccount;
import org.sarsoft.common.model.Waypoint;
import org.sarsoft.common.util.RuntimeProperties;
import org.sarsoft.plans.model.OperationalPeriod;
import org.sarsoft.plans.model.Search;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

@Controller
public class SearchController extends JSONBaseController {

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

	@RequestMapping(value = "/rest/search/plk", method = RequestMethod.GET)
	public String getPlk(Model model, HttpServletRequest request, HttpServletResponse response) {
		Search search = (Search) dao.getByAttr(Search.class, "name", RuntimeProperties.getSearch());
		Map<String, Object> map = new HashMap<String, Object>();
		map.put("value", search.getPlk());
		return json(model, map);
	}

	@RequestMapping(value = "/rest/search/plk", method = RequestMethod.POST)
	public String setPlk(Model model, JSONForm params) {
		Map<String, Class> classHints = new HashMap<String, Class>();
		classHints.put("value", Waypoint.class);
		Map m = (Map) JSONObject.toBean(parseObject(params), HashMap.class, classHints);
		Search search = (Search) dao.getByAttr(Search.class, "name", RuntimeProperties.getSearch());
		search.setPlk((Waypoint) m.get("value"));
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
		model.addAttribute("server", getConfigValue("server.name"));
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
		dao.save(search);
		List l = dao.loadAll(OperationalPeriod.class);
		model.addAttribute("deleteable", (l == null || l.size() == 0) ? true : false);
		model.addAttribute("search", search);
		model.addAttribute("server", getConfigValue("server.name"));
		return app(model, "Pages.Search");
	}

}
