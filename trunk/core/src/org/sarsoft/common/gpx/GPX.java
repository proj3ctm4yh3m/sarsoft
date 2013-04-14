package org.sarsoft.common.gpx;

import java.io.StringReader;
import java.io.StringWriter;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

import javax.servlet.ServletContext;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.stream.StreamResult;
import javax.xml.transform.stream.StreamSource;

import net.sf.json.JSONArray;
import net.sf.json.JSONObject;
import net.sf.json.JSONSerializer;
import net.sf.json.xml.XMLSerializer;

import org.apache.log4j.Logger;
import org.sarsoft.common.json.JSONForm;

public class GPX {

	private static Logger logger = Logger.getLogger(GPX.class);

	public static JSONArray JSONArray(ServletContext sc, JSONForm form) {
		String gpx = form.getFile();
		if(gpx == null) {
			JSONObject obj = (JSONObject) JSONSerializer.toJSON(form.getJson());
			gpx = (String) obj.get("gpx");
		}

		try {
			TransformerFactory factory = TransformerFactory.newInstance();
			Transformer transformer = factory.newTransformer(new StreamSource(sc.getResourceAsStream("/xsl/gpx/gpx2shapes.xsl")));
			StringWriter writer = new StringWriter();
			if(gpx != null && gpx.indexOf("<?xml") > 0 && gpx.indexOf("<?xml") < 10) gpx = gpx.substring(gpx.indexOf("<?xml"));
			gpx = gpx.replaceAll("\u0004", "");
			transformer.transform(new StreamSource(new StringReader(gpx)), new StreamResult(writer));
			String xml = writer.toString();
			XMLSerializer serializer = new XMLSerializer();
			serializer.setRemoveNamespacePrefixFromElements(true);
			serializer.removeNamespace("gpx");
			return (JSONArray) serializer.read(xml);
		} catch (Exception e) {
			logger.error("Exception in parseGPXInternal", e);
			return (JSONArray) JSONSerializer.toJSON("[]");
		}
	}
	
	public static List<StyledGeoObject> StyledGeo(ServletContext sc, JSONForm form) {
		JSONArray jarray = JSONArray(sc, form);
		List<StyledGeoObject> sgo = new ArrayList<StyledGeoObject>();
		
		Iterator it = jarray.listIterator();
		while(it.hasNext()) {
			JSONObject jobject = (JSONObject) it.next();
			String type = jobject.getString("type");
			if("waypoint".equals(type)) {
				sgo.add(new StyledWaypoint(jobject));
			} else if("track".equals(type) || "route".equals(type)) {
				sgo.add(new StyledWay(jobject));
			}
		}
		
		return sgo;
	}
	
	public static JSONArray toGPX(List<StyledGeoObject> items) {
		JSONArray jarray = new JSONArray();
		for(StyledGeoObject item : items) {
			jarray.add(item.toGPX());
		}
		return jarray;
	}

}
