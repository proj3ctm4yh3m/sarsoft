<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:json="json" xmlns="http://www.topografix.com/GPX/1/1" exclude-result-prefixes="json">
<xsl:param name="template"/>
<xsl:output method="xml" cdata-section-elements="cmt desc"/>
<xsl:template match="/json:a">
<gpx version="1.1" creator="SARSOFT">
	<xsl:for-each select="json:e[json:type='route']">
		<xsl:call-template name="route"/>
	</xsl:for-each>
	<xsl:for-each select="json:e[json:type='waypoint']">
		<xsl:call-template name="waypoint"/>
	</xsl:for-each>
</gpx>
</xsl:template>
<xsl:template name="route">
	<xsl:variable name="name" select="json:name"/>
	<xsl:variable name="desc" select="json:desc"/>
	<xsl:for-each select="json:way">
		<xsl:call-template name="WayToGpx">
			<xsl:with-param name="name" select="$name"/>
			<xsl:with-param name="desc" select="$desc"/>
		</xsl:call-template>
	</xsl:for-each>
</xsl:template>
<xsl:template name="waypoint">
	<xsl:variable name="name" select="json:name"/>
	<xsl:variable name="desc" select="json:desc"/>
	<xsl:for-each select="json:position">
		<xsl:call-template name="WaypointToWpt">
			<xsl:with-param name="name" select="$name"/>
			<xsl:with-param name="desc" select="$desc"/>
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
		<xsl:if test="string(json:polygon)='true'">
	      	<xsl:for-each select="json:zoomAdjustedWaypoints/json:e[position()=1]">
			<xsl:call-template name="WaypointToRtept"/>
	      	</xsl:for-each>
		</xsl:if>
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