package org.sarsoft.common.controller;

import java.io.IOException;
import java.io.OutputStream;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
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

	@RequestMapping(value="/map.html", method = RequestMethod.GET)
	public String showMap(Model model, HttpServletRequest request) {
		RuntimeProperties.setTenant(null);		
		HttpSession session = request.getSession(true);
		session.removeAttribute("tenantid");
		if(RuntimeProperties.getProperty("sarsoft.ui.quickmap.message") != null) {
			model.addAttribute("uimessage", RuntimeProperties.getProperty("sarsoft.ui.quickmap.message"));
		}
		return app(model, "/map");
	}
	
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
		go = go + "<east>" + bounds[1] + "</east>\n";
		go = go + "<west>" + bounds[3] + "</west>\n";
		go = go + "</LatLonBox></GroundOverlay>";
		return go;
	}
	
	@RequestMapping(value="/kml", method = RequestMethod.GET)
	public String getKML(Model model, @RequestParam(value="layer") String layer, @RequestParam(value="bounds") String lbrt, HttpServletResponse response) {
		
		MapSource source = this.getMapSourceByName(layer);
		String[] bounds = lbrt.split(",");
		
		double[] min = new double[] {Double.parseDouble(bounds[1]), Double.parseDouble(bounds[0])};
		double[] max = new double[] {Double.parseDouble(bounds[3]), Double.parseDouble(bounds[2])};
		
		double[] minmeters = WebMercator.LatLngToMeters(min[0], min[1]);
		double[] maxmeters = WebMercator.LatLngToMeters(max[0], max[1]);
		
		double dx = Math.abs(maxmeters[0]-minmeters[0]);
		double dy = Math.abs(maxmeters[1]-minmeters[1]);
		double target = Math.max(dx, dy)/(16*256);
		
		int z = source.getMaxresolution();
		while(z > source.getMinresolution() && target > WebMercator.Resolution(z)) {
			z--;
		}
		
		double[] minpx = WebMercator.MetersToPixels(minmeters[0], minmeters[1], z);
		double[] maxpx = WebMercator.MetersToPixels(maxmeters[0], maxmeters[1], z);
		int[] mint = WebMercator.PixelsToTile(minpx[0], minpx[1]);
		int[] maxt = WebMercator.PixelsToTile(maxpx[0], maxpx[1]);
		
		String kml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<kml xmlns=\"http://earth.google.com/kml/2.1\">";
		kml = kml + "<Document><name>CalTopo " + layer + " Export (" + z + "/" + source.getMaxresolution() + ")</name>";
		kml = kml + "<LookAt><longitude>" + ((min[1] + max[1]) / 2) + "</longitude><latitude>" + ((min[0] + max[0]) / 2) + "</latitude><altitude>0</altitude><range>10000</range><tilt>0</tilt><heading>0</heading></LookAt>\n";

		String template = source.getTemplate();
		template = template.replaceAll("\\{V\\}", "s-11111111");

		for(int x = mint[0]; x <= maxt[0]; x++) {
			for(int y = mint[1]; y <= maxt[1]; y++) {
				kml = kml + makeGroundOverlay(template, z, x, y);
			}
		}
		
		kml = kml + "</Document></kml>";

		response.setHeader("Content-Disposition", "attachment; filename=" + layer + ".kml");
		model.addAttribute("echo", kml);
		return "/echo";
	}

}
