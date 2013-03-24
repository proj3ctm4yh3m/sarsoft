package org.sarsoft.markup.controller;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

import javax.servlet.ServletContext;
import javax.servlet.ServletException;
import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import net.sf.json.JSONArray;
import net.sf.json.JSONObject;
import net.sf.json.JSONSerializer;

import org.sarsoft.common.controller.AdminController;
import org.sarsoft.common.controller.DataManager;
import org.sarsoft.common.controller.ImageryController;
import org.sarsoft.common.controller.JSONBaseController;
import org.sarsoft.common.controller.JSONForm;
import org.sarsoft.common.model.Format;
import org.sarsoft.common.model.Tenant;
import org.sarsoft.common.model.Waypoint;
import org.sarsoft.common.util.GPX;
import org.sarsoft.common.util.RuntimeProperties;
import org.sarsoft.markup.model.CollaborativeMap;
import org.sarsoft.plans.controller.SearchController;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.ServletRequestDataBinder;
import org.springframework.web.bind.annotation.InitBinder;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.support.StringMultipartFileEditor;

@Controller
public class CollaborativeMapController extends JSONBaseController {

	@Autowired
	AdminController adminController;

	@Autowired
	SearchController searchController;
	
	@Autowired
	ImageryController imageryController;
	
	@Autowired
	DataManager manager;

	@SuppressWarnings("rawtypes")
	public static Map<String, Class> searchClassHints = new HashMap<String, Class>();

	static {
		@SuppressWarnings("rawtypes")
		Map<String, Class> m = new HashMap<String, Class>();
		m.put("waypoints", Waypoint.class);
		m.put("way", Map.class);
		m.put("shapes", Map.class);
		m.put("markers", Map.class);
		searchClassHints = Collections.unmodifiableMap(m);
	}

	@InitBinder
	public void initBinder(HttpServletRequest request, ServletRequestDataBinder binder) throws ServletException {
		binder.registerCustomEditor(String.class, new StringMultipartFileEditor());
	}
	
	
	@RequestMapping(value="/hastymap")
	public String hastyExport(Model model, @RequestParam("state") String clientstate, HttpServletRequest request, HttpServletResponse response) {		
		Format format = (request.getParameter("format") != null) ? Format.valueOf(request.getParameter("format").toUpperCase()) : Format.GPX;
		JSONObject json = (JSONObject) JSONSerializer.toJSON(clientstate);
		switch(format) {
		case GPX :
			response.setHeader("Content-Disposition", "attachment; filename=export.gpx");
			return gpx(model, manager.toGPX(manager.fromJSON(json)));
		case KML :
			response.setHeader("Content-Disposition", "attachment; filename=export.kml");
			response.setHeader("Content-Type", "application/vnd.google-earth.kml+xml");
			return kml(model, manager.toGPX(manager.fromJSON(json)));
		}
		return "";
	}

	@RequestMapping(value="/map", method = RequestMethod.GET)
	public String get(Model model, @RequestParam(value="id", required=false) String id, HttpServletRequest request, HttpServletResponse response) {
		if(!((request.getParameter("password") == null || request.getParameter("password").length() == 0) && RuntimeProperties.getTenant() != null && RuntimeProperties.getTenant().equals(id))) {
			String val = adminController.setTenant(model, id, CollaborativeMap.class, request);
			if(val != null) return val;
		}

		if(request.getSession(true).getAttribute("message") != null) {
			model.addAttribute("message", request.getSession().getAttribute("message"));
			request.getSession().removeAttribute("message");
		}
		
		if(request.getParameter("dest") != null)
			return "redirect:" + request.getParameter("dest");

		Format format = (request.getParameter("format") != null) ? Format.valueOf(request.getParameter("format").toUpperCase()) : Format.WEB;
		Tenant tenant = dao.getByAttr(CollaborativeMap.class, "name", RuntimeProperties.getTenant());
		if(tenant == null) tenant = dao.getByAttr(Tenant.class, "name", RuntimeProperties.getTenant());
		String filename = (tenant.getDescription() != null && tenant.getDescription().length() > 0) ? tenant.getDescription() : tenant.getName();
		filename = filename.replaceAll(" ", "_");
		switch (format) {
		case GPX :
			response.setHeader("Content-Disposition", "attachment; filename=" + filename + ".gpx");
			return gpx(model, manager.toGPX(manager.fromDB()));
		case KML :
			response.setHeader("Content-Disposition", "attachment; filename=" + filename + ".kml");
			response.setHeader("Content-Type", "application/vnd.google-earth.kml+xml");
			return kml(model, manager.toGPX(manager.fromDB()));
		default :
			model.addAttribute("preload", manager.toJSON(manager.fromDB()));
			Map<String, String> map = new HashMap<String, String>();
			map.put("value", tenant.getMapConfig());
			model.addAttribute("mapConfig", this.toJSON(map));
			return app(model, "/collabmap");
		}
	}
	
	@RequestMapping(value="/map", method = RequestMethod.POST)
	public String create(Model model, @RequestParam("state") String clientstate, HttpServletRequest request) {
		String val = adminController.createNewTenant(model, CollaborativeMap.class, request);
		if(val == null) {
			CollaborativeMap map = dao.getByAttr(CollaborativeMap.class, "name", RuntimeProperties.getTenant());
			if(map != null) {
				String lat = request.getParameter("lat");
				String lng = request.getParameter("lng");
				if(lat != null && lat.length() > 0 && lng != null && lng.length() > 0) {
					Waypoint lkp = new Waypoint(Double.parseDouble(lat), Double.parseDouble(lng));
					map.setDefaultCenter(lkp);
				}
				Cookie[] cookies = request.getCookies();
				if(cookies != null) for(Cookie cookie : cookies) {
					if("org.sarsoft.mapConfig".equals(cookie.getName())) {
						try {
						map.setMapConfig(java.net.URLDecoder.decode(cookie.getValue(), "UTF-8"));
						} catch (Exception e){
							// if we can't properly decode the mapConfig, don't worry about it
						}
					}
					if("org.sarsoft.mapLayers".equals(cookie.getName())) {
						try {
						map.setLayers(java.net.URLDecoder.decode(cookie.getValue(), "UTF-8"));
						} catch (Exception e){
							// if we can't properly decode the mapConfig, don't worry about it
						}
					}
				}
				if(request.getParameter("mapcfg") != null) {
					map.setMapConfig(request.getParameter("mapcfg"));
				}
				dao.save(map);
			}
			
			JSONObject json = (JSONObject) JSONSerializer.toJSON(clientstate);
			manager.toDB(manager.fromJSON(json));
			return "redirect:/map?id=" + RuntimeProperties.getTenant();
		}
		return val;
	}
	
	@RequestMapping(value = "/rest/tenant/center", method = RequestMethod.POST)
	public String setDefaultCenter(Model model, JSONForm params, HttpServletRequest request) {
		CollaborativeMap map = dao.getByAttr(CollaborativeMap.class, "name", RuntimeProperties.getTenant());
		Waypoint center = Waypoint.createFromJSON(params.JSON());
		map.setDefaultCenter(center);
		dao.save(map);
		return json(model, map.getDefaultCenter());
	}
	
	@RequestMapping(value="/map/restgpxupload", method = RequestMethod.POST)
	public String restGpxUpload(JSONForm params, Model model) {
		gpxUpload(params, model);
		return json(model, new Object());
	}
	

	@SuppressWarnings({ "rawtypes", "unchecked"})
	@RequestMapping(value="/hastyupload")
	public String hastyImport(Model model, JSONForm params, HttpServletRequest request) {
		JSONArray jarray = GPX.parse(context, params);

		if("frame".equals(request.getParameter("responseType"))) {
			return jsonframe(model, manager.toJSON(manager.fromGPX(jarray)));
		} else {
			return json(model, manager.toJSON(manager.fromGPX(jarray)));
		}
	}
	
	
	@RequestMapping(value="/map/gpxupload", method = RequestMethod.POST)
	public String gpxUpload(JSONForm params, Model mode) {

		JSONArray jarray = GPX.parse(context, params);
		
		manager.toDB(manager.fromGPX(jarray));

		/*
		List ways = (List) m.get("shapes");
		for(int i = 0; i < ways.size(); i++) {
			Map mapobj = (Map) ways.get(i);
			Shape shape = reconstructShape(mapobj);
			List<Shape> shapes = dao.loadAll(Shape.class);
			long maxId = 0L;
			for(Shape shp : shapes) {
				maxId = Math.max(maxId, shp.getId());
			}
			shape.setId(maxId+1);

			boolean exists = false;
			shapes = dao.loadAll(Shape.class);
			if(shapes != null) for(Shape similar : shapes) {
				if(shape.getLabel() != null && similar.getLabel() != null && !similar.getLabel().toUpperCase().startsWith(shape.getLabel().toUpperCase())) continue;
				if(Math.abs(similar.getWay().getDistance() - shape.getWay().getDistance()) > 0.02) continue;
				List<Waypoint> a = similar.getWay().getWaypoints();
				List<Waypoint> b = shape.getWay().getWaypoints();
				if(a.size() != b.size()) continue;
				boolean allmatch = true;
				for(int j = 0; j < a.size(); j++) {
					if(a.get(j).distanceFrom(b.get(j)) > 5) allmatch = false;
				}
				if(allmatch) exists = true;
			}
			if(!exists) dao.save(shape);
		}
		
		List waypoints = (List) m.get("markers");
		for(int i = 0; i < waypoints.size(); i++) {
			Map mapobj = (Map) waypoints.get(i);
			Marker marker = reconstructMarker(mapobj);
			List<Marker> markers = dao.loadAll(Marker.class);
			long maxId = 0L;
			for(Marker mrk : markers) {
				maxId = Math.max(maxId, mrk.getId());
			}
			marker.setId(maxId+1);
			
			boolean exists = false;
			markers = dao.loadAll(Marker.class);
			if(markers != null) for(Marker similar : markers) {
				if(similar.getPosition().distanceFrom(marker.getPosition()) > 5) continue;
				if(marker.getLabel() != null && similar.getLabel() != null && !similar.getLabel().toUpperCase().startsWith(marker.getLabel().toUpperCase())) continue;
				exists = true;
			}
			if(!exists) dao.save(marker);
		}
		if(request.getParameter("dest") != null && request.getParameter("dest").length() > 0) return "redirect:" + request.getParameter("dest");
		*/
		return "redirect:/map?id=" + RuntimeProperties.getTenant();
	}
}
