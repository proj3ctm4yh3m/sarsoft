package org.sarsoft.markup.controller;

import java.util.List;

import javax.servlet.http.HttpServletRequest;

import org.sarsoft.common.controller.AdminController;
import org.sarsoft.common.controller.JSONBaseController;
import org.sarsoft.common.model.Waypoint;
import org.sarsoft.common.util.RuntimeProperties;
import org.sarsoft.markup.model.CollaborativeMap;
import org.sarsoft.plans.controller.SearchController;
import org.sarsoft.plans.model.OperationalPeriod;
import org.sarsoft.plans.model.Search;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
public class CollaborativeMapController extends JSONBaseController {

	@Autowired
	AdminController adminController;

	@Autowired
	SearchController searchController;

	@RequestMapping(value="/", method = RequestMethod.GET)
	public String homePage(Model model) {
		String tenant = RuntimeProperties.getTenant();
		if(tenant != null) {
			CollaborativeMap map = dao.getByAttr(CollaborativeMap.class, "name", tenant);
			if(map != null) return bounce(model);
		}
		return searchController.homePage(model);
	}

	@RequestMapping(value="/map", method = RequestMethod.GET)
	public String setMap(Model model, @RequestParam(value="id", required=false) String id, HttpServletRequest request) {
		String val = adminController.setTenant(model, id, CollaborativeMap.class, request);
		if(val != null) return val;
		return mapEditor(model);
	}

	@RequestMapping(value="/map", method = RequestMethod.POST)
	public String createNewMap(Model model, HttpServletRequest request) {
		String val = adminController.createNewTenant(model, CollaborativeMap.class, request);
		if(val == null) {
			CollaborativeMap map = dao.getByAttr(CollaborativeMap.class, "name", request.getParameter("name"));
			if(map != null) {
				String lat = request.getParameter("lat");
				String lng = request.getParameter("lng");
				if(getProperty("sarsoft.map.datum") != null) map.setDatum(getProperty("sarsoft.map.datum"));
				if(lat != null && lat.length() > 0 && lng != null && lng.length() > 0) {
					Waypoint lkp = new Waypoint(Double.parseDouble(lat), Double.parseDouble(lng));
					map.setDefaultCenter(lkp);
				}
				dao.save(map);

			}
			return homePage(model);
		}
		return val;
	}

	@RequestMapping(value="/map.html", method = RequestMethod.GET)
	public String mapEditor(Model model) {
		return app(model, "/collabmap");
	}

	@RequestMapping(value="/info.html", method = RequestMethod.GET)
	public String mapInfo(Model model) {
		return app(model, "Map.Home");
	}

}
