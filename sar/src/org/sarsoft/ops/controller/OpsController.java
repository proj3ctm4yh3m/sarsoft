package org.sarsoft.ops.controller;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;

import org.apache.log4j.Logger;
import org.sarsoft.common.controller.JSONBaseController;
import org.sarsoft.common.json.JSONForm;
import org.sarsoft.common.model.Waypoint;
import org.sarsoft.common.util.RuntimeProperties;
import org.sarsoft.ops.model.Resource;
import org.sarsoft.ops.model.Resource.Type;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

@Controller
public class OpsController extends JSONBaseController {

	@Autowired
	LocationController location;

	private Logger logger = Logger.getLogger(OpsController.class);
		
	@RequestMapping(value="/resource", method = RequestMethod.POST)
	public String importResources(Model model, JSONForm params, HttpServletRequest request) {
		String csv = params.getFile();
		int NAME = 0;
		int TYPE = 1;
		int AGENCY = 2;
		int CALLSIGN = 3;
		int SPOT_ID = 4;
		int SPOT_PASSWORD = 5;
		if(csv != null) {
			long maxId = 0L;
			List<Resource> resources = dao.loadAll(Resource.class);
			for(Resource r : resources) {
				maxId = Math.max(maxId, r.getId());
			}
			maxId++;
			String[] rows = csv.split("\n");
			for(String row : rows) {
				try {
					String[] cols = row.split(",");
					for(int i = 0; i < cols.length; i++) {
						if(cols[i] != null && cols[i].length() > 2 && cols[i].startsWith("\"") && cols[i].endsWith("\""))
							cols[i] = cols[i].substring(1, cols[i].length()-1);
					}
					String name = cols[NAME];
					String callsign = cols[CALLSIGN];
					if("callsign".equalsIgnoreCase(callsign) || "name".equalsIgnoreCase(name)) continue;
					Resource resource = dao.getByAttr(Resource.class, "callsign", callsign);
					if(resource != null) {
						if(cols.length > SPOT_ID)
							if(resource.getSpotId() == null) resource.setSpotId(cols[SPOT_ID]);
						if(cols.length > SPOT_PASSWORD)
							if(resource.getSpotPassword() == null) resource.setSpotPassword(cols[SPOT_PASSWORD]);
					} else {
						resource = new Resource();
						resource.setId(maxId);
						maxId++;
						resource.setType(Type.valueOf(cols[TYPE]));
						resource.setAgency(cols[AGENCY]);
						resource.setName(name);
						resource.setCallsign(callsign);
						if(cols.length > SPOT_ID)
							resource.setSpotId(cols[SPOT_ID]);
						if(cols.length > SPOT_PASSWORD)
							resource.setSpotPassword(cols[SPOT_PASSWORD]);
					}
					dao.save(resource);
				} catch (Exception e) {
					logger.warn(e);
				}
			}
		}
		
		return "redirect:/resource/";
	}

	@RequestMapping(value="/rest/callsign", method = RequestMethod.GET)
	public String getCallsigns(Model model) {
		return getCallsignsSince(model, 1);
	}
	
	@RequestMapping(value="/rest/callsign/clear", method = RequestMethod.GET)
	public String restClearCallsigns(Model model) {
		EngineList engines = location.getEngine(RuntimeProperties.getTenant());
		if(engines.getAprst2() != null) engines.getAprst2().clearCallsigns();
		if(engines.getAprsLocal() != null) engines.getAprsLocal().clearCallsigns();
		return json(model, new Object());
	}

	@SuppressWarnings({ "rawtypes", "unchecked" })
	@RequestMapping(value="/rest/callsign/since/{date}", method = RequestMethod.GET)
	public String getCallsignsSince(Model model, @PathVariable("date") long date) {
		EngineList engines = location.getEngine(RuntimeProperties.getTenant());
		if(engines != null) engines.check();
		if(engines != null && (engines.getAprsLocal() != null || engines.getAprst2() != null)) {
			Map<String, Waypoint> csmap = new HashMap<String, Waypoint>();
			if(engines.getAprst2() != null) csmap.putAll(engines.getAprst2().getCallsigns());
			if(engines.getAprsLocal() != null) csmap.putAll(engines.getAprsLocal().getCallsigns());
			List cslist = new ArrayList();
			for(String callsign : csmap.keySet()) {
				Waypoint wpt = csmap.get(callsign);
				if(wpt != null && wpt.getTime().getTime() > date) {
					Map m = new HashMap();
					m.put("id", callsign);
					m.put("callsign", callsign);
					m.put("name", callsign);
					m.put("position", csmap.get(callsign));
					m.put("lastFix", new SimpleDateFormat("M/d/y HH:mm").format(csmap.get(callsign).getTime()));
					cslist.add(m);
				}
			}
			return json(model, cslist);
		}
		return json(model, new Object());
	}

}