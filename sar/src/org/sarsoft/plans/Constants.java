package org.sarsoft.plans;

import java.util.HashMap;
import java.util.Map;

import org.sarsoft.plans.model.Probability;
import org.sarsoft.plans.model.Assignment;
import org.sarsoft.plans.model.Assignment.ResourceType;

public class Constants {

	public static String[] colorsById = {"#FF0000", "#FF5500", "#FFAA00", "#0000FF", "#0088FF", "#8800FF"};

	public static Map<ResourceType, String> colorsByResourceType = new HashMap<ResourceType, String>();
	public static Map<Probability, String> colorsByProbability = new HashMap<Probability, String>();
	public static Map<Assignment.Status, String> colorsByStatus = new HashMap<Assignment.Status, String>();

	static {
		colorsByResourceType.put(ResourceType.GROUND, "#FF0000");
		colorsByResourceType.put(ResourceType.DOG, "#FF8800");
		colorsByResourceType.put(ResourceType.MOUNTED, "#0088FF");
		colorsByResourceType.put(ResourceType.OHV, "#8800FF");

		colorsByProbability.put(Probability.LOW, "#0088FF");
		colorsByProbability.put(Probability.MEDIUM, "#FF8800");
		colorsByProbability.put(Probability.HIGH, "#FF0000");

		colorsByStatus.put(Assignment.Status.DRAFT, "#0088FF");
		colorsByStatus.put(Assignment.Status.PREPARED, "#FF8800");
		colorsByStatus.put(Assignment.Status.INPROGRESS, "#FF0000");
		colorsByStatus.put(Assignment.Status.COMPLETED, "#8800FF");
	}

	@SuppressWarnings("rawtypes")
	static public Map<String, Object> convert(Map map) {
		Map<String, Object> strmap = new HashMap<String, Object>();
		for(Object key : map.keySet()) {
			strmap.put(key.toString(), map.get(key));
		}
		return strmap;
	}

	public static String getColorById(int id) {
		return colorsById[id % colorsById.length];
	}

}
