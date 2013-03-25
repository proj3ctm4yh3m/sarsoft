package org.sarsoft.common.model;

import javax.persistence.Entity;
import javax.persistence.Id;

import net.sf.json.JSONObject;

import org.sarsoft.common.json.JSONAnnotatedEntity;
import org.sarsoft.common.json.JSONSerializable;

@JSONAnnotatedEntity
@Entity
public class MapSource {

	public enum Type {
		TILE,WMS,NATIVE
	}

	private String name;
	private String alias;
	private Type type;
	private String copyright;
	private int minresolution;
	private int maxresolution;
	private int opacity;
	private boolean png;
	private boolean alphaOverlay;
	private boolean data;
	private String template;
	private String info;
	private String description;
	private int date;

	@Id
	@JSONSerializable
	public String getName() {
		return name;
	}
	public void setName(String name) {
		this.name = name;
	}
	@JSONSerializable
	public String getAlias() {
		return alias;
	}
	public void setAlias(String alias) {
		this.alias = alias;
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
	public int getOpacity() {
		return opacity;
	}
	public void setOpacity(int opacity) {
		this.opacity = opacity;
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
	public boolean isData() {
		return data;
	}
	public void setData(boolean data) {
		this.data = data;
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
	public String getDescription() {
		return description;
	}
	public void setDescription(String description) {
		this.description = description;
	}
	@JSONSerializable
	public Type getType() {
		return type;
	}
	public void setType(Type type) {
		this.type = type;
	}
	@JSONSerializable
	public int getDate() {
		return date;
	}
	public void setDate(int date) {
		this.date = date;
	}
}
