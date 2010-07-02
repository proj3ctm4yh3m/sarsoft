package org.sarsoft.common.controller;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;

import org.sarsoft.admin.model.Config;
import org.sarsoft.admin.model.MapSource;
import org.sarsoft.common.model.JSONAnnotatedPropertyFilter;
import org.sarsoft.common.util.Constants;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

@Controller
public class CommonController extends JSONBaseController {

	@RequestMapping(value="/app/togarmin", method = RequestMethod.GET)
	public String toGarmin(Model model, HttpServletRequest request) {
		model.addAttribute("file", request.getParameter("file"));
		model.addAttribute("name", request.getParameter("name"));
		model.addAttribute("hostName", getConfigValue("server.name"));
		model.addAttribute("garminKey", getConfigValue("garmin.key"));
		return "/plans/togarmin";
	}

	@RequestMapping(value="/app/fromgarmin", method = RequestMethod.GET)
	public String fromGarmin(Model model, HttpServletRequest request) {
		model.addAttribute("id", request.getParameter("id"));
		model.addAttribute("hostName", getConfigValue("server.name"));
		model.addAttribute("garminKey", getConfigValue("garmin.key"));
		return "/plans/fromgarmin";
	}

	@RequestMapping(value="/app/constants.js", method = RequestMethod.GET)
	public String getConstants(Model model) {
		model.addAttribute("json", JSONAnnotatedPropertyFilter.fromObject(Constants.all));
		model.addAttribute("mapSources", configDao.loadAll(MapSource.class));
		return "/global/constants";
	}

	@SuppressWarnings("unchecked")
	@RequestMapping(value="/rest/timestamp", method = RequestMethod.GET)
	public String getTimestamp(Model model) {
		Map m = new HashMap();
		m.put("timestamp", Long.toString(new Date().getTime()));
		return json(model, m);
	}

	@RequestMapping(value="/rest/config", method = RequestMethod.GET)
	public String getAllConfigs(Model model) {
		return json(model, configDao.loadAll(Config.class));
	}

	@RequestMapping(value="/rest/config/{name}", method = RequestMethod.GET)
	public String getConfig(Model model, @PathVariable("name") String name) {
		return json(model, configDao.getByAttr(Config.class, "name", name));
	}

	@RequestMapping(value="/rest/config/{name}", method = RequestMethod.POST)
	public String setConfig(Model model, @PathVariable("name") String name, JSONForm json) {
		Config config = Config.createFromJSON(parseObject(json));
		Config realConfig = (Config) configDao.getByAttr(Config.class, "name", name);
		if(realConfig == null) {
			config.setName(name);
			realConfig = config;
		} else {
			realConfig.setValue(config.getValue());
		}
		System.out.println("Saving config " + realConfig.getName() + " " + realConfig.getValue());
		configDao.save(realConfig);
		return json(model, config);
	}

}
