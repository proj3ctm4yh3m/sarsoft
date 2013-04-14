package org.sarsoft.imaging;

import java.io.IOException;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.sarsoft.common.gpx.StyledGeoObject;

public interface IPDFMaker {

	public PDDocument create(PDFPage[] pages, boolean addOverview) throws IOException;
	public PDFPage makePage(PDFDoc doc, String title, StyledGeoObject[] markup, float[] size, int minscale);
	
}
