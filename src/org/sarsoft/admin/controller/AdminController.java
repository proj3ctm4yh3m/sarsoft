package org.sarsoft.admin.controller;

import java.util.List;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.log4j.Logger;
import org.openid4java.discovery.Identifier;
import org.sarsoft.admin.util.OIDConsumer;
import org.sarsoft.common.controller.JSONBaseController;
import org.sarsoft.common.model.UserAccount;
import org.sarsoft.common.model.Waypoint;
import org.sarsoft.common.util.RuntimeProperties;
import org.sarsoft.ops.controller.OpsController;
import org.sarsoft.plans.model.OperationalPeriod;
import org.sarsoft.plans.model.Search;
import org.sarsoft.plans.model.SearchAssignment;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.orm.hibernate3.LocalSessionFactoryBean;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.PathVariable;
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

	@Autowired
	OpsController opsController;
	
	private OIDConsumer consumer = null;
	
	private Logger logger = Logger.getLogger(AdminController.class);

	@SuppressWarnings("unchecked")
	@RequestMapping(value="/app/index.html", method = RequestMethod.GET)
	public String homePage(Model model) {
		OperationalPeriod lastPeriod = null;
		List<OperationalPeriod> periods = (List<OperationalPeriod>) dao.loadAll(OperationalPeriod.class);
		for(OperationalPeriod period : periods) {
			if(lastPeriod == null || lastPeriod.getId() < period.getId()) lastPeriod = period;
		}
		model.addAttribute("lastperiod", lastPeriod);
		model.addAttribute("periods", periods);
		model.addAttribute("assignments", dao.loadAll(SearchAssignment.class));
		model.addAttribute("imageUploadEnabled", Boolean.parseBoolean(getProperty("sarsoft.map.imageUploadEnabled")));
		opsController.checkLocators();
		return app(model, "Pages.Home");
	}

	@RequestMapping(value="/app/setsearch", method = RequestMethod.GET)
	public String chooseNewSearch(Model model, HttpServletRequest request) {
		return bounce(model);
	}

	@RequestMapping(value="/app/setsearch/{ds}", method = RequestMethod.GET)
	public String setAppDataSchema(Model model, @PathVariable("ds") String name, HttpServletRequest request) {
		Search search = (Search) dao.getByAttr(Search.class, "name", name);
		if(search == null) {
			model.addAttribute("message", "This search does not exist.");
			return bounce(model);
		}
		boolean isOwner = false;
		UserAccount account = (UserAccount) dao.getByAttr(UserAccount.class, "name", RuntimeProperties.getUsername());
		if(account != null) {
			for(Search srch : account.getSearches()) {
				if(name.equalsIgnoreCase(srch.getName())) isOwner = true;
			}
		}
		if(isHosted() && !search.isVisible() && isOwner == false ){
			model.addAttribute("message", "This search is not publicly visible");
			return bounce(model);
		}
		if(isHosted() && search.getPassword() != null && isOwner == false) {
			if(request.getParameter("password") == null || request.getParameter("password").length() == 0) {
				bounce(model);
				model.addAttribute("searchname", name);
				return "Pages.Password";
			}
			String password = hash(request.getParameter("password"));
			if(!search.getPassword().equals(password)) {
				model.addAttribute("message", "Wrong Password.");
				return bounce(model);
			}
		}

		request.getSession().setAttribute("search", name);
		RuntimeProperties.setSearch(name);
		opsController.checkLocators();
		String dest = request.getParameter("dest");
		if(dest != null && dest.length() > 0) return "redirect:" + dest;
		return homePage(model);
	}

	@RequestMapping(value="/app/setsearch", method = RequestMethod.POST)
	public String createNewAppDataSchema(Model model, HttpServletRequest request) {
		String user = RuntimeProperties.getUsername();
		UserAccount account = null;
		if(user != null) account = (UserAccount) dao.getByAttr(UserAccount.class, "name", user);
		String name = request.getParameter("name");
		String op1name = request.getParameter("op1name");
		String lat = request.getParameter("lat");
		String lng = request.getParameter("lng");
		String password = request.getParameter("password");
		boolean visible = "public".equalsIgnoreCase(request.getParameter("public"));
		if(password != null && password.length() > 0) {
			password = hash(password);
		} else {
			password = null;
		}
		if(!isHosted() && dao.getByAttr(Search.class, "name", name) != null) {
			return setAppDataSchema(model, name, request);
		}
		Search search = new Search();
		search.setName(name);
		search.setDescription(name);
		if(getProperty("sarsoft.map.datum") != null) search.setDatum(getProperty("sarsoft.map.datum"));
		if(password != null && password.length() > 0) {
			search.setPassword(password);
		}
		if(account != null) {
			search.setAccount(account);
			Object obj = new Object();
			String searchname = null;
			int i = 0;
			while(obj != null) {
				i++;
				searchname = hash(user + name + System.nanoTime() + i).substring(0,8);
				obj = dao.getByPk(Search.class, searchname);
			}
			search.setName(searchname);
			search.setVisible(visible);
		}
		dao.save(search);
		request.getSession().setAttribute("search", search.getName());
		RuntimeProperties.setSearch(search.getName());

		OperationalPeriod period = new OperationalPeriod();
		period.setDescription((op1name != null && op1name.length() > 0) ? op1name : "first operational period");
		period.setId(1L);
		dao.save(period);
		
		if(lat != null && lat.length() > 0 && lng != null && lng.length() > 0) {
			Waypoint lkp = new Waypoint(Double.parseDouble(lat), Double.parseDouble(lng));
			search.setLkp(lkp);
			dao.save(search);
		}
		
		return homePage(model);
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
			UserAccount account = (UserAccount) dao.getByAttr(UserAccount.class, "name", username);
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
		RuntimeProperties.setSearch(null);
		request.getSession(true).removeAttribute("search");
		request.getSession(true).removeAttribute("username");
		return bounce(model);
	}

}
