<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:json="json" xmlns="http://www.opengis.net/kml/2.2" exclude-result-prefixes="json">
<xsl:param name="template"/>
<xsl:param name="colors"/>
<xsl:output method="xml"/>
<xsl:template match="/json:o">
<kml>
 <Document>
   <name>Sarosft Export</name>
   <description>Export from Sarsoft</description>
	<xsl:choose>
		<xsl:when test="$template='SearchAssignment'">
			<xsl:call-template name="SearchAssignmentToKml"/>
		</xsl:when>
	</xsl:choose>
 </Document>
</kml>
</xsl:template>
<xsl:template match="/json:a">
<kml xmlns="http://www.opengis.net/kml/2.2">
 <Document>
   <name>Sarosft Export</name>
   <description>Export from Sarsoft</description>
	<xsl:choose>
		<xsl:when test="$template='SearchAssignments'">
			<xsl:call-template name="SearchAssignmentsToKml"/>
		</xsl:when>
	</xsl:choose>
 </Document>
</kml>
</xsl:template>
<xsl:template name="SearchAssignmentsToKml">
	<xsl:for-each select="json:e">
		<xsl:call-template name="SearchAssignmentToKml"/>
	</xsl:for-each>
</xsl:template>
<xsl:template name="SearchAssignmentToKml">
	<xsl:variable name="idx" select="number(json:id)"/>
	<xsl:variable name="idxmod" select="$idx mod count($colors)"/>
	<xsl:variable name="rgbcolor" select="$colors[$idxmod + 1]"/>
	<xsl:variable name="color" select="concat(substring($rgbcolor,6,2),substring($rgbcolor,4,2),substring($rgbcolor,2,2))"/>
	<xsl:variable name="name" select="concat('Assignment ', json:id, ': ', json:name)"/>
	<xsl:for-each select="json:ways/json:e">
	  <Placemark>
	    <Style>
	      <LineStyle>
            <color><xsl:value-of select="concat('FF', $color)"/></color>
	        <width>3</width>
	      </LineStyle>
	      <PolyStyle>
	      	<fill>1</fill>
	      	<outline>1</outline>
	      	<width>3</width>
	        <color><xsl:value-of select="concat('80', $color)"/></color>
	      </PolyStyle>
	    </Style>
	    <name><xsl:value-of select="$name"/> (<xsl:value-of select="json:type"/>)</name>
			<xsl:call-template name="WayToKml"/>
	</Placemark>
	</xsl:for-each>
</xsl:template>
<xsl:template name="WayToKml">
    <xsl:param name="color"/>
	<xsl:choose>
	<xsl:when test="json:type='ROUTE'">
		<xsl:call-template name="RouteToKml"/>
	</xsl:when>
	<xsl:when test="json:type='TRACK'">
		<xsl:call-template name="TrackToKml"/>
	</xsl:when>
	</xsl:choose>
</xsl:template>

<xsl:template name="TrackToKml">
    <LineString>
      <altitudeMode>clampToGround</altitudeMode>
      <tesselate>1</tesselate>
      <coordinates>
      	<xsl:for-each select="json:zoomAdjustedWaypoints/json:e">
      	  <xsl:call-template name="WaypointToKml"/>
      	</xsl:for-each>
      </coordinates>
    </LineString>
</xsl:template>
<xsl:template name="WaypointToKml">
  <xsl:value-of select="json:lng"/>,<xsl:value-of select="json:lat"/>,0<xsl:text>&#x0A;</xsl:text>
</xsl:template>

<xsl:template name="RouteToKml">
    <Polygon>
   		<tesselate>1</tesselate>
    	<altitudeMode>clampToGround</altitudeMode>
    	<outerBoundaryIs>
    	  <LinearRing>
    	    <coordinates>
		      	<xsl:for-each select="json:zoomAdjustedWaypoints/json:e">
		      	  <xsl:call-template name="WaypointToKml"/>
		      	</xsl:for-each>
    	    </coordinates>
    	  </LinearRing>
    	</outerBoundaryIs>
    </Polygon>
</xsl:template>

</xsl:stylesheet>