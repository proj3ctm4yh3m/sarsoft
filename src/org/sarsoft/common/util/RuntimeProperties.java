package org.sarsoft.common.util;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Properties;

import javax.servlet.ServletContext;

import org.apache.log4j.Logger;
import org.apache.log4j.PropertyConfigurator;
import org.sarsoft.common.model.Tenant;

public class RuntimeProperties {

	private static ThreadLocal<String> tTenant = new ThreadLocal<String>();
	private static ThreadLocal<String> tUsername = new ThreadLocal<String>();
	private static ThreadLocal<Tenant.Permission> tPermission = new ThreadLocal<Tenant.Permission>();
	private static ThreadLocal<String> tServerName = new ThreadLocal<String>();
	private static ThreadLocal<Integer> tServerPort = new ThreadLocal<Integer>();
	private static Properties properties;
	
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
