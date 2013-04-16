package org.sarsoft.imaging;

public class PDFSize {
	
	public double[] bbox;
	public float[] imgSize;
	public float[] pageSize;
	
	public PDFSize(float[] pageSize, float[] imgSize, double[] bbox) {
		this.imgSize = imgSize;
		this.pageSize = pageSize;
		this.bbox = bbox;
	}
	
}
