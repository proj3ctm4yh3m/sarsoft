package org.sarsoft.plans.model;

import javax.persistence.Entity;
import javax.persistence.Id;

import org.sarsoft.common.model.JSONAnnotatedEntity;
import org.sarsoft.common.model.JSONSerializable;

@JSONAnnotatedEntity
@Entity
public class Search {

	private String name;
	private String mapConfig;

	public void setName(String name) {
		this.name = name;
	}

	@Id
	public String getName() {
		return name;
	}

	public void setMapConfig(String mapConfig) {
		this.mapConfig = mapConfig;
	}

	@JSONSerializable
	public String getMapConfig() {
		return mapConfig;
	}
}
