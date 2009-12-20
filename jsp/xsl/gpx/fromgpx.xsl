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
</a>
</xsl:template>

<xsl:template name="GpxToTrack">
	<name type="string"><xsl:value-of select="gpx:name"/></name>
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

<xsl:template name="GpxToWaypoint">
	<lat type="number"><xsl:value-of select="@lat"/></lat>
	<lng type="number"><xsl:value-of select="@lon"/></lng>
</xsl:template>
</xsl:stylesheet>