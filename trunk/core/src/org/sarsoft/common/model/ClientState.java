package org.sarsoft.common.model;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import edu.emory.mathcs.backport.java.util.Collections;

public class ClientState {
	
	private Map<String, List<MapObject>> map = new HashMap<String, List<MapObject>>();
	
	public Set<String> types() {
		return map.keySet();
	}
	
	public void add(String name, MapObject obj) {
		if(!map.containsKey(name)) map.put(name, new ArrayList<MapObject>());
		
		map.get(name).add(obj);
	}
	
	public void add(String name, List<MapObject> obj) {
		if(!map.containsKey(name)) {
			map.put(name, obj);
		} else {
			map.get(name).addAll(obj);
		}
	}
	
	@SuppressWarnings("unchecked")
	public List<MapObject> get(String name) {
		return (List <MapObject>) Collections.unmodifiableList(map.get(name));
	}

}
