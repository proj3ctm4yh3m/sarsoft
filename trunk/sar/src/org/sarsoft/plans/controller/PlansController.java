package org.sarsoft.plans.controller;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.pdfbox.exceptions.COSVisitorException;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.sarsoft.common.controller.DataManager;
import org.sarsoft.common.controller.JSONBaseController;
import org.sarsoft.common.gpx.StyledGeoObject;
import org.sarsoft.common.gpx.StyledWay;
import org.sarsoft.common.gpx.StyledWaypoint;
import org.sarsoft.common.model.ClientState;
import org.sarsoft.common.util.Datum;
import org.sarsoft.imaging.IPDFMaker;
import org.sarsoft.imaging.PDFDoc;
import org.sarsoft.imaging.PDFPage;
import org.sarsoft.plans.Action;
import org.sarsoft.plans.model.Assignment;
import org.sarsoft.plans.model.Clue;
import org.sarsoft.plans.model.FieldTrack;
import org.sarsoft.plans.model.FieldWaypoint;
import org.sarsoft.plans.model.OperationalPeriod;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
public class PlansController extends JSONBaseController {
	
	@Autowired
	DataManager manager;
	
	@Autowired(required=false)
	IPDFMaker pdfmaker;
	
	@Autowired
	AssignmentController assignmentController;

	@RequestMapping(value="/sar104/{id}", method = RequestMethod.GET)
	public String getAssignmentForm(Model model, @PathVariable("id") long id, HttpServletRequest request) {
		Assignment assignment = dao.load(Assignment.class, id);
		model.addAttribute("assignment", assignment);
		return app(model, "Assignment.PrintForms");
	}

	@RequestMapping(value="/bulk", method = RequestMethod.GET)
	public String bulkOperations(Model model) {
		model.addAttribute("periods", dao.loadAll(OperationalPeriod.class));
		return app(model, "Assignment.Bulk");
	}
	
	@RequestMapping(value="/bulk", method = RequestMethod.POST)
	public String bulkUpdate(Model model, AssignmentForm form, HttpServletRequest request) {
		Action action = (request.getParameter("action") != null) ? Action.valueOf(request.getParameter("action").toUpperCase()) : Action.UPDATE;
		String[] ids = form.getBulkIds().split(",");
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
		return bulkOperations(model);
	}

	@RequestMapping(value="/bulkprint", method = RequestMethod.GET)
	public String bulkPrint(Model model, HttpServletRequest request, @RequestParam(value="ids", required=false) String ids) {
		model.addAttribute("preload", manager.toJSON(manager.fromDB()));
		if(ids != null) model.addAttribute("ids", ids);
		return app(model, "Assignment.PrintBulk");
	}
	
	@RequestMapping(value="/bulkpdf", method = RequestMethod.GET)
	public void bulkPDF(Model model, HttpServletRequest request, @RequestParam(value="ids", required=true) String idstr, HttpServletResponse response) {
		String[] ids = idstr.split(",");
		try {
			PDFDoc doc = new PDFDoc(Datum.WGS84, new String[] { "t" }, new float[] { 1f }, new boolean[] { true, false });
			PDFPage[] pages = new PDFPage[ids.length];
			for(int i = 0; i < ids.length; i++) {
				Assignment assignment = dao.load(Assignment.class, Long.parseLong(ids[i]));
				List<StyledGeoObject> markup = new ArrayList<StyledGeoObject>();
				markup.add(assignment.toStyledGeo());
				for(Clue clue : assignment.getClues()) {
					markup.add(clue.toStyledGeo());
				}
				for(FieldTrack track : assignment.getFieldTracks()) {
					StyledWay sway = (StyledWay) track.toStyledGeo();
					sway.setColor("#FF8800");
				}
				for(FieldWaypoint fwpt : assignment.getFieldWaypoints()) {
					StyledWaypoint swpt = (StyledWaypoint) fwpt.toStyledGeo();
					swpt.setIcon("#FF8800");
				}
				
				pages[i] = pdfmaker.makePage(doc, assignment.getNumber(), markup.toArray(new StyledGeoObject[markup.size()]), new float[] { 8.5f, 11f }, 24000);
				
			}
			
			response.setContentType("application/pdf");
			response.setHeader("Cache-Control", "max-age=432000, public");
			PDDocument document = pdfmaker.create(pages, false);
			document.save(response.getOutputStream());
			document.close();
			return;
		} catch(Exception e) {
			e.printStackTrace();
		}
		
	// TODO handle error conditon or pdfmaker null
	}

}
