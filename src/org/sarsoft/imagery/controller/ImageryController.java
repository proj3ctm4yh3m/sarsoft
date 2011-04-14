package org.sarsoft.imagery.controller;

import java.awt.AlphaComposite;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.imageio.ImageIO;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.sarsoft.admin.model.Config;
import org.sarsoft.admin.model.MapSource;
import org.sarsoft.common.controller.JSONBaseController;
import org.sarsoft.common.controller.JSONForm;
import org.sarsoft.common.model.Action;
import org.sarsoft.common.model.JSONAnnotatedPropertyFilter;
import org.sarsoft.common.model.Way;
import org.sarsoft.common.util.Constants;
import org.sarsoft.imagery.model.GeoRefImage;
import org.sarsoft.plans.model.SearchAssignment;
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

	@InitBinder
	public void initBinder(HttpServletRequest request, ServletRequestDataBinder binder) throws ServletException {
		binder.registerCustomEditor(String.class, new StringMultipartFileEditor());
		binder.registerCustomEditor(byte[].class, new ByteArrayMultipartFileEditor());
	}

	@RequestMapping(value="/resource/imagery/tiles/{layer}/{z}/{x}/{y}.png", method = RequestMethod.GET)
	public void getFile(HttpServletResponse response, @PathVariable("layer") String layer, @PathVariable("z") int z, @PathVariable("x") int x, @PathVariable("y") int y) {
		if(this.isHosted()) return;
		File file = new File("tiles/" + layer + "/" + z + "/" + x + "/" + y + ".png");
		response.setContentType("image/png");
		InputStream in = null;
		OutputStream out = null;
		byte[] bytes = new byte[512];
		int bytesRead;

		try {
			in = new FileInputStream(file);
			out = response.getOutputStream();
			while ((bytesRead = in.read(bytes)) != -1) {
			    out.write(bytes, 0, bytesRead);
			}
		} catch (FileNotFoundException e) {
			// ignore missing files
		} catch (Exception e) {
			e.printStackTrace();
		} finally {
			try { if(in != null) in.close(); } catch(Exception e) { e.printStackTrace(); }
		}
	}
	
	@RequestMapping(value="/resource/imagery/icons/circle/{rgb}.png", method = RequestMethod.GET)
	public void getCircle(HttpServletResponse response, @PathVariable("rgb") String rgb) {
		response.setContentType("image/png");

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
			e.printStackTrace();
		}
	}

	@RequestMapping(value="/resource/imagery/georef/{id}", method=RequestMethod.GET)
	public void getImage(HttpServletResponse response, @PathVariable("id") long id, @RequestParam(value="angle", required=false) Double angle, 
			@RequestParam(value="originy", required=false) Integer originy, @RequestParam(value="originx", required=false) Integer originx) {
		response.setContentType("image/png");
		GeoRefImage georefimage = (GeoRefImage) dao.load(GeoRefImage.class, id);
		try {
			BufferedImage original = ImageIO.read(new File("imagery/" + georefimage.getPk() + ".png"));
			int height = original.getHeight();
			int width = original.getWidth();
			
			BufferedImage rotated = new BufferedImage(width, height, BufferedImage.TYPE_4BYTE_ABGR);
			Graphics2D g = rotated.createGraphics();
			g.setBackground(new Color(255, 255, 255, 0));
			g.clearRect(0, 0, width, height);
			if(angle != null) {
				double radians = (angle * Math.PI / 180);
				System.out.println("rotating " + angle + "degrees around (" + originx + "," + originy + ")");
				g.rotate(radians, originx, originy);
			}
			g.drawImage(original, 0, 0, width, height, null);
			
			ImageIO.write(rotated, "png", response.getOutputStream());
		} catch (IOException e) {
			e.printStackTrace();
		}
	}
	
	@RequestMapping(value="/app/imagery/georef", method=RequestMethod.GET)
	public String georef(Model model) {
		model.addAttribute("images", dao.loadAll(GeoRefImage.class));
		return app(model, "GeoRefImageList");
	}
	
	@RequestMapping(value="/app/imagery/georef", method = RequestMethod.POST)
	public String createGeoReferencedImage(Model model, HttpServletRequest request, ImageForm params) {
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
			File file = new File("imagery");
			file.mkdir();
			FileOutputStream os = new FileOutputStream("imagery/" + image.getPk() + ".png");
			
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
		} catch (Exception e) {
			e.printStackTrace();
		}
		return referenceImage(model, request, image.getId());
	}
	
	
	@RequestMapping(value="/app/imagery/georef/{id}", method=RequestMethod.GET)
	public String referenceImage(Model model, HttpServletRequest request, @PathVariable("id") long id) {
		Action action = (request.getParameter("action") != null) ? Action.valueOf(request.getParameter("action").toUpperCase()) : Action.VIEW;
		GeoRefImage image = (GeoRefImage) dao.load(GeoRefImage.class, id);
		if(action == Action.DELETE) {
			dao.delete(image);
			new File("imagery/" + image.getPk() + ".img").delete();
			return georef(model);
		}
		model.addAttribute("image", image);
		try {
			BufferedImage rawImage = ImageIO.read(new File("imagery/" + image.getPk() + ".png"));
			model.addAttribute("width", rawImage.getWidth());
			model.addAttribute("height", rawImage.getHeight());
		} catch (Exception e) {
			e.printStackTrace();
			return georef(model);
		}
		return app(model, "/imagery/georef");
	}
	
	@SuppressWarnings("unchecked")
	@RequestMapping(value="/rest/georefimage", method = RequestMethod.GET)
	public String MapSources(Model model) {
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
