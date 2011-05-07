package org.sarsoft.common.util;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Properties;

import javax.servlet.ServletContext;

public class RuntimeProperties {

	private static ThreadLocal<String> tSearch = new ThreadLocal<String>();
	private static ThreadLocal<String> tUsername = new ThreadLocal<String>();
	private static ThreadLocal<String> tServerName = new ThreadLocal<String>();
	private static ThreadLocal<Integer> tServerPort = new ThreadLocal<Integer>();
	private static Properties properties;
	
	public static boolean isInitialized() {
		return (properties != null);
	}
	
	public static void initialize(ServletContext context) {
		synchronized(RuntimeProperties.class) {
			if(properties != null) return;
			properties = new Properties();
			try {
				String prop = System.getProperty("config");
				if(prop == null) prop ="local";
				String propertiesFileName = "/WEB-INF/" + prop + ".spring-config.properties";
				InputStream inputStream = context.getResourceAsStream(propertiesFileName);
				properties.load(inputStream);
				if(new File("sarsoft.properties").exists()) {
					FileInputStream fis = new FileInputStream("sarsoft.properties");
					properties.load(fis);
				}
			} catch (IOException e) {
				e.printStackTrace();
			}
		}
	}
	
	private static Boolean hosted = null;

	public static void setSearch(String search) {
		tSearch.set(search);
	}

	public static String getSearch() {
		return tSearch.get();
	}

	public static void setUsername(String username) {
		tUsername.set(username);
	}

	public static String getUsername() {
		return tUsername.get();
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
