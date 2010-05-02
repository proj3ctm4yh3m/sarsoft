package org.sarsoft.plans.controller;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.sarsoft.common.controller.FileUploadForm;
import org.sarsoft.common.controller.JSONBaseController;
import org.sarsoft.common.controller.JSONForm;
import org.sarsoft.common.model.Format;
import org.sarsoft.common.model.Way;
import org.sarsoft.common.model.WayType;
import org.sarsoft.common.model.Waypoint;
import org.sarsoft.plans.model.OperationalPeriod;
import org.sarsoft.plans.model.SearchAssignment;
import net.sf.json.JSONArray;
import net.sf.json.JSONObject;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.ServletRequestDataBinder;
import org.springframework.web.bind.annotation.InitBinder;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.multipart.support.StringMultipartFileEditor;

@Controller
public class OperationalPeriodController extends JSONBaseController {

	@InitBinder
	public void initBinder(HttpServletRequest request, ServletRequestDataBinder binder) throws ServletException {
		binder.registerCustomEditor(String.class, new StringMultipartFileEditor());
	}

	// APP PERIOD
	@RequestMapping(value="/app/operationalperiod", method = RequestMethod.GET)
	public String getOperationalPeriodList(Model model) {
		model.addAttribute("periods", dao.loadAll(OperationalPeriod.class));
		return app(model, "OperationalPeriod.List");
	}

	@RequestMapping(value="/app/operationalperiod/{periodId}", method = RequestMethod.GET)
	public String getAppOperationalPeriod(Model model, @PathVariable("periodId") int id) {
		model.addAttribute("period", dao.load(OperationalPeriod.class, id));
		return app(model, "OperationalPeriod.Detail");
	}

	@RequestMapping(value="/app/operationalperiod/{periodId}/map", method = RequestMethod.GET)
	public String plansEditor(Model model, @PathVariable("periodId") int id) {
		model.addAttribute("period", dao.load(OperationalPeriod.class, id));
		return app(model, "/plans");
	}


	// REST PERIOD
	@RequestMapping(value="/rest/operationalperiod", method = RequestMethod.GET)
	public String getOperationalPeriods(Model model) {
		return json(model, dao.loadAll(OperationalPeriod.class));
	}

	@RequestMapping(value ="/rest/operationalperiod/{opid}", method = RequestMethod.GET)
	public String getOperationalPeriod(Model model, @PathVariable("opid") int id, HttpServletRequest request, HttpServletResponse response) {
		OperationalPeriod period = (OperationalPeriod) dao.load(OperationalPeriod.class, id);
		Format format = (request.getParameter("format") != null) ? Format.valueOf(request.getParameter("format").toUpperCase()) : Format.JSON;

		switch (format) {
		case GPX :
			response.setHeader("Content-Disposition", "attachment; filename=operationalperiod" + period.getId() + ".gpx");
			return gpx(model, period.getAssignments(), "SearchAssignments");
		case KML :
			response.setHeader("Content-Disposition", "attachment; filename=operationalperiod" + period.getId() + ".kml");
			return kml(model, period.getAssignments(), "SearchAssignments");
		default :
			return json(model, period);
		}
	}

	@RequestMapping(value="/rest/operationalperiod", method = RequestMethod.POST)
	public String createOperationalPeriod(JSONForm params, Model model) {
		OperationalPeriod period = OperationalPeriod.createFromJSON(parseObject(params));
		dao.save(period);
		return json(model, period);
	}

	@RequestMapping(value = "/rest/operationalperiod/{periodId}/assignment/tfx", method=RequestMethod.POST)
	public String addAssignmentsFromTFX(FileUploadForm params, @PathVariable("periodId") int periodId, Model model, HttpServletRequest request) {
		OperationalPeriod period = (OperationalPeriod) dao.load(OperationalPeriod.class, periodId);
//		JSONObject obj = (JSONObject) parse(params);
//		String[] tfx = ((String) obj.get("tfx")).split("\n");
		String[] tfx = params.getFile().split("\n");
		Map<String, List<Waypoint>> ways = new HashMap<String, List<Waypoint>>();
		for(String row : tfx) {
			String[] cols = row.split(",");
			String name = cols[2].trim().replaceAll("\"", "");
			if(!ways.containsKey(name)) {
				List<Waypoint> way = new ArrayList<Waypoint>();
				ways.put(name, way);
			}
			double lat = Double.parseDouble(cols[0].trim());
			double lng = Double.parseDouble(cols[1].trim());
			Waypoint wpt = new Waypoint();
			wpt.setLat(lat);
			wpt.setLng(lng);
			List<Waypoint> list = ways.get(name);
			if(list.size() == 0) {
				list.add(wpt);
			} else {
				Waypoint lastwpt = list.get(list.size() - 1);
				if(wpt.distanceFrom(lastwpt) > 5 && wpt.distanceFrom(lastwpt) < 400) {
					list.add(wpt);
				}
			}
		}

		Iterator<String> it = ways.keySet().iterator();
		while(it.hasNext()) {
			String name = it.next();
			SearchAssignment assignment = new SearchAssignment();
			assignment.setName(name);
			Way way = new Way();
			way.setName(name);
			way.setType(WayType.TRACK);
			way.setPolygon(false);
			way.setWaypoints(ways.get(name));
			ArrayList<Way> list = new ArrayList<Way>();
			list.add(way);
			assignment.setWays(list);
			period.addAssignment(assignment);
		}
		dao.save(period);
		return json(model, period);
	}

	@RequestMapping(value="/rest/operationalperiod/{periodId}/assignment", method = RequestMethod.GET)
	public String getAssignmentsForOperationalPeriod(Model model, @PathVariable("periodId") int id) {
		OperationalPeriod period = (OperationalPeriod) dao.load(OperationalPeriod.class, id);
		return json(model, period.getAssignments());
	}

}