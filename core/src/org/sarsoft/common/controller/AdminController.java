package org.sarsoft.common.controller;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import net.sf.json.JSONObject;

import org.apache.log4j.Logger;
import org.openid4java.discovery.Identifier;
import org.sarsoft.common.json.JSONForm;
import org.sarsoft.common.model.Tenant;
import org.sarsoft.common.model.Tenant.Permission;
import org.sarsoft.common.model.UserAccount;
import org.sarsoft.common.util.OIDConsumer;
import org.sarsoft.common.util.RuntimeProperties;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.orm.hibernate3.LocalSessionFactoryBean;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.util.HtmlUtils;

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
	
	private byte[] sha1(String str) {
		try {
			MessageDigest d = MessageDigest.getInstance("SHA-1");
			d.reset();
			d.update(str.getBytes());
			return d.digest();
		} catch (NoSuchAlgorithmException e) {
			return null;
		}
	}
	
	protected String hash32(String str) {
		if(str == null) return null;
		byte[] bytes = sha1(str);
		if(bytes == null) return str;
		StringBuffer sb = new StringBuffer();
		for(byte b : bytes) {
			int i = b & 0xFF;
			if(i < 32) sb.append("0");
			sb.append(Integer.toString(i, 32));
		}
		return sb.toString().toUpperCase();
	}
	
	public String hash(String password) {
		if(password == null) return null;
		StringBuffer sb = new StringBuffer();
		byte[] bytes = sha1(password);
		if(bytes == null) return password;
		for(byte b : bytes) {
			int i = b & 0xFF;
			if(i < 16) sb.append("0");
			sb.append(Integer.toHexString(i));
		}
		return sb.toString().toUpperCase();
	}	
	
	@SuppressWarnings("rawtypes")
	@RequestMapping(value="/rest/tenant/shared", method = RequestMethod.GET)
	public String getSharedTenants(Model model, @RequestParam(value="key", required=false) String keyword, @RequestParam(value="user", required=false) String user) {
		List<Tenant> tenants = null;
		if(keyword != null) {
			tenants = dao.getSharedTenants(keyword, null);
		} else if(user != null) {
			tenants = dao.getSharedTenants(null, user);
		} else {
			tenants = dao.getSharedTenants(null, null);
		}

		List<Map> list = new ArrayList<Map>();
		for(Tenant tenant : tenants) {
			list.add(jsonifyTenant(tenant, tenant.getClass().getName()));
		}
		return json(model, list);	
	}

	public String setTenant(Model model, String name, Class<? extends Tenant> cls, HttpServletRequest request) {
		Tenant tenant = dao.getByAttr(cls, "name", name);
		UserAccount account = dao.getByAttr(UserAccount.class, "name", RuntimeProperties.getUsername());
		if(tenant == null) {
			model.addAttribute("message", cls.getName() + " not found.");
			return "error";
		}

		Permission permission = Permission.NONE;
		if(tenant.getAccount() == null) permission = Permission.ADMIN;
		else if(account != null && account.getAdmin() != null && account.getAdmin()) permission = Permission.ADMIN;
		else if(account != null && tenant.getAccount().getName().equals(account.getName())) permission = Permission.ADMIN;
		else if(request.getSession(true).getAttribute("cachedPassword") == null) permission = tenant.getAllUserPermission();
		else {
			String password = (String) request.getSession(true).getAttribute("cachedPassword");
			request.getSession(true).removeAttribute("cachedPassword");
			if(!tenant.getPassword().equals(password)) {
				model.addAttribute("message", "Wrong Password.");
				return "error";
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
			return "error";
		}
		
		HttpSession session = request.getSession(true);
		
		session.setAttribute("tenantid", name);
		RuntimeProperties.setTenant(name);
		
		session.setAttribute("userPermission", permission);
		RuntimeProperties.setUserPermission(permission);

		if(session.getAttribute("authedTenants") == null) {
			synchronized(this) {
				if(session.getAttribute("authedTenants") == null) session.setAttribute("authedTenants", new HashMap<String, Permission>());
			}
		}

		@SuppressWarnings("unchecked")
		Map<String, Permission> authedTenants = (Map<String, Permission>) session.getAttribute("authedTenants");
		synchronized(authedTenants) {
			authedTenants.put(name, permission);
		}

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
			return "error";
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

	@RequestMapping(value="/app/openidrequest")
	public void login(@RequestParam("domain") String domain, HttpServletRequest request, HttpServletResponse response) {
		try {
			String dest = request.getParameter("dest");
			if(dest != null && dest.length() > 0) {
				request.getSession(true).setAttribute("login_dest", dest);
			}
			String clientState = request.getParameter("state");
			if(clientState != null && clientState.length() > 0) {
				request.getSession(true).setAttribute("client_state", clientState);
			}
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
			String dest = (String) request.getSession(true).getAttribute("login_dest");
			request.getSession().removeAttribute("login_dest");
			if(dest != null) {
				return "redirect:" + dest;
			}
			return "redirect:/map.html";
		} catch (Exception e) {
			logger.error("Exception encountered handling OpenID response", e);
			return "error";
		}
	}

	@RequestMapping(value="/app/logout")
	public String logout(Model model, HttpServletRequest request) {
		RuntimeProperties.setUsername(null);
		RuntimeProperties.setTenant(null);
		
		HttpSession session = request.getSession(true);
		session.removeAttribute("tenantid");
		session.removeAttribute("username");
		session.removeAttribute("authedTenants");

		String dest = request.getParameter("dest");
		if(dest != null && dest.length() > 0) return "redirect:" + dest;
		return bounce(model);
	}
	
	@SuppressWarnings({ "rawtypes", "unchecked" })
	private Map jsonifyTenant(Tenant tenant, String type) {
		Map m = new HashMap();
		m.put("publicName", tenant.getPublicName());
		m.put("name", tenant.getName());
		if(tenant.getComments() != null) {
			m.put("comments", HtmlUtils.htmlEscape(tenant.getComments()));
		} else {
			m.put("comments", "");
		}
		m.put("allPerm", tenant.getAllUserPermission());
		m.put("passwordPerm", tenant.getPasswordProtectedUserPermission());
		if(type != null) m.put("type", type);
		String owner = "N/A";
		if(tenant.getAccount() != null) {
			owner = tenant.getAccount().getName().equals(RuntimeProperties.getUsername()) ? "You" : tenant.getAccount().getHandle();
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
		Map m = (Map) JSONObject.toBean(params.JSON(), HashMap.class);
		Tenant tenant = dao.getByAttr(Tenant.class, "name", RuntimeProperties.getTenant());
		tenant.setMapConfig((String) m.get("value"));
		tenant.setCfgUpdated(System.currentTimeMillis());
		dao.save(tenant);
		return json(model, tenant);
	}

	@RequestMapping(value="/tools.html", method = RequestMethod.GET)
	public String showTools(Model model) {
		return app(model, "Pages.Tools");
	}
	
	@SuppressWarnings("unchecked")
	@RequestMapping(value="/rest/timestamp", method = RequestMethod.GET)
	public String getTimestamp(Model model) {
		Map m = new HashMap();
		m.put("timestamp", Long.toString(new Date().getTime()));
		return json(model, m);
	}

}
