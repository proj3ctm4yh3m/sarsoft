package org.sarsoft.common.controller;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;

import org.sarsoft.common.util.RuntimeProperties;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

@Controller
public class CommonController extends JSONBaseController {

	@RequestMapping(value="/map.html", method = RequestMethod.GET)
	public String showMap(Model model, HttpServletRequest request) {
		return app(model, "/map");
	}
	
	@RequestMapping(value="/app/togarmin", method = RequestMethod.GET)
	public String toGarmin(Model model, HttpServletRequest request) {
		model.addAttribute("file", request.getParameter("file"));
		model.addAttribute("name", request.getParameter("name"));
		model.addAttribute("hostName", "http://" + RuntimeProperties.getServerName());
		model.addAttribute("garminKey", getProperty("garmin.key." + RuntimeProperties.getServerName()));
		model.addAttribute("version", getProperty("sarsoft.version"));
		if(request.getParameter("callbackurl") != null) {
			model.addAttribute("callbackurl", request.getParameter("callbackurl"));
		}
		return "/plans/togarmin";
	}

	@RequestMapping(value="/app/fromgarmin", method = RequestMethod.GET)
	public String fromGarmin(Model model, HttpServletRequest request) {
		model.addAttribute("id", request.getParameter("id"));
		model.addAttribute("version", getProperty("sarsoft.version"));
		model.addAttribute("hostName", "http://" + RuntimeProperties.getServerName());
		model.addAttribute("garminKey", getProperty("garmin.key." + RuntimeProperties.getServerName()));
		if(request.getParameter("posturl") != null) {
			model.addAttribute("posturl", request.getParameter("posturl"));
			model.addAttribute("callbackurl", request.getParameter("callbackurl"));
		}
		return "/plans/fromgarmin";
	}

	@SuppressWarnings("unchecked")
	@RequestMapping(value="/rest/timestamp", method = RequestMethod.GET)
	public String getTimestamp(Model model) {
		Map m = new HashMap();
		m.put("timestamp", Long.toString(new Date().getTime()));
		return json(model, m);
	}

}
