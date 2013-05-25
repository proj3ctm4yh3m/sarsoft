package org.sarsoft.imaging;

import java.io.IOException;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.sarsoft.common.util.Datum;

public class PDFDoc {

	private Datum datum;
	private String[] layers;
	private float[] opacity;
	private boolean[] grids;
	private String mgrid;
	
	public PDFDoc(Datum datum, String[] layers, float[] opacity, boolean[] grids, String mgrid) throws IOException {
		this.datum = datum;
		this.layers = layers.clone();
		this.opacity = opacity.clone();
		this.grids = grids.clone();
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
	
}