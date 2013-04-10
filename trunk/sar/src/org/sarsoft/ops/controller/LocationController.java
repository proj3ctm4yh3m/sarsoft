package org.sarsoft.ops.controller;

import java.util.HashMap;
import java.util.Map;

import org.apache.log4j.Logger;
import org.sarsoft.common.controller.JSONBaseController;
import org.sarsoft.common.model.Waypoint;
import org.sarsoft.common.util.RuntimeProperties;
import org.sarsoft.ops.model.Resource;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

@Controller
public class LocationController extends JSONBaseController {

	private static Map<String, EngineList> locationEngines = new HashMap<String, EngineList>();

	private Logger logger = Logger.getLogger(OpsController.class);
	
	public static boolean isLocationEnabled(String map) {
		return locationEngines.containsKey(map);
	}
	
	public EngineList getEngine(String tenant) {
		if(tenant == null) return null;
		EngineList engine = locationEngines.get(tenant);
		if(engine == null) {
			engine = new EngineList(this.dao, Boolean.parseBoolean(RuntimeProperties.getProperty("sarsoft.location.aprs.is.enabled")),
					Boolean.parseBoolean(RuntimeProperties.getProperty("sarsoft.location.aprs.local.enabled")), Boolean.parseBoolean(RuntimeProperties.getProperty("sarsoft.location.spot.enabled")));
			locationEngines.put(tenant, engine);
		}
		return engine;
	}

	public void check() {
		EngineList engines = getEngine(RuntimeProperties.getTenant());
		engines.check();
	}
	
	public void updateFilter() {
		EngineList engines = getEngine(RuntimeProperties.getTenant());
		if(engines != null && engines.getAprst2() != null) engines.getAprst2().updateFilter();
	}
	
	public Waypoint getCallsignLocation(String callsign) {
		EngineList engines = getEngine(RuntimeProperties.getTenant());
		if(engines != null && engines.getAprsLocal() != null) {
			Waypoint wpt = engines.getAprsLocal().getCallsigns().get(callsign);
			if(wpt != null) return wpt;
		}
		if(engines != null && engines.getAprst2() != null) {
			Waypoint wpt = engines.getAprst2().getCallsigns().get(callsign);
			if(wpt != null) return wpt;
		}
		return null;
	}
	
	@RequestMapping(value = "/app/location/status", method = RequestMethod.GET)
	public String checkLocationEngines(Model model) {
		check();
		model.addAttribute("engines", locationEngines.get(RuntimeProperties.getTenant()));
		return app(model, "Location.Status");
	}
	
	@RequestMapping(value = "/app/location/reset", method = RequestMethod.GET)
	public String resetLocationEngines(Model model) {
		EngineList engines = locationEngines.get(RuntimeProperties.getTenant());
		engines.reset();
		return "redirect:/app/location/status";
	}

	@RequestMapping(value = "/app/location/check", method = RequestMethod.GET)
	public String checkLocations(Model model) {
		EngineList engines = getEngine(RuntimeProperties.getTenant());
		for(Resource resource : dao.loadAll(Resource.class)) {
			if(engines.getAprst2() != null) engines.getAprst2().checkAprsFi(resource);
			if(engines.getSpot() != null) engines.getSpot().checkSpot(resource);
		}			
		return "redirect:/app/location/status";
	}

	
}
