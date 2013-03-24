package org.sarsoft.common.controller;

import java.util.Date;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import net.sf.json.JSONArray;
import net.sf.json.JSONObject;

import org.apache.log4j.Logger;
import org.sarsoft.common.model.Format;
import org.sarsoft.common.model.MapObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

public abstract class MapObjectController extends JSONBaseController {

	private Class<? extends MapObject> c;

	public MapObjectController(Class<? extends MapObject> cls) {
		this.c = cls;
	}
	
	@Autowired
	public void setManager(DataManager manager) {
		manager.register(c.getSimpleName(), this);
	}

	public abstract MapObject make(JSONObject json);
	
	public Class<? extends MapObject> getC() {
		return c;
	}
	
	public void persist(MapObject obj) {
		if(obj.getClass() != c) return;
		obj.setId(dao.generateID(c));
		dao.save(obj);
	}
	
	@RequestMapping(value="", method = RequestMethod.POST)
	public String create(Model model, JSONForm params) {
		MapObject obj = make(params.JSON());
		persist(obj);
		return json(model, obj);
	}
	
	@RequestMapping(value="/{id}", method = RequestMethod.POST)
	public String update(Model model, JSONForm params, @PathVariable("id") long id) {
		MapObject obj = dao.load(c, id);
		obj.from(params.JSON());
		dao.save(obj);
		return json(model, obj);
	}
	
	@RequestMapping(value="/{id}", method = RequestMethod.DELETE)
	public String delete(Model model, @PathVariable("id") long id) {
		MapObject obj = dao.load(c, id);
		dao.delete(obj);
		return json(model, obj);
	}
	
	@RequestMapping(value="/{id}", method = RequestMethod.GET)
	public String get(Model model, @PathVariable("id") long id, HttpServletRequest request, HttpServletResponse response) {
		return json(model, dao.load(c, id));
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
