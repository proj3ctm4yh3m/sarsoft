package org.sarsoft.common.controller;

import net.sf.json.JSONObject;
import net.sf.json.JSONSerializer;

public class JSONForm {

	private String json;
	private String file;

	public void setJson(String json) {
		this.json = json;
	}

	public String getJson() {
		return json;
	}

	public void setFile(String file) {
		this.file = file;
	}

	public String getFile() {
		return file;
	}

	public JSONObject JSON() {
		return (JSONObject)  JSONSerializer.toJSON(json);
	}

}
