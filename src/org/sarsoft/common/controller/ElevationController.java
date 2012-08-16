package org.sarsoft.common.controller;

import java.awt.Rectangle;
import java.awt.image.RenderedImage;
import java.io.File;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.media.jai.JAI;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.log4j.Logger;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.ServletRequestDataBinder;
import org.springframework.web.bind.annotation.InitBinder;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.support.ByteArrayMultipartFileEditor;
import org.springframework.web.multipart.support.StringMultipartFileEditor;

@Controller
public class ElevationController extends JSONBaseController {
		
	private static String EXTERNAL_TILE_DIR = "sardata/ned/elevation";
	private Logger logger = Logger.getLogger(ImageryController.class);
	
	@InitBinder
	public void initBinder(HttpServletRequest request, ServletRequestDataBinder binder) throws ServletException {
		binder.registerCustomEditor(String.class, new StringMultipartFileEditor());
		binder.registerCustomEditor(byte[].class, new ByteArrayMultipartFileEditor());
	}
	
	private float getElevation(double lat, double lng) {
		lng = Math.abs(lng);
		int blat = (int) Math.floor(lat);
		int blng = (int) Math.floor(lng);
		double olat = lat - blat;
		double olng = lng - blng;
				
		try {
			RenderedImage img = JAI.create("fileload", EXTERNAL_TILE_DIR + "/" + (blat+1) + (blng+1) + ".tif");
			int y = Math.max(Math.min(10800 - (int) Math.round(olat*10800), 10799), 0);
			int x = Math.max(Math.min(10800 - (int) Math.round(olng*10800), 10799), 0);
			return img.getData(new Rectangle(x, y, 1, 1)).getSampleFloat(x, y, 0);
		} catch (Exception e) {
			// return 0 if unable to read elevation
		}
		return 0F;
	}
	
	@SuppressWarnings({ "unchecked", "rawtypes" })
	@RequestMapping(value="/resource/elevation")
	public String getElevelation(Model model, HttpServletRequest request, HttpServletResponse response, @RequestParam(value="locations", required=true) String locations) {
		String[] coordinates = locations.split("\\|");
		List results = new ArrayList();
		for(String coordinate : coordinates) {
			String[] points = coordinate.split(",");
			double lat = Double.parseDouble(points[0]);
			double lng = Double.parseDouble(points[1]);
			Map m = new HashMap();
			Map l = new HashMap();
			l.put("lat", lat);
			l.put("lng", lng);
			m.put("location", l);
			m.put("elevation", getElevation(lat, lng));
			results.add(m);
		}
		Map r = new HashMap();
		r.put("results", results);
		r.put("status", "OK");
		return json(model, r);
	}

}
