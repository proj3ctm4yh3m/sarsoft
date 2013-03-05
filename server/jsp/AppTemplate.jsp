<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn" %>
<%@ taglib uri="http://tiles.apache.org/tags-tiles" prefix="tiles" %>
<html>
<head>
<title>${version}</title>
${head}
<script>
function toggleAcctDropdown() {
	if($('#acctinfo').css('visibility') == 'visible') {
		$('#acctinfo').css('visibility', 'hidden');
	} else {
		$('#acctinfo').css('visibility', 'visible');
	}
}
</script>
</head>
<body class="yui-skin-sam">

<tiles:importAttribute name="app"/>
<tiles:importAttribute name="subHeader"/>
<c:if test="${fn:length(subHeader) eq 0 and not empty tenant}">
<c:choose>
<c:when test="${tenant.class.name eq 'org.sarsoft.plans.model.Search'}">
 <c:set var="subHeader" value="searches"/>
</c:when>
<c:when test="${tenant.class.name eq 'org.sarsoft.markup.model.CollaborativeMap'}">
 <c:set var="subHeader" value="maps"/>
</c:when>
</c:choose>
</c:if>
<c:choose>
<c:when test="${not empty account or hosted eq false}"><c:set var="loggedin" value="${true}"/></c:when>
<c:otherwise><c:set var="loggedin" value="${false}"/></c:otherwise>
</c:choose>
<c:if test="${(subHeader eq 'maps' or subHeader eq 'Search') and loggedin eq false}"><c:set var="subHeader" value="splash"/></c:if>
<div class="header noprint" style="background-image: url(/static/images/header.jpg); background-repeat: repeat-x; border-bottom: 1px solid black;">
<div style="font-weight: bold; position: absolute; top: 0px; right: 20px"><span style="font-size: 200%">${version}</span></div>
<div style="padding-left: 1.5em"><div style="font-weight: bold; font-size: 200%"><c:if test="${fn:length(app) gt 0}"></c:if>&nbsp;</div></div>
</div>
	<div style="background: #f8f8f8; border-bottom: 1px solid 5a8ed7; height: 2em" class="noprint">
		<div style="position: absolute; right: 20px; padding-top: 0.5em; z-index: 1">
		<c:choose>
		<c:when test="${account ne null}">
			${account.email}&nbsp;<span style="cursor: pointer; font-weight: bold; color: red; position: relative" onclick="toggleAcctDropdown();">&darr;
				<div id="acctinfo" style="visibility: hidden; background: #f8f8f8; position: absolute; right: 0; top: 0.5em; padding-top: 1em; width: 10em; z-index: -1">
					<div style="color: black; font-weight: normal">
						<a style="float: right; clear: both" href="/app/logout">Logout</a>
					</div>
				</div>
			</span>
		</c:when>
		<c:when test="${hosted eq true}">
<!--		Sign in: <a href="/app/openidrequest?domain=google">Google</a>, <a href="/app/openidrequest?domain=yahoo">Yahoo</a> -->
		</c:when>
		</c:choose>
		</div>
	<c:choose>
		<c:when test="${subHeader eq 'splash'}">
			<div class="subheader active"><span><a href="/"><c:choose><c:when test="${fn:length(app) eq 0}">&#x25BE;</c:when><c:otherwise>&#x25B8;</c:otherwise></c:choose> Home</a></span></div>
		</c:when>
		<c:when test="${fn:length(app) eq 0}">
			<div class="subheader"><span><a href="/">Home</a></span></div>
		</c:when>
	</c:choose>
	<c:if test="${loggedin}">
	<c:choose>
		<c:when test="${subHeader eq 'maps'}">
			<div class="subheader active"><span><a href="/maps"><c:choose><c:when test="${fn:length(app) eq 0}">&#x25BE;</c:when><c:otherwise>&#x25B8;</c:otherwise></c:choose> Maps</a></span></div>
		</c:when>
		<c:when test="${fn:length(app) eq 0}">
			<div class="subheader"><span><a href="/maps">Maps</a></span></div>
		</c:when>
	</c:choose>
	<c:choose>
		<c:when test="${subHeader eq 'searches' and fn:length(app) eq 0}">
			<div class="subheader active"><span><a href="/searches">&#x25BE; Searches</a></span></div>
		</c:when>
		<c:when test="${subHeader eq 'searches' and app eq 'home'}">
			<div class="subheader active"><span><a href="/searches">&#x25B8; Searches</a></span></div>
		</c:when>
		<c:when test="${subHeader eq 'searches'}">
			<div class="subheader active" style="text-transform: capitalize"><span><a href="/search?id=${tenant.name}">&#x25B8; ${tenant.description}</a></span></div>
		</c:when>
		<c:when test="${fn:length(app) eq 0}">
			<div class="subheader"><span><a href="/searches">Searches</a></span></div>
		</c:when>
	</c:choose>
	</c:if>
	<c:if test="${fn:length(app) eq 0}">
		<c:choose>
		<c:when test="${subHeader eq 'tools'}">
			<div class="subheader active"><span><a href="/tools.html">&#x25BE; Tools</a></span></div>
		</c:when>
		<c:when test="${fn:length(app) eq 0}">
			<div class="subheader"><span><a href="/tools.html">Tools</a></span></div>
		</c:when>
		</c:choose>
	</c:if>

	<c:choose>
	 <c:when test="${app eq 'home'}">
	 <div class="subheader" style="text-transform: capitalize">
	  <span>&#x25B8;&#x25B8; ${tenant.description}</span>
	 </div>
	 </c:when>
	 <c:when test="${app eq 'guide'}">
	 <div class="subheader">
	  <span>&#x25B8;&#x25B8; Guide</span>
	 </div>
	 </c:when>
	</c:choose>
	<c:choose>
	 <c:when test="${assignment ne null}">
	  <div class="subheader"><span>&#x25B8; <a href="/op/${assignment.operationalPeriodId}">Plans</a></span></div>
	  <div class="subheader"><span>&#x25B8;&#x25B8; Assignment ${assignment.id}</span></div>
	 </c:when>
	 <c:when test="${resource ne null}">
	 	<div class="subheader"><span>&#x25B8; <a href="/resource">Resources</a></span></div>
	 	<div class="subheader"><span>&#x25B8;&#x25B8; ${resource.name}</span></div>
	 </c:when>
	 <c:when test="${clue ne null}">
	 	<div class="subheader"><span>&#x25B8; <a href="/clue">Clues</a></span></div>
	 	<div class="subheader"><span>&#x25B8;&#x25B8; Clue ${clue.id}</span></div>
	 </c:when>
	 <c:when test="${app eq 'setup-admin'}">
	  <c:if test="${subHeader eq 'searches'}"><div class="subheader"><span>&#x25B8; <a href="/setup">Setup</a></span></div></c:if>
	  <div class="subheader"><span>&#x25B8;&#x25B8; Admin</span></div>
	 </c:when>
	 <c:when test="${app eq 'setup-status'}">
	  <div class="subheader"><span>&#x25B8; <a href="/setup">Setup</a></span></div>
	  <div class="subheader"><span>&#x25B8;&#x25B8; Location Status</span></div>
	 </c:when>
	 <c:when test="${app eq 'setup-imagery'}">
	  <div class="subheader"><span>&#x25B8; <a href="/setup">Setup</a></span></div>
	  <div class="subheader"><span>&#x25B8;&#x25B8; Imagery</span></div>
	 </c:when>
	</c:choose>
	</div>
<div style="padding-left: 1.5em">
<tiles:insertAttribute name="content"/>
</div>
</body>
</html>