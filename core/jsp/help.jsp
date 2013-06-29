<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn" %>
<%@ taglib uri="http://tiles.apache.org/tags-tiles" prefix="tiles" %>

<div id="layers">
<h2>Map Layers</h2>
<p>The ${version} experience begins with mixing and matching map layers.  From simple shaded relief to complex stacks involving contours and aerial imagery,
layer blending makes for beautiful visualizations and new ways of looking at terrain.  To play with this, simply click on the <span style="font-weight: bold; color: red">+0</span> or <span style="font-weight: bold; color: red">+1</span>
at the top right of the screen, which shows the current number of additional layers - or click on one of the presets in the leftbar.  The images below are just examples to
get you started - click on one to view the actual map.</p>

<div style="float: left; padding-right: 20px; width: 200px; height: 240px">
<a href="/map.html#ll=46.847,-121.746&z=15&b=t&n=0.25&o=r"><img style="width:200px; height: 200px" src="http://s3-us-west-1.amazonaws.com/caltopo/web/ct-topo.jpg"/></a><br/>
<span>High Resolution Topo Scans</span>
</div>

<div style="float: left; padding-right: 20px; width: 200px; height: 240px">
<a href="/map.html#ll=39.50639,-120.34651&z=15&b=f&n=0.25&o=r"><img style="width:200px; height: 200px" src="http://s3-us-west-1.amazonaws.com/caltopo/web/ct-usfs.jpg"/></a><br/>
<span>Forest Service Road and Boundary Maps</span>
</div>

<div style="float: left; padding-right: 20px; width: 200px; height: 240px">
<a href="/map.html#ll=36.67007,-117.32643&z=11&b=v"><img style="width:200px; height: 200px" src="http://s3-us-west-1.amazonaws.com/caltopo/web/ct-visitor.jpg"/></a><br/>
<span>GPS-Compatible Visitor Maps</span>
</div>

<div style="float: left; padding-right: 20px; width: 200px; height: 240px">
<a href="/map.html#ll=37.8,-122.35&z=12&b=1900"><img style="width:200px; height: 200px" src="http://s3-us-west-1.amazonaws.com/caltopo/web/ct-hist.jpg"/></a><br/>
<span>Historic Topos</span>
</div>

<div style="float: left; padding-right: 20px; width: 200px; height: 240px">
<a href="/map.html#ll=41.398,-122.2&z=16&b=sat&n=0.35&o=r&a=c"><img style="width:200px; height: 200px" src="http://s3-us-west-1.amazonaws.com/caltopo/web/ct-naip.jpg"/></a><br/>
<span>Relief Shaded, Contoured Imagery</span>
</div>

<div style="float: left; padding-right: 20px; width: 200px; height: 240px">
<a href="/map.html#ll=42.07526,-70.21877&z=15&b=usi&a=usf"><img style="width:200px; height: 200px" src="http://s3-us-west-1.amazonaws.com/caltopo/web/ct-ustopo.jpg"/></a><br/>
<span><i>US Topo</i> Aerial Maps</span>
</div>

<div style="float: left; padding-right: 20px; width: 200px; height: 240px">
<a href="/map.html#ll=41.4,-122.2&z=14&b=t&n=0.25&o=r&a=sf"><img style="width:200px; height: 200px" src="http://s3-us-west-1.amazonaws.com/caltopo/web/ct-slope.jpg"/></a><br/>
<span>Slope Shading</span>
</div>

<div style="float: left; padding-right: 20px; width: 200px; height: 240px">
<a href="http://caltopo.blogspot.com/2013/02/custom-dem-shading.html"><img style="width:200px; height: 200px" src="http://s3-us-west-1.amazonaws.com/caltopo/web/dem.jpg"/></a><br/>
<span>Custom DEM Shading</span>
</div>

<div style="clear: both"></div>

</div>

<div id="shapes">
<h2>Creating and Editing Shapes</h2>
<p>${version} allows you to add markers, lines and polygons to a map.  Either right-click on the map background, or look for the 
<span style="color: green; font-weight: bold">+ Add New Object</span> menu in the leftbar.</p>

<p><b>Markers</b> are GPS waypoints combined with an image icon.  You can choose from a set of existing images, supply your own custom URL or enter an RGB 
<a href="http://www.w3schools.com/tags/ref_colorpicker.asp">hexidecimal color code</a>.  When you first create a marker it will be placed in either the center of the screen,
or the location you right-clicked to bring up the context menu.  Clicking a marker's <img src="/static/images/edit.png"/> edit icon in the leftbar allows you to both
drag it to a new location and alter its label and icon.</p>

<p>Unlike GPS units, ${version} doesn't differentiate between routes and tracks.  Instead it provides two kinds of shapes: <b>lines</b>, which are essentially stylized routes, and 
<b>polygons</b>.  When creating a shape, the following actions are available:
<table id="table_draw" style="border: none; margin-bottom: 1em" cellspacing="0">
<tr><td>click</td><td>add a new point</td></tr>
<tr><td style="padding-right: 10px">shift-mousedown</td><td>add freehand points (line follows the cursor in a smooth fasion)</td></tr>
<tr><td>double click</td><td>finish</td></tr>
<tr><td>escape</td><td>undo</td></tr>
</table>
When editing an existing shape, circular drag handles are placed at each vertex and midway along each segment.  Use these to modify vertex locations or add new vertices; right-clicking
on a drag handle allows you to delete an existing vertex.
</p>
</div>

<div id="saving">
<h2>Saving and Sharing</h2>
<p>There are a number of ways to save your data and share it with others.</p>
<table id="table_maptypes" style="border: 0" cellspacing="0">
<tr><td style="width: 15%">Plain Map</td><td>Maps without any shapes or markers can be shared or bookmarked as a self-contained URL.  ${version} will automatically update the map viewer's URL for you; it will look something like <i>/map.html#37.743,-119.578&z=14&b=t</i>.
  If this is turned off, look for the <span style="font-weight: bold"><img src="/static/images/sharing.png" style="vertical-align: text-top; margin-right: 2px"/>Share</span> link in the leftbar.</td></tr>
<tr><td>Unsaved Map</td><td>Once you've added data, the URL alone doesn't suffice: you'll need to save it.  There are three ways to do this, listed below.  All start with the
<span style="font-weight: bold; color: red"><img src="/static/images/save.png" style="vertical-align: text-top; margin-right: 2px"/>Save</span> link.</td></tr>
<tr><td>Saved to Your Account</td><td>Once you save a map to your Yahoo or Google account, all future changes will be automatically synced to ${version} - no need to hit save before closing your browser.  Using an existing
account means one less password to remember; ${version} does not gain any access to your Yahoo/Google account.  Once saved, you can limit access and provide a password for friends to make edits through the <span style="font-weight: bold"><img src="/static/images/sharing.png" style="vertical-align: text-top; margin-right: 2px"/>Share</span> link.</td></tr>
<tr><td>One Off Map</td><td>A one-off map lets you save data without logging in, and post a permanent link on a forum without cluttering your account.  You can enter a password for write access, or if you're already logged in when the map is saved,
your account will continue to be able to make edits.</td></tr>
<tr><td>Browser Map</td><td>You can also save maps directly to your browser; because these are not backed up to ${version}, you can't share them with anyone.  However, when used alongside cached maps from ${version} To Go,
they allow you to make edits offline, in places without internet access.</td></tr>
</table>
</div>

<div id="export">
<h2>Importing and Exporting</h2>
<p>${version} can transfer data to and from GPX files, KML files and Garmin GPSs.  Because not everything provided by ${version} is supported by these formats (and vice versa), some things
may get lost in translation.  GPS routes and tracks will both become lines.  Advanced KML features like superoverlays and multi-ring polygons will be ignored.  When exported to a GPX file,
polygons will become simple lines.</p>
<p>To transfer data, simply look for the <span style="font-weight: bold"><img src="/static/images/up.png" style="vertical-align: text-top; margin-right: 2px">Import</span> and <span style="font-weight: bold"><img src="/static/images/down.png" style="vertical-align: text-top; margin-right: 2px">Export</span> links
near the top of the leftbar.  GPX and KML work through simple file transfer; in order to communicate directly with a Garmin GPS, you'll need to install their 
<a href="http://software.garmin.com/en-US/gcp.html">Communicator browser plug-in</a>.</p>
<p>Although GPX files don't speak colors and icons, ${version} stores that information in the GPX file's metadata and can read it on import.  If you want to copy markers or shapes from one map
to another, export them to GPX and then re-import them into the new map.  Line weight, color, icons and polygonality will all be preserved.</p>
</div>

<div id="print">
<h2>Printing</h2>
<p>There are two ways to get your maps onto paper: printing through the browser, and using ${version}'s PDF generator.  The PDF generator produces high-resolution, exact-scale maps, and makes it easy to produce multi-page
map packs.  Unfortunately we can only use it to print maps under ${version}'s control, so it doesn't work with Google's maps and a few other layers.  For all printing options, look for the 
<span><b><img src="/static/images/print.png" style="vertical-align: text-top; margin-right: 2px"/>Print</b></span> icon in the top right.</p>

<p>The PDF generator produces maps with more than twice the resolution of browser printing.  That means it needs 4 times as many map tiles, and downloading all those tiles can take a while.  Please be patient,
it really is working hard.</p>
</div>

<div id="ge">
<h2>Google Earth Integration</h2>

<div style="float: left; padding-right: 20px; width: 200px; height: 240px">
<a href="http://caltopo.blogspot.com/2012/04/exporting-map-tiles-to-google-earth.html"><img style="width:200px; height: 200px" src="http://s3-us-west-1.amazonaws.com/caltopo/web/ct-ge.jpg"/></a>
</div>
<div>
<p>Pull ${version} maps into Google Earth!  Look for the <span><img src="/static/images/kml64.png" style="width: 14px; height: 14px">KML</span> link in the left bar.</p>

<p><b>Superoverlays</b> give you nationwide coverage from a single file.  As you fly around, Earth pulls additional superoverlay files from ${version} as needed.  Due to the number of tile requests this can generate, only single
layers are supported.  Try it out with <a href="/resource/superoverlay/t/1-0-0.kml">USGS Topos</a> and <a href="/resource/superoverlay/t/1-0-0.kml">Forest Service Maps</a>.</p>

<p><b>KML</b> and <b>KMZ</b> files only cover a limited area, but you can combine layers ${version} style.  Pick a zoom level, drag the rectangle onto the area you want to cover, hit download and grab a beer - that
was some hard work!</p>
</div>
</div>

<div id="offline" style="clear: both">
<h2>Offline Access</h2>
<p>You can take maps with you for offline, internet-free use with ${version} To Go.  This service pre-saves map layers to your browser using <i>HTML5 Application Caching</i> so that they're ready to go when you hit 
the road.  Start by visiting the <a href="/togo" target="_blank">To Go page, choose the layers and geographic area you want coverage for, and then click 'Take This To Go'</a>.  Make sure to 
copy maps from your account to your browser for full on-the-road editing capabilities.</p>
</div>

<!-- DEM shading, viewshed analysis  -->
<!-- View from here -->

<script>
org.sarsoft.Loader.queue(function() {
	$('#table_draw').css('border', '1px solid black').find('td').css({'border-width': '0 1px 1px 0', 'border-style': 'solid', 'border-color': '#888888', 'padding': '3px'});
	$('#table_maptypes').css('border', '1px solid black').find('td').css({'border-width': '0 1px 1px 0', 'border-style': 'solid', 'border-color': '#888888', 'padding': '3px'});
});
</script>