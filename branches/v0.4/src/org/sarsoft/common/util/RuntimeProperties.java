package org.sarsoft.common.util;

public class RuntimeProperties {

	private static ThreadLocal<String> tSearch = new ThreadLocal<String>();
	private static ThreadLocal<String> tUsername = new ThreadLocal<String>();
	private static ThreadLocal<String> tServerName = new ThreadLocal<String>();
	private static ThreadLocal<Integer> tServerPort = new ThreadLocal<Integer>();
	
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
		return tServerName.get();
	}
	
	public static void setServerPort(Integer serverport) {
		tServerPort.set(serverport);
	}

	public static Integer getServerPort() {
		return tServerPort.get();
	}
	
	public static String getServerUrl() {
		String url = "http://" + getServerName();
		if(getServerPort() != 80) url = url + ":8080";
		url = url + "/";
		return url;
	}

}
