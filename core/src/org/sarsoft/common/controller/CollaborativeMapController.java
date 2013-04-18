package org.sarsoft.common.controller;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

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
import org.sarsoft.common.gpx.GPX;
import org.sarsoft.common.util.Hash;
import org.sarsoft.common.util.RuntimeProperties;
import org.sarsoft.common.model.CollaborativeMap;
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

	@InitBinder
	public void initBinder(HttpServletRequest request, ServletRequestDataBinder binder) throws ServletException {
		binder.registerCustomEditor(String.class, new StringMultipartFileEditor());
	}
	
	@RequestMapping(value="/", method = RequestMethod.GET)
	public String bounce() {
		return "redirect:/map.html";
	}
	
	@RequestMapping(value="/map.html", method = RequestMethod.GET)
	public String showMap(Model model, HttpServletRequest request) {
		RuntimeProperties.setTenant(null);		
		HttpSession session = request.getSession(true);
		session.removeAttribute("tenantid");
		String clientState = (String) session.getAttribute("client_state");
		if(clientState != null) {
			request.getSession().removeAttribute("client_state");
			model.addAttribute("preload", clientState);
		}
		return app(model, "/map");
	}
	
	@RequestMapping(value="/map", method = RequestMethod.GET)
	public String get(Model model, @RequestParam(value="id", required=false) String id, HttpServletRequest request, HttpServletResponse response) {
		if(id == null) {
			RuntimeProperties.setTenant(null);		
			HttpSession session = request.getSession(true);
			session.removeAttribute("tenantid");
			return app(model, "/collabmap");
		}
		
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
		case JSON:
			return json(model, manager.toJSON(manager.fromDB()));
		case GPX :
			response.setHeader("Content-Disposition", "attachment; filename=" + filename + ".gpx");
			return gpx(model, GPX.toGPX(manager.toStyledGeo(manager.fromDB())));
		case KML :
			response.setHeader("Content-Disposition", "attachment; filename=" + filename + ".kml");
			response.setHeader("Content-Type", "application/vnd.google-earth.kml+xml");
			return kml(model, GPX.toGPX(manager.toStyledGeo(manager.fromDB())));
		default :
			model.addAttribute("preload", manager.toJSON(manager.fromDB()));
			return app(model, "/collabmap");
		}
	}
	
	@RequestMapping(value="/rest/map", method = RequestMethod.POST)
	public String restCreate(Model model, @RequestParam(value="state", required=false) String clientstate, HttpServletRequest request) {
		String error = adminController.createNewTenant(CollaborativeMap.class, request);
		if(error != null) return json(model, error);
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
		
		return json(model, map);
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
		
		if(clientstate != null && clientstate.length() > 0) {
			JSONObject json = (JSONObject) JSONSerializer.toJSON(clientstate);
			manager.toDB(manager.fromJSON(json));
		}
		
		return "redirect:/map?id=" + RuntimeProperties.getTenant();
	}
	
	@RequestMapping(value="/rest/map/", method = RequestMethod.GET)
	public String getMaps(Model model) {
		List<Tenant> tenants = new ArrayList<Tenant>();
		String user = RuntimeProperties.getUsername();
		UserAccount account = null;
		if(user != null) account = dao.getByPk(UserAccount.class, user);
		if(server.isHosted()) {
			if(account != null && account.getTenants() != null) {
				for(Tenant tenant : account.getTenants()) {
					if(Boolean.TRUE != tenant.isDetached()) tenants.add(tenant);
				}
			}
		} else {
			tenants = dao.getAllTenants();
		}
		return json(model, tenants);
	}
	
	@RequestMapping(value="/rest/map/{id}", method = RequestMethod.GET)
	public String restGet(Model model, @PathVariable("id") String id, HttpServletRequest request, HttpServletResponse response) {
		if(!(RuntimeProperties.getTenant() != null && RuntimeProperties.getTenant().equals(id))) {
			String error = adminController.setTenant(id, CollaborativeMap.class, request);
			if(error != null) return json(model, error);
		}

		return json(model, dao.getByAttr(CollaborativeMap.class, "name", RuntimeProperties.getTenant()));
	}
	
	@RequestMapping(value="/rest/since/{time}")
	public String getSince(Model model, @PathVariable("time") Long time) {
		return json(model, manager.toJSON(manager.fromDB(new Date(time))));
	}
	
	@RequestMapping(value="/rest/map/{id}", method = RequestMethod.DELETE)
	public String delete(Model model, HttpServletRequest request, @PathVariable("id") String id) {
		if(RuntimeProperties.getTenant() == null || !RuntimeProperties.getTenant().equals(id)) {
			String error = adminController.setTenant(id, CollaborativeMap.class, request);
			if(error != null) return json(model, error);
		}
		if(RuntimeProperties.getUserPermission() != Permission.ADMIN) {
			return json(model, "You do not have admin rights to this map");
		}
		
		if(!id.equals(RuntimeProperties.getTenant())) {
			return json(model, "You are not currently working on this map, concerned this may be an accidental deletion");
		}

		manager.removeAllFromDB();
		Tenant tenant = dao.getByAttr(Tenant.class, "name", RuntimeProperties.getTenant());
		if(tenant.getAccount() != null) {
			UserAccount account = tenant.getAccount();
			account.getTenants().remove(tenant);
			tenant.setAccount(null);
			dao.save(account);
		}
		dao.delete(tenant);
		RuntimeProperties.setTenant(null);
		request.getSession(true).removeAttribute("tenantid");

		return json(model, tenant);
	}
	
	@RequestMapping(value="/rest/map/{id}", method = RequestMethod.POST)
	public String updateAdmin(Model model, JSONForm params, HttpServletRequest request, @PathVariable("id") String id) {
		if(RuntimeProperties.getTenant() == null || !RuntimeProperties.getTenant().equals(id)) {
			String error = adminController.setTenant(id, CollaborativeMap.class, request);
			if(error != null) return json(model, error);
		}
		if(RuntimeProperties.getUserPermission() != Permission.ADMIN) {
			return json(model, "You do not have admin rights to this map");
		}
		
		if(!id.equals(RuntimeProperties.getTenant())) {
			return json(model, "You are not currently working on this map, concerned this may be an accidental update");
		}

		CollaborativeMap map = dao.getByAttr(CollaborativeMap.class, "name", RuntimeProperties.getTenant());
		JSONObject json = params.JSON();
		if(json.has("detach") && json.getBoolean("detach")) {
			map.setDetached(true);
			dao.save(map);
			return json(model, map);
		}
		Tenant updated = new CollaborativeMap(json);
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
			return gpx(model, GPX.toGPX(manager.toStyledGeo(manager.fromJSON(json))));
		case KML :
			response.setHeader("Content-Disposition", "attachment; filename=export.kml");
			response.setHeader("Content-Type", "application/vnd.google-earth.kml+xml");
			return kml(model, GPX.toGPX(manager.toStyledGeo(manager.fromJSON(json))));
		}
		return "";
	}
		
	@RequestMapping(value="/rest/in", method = RequestMethod.POST)
	public String upload(JSONForm params, Model model, HttpServletRequest request) {
		ClientState state = manager.fromStyledGeo(GPX.StyledGeo(context, params));

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
	
	@RequestMapping(value="/tools.html", method = RequestMethod.GET)
	public String showTools(Model model) {
		return app(model, "Pages.Tools");
	}
		
}
