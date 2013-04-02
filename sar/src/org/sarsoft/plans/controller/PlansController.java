package org.sarsoft.plans.controller;

import javax.servlet.http.HttpServletRequest;

import org.sarsoft.common.controller.JSONBaseController;
import org.sarsoft.plans.model.Assignment;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

@Controller
public class PlansController extends JSONBaseController {

	@RequestMapping(value="/sar104/{id}", method = RequestMethod.GET)
	public String getAssignmentForm(Model model, @PathVariable("id") long id, HttpServletRequest request) {
		Assignment assignment = dao.load(Assignment.class, id);
		model.addAttribute("assignment", assignment);
		return app(model, "Assignment.PrintForms");
	}
	
}
