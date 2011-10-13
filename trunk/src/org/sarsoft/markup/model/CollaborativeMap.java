package org.sarsoft.markup.model;

import javax.persistence.Entity;
import javax.persistence.ManyToOne;

import org.hibernate.annotations.Cascade;
import org.sarsoft.common.model.JSONAnnotatedEntity;
import org.sarsoft.common.model.Tenant;
import org.sarsoft.common.model.Waypoint;


@JSONAnnotatedEntity
@Entity
public class CollaborativeMap extends Tenant {

	private Waypoint defaultCenter;

	@ManyToOne
	@Cascade({org.hibernate.annotations.CascadeType.ALL,org.hibernate.annotations.CascadeType.DELETE_ORPHAN})
	public Waypoint getDefaultCenter() {
		return defaultCenter;
	}

	public void setDefaultCenter(Waypoint defaultCenter) {
		this.defaultCenter = defaultCenter;
	}
}
