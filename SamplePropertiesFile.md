This is an example sarsoft.properties file.  For more information, see the [Installation](Installation.md) page.

```
log4j.appender.console=org.apache.log4j.ConsoleAppender
log4j.appender.console.layout=org.apache.log4j.SimpleLayout
log4j.rootLogger=WARN,console
sarsoft.map.datum=WGS84
#sarsoft.location.aprs.is.enabled=true
#sarsoft.location.aprs.is.user=YOUR_CALLSIGN
#sarsoft.location.aprs.local.enabled=true
sarsoft.location.aprs.local.timeToIdle=4800000
sarsoft.map.viewer=local
sarsoft.map.tileCacheEnabled=false
sarsoft.map.overzoom.enabled=true
sarsoft.map.overzoom.level=21

sarsoft.map.default.zoom=5
sarsoft.map.default.lat=38.5
sarsoft.map.default.lng=-120.5

sarsoft.map.backgrounds=t,f,r,12,usi,oc,c,usf
sarsoft.map.samples=Plain Topo Map:b=t;Shaded Relief Topo:b=t&n=0.25&o=r;<i>US Topo</i> Aerial Maps:b=usi&a=usf;Topo/Aerial Hybrid:b=t&n=0.5&o=usi;Contoured Satellite:b=usi&n=0.3&o=r&a=c
```