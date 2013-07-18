package org.sarsoft.common.util;

public class ImageMercator {
	
	private int w;
	private int h;
	
	private double[] ll_sw;
	private double[] ll_ne;
	
	private double[] m_sw;
	private double[] m_ne;
	
	public ImageMercator(int[] size, double[] sw, double[] ne) {
		w = size[0];
		h = size[1];
		
		ll_sw = sw.clone();
		ll_ne = ne.clone();
		
		m_sw = WebMercator.LatLngToMeters(ll_sw[0], ll_sw[1]);
		m_ne = WebMercator.LatLngToMeters(ll_ne[0], ll_ne[1]);
	}
	
	public int[] ll2pixel(double lat, double lng) {
		double[] m = WebMercator.LatLngToMeters(lat, lng);
		int x = (int) Math.round(w * ((m[0] - m_sw[0]) / (m_ne[0] - m_sw[0])));
		int y = (int) Math.round(h * ((m[1] - m_sw[1]) / (m_ne[1] - m_sw[1])));
		return new int[] { x, y };
	}
	
	public double[] pixel2ll(int x, int y) {
		double mx = m_sw[0] + (x/w)*(m_ne[0] - m_sw[0]);
		double my = m_sw[1] + (y/h)*(m_ne[1] - m_sw[1]);
		return WebMercator.MetersToLatLng(mx, my);
	}
	
	public int getWidth() {
		return w;
	}
	
	public int getHeight() {
		return h;
	}

}
