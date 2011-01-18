package org.sarsoft.plans.model;

import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.ManyToOne;
import javax.persistence.OneToOne;

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
}
