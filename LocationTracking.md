# Location Tracking #

Sarsoft allows you to track peoples' locations using:

  * SPOT beacons with the $50/year "track progress" service.
  * Cached APRS positions from aprs.fi
  * Real-time APRS data over the internet.
  * Real-time APRS transmissions over the radio.

All location tracking is off by default and must be enabled through properties files.  Please read this section carefully before enabling the tracking services, as misconfiguring them can result in performance issues or excessive traffic to the SPOT & APRS servers.

## When Sarsoft Tracks Locations ##

Every time you visit a select group of pages pages (the homepage being one of them), Sarsoft will turn on location tracking for that search, or if tracking is already enabled, reset a timer.  If no more requests come in before the timer runs out, location tracking will be temporarily halted.  You can set this timeout on a per-service basis by specifying a time in milliseconds:

```
sarsoft.location.spot.timeToIdle=300000
```

The default is 5 minutes for SPOT, 10 minutes for APRS-IS and 20 minutes for APRS traffic over the local airwaves.  Note that because SPOT data is polled rather than pushed, you won't miss any position updates by having it temporarily time out.

## Debugging ##

The "location tracking" link in the Ops section of the homepage will show you the status of SPOT and APRS location checks, including the last APRS traffic received.  If something isn't right - a dropped connection to the APRS server, your local TNC not found, etc. - you can restart the process by clicking "Force Reset" on this page.

Setting the log level for org.sarsoft.ops.service.location to DEBUG will give you a blow-by-blow account of APRS communications.

## SPOT ##

When SPOT beacon tracking is enabled, a background thread gets created to track beacon positions.  Every 30 seconds this thread will loop through all resources with SPOT IDs, and for those resources which were last checked more than 2 minutes ago, query SPOT's server for their latest position.  These threads are started on a **per-search** basis and each beacon gets a different request, so if you have two searches currently active and each have the same two beacons, you'll wind up with 4 requests to SPOT's servers every 2 minutes.  You can enable spot and optionally change the 2-minute refresh interval using:

```
sarsoft.location.spot.enabled=true
sarsoft.location.spot.refreshInterval=120000
```

## APRS.FI ##

Sarsoft does not actively poll aprs.fi, but you can use it do a one-off check of all APRS locations.  This is useful when first loading resources into the system, so you don't have to wait for a transmission on the APRS network.  Sarsoft is preconfigured with an aprs.fi key, but if you plan on using this feature much, please register for your own and add it to the properties file:

```
sarsoft.location.aprs.fi.key=17392.5iMw1tOX90mZj747
```

## APRS-IS ##

All APRS traffic on 144.390 that makes it to an internet gateway gets routed to the APRS-IS network of servers.  When APRS-IS connections are enabled, Sarsoft will connect to a tier 2 server and set up a filter for the individual callsigns on a search plus any tranmission within 20km of the LKP.  The 20km radius allows you to see other teams that may not be entered into Sarsoft, and also prevents the 512-byte filter limit from causing some resources not to get tracked.  To enable APRS-IS, you only need to set two properties:

```
sarsoft.location.aprs.is.enabled=true
sarsoft.location.aprs.is.user=your_amateur_callsign
```

You can optionally set the tier2 server, port and time to idle:

```
sarsoft.location.aprs.is.serverName=noam.aprs2.net
sarsoft.location.aprs.is.serverPort=14580
sarsoft.location.aprs.is.timeToIdle=600000
```

Note that as with SPOT, these connections are established on a per-search basis, so if you have two different searches open, you'll wind up with 2 connections to the APRS server.

## Local APRS Traffic ##

High-level web langauges and low-level device I/O tend not to mix well, so interfacing with a TNC may require some experimentation.  The large variety of equipment also complicates my testing efforts, so feedback and bug reports are appreciated.  I'm happy to add more devices to Sarsoft's default configuration based on what people are using in the field.

Ultimately, Sarsoft requires you to point it at a file handle that will pass it NMEA strings or plain-text TNC traffic like what goes over the APRS-IS network (i.e. **not** KISS mode raw binary packets).  Any APRS device capable of sending waypoints to a GPS over a serial link should suffice for the former; I've found the Argent Data OpenTracker USB to be a good fit for the latter as the USB interface saves you from having to manually configure serial port settings.

Enabling local APRS montoring is easy:

```
sarsoft.location.aprs.local.enabled=true
```

The hard part is deciding which files Sarsoft should check.  You can specify files by exact name (e.g. COM1), or by prefix (e.g. /dev/cu.usb`*`).  By default, Sarsoft will check Windows COM ports 1-12 and the Linux and Mac device locations for the OpenTracker USB:

```
sarsoft.location.aprs.local.deviceNames=COM1:,COM2:,COM3:,COM4:,COM5:,COM6:,COM7:,COM8:,COM9:,COM10:,COM11:,COM12:
sarsoft.location.aprs.local.deviceNamePrefixes=/dev/cu.usb,/dev/ttyACM
```

Note that the Linux/Mac locations are specified as simple prefixes; regular expressions aren't supported.

The downside to this shotgun approach is that because Sarsoft has no way of knowing what is hooked up where, it spawns a new thread for each matching file and waits for something to start talking.  It only spawns a new thread if it has read access to the file, so unused COM ports won't cause a backlog of stalled threads, but you might wind up with Sarsoft monopolizing the port and preventing some other application from using it.

Getting Sarsoft to work with your TNC on your machine might require using an external application to configure serial port settings and then adjusting the locations in which Sarsoft goes looking.

Only one thread gets spawned per device, and that thread then relays messages to per-search listener threads, so you can have multiple searches open within Sarsoft without one of them monopolizing the local APRS feed.  You can also attach more than one TNC, e.g. one listening on 144.390 and one listening for burst-after-voice transmissions on a tactical radio channel.