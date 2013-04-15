package org.sarsoft.common.model;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import edu.emory.mathcs.backport.java.util.Collections;

public class ClientState {
	
	private String mapConfig;
	private String mapLayers;
	private Map<String, List<MapObject>> map = new HashMap<String, List<MapObject>>();
	
	public Set<String> types() {
		return map.keySet();
	}
	
	public void add(String name, MapObject obj) {
		if(!map.containsKey(name)) map.put(name, new ArrayList<MapObject>());
		
		map.get(name).add(obj);
	}
	
	public void add(String name, List<MapObject> obj) {
		if(obj == null) return;
		if(!map.containsKey(name)) {
			map.put(name, obj);
		} else {
			map.get(name).addAll(obj);
		}
	}
	
	public void remove(String name, List<MapObject> remove) {
		if(remove == null) return;
		map.get(name).removeAll(remove);
	}
	
	@SuppressWarnings("unchecked")
	public List<MapObject> get(String name) {
		if(!map.containsKey(name)) return null;
		return (List <MapObject>) Collections.unmodifiableList(map.get(name));
	}
	
	public void setMapConfig(String mapConfig) {
		this.mapConfig = mapConfig;
	}
	
	public String getMapConfig() {
		return mapConfig;
	}
	
	public void setMapLayers(String mapLayers) {
		this.mapLayers = mapLayers;
	}
	
	public String getMapLayers() {
		return this.mapLayers;
	}

}
