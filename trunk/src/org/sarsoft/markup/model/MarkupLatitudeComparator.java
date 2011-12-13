package org.sarsoft.markup.model;

import java.util.Comparator;

public class MarkupLatitudeComparator implements Comparator {

	@Override
	public int compare(Object arg0, Object arg1) {
		double lat0 = 0;
		double lat1 = 0;
		if(arg0 instanceof Shape) {
			Shape shape = (Shape) arg0;
			lat0 = shape.getWay().getBoundingBox()[1].getLat();
		} else if(arg0 instanceof Marker) {
			Marker marker = (Marker) arg0;
			lat0 = marker.getPosition().getLat();
		}
		
		if(arg1 instanceof Shape) {
			Shape shape = (Shape) arg1;
			lat1 = shape.getWay().getBoundingBox()[1].getLat();
		} else if(arg1 instanceof Marker) {
			Marker marker = (Marker) arg1;
			lat1 = marker.getPosition().getLat();
		}		
		return (int)((lat1-lat0)*1000);
	}	

}
