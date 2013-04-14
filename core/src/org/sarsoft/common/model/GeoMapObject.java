package org.sarsoft.common.model;

import javax.persistence.MappedSuperclass;

import org.sarsoft.common.gpx.StyledGeoObject;

@MappedSuperclass
public abstract class GeoMapObject extends MapObject {
	
	public abstract StyledGeoObject toStyledGeo();
}
