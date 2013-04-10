package org.sarsoft.common.model;

import java.util.Date;

import javax.persistence.MappedSuperclass;

import org.sarsoft.common.json.JSONAnnotatedPropertyFilter;
import org.sarsoft.common.json.JSONSerializable;

import net.sf.json.JSONObject;

@MappedSuperclass
public abstract class MapObject extends SarModelObject implements IPreSave {

	private Date updated;

	public abstract void from(JSONObject json);

	public static JSONObject json(Object obj){
		return JSONAnnotatedPropertyFilter.fromObject(obj);
	}
	
	@JSONSerializable
	public Date getUpdated() {
		return updated;
	}
	public void setUpdated(Date updated) {
		this.updated = updated;
	}
	
	public void preSave() {
		setUpdated(new Date());
	}

}
