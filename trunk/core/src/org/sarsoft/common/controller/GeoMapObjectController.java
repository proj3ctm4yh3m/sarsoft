package org.sarsoft.common.controller;

import java.util.List;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import net.sf.json.JSONArray;
import net.sf.json.JSONObject;

import org.sarsoft.Format;
import org.sarsoft.common.Pair;
import org.sarsoft.common.model.GeoMapObject;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

public abstract class GeoMapObjectController <T extends GeoMapObject> extends MapObjectController<T> {

	public GeoMapObjectController(Class<T> cls) {
		super(cls);
	}
	
	public abstract String getLabel(T object);
	
	public abstract Pair<Integer, T> fromGPX(JSONObject obj);
	
	public JSONObject toGPX(T obj) {
		return obj.toGPX();
	}
	
	public abstract List<T> dedupe(List<T> removeFrom, List<T> checkAgainst);
	
	@RequestMapping(value="/{id}", method = RequestMethod.GET)
	public String get(Model model, @PathVariable("id") long id, HttpServletRequest request, HttpServletResponse response) {
		Format format = (request.getParameter("format") != null) ? Format.valueOf(request.getParameter("format").toUpperCase()) : Format.JSON;
		if(format == Format.GPX || format == Format.KML) {
			T obj = (T) dao.load(getC(), id);
			String name = getC().getSimpleName();
			JSONArray jarray = new JSONArray();
			switch (format) {
			case GPX :
				response.setHeader("Content-Disposition", "attachment; filename=" + name + "-" + getLabel(obj) + ".gpx");
				jarray.add(toGPX(obj));
				return gpx(model, jarray);
			default :
				response.setHeader("Content-Disposition", "attachment; filename=" + name + "-" + getLabel(obj) + ".kml");
				jarray.add(toGPX(obj));
				return kml(model, jarray);
			}
		} else {
			return super.get(model, id, request, response);
		}
	}

}
