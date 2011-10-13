package org.sarsoft.common.controller;

import java.util.HashMap;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import net.sf.json.JSONObject;

import org.apache.log4j.Logger;
import org.openid4java.discovery.Identifier;
import org.sarsoft.common.model.Tenant;
import org.sarsoft.common.model.UserAccount;
import org.sarsoft.common.util.OIDConsumer;
import org.sarsoft.common.util.RuntimeProperties;
import org.sarsoft.plans.model.Search;
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

	public String setTenant(Model model, String name, Class<? extends Tenant> cls, HttpServletRequest request) {
		Tenant tenant = dao.getByAttr(Tenant.class, "name", name);
		if(tenant == null) {
			model.addAttribute("message", cls.getName() + " not found.");
			return bounce(model);
		}
		boolean isOwner = false;
		UserAccount account = dao.getByAttr(UserAccount.class, "name", RuntimeProperties.getUsername());
		if(account != null) {
			for(Tenant t : account.getTenants()) {
				if(name.equalsIgnoreCase(t.getName())) isOwner = true;
			}
		}
		
		if(isHosted() && tenant.getPassword() != null && isOwner == false) {
			if(request.getParameter("password") == null || request.getParameter("password").length() == 0) {
				bounce(model);
				model.addAttribute("searchname", name);
				return "Pages.Password";
			}
			String password = hash(request.getParameter("password"));
			if(!tenant.getPassword().equals(password)) {
				model.addAttribute("message", "Wrong Password.");
				return bounce(model);
			}
		}

		request.getSession().setAttribute("tenant", name);
		RuntimeProperties.setTenant(name);
		String dest = request.getParameter("dest");
		if(dest != null && dest.length() > 0) return "redirect:" + dest;
		return null;
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
		if(account != null) {
			tenant.setAccount(account);
			Object obj = new Object();
			String tenantname = null;
			int i = 0;
			while(obj != null) {
				i++;
				tenantname = hash(user + name + System.nanoTime() + i).substring(0,8);
				obj = dao.getByPk(Tenant.class, tenantname);
			}
			tenant.setName(tenantname);
			tenant.setVisible(true);
		}
		dao.save(tenant);
		request.getSession().setAttribute("tenant", tenant.getName());
		RuntimeProperties.setTenant(tenant.getName());

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
				dao.save(account);
			} else if(account.getEmail() == null) {
				account.setEmail(email);
				dao.save(account);
			}
			request.getSession(true).setAttribute("username", account.getName());
			RuntimeProperties.setUsername(account.getName());
			return bounce(model);
		} catch (Exception e) {
			logger.error("Exception encountered handling OpenID response", e);
			return "error";
		}
	}

	@RequestMapping(value="/app/logout")
	public String logout(Model model, HttpServletRequest request) {
		RuntimeProperties.setUsername(null);
		RuntimeProperties.setTenant(null);
		request.getSession(true).removeAttribute("tenant");
		request.getSession(true).removeAttribute("username");
		return bounce(model);
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
