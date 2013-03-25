package org.sarsoft.common.controller;

import net.sf.json.JSONObject;

import org.sarsoft.common.model.ConfiguredLayer;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping(value="/rest/cfglayer")
public class ConfiguredLayerController extends MapObjectController {

	public ConfiguredLayerController() {
		super(ConfiguredLayer.class);
	}

	public ConfiguredLayer make(JSONObject json) {
		return new ConfiguredLayer(json);
	}

}
