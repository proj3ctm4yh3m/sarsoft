package org.sarsoft.common.controller;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import org.sarsoft.common.model.MapSource;
import org.sarsoft.common.util.RuntimeProperties;
import org.sarsoft.common.util.WebMercator;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
public class CommonController extends JSONBaseController {
	
	@RequestMapping(value="/tools.html", method = RequestMethod.GET)
	public String showTools(Model model) {
		return app(model, "Pages.Tools");
	}
	
	@SuppressWarnings("unchecked")
	@RequestMapping(value="/rest/timestamp", method = RequestMethod.GET)
	public String getTimestamp(Model model) {
		Map m = new HashMap();
		m.put("timestamp", Long.toString(new Date().getTime()));
		return json(model, m);
	}
	
	private String makeGroundOverlay(String template, int z, int x, int y) {
		template = template.replaceAll("\\{Z\\}", Integer.toString(z));
		template = template.replaceAll("\\{X\\}", Integer.toString(x));
		template = template.replaceAll("\\{Y\\}", Integer.toString(WebMercator.GoogleY(y, z)));
		double[] bounds = WebMercator.TileLatLngBounds(x, y, z);
		String go = "<GroundOverlay><Icon><href>" + template + "</href></Icon>\n<LatLonBox>";
		go = go + "<north>" + bounds[2] + "</north>\n";
		go = go + "<south>" + bounds[0] + "</south>\n";
		go = go + "<east>" + bounds[3] + "</east>\n";
		go = go + "<west>" + bounds[1] + "</west>\n";
		go = go + "</LatLonBox></GroundOverlay>";
		return go;
	}
	
	public String getKML(String template, String header, int z, int[] min, int[] max) {
		String kml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<kml xmlns=\"http://earth.google.com/kml/2.1\">";
		kml = kml + "<Document>";
		if(header != null) kml = kml + header;

		for(int x = min[0]; x <= max[0]; x++) {
			for(int y = min[1]; y <= max[1]; y++) {
				kml = kml + makeGroundOverlay(template, z, x, y);
			}
		}
		
		kml = kml + "</Document></kml>";
		return kml;
	}
	
	@RequestMapping(value="/kml", method = RequestMethod.GET)
	public String getKML(Model model, @RequestParam(value="layer") String layernames, @RequestParam(value="supersize") Boolean supersize, @RequestParam(value="bounds") String lbrt, HttpServletResponse response) {
		String[] layers = layernames.split(",");
		MapSource[] sources = new MapSource[layers.length];
		
		int max = 32;
		int min = 0;
		String name = "";
		for(int i = 0; i < layers.length; i++) {
			sources[i] = RuntimeProperties.getMapSourceByAlias(layers[i]);
			max = Math.min(max, sources[i].getMaxresolution());
			min = Math.max(min, sources[i].getMinresolution());
			name = name + sources[i].getName() + (i < layers.length - 1 ? ", " : "");
		}
		
		String[] bounds = lbrt.split(",");
		
		double[] minb = new double[] {Double.parseDouble(bounds[1]), Double.parseDouble(bounds[0])};
		double[] maxb = new double[] {Double.parseDouble(bounds[3]), Double.parseDouble(bounds[2])};
		
		double[] minmeters = WebMercator.LatLngToMeters(minb[0], minb[1]);
		double[] maxmeters = WebMercator.LatLngToMeters(maxb[0], maxb[1]);
		
		double dx = Math.abs(maxmeters[0]-minmeters[0]);
		double dy = Math.abs(maxmeters[1]-minmeters[1]);
		double target = Math.max(dx, dy)/(16*256);
		
		int z = max;
		while(z > min && target > WebMercator.Resolution(z)) {
			z--;
		}
		
		double[] centerpx = WebMercator.MetersToPixels((minmeters[0]+maxmeters[0])/2, (minmeters[1]+maxmeters[1])/2, z);
		int[] centert = WebMercator.PixelsToTile(centerpx[0], centerpx[1]);
		double[] minpx = WebMercator.MetersToPixels(minmeters[0], minmeters[1], z);
		double[] maxpx = WebMercator.MetersToPixels(maxmeters[0], maxmeters[1], z);
		int[] mint = WebMercator.PixelsToTile(minpx[0], minpx[1]);
		int[] maxt = WebMercator.PixelsToTile(maxpx[0], maxpx[1]);
		
		String header = "<name>" + getProperty("sarsoft.version") + " " + name + " Export (" + z + "/" + max + ")</name>" +
			"<LookAt><longitude>" + ((minb[1] + maxb[1]) / 2) + "</longitude><latitude>" + ((minb[0] + maxb[0]) / 2) + "</latitude><altitude>0</altitude><range>10000</range><tilt>0</tilt><heading>0</heading></LookAt>\n";

		String template = sources[0].getTemplate();
		if(sources.length > 1) {
			template =  RuntimeProperties.getServerUrl() + "resource/imagery/compositetile/" + layernames + "/{Z}/{X}/{Y}.png";
		} else {
			template = template.replaceAll("\\{V\\}", "a-11111111");
		}

		if(supersize) {
			mint[0] = centert[0]-8;
			maxt[0] = centert[0]+7;
			mint[1] = centert[1]-8;
			maxt[1] = centert[1]+7;
		}
		
		String kml = getKML(template, header, z, mint, maxt);

		response.setContentType("application/vnd.google-earth.kml+xml");
		response.setHeader("Content-Disposition", "attachment; filename=" + sources[0].getName().replaceAll(" ", "_") + ".kml");

		try {
			response.getOutputStream().write(kml.getBytes());
			response.getOutputStream().close();
		} catch (Exception e) {}
		return null;
		
	}

}
