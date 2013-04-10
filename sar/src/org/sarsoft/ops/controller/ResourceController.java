package org.sarsoft.ops.controller;

import java.util.Date;
import java.util.List;

import javax.servlet.http.HttpServletRequest;

import net.sf.json.JSONObject;

import org.sarsoft.common.Pair;
import org.sarsoft.common.json.JSONForm;
import org.sarsoft.common.model.Waypoint;
import org.sarsoft.ops.model.Resource;
import org.sarsoft.plans.controller.AssignmentChildController;
import org.sarsoft.plans.model.Assignment;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

@Controller
@RequestMapping("/rest/resource")
public class ResourceController extends AssignmentChildController<Resource> {
	
	@Autowired
	LocationController location;
	
	public ResourceController() {
		super(Resource.class);
	}
	
	public Resource make(JSONObject json) {
		return new Resource(json);
	}
	
	public Pair<Integer, Resource> fromGPX(JSONObject obj) {
		return null;
	}
	
	public String getLabel(Resource resource) {
		return resource.getName() != null ? resource.getName() : Long.toString(resource.getId());
	}
	
	public void removeFrom(Assignment assignment, Resource child) {
		assignment.removeResource(child);
	}
	
	public void addTo(Assignment assignment, Resource child) {
		assignment.addResource(child);
	}
	
	@RequestMapping(value="", method = RequestMethod.POST)
	public String create(Model model, JSONForm params) {
		Resource obj = make(params.JSON());
		if(obj.getCallsign() != null) {
			Waypoint wpt = location.getCallsignLocation(obj.getCallsign());
			if(wpt != null) obj.setPosition(wpt);
		}
		persist(obj);
		return json(model, obj);
	}
	
	@RequestMapping(value="/{id}", method = RequestMethod.POST)
	public String update(Model model, JSONForm params, @PathVariable("id") long id) {
		String val = super.update(model, params, id);
		location.updateFilter();
		return val;
	}

	@RequestMapping(value="/{id}/position", method = RequestMethod.POST)
	public String updatePosition(JSONForm params, Model model, @PathVariable("id") long id, HttpServletRequest request) {
		Resource resource = dao.load(Resource.class, id);
		resource.from(params.JSON());
		dao.save(resource);
		return json(model, resource);
	}
	
	public List<Resource> dedupe(List<Resource> removeFrom, List<Resource> checkAgainst) {
		return null;
	}
}
