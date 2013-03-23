if(typeof org == "undefined") org = new Object();
if(typeof org.sarsoft == "undefined") org.sarsoft = new Object();

org.sarsoft.WebMercator = function() {
	this.tilesize = 256;
	this.initialresolution = 2 * Math.PI * 6378137 / this.tilesize;
	this.originshift = 2 * Math.PI * 6378137 / 2;
}

org.sarsoft.WebMercator.prototype.resolution = function(zoom) {
	return this.initialresolution / Math.pow(2, zoom);
}

org.sarsoft.WebMercator.prototype.latLngToMeters = function(lat, lng) {
	var mx = lng * this.originshift / 180;
    var my = Math.log(Math.tan((90 + lat) * Math.PI / 360)) / (Math.PI / 180);
    my = my * this.originshift / 180;
    return [mx, my];
}

org.sarsoft.WebMercator.prototype.metersToLatLng = function(mx, my) {
	var lng = (mx / this.originshift) * 180;
	var lat = (my / this.originshift) * 180;

    lat = 180 / Math.PI * (2 * Math.atan(Math.exp(lat * Math.PI / 180)) - Math.PI / 2);
    return [lat, lng];
}

org.sarsoft.WebMercator.prototype.pixelsToMeters = function(px, py, zoom) {
    var res = this.resolution(zoom);
    var mx = px * res - this.originshift;
    var my = py * res - this.originshift;
    return [mx, my];
}

org.sarsoft.WebMercator.prototype.metersToPixels = function(mx, my, zoom) {
    var res = this.resolution(zoom);
    var px = (mx + this.originshift) / res;
    var py = (my + this.originshift) / res;
    return [px, py];
}

org.sarsoft.WebMercator.prototype.pixelsToTile = function(px, py) {
    var tx = Math.ceil(px / this.tilesize) - 1;
    var ty = Math.ceil(py / this.tilesize) - 1;
    return [tx, ty];
}

org.sarsoft.WebMercator.prototype.pixelsToDecimalTile = function(px, py) {
    var tx = px / this.tilesize;
    var ty = py / this.tilesize;
    return [tx, ty];
}

org.sarsoft.WebMercator.prototype.metersToDecimalTile = function(mx, my, zoom) {
	var p = this.metersToPixels(mx, my, zoom);
	return this.pixelsToDecimalTile(p[0], p[1]);
}

org.sarsoft.WebMercator.prototype.tileBounds = function(tx, ty, zoom) {
    var min = this.pixelsToMeters(tx*this.tilesize, ty*this.tilesize, zoom);
    var max = this.pixelsToMeters((tx+1)*this.tilesize, (ty+1)*this.tilesize, zoom);
    return [min[0], min[1], max[0], max[1]];
}

org.sarsoft.WebMercator.prototype.tileLatLngBounds = function(tx, ty, zoom) {
	var bounds = this.tileBounds(tx, ty, zoom);
	var min = this.metersToLatLng(bounds[0], bounds[1]);
	var max = this.metersToLatLng(bounds[2], bounds[3]);
	return [min[0], min[1], max[0], max[1]];
}

org.sarsoft.WebMercator.prototype.googleTile = function(tx, ty, zoom) {
	return [tx, (Math.pow(2, zoom)) - 1 - ty];
}

org.sarsoft.WebMercator.prototype.googleY = function(y, z) {
	return (Math.pow(2, z)) - 1 - y;
}

org.sarsoft.WebMercator.prototype.tileY = function(y, z) {
	return (Math.pow(2, z)) - 1 - y;
}

function UTM(e, n, zone) {
	this.e = Math.round(e);
	this.n = Math.round(n);
	this.zone = zone;
}

UTM.prototype.distanceFrom = function(other) {
	var dx = this.e - other.e;
	var dy = this.n - other.n;
	return Math.sqrt(dx*dx+dy*dy);
}

UTM.prototype.toString = function() {
	return this.zone + " " + Math.round(this.e) + "E  " + Math.round(this.n) + "N";
}

UTM.prototype.toHTMLString = function() {
	var e = "" + Math.round(this.e);
	var n = "" + Math.round(this.n);
	var e1 = e.substring(0, e.length-3);
	var e2 = e.substring(e.length-3, e.length);
	var n1 = n.substring(0, n.length-3);
	var n2 = n.substring(n.length-3, n.length);

	return this.zone + " " + e1 + "<span style=\"font-size: smaller\">" + e2 + "E</span> " + n1 + "<span style=\"font-size: smaller\">" + n2 + "N</span>";
}

GeoUtil = new Object();

GeoUtil.wpt2gll = function(wpt) {
	return new google.maps.LatLng(wpt.lat, wpt.lng);
}

GeoUtil.wpts2path = function(waypoints) {
	var path = [];
	for(var i = 0; i < waypoints.length; i++) path.push(GeoUtil.wpt2gll(waypoints[i]));
	return path;
}

GeoUtil.formatDD = function(deg) {
	return deg.toFixed(4);
}

GeoUtil.formatDDMMHH = function(deg) {
	var neg = false;
	if(deg < 0) {
		neg = true;
		deg = deg*-1;
	}
	var d=Math.floor(deg);
	var m=Math.floor((deg-d)*60);
	var h=Math.round(((deg-d)*60-m)*100);
	if(h == 100) {
		h = 0;
		m = m + 1;
	}
	if(m == 60) {
		m = 0;
		d = d + 1;
	}
	return (neg ? "-" : "") + d+"\u00B0"+m+"."+((h < 10) ? "0" + h : h) +"'";
}

GeoUtil.formatDDMMSS = function(deg) {
	var neg = false;
	if(deg < 0) {
		neg = true;
		deg = deg*-1;
	}
	var d=Math.floor(deg);
	var m=Math.floor((deg-d)*60);
	var s=Math.round(((deg-d)*60-m)*60);
	if(s == 60) {
		s = 0;
		m = m + 1;
	}
	if(m == 60) {
		m = 0;
		d = d + 1;
	}
	return (neg ? "-" : "") + d+"\u00B0"+m+"'"+ s +"''";
}


GeoUtil.UTMToGLatLng = function(utm) {
	var ll = new Object();
	GeoUtil.UTMXYToLatLon(utm.e, utm.n, utm.zone, false, ll);
	return new google.maps.LatLng(GeoUtil.RadToDeg(ll[0]),GeoUtil.RadToDeg(ll[1]));
}

GeoUtil.GLatLngToUTM = function(gll, zone) {
	var xy = new Object();
	if(typeof zone == "undefined") zone = Math.floor ((gll.lng() + 180.0) / 6) + 1;
	var zone = GeoUtil.LatLonToUTMXY (GeoUtil.DegToRad(gll.lat()), GeoUtil.DegToRad(gll.lng()), zone, xy);
	return new UTM(xy[0], xy[1], zone);
}

GeoUtil.getWestBorder = function(zone) {
	return (zone - 1)*6 - 180;
}

GeoUtil.getEastBorder = function(zone) {
	return GeoUtil.getWestBorder(zone + 1);
}

GeoUtil.datum = org.sarsoft.map.datums[org.sarsoft.map.datum];

GeoUtil.toWGS84 = function(gll) {
	var wgs84 = org.sarsoft.map.datums["WGS84"];
	if(GeoUtil.datum == wgs84) return gll;
	return GeoUtil.convertDatum(gll, GeoUtil.datum, wgs84);
}

GeoUtil.fromWGS84 = function(gll) {
	var wgs84 = org.sarsoft.map.datums["WGS84"];
	if(GeoUtil.datum == wgs84) return gll;
	return GeoUtil.convertDatum(gll, wgs84, GeoUtil.datum);
}

GeoUtil.convertDatum = function(gll, from, to) {
	var lat = GeoUtil.DegToRad(gll.lat());
	var lng = GeoUtil.DegToRad(gll.lng());
	var da = to.a - from.a;
	var bda = 1 - from.f;
	var df = to.f - from.f;
	var fromEs = 2*from.f-from.f*from.f;
	var dx = from.x-to.x;
	var dy = from.y-to.y;
	var dz = from.z-to.z;
	
	var Rn = from.a/Math.sqrt(1-fromEs*Math.sin(lat));
	var Rm = from.a*(1-fromEs)/Math.pow(1 - fromEs*Math.sin(lat), 1.5);
	
	var dLat = ((-1*dx*Math.sin(lat)*Math.cos(lng) - dy*Math.sin(lat)*Math.sin(lng) + dz*Math.cos(lat)) + 
			(da*Rn*fromEs*Math.sin(lat)*Math.cos(lat)/from.a) + df*(Rm/bda+Rn*bda)*Math.sin(lat)*Math.cos(lat))/Rm;
	var dLng = (-1*dx*Math.sin(lng) + dy*Math.cos(lng))/(Rn * Math.cos(lat));
	
	return new google.maps.LatLng(GeoUtil.RadToDeg(lat+dLat), GeoUtil.RadToDeg(lng+dLng));
}

GeoUtil.UTMScaleFactor = 0.9996;

GeoUtil.DegToRad = function(deg) { return (deg / 180.0 * Math.PI) }
GeoUtil.RadToDeg = function(rad) { return (rad / Math.PI * 180.0) }

GeoUtil.ArcLengthOfMeridian = function(phi) {
	var datum = GeoUtil.datum;

    var n = (datum.a - datum.b) / (datum.a + datum.b);

    var alpha = ((datum.a + datum.b) / 2.0) * (1.0 + (Math.pow (n, 2.0) / 4.0) + (Math.pow (n, 4.0) / 64.0));
    var beta = (-3.0 * n / 2.0) + (9.0 * Math.pow (n, 3.0) / 16.0) + (-3.0 * Math.pow (n, 5.0) / 32.0);
    var gamma = (15.0 * Math.pow (n, 2.0) / 16.0) + (-15.0 * Math.pow (n, 4.0) / 32.0);
    var delta = (-35.0 * Math.pow (n, 3.0) / 48.0) + (105.0 * Math.pow (n, 5.0) / 256.0);
    var epsilon = (315.0 * Math.pow (n, 4.0) / 512.0);

    return alpha * (phi + (beta * Math.sin (2.0 * phi))
            + (gamma * Math.sin (4.0 * phi))
            + (delta * Math.sin (6.0 * phi))
            + (epsilon * Math.sin (8.0 * phi)));

}

GeoUtil.UTMCentralMeridian = function(zone) { return GeoUtil.DegToRad (-183.0 + (zone * 6.0)); }

GeoUtil.FootpointLatitude = function(y) {
	var datum = GeoUtil.datum;
	
    var n = (datum.a - datum.b) / (datum.a + datum.b);

    var alpha_ = ((datum.a + datum.b) / 2.0) * (1 + (Math.pow (n, 2.0) / 4) + (Math.pow (n, 4.0) / 64));
    var y_ = y / alpha_;
    var beta_ = (3.0 * n / 2.0) + (-27.0 * Math.pow (n, 3.0) / 32.0) + (269.0 * Math.pow (n, 5.0) / 512.0);
    var gamma_ = (21.0 * Math.pow (n, 2.0) / 16.0) + (-55.0 * Math.pow (n, 4.0) / 32.0);
    var delta_ = (151.0 * Math.pow (n, 3.0) / 96.0) + (-417.0 * Math.pow (n, 5.0) / 128.0);
    var epsilon_ = (1097.0 * Math.pow (n, 4.0) / 512.0);

    return y_ + (beta_ * Math.sin (2.0 * y_))
            + (gamma_ * Math.sin (4.0 * y_))
            + (delta_ * Math.sin (6.0 * y_))
            + (epsilon_ * Math.sin (8.0 * y_));
}

GeoUtil.MapLatLonToXY = function(phi, lambda, lambda0, xy) {
    var datum = GeoUtil.datum;    
	
	var ep2 = (Math.pow (datum.a, 2.0) - Math.pow (datum.b, 2.0)) / Math.pow (datum.b, 2.0);
	var nu2 = ep2 * Math.pow (Math.cos (phi), 2.0);
	var N = Math.pow (datum.a, 2.0) / (datum.b * Math.sqrt (1 + nu2));
	var t = Math.tan (phi);
	var t2 = t * t;
	var tmp = (t2 * t2 * t2) - Math.pow (t, 6.0);
	var l = lambda - lambda0;
        
	var l3coef = 1.0 - t2 + nu2;
	var l4coef = 5.0 - t2 + 9 * nu2 + 4.0 * (nu2 * nu2);
	var l5coef = 5.0 - 18.0 * t2 + (t2 * t2) + 14.0 * nu2
            - 58.0 * t2 * nu2;
	var l6coef = 61.0 - 58.0 * t2 + (t2 * t2) + 270.0 * nu2
            - 330.0 * t2 * nu2;
	var l7coef = 61.0 - 479.0 * t2 + 179.0 * (t2 * t2) - (t2 * t2 * t2);
	var l8coef = 1385.0 - 3111.0 * t2 + 543.0 * (t2 * t2) - (t2 * t2 * t2);

	xy[0] = N * Math.cos (phi) * l
            + (N / 6.0 * Math.pow (Math.cos (phi), 3.0) * l3coef * Math.pow (l, 3.0))
            + (N / 120.0 * Math.pow (Math.cos (phi), 5.0) * l5coef * Math.pow (l, 5.0))
            + (N / 5040.0 * Math.pow (Math.cos (phi), 7.0) * l7coef * Math.pow (l, 7.0));

    xy[1] = GeoUtil.ArcLengthOfMeridian (phi)
            + (t / 2.0 * N * Math.pow (Math.cos (phi), 2.0) * Math.pow (l, 2.0))
            + (t / 24.0 * N * Math.pow (Math.cos (phi), 4.0) * l4coef * Math.pow (l, 4.0))
            + (t / 720.0 * N * Math.pow (Math.cos (phi), 6.0) * l6coef * Math.pow (l, 6.0))
            + (t / 40320.0 * N * Math.pow (Math.cos (phi), 8.0) * l8coef * Math.pow (l, 8.0));

   return;
}

GeoUtil.MapXYToLatLon = function(x, y, lambda0, philambda) {
    var datum = GeoUtil.datum;
	var phif = GeoUtil.FootpointLatitude(y);

	var ep2 = (Math.pow (datum.a, 2.0) - Math.pow (datum.b, 2.0)) / Math.pow (datum.b, 2.0);
    var cf = Math.cos (phif);
    var nuf2 = ep2 * Math.pow (cf, 2.0);
    var Nf = Math.pow (datum.a, 2.0) / (datum.b * Math.sqrt (1 + nuf2));
    var Nfpow = Nf;
    var tf = Math.tan (phif);
    var tf2 = tf * tf;
    var tf4 = tf2 * tf2;

    var x1frac = 1.0 / (Nfpow * cf);
    Nfpow *= Nf;   /* now equals Nf**2) */
    var x2frac = tf / (2.0 * Nfpow);
    Nfpow *= Nf;   /* now equals Nf**3) */
    var x3frac = 1.0 / (6.0 * Nfpow * cf);
    Nfpow *= Nf;   /* now equals Nf**4) */
    var x4frac = tf / (24.0 * Nfpow);
    Nfpow *= Nf;   /* now equals Nf**5) */
    var x5frac = 1.0 / (120.0 * Nfpow * cf);
    Nfpow *= Nf;   /* now equals Nf**6) */
    var x6frac = tf / (720.0 * Nfpow);
    Nfpow *= Nf;   /* now equals Nf**7) */
    var x7frac = 1.0 / (5040.0 * Nfpow * cf);
    Nfpow *= Nf;   /* now equals Nf**8) */
    var x8frac = tf / (40320.0 * Nfpow);

    var x2poly = -1.0 - nuf2;
    var x3poly = -1.0 - 2 * tf2 - nuf2;
    var x4poly = 5.0 + 3.0 * tf2 + 6.0 * nuf2 - 6.0 * tf2 * nuf2 - 3.0 * (nuf2 *nuf2) - 9.0 * tf2 * (nuf2 * nuf2);
    var x5poly = 5.0 + 28.0 * tf2 + 24.0 * tf4 + 6.0 * nuf2 + 8.0 * tf2 * nuf2;
    var x6poly = -61.0 - 90.0 * tf2 - 45.0 * tf4 - 107.0 * nuf2 + 162.0 * tf2 * nuf2;
    var x7poly = -61.0 - 662.0 * tf2 - 1320.0 * tf4 - 720.0 * (tf4 * tf2);
    var x8poly = 1385.0 + 3633.0 * tf2 + 4095.0 * tf4 + 1575 * (tf4 * tf2);

    philambda[0] = phif + x2frac * x2poly * (x * x)
    	+ x4frac * x4poly * Math.pow (x, 4.0)
    	+ x6frac * x6poly * Math.pow (x, 6.0)
    	+ x8frac * x8poly * Math.pow (x, 8.0);

    philambda[1] = lambda0 + x1frac * x
    	+ x3frac * x3poly * Math.pow (x, 3.0)
    	+ x5frac * x5poly * Math.pow (x, 5.0)
    	+ x7frac * x7poly * Math.pow (x, 7.0);

   return;
}


GeoUtil.LatLonToUTMXY = function(lat, lon, zone, xy) {
	GeoUtil.MapLatLonToXY (lat, lon, GeoUtil.UTMCentralMeridian (zone), xy);

	xy[0] = xy[0] * GeoUtil.UTMScaleFactor + 500000.0;
	xy[1] = xy[1] * GeoUtil.UTMScaleFactor;
	if (xy[1] < 0.0)
		xy[1] = xy[1] + 10000000.0;
	return zone;
}


GeoUtil.UTMXYToLatLon = function(x, y, zone, southhemi, latlon) {
    var cmeridian;

    x -= 500000.0;
    x /= GeoUtil.UTMScaleFactor;

    if (southhemi)
    	y -= 10000000.0;

    y /= GeoUtil.UTMScaleFactor;

    cmeridian = GeoUtil.UTMCentralMeridian(zone);
    GeoUtil.MapXYToLatLon (x, y, cmeridian, latlon);
    return;
}


GeoUtil.Declination = new Object();
GeoUtil.Declination.G_COEFF = [
	[0.0],
	[-29496.6, -1586.3],
	[-2396.6, 3026.1, 1668.6],
	[1340.1, -2326.2, 1231.9, 634.0],
	[912.6, 808.9, 166.7, -357.1, 89.4],
	[-230.9, 357.2, 200.3, -141.1, -163.0, -7.8],
	[72.8, 68.6, 76.0, -141.4, -22.8, 13.2, -77.9],
	[80.5, -75.1, -4.7, 45.3, 13.9, 10.4, 1.7, 4.9],
	[24.4, 8.1, -14.5, -5.6, -19.3, 11.5, 10.9, -14.1, -3.7],
	[5.4, 9.4, 3.4, -5.2, 3.1, -12.4, -0.7, 8.4, -8.5, -10.1],
	[-2.0, -6.3, 0.9, -1.1, -0.2, 2.5, -0.3, 2.2, 3.1, -1.0, -2.8],
	[3.0, -1.5, -2.1, 1.7, -0.5, 0.5, -0.8, 0.4, 1.8, 0.1, 0.7, 3.8],
	[-2.2, -0.2, 0.3, 1.0, -0.6, 0.9, -0.1, 0.5, -0.4, -0.4, 0.2, -0.8, 0.0]];

GeoUtil.Declination.H_COEFF = [
	[0.0],
	[0.0, 4944.4],
	[0.0, -2707.7, -576.1],
	[0.0, -160.2, 251.9, -536.6],
	[0.0, 286.4, -211.2, 164.3, -309.1],
	[0.0, 44.6, 188.9, -118.2, 0.0, 100.9],
	[0.0, -20.8, 44.1, 61.5, -66.3, 3.1, 55.0],
	[0.0, -57.9, -21.1, 6.5, 24.9, 7.0, -27.7, -3.3],
	[0.0, 11.0, -20.0, 11.9, -17.4, 16.7, 7.0, -10.8, 1.7],
	[0.0, -20.5, 11.5, 12.8, -7.2, -7.4, 8.0, 2.1, -6.1, 7.0],
	[0.0, 2.8, -0.1, 4.7, 4.4, -7.2, -1.0, -3.9, -2.0, -2.0, -8.3],
	[0.0, 0.2, 1.7, -0.6, -1.8, 0.9, -0.4, -2.5, -1.3, -2.1, -1.9, -1.8],
	[0.0, -0.9, 0.3, 2.1, -2.5, 0.5, 0.6, 0.0, 0.1, 0.3, -0.9, -0.2, 0.9]];

GeoUtil.Declination.DELTA_G = [
	[0.0],
	[11.6, 16.5],
	[-12.1, -4.4, 1.9],
	[0.4, -4.1, -2.9, -7.7],
	[-1.8, 2.3, -8.7, 4.6, -2.1],
	[-1.0, 0.6, -1.8, -1.0, 0.9, 1.0],
	[-0.2, -0.2, -0.1, 2.0, -1.7, -0.3, 1.7],
	[0.1, -0.1, -0.6, 1.3, 0.4, 0.3, -0.7, 0.6],
	[-0.1, 0.1, -0.6, 0.2, -0.2, 0.3, 0.3, -0.6, 0.2],
	[0.0, -0.1, 0.0, 0.3, -0.4, -0.3, 0.1, -0.1, -0.4, -0.2],
	[0.0, 0.0, -0.1, 0.2, 0.0, -0.1, -0.2, 0.0, -0.1, -0.2, -0.2],
	[0.0, 0.0, 0.0, 0.1, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, -0.1, 0.0],
	[0.0, 0.0, 0.1, 0.1, -0.1, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, -0.1, 0.1]];

GeoUtil.Declination.DELTA_H = [
	[0.0],
	[0.0, -25.9],
	[0.0, -22.5, -11.8],
	[0.0, 7.3, -3.9, -2.6],
	[0.0, 1.1, 2.7, 3.9, -0.8],
	[0.0, 0.4, 1.8, 1.2, 4.0, -0.6],
	[0.0, -0.2, -2.1, -0.4, -0.6, 0.5, 0.9],
	[0.0, 0.7, 0.3, -0.1, -0.1, -0.8, -0.3, 0.3],
	[0.0, -0.1, 0.2, 0.4, 0.4, 0.1, -0.1, 0.4, 0.3],
	[0.0, 0.0, -0.2, 0.0, -0.1, 0.1, 0.0, -0.2, 0.3, 0.2],
	[0.0, 0.1, -0.1, 0.0, -0.1, -0.1, 0.0, -0.1, -0.2, 0.0, -0.1],
	[0.0, 0.0, 0.1, 0.0, 0.1, 0.0, 0.1, 0.0, -0.1, -0.1, 0.0, -0.1],
	[0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.1, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]];


GeoUtil.Declination.SCHMIDT_QUASI_NORM_FACTORS = function(maxN) {
	var schmidtQuasiNorm = new Array();
    schmidtQuasiNorm[0] = [1.0];
    for (var n = 1; n <= maxN; n++) {
        schmidtQuasiNorm[n] = new Array();
        schmidtQuasiNorm[n][0] = schmidtQuasiNorm[n - 1][0] * (2 * n - 1) / n;
        for (var m = 1; m <= n; m++) {
        	schmidtQuasiNorm[n][m] = schmidtQuasiNorm[n][m - 1] * Math.sqrt((n - m + 1) * (m == 1 ? 2 : 1) / (n + m));
        }
    }
    return schmidtQuasiNorm;
}(13);

GeoUtil.Declination.BASE_TIME = new Date(2010, 1, 1).getTime();


GeoUtil.Declination.LegendreTable = function(maxN, theta) {
	var mP = new Array();
	var mPDeriv = new Array();
	mP[0] = [1];
	mPDeriv[0] = [0];
	for(var n = 1; n <= maxN; n++) {
		mP[n] = new Array();
		mPDeriv[n] = new Array();
		for(var m = 0; m <= n; m++) {
			if(n == m) {
				mP[n][m] = Math.sin(theta) * mP[n - 1][m - 1];
                mPDeriv[n][m] = Math.cos(theta) * mP[n - 1][m - 1] + Math.sin(theta) * mPDeriv[n - 1][m - 1];
            } else if (n == 1 || m == n - 1) {
                mP[n][m] = Math.cos(theta) * mP[n - 1][m];
                mPDeriv[n][m] = -1*Math.sin(theta) * mP[n - 1][m] + Math.cos(theta) * mPDeriv[n - 1][m];
            } else {
                var k = ((n - 1) * (n - 1) - m * m) / ((2 * n - 1) * (2 * n - 3));
                mP[n][m] = Math.cos(theta) * mP[n - 1][m] - k * mP[n - 2][m];
                mPDeriv[n][m] = -1*Math.sin(theta) * mP[n - 1][m] + Math.cos(theta) * mPDeriv[n - 1][m] - k * mPDeriv[n - 2][m];
            }
        }
	}
	var obj = new Object();
	obj.mP = mP;
	obj.mPDeriv = mPDeriv;
	return obj;
}

GeoUtil.Declination.compute = function(gll) {
	var lat = gll.lat();
	var lng = gll.lng();
	if(lat > 89.9) lat = 89.9;
	if(lat < -89.9) lat = -89.9;
	
	var a2 = (org.sarsoft.map.datums["WGS84"].a/1000)*(org.sarsoft.map.datums["WGS84"].a/1000);
	var b2 = (org.sarsoft.map.datums["WGS84"].b/1000)*(org.sarsoft.map.datums["WGS84"].b/1000);

	var latr = GeoUtil.DegToRad(lat);
    var clat = Math.cos(latr);
    var slat = Math.sin(latr);
    var tlat = slat / clat;

	var latRad = Math.sqrt(a2 * clat * clat + b2 * slat * slat);
	
	var mLatRad = Math.atan(tlat * b2 / a2);
	var mLngRad = GeoUtil.DegToRad(lng);
	
	var radius = Math.sqrt((a2 * a2 * clat * clat + b2 * b2 * slat * slat) / (a2 * clat * clat + b2 * slat * slat));

	var legendre = GeoUtil.Declination.LegendreTable(13 - 1, (Math.PI / 2 - mLatRad));

    var relativeRadiusPower = new Array();
    relativeRadiusPower[0] = 1;
    relativeRadiusPower[1] = 6371.2 / radius;
    for (var i = 2; i < 15; ++i) {
        relativeRadiusPower[i] = relativeRadiusPower[i - 1] * relativeRadiusPower[1];
    }

    var sinMLon = new Array();
    var cosMLon = new Array();
    sinMLon[0] = 0;
    cosMLon[0] = 1;
    sinMLon[1] = Math.sin(mLngRad);
    cosMLon[1] = Math.cos(mLngRad);

    for (var m = 2; m < 13; ++m) {
        var x = m >> 1;
        sinMLon[m] = sinMLon[m - x] * cosMLon[x] + cosMLon[m - x] * sinMLon[x];
        cosMLon[m] = cosMLon[m - x] * cosMLon[x] - sinMLon[m - x] * sinMLon[x];
    }

    var inverseCosLatitude = 1 / Math.cos(mLatRad);
    var yearsSinceBase = (new Date().getTime() - GeoUtil.Declination.BASE_TIME) / (365 * 24 * 60 * 60 * 1000);

    var gcX = 0.0;
    var gcY = 0.0;
    var gcZ = 0.0;

    for (var n = 1; n < 13; n++) {
        for (var m = 0; m <= n; m++) {
            // Adjust the coefficients for the current date.
            var g = GeoUtil.Declination.G_COEFF[n][m] + yearsSinceBase * GeoUtil.Declination.DELTA_G[n][m];
            var h = GeoUtil.Declination.H_COEFF[n][m] + yearsSinceBase * GeoUtil.Declination.DELTA_H[n][m];

            gcX += relativeRadiusPower[n + 2] * (g * cosMLon[m] + h * sinMLon[m]) * legendre.mPDeriv[n][m] * GeoUtil.Declination.SCHMIDT_QUASI_NORM_FACTORS[n][m];
            gcY += relativeRadiusPower[n + 2] * m * (g * sinMLon[m] - h * cosMLon[m]) * legendre.mP[n][m] * GeoUtil.Declination.SCHMIDT_QUASI_NORM_FACTORS[n][m] * inverseCosLatitude;
            gcZ -= (n + 1) * relativeRadiusPower[n + 2] * (g * cosMLon[m] + h * sinMLon[m]) * legendre.mP[n][m] * GeoUtil.Declination.SCHMIDT_QUASI_NORM_FACTORS[n][m];
        }
    }

    var latDiffRad = GeoUtil.DegToRad(lat) - mLatRad;
    var mX = (gcX * Math.cos(latDiffRad) + gcZ * Math.sin(latDiffRad));
    var mY = gcY;
    var mZ = (-gcX * Math.sin(latDiffRad) + gcZ * Math.cos(latDiffRad));
    
    return GeoUtil.RadToDeg(Math.atan2(mY, mX));
}

