package org.sarsoft.markup.controller;

import java.util.List;

import javax.servlet.http.HttpServletRequest;

import net.sf.json.JSONArray;
import net.sf.json.JSONObject;
import net.sf.json.JSONSerializer;

import org.sarsoft.common.controller.GeoMapObjectController;
import org.sarsoft.common.json.JSONForm;
import org.sarsoft.common.model.MapObject;
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
public class ShapeController extends GeoMapObjectController {

	public ShapeController() {
		super(Shape.class);
	}
	
	public Shape make(JSONObject json) {
		return new Shape(json);
	}
	
	public JSONObject toGPX(MapObject obj) {
		return ((Shape) obj).toGPX();
	}

	public MapObject fromGPX(JSONObject obj) {
		return Shape.fromGPX(obj);
	}

	public String getLabel(MapObject object) {
		Shape shape = (Shape) object;
		return (shape.getLabel() != null && shape.getLabel().length() > 0) ? shape.getLabel() : Long.toString(shape.getId());
	}
	
	@SuppressWarnings({ "unchecked", "deprecation" })
	@RequestMapping(value="/{id}/way", method = RequestMethod.POST)
	public String updateWay(JSONForm params, @PathVariable("id") long id, Model model, HttpServletRequest request) {
		Shape shape = dao.load(Shape.class, id);
		Way way = shape.getWay();
		Shape updated = new Shape();
		updated.setWay(new Way());
		// TODO need to change how waypoints are updated to prevent pk injection
		updated.getWay().setWaypoints((List<Waypoint>) JSONArray.toList((JSONArray) JSONSerializer.toJSON(params.getJson()), Waypoint.class));
		shape.from(updated);
		dao.save(shape);
		return json(model, way);
	}
	
	@RequestMapping(value="/{id}/way", method = RequestMethod.GET)
	public String getWay(@PathVariable("id") long id, Model model, HttpServletRequest request) {
		Shape shape = dao.load(Shape.class, id);
		int precision = 0;
		try {
			precision = Integer.parseInt(request.getParameter("precision"));
		} catch (Exception e) {
		}
		shape.getWay().setPrecision(precision);
		return json(model, shape.getWay());
	}

}
