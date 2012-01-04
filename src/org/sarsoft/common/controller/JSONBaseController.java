package org.sarsoft.common.controller;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.io.InputStream;
import java.io.StringReader;
import java.io.StringWriter;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import java.util.Set;

import javax.servlet.ServletContext;
import javax.servlet.http.HttpServletRequest;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.stream.StreamResult;
import javax.xml.transform.stream.StreamSource;

import net.sf.json.JSON;
import net.sf.json.JSONObject;
import net.sf.json.JSONSerializer;
import net.sf.json.xml.XMLSerializer;

import org.apache.log4j.Logger;
import org.sarsoft.common.model.MapSource;
import org.sarsoft.common.dao.GenericHibernateDAO;
import org.sarsoft.common.model.JSONAnnotatedPropertyFilter;
import org.sarsoft.common.model.Tenant;
import org.sarsoft.common.model.UserAccount;
import org.sarsoft.common.util.RuntimeProperties;
import org.sarsoft.common.model.GeoRefImage;
import org.sarsoft.plans.Constants;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.ui.Model;

public abstract class JSONBaseController {

	protected static String REST = "rest";
	protected static String APP = "app";
	
	private List<MapSource> mapSources;
	private List<String> visibleMapSources;
	private String header = null;
	private String preheader = null;
	private String welcomeHTML;
	
	@Autowired
	protected ServletContext context;

	@Autowired
	@Qualifier("genericDAO")
	protected GenericHibernateDAO dao;

	@Value("${sarsoft.hosted}")
	String hosted;
	private Boolean inHostedMode = null;
	
	@Value("${sarsoft.map.viewer}")
	String mapViewer = "google";
	
	private Logger logger = Logger.getLogger(JSONBaseController.class);

	public void setDao(GenericHibernateDAO dao) {
		this.dao = dao;
	}

	protected boolean isHosted() {
		if(inHostedMode == null) {
			inHostedMode = "true".equalsIgnoreCase(hosted);
		}
		return inHostedMode;
	}
	
	protected String getProperty(String name) {
		if(!RuntimeProperties.isInitialized()) RuntimeProperties.initialize(context);
		return RuntimeProperties.getProperty(name);
	}
	
	protected List<String> getVisibleMapSources(boolean checkTenant) {
		if(checkTenant && RuntimeProperties.getTenant() != null) {
			Tenant tenant = dao.getByPk(Tenant.class, RuntimeProperties.getTenant());
			if(tenant.getLayers() != null) {
				String[] layers = tenant.getLayers().split(",");
				List<String> sources = new ArrayList<String>();
				for(String layer : layers) {
					sources.add(getProperty("sarsoft.map.background." + layer + ".name"));
				}
				return sources;
			}
		}
		if(visibleMapSources != null) return visibleMapSources;
		synchronized(this) {
			visibleMapSources = new ArrayList<String>();
			String defaults = getProperty("sarsoft.map.backgrounds.default");
			if(defaults == null || defaults.length() == 0) defaults = getProperty("sarsoft.map.backgrounds");
			for(String source : defaults.split(",")) {
				visibleMapSources.add(getProperty("sarsoft.map.background." + source + ".name"));
			}
		}
		return visibleMapSources;
	}

	protected List<MapSource> getMapSources() {
		if(mapSources != null) return mapSources;
		synchronized(this) {
			if(mapSources != null) return mapSources;
			mapSources = new ArrayList<MapSource>();
			String[] names = getProperty("sarsoft.map.backgrounds").split(",");
			for(String name : names) {
				MapSource source = new MapSource();
				source.setName(getProperty("sarsoft.map.background." + name + ".name"));
				source.setTemplate(getProperty("sarsoft.map.background." + name + ".template"));
				source.setType(MapSource.Type.valueOf(getProperty("sarsoft.map.background." + name + ".type")));
				String alias = getProperty("sarsoft.map.background." + name + ".alias");
				if(alias == null) alias = name;
				source.setAlias(alias);
				source.setDescription(getProperty("sarsoft.map.background." + name + ".description"));
				if(source.getType() != MapSource.Type.NATIVE) {
					source.setCopyright(getProperty("sarsoft.map.background." + name + ".copyright"));
					source.setMaxresolution(Integer.parseInt(getProperty("sarsoft.map.background." + name + ".maxresolution")));
					source.setMinresolution(Integer.parseInt(getProperty("sarsoft.map.background." + name + ".minresolution")));
					source.setPng(Boolean.valueOf(getProperty("sarsoft.map.background." + name + ".png")));
					source.setAlphaOverlay(Boolean.valueOf(getProperty("sarsoft.map.background." + name + ".alphaOverlay")));
					source.setInfo(getProperty("sarsoft.map.background." + name + ".info"));
				}
				mapSources.add(source);
			}
			mapSources = Collections.unmodifiableList(mapSources);
		}
		return mapSources;
	}
	
	private byte[] sha1(String str) {
		try {
			MessageDigest d = MessageDigest.getInstance("SHA-1");
			d.reset();
			d.update(str.getBytes());
			return d.digest();
		} catch (NoSuchAlgorithmException e) {
			return null;
		}
	}
	
	protected String hash32(String str) {
		if(str == null) return null;
		byte[] bytes = sha1(str);
		if(bytes == null) return str;
		StringBuffer sb = new StringBuffer();
		for(byte b : bytes) {
			int i = b & 0xFF;
			if(i < 32) sb.append("0");
			sb.append(Integer.toString(i, 32));
		}
		return sb.toString().toUpperCase();
	}
	
	protected String hash(String password) {
		if(password == null) return null;
		StringBuffer sb = new StringBuffer();
		byte[] bytes = sha1(password);
		if(bytes == null) return password;
		for(byte b : bytes) {
			int i = b & 0xFF;
			if(i < 16) sb.append("0");
			sb.append(Integer.toHexString(i));
		}
		return sb.toString().toUpperCase();
	}

	protected String getCommonHeader(boolean checkTenant) {
		if(this.header != null) {
			String header = "<script>" + preheader;
	
			header = header + "org.sarsoft.EnhancedGMap.geoRefImages = [";
	
			boolean first = true;
			for(GeoRefImage image : dao.getAllByAttr(GeoRefImage.class, "referenced", Boolean.TRUE)) {
				header = header + ((first) ? "" : ",") + "{name:\"" + image.getName() + "\", alias: \"" + image.getName() + "\", id: " + image.getId() + ", angle: " + image.getAngle() +
					", scale: " + image.getScale() + ", originx: " + image.getOriginx() + ", originy: " + image.getOriginy() + ", originlat: " + image.getOriginlat() +
					", originlng: " + image.getOriginlng() + ", width: " + image.getWidth() + ", height: " + image.getHeight() + "}";
				first = false;
			}
			header = header + "];\n\norg.sarsoft.EnhancedGMap.visibleMapTypes = [\n";
			first = true;
			for(String source : getVisibleMapSources(checkTenant)) {
				header = header + ((first) ? "" : ",") + "\"" + source + "\"";
				first = false;
			}
			header = header + "];\n";
			
			String datum = "WGS84";
			if(getProperty("sarsoft.map.datum") != null) datum = getProperty("sarsoft.map.datum");
			
			if(checkTenant && RuntimeProperties.getTenant() != null) {
				Tenant tenant = dao.getByPk(Tenant.class, RuntimeProperties.getTenant());
				if(tenant.getDatum() != null) datum = tenant.getDatum();
			}
			header = header + "org.sarsoft.map.datum=\"" + datum + "\"\n" +
				"org.sarsoft.userPermissionLevel=\"" + RuntimeProperties.getUserPermission() + "\"";
			header = header + "</script>\n";
				
			if("google".equals(this.mapViewer)) {
				return header + "<script src=\"http://maps.google.com/maps?file=api&amp;v=2&amp;key=" + 
				getProperty("google.maps.apikey." + RuntimeProperties.getServerName()) + "\" type=\"text/javascript\"></script>" + this.header;
			} else {
				return header + "<script src=\"/static/js/openlayers.js\"></script>\n" +
				"<script src=\"/static/js/gmapolwrapper.js\"></script>" + this.header;
			}
		}
		synchronized(this) {
			String preheader = "if(typeof org == \"undefined\") org = new Object();\nif(typeof org.sarsoft == \"undefined\") org.sarsoft = new Object();\nif(typeof org.sarsoft.map == \"undefined\") org.sarsoft.map = new Object();" +
			"org.sarsoft.Constants=" + JSONAnnotatedPropertyFilter.fromObject(Constants.all) + "\n" +
			"org.sarsoft.garmin = new Object(); org.sarsoft.garmin.hostName=\"http://" + RuntimeProperties.getServerName() +  "\"\n" +
			"org.sarsoft.garmin.deviceKey=\"" + this.getProperty("garmin.key." + RuntimeProperties.getServerName()) + "\"\n" +
			"org.sarsoft.map._default = new Object();\n" +
			"org.sarsoft.map._default.zoom = " + getProperty("sarsoft.map.default.zoom") + ";\n" +
			"org.sarsoft.map._default.lat = " + getProperty("sarsoft.map.default.lat") + ";\n" +
			"org.sarsoft.map._default.lng = " + getProperty("sarsoft.map.default.lng") + ";\n" +
			"org.sarsoft.map.refreshInterval = " + RuntimeProperties.getProperty("sarsoft.refresh.interval") + ";\n" +
			"org.sarsoft.map.autoRefresh = " + RuntimeProperties.getProperty("sarsoft.refresh.auto") + ";\n" +
			"org.sarsoft.map.datums = new Object();\n" +
			"org.sarsoft.map.datums[\"NAD27 CONUS\"] = {a: 6378206.4, b: 6356583.8, f: 1/294.9786982, x : -8, y : 160, z : 176};\n" +
			"org.sarsoft.map.datums[\"WGS84\"] = {a: 6378137.0, b: 6356752.314, f: 1/298.257223563, x : 0, y : 0, z : 0};\n" +
			"if(typeof org.sarsoft.EnhancedGMap == \"undefined\") org.sarsoft.EnhancedGMap = function() {}\n" +
			"org.sarsoft.EnhancedGMap.defaultMapTypes = [\n";
			boolean first = true;
			boolean tileCacheEnabled = Boolean.parseBoolean(getProperty("sarsoft.map.tileCacheEnabled"));
			for(MapSource source : getMapSources()) {
				if(!source.isAlphaOverlay()) {
					preheader = preheader + ((first) ? "" : ",") + "{name: \"" + source.getName() + "\", alias: \"" + source.getAlias() + "\", type: \"" + source.getType() + 
						"\", copyright: \"" + source.getCopyright() + "\", minresolution: " + source.getMinresolution() + ", maxresolution: " + source.getMaxresolution() + 
						", png: " + source.isPng() + ", alphaOverlay: " + source.isAlphaOverlay() + ", info: \"" + ((source.getInfo() == null) ? "" : source.getInfo()) + "\", template: \"";
					if(source.getType() == MapSource.Type.TILE && tileCacheEnabled && source.getTemplate().startsWith("http")) {
						preheader = preheader + "/resource/imagery/tilecache/${mapSource.name}/{Z}/{X}/{Y}.png";
					} else {
						preheader = preheader + source.getTemplate();
					}
					preheader = preheader + "\"}";
					first = false;
				}
			}
			for(MapSource source : getMapSources()) {
				if(source.isAlphaOverlay()) {
					preheader = preheader + ",{name: \"" + source.getName() + "\", alias: \"" + source.getAlias() + "\", type: \"" + source.getType() + 
						"\", copyright: \"" + source.getCopyright() + "\", minresolution: " + source.getMinresolution() + ", maxresolution: " + source.getMaxresolution() + 
						", png: " + source.isPng() + ", alphaOverlay: " + source.isAlphaOverlay() + ", info: \"" + ((source.getInfo() == null) ? "" : source.getInfo()) + "\", template: \"";
					if(source.getType() == MapSource.Type.TILE && tileCacheEnabled && source.getTemplate().startsWith("http")) {
						preheader = preheader + "/resource/imagery/tilecache/${mapSource.name}/{Z}/{X}/{Y}.png";
					} else {
						preheader = preheader + source.getTemplate();
					}
					preheader = preheader + "\"}\n";
				}
			}
			preheader = preheader + "];\n";
			this.preheader = preheader;

			String header = "<script src=\"/static/js/yui.js\"></script>\n" +
			"<script src=\"/static/js/jquery-1.6.4.js\"></script>\n" +
			"<script src=\"/static/js/common.js\"></script>\n" +
			"<script src=\"/static/js/maps.js\"></script>\n" +
			"<script src=\"/static/js/plans.js\"></script>\n" +
			"<script src=\"/static/js/ops.js\"></script>\n" +
			"<script src=\"/static/js/markup.js\"></script>\n" +
			"<link rel=\"stylesheet\" type=\"text/css\" href=\"/static/css/yui.css\"/>\n" +
			"<link rel=\"stylesheet\" type=\"text/css\" href=\"/static/css/AppBase.css\"/>\n" +
			"<!--[if gte IE 9]>\n" +
			"<style type=\"text/css\">\n" +
			"@media print { img.olTileImage {position: absolute !important;}\n" +
				"img.olAlphaImage {position: absolute !important;}\n" +
				"div.olAlphaImage {position: absolute !important;}}\n" +
			"</style>\n"+
			"<![endif]-->\n";
			this.header = header;
		}
		return getCommonHeader(checkTenant);
	}
	

	@SuppressWarnings("rawtypes")
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
		model.addAttribute("hosted", isHosted());
		String user = RuntimeProperties.getUsername();
		UserAccount account = null;
		if(RuntimeProperties.getTenant() != null) model.addAttribute("tenant", dao.getByPk(Tenant.class, RuntimeProperties.getTenant()));
		if(user != null) account = dao.getByPk(UserAccount.class, user);
		List<Tenant> tenants = new ArrayList<Tenant>();
		if(isHosted()) {
			if(account != null) {
				model.addAttribute("account", account);
				if(account.getTenants() != null) tenants.addAll(account.getTenants());
			}
		} else {
			tenants = dao.getAllTenants();
		}
		model.addAttribute("tenants", tenants);
		model.addAttribute("welcomeMessage", getProperty("sarsoft.welcomeMessage"));
		model.addAttribute("head", getCommonHeader(false));
		model.addAttribute("version", getProperty("sarsoft.version"));
		model.addAttribute("friendlyName", getProperty("sarsoft.name"));
		model.addAttribute("headerStyle", getProperty("sarsoft.header.style"));
		String objects = getProperty("sarsoft.objects");
		if(objects == null) objects = "map,search";
		model.addAttribute("objects", objects);
		
		if(model.asMap().containsKey("targetDest")) return "Pages.Password";
		if(isHosted() && account == null) return splash(model);
		return "Pages.Maps";
	}
	
	protected String splash(Model model) {
		if(RuntimeProperties.getProperty("sarsoft.ui.welcome.html") != null) {
			if(welcomeHTML == null) synchronized(this) {
				try {
					StringBuffer fileData = new StringBuffer(1000);
					BufferedReader reader = new BufferedReader(new FileReader(RuntimeProperties.getProperty("sarsoft.ui.welcome.html")));
					char[] buf = new char[1024];
					int numRead=0;
					while((numRead=reader.read(buf)) != -1){
						String readData = String.valueOf(buf, 0, numRead);
						fileData.append(readData);
						buf = new char[1024];
					}
					reader.close();
					welcomeHTML = fileData.toString();
		        	} catch (Exception e) {}
			}
			model.addAttribute("welcomeHTML", welcomeHTML);
		}
		model.addAttribute("welcomeMessage", getProperty("sarsoft.welcomeMessage"));
		return app(model, "Pages.Splash");
	}
	
	protected boolean isTenantRestrictedPage(String view) {
		return !("/map".equals(view) || "Pages.Maps".equals(view) || "Pages.Searches".equals(view) || "Pages.Tools".equals(view) || "Pages.Splash".equals(view) || "Pages.Account".equals(view) || "Pages.Find".equals(view));
	}

	protected String app(Model model, String view) {
		model.addAttribute("mapSources", getMapSources());
		model.addAttribute("geoRefImages", dao.getAllByAttr(GeoRefImage.class, "referenced", Boolean.TRUE));
		model.addAttribute("hosted", isHosted());
		model.addAttribute("userPermissionLevel", RuntimeProperties.getUserPermission());
		model.addAttribute("version", getProperty("sarsoft.version"));
		model.addAttribute("friendlyName", getProperty("sarsoft.name"));
		model.addAttribute("headerStyle", getProperty("sarsoft.header.style"));
		String objects = getProperty("sarsoft.objects");
		if(objects == null) objects = "map,search";
		model.addAttribute("objects", objects);
		String username = RuntimeProperties.getUsername();
		model.addAttribute("username", username);
		if(username != null)
			model.addAttribute("account", dao.getByPk(UserAccount.class, username));
		model.addAttribute("head", getCommonHeader(isTenantRestrictedPage(view)));
		// bounce users from pages that only make sense with tenants
		if(RuntimeProperties.getTenant() == null && isTenantRestrictedPage(view)) {
			return bounce(model);
		}
		// bounce users from listing pages unless they're logged in
		if(isHosted() && username == null && ("Pages.Maps".equals(view) || "Pages.Searches".equals(view))) return bounce(model);
		if(RuntimeProperties.getTenant() != null) model.addAttribute("tenant", dao.getByAttr(Tenant.class, "name", RuntimeProperties.getTenant()));
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
			if(gpx != null && gpx.indexOf("<?xml") > 0 && gpx.indexOf("<?xml") < 10) gpx = gpx.substring(gpx.indexOf("<?xml"));
			gpx = gpx.replaceAll("\u0004", "");
			transformer.transform(new StreamSource(new StringReader(gpx)), new StreamResult(writer));
			String xml = writer.toString();
			XMLSerializer serializer = new XMLSerializer();
			serializer.setRemoveNamespacePrefixFromElements(true);
			serializer.removeNamespace("gpx");
			JSON json = serializer.read(xml);
			return json;
		} catch (Exception e) {
			logger.error("Exception in parseGPXInternal", e);
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
