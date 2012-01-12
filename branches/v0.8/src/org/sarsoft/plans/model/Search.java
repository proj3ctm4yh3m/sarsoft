package org.sarsoft.plans.model;

import javax.persistence.Entity;
import javax.persistence.ManyToOne;

import org.hibernate.annotations.Cascade;
import org.sarsoft.common.model.Tenant;
import org.sarsoft.common.model.JSONAnnotatedEntity;
import org.sarsoft.common.model.JSONSerializable;
import org.sarsoft.common.model.Waypoint;

@JSONAnnotatedEntity
@Entity
public class Search extends Tenant {

	private Waypoint lkp;
	private Waypoint pls;
	private Waypoint cp;

	@ManyToOne
	@Cascade({org.hibernate.annotations.CascadeType.ALL,org.hibernate.annotations.CascadeType.DELETE_ORPHAN})
	public Waypoint getLkp() {
		return lkp;
	}

	public void setLkp(Waypoint lkp) {
		this.lkp = lkp;
	}

	@ManyToOne
	@Cascade({org.hibernate.annotations.CascadeType.ALL,org.hibernate.annotations.CascadeType.DELETE_ORPHAN})
	public Waypoint getPls() {
		return pls;
	}

	public void setPls(Waypoint pls) {
		this.pls = pls;
	}

	@ManyToOne
	@Cascade({org.hibernate.annotations.CascadeType.ALL,org.hibernate.annotations.CascadeType.DELETE_ORPHAN})
	public Waypoint getCP() {
		return cp;
	}

	public void setCP(Waypoint cp) {
		this.cp = cp;
	}
	
}
