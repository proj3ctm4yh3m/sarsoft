package org.sarsoft.imagery.controller;

import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.URL;
import java.net.URLConnection;
import java.util.List;

import javax.imageio.ImageIO;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import net.sf.ehcache.Cache;
import net.sf.ehcache.CacheManager;
import net.sf.ehcache.Element;

import org.apache.log4j.Logger;
import org.sarsoft.admin.model.MapSource;
import org.sarsoft.common.controller.JSONBaseController;
import org.sarsoft.common.controller.JSONForm;
import org.sarsoft.common.model.Action;
import org.sarsoft.imagery.model.GeoRefImage;
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
	private static String GEOREF_IMAGE_DIR = ".sarsoft/imagery/georef/";
	private Logger logger = Logger.getLogger(ImageryController.class);
	
	@InitBinder
	public void initBinder(HttpServletRequest request, ServletRequestDataBinder binder) throws ServletException {
		binder.registerCustomEditor(String.class, new StringMultipartFileEditor());
		binder.registerCustomEditor(byte[].class, new ByteArrayMultipartFileEditor());
	}

	@RequestMapping(value="/resource/imagery/tiles/{layer}/{z}/{x}/{y}.png", method = RequestMethod.GET)
	public void getTile(HttpServletResponse response, @PathVariable("layer") String layer, @PathVariable("z") int z, @PathVariable("x") int x, @PathVariable("y") int y) {
		if(EXTERNAL_TILE_DIR == null) EXTERNAL_TILE_DIR = getProperty("sarsoft.map.localTileStore");
		File file = new File(EXTERNAL_TILE_DIR + "/" + layer + "/" + z + "/" + x + "/" + y + ".png");
		if(!file.exists()) {
			try {
				response.sendError(HttpServletResponse.SC_NOT_FOUND);
				return;
			} catch (IOException e) {
			}
		}
		response.setContentType("image/png");
		InputStream in = null;
		OutputStream out = null;
		byte[] bytes = new byte[512];
		int bytesRead;
		response.setHeader("Cache-Control", "max-age=3600, public");
		
		try {
			in = new FileInputStream(file);
			out = response.getOutputStream();
			while ((bytesRead = in.read(bytes)) != -1) {
			    out.write(bytes, 0, bytesRead);
			}
		} catch (Exception e) {
			if(z > 2 && e.getClass() != java.net.SocketException.class) logger.error("Error reading local tile " + file.getAbsolutePath(), e);
		} finally {
			try { if(in != null) in.close(); } catch(Exception e) {
				logger.error("Doubly bad error closing inputstream for local tile " + file.getAbsolutePath(), e);
			}
		}
	}
	
	/**
	 * @param response
	 * @param request
	 * @param layer
	 * @param z
	 * @param x
	 * @param y
	 */
	@RequestMapping(value="/resource/imagery/tilecache/{layer}/{z}/{x}/{y}.png", method = RequestMethod.GET)
	public void getCachedTile(HttpServletResponse response, HttpServletRequest request, @PathVariable("layer") String layer, @PathVariable("z") int z, @PathVariable("x") int x, @PathVariable("y") int y) {
		if(!Boolean.valueOf(getProperty("sarsoft.map.tileCacheEnabled"))) return;
		for(MapSource source : getMapSources()) {
			if(source.getName().equals(layer)) {
				String url = source.getTemplate();
				url = url.replaceAll("\\{Z\\}", Integer.toString(z));
				url = url.replaceAll("\\{X\\}", Integer.toString(x));
				url = url.replaceAll("\\{Y\\}", Integer.toString(y));
				Cache cache = CacheManager.getInstance().getCache("tileCache");

				byte[] array = null;
				Element element = cache.get(url);
				if(element != null) {
					array = (byte[]) element.getValue(); 
				} else {
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
					} catch (Exception e) {
						try {
						response.sendError(HttpServletResponse.SC_NOT_FOUND);
						return;
						} catch (Exception e2) {}
						logger.error("Unable to send SC_NOT_FOUND to client", e);
					}
				}
				response.setContentType("image/png");
				response.setHeader("Cache-Control", "max-age=3600, public");
				try {
					response.getOutputStream().write(array);
				} catch(IOException e) {}
				return;
			}
		}
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

	@RequestMapping(value="/resource/imagery/georef/{id}.png", method=RequestMethod.GET)
	public void getImage(HttpServletResponse response, @PathVariable("id") long id, @RequestParam(value="angle", required=false) Double angle, 
			@RequestParam(value="originy", required=false) Integer originy, @RequestParam(value="originx", required=false) Integer originx) {
		if(angle != null) response.setHeader("Cache-Control", "max-age=3600, public");
		response.setContentType("image/png");
		GeoRefImage georefimage = (GeoRefImage) dao.load(GeoRefImage.class, id);
		try {
			BufferedImage original = ImageIO.read(new File(GEOREF_IMAGE_DIR + georefimage.getPk() + ".png"));
			int height = original.getHeight();
			int width = original.getWidth();
			
			BufferedImage rotated = new BufferedImage(width, height, BufferedImage.TYPE_4BYTE_ABGR);
			Graphics2D g = rotated.createGraphics();
			g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
			g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
			g.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
			g.setBackground(new Color(255, 255, 255, 0));
			g.clearRect(0, 0, width, height);
			if(angle != null) {
				double radians = (angle * Math.PI / 180);
				g.rotate(radians, originx, originy);
			}
			g.drawImage(original, 0, 0, width, height, null);
			
			ImageIO.write(rotated, "png", response.getOutputStream());
			g.dispose();
			rotated.flush();
		} catch (IOException e) {
			logger.error("Couldn't serve georeferenced image " + id, e);
		}
	}
	
	@RequestMapping(value="/app/imagery/georef", method=RequestMethod.GET)
	public String georef(Model model) {
		model.addAttribute("images", dao.loadAll(GeoRefImage.class));
		return app(model, "GeoRefImageList");
	}
	
	@RequestMapping(value="/app/imagery/georef", method = RequestMethod.POST)
	public String createGeoReferencedImage(Model model, HttpServletRequest request, ImageForm params) {
		if(!Boolean.parseBoolean(getProperty("sarsoft.map.imageUploadEnabled"))) return "redirect:/app/index.html";
		List<GeoRefImage> images = (List<GeoRefImage>) dao.loadAll(GeoRefImage.class);
		long maxId = 0L;
		for(GeoRefImage image : images) {
			if(image.getId() != null) maxId = Math.max(maxId, image.getId());
		}
		GeoRefImage image = new GeoRefImage();
		image.setId(maxId+1);
		image.setName(params.getName());
		image.setReferenced(false);
		dao.save(image);
		image = (GeoRefImage) dao.load(GeoRefImage.class, maxId+1);
		try {
			File file = new File(GEOREF_IMAGE_DIR);
			file.mkdirs();
			FileOutputStream os = new FileOutputStream(GEOREF_IMAGE_DIR + image.getPk() + ".png");
			
			BufferedImage original = ImageIO.read(new ByteArrayInputStream(params.getBinaryData()));
			int height = original.getHeight();
			int width = original.getWidth();
			BufferedImage resized = new BufferedImage(width*2, height*2, BufferedImage.TYPE_4BYTE_ABGR);
			Graphics2D g = resized.createGraphics();
			g.setBackground(new Color(255, 255, 255, 0));
			g.clearRect(0, 0, width*2, height*2);
			g.drawImage(original, width/2, height/2, width, height, null);
			ImageIO.write(resized, "png", os);
			os.close();
			g.dispose();
			original.flush();
			resized.flush();
		} catch (Exception e) {
			logger.error("Unable to resize uploaded georef image", e);
		}
		return editGeoRefImage(model, request, image.getId());
	}
	
	
	@RequestMapping(value="/app/imagery/georef/{id}", method=RequestMethod.GET)
	public String editGeoRefImage(Model model, HttpServletRequest request, @PathVariable("id") long id) {
		Action action = (request.getParameter("action") != null) ? Action.valueOf(request.getParameter("action").toUpperCase()) : Action.VIEW;
		GeoRefImage image = (GeoRefImage) dao.load(GeoRefImage.class, id);
		if(action == Action.DELETE) {
			dao.delete(image);
			new File(GEOREF_IMAGE_DIR + image.getPk() + ".png").delete();
			return georef(model);
		}
		model.addAttribute("image", image);
		try {
			BufferedImage rawImage = ImageIO.read(new File(GEOREF_IMAGE_DIR + image.getPk() + ".png"));
			model.addAttribute("width", rawImage.getWidth());
			model.addAttribute("height", rawImage.getHeight());
			rawImage.flush();
		} catch (Exception e) {
			logger.error("Unable to read height/width from georeferenced image " + id, e);
			return georef(model);
		}
		return app(model, "/imagery/georef");
	}
	
	@RequestMapping(value="/rest/georefimage", method = RequestMethod.GET)
	public String getAllGeorefImages(Model model) {
		return json(model, dao.loadAll(GeoRefImage.class));
	}

	@RequestMapping(value="/rest/georefimage/{id}", method = RequestMethod.POST)
	public String updateGeoRefImage(@PathVariable("id") long id, Model model, JSONForm params, HttpServletRequest request) {
		Action action = (request.getParameter("action") != null) ? Action.valueOf(request.getParameter("action").toUpperCase()) : Action.CREATE;

		GeoRefImage imagePrime = GeoRefImage.createFromJSON(parseObject(params));
		GeoRefImage image = (GeoRefImage) dao.load(GeoRefImage.class, id);
		switch(action) {
		case DELETE :
			dao.delete(image);
			new File(GEOREF_IMAGE_DIR + image.getPk() + ".png").delete();
			return json(model, image);
		}
		image.setAngle(imagePrime.getAngle());
		image.setHeight(imagePrime.getHeight());
		image.setOriginlat(imagePrime.getOriginlat());
		image.setOriginlng(imagePrime.getOriginlng());
		image.setOriginx(imagePrime.getOriginx());
		image.setOriginy(imagePrime.getOriginy());
		image.setScale(imagePrime.getScale());
		image.setWidth(imagePrime.getWidth());
		image.setReferenced(true);
		dao.save(image);
		return json(model, image);
	}

	
}
