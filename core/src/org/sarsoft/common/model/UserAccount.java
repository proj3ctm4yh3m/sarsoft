package org.sarsoft.common.model;

import java.util.Set;

import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.OneToMany;
import javax.persistence.Transient;

import org.hibernate.annotations.Cascade;
import org.sarsoft.common.json.JSONAnnotatedEntity;
import org.sarsoft.common.json.JSONSerializable;
import org.sarsoft.common.util.RuntimeProperties;

@Entity
@JSONAnnotatedEntity
public class UserAccount {

	private String name;
	private String email;
	private String alias;
	private Set<Tenant> tenants;
	private Boolean admin;

	@Id
	public String getName() {
		return name;
	}
	public void setName(String name) {
		this.name = name;
	}

	@OneToMany(mappedBy="account")
	@Cascade({org.hibernate.annotations.CascadeType.SAVE_UPDATE})
	public Set<Tenant> getTenants() {
		return tenants;
	}
	public void setTenants(Set<Tenant> tenants) {
		this.tenants = tenants;
	}
	@JSONSerializable
	public String getEmail() {
		return email;
	}
	public void setEmail(String email) {
		this.email = email;
	}
	@JSONSerializable
	public String getAlias() {
		return alias;
	}
	public void setAlias(String alias) {
		this.alias = alias;
	}
	public Boolean getAdmin() {
		return admin;
	}
	
	public void setAdmin(Boolean admin) {
		this.admin = admin;
	}
	
	@Transient
	@JSONSerializable
	public String getHandle() {
		if(alias != null) return alias;
		String handle = email;
		if(handle != null) handle = handle.substring(0,Math.min(3, handle.length())) + handle.replaceAll(".*?@", "...@").replaceAll("(.com|.org|.net)", "");
		return handle;
	}

}
