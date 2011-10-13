package org.sarsoft.common.model;

import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.Inheritance;
import javax.persistence.InheritanceType;
import javax.persistence.ManyToOne;
import javax.persistence.Transient;

@JSONAnnotatedEntity
@Entity
@Inheritance(strategy = InheritanceType.TABLE_PER_CLASS)
public abstract class Tenant {

	private String name;
	private boolean visible = false;
	private String password;
	private String description;
	private UserAccount account;
	private String mapConfig;
	private String datum;

	public void setName(String name) {
		this.name = name;
	}

	@Id
	public String getName() {
		return name;
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

	public void setMapConfig(String mapConfig) {
		this.mapConfig = mapConfig;
	}

	@JSONSerializable
	public String getMapConfig() {
		return mapConfig;
	}

	public String getDatum() {
		return datum;
	}
	
	public void setDatum(String datum) {
		this.datum = datum;
	}
		
}
