# Typical Deployment #

Sarsoft is a fully self contained web application that can be run _online_ as a website or _offline_ inside a command post.  A full CP deployment would look like the following:

<img src='http://sarsoft.googlecode.com/svn/wiki/screenshots/CP.png' />

A machine running Sarsoft sits at a known location (e.g. sarsoft.local or a fixed IP address) so that clients can reach it over the CP network.  The server has copies of all the javascript libraries it relies on (YUI, jQuery, OpenLayers) so clients aren't dependent on the internet to fetch them.  Map tiles and elevation data can be stored locally on the server or on a removable USB drive.  Client machines should have the Garmin plugin preinstalled so that they can upload routes and download tracks to GPS.

Sarsoft is capable of tracking locations using SPOT beacons, the APRS-IS network (both requiring internet access) and local APRS radio traffic (requiring a TNC).  If you need to listen on multiple frequencies (e.g. a data channel and burst-after-voice on a voice channel) Sarsoft supports interfacing multiple TNCs.  For more information on Sarsoft and APRS read the LocationTracking page; for general APRS information visit [the Wikipedia APRs page](http://en.wikipedia.org/wiki/Automatic_Packet_Reporting_System), [aprs.org](http://aprs.org/), [aprs-is.net](http://aprs-is.net/) and [aprs.fi](http://aprs.fi/).

# Architecture #

Sarsoft is built on a standard Spring/Hibernate Java web stack.  On the client side, it uses YUI, jQuery, OpenLayers and the Google Maps API.  In some cases components are swapped between online and offline operation, as listed below.  Each of these is independently configurable; there is no master online/offline switch.  All offline components are distributed inside the Sarsoft JAR file.

| **Component** | **Online Mode** | **Offline Mode** |
|:--------------|:----------------|:-----------------|
| App Server    | Any Servlet Container | Winstone         |
| Database      | MySQL           | HSQLDB           |
| Map Viewer    | Google Maps     | OpenLayers       |
| Map Sources   | Various         | Local Drive      |

A high level component visualization is shown at bottom.  Some important notes:

  * **HSQLDB** is a small database embedded within its own JDBC driver.  When Hibernate loads the driver, an HSQLDB instance is automatically launched.  Unless overridden in a properties file, this instance will create human-readable SQL files in .sarsoft/hsqldb to store persistent data.

  * **Map Tiles** are available from the project author for SAR purposes; because filesystems do a poor job handling millions of small files, individual files are provided zipped together.  When served through Sarsoft, they can also be loaded in any application that reads Web Mercator (aka google maps style) tiles.

  * **OpenLayers** is an open source map viewer similar to Google Maps.  The copy included with Sarsoft has been customized so that image assets are loaded from the local server, and is now slightly out of date.  All Sarsoft code targets the Google Maps v3 API, and a compatibility wrapper is provided to translate between this API and OpenLayers.

<img src='http://sarsoft.googlecode.com/svn/wiki/screenshots/architecture.png' />

# Data Model #

Sarsoft does not write directly to the database; data is passed to and read from Hibernate as objects, using a generic DAO for almost all classes.  Controllers make most classes available as REST end points, and there is a mostly passthrough mapping between tables, objects, JSON serialization and the resulting client-side Javascript object.  A description of the high level data model is equally applicable to both the server and the client.

There are two types of root "documents" that describe a working set of data: Searches and Maps.  Maps contain Shapes and Markers, while Searches also contain a number of SAR specific objects: OperationalPeriods, SearchAssignments, Resources, and Clues.

GPS devices talk in routes, tracks and waypoints.  Google Maps talks in lines, polygons and markers.  Sarsoft abstracts this out into Ways and Waypoints; a Way contains an ordered list of Waypoints, a type (route v. track) and other metadata.  Both Ways and Waypoints can be owned by parent objects:

  * **Markers** are 1:1 with Waypoints
  * **Shapes** are 1:1 with Ways
  * **SearchAssignments** are 1:N with both Ways and Waypoints
  * **Resources** and **Clues** are 1:1 with Waypoints

On the client side, an InteractiveMap class allows code to talk in terms of Ways and Waypoints, while translating internally to Markers, Polygons and Polylines for the Google Maps API.