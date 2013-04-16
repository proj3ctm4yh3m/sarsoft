package org.sarsoft.common.controller;

import java.util.Date;
import java.util.List;

import javax.servlet.http.HttpServletResponse;

import net.sf.json.JSONObject;

import org.sarsoft.common.gpx.GPXDesc;
import org.sarsoft.common.json.JSONForm;
import org.sarsoft.common.model.MapObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

public abstract class MapObjectController <T extends MapObject> extends JSONBaseController {

	private Class<T> c;

	public MapObjectController(Class<T> cls) {
		this.c = cls;
	}
	
	@Autowired
	public void setManager(DataManager manager) {
		manager.register(c.getSimpleName(), this);
	}
	
	public abstract T make(JSONObject json);
	
	public Class<T> getC() {
		return c;
	}
	
	public void link(T obj) {
	}
	
	public void unlink(T obj) {
	}
	
	public String[] getLinkDependencies() {
		return new String[] {};
	}
	
	public void persist(T obj) {
		if(obj.getId() != null) {
			if(dao.load(c, obj.getId()) != null) obj.setId(null);
		}
		if(obj.getId() == null) obj.setId(dao.generateID(c));
		link(obj);
		dao.save(obj);
	}
		
	public List<T> fromGPXDesc(GPXDesc desc) {
		return null;
	}
	
	public String toGPXDesc(List<T> items) {
		return null;
	}
	
	@RequestMapping(value="", method = RequestMethod.POST)
	public String create(Model model, JSONForm params) {
		T obj = make(params.JSON());
		persist(obj);
		return json(model, obj);
	}
	
	@RequestMapping(value="/{id}", method = RequestMethod.POST)
	public String update(Model model, JSONForm params, @PathVariable("id") long id) {
		T obj = dao.load(c, id);
		obj.from(params.JSON());
		link(obj);
		dao.save(obj);
		return json(model, obj);
	}
	
	@RequestMapping(value="/{id}", method = RequestMethod.DELETE)
	public String delete(Model model, @PathVariable("id") long id) {
		T obj = dao.load(c, id);
		unlink(obj);
		dao.delete(obj);
		return json(model, obj);
	}
	
	@RequestMapping(value="/{id}", method = RequestMethod.GET)
	public String get(Model model, @PathVariable("id") long id) {
		return json(model, dao.load(c, id));
	}

	@RequestMapping(value="", method = RequestMethod.GET)
	public String getAll(Model model, HttpServletResponse response) {
		return json(model, dao.loadAll(c));
	}
	
	@RequestMapping(value="/since/{date}", method = RequestMethod.GET)
	public String getSince(Model model, @PathVariable("date") long date) {
		return json(model, dao.loadSince(c, new Date(date)));
	}
	
}
