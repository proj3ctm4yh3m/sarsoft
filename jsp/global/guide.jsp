<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn" %>
<%@ taglib uri="http://tiles.apache.org/tags-tiles" prefix="tiles" %>

<div style="padding-top: 15px">

<div style="padding-bottom: 1em" class="noprint">
Show:<input type="checkbox" id="markercb" onchange="showhidemarkers()" style="padding-left: 1em" checked="checked" value="Markers"/>Markers <input type="checkbox" id="shapecb" onchange="showhideshapes()" checked="checked" value="Shapes" style="padding-left: 1em"/>Shapes
<div class="showMarkers">Show positions as: <select id="datumDropDown"><option value="WGS84">WGS84</option><option value="NAD27 CONUS">NAD27 CONUS</option></select></div>
</div>

<div style="padding-bottom: 1em" class="printonly">
<span style="font-size: 1.5em; color: #945e3b">${tenant.description} Guide</span><br/>
${tenant.comments}
</div>

<div class="showMarkers">

<div style="font-size: 1.5em; font-weight: bold">Markers</div>
<div class="printonly" style="font-size: smaller; font-style: italic">Positions shown using <span id="printDatum">WGS84</span> datum.</div>

<c:forEach var="marker" items="${markers}" varStatus="status">
<c:if test="${status.index % 2 eq 0}"><div style="clear: both"></div></c:if>
<div style="padding-top: 1em; float: left; width: 45%; min-height: 7em">
<div><img id="m${marker.id}" style="vertical-align: middle; padding-right: 0.5em"/><span style="font-weight: bold; color: #945e3b">${marker.label}</span></div>
<c:if test="${fn:length(marker.comments) gt 0}">
<div>
<table style="border: 0; padding-right: 1em">
<tbody><tr><td style="border-left: 1px solid #945e3b; padding-left: 1ex">${marker.htmlFriendlyComments}</td></tr></tbody>
</table>
</div>
</c:if>
<div id="mw${marker.id}">
</div>
</div>
</c:forEach>
</div>

<div class="showShapes">

<div style="font-size: 1.5em; font-weight: bold; width: 90%; float: left; padding-top: 1em">Shapes</div>
<c:forEach var="shape" items="${shapes}" varStatus="status">
<c:if test="${status.index % 2 eq 0}"><div style="clear: both"></div></c:if>
<div style="padding-top: 1em; float: left; width: 45%">
<div style="min-height: 1.2em">
<c:choose>
<c:when test="${shape.way.polygon}">
<div style="float: left; height: 0.6em; width: 1.5em; margin-right: 0.5em; border-top: ${shape.weight}px solid ${shape.color}; border-bottom: ${shape.weight}px solid ${shape.color}">
 <div style="width: 100%; height: 100%; background-color: ${shape.color}; filter: alpha(opacity=${shape.fill}); opacity: ${shape.fill/100}">
 </div>
</div>
</c:when>
<c:otherwise>
<div style="float: left; height: 0.5em; width: 1.5em; margin-right: 0.5em; border-bottom: ${shape.weight}px solid ${shape.color};"></div>
</c:otherwise>
</c:choose>

<span style="font-weight: bold; color: #945e3b">${shape.label}</span></div>
<c:if test="${fn:length(shape.comments) gt 0}">
<div style="clear: both; border-left: 1px solid #945e3b; padding-left: 1ex; padding-right: 1em">
${shape.htmlFriendlyComments}
</div>
</c:if>
<div style="clear: both">
<c:choose><c:when test="${shape.way.polygon}">Area:</c:when><c:otherwise>Length:</c:otherwise></c:choose> ${shape.formattedSize}
</div>

</div>
</c:forEach>
</div>

</div>

<script>

<c:forEach var="marker" items="${markers}">
$('#m${marker.id}').attr('src', org.sarsoft.controller.MarkupMapController.getRealURLForMarker('${marker.url}'));
</c:forEach>

function showhidemarkers() {
	var show = $('#markercb').prop('checked');
	$('.showMarkers').css("display", show ? "block" : "none");
}

function showhideshapes() {
	var show = $('#shapecb').prop('checked');
	$('.showShapes').css("display", show ? "block" : "none");
}

<c:choose>
<c:when test="${fn:length(tenant.datum) gt 0}">
var datum = '${tenant.datum}';
</c:when>
<c:otherwise>
var datum = org.sarsoft.map.datum;
</c:otherwise>
</c:choose>

org.sarsoft.map.datum = datum;
GeoUtil.datum = org.sarsoft.map.datums[org.sarsoft.map.datum];

$('#datumDropDown').val(datum);
$('#datumDropDown').change(function() { org.sarsoft.map.datum = $('#datumDropDown').val(); $('#printDatum').html(org.sarsoft.map.datum); GeoUtil.datum = org.sarsoft.map.datums[org.sarsoft.map.datum]; handleNewDatum()});

function handleNewDatum() {
<c:forEach var="marker" items="${markers}">

var ll = new GLatLng(${marker.position.lat}, ${marker.position.lng});
var datumll = GeoUtil.fromWGS84(ll);
var utm = GeoUtil.GLatLngToUTM(datumll);

var message = '<table border="0"><tbody><tr><td>UTM</td><td colspan="2">' + utm.toHTMLString() + "</td></tr>";
message = message + '<tr><td>DD</td><td>' + GeoUtil.formatDD(datumll.lat()) + '</td><td style="padding-right: 0.5em">' + GeoUtil.formatDD(datumll.lng()) + "</td></tr>";
message = message + '<tr><td style="padding-right: 0.5em">DDMMHH</td><td style="padding-right: 0.5em">' + GeoUtil.formatDDMMHH(datumll.lat()) + "</td><td>" + GeoUtil.formatDDMMHH(datumll.lng()) + "</td></tr></tbody></table>";

$('#mw${marker.id}').html(message);
</c:forEach>
}

handleNewDatum();
</script>