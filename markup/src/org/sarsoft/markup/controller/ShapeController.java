package org.sarsoft.markup.controller;

import java.util.ArrayList;
import java.util.List;


import net.sf.json.JSONArray;
import net.sf.json.JSONObject;
import net.sf.json.JSONSerializer;

import org.sarsoft.common.Pair;
import org.sarsoft.common.controller.GeoMapObjectController;
import org.sarsoft.common.json.JSONForm;
import org.sarsoft.common.model.Way;
import org.sarsoft.common.model.Waypoint;
import org.sarsoft.markup.model.Shape;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

@Controller
@RequestMapping("/rest/shape")
public class ShapeController extends GeoMapObjectController<Shape> {

	public ShapeController() {
		super(Shape.class);
	}
	
	public Shape make(JSONObject json) {
		return new Shape(json);
	}
	
	public Pair<Integer, Shape> fromGPX(JSONObject obj) {
		Shape shape = Shape.fromGPX(obj);
		return shape == null ? null : new Pair<Integer, Shape>(10, shape);
	}

	public String getLabel(Shape shape) {
		return (shape.getLabel() != null && shape.getLabel().length() > 0) ? shape.getLabel() : Long.toString(shape.getId());
	}
	
	@SuppressWarnings({ "unchecked", "deprecation" })
	@RequestMapping(value="/{id}/way", method = RequestMethod.POST)
	public String updateWay(JSONForm params, @PathVariable("id") long id, Model model) {
		Shape shape = dao.load(Shape.class, id);
		Way way = shape.getWay();
		way.softCopy((List<Waypoint>) JSONArray.toList((JSONArray) JSONSerializer.toJSON(params.getJson()), Waypoint.class));
		dao.save(shape);
		return json(model, way);
	}
	
	public List<Shape> dedupe(List<Shape> removeFrom, List<Shape> checkAgainst) {
		List<Shape> dupes = new ArrayList<Shape>();

		for(Shape against : checkAgainst) {
			for(Shape check : removeFrom) {
				if(check.getLabel() != null && against.getLabel() != null && !check.getLabel().toUpperCase().startsWith(against.getLabel().toUpperCase())) continue;
				List<Waypoint> l1 = check.getWay().getWaypoints();
				List<Waypoint> l2 = against.getWay().getWaypoints();
				if(l1.size() != l2.size()) continue;
				for(int i = 0; i < l1.size(); i++) {
					if(l1.get(i).distanceFrom(l2.get(i)) > 5) continue;
				}
				if(!dupes.contains(check)) dupes.add(check);
			}
		}
		
		return dupes;
	}

}
