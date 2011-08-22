<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:json="json" xmlns="http://www.topografix.com/GPX/1/1" exclude-result-prefixes="json">
<xsl:param name="template"/>
<xsl:output method="xml" cdata-section-elements="cmt desc"/>
<xsl:template match="/json:o">
<gpx version="1.1" creator="SARSOFT">
	<xsl:choose>
		<xsl:when test="$template='SearchAssignment'">
			<xsl:call-template name="SearchWaypointsToGpx"/>
			<xsl:for-each select="json:assignment">
				<xsl:call-template name="SearchAssignmentToGpx"/>
			</xsl:for-each>
		</xsl:when>
		<xsl:when test="$template='Search'">
			<xsl:call-template name="SearchToGpx"/>
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
<xsl:template name="SearchWaypointsToGpx">
	<xsl:for-each select="json:lkp">
		<xsl:call-template name="WaypointToWpt">
			<xsl:with-param name="name" select="'lkp'"/>
		</xsl:call-template>
	</xsl:for-each>
	<xsl:for-each select="json:pls">
		<xsl:call-template name="WaypointToWpt">
			<xsl:with-param name="name" select="'pls'"/>
		</xsl:call-template>
	</xsl:for-each>
	<xsl:for-each select="json:cp">
		<xsl:call-template name="WaypointToWpt">
			<xsl:with-param name="name" select="'cp'"/>
		</xsl:call-template>
	</xsl:for-each>
	<xsl:for-each select="json:clues/json:e">
		<xsl:variable name="id" select="json:id"/>
		<xsl:message>ID is <xsl:value-of select="json:id"/></xsl:message>
		<xsl:variable name="desc" select="json:desc"/>
		<xsl:for-each select="json:position">
			<xsl:call-template name="WaypointToWpt">
				<xsl:with-param name="name" select="concat('CLUE', $id)"/>
				<xsl:with-param name="desc" select="$desc"/>
			</xsl:call-template>
		</xsl:for-each>
	</xsl:for-each>
</xsl:template>
<xsl:template name="SearchToGpx">
	<metadata>
		<desc><xsl:value-of select="json:desc"/></desc>
	</metadata>
	<xsl:call-template name="SearchWaypointsToGpx"/>
	<xsl:for-each select="json:assignments">
		<xsl:call-template name="SearchAssignmentsToGpx"/>
	</xsl:for-each>
</xsl:template>
<xsl:template name="SearchAssignmentsToGpx">
	<xsl:for-each select="json:e">
		<xsl:call-template name="SearchAssignmentToGpx"/>
	</xsl:for-each>
</xsl:template>
<xsl:template name="SearchAssignmentToGpx">
	<xsl:variable name="operationalperiod" select="format-number(json:operationalPeriodId, '00')"/>
	<xsl:variable name="assignmentid" select="format-number(json:id, '000')"/>
	<xsl:variable name="desc" select="json:desc"/>
	<xsl:variable name="assignment" select="."/>
	<xsl:for-each select="json:ways/json:e[json:type='ROUTE']">
		<xsl:choose>
				<xsl:when test="position() = 1">
					<xsl:call-template name="WayToGpx">
						<xsl:with-param name="name" select="concat($operationalperiod, $assignmentid)"/>
						<xsl:with-param name="desc" select="$desc"/>
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
			<xsl:with-param name="name" select="concat($operationalperiod, $assignmentid, translate(position(), '123456789', 'ABCDEFGHI'))"/>
			<xsl:with-param name="desc" select="json:name"/>
		</xsl:call-template>
	</xsl:for-each>
	<xsl:for-each select="json:waypoints/json:e">
		<xsl:call-template name="WaypointToWpt">
			<xsl:with-param name="name" select="concat($operationalperiod, $assignmentid, 'W', position()-1)"/>
			<xsl:with-param name="desc" select="json:name"/>
		</xsl:call-template>
	</xsl:for-each>
</xsl:template>
<xsl:template name="WayToGpx">
	<xsl:param name="name"/>
	<xsl:param name="desc"/>
	<xsl:choose>
	<xsl:when test="json:type='ROUTE'">
	<rte>
		<name><xsl:value-of select="$name"/></name>
		<desc><xsl:value-of select="$desc"/></desc>
		<xsl:for-each select="json:zoomAdjustedWaypoints/json:e">
			<xsl:call-template name="WaypointToRtept"/>
		</xsl:for-each>
	</rte>
	</xsl:when>
	<xsl:otherwise>
	<trk>
		<name><xsl:value-of select="$name"/></name>
		<xsl:if test="string-length($desc) &gt; 0"><desc><xsl:value-of select="$desc"/></desc></xsl:if>
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
<xsl:template name="WaypointToWpt">
	<xsl:param name="name"/>
	<xsl:param name="desc"/>
	<wpt lat="{json:lat}" lon="{json:lng}">
		<name><xsl:value-of select="$name"/></name>
		<xsl:if test="string-length($desc) &gt; 0"><desc><xsl:value-of select="$desc"/></desc></xsl:if>
	</wpt>
</xsl:template>
</xsl:stylesheet>