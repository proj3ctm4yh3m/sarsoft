package org.sarsoft.markup.controller;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import net.sf.json.JSONObject;
import net.sf.json.JSONSerializer;

import org.sarsoft.common.controller.AdminController;
import org.sarsoft.common.controller.DataManager;
import org.sarsoft.common.controller.ImageryController;
import org.sarsoft.common.controller.JSONBaseController;
import org.sarsoft.common.json.JSONForm;
import org.sarsoft.Format;
import org.sarsoft.common.model.ClientState;
import org.sarsoft.common.model.Tenant;
import org.sarsoft.common.model.UserAccount;
import org.sarsoft.common.model.Waypoint;
import org.sarsoft.common.model.Tenant.Permission;
import org.sarsoft.common.util.GPX;
import org.sarsoft.common.util.Hash;
import org.sarsoft.common.util.RuntimeProperties;
import org.sarsoft.markup.model.CollaborativeMap;
import org.sarsoft.markup.model.Marker;
import org.sarsoft.markup.model.Shape;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.ServletRequestDataBinder;
import org.springframework.web.bind.annotation.InitBinder;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.support.StringMultipartFileEditor;

@Controller
public class CollaborativeMapController extends JSONBaseController {

	@Autowired
	AdminController adminController;

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
	
	
	@RequestMapping(value="/map", method = RequestMethod.GET)
	public String get(Model model, @RequestParam(value="id", required=false) String id, HttpServletRequest request, HttpServletResponse response) {
		if(!((request.getParameter("password") == null || request.getParameter("password").length() == 0) && RuntimeProperties.getTenant() != null && RuntimeProperties.getTenant().equals(id))) {
			String error = adminController.setTenant(id, CollaborativeMap.class, request);
			if(error != null) return bounce(model, error, "/map?id=" + id);
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
			return app(model, "/collabmap");
		}
	}
	
	@RequestMapping(value="/map", method = RequestMethod.POST)
	public String create(Model model, @RequestParam(value="state", required=false) String clientstate, HttpServletRequest request) {
		String error = adminController.createNewTenant(CollaborativeMap.class, request);
		if(error != null) return bounce(model, error, "/map.html" + RuntimeProperties.getTenant());
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
		
		if(clientstate != null) {
			JSONObject json = (JSONObject) JSONSerializer.toJSON(clientstate);
			manager.toDB(manager.fromJSON(json));
		}
		return "redirect:/map?id=" + RuntimeProperties.getTenant();
	}
	
	@RequestMapping(value="/rest/map/", method = RequestMethod.GET)
	public String getMaps(Model model, @RequestParam(value="className", required=false) String className) {
		List<Tenant> tenants = new ArrayList<Tenant>();
		String user = RuntimeProperties.getUsername();
		UserAccount account = null;
		if(user != null) account = dao.getByPk(UserAccount.class, user);
		if(isHosted()) {
			if(account != null) {
				if(account.getTenants() != null) tenants.addAll(account.getTenants());
			}
		} else {
			tenants = dao.getAllTenants();
		}
		return json(model, tenants);
	}
	
	@RequestMapping(value="/rest/map/{id}", method = RequestMethod.DELETE)
	public String delete(Model model, HttpServletRequest request, @PathVariable("id") String id) {		
		if(RuntimeProperties.getUserPermission() != Permission.ADMIN) {
			return json(model, new HashMap()); // TODO communicate error condition
		}
		
		if(!id.equals(RuntimeProperties.getTenant())) {
			return json(model, new HashMap());
		}

		dao.deleteAll(Marker.class);
		dao.deleteAll(Shape.class);
		Tenant tenant = dao.getByAttr(Tenant.class, "name", RuntimeProperties.getTenant());
		if(tenant.getAccount() != null) {
			UserAccount account = tenant.getAccount();
			account.getTenants().remove(tenant);
			tenant.setAccount(null);
			// will delete tenant as well due to delete_orphan cascade
			dao.save(account);
		} else {
			dao.delete(tenant);
		}
		RuntimeProperties.setTenant(null);
		request.getSession(true).removeAttribute("tenantid");

		return json(model, new HashMap());
	}
	
	@RequestMapping(value="/rest/map/{id}", method = RequestMethod.POST)
	public String updateAdmin(Model model, JSONForm params, HttpServletRequest request, @PathVariable("id") String id) {
		CollaborativeMap map = dao.getByAttr(CollaborativeMap.class, "name", RuntimeProperties.getTenant());

		if(RuntimeProperties.getUserPermission() != Permission.ADMIN) {
			return json(model, new HashMap()); // TODO communicate error condition
		}
		
		if(!id.equals(RuntimeProperties.getTenant())) {
			return json(model, new HashMap());
		}

		Tenant updated = new CollaborativeMap(params.JSON());
		if(updated.getAllUserPermission() == null) {
			map.setDescription(updated.getDescription());
			map.setComments(updated.getComments());
		} else if(map.getAccount() != null) {
			map.setShared(updated.getShared());
			map.setAllUserPermission(updated.getAllUserPermission());
			map.setPasswordProtectedUserPermission(updated.getPasswordProtectedUserPermission());
			if(updated.getPassword() != null && updated.getPassword().length() > 0) map.setPassword(Hash.hash(updated.getPassword()));
		}

		dao.save(map);
		map = dao.getByAttr(CollaborativeMap.class, "name", RuntimeProperties.getTenant());
		
		return json(model, map);
	}
	

	@RequestMapping(value ="/rest/map/config", method = RequestMethod.GET)
	public String getSearchProperty(Model model, HttpServletRequest request, HttpServletResponse response) {
		ClientState state = new ClientState();
		Tenant tenant = dao.getByAttr(Tenant.class, "name", RuntimeProperties.getTenant());
		state.setMapConfig(tenant.getMapConfig());
		state.setMapLayers(tenant.getLayers());
		return json(model, manager.toJSON(state));
	}

	@RequestMapping(value = "/rest/map/config", method = RequestMethod.POST)
	public String setSearchProperty(Model model, JSONForm params) {
		ClientState state = manager.fromJSON(params.JSON());
		Tenant tenant = dao.getByAttr(Tenant.class, "name", RuntimeProperties.getTenant());
		tenant.setMapConfig(state.getMapConfig());
		tenant.setLayers(state.getMapLayers());
		tenant.setCfgUpdated(System.currentTimeMillis());
		dao.save(tenant);
		return json(model, tenant);
	}

	@RequestMapping(value = "/rest/map/center", method = RequestMethod.POST)
	public String setDefaultCenter(Model model, JSONForm params, HttpServletRequest request) {
		CollaborativeMap map = dao.getByAttr(CollaborativeMap.class, "name", RuntimeProperties.getTenant());
		Waypoint center = new Waypoint(params.JSON());
		map.setDefaultCenter(center);
		dao.save(map);
		return json(model, map.getDefaultCenter());
	}
	
	@RequestMapping(value="/rest/out")
	public String download(Model model, @RequestParam("state") String clientstate, HttpServletRequest request, HttpServletResponse response) {		
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
		
	@RequestMapping(value="/rest/in", method = RequestMethod.POST)
	public String upload(JSONForm params, Model model, HttpServletRequest request) {
		ClientState state = manager.fromGPX(GPX.parse(context, params));

		if(RuntimeProperties.getTenant() != null) {
			manager.dedupe(state, manager.fromDB());
			manager.toDB(state);
		}

		if("frame".equals(request.getParameter("responseType"))) {
			return jsonframe(model, manager.toJSON(state));
		} else {
			return json(model, manager.toJSON(state));
		}
	}
}
