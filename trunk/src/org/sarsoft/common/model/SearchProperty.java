package org.sarsoft.common.model;


import javax.persistence.Entity;
import javax.persistence.Id;

import org.sarsoft.common.model.JSONAnnotatedEntity;
import org.sarsoft.common.model.JSONSerializable;
import net.sf.json.JSONObject;

@JSONAnnotatedEntity
@Entity
public class SearchProperty extends SarModelObject {

	private String name;
	private String value;

	public static SearchProperty createFromJSON(JSONObject json) {
		return (SearchProperty) JSONObject.toBean(json, SearchProperty.class);
	}

	public SearchProperty() {
		super();
	}

	public SearchProperty(String name, String value) {
		super();
		setName(name);
		setValue(value);
	}

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
