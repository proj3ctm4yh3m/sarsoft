package org.sarsoft.markup.controller;

import javax.servlet.http.HttpServletRequest;

import net.sf.json.JSONObject;

import org.sarsoft.common.controller.JSONForm;
import org.sarsoft.common.controller.MapObjectController;
import org.sarsoft.common.model.MapObject;
import org.sarsoft.markup.model.Marker;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

@Controller
@RequestMapping("/rest/marker")
public class MarkerController extends MapObjectController {

	public MarkerController() {
		super(Marker.class);
	}

	public Marker create(JSONObject json) {
		Marker marker = Marker.createFromJSON(json);
		marker.setId(dao.generateID(Marker.class));
		dao.save(marker);
		return marker;
	}
	
	public String getLabel(MapObject object) {
		Marker marker = (Marker) object;
		return (marker.getLabel() == null ? Long.toString(marker.getId()) : marker.getLabel());
	}
	
	@RequestMapping(value="/{id}/position", method = RequestMethod.POST)
	public String updatePosition(JSONForm params, Model model, @PathVariable("id") long id, HttpServletRequest request) {
		Marker marker = dao.load(Marker.class, id);
		Marker updated = Marker.createFromJSON(parseObject(params));
		marker.from(updated);
		dao.save(marker);
		return json(model, marker);
	}

}
