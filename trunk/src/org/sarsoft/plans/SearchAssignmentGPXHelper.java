package org.sarsoft.plans;

import java.io.UnsupportedEncodingException;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import net.sf.json.JSONArray;
import net.sf.json.JSONObject;

import org.apache.log4j.Logger;
import org.sarsoft.common.dao.GenericHibernateDAO;
import org.sarsoft.common.model.Way;
import org.sarsoft.common.model.WayType;
import org.sarsoft.common.model.Waypoint;
import org.sarsoft.common.util.RuntimeProperties;
import org.sarsoft.plans.model.Clue;
import org.sarsoft.plans.model.Clue.Disposition;
import org.sarsoft.plans.model.OperationalPeriod;
import org.sarsoft.plans.model.Probability;
import org.sarsoft.plans.model.Search;
import org.sarsoft.plans.model.SearchAssignment;
import org.sarsoft.plans.model.SearchAssignment.ResourceType;
import org.sarsoft.plans.model.SearchAssignment.Status;

public class SearchAssignmentGPXHelper {

	public static Map<String, Class> searchClassHints = new HashMap<String, Class>();
	private static Logger logger = Logger.getLogger(SearchAssignmentGPXHelper.class);

	static {
		Map<String, Class> m = new HashMap<String, Class>();
		m.put("waypoints", Waypoint.class);
		m.put("lkp", Waypoint.class);
		m.put("pls", Waypoint.class);
		m.put("cp", Waypoint.class);
		m.put("clues", Map.class);
		m.put("ways", Map.class);
		m.put("assignments", Map.class);
		searchClassHints = Collections.unmodifiableMap(m);
	}

	@SuppressWarnings("unchecked")
	public static Map<String, Object> gpxifySearch(Search search, GenericHibernateDAO dao) {
		Map<String, Object> modified = new HashMap<String, Object>();		
		modified.put("assignments", gpxifyAssignmentList((List<SearchAssignment>) dao.loadAll(SearchAssignment.class)));
		if(search.getLkp() != null) modified.put("lkp", search.getLkp());
		if(search.getPls() != null) modified.put("pls", search.getPls());
		if(search.getCP() != null) modified.put("cp", search.getCP());

		List<Map<String, Object>> modifiedClues = new ArrayList<Map<String, Object>>();
		List<Clue> clues = (List<Clue>) dao.loadAll(Clue.class);
		for(Clue clue : clues) {
			Map<String, Object> map = new HashMap<String, Object>();
			map.put("id", clue.getId());
			map.put("position", clue.getPosition());
			Map<String, String> attrs = new HashMap<String, String>();
			if(clue.getAssignmentId() != null) attrs.put("assignmentid", clue.getAssignmentId());
			attrs.put("description", clue.getDescription());
			attrs.put("location", clue.getLocation());
			attrs.put("summary", clue.getSummary());
			if(clue.getFound() != null) attrs.put("found", Long.toString(clue.getFound().getTime()));
			if(clue.getInstructions() != null) attrs.put("instructions", clue.getInstructions().toString());
			if(clue.getUpdated() != null) attrs.put("updated", Long.toString(clue.getUpdated().getTime()));
			map.put("desc", encodeAttrs(attrs));
			modifiedClues.add(map);
		}
		modified.put("clues", modifiedClues);
		
		Map<String, String> attrs = new HashMap<String, String>();
		attrs.put("mapConfig", search.getMapConfig());
		
		List<OperationalPeriod> periods = dao.loadAll(OperationalPeriod.class);
		Map<String, String> periodAttrs = new HashMap<String, String>();
		for(OperationalPeriod period : periods) {
			periodAttrs.put(period.getId().toString(), period.getDescription());
		}
		attrs.put("periods", encodeAttrs(periodAttrs));

		modified.put("desc", encodeAttrs(attrs));
		return modified;
	}

	@SuppressWarnings({ "unchecked", "rawtypes" })
	public static void updateSearch(JSONObject json, GenericHibernateDAO dao) {
		Map m = (Map) JSONObject.toBean(json, Map.class, searchClassHints);
		
		Map<String, String> attrs = decodeAttrs((String) m.get("desc")); 
		Search search = (Search) dao.getByAttr(Search.class, "name", RuntimeProperties.getSearch());
		if(attrs.containsKey("mapConfig")) search.setMapConfig(attrs.get("mapConfig"));
		
		if(m.containsKey("lkp")) search.setLkp((Waypoint) m.get("lkp"));
		if(m.containsKey("pls")) search.setPls((Waypoint) m.get("pls"));
		if(m.containsKey("cp")) search.setCP((Waypoint) m.get("cp"));
		
		dao.save(search);

		Map<String, String> periodAttrs = decodeAttrs(attrs.get("periods"));
		for(String id : periodAttrs.keySet()) {
			OperationalPeriod period = (OperationalPeriod) dao.load(OperationalPeriod.class, Long.parseLong(id));
			if(period == null) {
				period = new OperationalPeriod();
				period.setDescription(attrs.get(id));
				period.setId(Long.parseLong(id));
				dao.save(period);
			}
		}
		
		List assignments = (List) m.get("assignments");
		Map[] assignmentArray = new Map[assignments.size()];
		for(int i = 0; i < assignments.size(); i++) {
			Map mapobj = (Map) assignments.get(i);
			assignmentArray[i] = mapobj;
		}
		updateAssignmentsAndWays(assignmentArray, dao);
		
		if(m.containsKey("clues")) {
			List clues = (List) m.get("clues");
			for(Object clueobj : clues) {
				Map map = (Map) clueobj;
				String name = (String) map.get("name");
				Long id = Long.parseLong(name.substring(4));
				Clue clue = (Clue) dao.load(Clue.class, id);
				if(clue == null) {
					clue = new Clue();
					clue.setId(id);
					dao.save(clue);
				}

				Waypoint wpt = new Waypoint();
				wpt.setLat((Double) map.get("lat"));
				wpt.setLng((Double) map.get("lng"));
				clue.setPosition(wpt);
				Map<String, String> clueAttrs = decodeAttrs((String) map.get("desc"));
				if(clueAttrs.containsKey("assignmentid") && clueAttrs.get("assignmentid") != null) {
					SearchAssignment assignment = (SearchAssignment) dao.load(SearchAssignment.class, Long.parseLong(clueAttrs.get("assignmentid")));
					if(assignment != null) {
						assignment.addClue(clue);
						dao.save(assignment);
					}
				}
				if(clueAttrs.containsKey("description")) clue.setDescription(clueAttrs.get("description"));
				if(clueAttrs.containsKey("location")) clue.setLocation(clueAttrs.get("location"));
				if(clueAttrs.containsKey("summary")) clue.setSummary(clueAttrs.get("summary"));
				if(clueAttrs.containsKey("found")) clue.setFound(new Date(Long.parseLong(clueAttrs.get("found"))));
				if(clueAttrs.containsKey("instructions")) clue.setInstructions(Disposition.valueOf(clueAttrs.get("instructions")));
				if(clueAttrs.containsKey("updated")) clue.setUpdated(new Date(Long.parseLong(clueAttrs.get("updated"))));
				
				dao.save(clue);
			}
		}
		
		
	}

	public static List<Map<String, Object>> gpxifyAssignmentList(Collection<SearchAssignment> assignments) {
		List<Map<String, Object>> modified = new ArrayList<Map<String, Object>>();
		for(SearchAssignment assignment : assignments) {
			modified.add(gpxifyAssignment(assignment));
		}
		return modified;
	}
		
	public static Map<String, Object> gpxifyAssignment(SearchAssignment assignment) {
		Map<String, Object> map = new HashMap<String, Object>();
		map.put("id", assignment.getId());
		map.put("ways", assignment.getWays());
		map.put("waypoints", assignment.getWaypoints());
		map.put("operationalPeriodId", assignment.getOperationalPeriodId());
		
		Map<String, String> attrs = new HashMap<String, String>();
		attrs.put("details", assignment.getDetails());
		if(assignment.getResourceType() != null) attrs.put("resourceType", assignment.getResourceType().toString());
		if(assignment.getStatus() != null) attrs.put("status", assignment.getStatus().toString());
		if(assignment.getTimeAllocated() != null) attrs.put("timeAllocated", Double.toString(assignment.getTimeAllocated()));
		attrs.put("previousEfforts", assignment.getPreviousEfforts());
		attrs.put("transportation", assignment.getTransportation());
		if(assignment.getResponsivePOD() != null) attrs.put("responsivePOD", assignment.getResponsivePOD().toString());
		if(assignment.getUnresponsivePOD() != null) attrs.put("unresponsivePOD", assignment.getUnresponsivePOD().toString());
		if(assignment.getCluePOD() != null) attrs.put("cluePOD", assignment.getCluePOD().toString());
		if(assignment.getUpdated() != null) attrs.put("updated", Long.toString(assignment.getUpdated().getTime()));
		if(assignment.getPreparedOn() != null) attrs.put("preparedOn", Long.toString(assignment.getPreparedOn().getTime()));
		attrs.put("preparedBy", assignment.getPreparedBy());
		attrs.put("primaryFrequency", assignment.getPrimaryFrequency());
		attrs.put("secondaryFrequency", assignment.getSecondaryFrequency());
		
		map.put("desc", encodeAttrs(attrs));
		return map;
	}
	
	private static String encodeAttrs(Map<String, String> attrs) {
		StringBuffer encoded = new StringBuffer();
		for(String key : attrs.keySet()) {
			String value = attrs.get(key);
			if(value != null) {
				encoded.append(key);
				encoded.append("=");
				try {
					encoded.append(URLEncoder.encode(value, "UTF-8"));
				} catch (UnsupportedEncodingException e) {
					logger.error("UnsupportedEncodingException while trying to URLEncode gpx attrs.  This should never, ever happen as Java explicity advises you to use UTF-8.");
				}
				encoded.append("&");
			}
		}
		encoded.deleteCharAt(encoded.length() - 1);
		return encoded.toString();
	}

	public static void parseGpxifiedAssignment(JSONObject json, GenericHibernateDAO dao) {
		@SuppressWarnings("rawtypes")
		Map m = (Map) JSONObject.toBean(json, Map.class, Way.classHints);
		updateAssignmentsAndWays(new Map[] {m}, dao);
	}
	
	public static void parseGpxifiedAssignments(JSONArray json, GenericHibernateDAO dao) {
		@SuppressWarnings("rawtypes")
		Map[] m = (Map[]) JSONArray.toArray(json, Map.class, Way.classHints);
		updateAssignmentsAndWays(m, dao);
	}

	@SuppressWarnings("unchecked")
	private static void updateAssignmentsAndWays(Map[] objs, GenericHibernateDAO dao) {
		for(Map<String, Object> obj : objs) {
			String name = (String) obj.get("name");
			
			OperationalPeriod period = (OperationalPeriod) dao.load(OperationalPeriod.class, Long.parseLong(name.substring(0, 2)));
			
			if(period == null) {
				period = new OperationalPeriod();
				period.setDescription("Autogenerated by GPX Import");
				period.setId(Long.parseLong(name.substring(0, 2)));
				dao.save(period);
				period = (OperationalPeriod) dao.load(OperationalPeriod.class, Long.parseLong(name.substring(0, 2)));
			}

			if(period != null) {
				SearchAssignment assignment = (SearchAssignment) dao.load(SearchAssignment.class, Long.parseLong(name.substring(2, 5)));
				if(assignment == null) {
					assignment = new SearchAssignment();
					assignment.setId(Long.parseLong(name.substring(2, 5)));
					period.addAssignment(assignment);
					dao.save(assignment);
				}
			}
			
			SearchAssignment assignment = (SearchAssignment) dao.load(SearchAssignment.class, Long.parseLong(name.substring(2, 5)));

			if(obj.containsKey("waypoints")) {
				Way way = new Way();
				way.setName(name);
				way.setWaypoints((List<Waypoint>) obj.get("waypoints"));
				if(name.length() > 5 && name.charAt(5) != 'R') {
					way.setType(WayType.TRACK);
					way.setName((String) obj.get("desc"));
				} else if(obj.get("desc") != null && ((String) obj.get("desc")).length() > 0){
					Map<String, String> attrs = (Map<String, String>) decodeAttrs((String) obj.get("desc"));
					if(attrs.containsKey("details")) assignment.setDetails(attrs.get("details"));
					if(attrs.containsKey("resourceType")) assignment.setResourceType(ResourceType.valueOf(attrs.get("resourceType")));
					if(attrs.containsKey("status")) assignment.setStatus(Status.valueOf(attrs.get("status")));
					if(attrs.containsKey("timeAllocated")) assignment.setTimeAllocated(Double.parseDouble(attrs.get("timeAllocated")));
					if(attrs.containsKey("previousEfforts")) assignment.setPreviousEfforts(attrs.get("previousEfforts"));
					if(attrs.containsKey("transportation")) assignment.setTransportation(attrs.get("transportation"));
					if(attrs.containsKey("responsivePOD")) assignment.setResponsivePOD(Probability.valueOf(attrs.get("responsivePOD")));
					if(attrs.containsKey("unresponsivePOD")) assignment.setUnresponsivePOD(Probability.valueOf(attrs.get("unresponsivePOD")));
					if(attrs.containsKey("cluePOD")) assignment.setCluePOD(Probability.valueOf(attrs.get("cluePOD")));
					if(attrs.containsKey("updated")) assignment.setUpdated(new Date(Long.parseLong(attrs.get("updated"))));
					if(attrs.containsKey("preparedOn")) assignment.setPreparedOn(new Date(Long.parseLong(attrs.get("preparedOn"))));
					if(attrs.containsKey("preparedBy")) assignment.setPreparedBy(attrs.get("preparedBy"));
					if(attrs.containsKey("primaryFrequency")) assignment.setPrimaryFrequency(attrs.get("primaryFrequency"));
					if(attrs.containsKey("secondaryFrequency")) assignment.setSecondaryFrequency(attrs.get("secondaryFrequency"));
				}
				
				List<Waypoint> wpts = way.getWaypoints();
				if(way.getType() == WayType.ROUTE && wpts.get(0).equals(wpts.get(wpts.size() - 1))) way.setPolygon(true);
				assignment.getWays().add(way);
				way.setUpdated(new Date());

				dao.save(assignment);
			} else if (obj.containsKey("lat")) {
				Waypoint wpt = new Waypoint();
				wpt.setName((String) obj.get("desc"));
				wpt.setLat((Double) obj.get("lat"));
				wpt.setLng((Double) obj.get("lng"));
				assignment.getWaypoints().add(wpt);
				dao.save(assignment);
			}
		}
		
	}
	
	private static Map<String, String> decodeAttrs(String encoded) {
		Map<String, String> attrs = new HashMap<String, String>();
		if(encoded == null) return attrs;
		for(String pair : encoded.split("&")) {
			String[] split = pair.split("=");
			String key = split[0];
			String value = (split.length > 1) ? split[1] : "";
			try {
				attrs.put(key, URLDecoder.decode(value, "UTF-8"));
			} catch (UnsupportedEncodingException e) {
				logger.error("UnsupportedEncodingException while trying to URLDecode gpx attrs.  This should never, ever happen as Java explicity advises you to use UTF-8.");
			}
		}
		return attrs;
	}
	
}