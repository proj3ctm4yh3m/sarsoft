package org.sarsoft.markup.controller;

import java.util.ArrayList;
import java.util.List;

import javax.servlet.http.HttpServletRequest;

import net.sf.json.JSONObject;

import org.sarsoft.common.Pair;
import org.sarsoft.common.controller.GeoMapObjectController;
import org.sarsoft.common.json.JSONForm;
import org.sarsoft.markup.model.Marker;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

@Controller
@RequestMapping("/rest/marker")
public class MarkerController extends GeoMapObjectController<Marker> {

	public MarkerController() {
		super(Marker.class);
	}
	
	public Marker make(JSONObject json) {
		return new Marker(json);
	}

	public Pair<Integer, Marker> fromGPX(JSONObject obj) {
		Marker marker = Marker.fromGPX(obj);
		return marker == null ? null : new Pair<Integer, Marker>(10, marker);
	}

	public String getLabel(Marker marker) {
		return (marker.getLabel() != null && marker.getLabel().length() > 0) ? marker.getLabel() : Long.toString(marker.getId());
	}
	
	@RequestMapping(value="/{id}/position", method = RequestMethod.POST)
	public String updatePosition(JSONForm params, Model model, @PathVariable("id") long id, HttpServletRequest request) {
		Marker marker = dao.load(Marker.class, id);
		marker.from(params.JSON());
		dao.save(marker);
		return json(model, marker);
	}
	
	public List<Marker> dedupe(List<Marker> removeFrom, List<Marker> checkAgainst) {
		List<Marker> dupes = new ArrayList<Marker>();

		for(Marker against : checkAgainst) {
			for(Marker check : removeFrom) {
				if(check.getLabel() != null && against.getLabel() != null && !check.getLabel().toUpperCase().startsWith(against.getLabel().toUpperCase())) continue;
				if(check.getPosition().distanceFrom(against.getPosition()) > 5) continue;
				if(!dupes.contains(check)) dupes.add(check);
			}
		}

		return dupes;
	}

}
