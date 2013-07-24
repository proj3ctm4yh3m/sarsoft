package org.sarsoft.plans.controller;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import net.sf.json.JSONArray;
import net.sf.json.JSONObject;
import net.sf.json.JSONSerializer;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.sarsoft.PDFAcroForm;
import org.sarsoft.common.controller.DataManager;
import org.sarsoft.common.controller.JSONBaseController;
import org.sarsoft.common.controller.ServerInfo;
import org.sarsoft.common.gpx.StyledGeoObject;
import org.sarsoft.common.gpx.StyledWay;
import org.sarsoft.common.gpx.StyledWaypoint;
import org.sarsoft.common.model.CollaborativeMap;
import org.sarsoft.common.model.Tenant;
import org.sarsoft.common.util.RuntimeProperties;
import org.sarsoft.imaging.IPDFMaker;
import org.sarsoft.imaging.PDFDoc;
import org.sarsoft.imaging.PDFForm;
import org.sarsoft.imaging.PDFPage;
import org.sarsoft.ops.model.Resource;
import org.sarsoft.plans.Action;
import org.sarsoft.plans.Constants;
import org.sarsoft.plans.form.AssignmentForm;
import org.sarsoft.plans.model.Assignment;
import org.sarsoft.plans.model.Clue;
import org.sarsoft.plans.model.FieldTrack;
import org.sarsoft.plans.model.FieldWaypoint;
import org.sarsoft.plans.model.OperationalPeriod;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;

import edu.emory.mathcs.backport.java.util.Arrays;

@Controller
public class PlansController extends JSONBaseController {
	
	@Autowired
	DataManager manager;
	
	@Autowired(required=false)
	IPDFMaker pdfmaker;
	
	@Autowired
	AssignmentController assignmentController;
	
	public void setServerInfo(ServerInfo server) {
		super.setServerInfo(server);
		server.addConstant("color_id", Constants.colorsById);
		server.addConstant("color_probability", Constants.convert(Constants.colorsByProbability));
		server.addConstant("color_status", Constants.convert(Constants.colorsByStatus));
		server.addConstant("color_type", Constants.convert(Constants.colorsByResourceType));
	}

	@SuppressWarnings("deprecation")
	@RequestMapping(value="/sar/104", method = RequestMethod.GET)
	public String get104(Model model, @RequestParam(value="ids", required=false) String ids, @RequestParam(value="copies", required=false) String copies, HttpServletResponse response) {
		List<Assignment> assignments = new ArrayList<Assignment>();
		if(ids != null && ids.length() > 0) {
			for(String id : ids.split(",")) assignments.add(dao.load(Assignment.class, Long.parseLong(id)));
		} else {
			assignments = dao.loadAll(Assignment.class);
		}
		Tenant tenant = dao.getByAttr(Tenant.class, "name", RuntimeProperties.getTenant());
		
		List<PDFAcroForm> pages = new ArrayList<PDFAcroForm>();
		if(copies == null) copies = "";
		for(Assignment assignment : assignments) {
			for(String copy : copies.split(",")) {
				Map<String, String> fields = new HashMap<String, String>();
				fields.put("incident_name", tenant.getDescription());
				if(assignment.getOperationalPeriod() != null) fields.put("operational_period", assignment.getOperationalPeriod().getDescription());
				fields.put("assignment_number", assignment.getNumber());
				fields.put("resource_type", "" + assignment.getResourceType());
				fields.put("asgn_description", assignment.getDetails());
				fields.put("previous_search_effort", assignment.getPreviousEfforts());
				fields.put("time_allocated", assignment.getTimeAllocated() + " hours");
				fields.put("size_of_assignment", assignment.getSegment().getFormattedSize().replaceAll("&sup2;", "\u00B2"));
				fields.put("POD_" + assignment.getResponsivePOD().toString().toLowerCase().substring(0,1) + "_responsive", "X");
				fields.put("POD_" + assignment.getUnresponsivePOD().toString().toLowerCase().substring(0,1) + "_unresponsive", "X");
				fields.put("POD_" + assignment.getCluePOD().toString().toLowerCase().substring(0,1) + "_clues", "X");
				fields.put("transport_instructions", assignment.getTransportation());
				fields.put("freq_command", assignment.getPrimaryFrequency());
				fields.put("freq_tactical", assignment.getSecondaryFrequency());
				fields.put("prepared_by", assignment.getPreparedBy());
				if(assignment.getPreparedOn() != null) fields.put("prepared_on", assignment.getPreparedOn().toGMTString());
	
				int i = 1;
				for(Resource resource : assignment.getResources()) {
					if(resource.getType() == Resource.Type.PERSON) {
						fields.put("personnel_name_" + i, resource.getName());
						fields.put("personnel_agency_" + i, resource.getAgency());
					}
					i++;
				}
				
				fields.put("copy_" + copy, "X");
				pages.add(new PDFAcroForm("sar104", fields));
			}
		}
		try {
			PDDocument document = PDFAcroForm.create(context, pages);
			return pdf(model, document, response, "sar104.pdf");
		} catch (Exception e) {
			e.printStackTrace();
			return error(model, e.toString());
		} finally {
			PDFAcroForm.close(pages);
		}
	}

	@RequestMapping(value="/sar/134", method = RequestMethod.GET)
	public String get134(Model model, HttpServletResponse response) {
		List<Clue> clues = dao.loadAll(Clue.class);
		List<String[]> rows = new ArrayList<String[]>();

		rows.add(new String[] { "Clue #", "Item Found", "Team", "Location of Find" });
		for(Clue clue : clues) {
			rows.add(new String[] { clue.getSummary(), clue.getDescription(), (clue.getAssignment() != null ? clue.getAssignment().getNumber() : ""), clue.getPosition().getFormattedUTM() });
		}
		
		return csv(model, rows, response, "clue_log.csv");
		
	}
	
	@SuppressWarnings("deprecation")
	@RequestMapping(value="/sar/135", method = RequestMethod.GET)
	public String get135(Model model, @RequestParam(value="ids", required=false) String ids, HttpServletResponse response) {
		List<Clue> clues = new ArrayList<Clue>();
		if(ids != null && ids.length() > 0) {
			for(String id : ids.split(",")) clues.add(dao.load(Clue.class, Long.parseLong(id)));
		} else {
			clues = dao.loadAll(Clue.class);
		}
		Tenant tenant = dao.getByAttr(Tenant.class, "name", RuntimeProperties.getTenant());

		List<PDFAcroForm> pages = new ArrayList<PDFAcroForm>();
		for(Clue clue : clues) {
			Map<String, String> fields = new HashMap<String, String>();
			fields.put("incident_name", tenant.getDescription());
			fields.put("summary", clue.getSummary());
			if(clue.getFound() != null) fields.put("found", clue.getFound().toGMTString());
			if(clue.getAssignment() != null) fields.put("assignment_number", clue.getAssignment().getNumber());
			fields.put("description", clue.getDescription());
			fields.put("location", clue.getLocation());
			if(clue.getInstructions() != null) fields.put("disposition_" + clue.getInstructions().toString().toLowerCase(), "X");
			pages.add(new PDFAcroForm("sar135", fields));
		}
		try {
			PDDocument document = PDFAcroForm.create(context, pages);
			return pdf(model, document, response, "sar135.pdf");
		} catch (Exception e) {
			return error(model, e);
		} finally {
			PDFAcroForm.close(pages);
		}
	}
	
	
	@RequestMapping(value="/sar/bulk", method = RequestMethod.GET)
	public String getBulk(Model model, @RequestParam(value="op", required=false) String op) {
		if(op != null) model.addAttribute("period", dao.load(OperationalPeriod.class, Long.parseLong(op)));
		model.addAttribute("periods", dao.loadAll(OperationalPeriod.class));
		return app(model, "Assignment.Bulk");
	}
	
	@RequestMapping(value="/sar/bulk", method = RequestMethod.POST)
	public String postBulk(Model model, AssignmentForm form, HttpServletRequest request) {
		Action action = (request.getParameter("action") != null) ? Action.valueOf(request.getParameter("action").toUpperCase()) : Action.UPDATE;
		String[] ids = form.getIds().split(",");
		for(String id : ids) {
			if(id.length() == 0) continue;
			Assignment assignment = dao.load(Assignment.class, Long.parseLong(id));
			if(form.getOperationalPeriodId() != null) assignment.setOperationalPeriodId(form.getOperationalPeriodId());
			if(form.getResourceType() != null) assignment.setResourceType(form.getResourceType());
			if(form.getTimeAllocated() != null) assignment.setTimeAllocated(form.getTimeAllocated());
			if(form.getResponsivePOD() != null) assignment.setResponsivePOD(form.getResponsivePOD());
			if(form.getUnresponsivePOD() != null) assignment.setUnresponsivePOD(form.getUnresponsivePOD());
			if(form.getCluePOD() != null) assignment.setCluePOD(form.getCluePOD());
			if(form.getPrimaryFrequency() != null && form.getPrimaryFrequency().length() > 0) assignment.setPrimaryFrequency(form.getPrimaryFrequency());
			if(form.getSecondaryFrequency() != null && form.getSecondaryFrequency().length() > 0) assignment.setSecondaryFrequency(form.getSecondaryFrequency());
			if(form.getPreviousEfforts() != null && form.getPreviousEfforts().length() > 0) assignment.setPreviousEfforts(form.getPreviousEfforts());
			if(form.getTransportation() != null && form.getTransportation().length() > 0) assignment.setTransportation(form.getTransportation());
			assignment.setStatus(Assignment.Status.DRAFT);
			switch(action) {
			case FINALIZE :
				assignment.setPreparedBy(form.getPreparedBy());
				assignment.setStatus(Assignment.Status.PREPARED);
				break;
			}
			assignmentController.link(assignment);
			dao.save(assignment);
 		}
		return getBulk(model, null);
	}

	@RequestMapping(value="/sar/maps/browser", method = RequestMethod.GET)
	public String bulkPrint(Model model, HttpServletRequest request, @RequestParam(value="ids", required=false) String ids) {
		model.addAttribute("preload", manager.toJSON(manager.fromDB()));
		if(ids != null) model.addAttribute("ids", ids);
		return app(model, "/plans/print");
	}
	
	@SuppressWarnings("unchecked")
	@RequestMapping(value="/sar/maps/pdf", method = RequestMethod.GET)
	public String bulkPDF(Model model, @RequestParam("ids") String idstr, @RequestParam(value="colorby", required=false) String colorby, HttpServletRequest request, HttpServletResponse response) {
		if(pdfmaker == null) return error(model, "PDF generation not installed.  Contact info@caltopo.com for a PDF-enabled version.");
		String[] ids = idstr.split(",");
		PDFForm form = new PDFForm(getParameterMap(request));
		
		List<StyledGeoObject[]> styled = new ArrayList<StyledGeoObject[]>();
		Assignment[] assignments = new Assignment[ids.length];
		for(int i = 0; i < ids.length; i++) {
			Assignment assignment = dao.load(Assignment.class, Long.parseLong(ids[i]));
			assignments[i] = assignment;
			List<StyledGeoObject> markup = new ArrayList<StyledGeoObject>();

			String color = null;
			if("id".equals(colorby)) color = Constants.colorsById[assignment.getId().intValue() % Constants.colorsById.length];
			if("probability".equals(colorby)) color = Constants.colorsByProbability.get(assignment.getResponsivePOD());
			if("status".equals(colorby)) color = Constants.colorsByStatus.get(assignment.getStatus());
			if("type".equals(colorby)) color = Constants.colorsByResourceType.get(assignment.getResourceType());

			StyledWay segment = (StyledWay) assignment.toStyledGeo();
			if(color != null) segment.setColor(color);
			markup.add(segment);
			
			for(Clue clue : assignment.getClues()) {
				markup.add(clue.toStyledGeo());
			}
			for(FieldTrack track : assignment.getFieldTracks()) {
				StyledWay sway = (StyledWay) track.toStyledGeo();
				sway.setColor(color == null ? "#FF8800" : color);
			}
			for(FieldWaypoint fwpt : assignment.getFieldWaypoints()) {
				StyledWaypoint swpt = (StyledWaypoint) fwpt.toStyledGeo();
				swpt.setIcon(color == null ? "#FF8800" : color);
			}

			styled.add(markup.toArray(new StyledGeoObject[markup.size()]));
		}
		
		if(form.layers == null) {
			CollaborativeMap map = dao.getByAttr(CollaborativeMap.class, "name", RuntimeProperties.getTenant());
			if(map.getMapConfig() != null) {
				JSONObject config = (JSONObject) JSONSerializer.toJSON(map.getMapConfig());
				ArrayList<String> layers = new ArrayList<String>();
				ArrayList<Float> opacity = new ArrayList<Float>();
				layers.add(config.getString("base"));
				opacity.add(1f);
				if(config.has("layers")) {
					JSONArray jlayers = config.getJSONArray("layers");
					JSONArray jopacity = config.getJSONArray("opacity");
					for(int i = 0; i < jlayers.size(); i++) {
						layers.add(jlayers.getString(i));
						opacity.add((float) jopacity.getDouble(i));
					}
				}
				if(config.has("alphas")) {
					if(config.get("alphas") instanceof JSONArray) {
						JSONArray jlayers = config.getJSONArray("alphas");
						for(int i = 0; i < jlayers.size(); i++) {
							layers.add(jlayers.getString(i));
							opacity.add(1f);
						}
					}
				}
				form.layers = layers.toArray(new String[layers.size()]);
				form.opacity = new float[opacity.size()];
				for(int i = 0; i < opacity.size(); i++) {
					form.opacity[i] = opacity.get(i);
				}
			} else {
				form.layers = new String[] { "t" };
				form.opacity = new float[] { 1f };
			}
		}
		
		try {
			PDFDoc doc = new PDFDoc(form.datum, form.layers, form.opacity, form.grids, 0, form.mgrid);
			if(form.sizes[0].bbox == null) {
				PDFPage[] pages = new PDFPage[ids.length];
				for(int i = 0; i < ids.length; i++) {
					String title = assignments[i].getNumber();
					if(title == null || title.length() == 0) title = "N/A";
					pages[i] = pdfmaker.makePage(doc, title, styled.get(i), form.sizes[0].pageSize, 24000);
				}
				return pdf(model, pdfmaker.create(pages, false), response, null);
			} else {
				PDFPage[] pages = new PDFPage[form.sizes.length];
	
				List<StyledGeoObject> markup = new ArrayList<StyledGeoObject>();
				for(StyledGeoObject[] partial : styled) markup.addAll(Arrays.asList(partial));
				StyledGeoObject[] marray = markup.toArray(new StyledGeoObject[markup.size()]);
	
				for(int i = 0; i < form.sizes.length; i++) {
					String title = (form.sizes.length > 1 ? "Page " + (i+1) + "/" + form.sizes.length : "Mercator Projection");
					pages[i] = new PDFPage(doc, title, marray, form.sizes[i].bbox, form.sizes[i].imgSize, form.sizes[i].pageSize);
				}
				return pdf(model, pdfmaker.create(pages, true), response, null);
			}
		} catch (Exception e) {
			return error(model, e);
		}
	}

}
