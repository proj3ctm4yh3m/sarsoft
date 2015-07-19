# Installation #

Sarsoft is packaged as a JAR file; all you need to run it is Java 5.

  * Download the jar file at <a href='http://sarsoft.googlecode.com/files/sarsoft-0.9.jar'><a href='http://sarsoft.googlecode.com/files/sarsoft-0.9.1.jar'>http://sarsoft.googlecode.com/files/sarsoft-0.9.1.jar</a></a>.

  * Start the jar file by typing `java -jar sarsoft-0.9.1.jar` at the command line or double-clicking the file in the windows file explorer.

  * Point your browser at http://localhost:8080 to access Sarsoft.

  * Working data will be placed in a folder named `.sarsoft`, in the directory you start the .jar file from.

# Configuration #

Sarsoft is ready to use out of the box, with no external dependencies or configuration required.  Sarsoft supports a number of deployment configurations based on factors like internet availability and the potential for public access; you can customize it by passing settings on the command line or through a `sarsoft.properties` file.  As an example, see [the sample properties file](SamplePropertiesFile.md).

### Map Center and Datum ###

The default map for new searches covers the entire US.  You can customize the default center and zoom level

```
sarsoft.map.default.zoom=5
sarsoft.map.default.lat=38
sarsoft.map.default.lng=-97
```

You can also set the default datum to NAD27 instead of WGS84

```
sarsoft.map.datum=NAD27 CONUS
```


### API Keys ###

The Garmin Communicator plug-in (used to move data in/out of GPS devices) requires an API key based on your host name.  This isn't relevant if you only use Sarsoft on one machine, but if you're hosting it on an internal network at the CP, you'll need to get an API key for your server's IP address or DNS name.  Sarsoft comes preconfigured to work with the following common internal IP ranges:

```
192.168.1.1 - 192.168.1.10
192.168.1.100 - 192.168.1.110
10.0.2.1,10.1.2.1
```

You can add new API keys for specific hostnames or IP addresses using the following templates for 192.168.1.1 and sarsoft.org.  API keys are available [here](http://developer.garmin.com/web-device/garmin-communicator-plugin/get-your-site-key/).

```
garmin.key.192.168.1.1=api key
garmin.key.sarsoft.org=api key
```

### Location Tracking ###

Sarsoft can track locations using local APRS radio traffic, the APRS-IS network, and SPOT beacons.  These services are turned off by default; see LocationTracking for more information.

### Performance Tuning ###

Sarsoft regularly syncs browser clients with the server in order to facilitate spreading work across multiple machines.  By default this happens every 10 seconds, which may prove too aggressive for your CP setup.  You can set the sync interval in milliseconds:

```
sarsoft.refresh.interval=10000
```

If you use map tiles from the internet rather than hosting your own locally, Sarsoft will have the server act as an intermediary.  By fetching and then caching tiles, the server can cut data consumption from multiple browsers in a bandwidth constrained environment.  This does not happen for Google map layers.  You can turn this feature off:

```
sarsoft.map.tileCacheEnabled=false
```

### Logging ###

Sarsoft allows you to configure log4j by putting log4j configuration commands inline with your other properties.  If you do this, you need to start from scratch, creating an appender and setting the root logger level.  For example, to enable debug-level statements for all sarsoft code, you can add the following:

```
log4j.appender.console=org.apache.log4j.ConsoleAppender
log4j.appender.console.layout=org.apache.log4j.SimpleLayout
log4j.rootLogger=WARN,console
log4j.logger.org.sarsoft=DEBUG,console
```

There is a brief window during startup where Sarsoft will run off its internal log4j configuration before reconfiguring log4j based on the sarsoft.properties file.

Winstone, the embedded servlet container that Sarsoft runs in, does its own logging.  You can control its logging level by adding --debug=[1-9] when you start Sarsoft, with 1 being the most severe and 9 being the most verbose.  You can use this to quiet the BrokenPipeExceptions that proliferate when a browser halts its request mid-stream.

```
java -jar sarsoft.jar --debug=1
```

# Hosting #

The following configuration settings may be useful if you want to host Sarsoft on a standard web server on the internet.

### Google Maps ###

Sarsoft comes with an embedded copy of the OpenLayers map viewer, which can be used offline when no internet connection is available.  It also supports Google Maps, which allows you to use Google's map background tiles.  OpenLayers is the default; you can switch to Google using

```
sarsoft.map.viewer=google
```

When using Google Maps, you should add the google map types to sarsoft.map.backgrounds and sarsoft.map.backgrounds.default.  They are map,ter,sat and hyb.

### MySQL ###

Sarsoft's default database is HSQL, which is an in-memory/filesystem database embedded within the application.  You can use a different database (MySQL is the only one which has been tested) using the following parameters:

```
hibernate.driverClass=[org.hsqldb.jdbcDriver | com.mysql.jdbc.Driver | etc ]
hibernate.jdbcUrl=jdbc:mysql:://hostname/dbname
hibernate.username=your username
hibernate.password=your password
hibernate.dialect=[org.hibernate.dialect.HSQLDialect | org.hibernate.dialect.MySQLDialect | etc ]
```

### Map Backgrounds ###

Sarsoft comes with the following background layers preconfigured: OpenStreetMap Mapnik (om), OpenStreetMap Osmarender (oo),  OpenCycleMap (oc), USGS via Terraserver (usgs), and several CA-specific layers from CalTopo.com - 7.5' USGS quads (t), 7.5' USFS quads (f), Shaded Relief (r) and National Agriculture Imagery Program aerial images (usi).  Google map layers are also available when using the Google Maps viewer.  You can control which layers are available and which are turned on by default using

```
sarsoft.map.backgrounds=t,f,nrc,r,v,12,usi,cm,n,usgs,eus,oc,om,modis,c,usf
sarsoft.map.backgrounds.default=t,n,f,r,v,nrc,cm,usi,oc,om,c,usf
```

To add a new layer, it must either use the Web Map Service (WMS) api, or follow the standard zoom/x/y tile structure used in Google Maps.  In either case, you need to specify the name, type (WMS | TILE), copyright, min & max resolutions, whether the resulting image is a PNG file, and a URL template.  You also need to add your layer to the list of available backgrounds (see above).  The OpenStreetMap and USGS layers are provided as examples of Tile and WMS layers, respectively:

```
sarsoft.map.background.om.name=OpenStreetMap
sarsoft.map.background.om.type=TILE
sarsoft.map.background.om.copyright=OSM
sarsoft.map.background.om.maxresolution=17
sarsoft.map.background.om.minresolution=0
sarsoft.map.background.om.png=true
sarsoft.map.background.om.template=http://tile.openstreetmap.org/{Z}/{X}/{Y}.png
sarsoft.map.background.om.description=OpenStreetMap Mapnik renderer.

sarsoft.map.background.usgs.name=National Map
sarsoft.map.background.usgs.type=WMS
sarsoft.map.background.usgs.copyright=USGS
sarsoft.map.background.usgs.maxresolution=16
sarsoft.map.background.usgs.minresolution=6
sarsoft.map.background.usgs.png=true
sarsoft.map.background.usgs.template=http://raster.nationalmap.gov/ArcGIS/rest/services/DRG/TNM_Digital_Raster_Graphics/MapServer/export?dpi=96&transparent=true&format=png24&layers=show%3A2%2C3%2C5%2C6%2C7%2C8%2C9%2C10%2C11%2C12%2C13%2C14%2C15%2C16%2C17%2C18%2C19%2C20%2C21%2C22%2C23%2C24%2C0%2C1&bbox={left},{bottom},{right},{top}&bboxSR=4326&imageSR=102113&size={tilesize}%2C{tilesize}&_ts=1334083928933&f=image
sarsoft.map.background.usgs.description=National Map USGS scans.
```

Note that Sarsoft does not know how to directly speak WMS and requires you to supply a template with most of the information filled in except for the left, bottom, right and top coordinates and a tilesize parameter.