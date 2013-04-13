package org.sarsoft.server.controller;

import org.sarsoft.common.controller.JSONBaseController;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

@Controller
public class AppController extends JSONBaseController {

	@RequestMapping(value="/about.html", method = RequestMethod.GET)
	public String about(Model model) {
		return app(model, "Pages.Splash");
	}
	

}
