package org.sarsoft.common.controller;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;

import org.sarsoft.admin.model.Config;
import org.sarsoft.common.model.JSONAnnotatedPropertyFilter;
import org.sarsoft.common.util.Constants;
import org.sarsoft.common.util.RuntimeProperties;
import org.sarsoft.imagery.model.GeoRefImage;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

@Controller
public class CommonController extends JSONBaseController {

	@RequestMapping(value="/app/map.html", method = RequestMethod.GET)
	public String showMap(Model model, HttpServletRequest request) {
		return app(model, "/map");
	}
	
	@RequestMapping(value="/app/togarmin", method = RequestMethod.GET)
	public String toGarmin(Model model, HttpServletRequest request) {
		model.addAttribute("file", request.getParameter("file"));
		model.addAttribute("name", request.getParameter("name"));
		model.addAttribute("hostName", "http://" + RuntimeProperties.getServerName());
		model.addAttribute("garminKey", getProperty("garmin.key." + RuntimeProperties.getServerName()));
		return "/plans/togarmin";
	}

	@RequestMapping(value="/app/fromgarmin", method = RequestMethod.GET)
	public String fromGarmin(Model model, HttpServletRequest request) {
		model.addAttribute("id", request.getParameter("id"));
		model.addAttribute("hostName", "http://" + RuntimeProperties.getServerName());
		model.addAttribute("garminKey", getProperty("garmin.key." + RuntimeProperties.getServerName()));
		return "/plans/fromgarmin";
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
		return "/global/constants";
	}

	@SuppressWarnings("unchecked")
	@RequestMapping(value="/rest/timestamp", method = RequestMethod.GET)
	public String getTimestamp(Model model) {
		Map m = new HashMap();
		m.put("timestamp", Long.toString(new Date().getTime()));
		return json(model, m);
	}

}
