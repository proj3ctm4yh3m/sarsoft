package org.sarsoft.common.controller;

import java.awt.AlphaComposite;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.URL;
import java.net.URLConnection;
import java.util.List;
import java.util.zip.ZipEntry;
import java.util.zip.ZipFile;

import javax.imageio.ImageIO;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import net.sf.ehcache.Cache;
import net.sf.ehcache.CacheManager;
import net.sf.ehcache.Element;
import net.sf.json.JSONObject;

import org.apache.log4j.Logger;
import org.sarsoft.common.model.Action;
import org.sarsoft.common.model.GeoRef;
import org.sarsoft.common.model.MapSource;
import org.sarsoft.common.util.RuntimeProperties;
import org.sarsoft.common.util.WebMercator;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.ServletRequestDataBinder;
import org.springframework.web.bind.annotation.InitBinder;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.multipart.support.ByteArrayMultipartFileEditor;
import org.springframework.web.multipart.support.StringMultipartFileEditor;

@Controller
public class ImageryController extends JSONBaseController {
		
	private static String EXTERNAL_TILE_DIR = null;
	private Logger logger = Logger.getLogger(ImageryController.class);
	
	@InitBinder
	public void initBinder(HttpServletRequest request, ServletRequestDataBinder binder) throws ServletException {
		binder.registerCustomEditor(String.class, new StringMultipartFileEditor());
		binder.registerCustomEditor(byte[].class, new ByteArrayMultipartFileEditor());
	}

	protected InputStream getLocalTileInputStream(String layer, int z, int x, int y) {
		InputStream in = null;
		String tile =  layer + "/" + z + "/" + x + "/" + y + ".png";
		if(EXTERNAL_TILE_DIR == null) EXTERNAL_TILE_DIR = getProperty("sarsoft.map.localTileStore");
		File file = new File(EXTERNAL_TILE_DIR + "/" + tile);
		if(file.exists()) {
			try {
				in = new FileInputStream(file);
			} catch (Exception e) {
				in = null;
			}
		}
		String parentDir = EXTERNAL_TILE_DIR;
		while(in == null && tile.contains("/")) {
			parentDir = parentDir + "/" + tile.substring(0, tile.indexOf("/"));
			tile = tile.substring(tile.indexOf("/") + 1);
			try {
				ZipFile zipFile = new ZipFile(parentDir + ".zip");
				ZipEntry entry = zipFile.getEntry(tile);
				in = zipFile.getInputStream(entry);
			} catch (Exception e) {
				in = null;
			}
		}
		return in;
	}

	protected InputStream getRemoteTileInputStream(String url, int z, int x, int y) {
		url = url.replaceAll("\\{Z\\}", Integer.toString(z));
		url = url.replaceAll("\\{X\\}", Integer.toString(x));
		url = url.replaceAll("\\{Y\\}", Integer.toString(y));
		url = url.replaceAll("\\{V\\}", "s-11111111");
		Cache cache = CacheManager.getInstance().getCache("tileCache");

		byte[] array = null;
		Element element = cache.get(url);
		if(element != null) {
			return new ByteArrayInputStream((byte[]) element.getValue()); 
		}
		try {
			URLConnection connection = new URL(url).openConnection();
			InputStream in = connection.getInputStream();
			ByteArrayOutputStream out = new ByteArrayOutputStream(connection.getContentLength() == -1 ? 40000 : connection.getContentLength());
			byte[] bytes = new byte[512];
			while(true) {
				int len = in.read(bytes);
				if(len == -1) break;
				out.write(bytes, 0, len);
			}
			in.close();
			array = out.toByteArray();
			element = new Element(url, array);
			cache.put(element);
			return new ByteArrayInputStream(array);
		} catch (Exception e) {
			e.printStackTrace();
		}
		return null;
	}
	
	protected BufferedImage getTile(String url, int z, int x, int y) {
		if(url.indexOf("/resource/imagery/tiles/") == 0) {
			url = url.substring(24, url.length() - 16);
			return streamToImage(getLocalTileInputStream(url, z, x, y));
		} else {
			return streamToImage(getRemoteTileInputStream(url, z, x, y));
		}
	}
		
	public BufferedImage streamToImage(InputStream stream) {
		try {
			return ImageIO.read(stream);
		} catch (IOException e) {
			e.printStackTrace();
		}
		return null;
	}
	
	public InputStream imageToInputStream(BufferedImage image) {
		try {
			ByteArrayOutputStream out = new ByteArrayOutputStream();
			ImageIO.write(image, "png", out);
			return new ByteArrayInputStream(out.toByteArray());
		} catch (IOException e) {
			e.printStackTrace();
		}
		return null;
	}
	
	public void respond(BufferedImage image, HttpServletResponse response) {
		respond(imageToInputStream(image), response);
	}

	public void respond(InputStream in, HttpServletResponse response) {
		if(in == null) {
			try {
				response.sendError(HttpServletResponse.SC_NOT_FOUND);
				return;
				} catch (Exception e2) {}
				logger.error("Unable to send SC_NOT_FOUND to client");
		}

		response.setContentType("image/png");
		OutputStream out = null;
		byte[] bytes = new byte[512];
		int bytesRead;
		response.setHeader("Cache-Control", "max-age=432000, public");

		try {
			out = response.getOutputStream();
			while ((bytesRead = in.read(bytes)) != -1) {
			    out.write(bytes, 0, bytesRead);
			}
		} catch (Exception e) {
			if(e.getClass() != java.net.SocketException.class) logger.error("Error sending image response", e);
		} finally {
			try { if(in != null) in.close(); } catch(Exception e) {
				logger.error("Doubly bad error closing inputstream for image response", e);
			}
		}
	}

	
	
	protected BufferedImage zoom(BufferedImage original, int dz, int dx, int dy) {
		int tilesize = 256 / ((int) Math.pow(2, dz));
		BufferedImage zoomed = new BufferedImage(256, 256, BufferedImage.TYPE_4BYTE_ABGR);
		Graphics2D g = zoomed.createGraphics();
		g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_NEAREST_NEIGHBOR);
		g.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_SPEED);
		g.setBackground(new Color(255, 255, 255, 0));
		g.clearRect(0, 0, 256, 256);

		g.drawImage(original, 0, 0, 256, 256, dx*tilesize, dy*tilesize, (dx+1)*tilesize, (dy+1)*tilesize, null);
		return zoomed;
	}
	
	protected BufferedImage composite(BufferedImage[] images, float[] opacity, int width, int height) {
		BufferedImage composited = new BufferedImage(width, height, BufferedImage.TRANSLUCENT);
		Graphics2D graphics = composited.createGraphics();
		graphics.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
		graphics.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
		graphics.setBackground(new Color(255, 255, 255, 0));
		graphics.clearRect(0, 0, width, height);
		for(int i = 0; i < images.length; i++) {
			graphics.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, opacity[i])); 
			graphics.drawImage(images[i], 0, 0, width, height, 0, 0, width, height, null);
		}
		return composited;
	}
	
	public BufferedImage superTile(String[] layers, float[] opacity, int z, int x, int y) {		
		BufferedImage[] joint = new BufferedImage[layers.length];
		Graphics2D[] g = new Graphics2D[layers.length];
		
		for(int i = 0; i < layers.length; i++) {
			joint[i] = new BufferedImage(1024, 1024, BufferedImage.TYPE_4BYTE_ABGR);
			g[i] = joint[i].createGraphics();
			g[i].setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_NEAREST_NEIGHBOR);
			g[i].setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
			g[i].setBackground(new Color(255, 255, 255, 0));
			g[i].clearRect(0, 0, 1024, 1024);
			MapSource source = RuntimeProperties.getMapSourceByAlias(layers[i]);
			
			try {
			for(int dx = 0; dx < 4; dx++) {
				for(int dy = 0; dy < 4; dy++) {
					BufferedImage tile = ImageIO.read(getRemoteTileInputStream(source.getTemplate(), z+2, x*4+dx, y*4+dy));
					g[i].drawImage(tile, 256*dx, 256*dy, 256*(dx+1), 256*(dy+1), 0, 0, 255, 255, null);
				}
			}
			} catch (IOException e) {
				e.printStackTrace();
			}
		}
		
		BufferedImage supertile = composite(joint, opacity, 1024, 1024);
		for(int i = 0; i < g.length; i++) {
			g[i].dispose();
		}
		
		return supertile;
	}

	public BufferedImage retile(String[] layers, float[] opacity, double[] m_sw, double[] m_ne, int width, int height) {
		int z = 1;
		double r = WebMercator.Resolution(z);
		double r_target = Math.sqrt(Math.pow(m_ne[0] - m_sw[0], 2) + Math.pow(m_ne[1] - m_sw[1], 2)) / Math.sqrt(Math.pow(width, 2) + Math.pow(height, 2));
		while(z <= 16 && r > r_target) { // r is meters/px
			z++;
			r = WebMercator.Resolution(z);
		}
		
		double[] px_ne = WebMercator.MetersToPixels(m_ne[0], m_ne[1], z);
		double[] px_sw = WebMercator.MetersToPixels(m_sw[0], m_sw[1], z);
		
		double[] t_ne = WebMercator.PixelsToDecimalTile(px_ne[0], px_ne[1]);
		double[] t_sw = WebMercator.PixelsToDecimalTile(px_sw[0], px_sw[1]);
		
    	t_ne[1] = Math.pow(2, z) - 1 - t_ne[1];
    	t_sw[1] = Math.pow(2, z) - 1 - t_sw[1];

		double p_dx = ((t_ne[0] - t_sw[0])*256);
		double p_dy = ((t_sw[1] - t_ne[1])*256);

		double scale = Math.min(width/p_dx, height/p_dy);
		width = (int) Math.round(scale*p_dx);
		height = (int) Math.round(scale*p_dy);
		
		BufferedImage[] joint = new BufferedImage[layers.length];
		Graphics2D[] g = new Graphics2D[layers.length];
		MapSource[] sources = new MapSource[layers.length];
		String[] cfg = new String[layers.length];
		
		for(int i = 0; i < layers.length; i++) {
			String layer = layers[i];
			joint[i] = new BufferedImage(width, height, BufferedImage.TYPE_4BYTE_ABGR);
			g[i] = joint[i].createGraphics();
			g[i].setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
			g[i].setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
			g[i].setBackground(new Color(255, 255, 255, 0));
			g[i].clearRect(0, 0, width, height);
			if(layer.indexOf("_") > 0) {
				cfg[i] = layer.split("_")[1];
				layer = layer.split("_")[0];
			}
			sources[i] = RuntimeProperties.getMapSourceByAlias(layer);
		}

		for(int x = (int) Math.floor(t_sw[0]); x <= (int) Math.floor(t_ne[0]); x++) {
			for(int y = (int) Math.floor(t_ne[1]); y <= (int) Math.floor(t_sw[1]); y++) {
				int dx1 = (int) Math.floor((((double) x - t_sw[0])*scale)*256);
				int dy1 = (int) Math.floor((((double) y - t_ne[1])*scale)*256);
				int dx2 = (int) Math.ceil((((double) x+1 - t_sw[0])*scale)*256);
				int dy2 = (int) Math.ceil((((double) y+1 - t_ne[1])*scale)*256);
				
				dx1 = Math.max(dx1, 0);
				dy1 = Math.max(dy1, 0);
				dx2 = Math.min(dx2, width);
				dy2 = Math.min(dy2, height);

				int sx1 = 0;
				int sy1 = 0;
				int sx2 = 256;
				int sy2 = 256;

				if(x == Math.floor(t_sw[0])) sx1 = (int) ((t_sw[0] - (double) x) * 256);
				if(y == Math.floor(t_ne[1])) sy1 = (int) ((t_ne[1] - (double) y) * 256);

				if(x == Math.floor(t_ne[0])) sx2 = (int) ((t_ne[0] - (double) x) * 256);
				if(y == Math.floor(t_sw[1])) sy2 = (int) ((t_sw[1] - (double) y) * 256);

				for(int i = 0; i < layers.length; i++) {
					String template = sources[i].getTemplate();
					template = template.replaceAll("\\{V\\}", cfg[i]);
					InputStream is = getRemoteTileInputStream(template, z, x, y);
					if(is != null) {
						BufferedImage tile = streamToImage(is);
						g[i].drawImage(tile, dx1, dy1, dx2, dy2, sx1, sy1, sx2, sy2, null);
					}
				}
			}
		}

		BufferedImage image = composite(joint, opacity, width, height);
		for(int i = 0; i < g.length; i++) {
			g[i].dispose();
		}

		return image;
	}


	@RequestMapping(value="/resource/imagery/tiles/{layer}/{z}/{x}/{y}.png", method = RequestMethod.GET)
	public void getTile(HttpServletResponse response, @PathVariable("layer") String layer, @PathVariable("z") int z, @PathVariable("x") int x, @PathVariable("y") int y) {
		InputStream in = getLocalTileInputStream(layer, z, x, y);
		if(in != null) {
			respond(in, response);
			return;
		}
		for(int dz = 1; dz < 5; dz++) {
			int pow = (int) Math.pow(2, dz);
			in = getLocalTileInputStream(layer, z-dz, (int) Math.floor(x/pow), (int) Math.floor(y/pow));
			if(in != null) {
				int dx = (x - pow * (int) Math.floor(x/pow));
				int dy = (y - pow * (int) Math.floor(y/pow));
				respond(zoom(streamToImage(in), dz, dx, dy), response);
				return;
			}
		}
	}

	@RequestMapping(value="/resource/imagery/tilecache/{layer}/{z}/{x}/{y}.png", method = RequestMethod.GET)
	public void getCachedTile(HttpServletResponse response, HttpServletRequest request, @PathVariable("layer") String layer, @PathVariable("z") int z, @PathVariable("x") int x, @PathVariable("y") int y) {
		MapSource source = RuntimeProperties.getMapSourceByName(layer);
		InputStream in = null;
		if(source != null && (Boolean.valueOf(getProperty("sarsoft.map.tileCacheEnabled")) || Boolean.valueOf(getProperty("sarsoft.map.overzoom.enabled")) && z > source.getMaxresolution())) {
			if(z <= source.getMaxresolution()) {
				respond(getRemoteTileInputStream(source.getTemplate(), z, x, y), response);
			} else {
				int dz = z - source.getMaxresolution();
				int pow = (int) Math.pow(2, dz);
				BufferedImage img = getTile(source.getTemplate(), source.getMaxresolution(), (int) Math.floor(x/pow), (int) Math.floor(y/pow));
				int dx = (x - pow * (int) Math.floor(x/pow));
				int dy = (y - pow * (int) Math.floor(y/pow));
				respond(zoom(img, dz, dx, dy), response);
			}
		}
	}
	
	@RequestMapping(value="/resource/imagery/compositetile/{layers}/{z}/{x}/{y}.png", method = RequestMethod.GET)
	public void getCompositeTile(HttpServletResponse response, HttpServletRequest request, @PathVariable("layers") String layer, @PathVariable("z") int z, @PathVariable("x") int x, @PathVariable("y") int y) {
		String[] layers = layer.split(",");
		BufferedImage[] images = new BufferedImage[layers.length];
		float[] opacity = new float[layers.length];
		for(int i = 0; i < layers.length; i++) {
			MapSource source = RuntimeProperties.getMapSourceByAlias(layers[i]);
			images[i] = getTile(source.getTemplate(), z, x, y);
			opacity[i] = 1;
		}
		respond(composite(images, opacity, 256, 256), response);
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
		graphics.setBackground(new Color(255, 255, 255, 0));
		graphics.setColor(new Color(r, g, b));
		graphics.clearRect(0, 0, 12, 12);
		graphics.fillOval(2, 2, 10, 10);
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

	@RequestMapping(value="/rest/georef", method=RequestMethod.GET)
	public String getGeoRefs(Model model) {
		return json(model, dao.loadAll(GeoRef.class));
	}
	
	public GeoRef create(JSONObject json) {
		GeoRef georef = GeoRef.createFromJSON(json);
		List<GeoRef> georefs = dao.loadAll(GeoRef.class);
		long maxId = 0L;
		for(GeoRef obj : georefs) {
			maxId = Math.max(maxId, obj.getId());
		}
		georef.setId(georefs.size() == 0 ? 0 : maxId+1);
		dao.save(georef);
		return georef;
	}

	
	@RequestMapping(value="/rest/georef", method = RequestMethod.POST)
	public String createGeoRef(JSONForm params, Model model, HttpServletRequest request) {
		return json(model, create(parseObject(params)));
	}
	
	@RequestMapping(value="/rest/georef/{id}", method=RequestMethod.GET)
	public String getGeoRef(Model model, @PathVariable("id") long id) {
		return json(model, dao.load(GeoRef.class, id));
	}
	
	@RequestMapping(value="/rest/georef/{id}", method = RequestMethod.POST)
	public String updateGeoRefImage(@PathVariable("id") long id, Model model, JSONForm params, HttpServletRequest request) {
		GeoRef georef = dao.load(GeoRef.class, id);
		GeoRef updated = GeoRef.createFromJSON(parseObject(params));
		Action action = (request.getParameter("action") != null) ? Action.valueOf(request.getParameter("action").toUpperCase()) : Action.UPDATE;
		switch(action) {
		case UPDATE :
			georef.setName(updated.getName());
			georef.setUrl(updated.getUrl());
			georef.setLat1(updated.getLat1());
			georef.setLng1(updated.getLng1());
			georef.setLat2(updated.getLat2());
			georef.setLng2(updated.getLng2());			
			georef.setX1(updated.getX1());
			georef.setY1(updated.getY1());
			georef.setX2(updated.getX2());
			georef.setY2(updated.getY2());
			dao.save(georef);
			break;
		case DELETE :
			dao.delete(georef);
		}
		return json(model, georef);
	}
	
}
