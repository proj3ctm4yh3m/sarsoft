package org.sarsoft;

import java.io.IOException;
import java.util.List;
import java.util.Map;

import javax.servlet.ServletContext;

import org.apache.pdfbox.cos.COSArray;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.interactive.form.PDAcroForm;
import org.apache.pdfbox.pdmodel.interactive.form.PDField;

public class PDFAcroForm {

	private String filename;
	private Map<String, String> values;
	private PDDocument doc;
	
	public PDFAcroForm(String filename, Map<String, String> values) {
		this.filename = filename;
		this.values = values;
	}
	
	@SuppressWarnings("unchecked")
	public int write(ServletContext sc, PDDocument dest, int id) throws IOException {
		doc = PDDocument.load(sc.getResourceAsStream("/" + filename + ".pdf"));
		PDAcroForm form = doc.getDocumentCatalog().getAcroForm();
		for(String name : values.keySet()) {
			String value = values.get(name);
			if(value != null && form.getField(name) != null) {
				form.getField(name).setValue(value);
				form.getField(name).setPartialName("_super_secret_id_" + (id++));
			}
		}
		
		((COSArray) form.getDictionary().getDictionaryObject("Fields")).clear();
		PDPage from = (PDPage) doc.getDocumentCatalog().getAllPages().get(0);
		PDPage to = dest.importPage(from);
		
		to.setCropBox(from.findCropBox()); 
		to.setMediaBox(from.findMediaBox()); 
		to.setResources(from.findResources()); 
		to.setRotation(from.findRotation());
		return id;
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
		int id = 0;
		for(PDFAcroForm page : pages) {
			id = page.write(sc, dest, id);
		}
		return dest;
	}
	
	public static void close(List<PDFAcroForm> pages) {
		for(PDFAcroForm page : pages) {
			page.close();
		}
	}
	
}
