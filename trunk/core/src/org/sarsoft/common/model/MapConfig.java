package org.sarsoft.common.model;

import javax.persistence.Entity;

import net.sf.json.JSONObject;

@JSONAnnotatedEntity
@Entity
public class MapConfig extends SarModelObject {

	private String base;
	private String overlay;
	private String alphaOverlays;
	private int opacity;

	public static MapConfig createFromJSON(JSONObject json) {
		return (MapConfig) JSONObject.toBean(json, MapConfig.class);
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
	@JSONSerializable
	public String getAlphaOverlays() {
		return alphaOverlays;
	}
	public void setAlphaOverlays(String alphaOverlays) {
		this.alphaOverlays = alphaOverlays;
	}

}
