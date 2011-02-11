package org.sarsoft.admin.controller;

import java.io.File;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.List;

import javax.servlet.http.HttpServletRequest;

import org.sarsoft.admin.model.MapSource;
import org.sarsoft.common.model.UserAccount;
import org.sarsoft.common.controller.JSONBaseController;
import org.sarsoft.common.controller.JSONForm;
import org.sarsoft.common.model.Action;
import org.sarsoft.ops.controller.OpsController;
import org.sarsoft.plans.model.Search;
import org.sarsoft.common.util.RuntimeProperties;
import org.sarsoft.plans.model.OperationalPeriod;
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
	@Qualifier("configDataSource")
	ComboPooledDataSource configDataSource;

	@Autowired
	@Qualifier("configSessionFactory")
	LocalSessionFactoryBean configSessionFactory;

	private boolean hosted = false;

	public AdminController() {
		super();
		hosted = "true".equalsIgnoreCase(System.getProperty("sarsoft.hosted"));
	}

	@RequestMapping(value="/app/shutdown", method = RequestMethod.GET)
	public String shutdown(Model model, HttpServletRequest request) {
		String password = System.getProperty("sarsoft.admin.password");
		if(request.getSession().getAttribute("loggedin") != Boolean.TRUE) {
			if(password != null) return app(model, "Pages.Login");
		}
		System.exit(0);
		return "ain't gonna happen";
	}

	@SuppressWarnings("unchecked")
	@RequestMapping(value="/app/index.html", method = RequestMethod.GET)
	public String homePage(Model model, HttpServletRequest request) {
		OperationalPeriod lastPeriod = null;
		List<OperationalPeriod> periods = (List<OperationalPeriod>) dao.loadAll(OperationalPeriod.class);
		for(OperationalPeriod period : periods) {
			if(lastPeriod == null || lastPeriod.getId() < period.getId()) lastPeriod = period;
		}
		model.addAttribute("lastperiod", lastPeriod);
		model.addAttribute("periods", periods);
		model.addAttribute("assignments", dao.loadAll(SearchAssignment.class));
		model.addAttribute("locationenabled", OpsController.isLocationEnabled(RuntimeProperties.getSearch()));
		return app(model, "Pages.Home");
	}

	@RequestMapping(value="/app/setsearch", method = RequestMethod.GET)
	public String chooseNewSearch(Model model, HttpServletRequest request) {
		addInitialDataToModel(model, request);
		return app(model, "Pages.Welcome", request);
	}

	private String hash(String password) {
		if(password == null) return null;
		try {
		MessageDigest d = MessageDigest.getInstance("SHA-1");
		d.reset();
		d.update(password.getBytes());
		byte[] bytes = d.digest();
		StringBuffer sb = new StringBuffer();
		for(byte b : bytes) {
			int i = b & 0xFF;
			if(i < 16) sb.append("0");
			sb.append(Integer.toHexString(i));
		}
		return sb.toString().toUpperCase();
		} catch (NoSuchAlgorithmException e) {
			return password;
		}
	}

	@RequestMapping(value="/app/setsearch/{ds}", method = RequestMethod.GET)
	public String setAppDataSchema(Model model, @PathVariable("ds") String name, HttpServletRequest request) {
		Search search = (Search) dao.getByAttr(Search.class, "name", name);
		if(search == null) {
			super.addInitialDataToModel(model, request);
			model.addAttribute("message", "Search does not exist.");
			return app(model, "Pages.Welcome", request);
		}

		if(search.getPassword() != null) {
			String password = hash(request.getParameter("password"));
			addInitialDataToModel(model, request);
			model.addAttribute("message", "Wrong Password.");
			if(!search.getPassword().equals(password)) return app(model, "Pages.Welcome", request);
		}

		request.getSession().setAttribute("search", name);
		RuntimeProperties.setSearch(name);
		return homePage(model, request);
	}

	@RequestMapping(value="/app/setsearch", method = RequestMethod.POST)
	public String createNewAppDataSchema(Model model, HttpServletRequest request) {
		String user = (String) request.getSession().getAttribute("user");
		UserAccount account = null;
		if(user != null) account = (UserAccount) dao.getByAttr(UserAccount.class, "name", user);
		String name = request.getParameter("name");
		String op1name = request.getParameter("op1name");
		String password = request.getParameter("password");
		password = hash(password);
		if(dao.getByAttr(Search.class, "name", name) != null) {
			return setAppDataSchema(model, name, request);
		}
		Search search = new Search();
		search.setName(name);
		if(password != null && password.length() > 0) {
			search.setPassword(password);
		}
		if(account != null) {
			search.setAccount(account);
			search.setDescription(name);
			search.setName(hash(user + name));
		}
		dao.save(search);
		request.getSession().setAttribute("search", name);
		RuntimeProperties.setSearch(name);
		if(op1name != null && op1name.length() > 0) {
			OperationalPeriod period = new OperationalPeriod();
			period.setDescription(op1name);
			period.setId(1L);
			dao.save(period);
		}

		return homePage(model, request);
	}

	@RequestMapping(value="/app/createaccount", method = RequestMethod.POST)
	public String createNewAccount(Model model, HttpServletRequest request, @RequestParam("username") String username, @RequestParam("password") String password) {
		UserAccount account = new UserAccount();
		account.setName(username);
		account.setPassword(hash(password));
		dao.save(account);
		return homePage(model, request);
	}

	@RequestMapping(value="/app/login", method = RequestMethod.GET)
	public String login(Model model, HttpServletRequest request, @RequestParam("username") String username, @RequestParam("password") String password) {
		UserAccount account = (UserAccount) dao.getByAttr(UserAccount.class, "name", username);
		if(account == null) {
			model.addAttribute("message", "account not found");
			return app(model, "Pages.Login");
		} else if(!account.getPassword().equals(hash(password))){
			model.addAttribute("message", "invalid password");
			return app(model, "Pages.Login");
		}
		request.getSession(true).setAttribute("user", account.getName());
		return homePage(model, request);
	}

	@RequestMapping(value="/rest/configschema/{ds}", method = RequestMethod.GET)
	public String setConfigDataSchema(Model model, @PathVariable("ds") String schema, HttpServletRequest request) {
		String jdbcUrl = "jdbc:hsqldb:config/" + schema + "/sarsoft";
		if(!jdbcUrl.equalsIgnoreCase(configDataSource.getJdbcUrl())) {
			configDataSource.setJdbcUrl("jdbc:hsqldb:config/" + schema + "/sarsoft");
			configSessionFactory.updateDatabaseSchema();
		}
		return "/blank";
	}

	@RequestMapping(value="/app/configschema/{ds}", method = RequestMethod.GET)
	public String setAppConfigDataSchema(Model model, @PathVariable("ds") String schema, HttpServletRequest request) {
		setConfigDataSchema(model, schema, request);
		return homePage(model, request);
	}


	@RequestMapping(value="/app/admin", method = RequestMethod.GET)
	public String admin(Model model, HttpServletRequest request) {
		String password = System.getProperty("sarsoft.admin.password");
		if(request.getSession().getAttribute("loggedin") != Boolean.TRUE) {
			if(password != null) {
				if(!password.equals(request.getParameter("password"))) {
					return app(model, "Pages.Login");
				}
				request.getSession().setAttribute("loggedin", true);
			}
		}
		model.addAttribute("search", RuntimeProperties.getSearch());
		addInitialDataToModel(model, request);

		String url = configDataSource.getJdbcUrl();
		url = url.substring(url.indexOf('/')+1);
		String config = url.substring(0, url.indexOf('/'));
		model.addAttribute("config", config);
		File dir = new File("config");
		model.addAttribute("configs", dir.list());

		model.addAttribute("mapkey", getConfigValue("maps.key"));
		model.addAttribute("hostName", getConfigValue("server.name"));
		model.addAttribute("garminKey", getConfigValue("garmin.key"));
		model.addAttribute("latitudedomain", getConfigValue("latitude.domain"));
		model.addAttribute("latitudesharedsecret", getConfigValue("latitude.clientSharedSecret"));
		model.addAttribute("latitudeRefreshInterval", getConfigValue("location.refreshInterval.latitude"));
		model.addAttribute("aprsRefreshInterval", getConfigValue("location.refreshInterval.aprs"));
		return app(model, "Pages.Admin");
	}

	@SuppressWarnings("unchecked")
	@RequestMapping(value="/rest/mapsource", method = RequestMethod.GET)
	public String MapSources(Model model) {
		return json(model, configDao.loadAll(MapSource.class));
	}

	@RequestMapping(value="/rest/mapsource", method = RequestMethod.POST)
	public String createMapSource(Model model, JSONForm params) {
		MapSource source = MapSource.createFromJSON(parseObject(params));
		configDao.save(source);
		return json(model, source);
	}

	@RequestMapping(value="/rest/mapsource/{name}", method = RequestMethod.POST)
	public String updateMapSource(@PathVariable("name") String name, Model model, JSONForm params, HttpServletRequest request) {
		Action action = (request.getParameter("action") != null) ? Action.valueOf(request.getParameter("action").toUpperCase()) : Action.CREATE;
		MapSource source = (MapSource) configDao.getByAttr(MapSource.class, "name", name);
		switch(action) {
		case DELETE :
			configDao.delete(source);
		}
		return json(model, source);
	}
}
