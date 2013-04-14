package org.sarsoft.plans.model;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

import javax.persistence.Entity;
import javax.persistence.ManyToOne;

import net.sf.json.JSONObject;

import org.hibernate.annotations.Cascade;
import org.sarsoft.common.Pair;
import org.sarsoft.common.gpx.StyledGeoObject;
import org.sarsoft.common.gpx.StyledWay;
import org.sarsoft.common.json.JSONAnnotatedEntity;
import org.sarsoft.common.json.JSONSerializable;
import org.sarsoft.common.model.Way;
import org.sarsoft.common.model.WayType;

@JSONAnnotatedEntity
@Entity
public class FieldTrack extends AssignmentChildObject {

	private String label;
	private Way way;

	@SuppressWarnings("rawtypes")
	public static Map<String, Class> classHints = new HashMap<String, Class>();
	
	static {
		@SuppressWarnings("rawtypes")
		Map<String, Class> m = new HashMap<String, Class>();
		m.putAll(Way.classHints);
		m.put("way", Way.class);
		classHints = Collections.unmodifiableMap(m);
	}

	public FieldTrack() {
	}
	
	public FieldTrack(JSONObject json) {
		from(json);
	}
	
	public void from(JSONObject json) {
		this.from((FieldTrack) JSONObject.toBean(json, FieldTrack.class, classHints));
	}

	public void from(FieldTrack updated) {
		if(updated.getWay() == null || updated.getLabel() != null) {
			setAssignmentId(updated.getAssignmentId());
			setLabel(updated.getLabel());
		}
		if(updated.getWay() != null) {
			if(way == null) way = new Way();
			way.from(updated.getWay());
		}
	}

	public static Pair<Integer, FieldTrack> from(StyledWay sway) {
		if(sway.getWay() == null || sway.getWay().getType() != WayType.TRACK) return null;
		
		int confidence = 1;
		FieldTrack track = new FieldTrack();
		track.setWay(sway.getWay());
		track.setLabel(sway.getName());
		
		try {
			Long.parseLong(sway.getName().substring(0, 5));
			track.setLabel(sway.getDesc());
			confidence = 100;
			track.setAssignmentId(Long.parseLong(sway.getName().substring(2, 5)));
		} catch (Exception e) {}

		if(track.getWay().getWaypoints().size() < 2) return null;
		return new Pair<Integer, FieldTrack>(confidence, track);
	}

	public StyledGeoObject toStyledGeo() {
		StyledWay sway = new StyledWay();

		sway.setName(getLabel());
		sway.setColor("#FF0000");
		sway.setWeight(2f);
		sway.setFill(0f);
		sway.setWay(getWay());
		
		return sway;
	}

	@ManyToOne
	@Cascade({org.hibernate.annotations.CascadeType.ALL,org.hibernate.annotations.CascadeType.DELETE_ORPHAN})
	@JSONSerializable
	public Way getWay() {
		return way;
	}
	
	public void setWay(Way way) {
		this.way = way;
	}
	
	@JSONSerializable
	public String getLabel() {
		return label;
	}
	
	public void setLabel(String label) {
		this.label = label;
	}
	
}
