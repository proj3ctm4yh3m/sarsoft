package org.sarsoft.common.json;

import java.lang.reflect.Method;
import java.util.Date;
import java.util.List;

import org.sarsoft.common.json.DateProcessor;
import org.sarsoft.common.json.ListProcessor;
import net.sf.json.JSONArray;
import net.sf.json.JSONObject;
import net.sf.json.JsonConfig;
import net.sf.json.util.PropertyFilter;

public class JSONAnnotatedPropertyFilter implements PropertyFilter {

	public boolean apply(Object source, String name, Object value) {
		if(source == null) return true;

		Class<?> cls;
		try {
			String className = source.getClass().getName();
			if(className.indexOf("_$$_") > 0) className = className.substring(0, className.indexOf("_$$_"));
			cls = Class.forName(className);
		} catch (Exception e) {
			return false;
		}
		if(!cls.isAnnotationPresent(JSONAnnotatedEntity.class)) {
			if(source.getClass().getName().indexOf("javassist") >= 0) {
				return true;
			}
			return false;
		}
		for(Method method : cls.getMethods()) {
			if(method.getName().equalsIgnoreCase("get" + name) || method.getName().equalsIgnoreCase("is" + name)) {
				if(method.isAnnotationPresent(JSONSerializable.class)) return false;
				return true;
			}
		}
		return true;
	}

	public static JSONObject fromObject(Object obj) {
		JsonConfig config = new JsonConfig();
		config.setJsonPropertyFilter(new JSONAnnotatedPropertyFilter());
		config.registerJsonValueProcessor(Date.class, new DateProcessor());
		config.registerJsonValueProcessor(List.class, new ListProcessor());
		return JSONObject.fromObject(obj, config);
	}

	public static JSONArray fromArray(Object obj) {
		JsonConfig config = new JsonConfig();
		config.setJsonPropertyFilter(new JSONAnnotatedPropertyFilter());
		config.registerJsonValueProcessor(Date.class, new DateProcessor());
		config.registerJsonValueProcessor(List.class, new ListProcessor());
		return JSONArray.fromObject(obj, config);
	}

}
