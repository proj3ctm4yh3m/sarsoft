package org.sarsoft.imagery.model;

import javax.persistence.Entity;

import net.sf.json.JSONObject;

import org.sarsoft.admin.model.MapSource;
import org.sarsoft.common.model.JSONAnnotatedEntity;
import org.sarsoft.common.model.JSONSerializable;
import org.sarsoft.common.model.SarModelObject;

@JSONAnnotatedEntity
@Entity
public class GeoRefImage extends SarModelObject {
	
	String filename;
	double angle;
	double scale;
	int originx;
	int originy;
	double originlat;
	double originlng;
	int width;
	int height;
	
	public static GeoRefImage createFromJSON(JSONObject json) {
		return (GeoRefImage) JSONObject.toBean(json, GeoRefImage.class);
	}

	@JSONSerializable
	public String getFilename() {
		return filename;
	}
	public void setFilename(String filename) {
		this.filename = filename;
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
	
}
