package org.sarsoft.plans.controller;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;

import net.sf.json.JSONObject;

import org.sarsoft.common.controller.MapObjectController;
import org.sarsoft.common.gpx.GPXDesc;
import org.sarsoft.plans.model.OperationalPeriod;
import org.sarsoft.plans.model.Assignment;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.ServletRequestDataBinder;
import org.springframework.web.bind.annotation.InitBinder;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.multipart.support.StringMultipartFileEditor;

@Controller
@RequestMapping(value="/rest/op")
public class OperationalPeriodController extends MapObjectController<OperationalPeriod> {

	@InitBinder
	public void initBinder(HttpServletRequest request, ServletRequestDataBinder binder) throws ServletException {
		binder.registerCustomEditor(String.class, new StringMultipartFileEditor());
	}
	
	public OperationalPeriodController() {
		super(OperationalPeriod.class);
	}
	
	public OperationalPeriod make(JSONObject json) {
		return new OperationalPeriod(json);
	}
	
	public List<OperationalPeriod> fromGPXDesc(GPXDesc desc) {
		String type = null;
		if(desc.hasAttr("periods")) type = "periods";
		if(desc.hasAttr("OperationalPeriod")) type = "OperationalPeriod";
		if(type == null) return null;
		
		List<OperationalPeriod> periods = new ArrayList<OperationalPeriod>();
		GPXDesc d2 = new GPXDesc();
		d2.setDesc(desc.getAttr(type));
		d2.decode();
		for(String key : d2.getAttrs()) {
			try {
				OperationalPeriod period = new OperationalPeriod();
				period.setId(Long.parseLong(key));
				period.setDescription(d2.getAttr(key));
				periods.add(period);
			} catch (Exception e) {
				e.printStackTrace();
			}
		}
		
		return (periods.size() > 0 ? periods : null);
	}
	
	public String toGPXDesc(List<OperationalPeriod> items) {
		if(items == null) return null;
		GPXDesc d2 = new GPXDesc();
		for(OperationalPeriod period : items) {
			d2.setAttr(Long.toString(period.getId()), period.getDescription());
		}
		d2.encode();
		return d2.getDesc();
	}

	public void unlink(OperationalPeriod period) {
		if(period.getAssignments() != null) {
			Set<Assignment> copy = new HashSet<Assignment>(period.getAssignments());
			for(Assignment assignment : copy) {
				period.removeAssignment(assignment);
			}
		}
	}
	
}
