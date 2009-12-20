package org.sarsoft.admin.controller;

import java.io.File;
import java.util.ArrayList;
import java.util.List;

import javax.servlet.ServletContext;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.sql.DataSource;

import org.sarsoft.common.controller.JSONBaseController;
import org.sarsoft.common.controller.JSONForm;
import org.sarsoft.common.model.MapSource;
import org.sarsoft.common.model.Way;
import org.sarsoft.common.util.DBPropertyLoader;
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
	@Qualifier("dataSource")
	ComboPooledDataSource dataSource;

	@Autowired
	@Qualifier("sessionFactory")
	LocalSessionFactoryBean sessionFactory;

	@Autowired
	DBPropertyLoader dbPropertyLoader;

	@RequestMapping(value="/app/shutdown", method = RequestMethod.GET)
	public String shutdown(Model model) {
		System.exit(0);
		return "ain't gonna happen";
	}

	@SuppressWarnings("unchecked")
	@RequestMapping(value="/app/index.html", method = RequestMethod.GET)
	public String homePage(Model model, HttpServletRequest request) {
		if(request.getSession().getServletContext().getAttribute("initialized") == Boolean.TRUE) {
			OperationalPeriod lastPeriod = null;
			List<OperationalPeriod> periods = (List<OperationalPeriod>) dao.loadAll(OperationalPeriod.class);
			for(OperationalPeriod period : periods) {
				if(lastPeriod == null || lastPeriod.getId() < period.getId()) lastPeriod = period;
			}
			model.addAttribute("lastperiod", lastPeriod);
			return "Pages.Home";
		}
		File dir = new File("searches");
		model.addAttribute("searches", dir.list());
		return "Pages.Welcome";
	}

	@RequestMapping(value="/rest/dataschema/{ds}", method = RequestMethod.GET)
	public String setDataSchema(Model model, @PathVariable("ds") String schema, HttpServletRequest request) {
		request.getSession().getServletContext().setAttribute("initialized", Boolean.TRUE);
		dataSource.setJdbcUrl("jdbc:hsqldb:searches/" + schema + "/sarsoft");
		sessionFactory.updateDatabaseSchema();
		try {
			dbPropertyLoader.afterPropertiesSet();
		} catch (Exception e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		return "/blank";
	}

	@RequestMapping(value="/app/dataschema/{ds}", method = RequestMethod.GET)
	public String setAppDataSchema(Model model, @PathVariable("ds") String schema, HttpServletRequest request) {
		setDataSchema(model, schema, request);
		return homePage(model, request);
	}

	@RequestMapping(value="/app/admin", method = RequestMethod.GET)
	public String admin(Model model) {
		String url = dataSource.getJdbcUrl();
		url = url.substring(url.indexOf('/')+1);
		String search = url.substring(0, url.indexOf('/'));
		model.addAttribute("search", search);
		File dir = new File("searches");
		model.addAttribute("searches", dir.list());
		model.addAttribute("mapkey", getConfigValue("maps.key"));
		return "Pages.Admin";
	}

	@SuppressWarnings("unchecked")
	@RequestMapping(value="/rest/mapsource", method = RequestMethod.GET)
	public String MapSources(Model model) {
		return json(model, dao.loadAll(MapSource.class));
	}

	@RequestMapping(value = "/rest/mapsource", method= RequestMethod.POST)
	public String addMapSource(JSONForm params, Model model) {
		MapSource source = MapSource.createFromJSON(parseObject(params));
		dao.save(source);
		return json(model, source);
	}

}
