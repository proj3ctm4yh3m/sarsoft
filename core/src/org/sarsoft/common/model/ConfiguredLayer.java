package org.sarsoft.common.model;

import javax.persistence.Entity;

import net.sf.json.JSONObject;

import org.sarsoft.common.model.JSONAnnotatedEntity;
import org.sarsoft.common.model.JSONSerializable;

@JSONAnnotatedEntity
@Entity
public class ConfiguredLayer extends MapObject {
	
	String name;
	String alias;

	public static ConfiguredLayer createFromJSON(JSONObject json) {
		return (ConfiguredLayer) JSONObject.toBean(json, ConfiguredLayer.class);
	}
	
	public void from(JSONObject json) {
		ConfiguredLayer updated = createFromJSON(json);
		from(updated);
	}
	
	public void from(ConfiguredLayer updated) {
		setName(updated.getName());
		setAlias(updated.getAlias());
	}

	@JSONSerializable
	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	@JSONSerializable
	public String getAlias() {
		return alias;
	}

	public void setAlias(String alias) {
		this.alias = alias;
	}
	
}
