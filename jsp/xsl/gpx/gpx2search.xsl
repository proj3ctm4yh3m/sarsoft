<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:gpx="http://www.topografix.com/GPX/1/1" xmlns:gpx0="http://www.topografix.com/GPX/1/0" exclude-result-prefixes="gpx gpx0">
<xsl:param name="template"/>
<xsl:template match="/gpx:gpx | gpx0:gpx">
<o>
<desc type="string"><xsl:value-of select="gpx:metadata/gpx:desc | gpx0:metadata/gpx0:desc"/></desc>
<assignments class="array">
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
	<xsl:for-each select="gpx:wpt[string(gpx:name | gpx0:name)!='lkp']">
		<e class="object">
		<xsl:call-template name="GpxToWaypoint"/>
		</e>
	</xsl:for-each>
</assignments>
<xsl:for-each select="gpx:wpt[string(gpx:name | gpx0:name)='lkp']">
<lkp class="object">
	<xsl:call-template name="GpxToWaypoint"/>
</lkp>
</xsl:for-each>
</o>
</xsl:template>

<xsl:template name="GpxToTrack">
	<name type="string"><xsl:value-of select="gpx:name | gpx0:name"/></name>
	<xsl:if test="string-length(normalize-space(gpx:desc | gpx0:desc))&gt;0"><desc><xsl:value-of select="gpx:desc | gpx0:desc"/></desc></xsl:if>
	<polygon type="boolean">false</polygon>
	<type type="string">TRACK</type>
	<waypoints class="array">
		<xsl:for-each select="gpx:trkseg/gpx:trkpt | gpx0:trkseg/gpx0:trkpt">
		<e class="object">
			<xsl:call-template name="GpxToWaypoint"/>
		</e>
		</xsl:for-each>
	</waypoints>
</xsl:template>

<xsl:template name="GpxToRoute">
	<name type="string"><xsl:value-of select="gpx:name | gpx0:name"/></name>
	<xsl:if test="string-length(gpx:desc | gpx0:desc) &gt; 0"><desc><xsl:value-of select="gpx:desc | gpx0:desc"/></desc></xsl:if>
	<polygon type="boolean">false</polygon>
	<type type="string">ROUTE</type>
	<waypoints class="array">
		<xsl:for-each select="gpx:rtept | gpx0:rtept">
		<e class="object">
			<xsl:call-template name="GpxToWaypoint"/>
		</e>
		</xsl:for-each>
	</waypoints>
</xsl:template>

<xsl:template name="GpxToWaypoint">
	<lat type="number"><xsl:value-of select="@lat"/></lat>
	<lng type="number"><xsl:value-of select="@lon"/></lng>
	<xsl:if test="string-length(gpx:name | gpx0:name) &gt; 0"><name type="string"><xsl:value-of select="gpx:name | gpx0:name"/></name></xsl:if>
	<xsl:if test="string-length(gpx:desc | gpx0:desc) &gt; 0"><desc type="string"><xsl:value-of select="gpx:desc | gpx0:desc"/></desc></xsl:if>
</xsl:template>

</xsl:stylesheet>