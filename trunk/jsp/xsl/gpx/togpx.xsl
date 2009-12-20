<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:json="json" xmlns="http://www.topografix.com/GPX/1/1" exclude-result-prefixes="json">
<xsl:param name="template"/>
<xsl:output method="xml"/>
<xsl:template match="/json:o">
<gpx version="1.1" creator="SARSOFT">
	<xsl:choose>
		<xsl:when test="$template='SearchAssignment'">
			<xsl:call-template name="SearchAssignmentToGpx"/>
		</xsl:when>
	</xsl:choose>
</gpx>
</xsl:template>
<xsl:template match="/json:a">
<gpx version="1.1" creator="SARSOFT">
	<xsl:choose>
		<xsl:when test="$template='SearchAssignments'">
			<xsl:call-template name="SearchAssignmentsToGpx"/>
		</xsl:when>
	</xsl:choose>
</gpx>
</xsl:template>
<xsl:template name="SearchAssignmentsToGpx">
	<xsl:for-each select="json:e">
		<xsl:call-template name="SearchAssignmentToGpx"/>
	</xsl:for-each>
</xsl:template>
<xsl:template name="SearchAssignmentToGpx">
	<xsl:for-each select="json:ways/json:e">
		<xsl:call-template name="WayToGpx"/>
	</xsl:for-each>
</xsl:template>
<xsl:template name="WayToGpx">
	<xsl:choose>
	<xsl:when test="json:type='ROUTE'">
	<rte>
		<name><xsl:value-of select="json:id"/>: <xsl:value-of select="json:name"/></name>
		<xsl:for-each select="json:zoomAdjustedWaypoints/json:e">
			<xsl:call-template name="WaypointToGpx"/>
		</xsl:for-each>
	</rte>
	</xsl:when>
	<xsl:otherwise>
	</xsl:otherwise>
	</xsl:choose>
</xsl:template>
<xsl:template name="WaypointToGpx">
	<rtept lat="{json:lat}" lon="{json:lng}"/>
</xsl:template>
</xsl:stylesheet>