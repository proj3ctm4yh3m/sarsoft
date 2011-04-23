package org.sarsoft.ops.model;

import javax.persistence.Entity;
import javax.persistence.Inheritance;
import javax.persistence.InheritanceType;
import javax.persistence.Transient;

import org.sarsoft.common.model.SarModelObject;
import org.sarsoft.common.model.Waypoint;

@Entity
public abstract class LocationEnabledDevice extends SarModelObject {

	protected String deviceId;
	protected String deviceKey;

	public String getDeviceId() {
		return deviceId;
	}
	public void setDeviceId(String deviceId) {
		this.deviceId = deviceId;
	}
	public String getDeviceKey() {
		return deviceKey;
	}
	public void setDeviceKey(String deviceKey) {
		this.deviceKey = deviceKey;
	}

	public abstract Waypoint checkLocation();

	@Transient
	public abstract String getDescription();

}
