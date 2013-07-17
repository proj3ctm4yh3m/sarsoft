package org.sarsoft.common.controller;

import java.awt.Rectangle;
import java.awt.image.BufferedImage;
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
import javax.servlet.http.HttpSession;

import org.apache.log4j.Logger;
import org.sarsoft.common.model.Waypoint;
import org.sarsoft.common.util.RuntimeProperties;
import org.sarsoft.common.util.WebMercator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.ServletRequestDataBinder;
import org.springframework.web.bind.annotation.InitBinder;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.support.ByteArrayMultipartFileEditor;
import org.springframework.web.multipart.support.StringMultipartFileEditor;

@Controller
public class ElevationController extends JSONBaseController {
		
	private static String EXTERNAL_TILE_DIR = "sardata/elevation";
	private Logger logger = Logger.getLogger(ImageryController.class);
	
	@Autowired
	private ImageryController imageryController;
	
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
			try {
				int[] tilexy = getTileXY(lat, -1*lng, 14);
				int x = tilexy[0];
				int y = tilexy[1];
				int px_x = tilexy[2];
				int px_y = tilexy[3];
				BufferedImage elevation = imageryController.tileservice.getTile(RuntimeProperties.getMapSourceByAlias("elevation"), null, 14, x, y);
				return elevation.getData().getSample(px_x, px_y, 0);
			} catch (Exception e2) {
			}
		}
		// return 0 if unable to read elevation
		return 0F;
	}
	
	private int[] getTileXY(double lat, double lng, int z) {
		double[] meters = WebMercator.LatLngToMeters(lat, lng);
		double[] pixels = WebMercator.MetersToPixels(meters[0], meters[1], z);
		double[] t = WebMercator.PixelsToDecimalTile(pixels[0], pixels[1]);
		
    	t[1] = Math.pow(2, z) - t[1];
		int px_x = (int) Math.min(Math.round((t[0]-Math.floor(t[0]))*256), 255);
		int px_y = (int) Math.min(Math.round((t[1]-Math.floor(t[1]))*256), 255);
		
		int x = (int) Math.floor(t[0]);
		int y = (int) Math.floor(t[1]);
		
		return new int[] { x, y, px_x, px_y };
	}
	
	private int[] getDEM(double lat, double lng, int z) {
		int[] tilexy = getTileXY(lat, lng, z);
		int x = tilexy[0];
		int y = tilexy[1];
		int px_x = tilexy[2];
		int px_y = tilexy[3];
		    
		BufferedImage elevation = imageryController.tileservice.getTile(RuntimeProperties.getMapSourceByAlias("elevation"), null, z, x, y);
		BufferedImage slope = imageryController.tileservice.getTile(RuntimeProperties.getMapSourceByAlias("slope"), null, z, x, y);
		BufferedImage aspect = imageryController.tileservice.getTile(RuntimeProperties.getMapSourceByAlias("aspect"), null, z, x, y);
		return new int[] {elevation.getData().getSample(px_x, px_y, 0), slope.getData().getSample(px_x, px_y, 0), aspect.getData().getSample(px_x, px_y, 0)};
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
	
	@SuppressWarnings({ "unchecked", "rawtypes" })
	@RequestMapping(value="/resource/dem")
	public String getDEM(Model model, HttpServletRequest request, HttpServletResponse response, @RequestParam(value="locations", required=true) String locations) {
		String[] coordinates = locations.split("\\|");
		int zoom = 14;
		if(coordinates.length > 5) {
			double[] m1 = WebMercator.LatLngToMeters(Double.parseDouble(coordinates[0].split(",")[0]), Double.parseDouble(coordinates[0].split(",")[1]));
			double[] m2 = WebMercator.LatLngToMeters(Double.parseDouble(coordinates[1].split(",")[0]), Double.parseDouble(coordinates[1].split(",")[1]));
			
			zoom = 8;
			double spacing = Math.sqrt(Math.pow(m1[0]-m2[0], 2) + Math.pow(m1[1]-m2[1], 2)); // meters
			for(int z = 14; z >= 8; z--) {
				if(WebMercator.Resolution(z) * 2 < spacing) zoom = z;
			}
		}
		
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
			int[] dem = getDEM(lat, lng, zoom);
			m.put("elevation", dem[0]);
			m.put("slope", dem[1]);
			m.put("aspect", (int) (dem[2]*1.5));
			results.add(m);
		}
		Map r = new HashMap();
		r.put("results", results);
		r.put("status", "OK");
		return json(model, r);
	}
	
	@RequestMapping(value="/profile", method=RequestMethod.GET)
	public String profile(Model model, HttpServletRequest request) {
		return app(model, "/profile");
	}

}
