package org.sarsoft.common.controller;

import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

import javax.imageio.ImageIO;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.sarsoft.admin.model.Config;
import org.sarsoft.admin.model.MapSource;
import org.sarsoft.common.model.JSONAnnotatedPropertyFilter;
import org.sarsoft.common.util.Constants;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

@Controller
public class CommonController extends JSONBaseController {

	@RequestMapping(value="/app/togarmin", method = RequestMethod.GET)
	public String toGarmin(Model model, HttpServletRequest request) {
		model.addAttribute("file", request.getParameter("file"));
		model.addAttribute("name", request.getParameter("name"));
		model.addAttribute("hostName", getConfigValue("server.name"));
		model.addAttribute("garminKey", getConfigValue("garmin.key"));
		return "/plans/togarmin";
	}

	@RequestMapping(value="/app/fromgarmin", method = RequestMethod.GET)
	public String fromGarmin(Model model, HttpServletRequest request) {
		model.addAttribute("id", request.getParameter("id"));
		model.addAttribute("hostName", getConfigValue("server.name"));
		model.addAttribute("garminKey", getConfigValue("garmin.key"));
		return "/plans/fromgarmin";
	}

	@RequestMapping(value="/app/constants.js", method = RequestMethod.GET)
	public String getConstants(Model model) {
		model.addAttribute("json", JSONAnnotatedPropertyFilter.fromObject(Constants.all));
		model.addAttribute("mapSources", configDao.loadAll(MapSource.class));
		return "/global/constants";
	}

	@SuppressWarnings("unchecked")
	@RequestMapping(value="/rest/timestamp", method = RequestMethod.GET)
	public String getTimestamp(Model model) {
		Map m = new HashMap();
		m.put("timestamp", Long.toString(new Date().getTime()));
		return json(model, m);
	}

	@RequestMapping(value="/rest/config", method = RequestMethod.GET)
	public String getAllConfigs(Model model) {
		return json(model, configDao.loadAll(Config.class));
	}

	@RequestMapping(value="/rest/config/{name}", method = RequestMethod.GET)
	public String getConfig(Model model, @PathVariable("name") String name) {
		return json(model, configDao.getByAttr(Config.class, "name", name));
	}

	@RequestMapping(value="/rest/config/{name}", method = RequestMethod.POST)
	public String setConfig(Model model, @PathVariable("name") String name, JSONForm json) {
		Config config = Config.createFromJSON(parseObject(json));
		Config realConfig = (Config) configDao.getByAttr(Config.class, "name", name);
		if(realConfig == null) {
			config.setName(name);
			realConfig = config;
		} else {
			realConfig.setValue(config.getValue());
		}
		configDao.save(realConfig);
		return json(model, config);
	}

	@RequestMapping(value="/resource/tiles/{layer}/{z}/{x}/{y}.png", method = RequestMethod.GET)
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
	
	@RequestMapping(value="/resource/images/circle/{rgb}.png", method = RequestMethod.GET)
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
}
