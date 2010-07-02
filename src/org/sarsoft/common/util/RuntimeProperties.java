package org.sarsoft.common.util;

public class RuntimeProperties {

	private static ThreadLocal<String> tSearch = new ThreadLocal<String>();

	public static void setSearch(String search) {
		tSearch.set(search);
	}

	public static String getSearch() {
		return tSearch.get();
	}

}
