<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn" %>
<%@ taglib uri="http://tiles.apache.org/tags-tiles" prefix="tiles" %>


${welcomeMessage}

<c:if test="${message ne null}">
<div style="font-weight: bold; color: red">Error: ${message}</div>
</c:if>

<c:choose>
<c:when test="${fn:length(welcomeHTML) gt 0}">
${welcomeHTML}
</c:when>
<c:when test="${hosted eq false}">
<p>
Normally, this welcome page would be replaced by information about your SAR team's specific installation.  Here are some basic pointers to help you get started.
<br/><br/>
Questions?  Contact Matt Jacobs, Bay Area Mountain Rescue at <a href="mailto:info@caltopo.com">info@caltopo.com</a><br/>
Get the latest code and report bugs on the <a href="http://code.google.com/p/sarsoft/">Google Code site</a>.<br/>
Site updates and mapping/GIS advice on the <a href="http://caltopo.blogspot.com">CalTopo Blog</a>.
</p>

<h2>Get Started</h2>
<p>Use the <a href="/map.html">quick map viewer</a> to browse and print maps instantly, or click on the Searches tab to create assignments, print forms, and track resources.
</p>

<h2 id="documentation">Documentation</h2>
<p>The best way to learn to use Sarsoft is to play around with a new map.  Unlike some topo programs, the map viewer doesn't have modes that
lock the cursor into a single function (line draw, elevation profile, etc.).  Instead, you create new objects and modify existing ones by
right-clicking on the map background to bring up a context menu.  Objects are saved as you work on them; there is no need to explicitly save
your data.
</p>

<img src="/static/images/mapview.jpg"/>

<p>
Sarsoft starts with a basic Google Maps viewer and adds the following elements:
<ul>
<li><b>Visibility Toggles</b>.  These allow you to toggle the visibility of map features.
 <ul>
  <li><b style="color: red">UTM</b>: UTM gridlines and edge tickmarks.</li>
  <li><b style="color: red">LBL</b>: Marker and Shape labels.</li>
  <li><b style="color: red">TRK</b>: Tracks and Waypoints.</li>
  <li><b style="color: red">LOC</b>: Resource locations from APRS and SPOT.</li>
  <li><b style="color: red">CLL</b>: Nearby APRS callsigns.</li>
  <li><b style="color: red">CLUE</b>: Clues.</li>
  <li><b style="color: red">MRK</b>: All markup (non-assignment shapes and markers).</li>
 </ul>
</li>
<li><b>Controls</b>.
 <ul>
  <li><img src="/static/images/config.png"/>&nbsp;Map setup: Configure UTM grids and sharing/permissions.</li>
  <li><img src="/static/images/find.png"/>&nbsp; Find: Locate a UTM, Lat/Long, address, or named shape or marker.</li>
  <li><img src="/static/images/print.png"/>&nbsp; Page size: Adjust for full-page printouts (see below).</li>
  <li><img src="/static/images/save.png"/>&nbsp; Save: Saves map layers and UTM grid settings for future page loads.</li>
  <li><img src="/static/images/gps.png"/>&nbsp; Export: Export map to GPX, KML (Google Earth) or a Garmin GPS.  Import data from GPX or a Garmin GPS.</li>
  <li><img src="/static/images/home.png"/>&nbsp; Home: Return to plans page.</li>
 </ul>
</li>
<li><b>Layer Selection</b>.  Sarsoft lets you choose the base map layer through a standard dropdown, but you can also click the <span style="font-weight: bold; color: red">+</span> next to
it to add additional layers.  When adding another regular map layer, you can choose the opacity, from 0-100 - for example, adding shaded relief at 15% to the USGS topo scans.  Sarsoft
also supports adding mostly transparent overlay layers, e.g. USFS roads, via checkboxes.  I'm working on generating some of these for the state.  Sarsoft puts the number of additional map
layers after the <span style="font-weight: bold; color: red">+</span>.  After adding shaded relief, it will appear as <span style="font-weight: bold; color: red">+1</span>.
</li>
<li><b>Magnetic Declination</b>.  Layer information may also appear here - the NAIP aerial layer adds "Imagery from 2009".  You can hide this window by clicking on the
<img src="/static/images/right.png"/> arrow.
</li>
<li><b>Datum</b>.  You can click on the <b>+</b> to switch the map's datum between WGS84 and NAD27.  All GPSs and standard topo programs transfer data as WGS84, and all Sarsoft exports are
in WGS84; you don't need to worry about matching this setting to your GPS's datum.
</li>
</ul>
</p>

<p>
<b>Printing</b> from the web is always a tricky proposition.  Sarsoft allows you to make borderless prints at any size you want, but your browser may not cooperate.  Tested browser support
is as follows:
<ul>
 <li>Chrome: Fully supported.  Borderless prints require selecting "Print using system dialog" rather than Chrome's built-in chrome://print page.</li>
 <li>Firefox: Will add a sizeable margin and the page's URL to a printout, so there is no way to do borderless prints.  
 You can still set the page size at 8.5x11 and Firefox will automatically scale it down.</li>
 <li>Internet Explorer: Will print the base map, but will may have trouble with shapes and UTM gridlines.</li>
</ul>
</p>

</c:when>
<c:otherwise>
<p>You need to log in with a Google or Yahoo account to create new objects.  If someone's shared a URL with you, you can visit it directly
without logging in.
</p>
<p>
Log in using your:
<ul>
<li><a href="/app/openidrequest?domain=google">Google account</a></li>
<li><a href="/app/openidrequest?domain=yahoo">Yahoo account</a></li>
</ul>
</p>
</c:otherwise>
</c:choose>

