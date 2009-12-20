package org.sarsoft.common.util;

import java.util.HashMap;
import java.util.Map;

import org.sarsoft.plans.model.Probability;
import org.sarsoft.plans.model.SearchAssignment;
import org.sarsoft.plans.model.SearchAssignment.ResourceType;

public class Constants {

	public static String[] colorsById = {"#FF0000", "#00FF00", "#0000FF", "#FF8200", "#9200FF", "#FFD000", "#DF00D2", "#00C0FF", "#FF7A7A", "#FFBF00", "#462F95"};

	public static Map<ResourceType, String> colorsByResourceType = new HashMap<ResourceType, String>();
	public static Map<Probability, String> colorsByProbability = new HashMap<Probability, String>();
	public static Map<SearchAssignment.Status, String> colorsByStatus = new HashMap<SearchAssignment.Status, String>();

	public static Map<String, Object> all = new HashMap<String, Object>();

	static {
		colorsByResourceType.put(ResourceType.GROUND, "#0000FF");
		colorsByResourceType.put(ResourceType.DOG, "#00FF00");
		colorsByResourceType.put(ResourceType.MOUNTED, "#FF0000");
		colorsByResourceType.put(ResourceType.OHV, "#FFFF00");

		colorsByProbability.put(Probability.LOW, "#0000FF");
		colorsByProbability.put(Probability.MEDIUM, "#00FF00");
		colorsByProbability.put(Probability.HIGH, "#FF0000");
		colorsByProbability.put(Probability.VERY_HIGH, "#FFFF00");

		colorsByStatus.put(SearchAssignment.Status.DRAFT, "#0000FF");
		colorsByStatus.put(SearchAssignment.Status.PREPARED, "#00FF00");
		colorsByStatus.put(SearchAssignment.Status.INPROGRESS, "#FF0000");
		colorsByStatus.put(SearchAssignment.Status.COMPLETED, "#FFFF00");

		all.put("colorsById", colorsById);
		all.put("colorsByResourceType", colorsByResourceType);
		all.put("colorsByProbability", colorsByProbability);
		all.put("colorsByStatus", colorsByStatus);
		all.put("probability", Probability.values());
		all.put("resourceType", ResourceType.values());

		all = convert(all);
	}

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

}
