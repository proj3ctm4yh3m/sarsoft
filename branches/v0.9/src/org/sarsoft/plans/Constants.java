package org.sarsoft.plans;

import java.util.HashMap;
import java.util.Map;

import org.sarsoft.plans.model.Probability;
import org.sarsoft.plans.model.SearchAssignment;
import org.sarsoft.plans.model.SearchAssignment.ResourceType;

public class Constants {

	public static String[] colorsById = {"#FF0000", "#FF5500", "#FFAA00", "#0000FF", "#0088FF", "#8800FF"};

	public static Map<ResourceType, String> colorsByResourceType = new HashMap<ResourceType, String>();
	public static Map<Probability, String> colorsByProbability = new HashMap<Probability, String>();
	public static Map<SearchAssignment.Status, String> colorsByStatus = new HashMap<SearchAssignment.Status, String>();

	public static Map<String, Object> all = new HashMap<String, Object>();

	static {
		colorsByResourceType.put(ResourceType.GROUND, "#FF0000");
		colorsByResourceType.put(ResourceType.DOG, "#FF8800");
		colorsByResourceType.put(ResourceType.MOUNTED, "#0088FF");
		colorsByResourceType.put(ResourceType.OHV, "#8800FF");

		colorsByProbability.put(Probability.LOW, "#0088FF");
		colorsByProbability.put(Probability.MEDIUM, "#FF8800");
		colorsByProbability.put(Probability.HIGH, "#FF0000");

		colorsByStatus.put(SearchAssignment.Status.DRAFT, "#0088FF");
		colorsByStatus.put(SearchAssignment.Status.PREPARED, "#FF8800");
		colorsByStatus.put(SearchAssignment.Status.INPROGRESS, "#FF0000");
		colorsByStatus.put(SearchAssignment.Status.COMPLETED, "#8800FF");

		all.put("colorsById", colorsById);
		all.put("colorsByResourceType", colorsByResourceType);
		all.put("colorsByProbability", colorsByProbability);
		all.put("colorsByStatus", colorsByStatus);
		all.put("probability", Probability.values());
		all.put("resourceType", ResourceType.values());

		all = convert(all);
	}

	@SuppressWarnings("rawtypes")
	static private Map<String, Object> convert(Map map) {
		Map<String, Object> strmap = new HashMap<String, Object>();
		for(Object key : map.keySet()) {
			if(map.get(key) instanceof Map) {
				strmap.put(key.toString(), convert((Map) map.get(key)));
			} else {
				strmap.put(key.toString(), map.get(key));
			}
		}
		return strmap;
	}

	public static String getColorById(int id) {
		return colorsById[id % colorsById.length];
	}

}
