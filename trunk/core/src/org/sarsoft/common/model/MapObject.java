package org.sarsoft.common.model;

import net.sf.json.JSONObject;

public abstract class MapObject extends SarModelObject {

	public abstract void from(JSONObject json);

	public static JSONObject json(Object obj){
		return JSONAnnotatedPropertyFilter.fromObject(obj);
	}

}
