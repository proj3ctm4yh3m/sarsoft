package org.sarsoft.common.controller;

import java.io.StringReader;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import javax.servlet.ServletContext;
import javax.servlet.http.HttpServletResponse;

import net.sf.json.JSON;
import net.sf.json.xml.XMLSerializer;

import org.sarsoft.common.dao.GenericHibernateDAO;
import org.sarsoft.common.json.JSONAnnotatedPropertyFilter;
import org.sarsoft.common.model.Icon;
import org.sarsoft.common.model.MapSource;
import org.sarsoft.common.model.Tenant;
import org.sarsoft.common.model.UserAccount;
import org.sarsoft.common.util.RuntimeProperties;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.ui.Model;

public abstract class JSONBaseController {

	protected static String REST = "rest";
	protected static String APP = "app";
	
	@Autowired
	protected ServletContext context;

	@Autowired
	@Qualifier("genericDAO")
	protected GenericHibernateDAO dao;

	@Value("${sarsoft.hosted}")
	String hosted;
	private Boolean inHostedMode = null;
	
	@Value("${sarsoft.map.viewer}")
	String mapViewer = "google";
	
	Map<String, Object> common;
	
	protected boolean isHosted() {
		if(inHostedMode == null) {
			inHostedMode = "true".equalsIgnoreCase(hosted);
		}
		return inHostedMode;
	}
	
	protected String getProperty(String name) {
		if(!RuntimeProperties.isInitialized()) RuntimeProperties.initialize(context);
		return RuntimeProperties.getProperty(name);
	}
	

	@SuppressWarnings({ "rawtypes", "unchecked" })
	protected Map getAttrMap() {
		if(common == null) synchronized(this) {
			common = new HashMap<String, Object>();
			common.put("server", RuntimeProperties.getServerUrl());
			common.put("version", getProperty("sarsoft.version"));
			common.put("imgprefix", getProperty("sarsoft.images.url"));
			common.put("refresh_interval", Integer.parseInt(RuntimeProperties.getProperty("sarsoft.refresh.interval")));
			common.put("refresh_auto", Boolean.valueOf(RuntimeProperties.getProperty("sarsoft.refresh.auto")));
			common.put("garmin_hostname", "http://" + RuntimeProperties.getServerName());
			common.put("garmin_devicekey", this.getProperty("garmin.key." + RuntimeProperties.getServerName()));
			
			Map map = new HashMap();
			common.put("map", map);
			map.put("default_lat", Double.parseDouble(getProperty("sarsoft.map.default.lat")));
			map.put("default_lng", Double.parseDouble(getProperty("sarsoft.map.default.lng")));
			map.put("default_zoom", Integer.parseInt(getProperty("sarsoft.map.default.zoom")));
			map.put("layers_grouping", getProperty("sarsoft.map.backgrounds.grouping"));
			map.put("layers_sample", getProperty("sarsoft.map.samples"));

			List<MapSource> availableLayers = new ArrayList<MapSource>();
			for(MapSource source : RuntimeProperties.getMapSources()) {
				if(!source.isData()) availableLayers.add(source);
			}
			map.put("layers", availableLayers);

			map.put("layers_visible", RuntimeProperties.getVisibleMapSources());
			map.put("datum", "WGS84");
			map.put("icons", Icon.byname);
		}
		
		Map<String, Object> m = new HashMap<String, Object>();
		m.putAll(common);

		if(RuntimeProperties.getTenant() != null) m.put("tenant", dao.getByAttr(Tenant.class, "name", RuntimeProperties.getTenant()));
		if(RuntimeProperties.getUsername() != null) m.put("account", dao.getByPk(UserAccount.class, RuntimeProperties.getUsername()));
		m.put("permission", RuntimeProperties.getUserPermission());
		
		return m;
	}
	
	private void prep(Model model) {
		model.addAttribute("hosted", isHosted());
		model.addAttribute("version", getProperty("sarsoft.version"));
		model.addAttribute("js_server", getProperty("sarsoft.js.server"));
		model.addAttribute("js_mapserver", getProperty("sarsoft.map.viewer"));
		model.addAttribute("js_sarsoft", JSONAnnotatedPropertyFilter.fromObject(getAttrMap()));
	}
	
	protected String error(Model model, String error) {
		model.addAttribute("message", error);
		return "error";
	}
	
	protected String bounce(Model model, String error, String dest) {
		model.addAttribute("message", error);
		model.addAttribute("targetDest", dest);

		prep(model);
		return "Pages.Password";
	}
	
	protected String app(Model model, String view) {
		if(RuntimeProperties.getTenant() != null) model.addAttribute("tenant", dao.getByAttr(Tenant.class, "name", RuntimeProperties.getTenant()));

		prep(model);
		return view;
	}
	
	@SuppressWarnings("rawtypes")
	protected JSON toJSON(Object obj) {
		if(obj instanceof List) {
			return JSONAnnotatedPropertyFilter.fromArray((List) obj);
		} else if(obj instanceof Set) {
			return JSONAnnotatedPropertyFilter.fromArray(obj);
		} else if(obj.getClass().isArray()) {
			return JSONAnnotatedPropertyFilter.fromArray(obj);
		} else {
			return JSONAnnotatedPropertyFilter.fromObject(obj);
		}		
	}
	
	protected String jsonframe(Model model, Object obj) {
		if(obj != null) model.addAttribute("json", toJSON(obj));
		return "/jsonframe";
	}

	protected String json(Model model, Object obj) {
		if(obj != null) model.addAttribute("json", toJSON(obj));
		return "/json";
	}
	
	@SuppressWarnings({"unchecked","rawtypes"})
	protected String json(Model model, String error) {
		Map m = new HashMap();
		m.put("error", error);
		return json(model, m);
	}

	private void prepXML(Model model, Object obj) {
		String xml = new XMLSerializer().write(toJSON(obj));
		xml = xml.replaceFirst("<o>", "<o xmlns=\"json\">");
		xml = xml.replaceFirst("<a>", "<a xmlns=\"json\">");
		model.addAttribute("xml", new StringReader(xml));
	}
	
	protected String gpx(Model model, Object obj) {
		prepXML(model, obj);
		return "/xsl/gpx/togpx";
	}

	protected String kml(Model model, Object obj) {
		prepXML(model, obj);
		return "/xsl/kml/tokml";
	}
	
	protected String csv(Model model, List<String[]> items, HttpServletResponse response) {
		StringBuilder sb = new StringBuilder();
		for(int i = 0; i < items.size(); i++) {
			if(i > 0) sb.append("\n");
			String[] row = items.get(i);
			for(int j = 0; j < row.length; j++) {
				if(j > 0) sb.append(",");
				sb.append(row[j]);
			}
		}
		response.setHeader("Content-Disposition", "attachment; filename=export.csv");
		model.addAttribute("echo", sb.toString());
		return "/echo";
	}

}
