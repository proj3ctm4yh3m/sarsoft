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

@JSONAnnotatedEntity
@Entity
@Inheritance(strategy=InheritanceType.TABLE_PER_CLASS)
public class Way extends SarModelObject implements IPreSave {

	private String name;
	private boolean polygon;
	private WayType type = WayType.ROUTE;
	private List<Waypoint> waypoints;
	private Date updated;
	private int precision = 100;

	@SuppressWarnings("rawtypes")
	public static Map<String, Class> classHints = new HashMap<String, Class>();

	static {
		@SuppressWarnings("rawtypes")
		Map<String, Class> m = new HashMap<String, Class>();
		m.put("waypoints", Waypoint.class);
		classHints = Collections.unmodifiableMap(m);
	}

	public static Way createFromJSON(JSONObject json) {
		return (Way) JSONObject.toBean(json, Way.class, classHints);
	}

	public static Way[] createFromJSON(JSONArray json) {
		return (Way[]) JSONArray.toArray(json, Way.class, classHints);
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

	@JSONSerializable
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

	@ManyToMany
	@IndexColumn(name="wpt_idx")
	@Cascade({org.hibernate.annotations.CascadeType.ALL,org.hibernate.annotations.CascadeType.DELETE_ORPHAN})
	@LazyCollection(LazyCollectionOption.FALSE)
	public List<Waypoint> getWaypoints() {
		return waypoints;
	}
	public void setWaypoints(List<Waypoint> waypoints) {
		this.waypoints = waypoints;
	}

	@Transient
	public void setPrecision(int precision) {
		this.precision = precision;
	}

	@JSONSerializable
	@Transient
	public List<Waypoint> getZoomAdjustedWaypoints() {
		if(type == WayType.ROUTE) return waypoints;
		List<Waypoint> list = new ArrayList<Waypoint>();
		for(Waypoint wpt : waypoints) {
			if(list.size() == 0) {
				list.add(wpt);
			} else {
				Waypoint lastwpt = list.get(list.size() - 1);
				if(wpt.distanceFrom(lastwpt) > precision) {
					list.add(wpt);
				}
			}
		}
		return list;
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