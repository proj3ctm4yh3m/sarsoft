package org.sarsoft.admin.model;

import javax.persistence.Entity;
import javax.persistence.Id;

import net.sf.json.JSONObject;

import org.sarsoft.common.model.JSONAnnotatedEntity;
import org.sarsoft.common.model.JSONSerializable;

@JSONAnnotatedEntity
@Entity
public class MapSource {

	public enum Type {
		TILE,WMS,NATIVE
	}

	private String name;
	private Type type;
	private String copyright;
	private int minresolution;
	private int maxresolution;
	private boolean png;
	private boolean alphaOverlay;
	private String template;
	private String info;

	public static MapSource createFromJSON(JSONObject json) {
		return (MapSource) JSONObject.toBean(json, MapSource.class);
	}

	@Id
	@JSONSerializable
	public String getName() {
		return name;
	}
	public void setName(String name) {
		this.name = name;
	}
	@JSONSerializable
	public String getCopyright() {
		return copyright;
	}
	public void setCopyright(String copyright) {
		this.copyright = copyright;
	}
	@JSONSerializable
	public int getMaxresolution() {
		return maxresolution;
	}
	public void setMaxresolution(int maxresolution) {
		this.maxresolution = maxresolution;
	}
	@JSONSerializable
	public int getMinresolution() {
		return minresolution;
	}
	public void setMinresolution(int minresolution) {
		this.minresolution = minresolution;
	}
	@JSONSerializable
	public boolean isPng() {
		return png;
	}
	public void setPng(boolean png) {
		this.png = png;
	}
	@JSONSerializable
	public boolean isAlphaOverlay() {
		return alphaOverlay;
	}
	public void setAlphaOverlay(boolean alphaOverlay) {
		this.alphaOverlay = alphaOverlay;
	}
	@JSONSerializable
	public String getTemplate() {
		return template;
	}
	public void setTemplate(String template) {
		this.template = template;
	}
	@JSONSerializable
	public String getInfo() {
		return info;
	}
	public void setInfo(String info) {
		this.info = info;
	}
	@JSONSerializable
	public Type getType() {
		return type;
	}
	public void setType(Type type) {
		this.type = type;
	}
}
