package org.sarsoft.imaging;

import org.sarsoft.common.gpx.StyledGeoObject;

public class PDFPage {
	
	private PDFDoc doc;
	String title;
	private StyledGeoObject[] markup;
	private double[] bounds;
	private String[] layers;
	private float[] opacity;
	
	public float px_multiplier;
	public float pdf_dpi;
	public float img_dpi;
	public int px_border;
	public float in_border;
	public float[] imageSize;
	public float[] pageSize;
	public float[] in_base;
	public int[] px_base;
	public float[] in_margin;
	public int[] px_img;
	
	public PDFPage(PDFDoc doc, String title, StyledGeoObject[] markup, double[] bounds, float[] imageSize, float[] pageSize) {
		this(doc, title, markup, bounds, imageSize, pageSize, null, null);
	}
	
	public PDFPage(PDFDoc doc, String title, StyledGeoObject[] markup, double[] bounds, float[] imageSize, float[] pageSize, String[] layers, float[] opacity) {
		this.doc = doc;
		this.title = title;
		this.markup = markup;
		this.bounds = bounds;
		this.layers = layers;
		this.opacity = opacity;

		this.imageSize = imageSize.clone();
		this.pageSize = pageSize.clone();
		
		pdf_dpi = 72f;
		img_dpi = 200f;		
		px_multiplier = img_dpi/100;
		px_border = 60;
		boolean[] grids = doc.getGrids();
		if(!grids[0] && !grids[1]) px_border = 0;
		else if((grids[0] || grids[1]) && !(grids[0] && grids[1])) px_border = 40;
		
		in_border = px_border/img_dpi;
		if(imageSize[0] * img_dpi > 3800) img_dpi = 3800 / imageSize[0];
		if(imageSize[1] * img_dpi > 3800) img_dpi = 3800 / imageSize[1];
		
		in_base = new float[] { imageSize[0] + in_border*2, 0.75f };
		px_base = new int[] { Math.round(in_base[0] * img_dpi), Math.round(in_base[1] * img_dpi)};
		in_margin = new float[] { (pageSize[0]-imageSize[0]-in_border*2)/2, (pageSize[1]-imageSize[1]-in_base[1]-in_border*2)/2 };
		px_img = new int[] { Math.round(imageSize[0] * img_dpi), Math.round(imageSize[1] * img_dpi) };
	}
	
	public PDFDoc getDoc() {
		return doc;
	}

	public String getTitle() {
		if(title == null) return "Mercator Projection";
		return title;
	}
	
	public StyledGeoObject[] getMarkup() {
		return markup;
	}
	
	public double[] getBounds() {
		return bounds;
	}
	
	public String[] getLayers() {
		if(layers == null) return doc.getLayers();
		return layers;
	}
	
	public float[] getOpacity() {
		if(opacity == null) return doc.getOpacity();
		return opacity;
	}

}
