package org.sarsoft.common.controller;

import java.util.Date;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;

import net.sf.json.JSONArray;
import net.sf.json.JSONObject;

import org.sarsoft.common.dao.GenericHibernateDAO;
import org.sarsoft.common.model.ClientState;
import org.sarsoft.common.model.JSONAnnotatedPropertyFilter;
import org.sarsoft.common.model.MapObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;

@Component
public class DataManager {

	private Map<String, MapObjectController> controllers = new HashMap<String, MapObjectController>();
	private Map<String, GeoMapObjectController> geoControllers = new HashMap<String, GeoMapObjectController>();
	
	@Autowired
	@Qualifier("genericDAO")
	protected GenericHibernateDAO dao;

	public synchronized void register(String name, MapObjectController controller) {
		controllers.put(name, controller);
		if(controller instanceof GeoMapObjectController) geoControllers.put(name, ((GeoMapObjectController) controller));
	}
	
	public MapObjectController getController(String name) {
		return controllers.get(name);
	}
	
	public Set<String> getDataTypes() {
		return controllers.keySet();
	}

	public GeoMapObjectController getGeoController(String name) {
		return geoControllers.get(name);
	}
	
	public Set<String> getGeoDataTypes() {
		return geoControllers.keySet();
	}

	@SuppressWarnings("unchecked")
	public ClientState fromDB() {
		ClientState state = new ClientState();
		for(String type : getDataTypes()) {
			state.add(type, (List<MapObject>) dao.loadAll(getController(type).getC()));
		}
		return state;
	}

	@SuppressWarnings("rawtypes")
	public ClientState fromJSON(JSONObject json) {
		ClientState state = new ClientState();

		for(String key : getDataTypes()) {
			JSONArray jarray = (JSONArray) json.get(key);
			if(jarray != null && jarray.size() > 0) {
				Iterator it = jarray.listIterator();
				while(it.hasNext()) {
					JSONObject jobj = (JSONObject) it.next();
					state.add(key, getController(key).make(jobj));
				}
			}
		}
		
		return state;
	}

	public void toDB(ClientState state) {
		for(String type : state.types()) {
			for(MapObject object : state.get(type)) {
				getController(type).persist(object);
			}
		}
	}

	@SuppressWarnings({ "rawtypes", "unchecked" })
	public JSONObject toJSON(ClientState state) {
		Map m = new HashMap();
		m.put("timestamp", Long.toString(new Date().getTime()));
		for(String key : state.types()) {
			m.put(key, state.get(key));
		}
		return JSONAnnotatedPropertyFilter.fromObject(m);
	}
		
	
	public JSONArray toGPX(ClientState state) {
		JSONArray jarray = new JSONArray();
		for(String type : state.types()) {
			GeoMapObjectController controller = getGeoController(type);
			for(MapObject object : state.get(type)) {
				jarray.add(controller.toGPX(object));
			}
		}
		
		return jarray;
	}
	
	@SuppressWarnings("rawtypes")
	public ClientState fromGPX(JSONArray gpx) {
		ClientState state = new ClientState();
		Iterator it = gpx.listIterator();
		while(it.hasNext()) {
			JSONObject jobject = (JSONObject) it.next();
			for(String key : getGeoDataTypes()) {
				MapObject obj = this.getGeoController(key).fromGPX(jobject);
				if(obj != null) {
					state.add(key, obj);
					break;
				}
			}
		}
		
		return state;
	}
}
