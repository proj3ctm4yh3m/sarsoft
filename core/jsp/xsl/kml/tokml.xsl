<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:json="json" xmlns="http://www.opengis.net/kml/2.2" xmlns:java="java" xmlns:org="org" exclude-result-prefixes="json java org">
<xsl:param name="template"/>
<xsl:output method="xml"/>
<xsl:template match="/json:o">
<kml>
 <Document>
   <name>Sarsoft Export</name>
   <description>Export from Sarsoft</description>
	<xsl:choose>
		<xsl:when test="$template='SearchAssignment'">
			<xsl:call-template name="SearchAssignmentToKml"/>
		</xsl:when>
		<xsl:when test="$template='Map'">
			<xsl:call-template name="MapToKml"/>
		</xsl:when>
		<xsl:when test="$template='Shape'">
			<xsl:call-template name="ShapeToKml"/>
		</xsl:when>
		<xsl:when test="$template='Marker'">
			<xsl:call-template name="MarkerToKml"/>
		</xsl:when>
	</xsl:choose>
 </Document>
</kml>
</xsl:template>
<xsl:template match="/json:a">
<kml xmlns="http://www.opengis.net/kml/2.2">
 <Document>
   <name>Sarsoft Export</name>
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
	<xsl:variable name="rgbcolor" select="org:sarsoft.plans.Constants.getColorById($idx)"/>
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



<xsl:template name="MapToKml">
	<xsl:for-each select="json:shapes/json:e">
		<xsl:call-template name="ShapeToKml"/>
	</xsl:for-each>
	<xsl:for-each select="json:markers/json:e">
		<xsl:call-template name="MarkerToKml"/>
	</xsl:for-each>
</xsl:template>

<xsl:template name="ShapeToKml">
	<xsl:variable name="idx" select="number(json:id)"/>
	<xsl:variable name="rgbcolor" select="json:color"/>
	<xsl:variable name="color" select="concat(substring($rgbcolor,6,2),substring($rgbcolor,4,2),substring($rgbcolor,2,2))"/>
	<xsl:variable name="name">
		<xsl:choose>
			<xsl:when test="string-length(json:label) &gt; 0"><xsl:value-of select="json:label"/></xsl:when>
			<xsl:otherwise><xsl:value-of select="json:id"/></xsl:otherwise>
		</xsl:choose>
	</xsl:variable>
  <Placemark>
    <Style>
      <LineStyle>
           <color><xsl:value-of select="concat('FF', $color)"/></color>
        <width><xsl:value-of select="json:weight"/></width>
      </LineStyle>
      <PolyStyle>
      	<fill>1</fill>
      	<outline>1</outline>
      	<width><xsl:value-of select="json:weight"/></width>
        <color><xsl:value-of select="concat('44', $color)"/></color>
      </PolyStyle>
    </Style>
    <name><xsl:value-of select="$name"/></name>
    	<xsl:for-each select="json:way">
			<xsl:call-template name="WayToKml"/>
		</xsl:for-each>
</Placemark>
</xsl:template>

<xsl:template name="MarkerToKml">
	<xsl:variable name="name">
		<xsl:choose>
			<xsl:when test="string-length(json:label) &gt; 0"><xsl:value-of select="json:label"/></xsl:when>
			<xsl:otherwise><xsl:value-of select="json:id"/></xsl:otherwise>
		</xsl:choose>
	</xsl:variable>

	<Placemark> 
	 <name><xsl:value-of select="$name"/></name> 
	<Style>
	      <IconStyle>
	<Icon>
	<href>
<xsl:choose>
<xsl:when test="string-length(json:url) = 0">http://caltopo.com/resource/imagery/icons/circle/FF0000.png</xsl:when>
<xsl:when test="starts-with(json:url, '#')">http://caltopo.com/resource/imagery/icons/circle/<xsl:value-of select="substring(json:url, 2)"/>.png</xsl:when>
<xsl:when test="not(contains(json:url, '/') or contains(json:url, '.'))">http://caltopo.com/static/images/icons/<xsl:value-of select="json:url"/>.png</xsl:when>
<xsl:otherwise><xsl:value-of select="json:url"/></xsl:otherwise>
</xsl:choose>
	</href>
	</Icon>
	      </IconStyle>
	</Style>
	 <Point>
	  <coordinates>
	  <xsl:for-each select="json:position">
	  	<xsl:call-template name="WaypointToKml"/>
	  </xsl:for-each>
	  </coordinates>
	 </Point> 
	</Placemark>
</xsl:template>

<xsl:template name="WayToKml">
	<xsl:choose>
	<xsl:when test="string(json:polygon)='true'">
		<xsl:call-template name="PolygonToKml"/>
	</xsl:when>
	<xsl:otherwise>
		<xsl:call-template name="LineToKml"/>
	</xsl:otherwise>
	</xsl:choose>
</xsl:template>

<xsl:template name="LineToKml">
    <LineString>
      <altitudeMode>clampToGround</altitudeMode>
      <tessellate>1</tessellate>
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

<xsl:template name="PolygonToKml">
    <Polygon>
    	<altitudeMode>clampToGround</altitudeMode>
   		<tessellate>1</tessellate>
    	<outerBoundaryIs>
    	  <LinearRing>
    	    <coordinates>
		      	<xsl:for-each select="json:zoomAdjustedWaypoints/json:e">
		      	  <xsl:call-template name="WaypointToKml"/>
		      	</xsl:for-each>
		      	<xsl:for-each select="json:zoomAdjustedWaypoints/json:e[position()=1]">
		      	  <xsl:call-template name="WaypointToKml"/>
		      	</xsl:for-each>
    	    </coordinates>
    	  </LinearRing>
    	</outerBoundaryIs>
    </Polygon>
</xsl:template>

</xsl:stylesheet>