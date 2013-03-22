package org.sarsoft.common.model;

import javax.persistence.Entity;

import net.sf.json.JSONObject;

import org.sarsoft.common.model.JSONAnnotatedEntity;
import org.sarsoft.common.model.JSONSerializable;
import org.sarsoft.common.model.SarModelObject;

@JSONAnnotatedEntity
@Entity
public class ConfiguredLayer extends SarModelObject {
	
	String name;
	String alias;

	public static ConfiguredLayer createFromJSON(JSONObject json) {
		return (ConfiguredLayer) JSONObject.toBean(json, ConfiguredLayer.class);
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
