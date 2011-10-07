package org.sarsoft.markup.controller;

import java.util.Date;
import java.util.List;

import javax.servlet.http.HttpServletRequest;

import net.sf.json.JSONArray;
import net.sf.json.JSONSerializer;

import org.sarsoft.common.controller.JSONBaseController;
import org.sarsoft.common.controller.JSONForm;
import org.sarsoft.common.model.Action;
import org.sarsoft.common.model.Way;
import org.sarsoft.common.model.Waypoint;
import org.sarsoft.markup.model.Shape;
import org.sarsoft.plans.model.SearchAssignment;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

@Controller
public class ShapeController extends JSONBaseController {

	@RequestMapping(value="/rest/shape", method = RequestMethod.POST)
	public String createShape(JSONForm params, Model model, HttpServletRequest request) {
		Shape shape = Shape.createFromJSON(parseObject(params));
		List<Shape> shapes = dao.loadAll(Shape.class);
		long maxId = 0L;
		for(Shape obj : shapes) {
			maxId = Math.max(maxId, obj.getId());
		}
		shape.setId(maxId+1);
		dao.save(shape);
		return json(model, shape);
	}
	
	@RequestMapping(value="/rest/shape/{id}", method = RequestMethod.POST)
	public String updateShape(JSONForm params, Model model, @PathVariable("id") long id, HttpServletRequest request) {
		Shape shape = dao.load(Shape.class, id);
		Shape updated = Shape.createFromJSON(parseObject(params));
		Action action = (request.getParameter("action") != null) ? Action.valueOf(request.getParameter("action").toUpperCase()) : Action.CREATE;
		switch(action) {
		case UPDATE :
			shape.setColor(updated.getColor());
			shape.setFill(updated.getFill());
			shape.setWeight(updated.getWeight());
			dao.save(shape);
			break;
		case DELETE :
			dao.delete(shape);
		}
		return json(model, shape);
	}
	
	@SuppressWarnings({ "unchecked", "deprecation" })
	@RequestMapping(value="/rest/shape/{id}/way", method = RequestMethod.POST)
	public String updateWay(JSONForm params, @PathVariable("id") long id, Model model, HttpServletRequest request) {
		Shape shape = dao.load(Shape.class, id);
		Way way = shape.getWay();
		if(way == null) {
			way = new Way();
			shape.setWay(way);
			dao.save(shape);
		}
		List<Waypoint> waypoints = way.getWaypoints();
		waypoints.removeAll(waypoints);
		waypoints.addAll((List<Waypoint>) JSONArray.toList((JSONArray) JSONSerializer.toJSON(params.getJson()), Waypoint.class));
		dao.save(way);
		return json(model, way);
	}
	
	@RequestMapping(value="/rest/shape/{id}/way", method = RequestMethod.GET)
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

	@RequestMapping(value="/rest/shape/{shapeid}", method = RequestMethod.GET)
	public String getShape(Model model, @PathVariable("shapeid") long shapeid) {
		Shape shape = dao.load(Shape.class, shapeid);
		return json(model, shape);
	}
		
	@RequestMapping(value="/rest/shape", method = RequestMethod.GET)
	public String getShapes(Model model) {
		List<Shape> shapes = dao.loadAll(Shape.class);
		return json(model, shapes);
	}
	
	@RequestMapping(value="/rest/shape/since/{date}", method = RequestMethod.GET)
	public String getMaerkersSince(Model model, @PathVariable("date") long date) {
		return json(model, dao.loadSince(Shape.class, new Date(date)));
	}

}
