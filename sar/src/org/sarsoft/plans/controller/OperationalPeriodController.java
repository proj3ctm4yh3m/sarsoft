package org.sarsoft.plans.controller;

import java.util.HashSet;
import java.util.Set;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;

import net.sf.json.JSONObject;

import org.sarsoft.common.controller.MapObjectController;
import org.sarsoft.common.model.MapObject;
import org.sarsoft.plans.model.OperationalPeriod;
import org.sarsoft.plans.model.Assignment;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.ServletRequestDataBinder;
import org.springframework.web.bind.annotation.InitBinder;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.multipart.support.StringMultipartFileEditor;

@Controller
@RequestMapping(value="/rest/op")
public class OperationalPeriodController extends MapObjectController {

	@InitBinder
	public void initBinder(HttpServletRequest request, ServletRequestDataBinder binder) throws ServletException {
		binder.registerCustomEditor(String.class, new StringMultipartFileEditor());
	}
	
	public OperationalPeriodController() {
		super(OperationalPeriod.class);
	}
	
	public OperationalPeriod make(JSONObject json) {
		return new OperationalPeriod(json);
	}
	
	public void unlink(MapObject obj) {
		OperationalPeriod period = (OperationalPeriod) obj;
		if(period.getAssignments() != null) {
			Set<Assignment> copy = new HashSet<Assignment>(period.getAssignments());
			for(Assignment assignment : copy) {
				period.removeAssignment(assignment);
			}
		}
	}
	
}
