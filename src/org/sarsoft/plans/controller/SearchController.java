package org.sarsoft.plans.controller;

import java.util.HashMap;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import net.sf.json.JSONObject;

import org.sarsoft.common.controller.JSONBaseController;
import org.sarsoft.common.controller.JSONForm;
import org.sarsoft.common.util.RuntimeProperties;
import org.sarsoft.plans.model.Search;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

@Controller
public class SearchController extends JSONBaseController {

	@RequestMapping(value ="/rest/search/mapConfig", method = RequestMethod.GET)
	public String getSearchProperty(Model model, HttpServletRequest request, HttpServletResponse response) {
		Search search = (Search) dao.getByAttr(Search.class, "name", RuntimeProperties.getSearch());
		Map<String, String> map = new HashMap<String, String>();
		map.put("value", search.getMapConfig());
		return json(model, map);
	}

	@RequestMapping(value = "/rest/search/mapConfig", method = RequestMethod.POST)
	public String setSearchProperty(Model model, JSONForm params) {
		Map m = (Map) JSONObject.toBean(parseObject(params), HashMap.class);
		Search search = (Search) dao.getByAttr(Search.class, "name", RuntimeProperties.getSearch());
		search.setMapConfig((String) m.get("value"));
		dao.save(search);
		return json(model, search);
	}

}
