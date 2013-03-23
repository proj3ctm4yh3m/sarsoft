package org.sarsoft.common.controller;

import java.util.Date;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import net.sf.json.JSONObject;

import org.sarsoft.common.model.Format;
import org.sarsoft.common.model.MapObject;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

public abstract class MapObjectController extends JSONBaseController {

	private Class<? extends MapObject> c;
	
	public MapObjectController(Class<? extends MapObject> cls) {
		this.c = cls;
	}
	
	public abstract MapObject create(JSONObject json);
	public abstract String getLabel(MapObject object);

	@RequestMapping(value="", method = RequestMethod.POST)
	public String create(Model model, JSONForm params) {
		return json(model, create(parseObject(params)));
	}
	
	@RequestMapping(value="/{id}", method = RequestMethod.POST)
	public String update(Model model, JSONForm params, @PathVariable("id") long id) {
		MapObject obj = dao.load(c, id);
		obj.from(parseObject(params));
		dao.save(obj);
		return json(model, obj);
	}
	
	@RequestMapping(value="/{id}", method = RequestMethod.DELETE)
	public String delete(Model model, @PathVariable("id") long id) {
		MapObject obj = dao.load(c, id);
		dao.delete(obj);
		return json(model, obj);
	}
	
	@RequestMapping(value="/{shapeid}", method = RequestMethod.GET)
	public String get(Model model, @PathVariable("shapeid") long id, HttpServletRequest request, HttpServletResponse response) {
		MapObject obj = dao.load(c, id);
		Format format = (request.getParameter("format") != null) ? Format.valueOf(request.getParameter("format").toUpperCase()) : Format.JSON;
		String name = c.getSimpleName();
		switch (format) {
		case GPX :
			response.setHeader("Content-Disposition", "attachment; filename=" + name + "-" + getLabel(obj) + ".gpx");
			return gpx(model, obj, name);
		case KML :
			response.setHeader("Content-Disposition", "attachment; filename=" + name + "-" + getLabel(obj) + ".kml");
			return kml(model, obj, name);
		default :
			return json(model, obj);
		}
	}

	@RequestMapping(value="", method = RequestMethod.GET)
	public String getAll(Model model) {
		return json(model, dao.loadAll(c));
	}

	@RequestMapping(value="/since/{date}", method = RequestMethod.GET)
	public String getSince(Model model, @PathVariable("date") long date) {
		return json(model, dao.loadSince(c, new Date(date)));
	}

}
