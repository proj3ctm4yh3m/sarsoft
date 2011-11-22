<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn" %>
<%@ taglib uri="http://tiles.apache.org/tags-tiles" prefix="tiles" %>

<c:if test="${message ne null}">
<div style="font-weight: bold; color: red">Error: ${message}</div>
</c:if>

<div style="padding-left: 11em; padding-right: 1em; padding-top: 15px;">

<div style="position: relative; float: left; width: 10em; margin-left: -11em; border-right: 1px solid #5a8ed7; height: 15em">
<div id="convertLink" class="lmenu"><span style="padding-right: 5px" id="newArrow">&#x25B8;</span><a href="javascript:setPane('convert')">Convert</a></div>
</div>

<div style="position: relative; float: left; width: 100%">

<div id="convertContent">
<div style="color: #5a8ed7; font-size: 1.5em; font-weight: bold; padding-bottom: 5px">Convert Coordinates</div>

<table style="border: 0">
<tr><td valign="top"><b>Convert From:</b></td><td><div id="coords"></div></td></tr>
<tr><td valign="top"><b>Datum Change?</b></td><td><select id="datumChange"><option value="None">None</option><option value="NAD27">WGS84 to NAD27</option><option value="WGS84">NAD27 to WGS84</option></select></td></tr>
</table>

<button onclick="doConvert()" style="margin-top: 10px">Convert</button>

<div style="padding-top: 20px">
<table>
<tr><td><b>UTM</b></td><td id="rutm"></td></tr>
<tr><td><b>Decimal Degrees</b></td><td id="rdd"></td></tr>
<tr><td><b>Degree Minutes</b></td><td id="rdmh"></td></tr>
</table>
</div>

</div>
</div>

</div>

<script>

panes = ["convert"];

function setPane(pane) {
	for(var i = 0; i < panes.length; i++) {
		$('#' + panes[i] + 'Arrow').css("visibility", "hidden");
		$('#' + panes[i] + 'Content').css("display", "none");
		$('#' + panes[i] + 'Link').css("color", "#333333");
	}

	$('#' + pane + 'Arrow').css("visibility", "visible");
	$('#' + pane + 'Content').css("display", "block");
	$('#' + pane + 'Link').css("color", "#945e3b");
}

function doConvert() {
	if(!locform.read(function(gll) {
		if($('#datumChange').val()=="NAD27") {
			gll = GeoUtil.convertDatum(gll, org.sarsoft.map.datums["WGS84"], org.sarsoft.map.datums["NAD27 CONUS"]);
		} else if($('#datumChange').val()=="WGS84") {
			gll = GeoUtil.convertDatum(gll, org.sarsoft.map.datums["NAD27 CONUS"], org.sarsoft.map.datums["WGS84"]);
		}
		$('#rutm').html(GeoUtil.GLatLngToUTM(gll).toHTMLString());
		$('#rdd').html(GeoUtil.formatDD(gll.lat()) + ", " + GeoUtil.formatDD(gll.lng()));
		$('#rdmh').html(GeoUtil.formatDDMMHH(gll.lat()) + ", " + GeoUtil.formatDDMMHH(gll.lng()));
	})) alert("unable to read location");
}

org.sarsoft.Loader.queue(function() {
	
	$('#srcType').change(function() {
		var type = $('#srcType').val();
		$('#srcUTM').css("display","none");
		$('#srcDD').css("display", "none");
		$('#src' + type).css("display", "inline");
	});

	locform = new org.sarsoft.LocationEntryForm();
	locform.create(document.getElementById('coords'));
	
	setPane('convert');
});

</script>

