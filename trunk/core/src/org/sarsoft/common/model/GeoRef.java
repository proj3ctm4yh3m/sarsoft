package org.sarsoft.common.model;

import javax.persistence.Entity;

import net.sf.json.JSONObject;

import org.sarsoft.common.model.JSONAnnotatedEntity;
import org.sarsoft.common.model.JSONSerializable;
import org.sarsoft.common.model.SarModelObject;

@JSONAnnotatedEntity
@Entity
public class GeoRef extends SarModelObject {
	
	String name;
	String url;
	double x1;
	double y1;
	double x2;
	double y2;
	double lat1;
	double lng1;
	double lat2;
	double lng2;

	public static GeoRef createFromJSON(JSONObject json) {
		return (GeoRef) JSONObject.toBean(json, GeoRef.class);
	}

	@JSONSerializable
	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	@JSONSerializable
	public String getUrl() {
		return url;
	}

	public void setUrl(String url) {
		this.url = url;
	}

	@JSONSerializable
	public double getX1() {
		return x1;
	}

	public void setX1(double x1) {
		this.x1 = x1;
	}

	@JSONSerializable
	public double getY1() {
		return y1;
	}

	public void setY1(double y1) {
		this.y1 = y1;
	}

	@JSONSerializable
	public double getX2() {
		return x2;
	}

	public void setX2(double x2) {
		this.x2 = x2;
	}

	@JSONSerializable
	public double getY2() {
		return y2;
	}

	public void setY2(double y2) {
		this.y2 = y2;
	}

	@JSONSerializable
	public double getLat1() {
		return lat1;
	}

	public void setLat1(double lat1) {
		this.lat1 = lat1;
	}

	@JSONSerializable
	public double getLng1() {
		return lng1;
	}

	public void setLng1(double lng1) {
		this.lng1 = lng1;
	}

	@JSONSerializable
	public double getLat2() {
		return lat2;
	}

	public void setLat2(double lat2) {
		this.lat2 = lat2;
	}

	@JSONSerializable
	public double getLng2() {
		return lng2;
	}

	public void setLng2(double lng2) {
		this.lng2 = lng2;
	}
	
}
