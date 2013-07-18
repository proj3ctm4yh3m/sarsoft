package org.sarsoft.common.model;

import javax.persistence.Entity;

import net.sf.json.JSONObject;

import org.sarsoft.common.json.JSONAnnotatedEntity;
import org.sarsoft.common.json.JSONSerializable;
import org.sarsoft.common.util.ImageMercator;

@JSONAnnotatedEntity
@Entity
public class GeoRef extends MapObject {
	
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

	public GeoRef(){
	}
	
	public GeoRef(JSONObject json) {
		from(json);
	}
	
	public void from(JSONObject json) {
		from((GeoRef) JSONObject.toBean(json, GeoRef.class));
	}
	
	public void from(GeoRef updated) {
		setName(updated.getName());
		setUrl(updated.getUrl());
		setX1(updated.getX1());
		setX2(updated.getX2());
		setY1(updated.getY1());
		setY2(updated.getY2());
		setLat1(updated.getLat1());
		setLat2(updated.getLat2());
		setLng1(updated.getLng1());
		setLng2(updated.getLng2());
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
	
	public double[] transform(int[] size, ImageMercator projection) {
		double dLat = this.lat2 - this.lat1;
		double dLng = this.lng2 - this.lng1;
		double dx = this.x2 - this.x1;
		double dy = this.y2 - this.y1;
		
		double lat1 = this.lat2*Math.PI/180;
		double lat2 = this.lat1*Math.PI/180;
		double dlng = (this.lng2-this.lng1)*Math.PI/180;

		double y = Math.sin(dlng) * Math.cos(lat2);
		double x = Math.cos(lat1)*Math.sin(lat2) -
		        Math.sin(lat1)*Math.cos(lat2)*Math.cos(dlng);
		double mapAngle = Math.atan2(y, -x)*180/Math.PI;
		
		double imageAngle = Math.atan(-dx / dy)*180/Math.PI;
		if(dy > 0 && dx < 0) imageAngle = imageAngle - 180;
		if(dy > 0 && dx > 0) imageAngle = imageAngle + 180;
		double angle = (mapAngle - imageAngle)*Math.PI/180;
		
		double x1 = this.x1 - size[0]/2;
		double y1 = -1*(this.y1 - size[1]/2);
		double x2 = this.x2 - size[0]/2;
		double y2 = -1*(this.y2 - size[1]/2);
		double xnw = -1*size[0]/2;
		double ynw = size[1]/2;
		
		double u1 = x1*Math.cos(angle) + y1*Math.sin(angle);
		double v1 = y1*Math.cos(angle) - x1*Math.sin(angle);
		double u2 = x2*Math.cos(angle) + y2*Math.sin(angle);
		double v2 = y2*Math.cos(angle) - x2*Math.sin(angle);
		double unw = xnw*Math.cos(angle) + ynw*Math.sin(angle);
		double vnw = ynw*Math.cos(angle) - xnw*Math.sin(angle);
		
		double dlngdu = dLng/(u2-u1);
		double dlatdv = dLat/(v2-v1);
		
		double[] center = new double[] { this.lat1 - dlatdv*v1, this.lng1 - dlngdu*u1 };
		
		int[] px_1 = projection.ll2pixel(this.lat1, this.lng1);
		int[] px_2 = projection.ll2pixel(this.lat2, this.lng2);
		
		double scale = Math.sqrt(Math.pow(px_2[0] - px_1[0], 2) + Math.pow(px_2[1] - px_1[1], 2)) / Math.sqrt(Math.pow(this.x2 - this.x1, 2) + Math.pow(this.y2 - this.y1, 2));
		
		int[] px_center = projection.ll2pixel(center[0], center[1]);
		int[] px_nw = new int[] { (int) Math.round(px_center[0] - (size[0]*scale)/2), (int) Math.round((projection.getHeight() - px_center[1]) - (size[1]*scale)/2) };

		return new double[] { angle, scale, px_nw[0], px_nw[1] };
	}
	
}
