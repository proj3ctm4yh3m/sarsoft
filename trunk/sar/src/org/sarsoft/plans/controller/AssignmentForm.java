package org.sarsoft.plans.controller;

import org.sarsoft.plans.model.Assignment;
import org.sarsoft.plans.model.Probability;

public class AssignmentForm {
	private long id;
	private String bulkIds;
	private Assignment.ResourceType resourceType;
	private String details;
	private Double timeAllocated;
	private String previousEfforts;
	private String transportation;
	private String preparedBy;
	private Probability responsivePOD;
	private Probability unresponsivePOD;
	private Probability cluePOD;
	private String primaryFrequency;
	private String secondaryFrequency;

	public String getPrimaryFrequency() {
		return primaryFrequency;
	}
	public void setPrimaryFrequency(String primaryFrequency) {
		this.primaryFrequency = primaryFrequency;
	}
	public String getSecondaryFrequency() {
		return secondaryFrequency;
	}
	public void setSecondaryFrequency(String secondaryFrequency) {
		this.secondaryFrequency = secondaryFrequency;
	}
	public String getDetails() {
		return details;
	}
	public void setDetails(String details) {
		this.details = details;
	}
	public long getId() {
		return id;
	}
	public void setId(long id) {
		this.id = id;
	}
	public Assignment.ResourceType getResourceType() {
		return resourceType;
	}
	public void setResourceType(Assignment.ResourceType resourceType) {
		this.resourceType = resourceType;
	}
	public Double getTimeAllocated() {
		return timeAllocated;
	}
	public void setTimeAllocated(Double timeAllocated) {
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
	public Probability getCluePOD() {
		return cluePOD;
	}
	public void setCluePOD(Probability cluePOD) {
		this.cluePOD = cluePOD;
	}
	public String getTransportation() {
		return transportation;
	}
	public void setTransportation(String transportation) {
		this.transportation = transportation;
	}
	public String getPreviousEfforts() {
		return previousEfforts;
	}
	public void setPreviousEfforts(String previousEfforts) {
		this.previousEfforts = previousEfforts;
	}
	public String getBulkIds() {
		return bulkIds;
	}
	public void setBulkIds(String bulkIds) {
		this.bulkIds = bulkIds;
	}
	public String getPreparedBy() {
		return preparedBy;
	}
	public void setPreparedBy(String preparedBy) {
		this.preparedBy = preparedBy;
	}

}
