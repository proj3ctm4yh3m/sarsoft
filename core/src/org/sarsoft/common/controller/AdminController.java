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
import org.sarsoft.common.json.JSONAnnotatedPropertyFilter;
import org.sarsoft.common.json.JSONForm;
import org.sarsoft.common.model.Tenant;
import org.sarsoft.common.model.Tenant.Permission;
import org.sarsoft.common.model.UserAccount;
import org.sarsoft.common.util.Hash;
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
	
	private void initPermissions(HttpSession session, String tenant, Permission permission) {
		session.setAttribute("tenantid", tenant);
		RuntimeProperties.setTenant(tenant);
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
			authedTenants.put(tenant, permission);
		}
	}
		
	@SuppressWarnings("rawtypes")
	public String setTenant(String name, Class<? extends Tenant> cls, HttpServletRequest request) {
		Tenant tenant = dao.getByAttr(cls, "name", name);
		if(tenant == null) return "Map " + name + " not found";

		Permission permission = Permission.NONE;
		UserAccount account = dao.getByAttr(UserAccount.class, "name", RuntimeProperties.getUsername());
		if(tenant.getAccount() == null) {
			permission = Permission.READ;
		} else {
			if(account != null && account.getAdmin() != null && account.getAdmin()) permission = Permission.ADMIN;
			else if(account != null && tenant.getAccount().getName().equals(account.getName())) permission = Permission.ADMIN;
			else {
				String password = (String) request.getSession(true).getAttribute("password");
				if(password == null) {
					permission = tenant.getAllUserPermission();
				} else {
					request.getSession(true).removeAttribute("password");
					if(!tenant.getPassword().equals(password)) return "Wrong Password";
					permission = tenant.getPasswordProtectedUserPermission();			
				}
			}
		}

		if(permission == Permission.NONE) {
			return "You are not authorized to view this page";
		}
		
		initPermissions(request.getSession(true), name, permission);
		return null;
	}
	
	@RequestMapping(value="/cachepassword", method = RequestMethod.POST)
	public String cachePassword(Model model, @RequestParam("password") String password, @RequestParam("dest") String dest, HttpServletRequest request) {
		request.getSession(true).setAttribute("password", Hash.hash(password));
		return "redirect:" + dest;
	}

	@RequestMapping(value="/password", method = RequestMethod.POST)
	public String password(Model model, @RequestParam("password") String password, @RequestParam("dest") String dest, HttpServletRequest request) {
		Tenant tenant = dao.getByAttr(Tenant.class, "name", RuntimeProperties.getTenant());
		password = Hash.hash(password);
		if(tenant.getPassword() == null || !tenant.getPassword().equals(password)) return error(model, "Wrong Password");
		
		initPermissions(request.getSession(true), RuntimeProperties.getTenant(), tenant.getPasswordProtectedUserPermission());

		return "redirect:" + dest;
	}

	public String createNewTenant(Class<? extends Tenant> cls, HttpServletRequest request) {
		String user = RuntimeProperties.getUsername();
		UserAccount account = null;
		if(user != null) account = dao.getByAttr(UserAccount.class, "name", user);
		String name = request.getParameter("name");
		Tenant tenant;
		try {
			tenant = cls.newInstance();
		} catch (InstantiationException e) {
			return "Something really bad happened.  Please contact the server administrator.";
		} catch (IllegalAccessException e) {
			return "Something really bad happened.  Please contact the server administrator.";
		}

		tenant.setDescription(name);
		tenant.setComments(request.getParameter("comments"));

		boolean oneoff = Boolean.parseBoolean(request.getParameter("oneoff"));
		if(oneoff) {
			tenant.setAllUserPermission(Tenant.Permission.READ);
			tenant.setPasswordProtectedUserPermission(Tenant.Permission.WRITE);
			String password = request.getParameter("password");
			if(password != null && password.length() > 0) tenant.setPassword(Hash.hash(password));			
		} else if(account != null) {
			tenant.setAccount(account);
			tenant.setAllUserPermission(Tenant.Permission.READ);
			tenant.setPasswordProtectedUserPermission(Tenant.Permission.NONE);
		} else if(isHosted()) {
			if(!oneoff) return "You do not appear to be logged in";
		}

		synchronized(this) {
			Object obj = new Object();
			String tenantname = null;
			int i = 0;
			while(obj != null) {
				i++;
				tenantname = Hash.hash32(user + name + System.nanoTime() + i).substring(0,4);
				obj = dao.getByPk(Tenant.class, tenantname);
			}
			tenant.setName(tenantname);
			dao.superSave(tenant);
		}

		initPermissions(request.getSession(true), tenant.getName(), Permission.ADMIN);

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
			return error(model, "There was a problem handling your OpenID login");
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
		return "redirect:/map.html";
	}

	@RequestMapping(value="/rest/account", method = RequestMethod.POST)
	public String updateAccount(Model model, @RequestParam(value="alias", required=false) String alias) {
		UserAccount account = dao.getByAttr(UserAccount.class, "name", RuntimeProperties.getUsername());
		if(alias != null && alias.length() == 0) alias = null;
		if(alias != null && !alias.equalsIgnoreCase(account.getAlias())) {
			alias = alias.trim().replaceAll("\\s+", " ");
			alias = alias.replaceAll("[^a-zA-Z0-9_ ]", "");
			Object obj = dao.getByCaselessAttr(UserAccount.class, "alias", alias);
			if(obj == null) {
				account.setAlias(alias);
				dao.superSave(account);
			}
		}
		account = dao.getByAttr(UserAccount.class, "name", RuntimeProperties.getUsername());
		return json(model, account);
	}
		
	@SuppressWarnings("unchecked")
	@RequestMapping(value="/rest/timestamp", method = RequestMethod.GET)
	public String getTimestamp(Model model) {
		Map m = new HashMap();
		m.put("timestamp", Long.toString(new Date().getTime()));
		return json(model, m);
	}
	
	@RequestMapping(value="/about.html", method = RequestMethod.GET)
	public String about(Model model) {
		return app(model, "Pages.About");
	}
	
}
