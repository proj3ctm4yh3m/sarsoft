package org.sarsoft.plans.model;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

import javax.persistence.Entity;
import javax.persistence.ManyToOne;

import net.sf.json.JSONObject;

import org.hibernate.annotations.Cascade;
import org.sarsoft.common.Pair;
import org.sarsoft.common.json.JSONAnnotatedEntity;
import org.sarsoft.common.json.JSONSerializable;
import org.sarsoft.common.model.Way;

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

	public JSONObject toGPX() {
		return null;
	}
	
	public static Pair<Integer, FieldTrack> fromGPX(JSONObject gpx) {
		String type = gpx.getString("type");
		if(!"track".equals(type)) return null;
		if(!gpx.has("way")) return null;
		
		int confidence = 1;
		FieldTrack track = new FieldTrack();
		
		String label = gpx.getString("name");
		track.setLabel(label);
		
		try {
			Long.parseLong(label.substring(0, 5));
			track.setLabel(gpx.getString("desc"));
			confidence = 100;
			track.setAssignmentId(Long.parseLong(label.substring(2, 5)));
		} catch (Exception e) {}

		if(track.getLabel() != null && track.getLabel().startsWith("-")) track.setLabel(null);
		track.setWay(new Way((JSONObject) gpx.get("way")));

		if(track.getWay().getWaypoints().size() < 2) return null;
		return new Pair<Integer, FieldTrack>(confidence, track);
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
