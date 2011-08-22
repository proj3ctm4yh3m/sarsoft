package org.sarsoft.plans.model;

import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.ManyToOne;
import javax.persistence.Transient;

import org.hibernate.annotations.Cascade;
import org.sarsoft.common.model.UserAccount;
import org.sarsoft.common.model.JSONAnnotatedEntity;
import org.sarsoft.common.model.JSONSerializable;
import org.sarsoft.common.model.Waypoint;

@JSONAnnotatedEntity
@Entity
public class Search {

	private String name;
	private String mapConfig;
	private Waypoint lkp;
	private Waypoint pls;
	private Waypoint cp;
	private boolean visible = false;
	private String password;
	private String description;
	private UserAccount account;
	private String datum;

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

	@ManyToOne()
	public UserAccount getAccount() {
		return account;
	}

	public void setAccount(UserAccount account) {
		this.account = account;
	}

	public boolean isVisible() {
		return visible;
	}

	public void setVisible(boolean visible) {
		this.visible = visible;
	}
	
	public String getDatum() {
		return datum;
	}
	
	public void setDatum(String datum) {
		this.datum = datum;
	}
}
