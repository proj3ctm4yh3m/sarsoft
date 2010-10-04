<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn" %>
<%@page import="org.sarsoft.ops.model.Resource"%>

<h2>Resource ${resource.name}: ${period.description}</h2>

<c:choose>
<c:when test="${resource.assignment ne null}">
This resource is attached to <a href="/app/assignment/${resource.assignment.id}">assignment ${resource.assignment.id}</a>.  Please visit the assignment page to change its section.
</c:when>
<c:otherwise>
 <c:choose>
 <c:when test="${resource.section ne null}">
 This resource is in the ${resource.section} section.  It is not attached to an assignment.
 </c:when>
 <c:otherwise>
 This resource is not currently part of the search.
 </c:otherwise>
 </c:choose>
 <ul>
<li>Change Section:
	 <select name="resourceSection" id="resourceSection" value="${resource.section}">
	  <c:forEach var="type" items="<%= Resource.Section.values() %>">
	   <option value="${type}"<c:if test="${resource.section == type}"> selected="selected"</c:if>>${type}</option>
	  </c:forEach>
	 </select>
<button onclick="window.location='/app/resource/${resource.id}/move?section=' + document.getElementById('resourceSection').options[document.getElementById('resourceSection').selectedIndex].value">GO</button>
</li>
<li>
Or, <a href="/app/resource/${resource.id}/move?section=">Remove this resource from the search</a>.
</li>
</ul>
</c:otherwise>
</c:choose>

<br/><br/>

<div id="tabs" class="yui-navset">
	<ul class="yui-nav">
		<li class="selected"><a href="#map"><em>Current Position</em></a></li>
		<li><a href="#locators"><em>Locators</em></a></li>
	</ul>

<div class="yui-content">

<div id="map">
 <div style="position: relative">
  <div id="mapview" style="width: 500px; height: 450px; float: left;">
  </div>
  <div id="mapdetails" style="width: 400px; margin-left: 20px; float: left">
   Last updated at ${resource.plk.time} GMT:<br/>
<pre>
${resource.plk.formattedUTM}
</pre>
  </div>
 </div>
</div>

<div id="locators">
<c:if test="${fn:length(resource.locators) gt 0}">
<h4>Existing Locators</h4>
<c:forEach var="locator" items="${resource.locators}">
${locator.description} &nbsp;&nbsp; <a href="/app/resource/${resource.id}/locator/${locator.pk}/detach#locators">Remove</a><br/>
</c:forEach>
<br/>
</c:if>

<h4>Add a Locator</h4>
<a href="javascript:window.location='/app/latitude/${resource.id}/new'">Add a Google Latitude Device</a><br/>
Callsign: <input type="text" name="aprs_callsign" id="aprs_callsign" size="10"/>
<a href="javascript:window.location='/app/aprs/${resource.id}/new?callsign=' + document.getElementById('aprs_callsign').value + '#locators'">Add an APRS Device from aprs.fi</a><br/><br/>
</div>
</div>

<script>
org.sarsoft.Loader.queue(function() {
  var tabView = new YAHOO.widget.TabView('tabs');
  var url = location.href.split('#');
  if(url[1] == "locators") tabView.set('activeIndex', 1);
  rvmc = new org.sarsoft.controller.ResourceViewMapController(document.getElementById('mapview'), ${resource.id});
});
</script>