<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c" %><%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn" %><?xml version='1.0' encoding="ISO-8859-1" standalone="no" ?>
<!DOCTYPE WMT_MS_Capabilities SYSTEM "http://schemas.opengis.net/wms/1.1.1/WMS_MS_Capabilities.dtd"
 [
 <!ELEMENT VendorSpecificCapabilities EMPTY>
 ]>

<WMT_MS_Capabilities version="1.1.1">

<Service>
  <Name>OGC:WMS</Name>
  <Title>WMS-Sarsoft</Title>
  <OnlineResource xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="${serverURL}resource/imagery/wms?"/>
  <Fees>Free (or No cost)</Fees>
  <AccessConstraints></AccessConstraints>
</Service>

<Capability>
  <Request>
    <GetCapabilities>
      <Format>application/vnd.ogc.wms_xml</Format>
      <DCPType>
        <HTTP>
          <Get><OnlineResource xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="${serverURL}resource/imagery/wms?"/></Get>
        </HTTP>
      </DCPType>
    </GetCapabilities>
    <GetMap>
      <Format>image/png</Format>
      <DCPType>
        <HTTP>
          <Get><OnlineResource xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="${serverURL}resource/imagery/wms?"/></Get>
        </HTTP>
      </DCPType>
    </GetMap>
  </Request>
  <Exception>
    <Format>application/vnd.ogc.se_inimage</Format>
  </Exception>
  <VendorSpecificCapabilities />
  <UserDefinedSymbolization SupportSLD="1" UserLayer="0" UserStyle="1" RemoteWFS="0"/>
  <c:forEach var="layer" items="${layers}">
	  <Layer>
	    <Name>${layer.alias}</Name>
	    <Title>${layer.name}</Title>
	    <SRS>EPSG:3857</SRS>
	    <SRS>EPSG:900913</SRS>
	    <LatLonBoundingBox minx="-141" miny="30" maxx="-52" maxy="45" />
	    <BoundingBox SRS="EPSG:900913"
	                minx="-13803616" miny="3503549" maxx="-8905559" maxy="6446275" />
	    <BoundingBox SRS="EPSG:3857"
	                minx="-13803616" miny="3503549" maxx="-8905559" maxy="6446275" />
	  </Layer>
  </c:forEach>
</Capability>
</WMT_MS_Capabilities>
