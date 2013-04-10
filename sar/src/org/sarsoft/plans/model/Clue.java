package org.sarsoft.plans.model;

import java.util.Date;
import java.util.Map;

import javax.persistence.Entity;
import javax.persistence.ManyToOne;

import net.sf.json.JSONObject;

import org.hibernate.annotations.Cascade;
import org.sarsoft.common.Pair;
import org.sarsoft.common.json.JSONAnnotatedEntity;
import org.sarsoft.common.json.JSONSerializable;
import org.sarsoft.common.model.IPreSave;
import org.sarsoft.common.model.Waypoint;

@JSONAnnotatedEntity
@Entity
public class Clue extends AssignmentChildObject {
	
	public enum Disposition {
		COLLECT,MARK,IGNORE
	}

	private String description;
	private String summary;
	private String location;
	private Waypoint position;
	private Date found;
	private Disposition instructions;
	
	public Clue() {
	}
	
	public Clue(JSONObject json) {
		from(json);
	}
	
	public void from(JSONObject json) {
		this.from((Clue) JSONObject.toBean(json, Clue.class));
	}
	
	public void from(Clue updated) {
		if(updated.getPosition() == null || (updated.getDescription() != null || updated.getSummary() != null)) {
			setAssignmentId(updated.getAssignmentId());
			setDescription(updated.getDescription());
			setSummary(updated.getSummary());
			setLocation(updated.getLocation());
			setFound(updated.getFound());
			setUpdated(updated.getUpdated());
			setInstructions(updated.getInstructions());
		}

		if(updated.getPosition() != null) {
			if(position == null) position = new Waypoint();
			getPosition().setLat(updated.getPosition().getLat());
			getPosition().setLng(updated.getPosition().getLng());
		}
	}
	
	public JSONObject toGPX() {
		return null;
	}
	
	public static Pair<Integer, Clue> fromGPX(JSONObject gpx) {
		String type = gpx.getString("type");
		if(!"waypoint".equals(type)) return null;

		String label = gpx.getString("name");
		if(label == null || !label.startsWith("CLUE")) return null;

		Clue clue = new Clue();
		clue.setPosition(new Waypoint((JSONObject) gpx.get("position")));
		
		if(label.length() > 4) try { clue.setId(Long.parseLong(label.substring(4))); } catch (NumberFormatException e) {}

		Map<String, String> attrs = decodeGPXAttrs(gpx.getString("desc"));
		if(attrs.containsKey("description")) clue.setDescription(attrs.get("description"));
		if(attrs.containsKey("location")) clue.setLocation(attrs.get("location"));
		if(attrs.containsKey("summary")) clue.setSummary(attrs.get("summary"));
		if(attrs.containsKey("found")) clue.setFound(new Date(Long.parseLong(attrs.get("found"))));
		if(attrs.containsKey("instructions")) clue.setInstructions(Disposition.valueOf(attrs.get("instructions")));
		if(attrs.containsKey("updated")) clue.setUpdated(new Date(Long.parseLong(attrs.get("updated"))));
		if(attrs.containsKey("assignmentid")) clue.setAssignmentId(Long.parseLong(attrs.get("assignmentid")));

		return new Pair<Integer, Clue>(100, clue);
	}
	
	@ManyToOne
	@Cascade({org.hibernate.annotations.CascadeType.ALL,org.hibernate.annotations.CascadeType.DELETE_ORPHAN})
	@JSONSerializable
	public Waypoint getPosition() {
		return position;
	}

	public void setPosition(Waypoint position) {
		this.position = position;
	}

	@JSONSerializable
	public Date getFound() {
		return found;
	}
	
	public void setFound(Date found) {
		this.found = found;
	}
	
	@JSONSerializable
	public String getSummary() {
		return summary;
	}
	
	public void setSummary(String summary) {
		this.summary = summary;
	}

	@JSONSerializable
	public String getDescription() {
		return description;
	}
	
	public void setDescription(String description) {
		this.description = description;
	}
	
	@JSONSerializable
	public String getLocation() {
		return location;
	}
	
	public void setLocation(String location) {
		this.location = location;
	}
		
	@JSONSerializable
	public Disposition getInstructions() {
		return instructions;
	}
	
	public void setInstructions(Disposition instructions) {
		this.instructions = instructions;
	}
}
