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

	public GeoRef make(JSONObject json) {
		return new GeoRef(json);
	}

}
