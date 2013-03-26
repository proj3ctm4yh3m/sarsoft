package org.sarsoft.common.model;

import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import javax.persistence.Inheritance;
import javax.persistence.InheritanceType;

import org.hibernate.annotations.GenericGenerator;
import org.sarsoft.common.json.JSONSerializable;
import org.sarsoft.common.util.RuntimeProperties;

@Entity
@Inheritance(strategy = InheritanceType.TABLE_PER_CLASS)
public abstract class SarModelObject {

	protected Long id;
	private Long pk;
	private String tenant;

	public SarModelObject() {
		tenant = RuntimeProperties.getTenant();
	}

	@JSONSerializable
	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	@Id
	@GenericGenerator(name = "generator", strategy="increment")
	@GeneratedValue(generator="generator")
	public Long getPk() {
		return pk;
	}

	public void setPk(Long pk) {
		this.pk = pk;
	}

	public void setTenant(String tenant) {
		this.tenant = tenant;
	}

	public String getTenant() {
		return tenant;
	}
	
}
