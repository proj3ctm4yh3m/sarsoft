package org.sarsoft.common.controller;

import java.io.StringReader;
import java.io.StringWriter;
import java.util.List;
import java.util.Set;

import javax.servlet.ServletContext;
import javax.servlet.http.HttpServletRequest;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.stream.StreamResult;
import javax.xml.transform.stream.StreamSource;

import org.sarsoft.common.dao.GenericHibernateDAO;
import org.sarsoft.common.model.Config;
import org.sarsoft.common.model.JSONAnnotatedPropertyFilter;
import org.sarsoft.common.util.Constants;
import net.sf.json.JSON;
import net.sf.json.JSONObject;
import net.sf.json.JSONSerializer;
import net.sf.json.xml.XMLSerializer;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.ui.Model;

public abstract class JSONBaseController {

	@Autowired
	protected GenericHibernateDAO dao;

	public void setGenericDao(GenericHibernateDAO dao) {
		this.dao = dao;
	}

	protected String getConfigValue(String name) {
		return ((Config) dao.getByAttr(Config.class, "name", name)).getValue();
	}

	@SuppressWarnings("unchecked")
	protected String json(Model model, Object obj) {
		if(obj == null) return "/json";
		if(obj instanceof List) {
			model.addAttribute("json", JSONAnnotatedPropertyFilter.fromArray((List) obj));
		} else if(obj instanceof Set) {
			model.addAttribute("json", JSONAnnotatedPropertyFilter.fromArray(obj));
		} else {
			model.addAttribute("json", JSONAnnotatedPropertyFilter.fromObject(obj));
		}
		return "/json";
	}

	protected Object parse(JSONForm json) {
		return JSONSerializer.toJSON(json.getJson());
	}

	protected JSONObject parseObject(JSONForm json) {
		return (JSONObject) parse(json);
	}

	protected Object parseGPXFile(HttpServletRequest request, String file) {
		return parseGPXInternal(request.getSession().getServletContext(), file);
	}

	protected Object parseGPXJson(HttpServletRequest request, String json) {
		return parseGPXInternal(request.getSession().getServletContext(), json);
	}

	protected Object parseGPXInternal(ServletContext sc, String gpxstr) {
		try {
			System.out.println("GPX STR is\n" + gpxstr);
			JSONObject obj = (JSONObject) JSONSerializer.toJSON(gpxstr);
			String gpx = (String) obj.get("gpx");
			System.out.println("GPX is " + gpx);
			TransformerFactory factory = TransformerFactory.newInstance();
			Transformer transformer = factory.newTransformer(new StreamSource(sc.getResourceAsStream("/xsl/gpx/fromgpx.xsl")));
			StringWriter writer = new StringWriter();
			transformer.transform(new StreamSource(new StringReader(gpx)), new StreamResult(writer));
			String xml = writer.toString();
			System.out.println("JSON-XML is " + xml);
			XMLSerializer serializer = new XMLSerializer();
			serializer.setRemoveNamespacePrefixFromElements(true);
			serializer.removeNamespace("gpx");
			JSON json = serializer.read(xml);
			System.out.println("JSON is " + json.toString());
			return json;
		} catch (Exception e) {
			e.printStackTrace();
			return JSONSerializer.toJSON("[]");
		}
	}

	private void processModelForXML(Model model, Object obj, String template) {
		JSON json = null;
		if(obj instanceof List) {
			json = JSONAnnotatedPropertyFilter.fromArray(obj);
		} else if(obj instanceof Set) {
			json = JSONAnnotatedPropertyFilter.fromArray(obj);
		} else {
			json = JSONAnnotatedPropertyFilter.fromObject(obj);
		}
		String xml = new XMLSerializer().write(json);
		xml = xml.replaceFirst("<o>", "<o xmlns=\"json\">");
		xml = xml.replaceFirst("<a>", "<a xmlns=\"json\">");
		System.out.println("XML is " + xml);
		model.addAttribute("xml", new StringReader(xml));
		model.addAttribute("template", template);
		model.addAttribute("colors", Constants.colorsById);
	}

	protected String gpx(Model model, Object obj, String template) {
		processModelForXML(model, obj, template);
		return "/xsl/gpx/togpx";
	}

	protected String kml(Model model, Object obj, String template) {
		processModelForXML(model, obj, template);
		return "/xsl/kml/tokml";
	}

}
