package org.sarsoft.common.controller;

import net.sf.json.JSONObject;

import org.sarsoft.common.model.ConfiguredLayer;
import org.sarsoft.common.model.MapObject;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping(value="/rest/cfglayer")
public class ConfiguredLayerController extends MapObjectController {

	public ConfiguredLayerController() {
		super(ConfiguredLayer.class);
	}

	public ConfiguredLayer create(JSONObject json) {
		ConfiguredLayer layer = ConfiguredLayer.createFromJSON(json);
		layer.setId(dao.generateID(ConfiguredLayer.class));
		dao.save(layer);
		return layer;
	}

	public String getLabel(MapObject object) {
		ConfiguredLayer layer = (ConfiguredLayer) object;
		return (layer.getName() == null ? Long.toString(layer.getId()) : layer.getName());
	}
	
}
