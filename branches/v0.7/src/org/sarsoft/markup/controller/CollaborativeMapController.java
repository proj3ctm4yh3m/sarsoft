package org.sarsoft.markup.controller;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.servlet.ServletException;
import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import net.sf.json.JSONObject;

import org.sarsoft.common.controller.AdminController;
import org.sarsoft.common.controller.JSONBaseController;
import org.sarsoft.common.controller.JSONForm;
import org.sarsoft.common.model.Format;
import org.sarsoft.common.model.Tenant;
import org.sarsoft.common.model.Way;
import org.sarsoft.common.model.WayType;
import org.sarsoft.common.model.Waypoint;
import org.sarsoft.common.util.RuntimeProperties;
import org.sarsoft.markup.model.CollaborativeMap;
import org.sarsoft.markup.model.Marker;
import org.sarsoft.markup.model.Shape;
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

	@RequestMapping(value="/", method = RequestMethod.GET)
	public String homePage(Model model) {
		String tenant = RuntimeProperties.getTenant();
		if(tenant != null) {
			CollaborativeMap map = dao.getByAttr(CollaborativeMap.class, "name", tenant);
			if(map != null) return bounce(model);
		}
		return searchController.homePage(model);
	}
	
	private Map<String, Object> gpxifyMap(){
		Map<String, Object> map = new HashMap<String, Object>();
		List<Shape> shapes = dao.loadAll(Shape.class);
		if(shapes != null) for(Shape shape : shapes) {
			shape.getWay().setPrecision(0);
		}
		map.put("shapes", shapes);
		map.put("markers", dao.loadAll(Marker.class));
		return map;
	}

	@RequestMapping(value="/map", method = RequestMethod.GET)
	public String setMap(Model model, @RequestParam(value="id", required=false) String id, HttpServletRequest request, HttpServletResponse response) {
		if(!((request.getParameter("password") == null || request.getParameter("password").length() == 0) && RuntimeProperties.getTenant() != null && RuntimeProperties.getTenant().equals(id))) {
			String val = adminController.setTenant(model, id, CollaborativeMap.class, request);
			if(val != null) return val;
		}

		Format format = (request.getParameter("format") != null) ? Format.valueOf(request.getParameter("format").toUpperCase()) : Format.WEB;
		Tenant tenant = dao.getByAttr(CollaborativeMap.class, "name", RuntimeProperties.getTenant());
		if(tenant == null) tenant = dao.getByAttr(Tenant.class, "name", RuntimeProperties.getTenant());
		switch (format) {
		case GPX :
			response.setHeader("Content-Disposition", "attachment; filename=" + tenant.getDescription() + ".gpx");
			return gpx(model, gpxifyMap(), "Map");
		case KML :
			response.setHeader("Content-Disposition", "attachment; filename=" + tenant.getDescription() + ".kml");
			return kml(model, gpxifyMap(), "Map");
		default :
			if(id != null) {
				Cookie[] cookies = request.getCookies();
				Cookie myCookie = null;
				if(cookies != null) for(Cookie cookie : cookies) {
					if("org.sarsoft.recentlyLoadedMaps".equals(cookie.getName())) {
						myCookie = cookie;
					}
				}
				if(myCookie != null && myCookie.getValue() != null) {
					String value = myCookie.getValue();
					value = value.replaceAll("(^|,)" + id + "=.*?(,|$)", ",");
					value = value.replaceAll(",,", ",");
					if(value.length() > 0 && !value.endsWith(",")) value = value + ",";
					if(value.startsWith(",")) value = value.substring(1);
					myCookie.setValue(value);
				} else {
					myCookie = new Cookie("org.sarsoft.recentlyLoadedMaps","");
				}
				myCookie.setValue(myCookie.getValue() + id + "=" + tenant.getDescription().replaceAll(",", ""));
				myCookie.setMaxAge(7776000);
				response.addCookie(myCookie);
			}
			return app(model, "/collabmap");
		}
	}

	@RequestMapping(value="/map", method = RequestMethod.POST)
	public String createNewMap(Model model, HttpServletRequest request) {
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
				dao.save(map);
			}
			return "redirect:/map?id=" + RuntimeProperties.getTenant();
		}
		return val;
	}
	
	@RequestMapping(value="/map/restgpxupload", method = RequestMethod.POST)
	public String restGpxUpload(JSONForm params, Model model, HttpServletRequest request) {
		gpxUpload(params, model, request);
		return json(model, new Object());
	}
	
	@SuppressWarnings({ "rawtypes", "unchecked"})
	@RequestMapping(value="/map/gpxupload", method = RequestMethod.POST)
	public String gpxUpload(JSONForm params, Model model, HttpServletRequest request) {

		JSONObject obj = null;
		if(params.getFile() != null) {
			obj = (JSONObject) parseGPXFile(request, params.getFile(), "/xsl/gpx/gpx2shapes.xsl");
		} else {
			obj = (JSONObject) parseGPXJson(request, params.getJson(), "/xsl/gpx/gpx2shapes.xsl");
		}

		Map m = (Map) JSONObject.toBean(obj, Map.class, searchClassHints);

		List ways = (List) m.get("shapes");
		for(int i = 0; i < ways.size(); i++) {
			Map mapobj = (Map) ways.get(i);
			Way way = new Way();
			way.setWaypoints((List<Waypoint>) mapobj.get("waypoints"));
			way.setType(WayType.valueOf((String) mapobj.get("type")));
			Shape shape = new Shape();
			shape.setWay(way);
			List<Shape> shapes = dao.loadAll(Shape.class);
			long maxId = 0L;
			for(Shape shp : shapes) {
				maxId = Math.max(maxId, shp.getId());
			}
			shape.setId(maxId+1);
			shape.setLabel((String) mapobj.get("name"));
			String desc = (String) mapobj.get("desc");
			shape.setWeight(2);
			shape.setFill(0);
			shape.setColor("#FF0000");
			if(desc != null && desc.indexOf("&") > 0 && desc.indexOf("=") > 0) {
				String[] pairs = desc.split("&");
				for(String pair : pairs) {
					String[] kv = pair.split("=");
					if("weight".equals(kv[0])) shape.setWeight(Float.parseFloat(kv[1]));
					if("fill".equals(kv[0])) shape.setFill(Float.parseFloat(kv[1]));
					if("color".equals(kv[0])) shape.setColor(kv[1]);
				}
			}
			
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
			Waypoint wpt = new Waypoint();
			wpt.setLat((Double) mapobj.get("lat"));
			wpt.setLng((Double) mapobj.get("lng"));
			Marker marker = new Marker();
			marker.setPosition(wpt);
			List<Marker> markers = dao.loadAll(Marker.class);
			long maxId = 0L;
			for(Marker mrk : markers) {
				maxId = Math.max(maxId, mrk.getId());
			}
			marker.setId(maxId+1);

			marker.setLabel((String) mapobj.get("name"));
			marker.setUrl((String) mapobj.get("desc"));
			if(marker.getUrl() == null || marker.getUrl().length() == 0) marker.setUrl("#FF0000");
			
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
		return "redirect:/map?id=" + RuntimeProperties.getTenant();
	}
}