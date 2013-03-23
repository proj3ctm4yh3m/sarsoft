package org.sarsoft.common.controller;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import org.sarsoft.common.model.MapSource;
import org.sarsoft.common.util.RuntimeProperties;
import org.sarsoft.common.util.WebMercator;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
public class CommonController extends JSONBaseController {
	
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
