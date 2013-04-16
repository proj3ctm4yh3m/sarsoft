package org.sarsoft.common.controller;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.servlet.ServletContext;

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
import org.springframework.stereotype.Component;
import org.springframework.ui.Model;

@Component
public class ServerInfo {

	@Autowired
	private ServletContext context;

	@Autowired
	@Qualifier("genericDAO")
	protected GenericHibernateDAO dao;
	
	@Value("${sarsoft.hosted}")
	String hosted;
	private Boolean inHostedMode = null;
	
	private Map<String, Object> common;
	private Map<String, Object> constants = new HashMap<String, Object>();

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
	
	public void addConstant(String key, Object value) {
		this.constants.put(key, value);
		if(common != null) common = null;
	}

	@SuppressWarnings({ "rawtypes", "unchecked" })
	private Map getAttrMap() {
		if(common == null) synchronized(this) {
			common = new HashMap<String, Object>();
			common.put("server", RuntimeProperties.getServerUrl());
			common.put("version", getProperty("sarsoft.version"));
			common.put("imgprefix", getProperty("sarsoft.images.url"));
			common.put("refresh_interval", Integer.parseInt(RuntimeProperties.getProperty("sarsoft.refresh.interval")));
			common.put("refresh_auto", Boolean.valueOf(RuntimeProperties.getProperty("sarsoft.refresh.auto")));
			common.put("garmin_hostname", "http://" + RuntimeProperties.getServerName());
			common.put("garmin_devicekey", this.getProperty("garmin.key." + RuntimeProperties.getServerName()));
			if(constants.size() > 0) common.put("constants", constants);
			
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

	public void prep(Model model) {
		model.addAttribute("hosted", isHosted());
		model.addAttribute("version", getProperty("sarsoft.version"));
		model.addAttribute("js_server", getProperty("sarsoft.js.server"));
		model.addAttribute("js_mapserver", getProperty("sarsoft.map.viewer"));
		model.addAttribute("js_sarsoft", JSONAnnotatedPropertyFilter.fromObject(getAttrMap()));
	}
	
}