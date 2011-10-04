package org.sarsoft.common.model.json;

import java.util.List;

import org.sarsoft.common.model.JSONAnnotatedPropertyFilter;
import net.sf.json.JsonConfig;
import net.sf.json.processors.JsonValueProcessor;

public class ListProcessor implements JsonValueProcessor {
	public Object processArrayValue(Object arg0, JsonConfig arg1) {

		return null;
	}

	@SuppressWarnings("rawtypes")
	public Object processObjectValue(String arg0, Object arg1, JsonConfig arg2) {
		if(arg1 == null) return null;
		Object[] array = ((List) arg1).toArray();
		return JSONAnnotatedPropertyFilter.fromArray(array);
	}

}
