package org.sarsoft.markup.controller;

import javax.servlet.http.HttpServletRequest;

import net.sf.json.JSONObject;

import org.sarsoft.common.controller.GeoMapObjectController;
import org.sarsoft.common.json.JSONForm;
import org.sarsoft.common.model.MapObject;
import org.sarsoft.markup.model.Marker;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

@Controller
@RequestMapping("/rest/marker")
public class MarkerController extends GeoMapObjectController {

	public MarkerController() {
		super(Marker.class);
	}
	
	public Marker make(JSONObject json) {
		return new Marker(json);
	}

	public JSONObject toGPX(MapObject obj) {
		return ((Marker) obj).toGPX();
	}

	public MapObject fromGPX(JSONObject obj) {
		return Marker.fromGPX(obj);
	}

	public String getLabel(MapObject object) {
		Marker marker = (Marker) object;
		return (marker.getLabel() != null && marker.getLabel().length() > 0) ? marker.getLabel() : Long.toString(marker.getId());
	}
	
	@RequestMapping(value="/{id}/position", method = RequestMethod.POST)
	public String updatePosition(JSONForm params, Model model, @PathVariable("id") long id, HttpServletRequest request) {
		Marker marker = dao.load(Marker.class, id);
		marker.from(params.JSON());
		dao.save(marker);
		return json(model, marker);
	}

}