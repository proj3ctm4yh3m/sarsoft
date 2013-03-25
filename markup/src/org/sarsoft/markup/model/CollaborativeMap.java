package org.sarsoft.markup.model;

import javax.persistence.Entity;
import javax.persistence.ManyToOne;

import net.sf.json.JSONObject;

import org.hibernate.annotations.Cascade;
import org.sarsoft.common.json.JSONAnnotatedEntity;
import org.sarsoft.common.model.Tenant;
import org.sarsoft.common.model.Waypoint;


@JSONAnnotatedEntity
@Entity
public class CollaborativeMap extends Tenant {

	private Waypoint defaultCenter;

	public CollaborativeMap() {
	}
	
	public CollaborativeMap(JSONObject json) {
		from(json);
	}
	
	public void from(JSONObject json) {
		from((CollaborativeMap) JSONObject.toBean(json, CollaborativeMap.class, classHints));
	}
	
	public void from(CollaborativeMap updated) {
		setDefaultCenter(updated.getDefaultCenter());
		super.from(updated);
	}

	@ManyToOne
	@Cascade({org.hibernate.annotations.CascadeType.ALL,org.hibernate.annotations.CascadeType.DELETE_ORPHAN})
	public Waypoint getDefaultCenter() {
		return defaultCenter;
	}

	public void setDefaultCenter(Waypoint defaultCenter) {
		this.defaultCenter = defaultCenter;
	}

}
