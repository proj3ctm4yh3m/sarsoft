package org.sarsoft.common.util;

public class RuntimeProperties {

	private static ThreadLocal<String> tSearch = new ThreadLocal<String>();
	private static ThreadLocal<String> tUsername = new ThreadLocal<String>();

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

}
