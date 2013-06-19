package org.sarsoft.imaging;

import org.sarsoft.common.util.Datum;

public class PDFDoc {

	private Datum datum;
	private String[] layers;
	private float[] opacity;
	private int gridsize = 0;
	private boolean[] grids;
	private String mgrid;
	
	public PDFDoc(Datum datum, String[] layers, float[] opacity, boolean[] grids, int gridsize, String mgrid) {
		this.datum = datum;
		this.layers = layers.clone();
		this.opacity = opacity.clone();
		this.grids = grids.clone();
		this.gridsize = gridsize;
		this.mgrid = mgrid;
	}
	
	public Datum getDatum() {
		return datum;
	}
	
	public String[] getLayers() {
		return layers;
	}
	
	public float[] getOpacity() {
		return opacity;
	}
	
	public boolean[] getGrids() {
		return grids;
	}
	
	public String getMGrid() {
		return mgrid;
	}
	
	public int getGridSize() {
		return gridsize;
	}
	
}