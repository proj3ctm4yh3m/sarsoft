package org.sarsoft.common.controller;

import java.io.File;
import java.io.StringReader;
import java.io.StringWriter;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.List;
import java.util.Set;

import javax.servlet.ServletContext;
import javax.servlet.http.HttpServletRequest;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.stream.StreamResult;
import javax.xml.transform.stream.StreamSource;

import org.sarsoft.admin.model.Config;
import org.sarsoft.admin.model.MapSource;
import org.sarsoft.common.model.UserAccount;
import org.sarsoft.common.dao.GenericHibernateDAO;
import org.sarsoft.common.model.JSONAnnotatedPropertyFilter;
import org.sarsoft.common.util.RuntimeProperties;
import org.sarsoft.plans.model.Search;

import net.sf.json.JSON;
import net.sf.json.JSONObject;
import net.sf.json.JSONSerializer;
import net.sf.json.xml.XMLSerializer;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.ui.Model;

public abstract class JSONBaseController {

	protected static String REST = "rest";
	protected static String APP = "app";

	@Autowired
	@Qualifier("genericDAO")
	protected GenericHibernateDAO dao;

	@Autowired
	@Qualifier("genericConfigDAO")
	protected GenericHibernateDAO configDao;

	public void setDao(GenericHibernateDAO dao) {
		this.dao = dao;
	}

	public void setConfigDao(GenericHibernateDAO dao) {
		this.configDao = dao;
	}

	protected String getConfigValue(String name) {
		Config config = (Config) configDao.getByAttr(Config.class, "name", name);
		if(config != null) return config.getValue();
		return null;
	}

	protected String hash(String password) {
		if(password == null) return null;
		try {
		MessageDigest d = MessageDigest.getInstance("SHA-1");
		d.reset();
		d.update(password.getBytes());
		byte[] bytes = d.digest();
		StringBuffer sb = new StringBuffer();
		for(byte b : bytes) {
			int i = b & 0xFF;
			if(i < 16) sb.append("0");
			sb.append(Integer.toHexString(i));
		}
		return sb.toString().toUpperCase();
		} catch (NoSuchAlgorithmException e) {
			return password;
		}
	}


	@SuppressWarnings("unchecked")
	protected String json(Model model, Object obj) {
		if(obj == null) return "/json";
		if(obj instanceof List) {
			model.addAttribute("json", JSONAnnotatedPropertyFilter.fromArray((List) obj));
		} else if(obj instanceof Set) {
			model.addAttribute("json", JSONAnnotatedPropertyFilter.fromArray(obj));
		} else if(obj.getClass().isArray()) {
			model.addAttribute("json", JSONAnnotatedPropertyFilter.fromArray(obj));
		} else {
			model.addAttribute("json", JSONAnnotatedPropertyFilter.fromObject(obj));
		}
		return "/json";
	}

	protected String bounce(Model model) {
		model.addAttribute("hosted", RuntimeProperties.isHosted());
		String user = RuntimeProperties.getUsername();
		UserAccount account = null;
		if(RuntimeProperties.getSearch() != null) model.addAttribute("search", dao.getByPk(Search.class, RuntimeProperties.getSearch()));
		if(user != null) account = (UserAccount) dao.getByPk(UserAccount.class, user);
		if(RuntimeProperties.isHosted()) {
			if(account != null) {
				model.addAttribute("account", account);
				model.addAttribute("searches", account.getSearches());
			}
		} else {
			model.addAttribute("searches", dao.getAllSearches());
		}
		model.addAttribute("mapkey", getConfigValue("maps.key"));
		return "Pages.Welcome";
	}

	protected String app(Model model, String view) {
		model.addAttribute("mapSources", configDao.loadAll(MapSource.class));
		model.addAttribute("hosted", RuntimeProperties.isHosted());
		String username = RuntimeProperties.getUsername();
		model.addAttribute("username", username);
		if(username != null)
			model.addAttribute("account", dao.getByPk(UserAccount.class, username));
		model.addAttribute("mapkey", getConfigValue("maps.key"));
		if(RuntimeProperties.getSearch() == null) {
			return bounce(model);
		}
		if(RuntimeProperties.getSearch() != null) model.addAttribute("search", dao.getByPk(Search.class, RuntimeProperties.getSearch()));
		return view;
	}

	protected Object parse(JSONForm json) {
		return JSONSerializer.toJSON(json.getJson());
	}

	protected JSONObject parseObject(JSONForm json) {
		return (JSONObject) parse(json);
	}

	protected Object parseGPXFile(HttpServletRequest request, String file) {
		return parseGPXFile(request, file, "/xsl/gpx/gpx2way.xsl");
	}

	protected Object parseGPXFile(HttpServletRequest request, String file, String template) {
		return parseGPXInternal(request.getSession().getServletContext(), file, template);
	}

	protected Object parseGPXJson(HttpServletRequest request, String json) {
		return parseGPXJson(request, json, "/xsl/gpx/gpx2way.xsl");
	}

	protected Object parseGPXJson(HttpServletRequest request, String json, String template) {
		JSONObject obj = (JSONObject) JSONSerializer.toJSON(json);
		String gpx = (String) obj.get("gpx");
		return parseGPXInternal(request.getSession().getServletContext(), gpx, template);
	}

	protected Object parseGPXInternal(ServletContext sc, String gpx, String template) {
		try {
			TransformerFactory factory = TransformerFactory.newInstance();
			Transformer transformer = factory.newTransformer(new StreamSource(sc.getResourceAsStream(template)));
			StringWriter writer = new StringWriter();
			transformer.transform(new StreamSource(new StringReader(gpx)), new StreamResult(writer));
			String xml = writer.toString();
			XMLSerializer serializer = new XMLSerializer();
			serializer.setRemoveNamespacePrefixFromElements(true);
			serializer.removeNamespace("gpx");
			JSON json = serializer.read(xml);
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
		model.addAttribute("xml", new StringReader(xml));
		model.addAttribute("template", template);
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
