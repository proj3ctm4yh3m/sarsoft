package org.sarsoft.plans.controller;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.sarsoft.PDFAcroForm;
import org.sarsoft.common.controller.DataManager;
import org.sarsoft.common.controller.JSONBaseController;
import org.sarsoft.common.controller.ServerInfo;
import org.sarsoft.common.gpx.StyledGeoObject;
import org.sarsoft.common.gpx.StyledWay;
import org.sarsoft.common.gpx.StyledWaypoint;
import org.sarsoft.common.util.Datum;
import org.sarsoft.common.util.RuntimeProperties;
import org.sarsoft.imaging.IPDFMaker;
import org.sarsoft.imaging.PDFDoc;
import org.sarsoft.imaging.PDFForm;
import org.sarsoft.imaging.PDFPage;
import org.sarsoft.imaging.PDFSize;
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
	public String get104(Model model, @RequestParam(value="ids", required=false) String ids, HttpServletResponse response) {
		List<Assignment> assignments = new ArrayList<Assignment>();
		if(ids != null && ids.length() > 0) {
			for(String id : ids.split(",")) assignments.add(dao.load(Assignment.class, Long.parseLong(id)));
		} else {
			assignments = dao.loadAll(Assignment.class);
		}
		List<PDFAcroForm> pages = new ArrayList<PDFAcroForm>();
		for(Assignment assignment : assignments) {
			Map<String, String> fields = new HashMap<String, String>();
			fields.put("incident_name", RuntimeProperties.getTenant());
			if(assignment.getOperationalPeriod() != null) fields.put("operational_period", assignment.getOperationalPeriod().getDescription());
			fields.put("assignment_number", assignment.getNumber());
			fields.put("resource_type", "" + assignment.getResourceType());
			fields.put("asgn_description", "\n" + assignment.getDetails());
			fields.put("previous_search_effort", assignment.getPreviousEfforts());
			fields.put("time_allocated", assignment.getTimeAllocated() + " hours");
			fields.put("size_of_assignment", assignment.getSegment().getFormattedSize());
			fields.put("POD_" + assignment.getResponsivePOD().toString().toLowerCase().substring(0,1) + "_responsive", "X");
			fields.put("POD_" + assignment.getUnresponsivePOD().toString().toLowerCase().substring(0,1) + "_unresponsive", "X");
			fields.put("POD_" + assignment.getCluePOD().toString().toLowerCase().substring(0,1) + "_clues", "X");
			fields.put("transport_instructions", assignment.getTransportation());
			fields.put("freq_command", assignment.getPrimaryFrequency());
			fields.put("freq_tactical", assignment.getSecondaryFrequency());
			fields.put("prepared_by", assignment.getPreparedBy());
			if(assignment.getPreparedOn() != null) fields.put("prepared_on", assignment.getPreparedOn().toGMTString());
			fields.put("personnel_function_2", "M");
			fields.put("personnel_function_3", "*");
			pages.add(new PDFAcroForm("sar104", fields));
		}
		try {
			PDDocument document = PDFAcroForm.create(context, pages);
			return pdf(model, document, response);
		} catch (Exception e) {
			return error(model, e.getMessage());
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
		
		return csv(model, rows, response);
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
		String[] ids = idstr.split(",");
		PDFForm form = new PDFForm(request);
		
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
			form.layers = new String[] { "t" };
			form.opacity = new float[] { 1f };
		}
		
		try {
			PDFDoc doc = new PDFDoc(form.datum, form.layers, form.opacity, form.grids);
			if(form.sizes[0].bbox == null) {
				PDFPage[] pages = new PDFPage[ids.length];
				for(int i = 0; i < ids.length; i++) {
					pages[i] = pdfmaker.makePage(doc, assignments[i].getNumber(), styled.get(i), form.sizes[0].pageSize, 24000);
				}
				return pdf(model, pdfmaker.create(pages, false), response);
			} else {
				PDFPage[] pages = new PDFPage[form.sizes.length];
	
				List<StyledGeoObject> markup = new ArrayList<StyledGeoObject>();
				for(StyledGeoObject[] partial : styled) markup.addAll(Arrays.asList(partial));
				StyledGeoObject[] marray = markup.toArray(new StyledGeoObject[markup.size()]);
	
				for(int i = 0; i < form.sizes.length; i++) {
					String title = (form.sizes.length > 1 ? "Page " + (i+1) + "/" + form.sizes.length : "Mercator Projection");
					pages[i] = new PDFPage(doc, title, marray, form.sizes[i].bbox, form.sizes[i].imgSize, form.sizes[i].pageSize);
				}
				return pdf(model, pdfmaker.create(pages, true), response);
			}
		} catch (Exception e) {
			return error(model, e.getMessage());
		}
	}

}
