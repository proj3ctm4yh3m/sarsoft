<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:gpx="http://www.topografix.com/GPX/1/1" xmlns:gpx0="http://www.topografix.com/GPX/1/0" exclude-result-prefixes="gpx gpx0">
<xsl:param name="template"/>
<xsl:template match="/gpx:gpx | gpx0:gpx">
<a>
	<xsl:for-each select="gpx:trk | gpx0:trk">
		<e class="object">
		<xsl:call-template name="GpxToTrack"/>
		</e>
	</xsl:for-each>
	<xsl:for-each select="gpx:rte | gpx0:rte">
		<e class="object">
		<xsl:call-template name="GpxToRoute"/>
		</e>
	</xsl:for-each>
	<xsl:for-each select="gpx:wpt | gpx0:wpt">
		<e class="object">
		<type type="string">waypoint</type>
		<name type="string"><xsl:value-of select="gpx:name | gpx0:name"/></name>
		<desc type="string"><xsl:value-of select="gpx:desc | gpx0:desc"/></desc>
		<position>
			<xsl:call-template name="GpxToWaypoint"/>
		</position>
		</e>
	</xsl:for-each>
</a>
</xsl:template>

<xsl:template name="GpxToTrack">
	<name type="string"><xsl:value-of select="gpx:name | gpx0:name"/></name>
	<desc><xsl:value-of select="gpx:desc | gpx0:desc"/></desc>
	<type type="string">track</type>
	<way class="object">
	<waypoints class="array">
		<xsl:for-each select="gpx:trkseg/gpx:trkpt | gpx0:trkseg/gpx0:trkpt">
		<e class="object">
			<xsl:call-template name="GpxToWaypoint"/>
		</e>
		</xsl:for-each>
	</waypoints>
	</way>
</xsl:template>

<xsl:template name="GpxToRoute">
	<name type="string"><xsl:value-of select="gpx:name | gpx0:name"/></name>
	<desc><xsl:value-of select="gpx:desc | gpx0:desc"/></desc>
	<type type="string">route</type>
	<way class="object">
	<waypoints class="array">
		<xsl:for-each select="gpx:rtept | gpx0:rtept">
		<e class="object">
			<xsl:call-template name="GpxToWaypoint"/>
		</e>
		</xsl:for-each>
	</waypoints>
	</way>
</xsl:template>

<xsl:template name="GpxToWaypoint">
	<lat type="number"><xsl:value-of select="@lat"/></lat>
	<lng type="number"><xsl:value-of select="@lon"/></lng>
</xsl:template>

</xsl:stylesheet>