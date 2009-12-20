package org.sarsoft.common.model;

import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;

import net.sf.json.JSONObject;

import org.hibernate.annotations.GenericGenerator;

@JSONAnnotatedEntity
@Entity
public class MapConfig {

	private Long id;
	private String base;
	private String overlay;
	private int opacity;

	public static MapConfig createFromJSON(JSONObject json) {
		return (MapConfig) JSONObject.toBean(json, MapConfig.class);
	}

	@Id
	@JSONSerializable
	@GenericGenerator(name = "generator", strategy="increment")
	@GeneratedValue(generator="generator")
	public Long getId() {
		return id;
	}
	public void setId(Long id) {
		this.id = id;
	}
	@JSONSerializable
	public String getBase() {
		return base;
	}
	public void setBase(String base) {
		this.base = base;
	}
	@JSONSerializable
	public int getOpacity() {
		return opacity;
	}
	public void setOpacity(int opacity) {
		this.opacity = opacity;
	}
	@JSONSerializable
	public String getOverlay() {
		return overlay;
	}
	public void setOverlay(String overlay) {
		this.overlay = overlay;
	}

}
