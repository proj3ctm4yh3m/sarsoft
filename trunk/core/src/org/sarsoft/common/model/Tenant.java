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
	private String mapConfig;
	private Boolean shared;
	private Long cfgUpdated;
	
	@SuppressWarnings("rawtypes")
	public static Map<String, Class> classHints = new HashMap<String, Class>();

	static {
		@SuppressWarnings("rawtypes")
		Map<String, Class> m = new HashMap<String, Class>();
		m.put("MapDatumWidget", HashMap.class);
		classHints = Collections.unmodifiableMap(m);
	}

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
	public String getComments() {
		return comments;
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

	public void setMapConfig(String mapConfig) {
		this.mapConfig = mapConfig;
	}

	@JSONSerializable
	@Lob
	public String getMapConfig() {
		return mapConfig;
	}
	
	public Permission getAllUserPermission() {
		return allUserPermission;
	}

	public void setAllUserPermission(Permission allUserPermission) {
		this.allUserPermission = allUserPermission;
	}

	public Permission getPasswordProtectedUserPermission() {
		return passwordProtectedUserPermission;
	}

	public void setPasswordProtectedUserPermission(Permission passwordProtectedUserPermission) {
		this.passwordProtectedUserPermission = passwordProtectedUserPermission;
	}
	
	public Boolean getShared() {
		return shared;
	}
	
	public void setShared(Boolean shared) {
		this.shared = shared;
	}
	
	public Long getCfgUpdated() {
		return cfgUpdated;
	}
	
	public void setCfgUpdated(Long updated) {
		this.cfgUpdated = updated;
	}

	@SuppressWarnings("rawtypes")
	@Transient
	public String getDatum() {
		try {
			JSON json = JSONSerializer.toJSON(mapConfig);
			if(json instanceof JSONObject) {
				Map m = (Map) JSONObject.toBean((JSONObject) json, HashMap.class, classHints);
				if(m != null && m.containsKey("MapDatumWidget")) {
					Map m2 = (Map) m.get("MapDatumWidget");
					if(m2 != null) return (String) m2.get("datum");
				}
			}
		} catch (Exception e) {
			// improperly formed mapConfig will generate a server-side exception that wipes out the JSP content
		}
		return null;
	}
	
}
