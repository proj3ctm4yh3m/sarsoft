package org.sarsoft.common.controller;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import net.sf.json.JSONObject;

import org.apache.log4j.Logger;
import org.openid4java.discovery.Identifier;
import org.sarsoft.common.model.GeoRefImage;
import org.sarsoft.common.model.JSONAnnotatedPropertyFilter;
import org.sarsoft.common.model.Tenant;
import org.sarsoft.common.model.Tenant.Permission;
import org.sarsoft.common.model.UserAccount;
import org.sarsoft.common.util.OIDConsumer;
import org.sarsoft.common.util.RuntimeProperties;
import org.sarsoft.markup.model.Marker;
import org.sarsoft.markup.model.Shape;
import org.sarsoft.plans.Constants;
import org.sarsoft.plans.model.OperationalPeriod;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.orm.hibernate3.LocalSessionFactoryBean;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;

import com.mchange.v2.c3p0.ComboPooledDataSource;

@Controller
public class AdminController extends JSONBaseController {

	@Autowired
	@Qualifier("searchDataSource")
	ComboPooledDataSource dataSource;

	@Autowired
	@Qualifier("searchSessionFactory")
	LocalSessionFactoryBean sessionFactory;

	private OIDConsumer consumer = null;
	
	private Logger logger = Logger.getLogger(AdminController.class);
	
	@RequestMapping(value="/", method = RequestMethod.GET)
	public String getHomePage(Model model) {
		return bounce(model);
	}
	
	@RequestMapping(value="/app/constants.js", method = RequestMethod.GET)
	public String getConstants(Model model) {
		model.addAttribute("json", JSONAnnotatedPropertyFilter.fromObject(Constants.all));
		model.addAttribute("mapSources", getMapSources());
		model.addAttribute("tileCacheEnabled", Boolean.parseBoolean(getProperty("sarsoft.map.tileCacheEnabled")));
		model.addAttribute("geoRefImages", dao.getAllByAttr(GeoRefImage.class, "referenced", Boolean.TRUE));
		model.addAttribute("defaultZoom", getProperty("sarsoft.map.default.zoom"));
		model.addAttribute("defaultLat", getProperty("sarsoft.map.default.lat"));
		model.addAttribute("defaultLng", getProperty("sarsoft.map.default.lng"));
		
		Tenant tenant = dao.getByAttr(Tenant.class, "name", RuntimeProperties.getTenant());
		if(getProperty("sarsoft.map.datum") != null) model.addAttribute("datum", getProperty("sarsoft.map.datum"));
		if(tenant != null && tenant.getDatum() != null) model.addAttribute("datum", tenant.getDatum());
		model.addAttribute("userPermissionLevel", RuntimeProperties.getUserPermission());
		return "/global/constants";
	}

	public String setTenant(Model model, String name, Class<? extends Tenant> cls, HttpServletRequest request) {
		Tenant tenant = dao.getByAttr(cls, "name", name);
		UserAccount account = dao.getByAttr(UserAccount.class, "name", RuntimeProperties.getUsername());
		if(tenant == null) {
			model.addAttribute("message", cls.getName() + " not found.");
			return bounce(model);
		}

		Permission permission = Permission.NONE;
		if(tenant.getAccount() == null) permission = Permission.ADMIN;
		else if(account != null && tenant.getAccount().getName().equals(account.getName())) permission = Permission.ADMIN;
		else if(request.getSession(true).getAttribute("cachedPassword") == null) permission = tenant.getAllUserPermission();
		else {
			String password = (String) request.getSession(true).getAttribute("cachedPassword");
			request.getSession(true).removeAttribute("cachedPassword");
			if(!tenant.getPassword().equals(password)) {
				model.addAttribute("message", "Wrong Password.");
				return bounce(model);
			}
			permission = tenant.getPasswordProtectedUserPermission();			
		}
		if(permission == Permission.NONE) {
			if(tenant.getPassword() != null && tenant.getPassword().length() > 0) {
				String target = request.getRequestURI();
				if(request.getParameter("id") != null) try {
					target = target + "?id=" + java.net.URLEncoder.encode(request.getParameter("id"), "ISO-8859-1");
				} catch (Exception e) {}
				if(request.getParameter("dest") != null) try {
					target = target + "?dest=" + java.net.URLEncoder.encode(request.getParameter("dest"), "ISO-8859-1");
				} catch (Exception e) {}
				model.addAttribute("targetDest", target);
			}
			return bounce(model);
		}
		
		request.getSession().setAttribute("tenantid", name);
		RuntimeProperties.setTenant(name);
		
		request.getSession().setAttribute("userPermission", permission);
		RuntimeProperties.setUserPermission(permission);
		
		String dest = request.getParameter("dest");
		if(dest != null && dest.length() > 0) return "redirect:" + dest;
		return null;
	}
	
	@RequestMapping(value="/cachepassword", method = RequestMethod.POST)
	public String cachePassword(Model model, @RequestParam("password") String password, @RequestParam("dest") String dest, HttpServletRequest request) {
		request.getSession(true).setAttribute("cachedPassword", hash(password));
		return "redirect:" + dest;
	}

	@RequestMapping(value="/password", method = RequestMethod.POST)
	public String password(Model model, @RequestParam("password") String password, @RequestParam("dest") String dest, HttpServletRequest request) {
		Tenant tenant = dao.getByAttr(Tenant.class, "name", RuntimeProperties.getTenant());
		password = hash(password);
		if(tenant.getPassword() == null || !tenant.getPassword().equals(password)) {
			model.addAttribute("message", "Wrong Password.");
			return bounce(model);
		}
		Permission permission = tenant.getPasswordProtectedUserPermission();			
		request.getSession().setAttribute("userPermission", permission);
		RuntimeProperties.setUserPermission(permission);
		
		return "redirect:" + dest;
	}

	public String createNewTenant(Model model, Class<? extends Tenant> cls, HttpServletRequest request) {
		String user = RuntimeProperties.getUsername();
		UserAccount account = null;
		if(user != null) account = dao.getByAttr(UserAccount.class, "name", user);
		String name = request.getParameter("name");
		if(!isHosted() && dao.getByAttr(Tenant.class, "name", name) != null) {
			return setTenant(model, name, cls, request);
		}
		Tenant tenant;
		try {
			tenant = cls.newInstance();
		} catch (InstantiationException e) {
			return bounce(model);
		} catch (IllegalAccessException e) {
			return bounce(model);
		}
		tenant.setName(name);
		tenant.setDescription(name);
		tenant.setComments(request.getParameter("comments"));
		if(account != null) {
			tenant.setAccount(account);
			Object obj = new Object();
			String tenantname = null;
			int i = 0;
			while(obj != null) {
				i++;
				tenantname = hash32(user + name + System.nanoTime() + i).substring(0,4);
				obj = dao.getByPk(Tenant.class, tenantname);
			}
			tenant.setName(tenantname);
			tenant.setAllUserPermission(Tenant.Permission.READ);
			tenant.setPasswordProtectedUserPermission(Tenant.Permission.NONE);
		}

		dao.superSave(tenant);

		request.getSession().setAttribute("tenantid", tenant.getName());
		RuntimeProperties.setTenant(tenant.getName());

		request.getSession().setAttribute("userPermission", Permission.ADMIN);
		RuntimeProperties.setUserPermission(Permission.ADMIN);

		return null;
	}

	@RequestMapping(value="/app/openidrequest", method = RequestMethod.GET)
	public void login(@RequestParam("domain") String domain, HttpServletRequest request, HttpServletResponse response) {
		try {
			String server = RuntimeProperties.getServerUrl();
			if(consumer == null) consumer = new OIDConsumer(server);
			if("google".equalsIgnoreCase(domain)) consumer.authRequest("https://www.google.com/accounts/o8/id", request, response);
			if("yahoo".equalsIgnoreCase(domain)) consumer.authRequest("https://me.yahoo.com", request, response);
		} catch (Exception e) {
			logger.error("Exception encountered sending OpenID request to " + domain, e);
		}
	}

	@RequestMapping(value="/app/openidresponse", method = RequestMethod.GET)
	public String ologin(Model model, HttpServletRequest request) {
		try {
			Identifier id = consumer.verifyResponse(request);
			String username = id.getIdentifier();
			UserAccount account = dao.getByAttr(UserAccount.class, "name", username);
			String email = null;
			if(request.getParameter("openid.ax.value.email") != null) email  = request.getParameter("openid.ax.value.email");
			if(request.getParameter("openid.ext1.value.email") != null) email = request.getParameter("openid.ext1.value.email");
			if(account == null) {
				account = new UserAccount();
				account.setName(username);
				account.setEmail(email);
				dao.superSave(account);
			} else if(account.getEmail() == null) {
				account.setEmail(email);
				dao.superSave(account);
			}
			request.getSession(true).setAttribute("username", account.getName());
			RuntimeProperties.setUsername(account.getName());
			request.getSession(true).removeAttribute("tenantid");
			RuntimeProperties.setTenant(null);
			return "redirect:/maps";
		} catch (Exception e) {
			logger.error("Exception encountered handling OpenID response", e);
			return "error";
		}
	}

	@RequestMapping(value="/app/logout")
	public String logout(Model model, HttpServletRequest request) {
		RuntimeProperties.setUsername(null);
		RuntimeProperties.setTenant(null);
		request.getSession(true).removeAttribute("tenantid");
		request.getSession(true).removeAttribute("username");
		return bounce(model);
	}
	
	@RequestMapping(value="/admin.html", method = RequestMethod.GET)
	public String getAdmin(Model model) {
		Tenant tenant = dao.getByAttr(Tenant.class, "name", RuntimeProperties.getTenant());

		if(RuntimeProperties.getUserPermission() != Permission.ADMIN) {
			model.addAttribute("message", "You don't own this object, and therefore can't edit it.");
			return "error";
		}

		model.addAttribute("tenant", tenant);
		model.addAttribute("hosted", isHosted());
		model.addAttribute("server", RuntimeProperties.getServerUrl());
		List<OperationalPeriod> l = dao.loadAll(OperationalPeriod.class);
		model.addAttribute("deleteable", (l == null || l.size() == 0) ? true : false);
		return app(model, "Pages.Admin");
	}

	@RequestMapping(value="/admin.html", method = RequestMethod.POST)
	public String updateAdmin(Model model, HttpServletRequest request) {
		Tenant tenant = dao.getByAttr(Tenant.class, "name", RuntimeProperties.getTenant());
		
		if(RuntimeProperties.getUserPermission() != Permission.ADMIN) {
			model.addAttribute("message", "You don't own this object, and therefore can't edit it.");
			return "error";
		}

		if(request.getParameter("description") != null && request.getParameter("description").length() > 0) {
			tenant.setDescription(request.getParameter("description"));
			dao.save(tenant);
		}
		if(request.getParameter("comments") != null && request.getParameter("comments").length() > 0) {
			tenant.setComments(request.getParameter("comments"));
			dao.save(tenant);
		}
		if(tenant.getAccount() != null) {
			tenant.setAllUserPermission(Permission.valueOf(request.getParameter("allUsers")));
			tenant.setPasswordProtectedUserPermission(Permission.valueOf(request.getParameter("passwordUsers")));
			if(request.getParameter("password") != null && request.getParameter("password").length() > 0) {
				tenant.setPassword(hash(request.getParameter("password")));
			}
			dao.save(tenant);
		}
		
		return getAdmin(model);
	}

	@RequestMapping(value="/admin/delete", method = RequestMethod.GET)
	public String delete(Model model, @RequestParam("id") String id, HttpServletRequest request) {
		if(RuntimeProperties.getUserPermission() != Permission.ADMIN) {
			model.addAttribute("message", "You don't own this object, and therefore can't delete it.");
			return "redirect:/admin.html";
		}
		
		if(!id.equals(RuntimeProperties.getTenant())) {
			model.addAttribute("message", "Something seems to have gone wrong - it looks like you're trying to delete a different object than the one you're currently viewing.");
			return "redirect:/admin.html";
		}

		List<OperationalPeriod> l = dao.loadAll(OperationalPeriod.class);
		if(l != null && l.size() > 0) {
			model.addAttribute("message", "You must delete all operational periods before deleting this search.");
			return "redirect:/admin.html";
		}

		dao.deleteAll(Marker.class);
		dao.deleteAll(Shape.class);
		Tenant tenant = dao.getByAttr(Tenant.class, "name", RuntimeProperties.getTenant());
		if(tenant.getAccount() != null) {
			UserAccount account = tenant.getAccount();
			account.getTenants().remove(tenant);
			tenant.setAccount(null);
			// will delete tenant as well due to delete_orphan cascade
			dao.save(account);
		} else {
			dao.delete(tenant);
		}
		RuntimeProperties.setTenant(null);
		request.getSession(true).removeAttribute("tenantid");
		return bounce(model);
	}
	
	@SuppressWarnings({ "rawtypes", "unchecked" })
	private Map jsonifyTenant(Tenant tenant, String type) {
		Map m = new HashMap();
		m.put("publicName", tenant.getPublicName());
		m.put("name", tenant.getName());
		m.put("comments", tenant.getComments());
		m.put("allPerm", tenant.getAllUserPermission());
		m.put("passwordPerm", tenant.getPasswordProtectedUserPermission());
		if(type != null) m.put("type", type);
		String owner = "N/A";
		if(tenant.getAccount() != null) {
			String email = tenant.getAccount().getEmail();
			if(email != null) email = email.substring(0,Math.min(3, email.length())) + email.replaceAll(".*?@", "...@").replaceAll("(.com|.org|.net)", "");
			owner = tenant.getAccount().getName().equals(RuntimeProperties.getUsername()) ? "You" : email;
		}
		m.put("owner", owner);
		return m;
	}
	
	@SuppressWarnings("rawtypes")
	@RequestMapping(value="/rest/tenant/", method = RequestMethod.GET)
	public String getTenantList(Model model, @RequestParam(value="className", required=false) String className) {
		List<Tenant> tenants = new ArrayList<Tenant>();
		String user = RuntimeProperties.getUsername();
		UserAccount account = null;
		if(user != null) account = dao.getByPk(UserAccount.class, user);
		if(isHosted()) {
			if(account != null) {
				if(account.getTenants() != null) tenants.addAll(account.getTenants());
			}
		} else {
			tenants = dao.getAllTenants();
		}
		List<Map> list = new ArrayList<Map>();
		for(Tenant tenant : tenants) {
			if(className == null || className.equals(tenant.getClass().getName())) {
				list.add(jsonifyTenant(tenant, className));
			}
		}
		return json(model, list);
	}
	
	private void loadRecentTenantsFromCookie(Cookie cookie, String className, List<Map> list) {
		String value = cookie.getValue();
		String[] values = value.split(",");
		for(String val : values) {
			String name = val;
			if(name.indexOf('=') > 0) name = name.substring(0, name.indexOf('='));
			Tenant tenant = dao.getByAttr(Tenant.class, "name", name);
			if(tenant != null) {
				list.add(jsonifyTenant(tenant, className));
			}
		}
	}
	
	@SuppressWarnings({ "rawtypes" })
	@RequestMapping(value="/rest/tenant/recent", method = RequestMethod.GET)
	public String getRecentTenantList(Model model, HttpServletRequest request) {
		Cookie[] cookies = request.getCookies();
		List<Map> list = new ArrayList<Map>();
		if(cookies != null) for(Cookie cookie : cookies) {
			if("org.sarsoft.recentlyLoadedMaps".equals(cookie.getName())) {
				loadRecentTenantsFromCookie(cookie, "org.sarsoft.markup.model.CollaborativeMap", list);
			} else if("org.sarsoft.recentlyLoadedSearches".equals(cookie.getName())) {
				loadRecentTenantsFromCookie(cookie, "org.sarsoft.plans.model.Search", list);
			}
		}
		return json(model, list);
	}
	
	@RequestMapping(value ="/rest/tenant/mapConfig", method = RequestMethod.GET)
	public String getSearchProperty(Model model, HttpServletRequest request, HttpServletResponse response) {
		Tenant tenant = dao.getByAttr(Tenant.class, "name", RuntimeProperties.getTenant());
		Map<String, String> map = new HashMap<String, String>();
		map.put("value", tenant.getMapConfig());
		return json(model, map);
	}

	@SuppressWarnings("rawtypes")
	@RequestMapping(value = "/rest/tenant/mapConfig", method = RequestMethod.POST)
	public String setSearchProperty(Model model, JSONForm params) {
		Map m = (Map) JSONObject.toBean(parseObject(params), HashMap.class);
		Tenant tenant = dao.getByAttr(Tenant.class, "name", RuntimeProperties.getTenant());
		tenant.setMapConfig((String) m.get("value"));
		dao.save(tenant);
		return json(model, tenant);
	}

}
