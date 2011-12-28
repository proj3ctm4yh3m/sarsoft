package org.sarsoft.common.view;

public class Breadcrumb {

	private String url;
	private String label;

	public Breadcrumb(String url, String label) {
		this.url = url;
		this.label = label;
	}

	public String getUrl() {
		return url;
	}

	public String getLabel() {
		return label;
	}

}
