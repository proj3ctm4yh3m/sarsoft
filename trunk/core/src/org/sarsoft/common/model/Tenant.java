package org.sarsoft.common.model;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.Inheritance;
import javax.persistence.InheritanceType;
import javax.persistence.Lob;
import javax.persistence.ManyToOne;
import javax.persistence.Transient;

import org.sarsoft.common.json.JSONAnnotatedEntity;
import org.sarsoft.common.json.JSONSerializable;
import org.sarsoft.markup.model.Shape;

import net.sf.json.JSON;
import net.sf.json.JSONObject;
import net.sf.json.JSONSerializer;

@JSONAnnotatedEntity
@Entity
@Inheritance(strategy = InheritanceType.TABLE_PER_CLASS)
public abstract class Tenant {
	
	public enum Permission {
		NONE,READ,WRITE,ADMIN
	}

	private String name;
	private Permission allUserPermission;
	private Permission passwordProtectedUserPermission;
	private String password;
	private String description;
	private String comments;
	private String layers;
	private UserAccount account;
	private Boolean detached;
	private String mapConfig;
	private Boolean shared;
	private Long cfgUpdated;
	
	@SuppressWarnings("rawtypes")
	public static Map<String, Class> classHints = new HashMap<String, Class>();

	static {
		@SuppressWarnings("rawtypes")
		Map<String, Class> m = new HashMap<String, Class>();
		m.put("MapDatumWidget", HashMap.class);
		m.put("allUserPermission", Permission.class);
		m.put("passwordProtectedUserPermission", Permission.class);
		classHints = Collections.unmodifiableMap(m);
	}
	
	public Tenant() {
	}
	
	public Tenant(JSONObject json) {
		from(json);
	}
	
	public void from(JSONObject json) {
		from((Tenant) JSONObject.toBean(json, Tenant.class, classHints));
	}
	
	public void from(Tenant updated) {
		setName(updated.getName());
		setAllUserPermission(updated.getAllUserPermission());
		setPasswordProtectedUserPermission(updated.getPasswordProtectedUserPermission());
		setPassword(updated.getPassword());
		setDescription(updated.getDescription());
		setComments(updated.getComments());
		setLayers(updated.getLayers());
		setMapConfig(updated.getMapConfig());
		setShared(updated.getShared());
	}

	public void setName(String name) {
		this.name = name;
	}

	@Id
	@JSONSerializable
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
	@JSONSerializable
	public String getDescription() {
		return description;
	}
	public void setComments(String comments) {
		this.comments = comments;
	}
	public String getLayers() {
		return layers;
	}
	public void setLayers(String layers) {
		this.layers = layers;
	}
	@Lob
	@JSONSerializable
	public String getComments() {
		return comments;
	}
	@Transient
	@JSONSerializable
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
	
	public Boolean isDetached() {
		return detached;
	}
	
	public void setDetached(Boolean detached) {
		this.detached = detached;
	}
	
	public void setMapConfig(String mapConfig) {
		this.mapConfig = mapConfig;
	}

	@Lob
	public String getMapConfig() {
		return mapConfig;
	}
	
	@JSONSerializable
	public Permission getAllUserPermission() {
		return allUserPermission;
	}

	public void setAllUserPermission(Permission allUserPermission) {
		this.allUserPermission = allUserPermission;
	}

	@JSONSerializable
	public Permission getPasswordProtectedUserPermission() {
		return passwordProtectedUserPermission;
	}

	public void setPasswordProtectedUserPermission(Permission passwordProtectedUserPermission) {
		this.passwordProtectedUserPermission = passwordProtectedUserPermission;
	}
	
	@JSONSerializable
	public Boolean getShared() {
		return shared;
	}
	
	public void setShared(Boolean shared) {
		this.shared = shared;
	}
	
	@JSONSerializable
	public Long getCfgUpdated() {
		return cfgUpdated;
	}
	
	public void setCfgUpdated(Long updated) {
		this.cfgUpdated = updated;
	}

}
