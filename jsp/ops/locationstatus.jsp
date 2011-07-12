<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn" %>

<h2>Location Status</h2>

<ul>
  <li><a href="/app/location/reset">Force Reset</a> all location services.</li>
  <li><a href="javascript:window.location.reload()">Refresh</a> this information.</li>
  <li>Perform a <a href="/app/location/check">one-time check</a> on all resources using SPOT and aprs.fi</li>
</ul>

<p>This page can help you debug Sarsoft location tracking issues.  Locations are provided by 3 services (SPOT, APRS-IS, APRS Local); these are configured
through properties files and cannot be turned on or altered through Sarsoft's UI.  SPOT and APRS-IS require an internet connection to get location data from 3rd party services, and
APRS Local requires you to interface with a TNC or NMEA data stream using USB or a serial port.  If you suspect any of these services are not working properly, you can get
Sarsoft to reset and start from scratch by clicking <a href="/app/location/reset">Force Reset</a>.  If you've just added a large number of resources to Sarsoft, you can get their
last known position by running a <a href="/app/location/check">one-time check</a> that uses stored locations on the aprs.fi server rather than waiting for live APRS transmissions. </p>

<c:choose>
<c:when test="${engines.spot ne null}">
<h3>SPOT: ON</h3>
<pre>
${engines.spot.statusMessage}
</pre>
</c:when>
<c:otherwise>
<h3>SPOT: OFF</h3>
</c:otherwise>
</c:choose>

<c:choose>
<c:when test="${engines.aprst2 ne null}">
<h3>APRS-IS: ON</h3>
<pre>
${engines.aprst2.statusMessage}
</pre>
</c:when>
<c:otherwise>
<h3>APRS-IS: OFF</h3>
</c:otherwise>
</c:choose>


<c:choose>
<c:when test="${engines.aprsLocal ne null}">
<h3>APRS Local: ON</h3>
<pre>
${engines.aprsLocal.statusMessage}
</pre>
</c:when>
<c:otherwise>
<h3>APRS Local: OFF</h3>
</c:otherwise>
</c:choose>
<div>
Note that if you are running Windows XP or 2000, you need to install the <a href="/static/OpenTrackerUSB.inf">.INF file located here</a> for the OpenTracker USB to work properly.
</div>