package org.sarsoft.common.model;

import javax.persistence.Entity;
import javax.persistence.Id;

import org.sarsoft.plans.model.SearchAssignment;
import net.sf.json.JSONObject;

@JSONAnnotatedEntity
@Entity
public class Config {

	private String name;
	private String value;

	public static Config createFromJSON(JSONObject json) {
		return (Config) JSONObject.toBean(json, Config.class);
	}

	public Config() {
		super();
	}

	public Config(String name, String value) {
		super();
		setName(name);
		setValue(value);
	}

	@Id
	@JSONSerializable
	public String getName() {
		return name;
	}
	public void setName(String name) {
		this.name = name;
	}
	@JSONSerializable
	public String getValue() {
		return value;
	}
	public void setValue(String value) {
		this.value = value;
	}

}
