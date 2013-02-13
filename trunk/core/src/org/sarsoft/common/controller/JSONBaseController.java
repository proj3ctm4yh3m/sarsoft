package org.sarsoft.common.controller;

import java.io.StringReader;
import java.io.StringWriter;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
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
import org.sarsoft.common.dao.GenericHibernateDAO;
import org.sarsoft.common.model.GeoRef;
import org.sarsoft.common.model.JSONAnnotatedPropertyFilter;
import org.sarsoft.common.model.MapSource;
import org.sarsoft.common.model.Tenant;
import org.sarsoft.common.model.UserAccount;
import org.sarsoft.common.util.RuntimeProperties;
import org.sarsoft.plans.Constants;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.ui.Model;

public abstract class JSONBaseController {

	protected static String REST = "rest";
	protected static String APP = "app";
	
	private String header = null;
	private String preheader = null;
	
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
	
	@Autowired
	protected IServerController serverController;
	
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
				int time = Math.round((tenant.getCfgUpdated() != null ? tenant.getCfgUpdated() : 0L) / (1000*60*60*24)); // TODO tenant's timestamp
				List<MapSource> defaults = RuntimeProperties.getMapSources();
				for(MapSource ms : defaults) {
					if(ms.getDate() > time && !sources.contains(ms.getName())) sources.add(ms.getName());
				}
				return sources;
			}
		}
		return RuntimeProperties.getVisibleMapSources();
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
			for(GeoRef image : dao.loadAll(GeoRef.class)) {
				// TODO htmlescape this
				header = header + ((first) ? "" : ",") + "{getName: function() { return \"" + image.getName() + "\"}, name:\"" + image.getName() + "\", alias: \"" + image.getName() + "\", id: " + image.getId() +
					", x1: " + image.getX1() + ", y1: " + image.getY1() + ", x2: " + image.getX2() + ", y2: " + image.getY2() + ", lat1: " + image.getLat1() + ", lng1: " + image.getLng1() +
					", lat2: " + image.getLat2() + ", lng2: " + image.getLng2() + ", " + "url: \"" + image.getUrl() + "\"}";
				first = false;
			}
			header = header + "];\n\norg.sarsoft.EnhancedGMap.visibleMapTypes = [\n";
			first = true;
			for(String source : getVisibleMapSources(checkTenant)) {
				header = header + ((first) ? "" : ",") + "\"" + source + "\"";
				first = false;
			}
			header = header + "];\n";
			
			header = header + "org.sarsoft.server=\"" + RuntimeProperties.getServerUrl() + "\"\n";

			String datum = "WGS84";
			if(getProperty("sarsoft.map.datum") != null) datum = getProperty("sarsoft.map.datum");
			
			if(checkTenant && RuntimeProperties.getTenant() != null) {
				Tenant tenant = dao.getByPk(Tenant.class, RuntimeProperties.getTenant());
				if(tenant.getDatum() != null) datum = tenant.getDatum();
			}

			UserAccount account = (RuntimeProperties.getUsername() != null) ? account = dao.getByPk(UserAccount.class, RuntimeProperties.getUsername()) : null;
			header = header + "org.sarsoft.map.datum=\"" + datum + "\"\n";
			if(RuntimeProperties.getTenant() != null) {
				header = header + "org.sarsoft.tenantid=\"" + RuntimeProperties.getTenant() + "\"\n" +
					"org.sarsoft.tenantname=\"" + dao.getByAttr(Tenant.class, "name", RuntimeProperties.getTenant()).getPublicName() + "\"\n";
			}
			header = header + ((account != null) ? ("org.sarsoft.username=\"" + account.getEmail() + "\"\n"  + "org.sarsoft.alias=\"" + account.getHandle() + "\"\n") : "") +
				"org.sarsoft.userPermissionLevel=\"" + RuntimeProperties.getUserPermission() + "\"";

			header = header + "</script>\n";
				
			if("google".equals(this.mapViewer)) {
				return header + "<script src=\"http://maps.googleapis.com/maps/api/js?sensor=false&libraries=geometry,drawing\" type=\"text/javascript\"></script>" + this.header;
			} else {
				return header + "<script src=\"/static/js/openlayers.js\"></script>\n" +
				"<script src=\"/static/js/gmapolwrapper.js\"></script>" + this.header;
			}
		}
		synchronized(this) {
			String preheader = "if(typeof org == \"undefined\") org = new Object();\nif(typeof org.sarsoft == \"undefined\") org.sarsoft = new Object();\nif(typeof org.sarsoft.map == \"undefined\") org.sarsoft.map = new Object();" +
			"org.sarsoft.version=\"" + getProperty("sarsoft.version") + "\"\n" +
			"org.sarsoft.hosted=" + isHosted() + "\n" +
			"org.sarsoft.Constants=" + JSONAnnotatedPropertyFilter.fromObject(Constants.all) + "\n" +
			"org.sarsoft.imgPrefix=\"" + getProperty("sarsoft.images.url") + "\"\n" +
			"org.sarsoft.garmin = new Object(); org.sarsoft.garmin.hostName=\"http://" + RuntimeProperties.getServerName() +  "\"\n" +
			"org.sarsoft.garmin.deviceKey=\"" + this.getProperty("garmin.key." + RuntimeProperties.getServerName()) + "\"\n" +
			"org.sarsoft.map._default = new Object();\n" +
			"org.sarsoft.map._default.zoom = " + getProperty("sarsoft.map.default.zoom") + ";\n" +
			"org.sarsoft.map._default.lat = " + getProperty("sarsoft.map.default.lat") + ";\n" +
			"org.sarsoft.map._default.lng = " + getProperty("sarsoft.map.default.lng") + ";\n" +
			"org.sarsoft.map.overzoom = new Object();\n" +
			"org.sarsoft.map.overzoom.enabled = " + getProperty("sarsoft.map.overzoom.enabled") + ";\n" +
			"org.sarsoft.map.overzoom.level = " + getProperty("sarsoft.map.overzoom.level") + ";\n" +
			"org.sarsoft.map.refreshInterval = " + RuntimeProperties.getProperty("sarsoft.refresh.interval") + ";\n" +
			"org.sarsoft.map.autoRefresh = " + RuntimeProperties.getProperty("sarsoft.refresh.auto") + ";\n" +
			"org.sarsoft.map.datums = new Object();\n" +
			"org.sarsoft.map.datums[\"NAD27 CONUS\"] = {a: 6378206.4, b: 6356583.8, f: 1/294.9786982, x : -8, y : 160, z : 176};\n" +
			"org.sarsoft.map.datums[\"WGS84\"] = {a: 6378137.0, b: 6356752.314, f: 1/298.257223563, x : 0, y : 0, z : 0};\n" +
			"if(typeof org.sarsoft.EnhancedGMap == \"undefined\") org.sarsoft.EnhancedGMap = function() {}\n" +
			(getProperty("sarsoft.map.backgrounds.grouping")!=null ? ("org.sarsoft.EnhancedGMap.mapTypeGrouping=\"" + getProperty("sarsoft.map.backgrounds.grouping") + "\"\n") : "") +
			(getProperty("sarsoft.map.samples")!=null ? ("org.sarsoft.EnhancedGMap.sampleMapTypes=\"" + getProperty("sarsoft.map.samples") + "\"\n") : "") +
			"org.sarsoft.EnhancedGMap.defaultMapTypes = [\n";
			boolean first = true;
			boolean tileCacheEnabled = Boolean.parseBoolean(getProperty("sarsoft.map.tileCacheEnabled"));
			for(MapSource source : RuntimeProperties.getMapSources()) {
				if(!source.isAlphaOverlay() && !source.isData()) {
					preheader = preheader + ((first) ? "" : ",") + "{name: \"" + source.getName() + "\", alias: \"" + source.getAlias() + "\", type: \"" + source.getType() + 
						"\", copyright: \"" + source.getCopyright() + "\", minresolution: " + source.getMinresolution() + ", maxresolution: " + source.getMaxresolution() + ", date: " + source.getDate() +
						", png: " + source.isPng() + ", alphaOverlay: " + source.isAlphaOverlay() + ", info: \"" + ((source.getInfo() == null) ? "" : source.getInfo()) + 
						"\", description: \"" + ((source.getDescription() == null) ? "" : source.getDescription()) + "\", template: \"";
					if(source.getType() == MapSource.Type.TILE && tileCacheEnabled && source.getTemplate().startsWith("http")) {
						preheader = preheader + "/resource/imagery/tilecache/" + source.getName() + "/{Z}/{X}/{Y}.png";
					} else {
						preheader = preheader + source.getTemplate();
					}
					preheader = preheader + "\"}";
					first = false;
				}
			}
			for(MapSource source : RuntimeProperties.getMapSources()) {
				if(source.isAlphaOverlay()) {
					preheader = preheader + ",{name: \"" + source.getName() + "\", alias: \"" + source.getAlias() + "\", type: \"" + source.getType() + 
						"\", copyright: \"" + source.getCopyright() + "\", minresolution: " + source.getMinresolution() + ", maxresolution: " + source.getMaxresolution() + ", date: " + source.getDate() +
						", opacity: " + source.getOpacity() + ", png: " + source.isPng() + ", alphaOverlay: " + source.isAlphaOverlay() + ", info: \"" + ((source.getInfo() == null) ? "" : source.getInfo()) + 
						"\", description: \"" + ((source.getDescription() == null) ? "" : source.getDescription()) + "\", template: \"";
					if(source.getType() == MapSource.Type.TILE && tileCacheEnabled && source.getTemplate().startsWith("http")) {
						preheader = preheader + "/resource/imagery/tilecache/" + source.getName() + "/{Z}/{X}/{Y}.png";
					} else {
						preheader = preheader + source.getTemplate();
					}
					preheader = preheader + "\"}\n";
				}
			}
			preheader = preheader + "];\n";
			this.preheader = preheader;

			String header = "";
			if("local".equals(getProperty("sarsoft.js.server"))) {
				header = "<script src=\"/static/js/yui.js\"></script>\n" +
				"<script src=\"/static/js/jquery-1.6.4.js\"></script>\n";
			} else {
				header = "<script type=\"text/javascript\" src=\"http://yui.yahooapis.com/combo?2.9.0/build/yahoo-dom-event/yahoo-dom-event.js&2.9.0/build/connection/connection-min.js&2.9.0/build/dragdrop/dragdrop-min.js&2.9.0/build/container/container-min.js&2.9.0/build/cookie/cookie-min.js&2.9.0/build/datasource/datasource-min.js&2.9.0/build/element/element-min.js&2.9.0/build/datatable/datatable-min.js&2.9.0/build/json/json-min.js&2.9.0/build/menu/menu-min.js&2.9.0/build/slider/slider-min.js&2.9.0/build/tabview/tabview-min.js\"></script>\n" +
				"<script src=\"http://code.jquery.com/jquery-1.6.4.js\"></script>\n";
			}
			header = header + serverController.getHeader();
			header = header +
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

	private void addJsonToModel(Model model, Object obj) {
		if(obj == null) return;
		model.addAttribute("json", toJSON(obj));
	}
	
	protected String jsonframe(Model model, Object obj) {
		addJsonToModel(model, obj);
		return "/jsonframe";
	}

	protected String json(Model model, Object obj) {
		addJsonToModel(model, obj);
		return "/json";
	}

	protected String bounce(Model model) {
		String dest = serverController.bounce(model);
		if(dest != null && dest.startsWith("redirect:")) return dest;

		model.addAttribute("hosted", isHosted());
		if(RuntimeProperties.getTenant() != null) model.addAttribute("tenant", dao.getByPk(Tenant.class, RuntimeProperties.getTenant()));
		model.addAttribute("head", getCommonHeader(false));
		model.addAttribute("version", getProperty("sarsoft.version"));

		return dest;
	}

	protected String splash(Model model) {
		String view = serverController.splash(model);
		if(view.startsWith("redirect")) return view;
		return app(model, view);
	}
	
	protected String app(Model model, String view) {
		model.addAttribute("mapSources", RuntimeProperties.getMapSources());
		model.addAttribute("geoRefImages", dao.loadAll(GeoRef.class));
		model.addAttribute("hosted", isHosted());
		model.addAttribute("userPermissionLevel", RuntimeProperties.getUserPermission());
		model.addAttribute("version", getProperty("sarsoft.version"));
		String username = RuntimeProperties.getUsername();
		model.addAttribute("username", username);
		if(username != null)
			model.addAttribute("account", dao.getByPk(UserAccount.class, username));
		model.addAttribute("head", getCommonHeader(serverController.isTenantRestrictedPage(view)));
		// bounce users from pages that only make sense with tenants
		if(RuntimeProperties.getTenant() == null && serverController.isTenantRestrictedPage(view)) {
			return bounce(model);
		}
		// bounce users from listing pages unless they're logged in
		if(isHosted() && username == null && serverController.isLoginRestrictedPage(view)) return bounce(model);
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
