package org.sarsoft.common.controller;

import java.io.StringReader;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import javax.servlet.ServletContext;
import javax.servlet.http.HttpServletResponse;

import net.sf.json.JSON;
import net.sf.json.xml.XMLSerializer;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.sarsoft.common.dao.GenericHibernateDAO;
import org.sarsoft.common.json.JSONAnnotatedPropertyFilter;
import org.sarsoft.common.model.Tenant;
import org.sarsoft.common.util.RuntimeProperties;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.ui.Model;

public abstract class JSONBaseController {

	@Autowired
	protected ServletContext context;

	@Autowired
	@Qualifier("genericDAO")
	protected GenericHibernateDAO dao;

	protected ServerInfo server;

	@Value("${sarsoft.map.viewer}")
	String mapViewer = "google";

	@Autowired
	public void setServerInfo(ServerInfo server) {
		this.server = server;
	}

	protected String getProperty(String name) {
		if(!RuntimeProperties.isInitialized()) RuntimeProperties.initialize(context);
		return RuntimeProperties.getProperty(name);
	}
	
	protected String error(Model model, String error) {
		model.addAttribute("message", error);
		return "error";
	}
	
	protected String bounce(Model model, String error, String dest) {
		model.addAttribute("message", error);
		model.addAttribute("targetDest", dest);

		server.prep(model);
		return "Pages.Password";
	}
	
	protected String app(Model model, String view) {
		if(RuntimeProperties.getTenant() != null) model.addAttribute("tenant", dao.getByAttr(Tenant.class, "name", RuntimeProperties.getTenant()));

		server.prep(model);
		return view;
	}
	
	@SuppressWarnings("rawtypes")
	protected JSON toJSON(Object obj) {
		if(obj instanceof List) {
			return JSONAnnotatedPropertyFilter.fromArray((List) obj);
		} else if(obj instanceof Set) {
			return JSONAnnotatedPropertyFilter.fromArray(obj);
		} else if(obj.getClass().isArray()) {
			return JSONAnnotatedPropertyFilter.fromArray(obj);
		} else {
			return JSONAnnotatedPropertyFilter.fromObject(obj);
		}		
	}
	
	protected String jsonframe(Model model, Object obj) {
		if(obj != null) model.addAttribute("json", toJSON(obj));
		return "/jsonframe";
	}

	protected String json(Model model, Object obj) {
		if(obj != null) model.addAttribute("json", toJSON(obj));
		return "/json";
	}
	
	@SuppressWarnings({"unchecked","rawtypes"})
	protected String json(Model model, String error) {
		Map m = new HashMap();
		m.put("error", error);
		return json(model, m);
	}

	private void prepXML(Model model, Object obj) {
		String xml = new XMLSerializer().write(toJSON(obj));
		xml = xml.replaceFirst("<o>", "<o xmlns=\"json\">");
		xml = xml.replaceFirst("<a>", "<a xmlns=\"json\">");
		model.addAttribute("xml", new StringReader(xml));
	}
	
	protected String gpx(Model model, Object obj) {
		prepXML(model, obj);
		return "/xsl/togpx";
	}

	protected String kml(Model model, Object obj) {
		prepXML(model, obj);
		return "/xsl/tokml";
	}
	
	protected String csv(Model model, List<String[]> items, HttpServletResponse response, String filename) {
		StringBuilder sb = new StringBuilder();
		for(int i = 0; i < items.size(); i++) {
			if(i > 0) sb.append("\n");
			String[] row = items.get(i);
			for(int j = 0; j < row.length; j++) {
				if(j > 0) sb.append(",");
				sb.append(row[j]);
			}
		}
		response.setHeader("Content-Disposition", "attachment; filename=" + filename);
		model.addAttribute("echo", sb.toString());
		return "/echo";
	}
	
	protected String pdf(Model model, PDDocument document, HttpServletResponse response, String filename) {
//		response.setContentType("application/pdf");
		response.setHeader("Content-Disposition", "attachment; filename=" + filename);
		try {
			document.save(response.getOutputStream());
			document.close();
		} catch (Exception e) {
			return error(model, e.getMessage());
		}
		return null;
	}

}
