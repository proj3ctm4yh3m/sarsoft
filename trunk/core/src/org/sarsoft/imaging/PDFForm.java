package org.sarsoft.imaging;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;

import org.sarsoft.common.gpx.StyledGeoObject;
import org.sarsoft.common.gpx.StyledWay;
import org.sarsoft.common.util.Datum;

public class PDFForm {
	public String[] layers;
	public float[] opacity;
	public PDFSize[] sizes;
	public boolean[] grids;
	public int gridsize = 0;
	public String mgrid;
	public Datum datum;
	public boolean show_labels = true;
	public boolean fill_polygons = true;
	
	public PDFForm(Map parameters) {
		init(parameters);
	}
	
	private void init(Map parameters) {
		if(parameters.containsKey("layer")) {
			String p_layer = (String) parameters.get("layer");
			if(p_layer != null && p_layer.length() > 0) {
				layers = p_layer.split(",");
				opacity = new float[layers.length];
				for(int i = 0; i < layers.length; i++) {
					int idx = layers[i].indexOf("@");
					if(idx > 0) {
						opacity[i] = Float.parseFloat(layers[i].substring(idx+1))/100;
						layers[i] = layers[i].substring(0, idx);
					} else {
						opacity[i] = 1f;
					}
				}
			}
		}
		
		datum = "NAD27".equals(parameters.get("datum")) ? Datum.NAD27 : Datum.WGS84;
		
		String p_grids = (String) parameters.get("grids");
		grids = (p_grids == null ? new boolean[] { false, false} : new boolean[] { p_grids.indexOf("utm") >= 0 || p_grids.indexOf("usng") >= 0, p_grids.indexOf("dd") >= 0});
		mgrid = (p_grids == null ? null : (p_grids.indexOf("utm") >= 0 ? "utm" : "usng"));
		
		String p_gridsize = (String) parameters.get("gridsize");
		gridsize = (p_gridsize == null ? 0 : Integer.parseInt(p_gridsize));
		
		String p_cfg = (String) parameters.get("cfg");
		if(p_cfg != null && p_cfg.length() > 0) {
			String[] cfgs = p_cfg.split(",");
			for(String cfg : cfgs) {
				if("label".equals(cfg.split("_")[0])) show_labels = Boolean.parseBoolean(cfg.split("_")[1]);
				if("poly".equals(cfg.split("_")[0])) fill_polygons = Boolean.parseBoolean(cfg.split("_")[1]);
			}
		}
		
		int i = 0;
		List<PDFSize> sizelist = new ArrayList<PDFSize>();
		while((String) parameters.get("bbox" + (i == 0 ? "" : i)) != null && i < 15) {
			String suffix = (i == 0 ? "" : Integer.toString(i)); 
			String p_bbox = (String) parameters.get("bbox" + suffix);
			String p_pageSize = (String) parameters.get("pageSize" + suffix);
			String p_imgSize = (String) parameters.get("imgSize" + suffix);
			String[] bb = p_bbox.split(",");
			
			sizelist.add(new PDFSize(new float[] { Float.parseFloat(p_pageSize.split(",")[0]), Float.parseFloat(p_pageSize.split(",")[1])},
					new float[] { Float.parseFloat(p_imgSize.split(",")[0]), Float.parseFloat(p_imgSize.split(",")[1])},
					new double[] {Double.parseDouble(bb[0]), Double.parseDouble(bb[1]), Double.parseDouble(bb[2]), Double.parseDouble(bb[3])}));
			
			i++;
		}
		
		String p_pageSize = (String) parameters.get("pageSize");
		if(sizelist.size() == 0) {
			if(p_pageSize != null && p_pageSize.length() > 0) {
				sizelist.add(new PDFSize(new float[] { Float.parseFloat(p_pageSize.split(",")[0]), Float.parseFloat(p_pageSize.split(",")[1])}, null, null));
			} else {
				sizelist.add(new PDFSize(new float[] { 8.5f, 11f }, null, null));
			}
			
			if(p_grids == null || p_grids.length() == 0) grids = new boolean[] { true, false };
		}
		
		sizes = sizelist.toArray(new PDFSize[sizelist.size()]);
	}

	public void transform(List<StyledGeoObject> markup) {
		for(StyledGeoObject item : markup) {
			if(!show_labels) item.setName(null);
			if(!fill_polygons && item instanceof StyledWay) ((StyledWay) item).setFill(0f);
		}
	}

}
