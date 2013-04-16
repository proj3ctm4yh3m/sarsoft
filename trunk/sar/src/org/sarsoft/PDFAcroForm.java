package org.sarsoft;

import java.io.IOException;
import java.util.List;
import java.util.Map;

import javax.servlet.ServletContext;

import org.apache.pdfbox.cos.COSArray;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.interactive.form.PDAcroForm;

public class PDFAcroForm {

	private String filename;
	private Map<String, String> values;
	private PDDocument doc;
	
	public PDFAcroForm(String filename, Map<String, String> values) {
		this.filename = filename;
		this.values = values;
	}
	
	public void write(ServletContext sc, PDDocument dest) throws IOException {
		doc = PDDocument.load(sc.getResourceAsStream("/" + filename + ".pdf"));
		PDAcroForm form = doc.getDocumentCatalog().getAcroForm();
		for(String name : values.keySet()) {
			String value = values.get(name);
			if(value != null) form.getField(name).setValue(value);
		}
		((COSArray) form.getDictionary().getDictionaryObject("Fields")).clear();
		PDPage from = (PDPage) doc.getDocumentCatalog().getAllPages().get(0);
		PDPage to = dest.importPage(from);
		to.setCropBox(from.findCropBox()); 
		to.setMediaBox(from.findMediaBox()); 
		to.setResources(from.findResources()); 
		to.setRotation(from.findRotation()); 
	}
	
	public void close() {
		if(doc != null) {
			try {
			doc.close();
			} catch (Exception e) {}
			doc = null;
		}
	}
	
	public static PDDocument create(ServletContext sc, List<PDFAcroForm> pages) throws IOException {
		PDDocument dest = new PDDocument();
		for(PDFAcroForm page : pages) {
			page.write(sc, dest);
		}
		return dest;
	}
	
	public static void close(List<PDFAcroForm> pages) {
		for(PDFAcroForm page : pages) {
			page.close();
		}
	}
	
}
