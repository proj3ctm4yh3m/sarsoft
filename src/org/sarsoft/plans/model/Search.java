package org.sarsoft.plans.model;

import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.ManyToOne;
import javax.persistence.OneToOne;
import javax.persistence.Transient;

import org.hibernate.annotations.Cascade;
import org.sarsoft.common.model.JSONAnnotatedEntity;
import org.sarsoft.common.model.JSONSerializable;
import org.sarsoft.common.model.Waypoint;

@JSONAnnotatedEntity
@Entity
public class Search {

	private String name;
	private String mapConfig;
	private Waypoint plk;
	private String password;
	private String description;

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

	@ManyToOne
	@Cascade({org.hibernate.annotations.CascadeType.ALL})
	public Waypoint getPlk() {
		return plk;
	}

	public void setPlk(Waypoint plk) {
		this.plk = plk;
	}

	public void setPassword(String password) {
		this.password = password;
	}

	public String getPassword() {
		return password;
	}
	public void setDescription(String description) {
		this.description = description;
	}
	public String getDescription() {
		return description;
	}
	@Transient
	public String getPublicName() {
		if(description != null) return description;
		return name;
	}
}
