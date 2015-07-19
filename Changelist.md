# Version 13.10 #

Beginning October 2013, Sarsoft will move to a year-month versioning system.  As development increasingly focused on caltopo.com and sartopo.com, maintaining major-minor versions proved to be too much work and caused a growing rift between the last major release of Sarsoft and the currently deployed versions.

The most prominent change between 0.9 and 13.10 is that numerous SAR-related pages have been removed and streamlined into a single, map-focused UI.  This makes the SAR interface a direct extension of the non-SAR UI available on CalTopo, and should make moving between the two systems more intuitive.

Starting with 13.10, releases will be more frequent, backwards compatibility will be guaranteed and old versions will not be maintained - bugfixes will be supplied by upgrading to the latest version.

# Version 0.9 #
## Major changes for 0.9 ##
  * Added left nav bar to map pages

## Minor changes for 0.9 ##
  * New map layer control
  * Client (browser)-side image georeferencing
  * Elevation profiles
  * Performance improvements when loading large numbers of track waypoints

## Migration Instructions for 0.9 ##
No data migration is required when moving from 0.8 to 0.9, however, you should back any searches up to .gpx just in case.

# Version 0.8 #
## Major changes for 0.8 ##
  * Overhauled the non-map UI
  * Added a Tools page for datum and unit conversion
  * Added map guides

## Minor changes for 0.8 ##
  * Able to serve zipped map tiles
  * Freehand draw is now only option for shape/assignment creation
  * Added measurement tool to map view

## Migration Instructions for 0.8 ##
No data migration is required when moving from 0.7 to 0.8, however, you should back any searches up to .gpx just in case.

# Version 0.7 #
## Major changes for 0.7 ##
  * Added map markup (icons, lines, polygons)
  * Standalone maps that aren't tied to a search
  * Able to run under Tomcat

## Minor changes for 0.7 ##
  * Added freehand drawing option
  * Customizable UTM grid, displaying Lat/Long tickmarks in addition to UTM
  * Using saved map settings for assignment printing
  * Added magnetic declination indicator
  * Datum switcher persists the search's datum

## Migration instructions for 0.7 ##
The standalone map option required reworking the database structure and Hibernate is unable to automatically migrate old tables.  You must back up existing searches to .GPX files, wipe the database and any temporary application data, and then re-import searches to 0.7.  For a stock install, this involves deleting the .sarsoft directory and Winstone's temporary working directory, which is logged to the console on startup (look for "set web app root system property: 'webapp.root' = ").

# Version 0.6 #

## Major changes for 0.6 ##
  * Major overhaul of map UI to move functionality out of the right-click menu and onto the screen
  * Added support for clue logging and mapping.
  * New find widget allows map to center on UTM, Lat/Long, text location, assignment or resource.

## Minor changes for 0.6 ##
  * Support for compressed and Mic-E APRS position reports
  * Real-time updates to resource and callsign lists
  * Integrated resources into the main map page, eliminated resource map page
  * Support for bulk printing of Google map layers
  * Able to specify LKP when search is created
  * Improving the set of actions available on the assignment detail page based on assignment state.

## Migration instructions for 0.6 ##
No data migration is required when moving from 0.5 to 0.6, however, you should back any searches up to .gpx just in case.

# Version 0.5 #

## Major changes for 0.5 ##
  * Redid resource pages so that people and equipment could be imported/exported as CSV files.
  * Redid location tracking to use APRS tier2 servers & physically attached TNCs.
  * Routed all errors to log4j rather than console.
  * Support for NAD27 datum.
  * Added CP & PLS waypoints to search map.

## Minor changes for 0.5 ##
  * Download LKP, PLS and CP to GPS devices along with search assignment.
  * Auto print attached resources with SAR 104 forms.
  * Improved UTM gridline labels and gridline spacing for large maps.
  * Print tracks as a different color than assignment on debrief maps.
  * Standalone map page for viewing/printing a blank map without creating an assignment.

## Migration instructions for 0.5 ##
The resource / location tracking database tables were entirely rewritten, and Hibernate will get confused if 0.5 is run against the old table structure.  You can keep your old database (minus location information) by deleting these tables, but no official migration script will be provided.  It's recommended that you back up searches to .gpx, delete the database, and then reimport searches.