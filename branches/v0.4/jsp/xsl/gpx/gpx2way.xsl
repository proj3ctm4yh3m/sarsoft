<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:gpx="http://www.topografix.com/GPX/1/1" exclude-result-prefixes="gpx">
<xsl:param name="template"/>
<xsl:template match="/gpx:gpx">
<a class="array">
	<xsl:for-each select="gpx:trk">
		<e class="object">
		<xsl:call-template name="GpxToTrack"/>
		</e>
	</xsl:for-each>
	<xsl:for-each select="gpx:rte">
		<e class="object">
		<xsl:call-template name="GpxToRoute"/>
		</e>
	</xsl:for-each>
</a>
</xsl:template>

<xsl:template name="GpxToTrack">
	<name type="string"><xsl:value-of select="gpx:name"/><xsl:if test="string-length(normalize-space(gpx:desc))&gt;0">:<xsl:value-of select="gpx:desc"/></xsl:if></name>
	<polygon type="boolean">false</polygon>
	<type type="string">TRACK</type>
	<waypoints class="array">
		<xsl:for-each select="gpx:trkseg/gpx:trkpt">
		<e class="object">
			<xsl:call-template name="GpxToWaypoint"/>
		</e>
		</xsl:for-each>
	</waypoints>
</xsl:template>

<xsl:template name="GpxToRoute">
	<name type="string"><xsl:value-of select="gpx:name"/></name>
	<xsl:if test="string-length(gpx:desc) &gt; 0"><desc><xsl:value-of select="gpx:desc"/></desc></xsl:if>
	<polygon type="boolean">false</polygon>
	<type type="string">ROUTE</type>
	<waypoints class="array">
		<xsl:for-each select="gpx:rtept">
		<e class="object">
			<xsl:call-template name="GpxToWaypoint"/>
		</e>
		</xsl:for-each>
	</waypoints>
</xsl:template>

<xsl:template name="GpxToWaypoint">
	<lat type="number"><xsl:value-of select="@lat"/></lat>
	<lng type="number"><xsl:value-of select="@lon"/></lng>
</xsl:template>

</xsl:stylesheet>