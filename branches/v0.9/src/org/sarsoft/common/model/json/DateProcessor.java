package org.sarsoft.common.model.json;

import java.util.Date;

import net.sf.json.JsonConfig;
import net.sf.json.processors.JsonValueProcessor;

public class DateProcessor implements JsonValueProcessor {

	public Object processArrayValue(Object arg0, JsonConfig arg1) {
		// TODO Auto-generated method stub
		return null;
	}

	public Object processObjectValue(String arg0, Object arg1, JsonConfig arg2) {
		if(arg1 == null) return null;
		Date date = (Date) arg1;
		return Long.toString(date.getTime());
	}
}
