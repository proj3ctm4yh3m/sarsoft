package org.sarsoft.common.util;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Properties;

import javax.servlet.ServletContext;

import net.sf.ehcache.Cache;
import net.sf.ehcache.CacheManager;
import net.sf.ehcache.config.CacheConfiguration;

import org.apache.log4j.Logger;
import org.apache.log4j.PropertyConfigurator;
import org.sarsoft.common.controller.JSONBaseController;
import org.sarsoft.common.model.MapSource;
import org.sarsoft.common.model.Tenant;

public class RuntimeProperties {

	private static ThreadLocal<String> tTenant = new ThreadLocal<String>();
	private static ThreadLocal<String> tUsername = new ThreadLocal<String>();
	private static ThreadLocal<Tenant.Permission> tPermission = new ThreadLocal<Tenant.Permission>();
	private static ThreadLocal<String> tServerName = new ThreadLocal<String>();
	private static ThreadLocal<Integer> tServerPort = new ThreadLocal<Integer>();
	private static Properties properties;

	private static List<MapSource> mapSources;
	private static List<String> visibleMapSources;
	private static Map<String, MapSource> mapSourcesByName;
	private static Map<String, MapSource> mapSourcesByAlias;

	private static Logger logger = Logger.getLogger(RuntimeProperties.class);

	public static List<String> getVisibleMapSources() {
		if(visibleMapSources != null) return visibleMapSources;
		synchronized(RuntimeProperties.class) {
			visibleMapSources = new ArrayList<String>();
			String defaults = getProperty("sarsoft.map.backgrounds.default");
			if(defaults == null || defaults.length() == 0) defaults = getProperty("sarsoft.map.backgrounds");
			for(String source : defaults.split(",")) {
				visibleMapSources.add(source);
			}
		}
		return visibleMapSources;
	}
	
	public static MapSource getMapSourceByName(String name) {
		if(mapSourcesByName == null) getMapSources();
		return mapSourcesByName.get(name);
	}
	
	public static MapSource getMapSourceByAlias(String alias) {
		if(mapSourcesByAlias == null) getMapSources();
		return mapSourcesByAlias.get(alias);
	}
	
	public static List<MapSource> getMapSources() {
		if(mapSources != null) return mapSources;
		synchronized(RuntimeProperties.class) {
			if(mapSources != null) return mapSources;
			mapSources = new ArrayList<MapSource>();
			String[] names = getProperty("sarsoft.map.backgrounds").split(",");
			for(String name : names) {
				try {
					MapSource source = new MapSource();
					source.setName(getProperty("sarsoft.map.background." + name + ".name"));
					source.setTemplate(getProperty("sarsoft.map.background." + name + ".template"));
					source.setType(MapSource.Type.valueOf(getProperty("sarsoft.map.background." + name + ".type")));
					String alias = getProperty("sarsoft.map.background." + name + ".alias");
					if(alias == null) alias = name;
					source.setAlias(alias);
					source.setDescription(getProperty("sarsoft.map.background." + name + ".description"));
					if(source.getType() != MapSource.Type.NATIVE) {
						source.setCopyright(getProperty("sarsoft.map.background." + name + ".copyright"));
						source.setMaxresolution(Integer.parseInt(getProperty("sarsoft.map.background." + name + ".maxresolution")));
						source.setMinresolution(Integer.parseInt(getProperty("sarsoft.map.background." + name + ".minresolution")));
						source.setPng(Boolean.valueOf(getProperty("sarsoft.map.background." + name + ".png")));
						source.setAlphaOverlay(Boolean.valueOf(getProperty("sarsoft.map.background." + name + ".alphaOverlay")));
						source.setData(Boolean.valueOf(getProperty("sarsoft.map.background." + name + ".data")));
						source.setInfo(getProperty("sarsoft.map.background." + name + ".info"));
						if(source.isAlphaOverlay()) {
							int opacity = 100;
							String opacitystr = getProperty("sarsoft.map.background." + name + ".opacity");
							if(opacitystr != null) opacity = Integer.parseInt(opacitystr);
							source.setOpacity(opacity);
						}
					}
					String datestr = getProperty("sarsoft.map.background." + name + ".date");
					int date = 0;
					if(datestr != null) date = Integer.parseInt(datestr);
					source.setDate(date);
					mapSources.add(source);
				} catch (Exception e) {
					logger.error("Error with map layer " + name, e);
				}
			}
			mapSources = Collections.unmodifiableList(mapSources);
			mapSourcesByName = new HashMap<String, MapSource>();
			mapSourcesByAlias = new HashMap<String, MapSource>();
			for(MapSource source : mapSources) {
				mapSourcesByName.put(source.getName(), source);
				mapSourcesByAlias.put(source.getAlias(), source);
			}
		}
		return mapSources;
	}

	
	public static boolean isInitialized() {
		return (properties != null);
	}

	public static String getProperty(String name) {
		if(System.getProperty(name) != null) return System.getProperty(name);
		return properties.getProperty(name);
	}

	public static void initialize(ServletContext context) {
		synchronized(RuntimeProperties.class) {
			if(properties != null) return;
			properties = new Properties();
			String prop = System.getProperty("config");
			if(prop == null) prop ="local";
			String propertiesFileName = "/WEB-INF/" + prop + ".spring-config.properties";
			String sarsoftPropertyName = "sarsoft.properties";
			if(System.getProperty("sarsoft.properties") != null) sarsoftPropertyName = System.getProperty("sarsoft.properties");
			try {
				InputStream baseStream = context.getResourceAsStream("/WEB-INF/base.spring-config.properties");
				properties.load(baseStream);
				baseStream.close();
				InputStream inputStream = context.getResourceAsStream(propertiesFileName);
				properties.load(inputStream);
				inputStream.close();
				if(new File(sarsoftPropertyName).exists()) {
					FileInputStream fis = new FileInputStream(sarsoftPropertyName);
					properties.load(fis);
					fis.close();
				}
				PropertyConfigurator.configure(properties);
			} catch (IOException e) {
				Logger.getLogger(RuntimeProperties.class).error("IOException encountered reading from " + propertiesFileName + " or " + sarsoftPropertyName, e);
			}
			
			CacheManager manager = CacheManager.getInstance();
			CacheConfiguration image = manager.getCache("image").getCacheConfiguration();
			image.setMaxBytesLocalHeap(properties.getProperty("cache.image.maxBytesLocalHeap"));
			image.setMaxBytesLocalDisk(properties.getProperty("cache.image.maxBytesLocalDisk"));
			image.setTimeToIdleSeconds(Long.parseLong(properties.getProperty("cache.image.timeToIdleSeconds")));
			image.setTimeToLiveSeconds(Long.parseLong(properties.getProperty("cache.image.timeToLiveSeconds")));
			CacheConfiguration dem = manager.getCache("dem").getCacheConfiguration();
			dem.setMaxBytesLocalHeap(properties.getProperty("cache.dem.maxBytesLocalHeap"));
			dem.setMaxBytesLocalDisk(properties.getProperty("cache.dem.maxBytesLocalDisk"));
			dem.setTimeToIdleSeconds(Long.parseLong(properties.getProperty("cache.dem.timeToIdleSeconds")));
			dem.setTimeToLiveSeconds(Long.parseLong(properties.getProperty("cache.dem.timeToLiveSeconds")));
		}
	}
	
	public static void setTenant(String tenant) {
		tTenant.set(tenant);
	}

	public static String getTenant() {
		return tTenant.get();
	}

	public static void setUsername(String username) {
		tUsername.set(username);
	}

	public static String getUsername() {
		return tUsername.get();
	}
	
	public static void setUserPermission(Tenant.Permission permission) {
		tPermission.set(permission);
	}

	public static Tenant.Permission getUserPermission() {
		return tPermission.get();
	}

	public static void setServerName(String servername) {
		tServerName.set(servername);
	}

	public static String getServerName() {
		if(properties.getProperty("server.name") != null) return properties.getProperty("server.name");
		return tServerName.get();
	}
	
	public static void setServerPort(Integer serverport) {
		tServerPort.set(serverport);
	}

	public static Integer getServerPort() {
		if(properties.getProperty("server.port") != null) return Integer.parseInt(properties.getProperty("server.port"));
		return tServerPort.get();
	}
	
	public static String getServerUrl() {
		String url = "http://" + getServerName();
		if(getServerPort() != 80) url = url + ":" + getServerPort();
		url = url + "/";
		return url;
	}

}
