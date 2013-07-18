package org.sarsoft.common.controller;

import java.awt.AlphaComposite;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.IOException;

import javax.imageio.ImageIO;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.log4j.Logger;
import org.sarsoft.common.model.GeoRef;
import org.sarsoft.common.model.MapSource;
import org.sarsoft.common.util.ImageMercator;
import org.sarsoft.common.util.RuntimeProperties;
import org.sarsoft.common.util.TileService;
import org.sarsoft.common.util.WebMercator;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.ServletRequestDataBinder;
import org.springframework.web.bind.annotation.InitBinder;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.support.ByteArrayMultipartFileEditor;
import org.springframework.web.multipart.support.StringMultipartFileEditor;

@Controller
public class ImageryController extends JSONBaseController {
		
	private Logger logger = Logger.getLogger(ImageryController.class);
	public TileService tileservice;
	
	@Value(value="${sarsoft.map.localTileStore:}")
	public void setLocalTileStore(String localTileStore) {
		tileservice = new TileService(localTileStore);
	}
	
	@InitBinder
	public void initBinder(HttpServletRequest request, ServletRequestDataBinder binder) throws ServletException {
		binder.registerCustomEditor(String.class, new StringMultipartFileEditor());
		binder.registerCustomEditor(byte[].class, new ByteArrayMultipartFileEditor());
	}
	
	public int setAlpha(int color, int a) {
		return (color & 0x00FFFFFF) | (a << 24);
	}
	
	public int makeRGBA(int r, int g, int b, int a) {
		return (a << 24) | (r << 16) | (g << 8) | b;
	}

	public void respond(BufferedImage image, HttpServletResponse response) {
		if(image == null) {
			try {
				response.sendError(HttpServletResponse.SC_NOT_FOUND);
				return;
			} catch (Exception e2) {}
			logger.error("Unable to send SC_NOT_FOUND to client");
		}

		response.setContentType("image/png");
		response.setHeader("Cache-Control", "max-age=432000, public");

		try {
			ImageIO.write(image, "png", response.getOutputStream());
		} catch (Exception e) {
			if(e.getClass() != java.net.SocketException.class) logger.error("Error sending image response", e);
		} finally {
			image.getGraphics().dispose();
		}
	}
	
	public BufferedImage superTile(String[] layers, float[] opacity, int z, int x, int y) {
		BufferedImage image = new BufferedImage(1024, 1024, BufferedImage.TYPE_3BYTE_BGR);
		Graphics2D graphics = image.createGraphics();
		graphics.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
		graphics.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
		graphics.setBackground(new Color(255, 255, 255, 0));
		graphics.clearRect(0, 0, 1024, 1024);		

		for(int i = 0; i < layers.length; i++) {
			String layer = layers[i];
			String cfg = "";
			
			if(layer.indexOf("_") > 0) {
				cfg = layer.split("_")[1];
				layer = layer.split("_")[0];
			}
			MapSource source = RuntimeProperties.getMapSourceByAlias(layer);
			
			if(source.getType() == MapSource.Type.WMS) {
				double[] bounds = WebMercator.TileLatLngBounds(x, WebMercator.GoogleY(y, z), z);
				BufferedImage tile = tileservice.getWMS(source, bounds, 1024, true);
				graphics.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, source.isAlphaOverlay() ? opacity[i] * source.getOpacity() / 100 : opacity[i])); 
				graphics.drawImage(tile, 0, 0, 1024, 1024, 0, 0, 1024, 1024, null);
			} else {
				for(int dx = 0; dx < 4; dx++) {
					for(int dy = 0; dy < 4; dy++) {
						try {
							BufferedImage tile = tileservice.getTile(source, cfg, z+2, x*4+dx, y*4+dy);
							graphics.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, source.isAlphaOverlay() ? opacity[i] * source.getOpacity() / 100 : opacity[i])); 
							graphics.drawImage(tile, 256*dx, 256*dy, 256*(dx+1), 256*(dy+1), 0, 0, 255, 255, null);
						} catch (Exception e) {
							// don't write missing or corrupted tiles
						}
					}
				}
			}
		}
		
		return image;
	}



	@RequestMapping(value="/resource/imagery/tiles/{alias}/{z}/{x}/{y}.png", method = RequestMethod.GET)
	public void getTile(HttpServletResponse response, @PathVariable("alias") String alias, @PathVariable("z") int z, @PathVariable("x") int x, @PathVariable("y") int y) {
		String cfg = null;
		if(alias.indexOf("_") > 0) {
			cfg = alias.split("_")[1];
			alias = alias.split("_")[0];
		}
		MapSource source = RuntimeProperties.getMapSourceByAlias(alias);
		if(source != null && ((Boolean.valueOf(getProperty("sarsoft.map.overzoom.enabled")) && z > source.getMaxresolution()) || source.getTemplate().startsWith("/"))) {
			respond(tileservice.getTile(source, cfg, z, x, y), response);
		}
	}
	
	@RequestMapping(value="/resource/imagery/local/{alias}/{z}/{x}/{y}.png", method = RequestMethod.GET)
	public void getLocalTile(HttpServletResponse response, @PathVariable("alias") String alias, @PathVariable("z") int z, @PathVariable("x") int x, @PathVariable("y") int y) {
		respond(tileservice.getImage("/resource/imagery/tiles/" + alias + "/" + z + "/" + x + "/" + y + ".png", false), response);
	}
	
	@RequestMapping(value="/resource/imagery/compositetile/{layers}/{z}/{x}/{y}.png", method = RequestMethod.GET)
	public void getCompositeTile(HttpServletResponse response, HttpServletRequest request, @PathVariable("layers") String layer, @PathVariable("z") int z, @PathVariable("x") int x, @PathVariable("y") int y) {
		String[] layers = layer.split(",");
		float[] opacity = new float[layers.length];
		String[] cfg = new String[layers.length];

		for(int i = 0; i < layers.length; i++) {
    		int idx = layers[i].indexOf("@");
    		if(idx > 0) {
    			opacity[i] = Float.parseFloat(layers[i].substring(idx+1))/100;
    			layers[i] = layers[i].substring(0, idx);
    		} else {
    			opacity[i] = 1f;
    		}
    		if(layers[i].indexOf("_") > 0) {
    			cfg[i] = layers[i].split("_")[1];
    			layers[i] = layers[i].split("_")[0];
    		}
    	}

		BufferedImage[] images = new BufferedImage[layers.length];
		for(int i = 0; i < layers.length; i++) {
			MapSource source = RuntimeProperties.getMapSourceByAlias(layers[i]);
			images[i] = tileservice.getTile(source, cfg[i], z, x, y);
    		if(source.isAlphaOverlay()) opacity[i] = opacity[i] * source.getOpacity() / 100;  		
		}
		respond(tileservice.composite(images, opacity, 256, 256), response);
	}
	
    @RequestMapping(value="/resource/imagery/supertile/{layer}/{z}/{x}/{y}", method = RequestMethod.GET)
    public void getSuperTile(HttpServletResponse response, HttpServletRequest request, @PathVariable("layer") String layerNames, @PathVariable("z") int z, @PathVariable("x") int x, @PathVariable("y") int y) {
    	String[] layers = layerNames.split(",");
    	float[] opacity = new float[layers.length];
    	
    	for(int i = 0; i < layers.length; i++) {
    		int idx = layers[i].indexOf("@");
    		if(idx > 0) {
    			opacity[i] = Float.parseFloat(layers[i].substring(idx+1))/100;
    			layers[i] = layers[i].substring(0, idx);
    		} else {
    			opacity[i] = 1f;
    		}
    		String layer = layers[i];
    	}

		respond(superTile(layers, opacity, z, x, y), response);
    }
 
	@RequestMapping(value="/resource/imagery/icons/circle/{rgb}.png", method = RequestMethod.GET)
	public void getCircle(HttpServletResponse response, @PathVariable("rgb") String rgb) {
		response.setContentType("image/png");
		response.setHeader("Cache-Control", "max-age=3600, public");

		if(rgb == null || rgb.length() < 6) rgb = "000000";
		int r = Integer.parseInt(rgb.substring(0, 2), 16);
		int g = Integer.parseInt(rgb.substring(2, 4), 16);
		int b = Integer.parseInt(rgb.substring(4, 6), 16);
		
		BufferedImage image = new BufferedImage(12, 12, BufferedImage.TYPE_INT_ARGB);
		Graphics2D graphics = (Graphics2D) image.getGraphics();
		graphics.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
		graphics.setBackground(new Color(255, 255, 255, 0));
		graphics.setColor(new Color(r, g, b));
		graphics.clearRect(0, 0, 12, 12);
		graphics.fillOval(1, 1, 10, 10);
		graphics.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_SPEED);
		graphics.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
		try {
			ImageIO.write(image, "png", response.getOutputStream());
		} catch (IOException e) {
			logger.error("Error writing circle icon " + rgb + " to client", e);
		}
		graphics.dispose();
		image.flush();
	}
	
	public BufferedImage projectGeoRef(GeoRef gr, BufferedImage src, double[] sw, double[] ne, int[] dest_size) {
		int[] src_size = new int[] { src.getWidth(), src.getHeight() };
		ImageMercator projection = new ImageMercator(dest_size, WebMercator.MetersToLatLng(sw[0], sw[1]), WebMercator.MetersToLatLng(ne[0], ne[1]));
		double[] transform = gr.transform(src_size, projection);
		
		BufferedImage dest = new BufferedImage(dest_size[0], dest_size[1], BufferedImage.TYPE_INT_ARGB);
		Graphics2D graphics = dest.createGraphics();
		graphics.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_NEAREST_NEIGHBOR);
		graphics.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
		graphics.setBackground(new Color(255, 255, 255, 0));
		graphics.clearRect(0, 0, dest_size[0], dest_size[1]);
		
		graphics.translate((int) transform[2], (int) transform[3]);
		graphics.rotate(transform[0], (int) (src_size[0]*transform[1]/2), (int) (src_size[1]*transform[1]/2));
		graphics.scale(transform[1], transform[1]);
		
		graphics.drawImage(src, 0, 0, src_size[0], src_size[1], null);
		return dest;
	}
	
	@RequestMapping(value="/resource/imagery/georef/", method = RequestMethod.GET)
	public void getGeoTile(HttpServletRequest request, HttpServletResponse response) {
		GeoRef gr = new GeoRef();
		gr.setUrl("http://mattj.net/mb.jpg");
		gr.setLat1(37.31491);
		gr.setLng1(-122.18716);
		gr.setLat2(37.32473);
		gr.setLng2(-122.16778);
		gr.setX1(542);
		gr.setY1(534);
		gr.setX2(2461);
		gr.setY2(2606);
	}
	
}
