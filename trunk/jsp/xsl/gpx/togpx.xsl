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
	<xsl:variable name="operationalperiod" select="format-number(json:operationalPeriodId, '00')"/>
	<xsl:variable name="assignmentid" select="format-number(json:id, '000')"/>
	<xsl:variable name="assignment" select="."/>
	<xsl:for-each select="json:ways/json:e[json:type='ROUTE']">
		<xsl:choose>
				<xsl:when test="position() = 1">
					<xsl:call-template name="WayToGpx">
						<xsl:with-param name="name" select="concat($operationalperiod, $assignmentid)"/>
						<xsl:with-param name="cmt" select="concat('resourceType:',$assignment/json:resourceType,',status:',$assignment/json:status,',timeAllocated:',$assignment/json:timeAllocated,',responsivePOD:',$assignment/json:responsivePOD,',unresponsivePOD:',$assignment/json:unresponsivePOD,',preparedOn:',$assignment/json:preparedOn,',peparedBy:',$assignment/json:preparedBy)"/>
					</xsl:call-template>
				</xsl:when>
				<xsl:otherwise>
					<xsl:call-template name="WayToGpx">
						<xsl:with-param name="name" select="concat($operationalperiod, $assignmentid, 'R', position()-1)"/>
					</xsl:call-template>
				</xsl:otherwise>
		</xsl:choose>
	</xsl:for-each>
	<xsl:for-each select="json:ways/json:e[json:type='TRACK']">
		<xsl:call-template name="WayToGpx">
			<xsl:with-param name="name" select="concat($operationalperiod, $assignment, translate(position(), '123456789', 'ABCDEFGHI'))"/>
		</xsl:call-template>
	</xsl:for-each>
</xsl:template>
<xsl:template name="WayToGpx">
	<xsl:param name="name"/>
	<xsl:param name="cmt" select=""/>
	<xsl:choose>
	<xsl:when test="json:type='ROUTE'">
	<rte>
		<name><xsl:value-of select="$name"/></name>
		<cmt><xsl:value-of select="$cmt"/></cmt>
		<xsl:for-each select="json:zoomAdjustedWaypoints/json:e">
			<xsl:call-template name="WaypointToRtept"/>
		</xsl:for-each>
	</rte>
	</xsl:when>
	<xsl:otherwise>
	<trk>
		<name><xsl:value-of select="$name"/></name>
		<trkseg>
		<xsl:for-each select="json:zoomAdjustedWaypoints/json:e">
			<xsl:call-template name="WaypointToTrkpt"/>
		</xsl:for-each>
		</trkseg>
	</trk>
	</xsl:otherwise>
	</xsl:choose>
</xsl:template>
<xsl:template name="WaypointToRtept">
	<rtept lat="{json:lat}" lon="{json:lng}"/>
</xsl:template>
<xsl:template name="WaypointToTrkpt">
	<trkpt lat="{json:lat}" lon="{json:lng}"/>
</xsl:template>
</xsl:stylesheet>