package org.sarsoft.imagery.model;

import javax.persistence.Entity;
import javax.persistence.Transient;

import net.sf.json.JSONObject;

import org.sarsoft.common.model.JSONAnnotatedEntity;
import org.sarsoft.common.model.JSONSerializable;
import org.sarsoft.common.model.SarModelObject;

@JSONAnnotatedEntity
@Entity
public class GeoRefImage extends SarModelObject {
	
	String name;
	double angle;
	double scale;
	int originx;
	int originy;
	double originlat;
	double originlng;
	int width;
	int height;
	boolean referenced;
	
	public static GeoRefImage createFromJSON(JSONObject json) {
		return (GeoRefImage) JSONObject.toBean(json, GeoRefImage.class);
	}

	@JSONSerializable
	public String getName() {
		return name;
	}
	public void setName(String name) {
		this.name = name;
	}
	@JSONSerializable
	public Double getAngle() {
		return angle;
	}
	public void setAngle(Double angle) {
		this.angle = angle;
	}
	@JSONSerializable
	public Double getScale() {
		return scale;
	}
	public void setScale(Double scale) {
		this.scale = scale;
	}
	@JSONSerializable
	public Integer getOriginx() {
		return originx;
	}
	public void setOriginx(Integer originx) {
		this.originx = originx;
	}
	@JSONSerializable
	public Integer getOriginy() {
		return originy;
	}
	public void setOriginy(Integer originy) {
		this.originy = originy;
	}
	@JSONSerializable
	public Double getOriginlat() {
		return originlat;
	}
	public void setOriginlat(Double originlat) {
		this.originlat = originlat;
	}
	@JSONSerializable
	public Double getOriginlng() {
		return originlng;
	}
	public void setOriginlng(Double originlng) {
		this.originlng = originlng;
	}
	@JSONSerializable
	public Integer getWidth() {
		return width;
	}
	public void setWidth(Integer width) {
		this.width = width;
	}
	@JSONSerializable
	public Integer getHeight() {
		return height;
	}
	public void setHeight(Integer height) {
		this.height = height;
	}
	@JSONSerializable
	public Boolean isReferenced() {
		return referenced;
	}
	// JSTL seems to have a problem with isReferenced.  Not sure why.
	@Transient
	public boolean isRefd() {
		return referenced;
	}
	public void setReferenced(Boolean referenced) {
		this.referenced = referenced;
	}
	
}
