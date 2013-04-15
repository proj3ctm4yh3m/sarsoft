package org.sarsoft.common.controller;

import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;

import net.sf.json.JSONArray;
import net.sf.json.JSONObject;
import net.sf.json.JSONSerializer;

import org.sarsoft.common.Pair;
import org.sarsoft.common.dao.GenericHibernateDAO;
import org.sarsoft.common.gpx.GPXDesc;
import org.sarsoft.common.gpx.StyledGeoObject;
import org.sarsoft.common.model.ClientState;
import org.sarsoft.common.model.GeoMapObject;
import org.sarsoft.common.model.Tenant;
import org.sarsoft.common.json.JSONAnnotatedPropertyFilter;
import org.sarsoft.common.model.MapObject;
import org.sarsoft.common.util.RuntimeProperties;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;

@Component
@SuppressWarnings({"rawtypes", "unchecked"})
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

	public ClientState fromDB(Date date) {
		ClientState state = new ClientState();
		for(String type : getDataTypes()) {
			state.add(type, (List<MapObject>) dao.loadSince(getController(type).getC(), date));
		}
		return state;
	}

	public ClientState fromDB() {
		ClientState state = new ClientState();
		for(String type : getDataTypes()) {
			state.add(type, (List<MapObject>) dao.loadAll(getController(type).getC()));
		}
		Tenant tenant = dao.getByAttr(Tenant.class, "name", RuntimeProperties.getTenant());
		state.setMapConfig(tenant.getMapConfig());
		state.setMapLayers(tenant.getLayers());
		return state;
	}

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
		
		if(json.has("MapConfig")) state.setMapConfig(json.getJSONObject("MapConfig").toString());
		if(json.has("MapLayers")) state.setMapLayers(json.getJSONArray("MapLayers").join(","));
		
		return state;
	}

	public void toDB(ClientState state) {
		Set<String> unsaved = new HashSet<String>(state.types());
		while(unsaved.size() > 0) {
			Iterator<String> it = unsaved.iterator();
			while(it.hasNext()) {
				String type = it.next();
				boolean ready = true;
				MapObjectController controller = getController(type);
				String[] dependencies = controller.getLinkDependencies();
				for(String dependency : dependencies) {
					if(unsaved.contains(dependency)) ready = false;
				}
				if(ready) {
					it.remove();
					for(MapObject object : state.get(type)) {
						getController(type).persist(object);
					}
				}
			}
		}
		if(state.getMapConfig() != null) {
			Tenant tenant = dao.getByAttr(Tenant.class, "name", RuntimeProperties.getTenant());
			tenant.setMapConfig(state.getMapConfig());
			tenant.setLayers(state.getMapLayers());
			tenant.setCfgUpdated(System.currentTimeMillis());
			dao.save(tenant);
		}
	}

	public JSONObject toJSON(ClientState state) {
		Map m = new HashMap();
		m.put("timestamp", Long.toString(new Date().getTime()));
		for(String key : state.types()) {
			m.put(key, state.get(key));
		}
		try {
			if(state.getMapConfig() != null) m.put("MapConfig", (JSONObject)  JSONSerializer.toJSON(state.getMapConfig()));
		} catch (net.sf.json.JSONException e) {
			// ignore invalid json stored on object
		}
		if(state.getMapLayers() != null) m.put("MapLayers", state.getMapLayers().split(","));
		return JSONAnnotatedPropertyFilter.fromObject(m);
	}

	public Pair<GPXDesc, List<StyledGeoObject>> toStyledGeo(ClientState state) {
		GPXDesc desc = new GPXDesc();
		desc.setAttr("mapConfig", state.getMapConfig());
		for(String type : getDataTypes()) {
			if(state.get(type) != null) desc.setAttr(type, getController(type).toGPXDesc(state.get(type)));
		}
		
		List<StyledGeoObject> items = new ArrayList<StyledGeoObject>();
		for(String type : state.types()) {
			GeoMapObjectController controller = getGeoController(type);
			if(controller != null) for(MapObject object : state.get(type)) {
				items.add(controller.toStyledGeo((GeoMapObject) object));
			}
		}
		return new Pair<GPXDesc, List<StyledGeoObject>>(desc, items);
	}
	
	public ClientState fromStyledGeo(Pair<GPXDesc, List<StyledGeoObject>> geo) {
		ClientState state = new ClientState();

		GPXDesc desc = geo.getFirst();
		if(desc != null) {
			if(desc.hasAttr("mapConfig")) state.setMapConfig(desc.getAttr("mapConfig"));
			for(String type : getDataTypes()) {
				state.add(type, getController(type).fromGPXDesc(desc));
			}
		}

		List<StyledGeoObject> items = geo.getSecond();
		for(StyledGeoObject item : items) {
			Pair<String, Pair<Integer, GeoMapObject>> best = null;
			for(String key : getGeoDataTypes()) {
				try {
					Pair<Integer, GeoMapObject> pair = this.getGeoController(key).fromStyledGeo(item);
					if(pair != null && (best == null || pair.getFirst() > best.getSecond().getFirst())) best = new Pair<String, Pair<Integer, GeoMapObject>>(key, pair);
				} catch (Exception e) { }
			}
			if(best != null) state.add(best.getFirst(), best.getSecond().getSecond());
		}
		
		return state;
	}
	
	public void dedupe(ClientState removeFrom, ClientState checkAgainst) {
		for(String type : removeFrom.types()) {
			GeoMapObjectController controller = getGeoController(type);
			if(controller != null) removeFrom.remove(type, controller.dedupe(removeFrom.get(type), checkAgainst.get(type)));
		}
	}
	
	public void removeAllFromDB() {
		for(String type : getDataTypes()) {
			dao.deleteAll(getController(type).getC());
		}
	}

}
