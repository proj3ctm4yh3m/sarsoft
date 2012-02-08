package org.sarsoft.markup.controller;

import java.util.Date;
import java.util.List;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.sarsoft.common.controller.JSONBaseController;
import org.sarsoft.common.controller.JSONForm;
import org.sarsoft.common.model.Action;
import org.sarsoft.common.model.Format;
import org.sarsoft.markup.model.Marker;
import org.sarsoft.markup.model.Shape;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

@Controller
public class MarkerController extends JSONBaseController {

	@RequestMapping(value="/rest/marker", method = RequestMethod.POST)
	public String createMarker(JSONForm params, Model model, HttpServletRequest request) {
		Marker marker = Marker.createFromJSON(parseObject(params));
		List<Marker> markers = dao.loadAll(Marker.class);
		long maxId = 0L;
		for(Marker obj : markers) {
			maxId = Math.max(maxId, obj.getId());
		}
		marker.setId(maxId+1);
		dao.save(marker);
		return json(model, marker);
	}
	
	@RequestMapping(value="/rest/marker/{id}", method = RequestMethod.POST)
	public String updateMarker(JSONForm params, Model model, @PathVariable("id") long id, HttpServletRequest request) {
		Marker marker = dao.load(Marker.class, id);
		Marker updated = Marker.createFromJSON(parseObject(params));
		Action action = (request.getParameter("action") != null) ? Action.valueOf(request.getParameter("action").toUpperCase()) : Action.UPDATE;
		switch(action) {
		case UPDATE :
			marker.setLabel(updated.getLabel());
			marker.setUrl(updated.getUrl());
			marker.setComments(updated.getComments());
			dao.save(marker);
			break;
		case DELETE :
			dao.delete(marker);
		}
		return json(model, marker);
	}
	
	@RequestMapping(value="/rest/marker/{id}/position", method = RequestMethod.POST)
	public String updateMarkerPosition(JSONForm params, Model model, @PathVariable("id") long id, HttpServletRequest request) {
		Marker marker = dao.load(Marker.class, id);
		Marker updated = Marker.createFromJSON(parseObject(params));
		Action action = (request.getParameter("action") != null) ? Action.valueOf(request.getParameter("action").toUpperCase()) : Action.UPDATE;
		switch(action) {
		case UPDATE :
			marker.setPosition(updated.getPosition());
			dao.save(marker);
		}
		return json(model, marker);
	}

	@RequestMapping(value="/rest/marker/{markerid}", method = RequestMethod.GET)
	public String getMarker(Model model, @PathVariable("markerid") long markerid, HttpServletRequest request, HttpServletResponse response) {
		Marker marker = dao.load(Marker.class, markerid);
		Format format = (request.getParameter("format") != null) ? Format.valueOf(request.getParameter("format").toUpperCase()) : Format.JSON;
		switch (format) {
		case GPX :
			response.setHeader("Content-Disposition", "attachment; filename=marker-" + (marker.getLabel() == null ? marker.getId() : marker.getLabel()) + ".gpx");
			return gpx(model, marker, "Marker");
		case KML :
			response.setHeader("Content-Disposition", "attachment; filename=marker-" + (marker.getLabel() == null ? marker.getId() : marker.getLabel()) + ".kml");
			return kml(model, marker, "Marker");
		default :
			return json(model, marker);
		}
	}
		
	@RequestMapping(value="/rest/marker", method = RequestMethod.GET)
	public String getMarkers(Model model) {
		List<Marker> markers = dao.loadAll(Marker.class);
		return json(model, markers);
	}
	
	@RequestMapping(value="/rest/marker/since/{date}", method = RequestMethod.GET)
	public String getMarkersSince(Model model, @PathVariable("date") long date) {
		return json(model, dao.loadSince(Marker.class, new Date(date)));
	}

}
