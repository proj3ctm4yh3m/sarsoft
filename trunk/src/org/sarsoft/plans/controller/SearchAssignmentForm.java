package org.sarsoft.plans.controller;

import org.sarsoft.plans.model.Probability;
import org.sarsoft.plans.model.SearchAssignment;

public class SearchAssignmentForm {
	private String name;
	private SearchAssignment.ResourceType resourceType;
	private String details;
	private long timeAllocated;
	private Probability responsivePOD;
	private Probability unresponsivePOD;

	public String getDetails() {
		return details;
	}
	public void setDetails(String details) {
		this.details = details;
	}
	public String getName() {
		return name;
	}
	public void setName(String name) {
		this.name = name;
	}
	public SearchAssignment.ResourceType getResourceType() {
		return resourceType;
	}
	public void setResourceType(SearchAssignment.ResourceType resourceType) {
		this.resourceType = resourceType;
	}
	public long getTimeAllocated() {
		return timeAllocated;
	}
	public void setTimeAllocated(long timeAllocated) {
		this.timeAllocated = timeAllocated;
	}
	public Probability getResponsivePOD() {
		return responsivePOD;
	}
	public void setResponsivePOD(Probability responsivePOD) {
		this.responsivePOD = responsivePOD;
	}
	public Probability getUnresponsivePOD() {
		return unresponsivePOD;
	}
	public void setUnresponsivePOD(Probability unresponsivePOD) {
		this.unresponsivePOD = unresponsivePOD;
	}

}
