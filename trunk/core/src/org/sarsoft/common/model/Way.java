package org.sarsoft.common.model;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.ListIterator;
import java.util.Map;

import javax.persistence.Entity;
import javax.persistence.Inheritance;
import javax.persistence.InheritanceType;
import javax.persistence.ManyToMany;
import javax.persistence.Transient;

import net.sf.json.JSONArray;
import net.sf.json.JSONObject;

import org.hibernate.annotations.Cascade;
import org.hibernate.annotations.IndexColumn;
import org.hibernate.annotations.LazyCollection;
import org.hibernate.annotations.LazyCollectionOption;
import org.sarsoft.common.json.JSONAnnotatedEntity;
import org.sarsoft.common.json.JSONSerializable;

@JSONAnnotatedEntity
@Entity
@Inheritance(strategy=InheritanceType.TABLE_PER_CLASS)
public class Way extends SarModelObject implements IPreSave {

	private String name;
	private boolean polygon;
	private WayType type = WayType.ROUTE;
	private List<Waypoint> waypoints;
	private Date updated;
	private Integer accuracy;

	@SuppressWarnings("rawtypes")
	public static Map<String, Class> classHints = new HashMap<String, Class>();

	static {
		@SuppressWarnings("rawtypes")
		Map<String, Class> m = new HashMap<String, Class>();
		m.put("waypoints", Waypoint.class);
		classHints = Collections.unmodifiableMap(m);
	}

	public static Way[] createFromJSON(JSONArray json) {
		return (Way[]) JSONArray.toArray(json, Way.class, classHints);
	}
	
	public Way() {	
	}
	
	public Way(JSONObject json) {
		from((Way) JSONObject.toBean(json, Way.class, classHints));
	}

	public void from(Way updated) {
		if(waypoints == null) waypoints = new ArrayList<Waypoint>();
		this.setPolygon(updated.isPolygon());
		this.setName(updated.getName());
		this.setType(updated.getType());
		this.setUpdated(updated.getUpdated());
		waypoints.removeAll(waypoints);
		if(updated.getWaypoints() != null) {
			for(Waypoint from : updated.getWaypoints()) {
				Waypoint wpt = new Waypoint();
				wpt.setLat(from.getLat());
				wpt.setLng(from.getLng());
				wpt.setTime(from.getTime());
				waypoints.add(wpt);
			}
		}
		this.setAccuracy(updated.getAccuracy());
	}

	@JSONSerializable
	@Transient
	public Long getId() {
		return getPk();
	}

	@JSONSerializable
	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public Date getUpdated() {
		return updated;
	}
	public void setUpdated(Date updated) {
		this.updated = updated;
	}
		
	@JSONSerializable
	public WayType getType() {
		return type;
	}

	public void setType(WayType type) {
		this.type = type;
	}

	@JSONSerializable
	public boolean isPolygon() {
		return polygon;
	}
	public void setPolygon(boolean polygon) {
		this.polygon = polygon;
	}
	
	public Integer getAccuracy() {
		return accuracy;
	}

	private void setAccuracy(Integer accuracy) {
		this.accuracy = accuracy;
	}

	@JSONSerializable
	@ManyToMany
	@IndexColumn(name="wpt_idx")
	@Cascade({org.hibernate.annotations.CascadeType.ALL,org.hibernate.annotations.CascadeType.DELETE_ORPHAN})
	@LazyCollection(LazyCollectionOption.FALSE)
	public List<Waypoint> getWaypoints() {
		if(waypoints == null) return null;
		if(accuracy == null && waypoints.size() > 500) filter(waypoints.size() > 2000 ? 10 : 5);
		return waypoints;
	}
	public void setWaypoints(List<Waypoint> waypoints) {
		this.waypoints = waypoints;
	}
	
	public void softCopy(List<Waypoint> waypoints) {
		if(this.waypoints == null) this.waypoints = new ArrayList<Waypoint>();
		while(this.waypoints.size() > waypoints.size()) {
			this.waypoints.remove(this.waypoints.size()-1);
		}
		for(int i = 0; i < waypoints.size(); i++) {
			Waypoint wpt = waypoints.get(i);
			if(this.waypoints.size()-1 < i) {
				this.waypoints.add(new Waypoint());
			}
			this.waypoints.get(i).setLat(wpt.getLat());
			this.waypoints.get(i).setLng(wpt.getLng());
		}
	}

	public void filter(int epsilon) {
		this.setAccuracy(epsilon);
		if(waypoints == null) return;	
		List<Waypoint> filtered = filter(waypoints, epsilon);
		waypoints.removeAll(waypoints);
		waypoints.addAll(filtered);
	}

	private static List<Waypoint> filter(List<Waypoint> points, double epsilon) {
		if(points.size() == 2) return points;
		double dmax = 0;
		int index = 0;
		for(int i = 1; i < points.size() - 1; i++) {
			double d = points.get(i).distanceToLine(points.get(0), points.get(points.size()-1));
			if(d > dmax) {
				index = i;
				dmax = d;
			}
		}
		
		List<Waypoint> results = new ArrayList<Waypoint>();
		if(dmax >= epsilon) {
			List<Waypoint> r1 = filter(points.subList(0, index+1), epsilon);
			List<Waypoint> r2 = filter(points.subList(index, points.size()), epsilon);
			results.addAll(r1.subList(0, r1.size()-1));
			results.addAll(r2);
		} else {
			results.add(points.get(0));
			results.add(points.get(points.size()-1));
		}
		return results;
	}
	
	public String toString() {
		String str = "Way " + id + "\n";
		for(Waypoint wpt : waypoints) {
			str += wpt.getId() + ": [" + wpt.getLat() + ", " + wpt.getLng() + "]\n";
		}
		return str;
	}

	public void preSave() {
		this.updated = new Date();
	}

	@Transient
	public double getArea() {
		if(polygon == false || waypoints.size() == 0) return 0;
		double area = 0;
		Waypoint origin = waypoints.get(0);
		for(int i = 0; i < waypoints.size()-1; i++) {
			double[] xy0 = waypoints.get(i).offsetFrom(origin);
			double[] xy1 = waypoints.get(i+1).offsetFrom(origin);
			area += xy0[0]*xy1[1] - xy1[0]*xy0[1];
		}
		area = area/1000000;
		area = Math.round(Math.abs(area / 2)*100);
		return area/100;
	}

	@Transient
	public double getDistance() {
		double distance = 0;
		if(waypoints.size() == 0) return 0;
		Waypoint wpt = waypoints.get(0);
		ListIterator<Waypoint> it = waypoints.listIterator();
		while(it.hasNext()) {
			Waypoint waypoint = it.next();
			distance += waypoint.distanceFrom(wpt);
			wpt = waypoint;
		}
		distance = distance/1000;
		distance = Math.round(distance*100);
		return distance/100;
	}
	
	@Transient
	public String getFormattedSize() {
		if(polygon) return getArea() + "km&sup2;";
		return getDistance() + "km";
	}

	@Transient
	@JSONSerializable
	public Waypoint[] getBoundingBox() {
		if(waypoints.size() == 0) return null;
		ListIterator<Waypoint> it = waypoints.listIterator();
		double minLat = waypoints.get(0).getLat();
		double minLng = waypoints.get(0).getLng();
		double maxLat = minLat;
		double maxLng = minLng;

		while(it.hasNext()) {
			Waypoint waypoint = it.next();
			minLat = Math.min(minLat, waypoint.getLat());
			maxLat = Math.max(maxLat, waypoint.getLat());
			minLng = Math.min(minLng, waypoint.getLng());
			maxLng = Math.max(maxLng, waypoint.getLng());
		}

		return new Waypoint[] { new Waypoint(minLat, minLng), new Waypoint(maxLat, maxLng) };
	}
	
}