In order to use Sarsoft in the field, it's important to have map data stored locally, so that you can access it anywhere.  These instructions will also allow you to create maps you may not be able to find elsewhere, like converting trail shapefiles into a map layer.

# Installation #

Install the [GDAL](http://trac.osgeo.org/gdal/wiki/DownloadingGdalBinaries) library and, if you wish to work with shapefiles, [Mapnik](http://mapnik.org/download/).  Also make sure [Python](http://www.python.org/download/) is installed on your system.

# Understanding Map Backgrounds #

Google Maps takes a spherical mercator projection of the world and breaks it up into 256x256 pixel tiles.  The first zoom level fits the world onto a single tile, the next onto a 2x2 grid, then a 4x4 grid, etc.  Because the spherical mercator projection exaggerates distances at the poles, the map's scale will vary depending on latitude for a given zoom level.

Your goal is to take map data that exists in other formats (e.g. scanned USGS topos or shapefiles) and create a bunch of 256x256 pixel tiles that Google Maps and OpenLayers know how to display.  The way the big boys do this is to load all the data into a GIS server and then create tiles on the fly.  In keeping with Sarsoft's design goal of simple deployment, this document shows you how to create the tiles in advance so that Sarsoft can serve them up.

The first two steps are to get your hands on digital map data and align it with coordinates on the planet.  USGS topos are public domain, and the UDSA also produces free aerial imagery of the US as part of the the National Agriculture Imagery Program (NAIP).  NAIP data should be available from your state government; there is no official free source for digital topo data but there are a number of governments and organizations which provide scans.  Including the keyword DRG (for digital raster graphic) may help cut through irrelevant web search results.  Libremap.org has topos for all 50 states, but you'll need to trim the margins if you want to combine multiple quads together into a seamless background.

As you manipulate map data, you'll have to be aware of which spatial reference system (SRS) you're using.  GDAL can't work with coordinates unless it knows which SRS they're on, and it can't project the 3D world onto a 2D map without knowing which projection to use.  spatialreference.org is a good resource for translating between the various srs descriptions (epsg code, proj4, etc).

# Raster Images #

## Georeferencing ##
If you're lucky, your map data will come as either a MrSID or GeoTIFF file which has already been aligned with real-world coordinates.  If not, you'll have to pick several points on the map, find their real-world coordinates, and convert your ordinary image into a GeoTIFF.  Assuming your real-world coordinates are in WGS84, you would take four x,y pixel coordinates that are mapped to a lat/lng and georeference the image by running:

```
gdal_translate -a_srs EPSG:4326 -gcp x1 y1 lat1 lng1 -gcp x2 y2 lat2 lng2 -gcp x3 y3 lat3 lng3 -gcp x4 y5 lat5 lng4 -of GTiff your_file.ext map.tif
```

## Building a VRT ##
Once all your files are georeferenced, you have to turn them into one large file that the tiling program understands.  The fastest way to do this is to create a VRT, which simply points to the source files rather than copying all their data.

A TIFF file can either store RGB data for each pixel, or pick a set of colors that best represent the image, store those colors in a _color table_, and then store a lookup into the color table for each pixel.  The color table approach yields smaller, but potentially lower quality, files; you can tell which approach an image is using by running

```
gdalinfo map.tif
```

and seeing whether it gives you colorband data or lists all the entries in the color table.  If the image uses a color table, you'll need to convert it to RGB by running

```
gdal_translate -of vrt -expand rgb map.tif map-rgb.vrt
```

Before you can build the main VRT, you'll need to make sure that all image files are using the same SRS, which _gdalinfo_ also gives you.  If they aren't, pick one - it doesn't really matter which.  Take the SRS information from _gdalinfo_ and save it in a file named map.prj.  It should look something like this:

```
PROJCS["NAD83 / UTM zone 11N",
    GEOGCS["NAD83",
        DATUM["North_American_Datum_1983",
            SPHEROID["GRS 1980",6378137,298.2572221010002,
                AUTHORITY["EPSG","7019"]],
            AUTHORITY["EPSG","6269"]],
        PRIMEM["Greenwich",0],
        UNIT["degree",0.0174532925199433],
        AUTHORITY["EPSG","4269"]],
    PROJECTION["Transverse_Mercator"],
    PARAMETER["latitude_of_origin",0],
    PARAMETER["central_meridian",-117],
    PARAMETER["scale_factor",0.9996],
    PARAMETER["false_easting",500000],
    PARAMETER["false_northing",0],
    UNIT["metre",1,
        AUTHORITY["EPSG","9001"]],
    AUTHORITY["EPSG","26911"]]
```

You can then convert the original images or RGB VRTs from above to match this SRS:

```
gdalwarp -t_srs map.prj -of VRT map.tif map11n.vrt
```

Finally, you're ready to create one big file for all your map data.

```
gdalbuildvrt -srcnodata 0 merged.vrt map1.vrt map2.vrt . . .
```

The srcnodata flag allows you to build a VRT from overlapping files without having a dead zone in one file overwrite data you want from another.  As an example, the scanned USGS topos available from atlas.ca.gov are rotated slightly, with white margins.  If you don't specify -srcnodata 255, the white margin from one image will overwrite topo data from another.  Refer to the GDAL documentation for more information on allowable values.

Gdalbuildvrt is very particular about the inputs it accepts.  If you convert one source TIFF or MrSID file to VRT, you may need to convert them all to VRT so that they have the same number and type of color bands.  I've also had to rename my .sid files with a .ro extension before gdalbuildvrt would read them.

## Creating Tiles ##

In order to create map tiles, you need to customize the gdal2tiles python script that comes with GDAL.  Gdal2tiles assumes that the Y axis for tiles is zeroed to the South end of the map, while Google assumes that 0 is at the North end of the map.

At line 1186 (your version may vary slightly), change

```
tilefilename = os.path.join(self.output, str(tz), str(tx), "%s.%s" % (ty, self.tileext))
```

to

```
tilefilename = os.path.join(self.output, str(tz), str(tx), "%s.%s" % ((2**tz - 1) - ty, self.tileext))
```

to fix the base (most zoomed-in) level of tiles, and make the same change at lines 1329 and 1373 (using tz+1) to fix tile numbering scheme when zoomed out.

You should also modify the code that generates map viewers to reflect this numbering change.  For Google Maps, change line 1864 from

```
return zoom+"/"+tile.x+"/"+y+".png";
```

to

```
return zoom+"/"+tile.x+"/"+tile.y+".png";
```

Higher zoom levels are created by merging tiles from the base zoom level together and ignoring the source image data, so if you're working with a large dataset, it can be helpful to chunk up the work and only create the overview layers when the base layer is complete.  You can toggle this by commenting out the calls to self.generate\_base\_tiles and self.generate\_overview\_tiles starting at line 478.

Once you've modified, gdal2tiles, create tiles in a directory named tiledir:

```
gdal2tiles.py --resume merged.vrt tiledir
```

If your original map files are in the MrSID format, GDAL will be way slow unless you tell it to cache map data:

```
gdal2tiles.py --resume --config GDAL_FORCE_CACHING YES merged.vrt tiledir
```

That's it!  Grab a beer, this might take a while.

# Shapefiles #

The Mapnik toolkit is capable of taking a shapefile and rendering it out as a map image.  The actual Mapnik code is a native binary, and although you can use plain-text configuration files to generate a large map, the easiest way to create individual background tiles is using a Python script.

## Shapefile Metadata ##

Your shapefile should be packaged as a set of files with the same name and different extensions.  At a minimum, you need the .dbf, .prj, .shp and .shx files for Mapnik to work.

The .prj file should be plain text; use the data in it and spatialreference.org to get the proj4 description.  It should look something like the following, which is for NAD27 UTM zone 10:

```
+proj=utm +zone=10 +ellps=clrk66 +datum=NAD27 +units=m +no_defs
```

You should also find out which data fields are available in the shapefile.  The most direct way to do this is with a shapefile viewer, but you can also do this by converting the shapefile to something human-readable or viewable with commonly used software.  For example, you can convert the shapefile to KML by running

```
ogr2ogr -f KML trails.kml trails.shp
```

and then opening it in Google Earth.

## Configuring the Mapnik map ##

Armed with the metadata from above, you can create and style a new map in Python.  First, create a new Mapnik map that matches Google Maps' Shperical Mercator projection.  We'll also set the background to fully transparent so that Sarsoft can overlay it without obscuring a background layer, and create a style object:

```
m = mapnik.Map(1024, 1024, "+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext  +no_defs")
m.background = mapnik.Color('rgba(255,255,255,0)')
s = mapnik.Style()
```

Next, create rules for each trail class in the shapefile.  In this example, we'll draw shapes with VEHICLE\_ACCESS=Y as 2px wide fire roads.  We're also assuming that trail names are captured in the shapefile's TRAIL\_NAME field.

```
r = mapnik.Rule()
# 2px wide fire road
r.symbols.append(mapnik.LineSymbolizer(mapnik.Color('#CC0000'),2))
# Label the road
t = mapnik.TextSymbolizer('TRAIL_NAME', 'DejaVu Sans Book', 10, mapnik.Color('black'))
t.halo_fill = mapnik.Color('white')
t.halo_radius=1
t.label_placement = mapnik.label_placement.LINE_PLACEMENT
r.symbols.append(t)
r.filter = mapnik.Filter("[VEHICLE_ACCESS]='Y'")
s.rules.append(r)
```

We need a default style to fall back on when VEHICLE\_ACCESS isn't Y.  In this case, we're drawing non-vehicle-accessible trails as dashed lines.  Note the use of set\_else to designate this is a fallback rule in case no other rules have matched:

```
r2 = mapnik.Rule()
l = mapnik.LineSymbolizer(mapnik.Color('#CC0000'),2)
stroke = mapnik.Stroke()
stroke.color = mapnik.Color('#CC0000')
stroke.width=2
stroke.add_dash(4, 2)
l.stroke = stroke;
print l.stroke.get_dashes()
r2.symbols.append(l)
t = mapnik.TextSymbolizer('TRAIL_NAME', 'DejaVu Sans Book', 10, mapnik.Color('black'))
t.halo_fill = mapnik.Color('white')
t.halo_radius=1
t.label_placement = mapnik.label_placement.LINE_PLACEMENT
r2.symbols.append(t)
r2.set_else(True)
s.rules.append(r2)
```

Add the style _s_ to the map:

```
m.append_style("My Style", s)
```

Now it's time to load the shapefile.  Note that the string beginning "+proj=utm . . ." should be replaced with the proj4 representation of your shapefile's projection that you determined in the _Shapefile Metadata_ step.  Also the trails.shp file is specified without its extension:

```
lyr = mapnik.Layer("shapes", "+proj=utm +zone=10 +ellps=clrk66 +datum=NAD27 +units=m +no_defs")
lyr.datasource = mapnik.Shapefile(file="trails")
lyr.styles.append("Test Style")
m.layers.append(lyr)
```

At this point you could render the map out directly to a file, but we want to create map background tiles.  The rest is liberally copied from http://svn.openstreetmap.org/applications/rendering/mapnik/generate_tiles.py, but adapted to drop some of the configuration and run on a one-off basis.  To begin with, scroll back up to the top of your python script and cut+paste the following:

```
import mapnik
from math import pi,cos,sin,log,exp,atan
import sys, os

DEG_TO_RAD = pi/180
RAD_TO_DEG = 180/pi

def minmax (a,b,c):
    a = max(a,b)
    a = min(a,c)
    return a

class GoogleProjection:
    def __init__(self,levels=18):
        self.Bc = []
        self.Cc = []
        self.zc = []
        self.Ac = []
        c = 256
        for d in range(0,levels):
            e = c/2;
            self.Bc.append(c/360.0)
            self.Cc.append(c/(2 * pi))
            self.zc.append((e,e))
            self.Ac.append(c)
            c *= 2
                
    def fromLLtoPixel(self,ll,zoom):
         d = self.zc[zoom]
         e = round(d[0] + ll[0] * self.Bc[zoom])
         f = minmax(sin(DEG_TO_RAD * ll[1]),-0.9999,0.9999)
         g = round(d[1] + 0.5*log((1+f)/(1-f))*-self.Cc[zoom])
         return (e,g)
     
    def fromPixelToLL(self,px,zoom):
         e = self.zc[zoom]
         f = (px[0] - e[0])/self.Bc[zoom]
         g = (px[1] - e[1])/-self.Cc[zoom]
         h = RAD_TO_DEG * ( 2 * atan(exp(g)) - 0.5 * pi)
         return (f,h)

def render_tile(tile_uri, x, y, z):
    #print tile_uri,":",z,x,y
    # Calculate pixel positions of bottom-left & top-right
    p0 = (x * 256, (y + 1) * 256)
    p1 = ((x + 1) * 256, y * 256)

    # Convert to LatLong (EPSG:4326)
    l0 = tileproj.fromPixelToLL(p0, z);
    l1 = tileproj.fromPixelToLL(p1, z);

    # Convert to map projection (e.g. mercator co-ords EPSG:900913)
    c0 = prj.forward(mapnik.Coord(l0[0],l0[1]))
    c1 = prj.forward(mapnik.Coord(l1[0],l1[1]))

    bb = mapnik.Envelope(c0.x,c0.y, c1.x,c1.y)
    render_size = 256
    m.resize(render_size, render_size)
    m.zoom_to_box(bb)
    m.buffer_size = 128

    # Render image with default Agg renderer
    im = mapnik.Image(render_size, render_size)
    mapnik.render(m, im)
    im.save(tile_uri, 'png256')

def render_tiles(bbox, shapefile, tile_dir, minZoom=1,maxZoom=18):

    if not os.path.isdir(tile_dir):
         os.mkdir(tile_dir)

    gprj = GoogleProjection(maxZoom+1) 

    ll0 = (bbox[0],bbox[3])
    ll1 = (bbox[2],bbox[1])
    
    for z in range(minZoom,maxZoom + 1):
        px0 = gprj.fromLLtoPixel(ll0,z)
        px1 = gprj.fromLLtoPixel(ll1,z)

        # check if we have directories in place
        zoom = "%s" % z
        if not os.path.isdir(tile_dir + zoom):
            os.mkdir(tile_dir + zoom)
        for x in range(int(px0[0]/256.0),int(px1[0]/256.0)+1):
            # Validate x co-ordinate
            if (x < 0) or (x >= 2**z):
                continue
            # check if we have directories in place
            str_x = "%s" % x
            if not os.path.isdir(tile_dir + zoom + '/' + str_x):
                os.mkdir(tile_dir + zoom + '/' + str_x)
            for y in range(int(px0[1]/256.0),int(px1[1]/256.0)+1):
                # Validate x co-ordinate
                if (y < 0) or (y >= 2**z):
                    continue
                str_y = "%s" % y
                tile_uri = tile_dir + zoom + '/' + str_x + '/' + str_y + '.png'
                # Submit tile to be rendered into the queue
                render_tile(tile_uri, x, y, z)
```

Now, a few final configuration steps, and then you can print the map out to a large trails.png image and a set of tiles:

```
prj = mapnik.Projection(m.srs)
tileproj = GoogleProjection()

# Replace these Lat/Long coordinates with the bounding box of your shapefile
bbox = (-122.5, 37.25,-122.2,37.65)
m.zoom_to_box(mapnik.Envelope(-122.5, 37,-122,37.65))
mapnik.render_to_file(m, "trails.png", "png")

render_tiles(bbox, "trails", "tiledir/", minZoom=10,maxZoom=16)
```