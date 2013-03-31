package org.sarsoft.server.controller;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;

import org.sarsoft.common.controller.JSONBaseController;
import org.sarsoft.common.util.RuntimeProperties;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

@Controller
public class AppController extends JSONBaseController {
	
	@RequestMapping(value="/map.html", method = RequestMethod.GET)
	public String showMap(Model model, HttpServletRequest request) {
		RuntimeProperties.setTenant(null);		
		HttpSession session = request.getSession(true);
		session.removeAttribute("tenantid");
		String clientState = (String) session.getAttribute("client_state");
		if(clientState != null) {
			request.getSession().removeAttribute("client_state");
			model.addAttribute("preload", clientState);
		}
		return app(model, "/map");
	}

}
