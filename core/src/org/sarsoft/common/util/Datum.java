package org.sarsoft.common.util;

import org.sarsoft.common.model.Waypoint;

public class Datum {

	public final double a;
	public final double b;
	public final double f;
	public final int x;
	public final int y;
	public final int z;
	
	public static Datum WGS84 = new Datum(6378137.0, 6356752.314, 1/298.257223563, 0, 0, 0);
	public static Datum NAD27 = new Datum(6378206.4, 6356583.8, 1/294.9786982, -8, 160, 176);
	
	public Datum(double a, double b, double f, int x,  int y,  int z) {
		this.a = a;
		this.b = b;
		this.f = f;
		this.x = x;
		this.y = y;
		this.z = z;
	}
	
	private double degToRad(double deg) {
		return deg * Math.PI / 180;
	}
	
	private double radToDeg(double rad) {
		return rad * 180 / Math.PI;
	}
	
	public double[] to(double deg_lat, double deg_lng, Datum from) {
		if(from == this) return new double[] { deg_lat, deg_lng};
		double lat = degToRad(deg_lat);
		double lng = degToRad(deg_lng);
		double da = this.a - from.a;
		double bda = 1 - from.f;
		double df = this.f - from.f;
		double fromEs = 2*from.f-from.f*from.f;
		int dx = from.x-this.x;
		int dy = from.y-this.y;
		int dz = from.z-this.z;
		
		double Rn = from.a/Math.sqrt(1-fromEs*Math.sin(lat));
		double Rm = from.a*(1-fromEs)/Math.pow(1 - fromEs*Math.sin(lat), 1.5);
		
		double dLat = ((-1*dx*Math.sin(lat)*Math.cos(lng) - dy*Math.sin(lat)*Math.sin(lng) + dz*Math.cos(lat)) + 
				(da*Rn*fromEs*Math.sin(lat)*Math.cos(lat)/from.a) + df*(Rm/bda+Rn*bda)*Math.sin(lat)*Math.cos(lat))/Rm;
		double dLng = (-1*dx*Math.sin(lng) + dy*Math.cos(lng))/(Rn * Math.cos(lat));
		
		return new double[] {radToDeg(lat+dLat), radToDeg(lng+dLng)};
	}
	
	public Waypoint to(Waypoint wpt, Datum from) {
		if(from == this) return wpt;
		double[] to = to(wpt.getLat(), wpt.getLng(), from);
		return new Waypoint(to[0], to[1], this);
	}
	
	public Waypoint to(Waypoint wpt) {
		return to(wpt, wpt.getDatum());
	}

}
