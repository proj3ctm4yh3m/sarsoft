<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:gpx="http://www.topografix.com/GPX/1/1" xmlns:gpx0="http://www.topografix.com/GPX/1/0" exclude-result-prefixes="gpx gpx0">
<xsl:param name="template"/>
<xsl:template match="/gpx:gpx | gpx0:gpx">
<a class="array">
	<xsl:for-each select="gpx:wpt | gpx0:wpt">
		<e class="object">
		<xsl:call-template name="GpxToWaypoint"/>
		</e>
	</xsl:for-each>
</a>
</xsl:template>

<xsl:template name="GpxToWaypoint">
	<lat type="number"><xsl:value-of select="@lat"/></lat>
	<lng type="number"><xsl:value-of select="@lon"/></lng>
	<name type="string"><xsl:value-of select="gpx:name | gpx0:name"/></name>
</xsl:template>

</xsl:stylesheet>