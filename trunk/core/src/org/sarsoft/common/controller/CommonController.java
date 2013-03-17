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
	
	@RequestMapping(value="/resource/kml", method = RequestMethod.GET)
	public String getKML(Model model, @RequestParam(value="layer") String layernames, @RequestParam(value="bounds") String lbrt, @RequestParam(value="zoom") int z, HttpServletResponse response) {
		String[] layers = layernames.split(",");
    	float[] opacity = new float[layers.length];    	
		MapSource[] sources = new MapSource[layers.length];
		
		int max = 5;
		String name = "";
		for(int i = 0; i < layers.length; i++) {
    		int idx = layers[i].indexOf("@");
    		if(idx > 0) {
    			opacity[i] = Float.parseFloat(layers[i].substring(idx+1))/100;
    			layers[i] = layers[i].substring(0, idx);
    		} else {
    			opacity[i] = 1f;
    		}

			if(layers[i].indexOf("_") > 0) {
				sources[i] = RuntimeProperties.getMapSourceByAlias(layers[i].split("_")[0]);
			} else {
				sources[i] = RuntimeProperties.getMapSourceByAlias(layers[i]);
			}
    		
			max = Math.max(max, sources[i].getMaxresolution());
			name = name + sources[i].getName() + (i < layers.length - 1 ? ", " : "");
		}
		
		String[] bounds = lbrt.split(",");
		
		int left = Integer.parseInt(bounds[0]);
		int bottom = Integer.parseInt(bounds[1]);
		int right = Integer.parseInt(bounds[2]);
		int top = Integer.parseInt(bounds[3]);
		
		while((right-left)*(top-bottom) > 1600 || z > max) {
			z--;
			left = (int) Math.floor(left/2);
			right = (int) Math.ceil(right/2);
			bottom = (int) Math.floor(bottom/2);
			top = (int) Math.ceil(top/2);
		}
		
		int[] mint = new int[] {left, bottom};
		int[] maxt = new int[] {right, top};

		double[] minb = WebMercator.TileLatLngBounds(mint[0], mint[1], z);
		double[] maxb = WebMercator.TileLatLngBounds(maxt[0], maxt[1], z);

		String header = "<name>" + getProperty("sarsoft.version") + " " + name + " Export (" + (z+2) + "/" + max + ")</name>" +
			"<LookAt><longitude>" + ((minb[1] + maxb[1]) / 2) + "</longitude><latitude>" + ((minb[0] + maxb[0]) / 2) + "</latitude><altitude>0</altitude><range>10000</range><tilt>0</tilt><heading>0</heading></LookAt>\n";

        String template = sources[0].getTemplate();
        if(sources.length > 1) {
                template =  RuntimeProperties.getServerUrl() + "resource/imagery/compositetile/" + layernames + "/{Z}/{X}/{Y}.png";
        }
		
		String kml = this.getKML(template, header, z, mint, new int[] {maxt[0]-1, maxt[1]-1});
		
		response.setContentType("application/vnd.google-earth.kml+xml");
		response.setHeader("Content-Disposition", "attachment; filename=" + sources[0].getName().replaceAll(" ", "_") + ".kml");

		try {
			response.getOutputStream().write(kml.getBytes());
			response.getOutputStream().close();
		} catch (Exception e) {}
		return null;
		
	}

}
