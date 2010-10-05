package org.sarsoft.admin.controller;

import java.io.File;
import java.util.List;

import javax.servlet.http.HttpServletRequest;

import org.sarsoft.admin.model.MapSource;
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
	public String chooseNewSearch(Model model) {
		model.addAttribute("searches", dao.getAllSearchNames());
		return app(model, "Pages.Welcome");
	}

	@RequestMapping(value="/app/setsearch/{ds}", method = RequestMethod.GET)
	public String setAppDataSchema(Model model, @PathVariable("ds") String name, HttpServletRequest request) {
		request.getSession().setAttribute("search", name);
		RuntimeProperties.setSearch(name);
		if(dao.getByAttr(Search.class, "name", name) == null) {
			Search search = new Search();
			search.setName(name);
			dao.save(search);
		}
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
		model.addAttribute("searches", dao.getAllSearchNames());

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
