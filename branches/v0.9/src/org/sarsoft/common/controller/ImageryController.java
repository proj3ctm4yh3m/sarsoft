package org.sarsoft.common.controller;

import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
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
import org.sarsoft.common.model.MapSource;
import org.sarsoft.common.controller.JSONBaseController;
import org.sarsoft.common.controller.JSONForm;
import org.sarsoft.common.model.Action;
import org.sarsoft.common.model.GeoRef;
import org.sarsoft.markup.model.Marker;
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

	protected InputStream getRemoteTileInputStream(MapSource source, int z, int x, int y) {
		String url = source.getTemplate();
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
		}
		return null;
	}

	protected void respond(InputStream in, HttpServletResponse response, String url) {
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
			if(e.getClass() != java.net.SocketException.class) logger.error("Error reading local tile " + url, e);
		} finally {
			try { if(in != null) in.close(); } catch(Exception e) {
				logger.error("Doubly bad error closing inputstream for local tile " + url, e);
			}
		}
	}

	protected InputStream zoom(InputStream in, int dz, int dx, int dy) {
		int tilesize = 256 / ((int) Math.pow(2, dz));
		try {
			BufferedImage original = ImageIO.read(in);
			BufferedImage zoomed = new BufferedImage(256, 256, BufferedImage.TYPE_4BYTE_ABGR);
			Graphics2D g = zoomed.createGraphics();
			g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_NEAREST_NEIGHBOR);
			g.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_SPEED);
			g.setBackground(new Color(255, 255, 255, 0));
			g.clearRect(0, 0, 256, 256);

			g.drawImage(original, 0, 0, 256, 256, dx*tilesize, dy*tilesize, (dx+1)*tilesize, (dy+1)*tilesize, null);
			ByteArrayOutputStream out = new ByteArrayOutputStream();
			ImageIO.write(zoomed, "png", out);
			return new ByteArrayInputStream(out.toByteArray());
		} catch (Exception e) {
		}
		return null;
	}
	
	protected InputStream composite(InputStream[] in) {
		try {
			BufferedImage composited = new BufferedImage(256, 256, BufferedImage.TYPE_4BYTE_ABGR);
			Graphics2D g = composited.createGraphics();
			g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_NEAREST_NEIGHBOR);
			g.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_SPEED);
			g.setBackground(new Color(255, 255, 255, 0));
			g.clearRect(0, 0, 256, 256);
				for(int i = 0; i < in.length; i++) {
					BufferedImage original = ImageIO.read(in[i]);
					g.drawImage(original, 0, 0, 256, 256, 0, 0, 256, 256, null);
				}
			ByteArrayOutputStream out = new ByteArrayOutputStream();
			ImageIO.write(composited, "png", out);
			return new ByteArrayInputStream(out.toByteArray());
		} catch (Exception e) {
			e.printStackTrace();
		}
		return null;
	}

	@RequestMapping(value="/resource/imagery/tiles/{layer}/{z}/{x}/{y}.png", method = RequestMethod.GET)
	public void getTile(HttpServletResponse response, @PathVariable("layer") String layer, @PathVariable("z") int z, @PathVariable("x") int x, @PathVariable("y") int y) {
		InputStream in = getLocalTileInputStream(layer, z, x, y);
		if(in != null) {
			respond(in, response, layer + "/" + z + "/" + x + "/" + y);
			return;
		}
		for(int dz = 1; dz < 5; dz++) {
			int pow = (int) Math.pow(2, dz);
			in = getLocalTileInputStream(layer, z-dz, (int) Math.floor(x/pow), (int) Math.floor(y/pow));
			if(in != null) {
				int dx = (x - pow * (int) Math.floor(x/pow));
				int dy = (y - pow * (int) Math.floor(y/pow));
				in = zoom(in, dz, dx, dy);
				respond(in, response, layer + "/" + z + "/" + x + "/" + y);
				return;
			}
		}
	}

	@RequestMapping(value="/resource/imagery/tilecache/{layer}/{z}/{x}/{y}.png", method = RequestMethod.GET)
	public void getCachedTile(HttpServletResponse response, HttpServletRequest request, @PathVariable("layer") String layer, @PathVariable("z") int z, @PathVariable("x") int x, @PathVariable("y") int y) {
		MapSource source = getMapSourceByName(layer);
		InputStream in = null;
		if(source != null && (Boolean.valueOf(getProperty("sarsoft.map.tileCacheEnabled")) || Boolean.valueOf(getProperty("sarsoft.map.overzoom.enabled")) && z > source.getMaxresolution())) {
			if(z <= source.getMaxresolution()) {
				in = getRemoteTileInputStream(source, z, x, y);
			} else {
				int dz = z - source.getMaxresolution();
				int pow = (int) Math.pow(2, dz);
				in = getRemoteTileInputStream(source, source.getMaxresolution(), (int) Math.floor(x/pow), (int) Math.floor(y/pow));
				int dx = (x - pow * (int) Math.floor(x/pow));
				int dy = (y - pow * (int) Math.floor(y/pow));
				in = zoom(in, dz, dx, dy);
			}
		}
		respond(in, response, layer + "/" + z + "/" + x + "/" + y);
	}
	
	@RequestMapping(value="/resource/imagery/compositetile/{layer}/{z}/{x}/{y}.png", method = RequestMethod.GET)
	public void getCompositeTile(HttpServletResponse response, HttpServletRequest request, @PathVariable("layer") String layer, @PathVariable("z") int z, @PathVariable("x") int x, @PathVariable("y") int y) {
		String[] layers = layer.split(",");
		InputStream[] images = new InputStream[layers.length];
		for(int i = 0; i < layers.length; i++) {
			MapSource source = getMapSourceByAlias(layers[i]);
			images[i] = getRemoteTileInputStream(source, z, x, y);
		}
		respond(composite(images), response, layer + "/" + z + "/" + x + "/" + y);
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
