package org.sarsoft.common.model;

import java.util.Date;

import javax.persistence.Entity;
import javax.persistence.Transient;

import net.sf.json.JSONArray;
import net.sf.json.JSONObject;

@JSONAnnotatedEntity
@Entity
public class Waypoint extends SarModelObject {

	private String name;
	private double lat;
	private double lng;
	private Date time;

    /* Ellipsoid model constants (actual values here are for WGS84) */
    private static double sma = 6378137.0;
    private static double smb = 6356752.314;
    private static double UTMScaleFactor = 0.9996;

	public Waypoint() {
	}

	public Waypoint(double lat, double lng) {
		this.lat = lat;
		this.lng = lng;
	}

	public Waypoint(double easting, double northing, int zone) {
		double[] latlng = UTMXYToLatLon(easting, northing, zone, false);
		this.lat = latlng[0];
		this.lng = latlng[1];
	}

	public static Waypoint createFromJSON(JSONObject json) {
		return (Waypoint) JSONObject.toBean(json, Waypoint.class);
	}

	public static Waypoint[] createFromJSON(JSONArray json) {
		return (Waypoint[]) JSONArray.toArray(json, Waypoint.class);
	}

	@JSONSerializable
	public String getName() {
		return name;
	}
	public void setName(String name) {
		this.name = name;
	}

	@JSONSerializable
	@Transient
	public Long getId() {
		return getPk();
	}

	@JSONSerializable
	public double getLat() {
		return lat;
	}
	public void setLat(double lat) {
		this.lat = lat;
	}
	@JSONSerializable
	public double getLng() {
		return lng;
	}
	public void setLng(double lng) {
		this.lng = lng;
	}
	@JSONSerializable
	public Date getTime() {
		return time;
	}
	public void setTime(Date time) {
		this.time = time;
	}

	public double distanceFrom(Waypoint wpt) {
		double[] offset = offsetFrom(wpt);
		return Math.sqrt(Math.pow(offset[0], 2) + Math.pow(offset[1], 2));
	}

	@Transient
	public String getFormattedUTM() {
		int zone = (int) (Math.floor((lng + 180) / 6) + 1);
		double[] utm = getUTMXY();
		return String.format("%1$3s %2$07dE\n    %3$07dN", new Object[] {zone, Math.round(utm[0]), Math.round(utm[1])});
	}

	@Transient
	public double[] getUTMXY() {
		return LatLonToUTMXY(lat*Math.PI/180, lng*Math.PI/180, getUTMZone());
	}

	@Transient
	public int getUTMZone() {
		return (int) (Math.floor((lng + 180) / 6) + 1);
	}

	public double[] offsetFrom(Waypoint wpt) {
		int zone = (int) (Math.floor((Math.min(lng, wpt.getLng()) + 180) / 6) + 1);
		double[] me = LatLonToUTMXY(lat*Math.PI/180, lng*Math.PI/180, zone);
		double[] them = LatLonToUTMXY(wpt.getLat()*Math.PI/180, wpt.getLng()*Math.PI/180, zone);
		return new double[] {them[0] - me[0], them[1] - me[1]};
	}

    private static double ArcLengthOfMeridian(double phi) {
        double n = (sma - smb) / (sma + smb);
        double alpha = (sma + smb)/2 * (1 + Math.pow(n, 2)/4 + Math.pow (n, 4)/64);
        double beta = -3*n/2 + 9/16*Math.pow (n, 3) - 3/32*Math.pow (n, 5);
        double gamma = 15/16 * Math.pow (n, 2)- 15/32 * Math.pow (n, 4);
        double delta = -35/48 * Math.pow (n, 3) + 105/256 * Math.pow (n, 5.0);
        double epsilon = 315/512 * Math.pow (n, 4);

        return alpha * (phi + (beta * Math.sin (2 * phi)) + (gamma * Math.sin (4 * phi)) + (delta * Math.sin (6 * phi)) + (epsilon * Math.sin (8 * phi)));
    }

    private static double UTMCentralMeridian (int zone) {
        return (-183 + (zone * 6))*Math.PI/180;
    }


    private static double FootpointLatitude(double northing) {
        double n = (sma - smb) / (sma + smb);
        double alpha = (sma + smb)/2 * (1 + Math.pow(n, 2)/4 + Math.pow (n, 4)/64);

        double beta = (3.0 * n / 2.0) + (-27.0 * Math.pow (n, 3.0) / 32.0) + (269.0 * Math.pow (n, 5.0) / 512.0);
        double gamma = (21.0 * Math.pow (n, 2.0) / 16.0) + (-55.0 * Math.pow (n, 4.0) / 32.0);
        double delta = (151.0 * Math.pow (n, 3.0) / 96.0) + (-417.0 * Math.pow (n, 5.0) / 128.0);
        double epsilon = (1097.0 * Math.pow (n, 4.0) / 512.0);
    	double y = northing / alpha;

        return y + (beta * Math.sin (2.0 * y)) + (gamma * Math.sin (4.0 * y)) + (delta * Math.sin (6.0 * y)) + (epsilon * Math.sin (8.0 * y));
    }

    private static double[] MapLatLonToXY (double phi, double lambda, double lambda0) {
        double ep2 = (Math.pow (sma, 2.0) - Math.pow (smb, 2.0)) / Math.pow (smb, 2.0);
        double nu2 = ep2 * Math.pow (Math.cos (phi), 2.0);
        double n = Math.pow (sma, 2.0) / (smb * Math.sqrt (1 + nu2));
        double t = Math.tan (phi);
        double t2 = t * t;
        double l = lambda - lambda0;

        double l3coef = 1.0 - t2 + nu2;
        double l4coef = 5.0 - t2 + 9 * nu2 + 4.0 * (nu2 * nu2);
        double l5coef = 5.0 - 18.0 * t2 + (t2 * t2) + 14.0 * nu2 - 58.0 * t2 * nu2;
        double l6coef = 61.0 - 58.0 * t2 + (t2 * t2) + 270.0 * nu2 - 330.0 * t2 * nu2;
        double l7coef = 61.0 - 479.0 * t2 + 179.0 * (t2 * t2) - (t2 * t2 * t2);
        double l8coef = 1385.0 - 3111.0 * t2 + 543.0 * (t2 * t2) - (t2 * t2 * t2);

        double[] xy = new double[2];
        xy[0] = n * Math.cos (phi) * l
            + (n / 6.0 * Math.pow (Math.cos (phi), 3.0) * l3coef * Math.pow (l, 3.0))
            + (n / 120.0 * Math.pow (Math.cos (phi), 5.0) * l5coef * Math.pow (l, 5.0))
            + (n / 5040.0 * Math.pow (Math.cos (phi), 7.0) * l7coef * Math.pow (l, 7.0));
        xy[1] = ArcLengthOfMeridian (phi)
            + (t / 2.0 * n * Math.pow (Math.cos (phi), 2.0) * Math.pow (l, 2.0))
            + (t / 24.0 * n * Math.pow (Math.cos (phi), 4.0) * l4coef * Math.pow (l, 4.0))
            + (t / 720.0 * n * Math.pow (Math.cos (phi), 6.0) * l6coef * Math.pow (l, 6.0))
            + (t / 40320.0 * n * Math.pow (Math.cos (phi), 8.0) * l8coef * Math.pow (l, 8.0));

        return xy;
    }



    private static double[] MapXYToLatLon (double x, double y, double lambda0) {
        double phif = FootpointLatitude (y);
        double ep2 = (Math.pow (sma, 2.0) - Math.pow (smb, 2.0)) / Math.pow (smb, 2.0);
        double cf = Math.cos (phif);
        double nuf2 = ep2 * Math.pow (cf, 2.0);
        double nf = Math.pow (sma, 2.0) / (smb * Math.sqrt (1 + nuf2));
        double nfpow = nf*nf;

        double tf = Math.tan (phif);
        double tf2 = tf * tf;
        double tf4 = tf2 * tf2;
        double x1frac = 1.0 / (nf * cf);
        double x2frac = tf / (2.0 * nfpow);
        nfpow *= nf;
        double x3frac = 1.0 / (6.0 * nfpow * cf);
        nfpow *= nf;
        double x4frac = tf / (24.0 * nfpow);
        nfpow *= nf;
        double x5frac = 1.0 / (120.0 * nfpow * cf);
        nfpow *= nf;
        double x6frac = tf / (720.0 * nfpow);
        nfpow *= nf;
        double x7frac = 1.0 / (5040.0 * nfpow * cf);
        nfpow *= nf;
        double x8frac = tf / (40320.0 * nfpow);

        double x2poly = -1.0 - nuf2;
        double x3poly = -1.0 - 2 * tf2 - nuf2;
        double x4poly = 5.0 + 3.0 * tf2 + 6.0 * nuf2 - 6.0 * tf2 * nuf2 - 3.0 * (nuf2 *nuf2) - 9.0 * tf2 * (nuf2 * nuf2);
        double x5poly = 5.0 + 28.0 * tf2 + 24.0 * tf4 + 6.0 * nuf2 + 8.0 * tf2 * nuf2;
        double x6poly = -61.0 - 90.0 * tf2 - 45.0 * tf4 - 107.0 * nuf2 + 162.0 * tf2 * nuf2;
        double x7poly = -61.0 - 662.0 * tf2 - 1320.0 * tf4 - 720.0 * (tf4 * tf2);
        double x8poly = 1385.0 + 3633.0 * tf2 + 4095.0 * tf4 + 1575 * (tf4 * tf2);

        double[] philambda = new double[2];
        philambda[0] = phif + x2frac * x2poly * (x * x)
        	+ x4frac * x4poly * Math.pow (x, 4.0)
        	+ x6frac * x6poly * Math.pow (x, 6.0)
        	+ x8frac * x8poly * Math.pow (x, 8.0);

        philambda[1] = lambda0 + x1frac * x
        	+ x3frac * x3poly * Math.pow (x, 3.0)
        	+ x5frac * x5poly * Math.pow (x, 5.0)
        	+ x7frac * x7poly * Math.pow (x, 7.0);

        return philambda;
    }

    private static double[] LatLonToUTMXY (double lat, double lon, int zone) {
        double[] xy = MapLatLonToXY (lat, lon, UTMCentralMeridian(zone));

        xy[0] = xy[0] * UTMScaleFactor + 500000.0;
        xy[1] = xy[1] * UTMScaleFactor;
        if (xy[1] < 0.0)
            xy[1] = xy[1] + 10000000.0;

        return xy;
    }

    private static double[] UTMXYToLatLon (double x, double y, int zone, boolean southhemi) {
        x -= 500000.0;
        x /= UTMScaleFactor;

        /* If in southern hemisphere, adjust y accordingly. */
        if (southhemi)
        y -= 10000000.0;
        y /= UTMScaleFactor;

        double cmeridian = UTMCentralMeridian (zone);
        return MapXYToLatLon (x, y, cmeridian);
    }

    public boolean equals(Object o) {
    	if(o instanceof Waypoint) {
    		Waypoint wpt = (Waypoint) o;
    		return (wpt.getLat() == lat && wpt.getLng() == lng);
    	}
    	return false;
    }
    
    public Waypoint clone() {
    	Waypoint wpt = new Waypoint(getLat(), getLng());
    	wpt.setTime(getTime());
    	return wpt;
    }
}