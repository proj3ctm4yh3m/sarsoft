<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
<xsl:param name="template"/>

<xsl:template match="/*[local-name()='kml']/*[local-name()='Document']">
<a>
	<e class="object">
		<type type="string">null</type>
	</e>
	<e class="object">
		<type type="string">null</type>
	</e>
	<xsl:for-each select="*[local-name()='Placemark' and count(*[local-name()='LineString']) &gt; 0]">
		<e class="object">
		<xsl:call-template name="PlacemarkToTrack"/>
		</e>
	</xsl:for-each>
	<xsl:for-each select="*[local-name()='Placemark' and count(*[local-name()='Polygon']) &gt; 0]">
		<e class="object">
		<xsl:call-template name="PlacemarkToPolygon"/>
		</e>
	</xsl:for-each>
	<xsl:for-each select="*[local-name()='Placemark' and count(*[local-name()='Point']) &gt; 0]">
		<e class="object">
		<xsl:call-template name="PlacemarkToWaypoint"/>
		</e>
	</xsl:for-each>
</a>
</xsl:template>

<xsl:template match="/*[local-name()='gpx']">
<a>
	<e class="object">
		<type type="string">null</type>
	</e>
	<e class="object">
		<type type="string">null</type>
	</e>
	<xsl:for-each select="*[local-name()='metadata']/*[local-name()='desc']">
		<e class="object">
			<desc><xsl:value-of select="."/></desc>
			<type type="string">desc</type>
		</e>
	</xsl:for-each>
	<xsl:for-each select="*[local-name()='trk']">
		<e class="object">
		<xsl:call-template name="GpxToTrack"/>
		</e>
	</xsl:for-each>
	<xsl:for-each select="*[local-name()='rte']">
		<e class="object">
		<xsl:call-template name="GpxToRoute"/>
		</e>
	</xsl:for-each>
	<xsl:for-each select="*[local-name()='wpt']">
		<e class="object">
		<type type="string">waypoint</type>
		<name type="string"><xsl:value-of select="*[local-name()='name']"/></name>
		<desc type="string"><xsl:value-of select="*[local-name()='desc']"/></desc>
		<position>
			<xsl:call-template name="GpxToWaypoint"/>
		</position>
		</e>
	</xsl:for-each>
</a>
</xsl:template>

<xsl:template name="GpxToTrack">
	<name type="string"><xsl:value-of select="*[local-name()='name']"/></name>
	<desc><xsl:value-of select="*[local-name()='desc']"/></desc>
	<type type="string">track</type>
	<way class="object">
	<waypoints class="array">
		<xsl:for-each select="*[local-name()='trkseg']/*[local-name()='trkpt']">
		<e class="object">
			<xsl:call-template name="GpxToWaypoint"/>
		</e>
		</xsl:for-each>
	</waypoints>
	</way>
</xsl:template>

<xsl:template name="GpxToRoute">
	<name type="string"><xsl:value-of select="*[local-name()='name']"/></name>
	<desc><xsl:value-of select="*[local-name()='desc']"/></desc>
	<type type="string">route</type>
	<way class="object">
	<waypoints class="array">
		<xsl:for-each select="*[local-name()='rtept']">
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

<xsl:template name="KMLStyle">
<xsl:choose>

<xsl:when test="local-name()='Style'">
	<xsl:for-each select="*[local-name()='LineStyle']/*[local-name()='color']">
		<color type="string"><xsl:value-of select="concat(substring(., 7, 2), substring(., 5, 2), substring(., 3, 2))"/></color>
	</xsl:for-each>
	<xsl:for-each select="*[local-name()='LineStyle']/*[local-name()='width']">
		<weight type="string"><xsl:value-of select="."/></weight>
	</xsl:for-each>
	<xsl:for-each select="*[local-name()='IconStyle']/*[local-name()='Icon']/*[local-name()='href']">
		<xsl:if test="not(starts-with(text(), 'http://maps.google.com'))"><url type="string"><xsl:value-of select="."/></url></xsl:if>
	</xsl:for-each>
</xsl:when>

<xsl:when test="local-name()='StyleMap'">
	<xsl:variable name="style" select="substring-after(string(*[local-name()='Pair']/*[local-name()='styleUrl']), '#')"/>
	<xsl:for-each select="//*[local-name()='Style' and @id=$style]">
		<xsl:call-template name="KMLStyle"/>
	</xsl:for-each>
</xsl:when>

<xsl:when test="count(*[local-name()='styleUrl']) &gt; 0">
	<xsl:variable name="style" select="substring-after(string(*[local-name()='styleUrl']), '#')"/>
	<xsl:for-each select="//*[(local-name()='Style' or local-name()='StyleMap') and @id=$style]">
		<xsl:call-template name="KMLStyle"/>
	</xsl:for-each>
</xsl:when>

<xsl:when test="count(*[local-name()='Style']) &gt; 0">
	<xsl:for-each select="*[local-name()='Style']">
		<xsl:call-template name="KMLStyle"/>
	</xsl:for-each>
</xsl:when>

</xsl:choose>
</xsl:template>

<xsl:template name="PlacemarkToTrack">
	<name type="string"><xsl:value-of select="*[local-name()='name']"/></name>
	<desc></desc>
	<type type="string">track</type>
	<xsl:call-template name="KMLStyle"/>
	<coordinates type="string"><xsl:value-of select="*[local-name()='LineString']/*[local-name()='coordinates']"/></coordinates>
</xsl:template>

<xsl:template name="PlacemarkToPolygon">
	<name type="string"><xsl:value-of select="*[local-name()='name']"/></name>
	<desc></desc>
	<type type="string">route</type>
	<xsl:call-template name="KMLStyle"/>
	<coordinates type="string"><xsl:value-of select="*[local-name()='Polygon']/*[local-name()='outerBoundaryIs']/*[local-name()='LinearRing']/*[local-name()='coordinates']"/></coordinates>
</xsl:template>

<xsl:template name="PlacemarkToWaypoint">
	<xsl:variable name="coordinates" select="normalize-space(*[local-name()='Point']/*[local-name()='coordinates'])"/>
	<name type="string"><xsl:value-of select="*[local-name()='name']"/></name>
	<desc></desc>
	<type type="string">waypoint</type>
	<xsl:call-template name="KMLStyle"/>
	<position>
		<lat type="number"><xsl:value-of select="substring-before(substring-after($coordinates, ','), ',')"/></lat>
		<lng type="number"><xsl:value-of select="substring-before($coordinates, ',')"/></lng>
	</position>
</xsl:template>

</xsl:stylesheet>