package org.sarsoft.common.controller;

import net.sf.json.JSONObject;

import org.sarsoft.common.model.GeoRef;
import org.sarsoft.common.model.MapObject;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping(value="/rest/georef")
public class GeoRefController extends MapObjectController {

	public GeoRefController() {
		super(GeoRef.class);
	}

	public GeoRef create(JSONObject json) {
		GeoRef georef = GeoRef.createFromJSON(json);
		georef.setId(dao.generateID(GeoRef.class));
		dao.save(georef);
		return georef;
	}

	public String getLabel(MapObject object) {
		GeoRef georef = (GeoRef) object;
		return (georef.getName() == null ? Long.toString(georef.getId()) : georef.getName());
	}
	
}
