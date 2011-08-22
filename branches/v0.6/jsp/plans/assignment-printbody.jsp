<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn" %>
<%@ taglib uri="http://tiles.apache.org/tags-tiles" prefix="tiles" %>
<%@ taglib uri="http://java.sun.com/jsp/jstl/fmt" prefix="fmt" %>

<%@page import="org.sarsoft.plans.model.SearchAssignment"%>

<c:forEach var="copy" items='<%= new String[][] {{"White Copy - Team", "#DDDDDD"}, {"Yellow Copy - Comms","yellow"}, {"Pink Copy - Ops","pink"}, {"Gold Copy - Plans","#DDAA22"}} %>' varStatus='status'>

 <c:if test="${status.index ne 0 or printPageBreak eq true}"><div class="page"></div></c:if>
 
<div style="height: 9in; font-size: 12pt; font-family: Times">
<div style="width: 100%; height: 16pt; border-top: 2px solid ${copy[1]}; padding: 0px;">
	<div style="width: 30%; float: left">${copy[0]}</div>
	<div style="width: 69%; float: left; border-top: 12px solid ${copy[1]}"></div>
</div>

<div style="width: 100%; height: 24pt; border-bottom: 1px solid black">
	<div class="lbox" style="width: 25%;"><b>TEAM ASSIGNMENT</b></div>
	<div class="box" style="width: 25%"><div class="label">1. INCIDENT NAME</div>${search.publicName}</div>
	<div class="box" style="width: 25%"><div class="label">2. OPERATIONAL PERIOD</div>${assignment.operationalPeriod.id}</div>
	<div class="box" style="width: 24%"><div class="label">3. ASSIGNMENT NUMBER</div>${assignment.id}</div>
</div>

<div style="width: 100%; height: 16pt; border-bottom: 1px solid black">
	<div class="lbox" style="width: 100%; text-align: left"><div class="label" style="float: left">4. RESOURCE TYPE</div>&nbsp;&nbsp;${assignment.resourceType}</div>
</div>

<div style="width: 100%; height: 135pt; border-bottom: 1px solid black">
<div class="label">5. PERSONNEL ASSIGNED <span style="width: 144pt">&nbsp;</span> L -- TEAM LEADER &nbsp;&nbsp; M -- MEDICAL</div>

<c:set var="people" value="${assignment.people}"/>
<table cellspacing="0" class="personnel" style="width: 100%">
<tr><th style="width: 2%">&nbsp;</th><th style="width: 33%">NAME</th><th style="width: 15%">AGENCY</th><th style="width: 2%">&nbsp;</th><th style="width: 33%">NAME</th><th style="width: 15%">AGENCY</th></tr>
<tr><td>1</td><td>${people[0].name}</td><td>${people[0].agency}</td><td>6</td><td>${people[5].name}</td><td>${people[5].agency}</td></tr>
<tr><td>2</td><td>${people[1].name}</td><td>${people[1].agency}</td><td>7</td><td>${people[6].name}</td><td>${people[6].agency}</td></tr>
<tr><td>3</td><td>${people[2].name}</td><td>${people[2].agency}</td><td>8</td><td>${people[7].name}</td><td>${people[7].agency}</td></tr>
<tr><td>4</td><td>${people[3].name}</td><td>${people[3].agency}</td><td>9</td><td>${people[8].name}</td><td>${people[8].agency}</td></tr>
<tr><td>5</td><td>${people[4].name}</td><td>${people[4].agency}</td><td colspan="3">[&nbsp;&nbsp;] additional names attached</td></tr>
</table>
</div>

<div style="width: 100%; height: 100pt; border-bottom: 1px dotted black">
	<div class="lbox" style="width: 100%; text-align: left"><div class="label">6. ASSIGNMENT</div>
	<div>${assignment.details}</div>
	  </div>
</div>
<div style="width: 100%; height: 14pt; border-bottom: 1px solid black">
	<div style="float: right">MAP(S) ATTACHED</div>
</div>

<div style="width: 100%; height: 72pt; border-bottom: 1px solid black">
	<div class="lbox" style="width: 100%; text-align: left"><div class="label">7. PREVIOUS AND PRESENT SEARCH EFFORTS IN AREA</div>
	<div>${assignment.previousEfforts}</div>
	</div>
</div>

<div style="width: 100%; height: 24pt; border-bottom: 1px solid black">
	<div class="lbox" style="width: 15%"><div class="label">8. TIME ALLOCATED</div><c:if test="${assignment.timeAllocated ne null}">${assignment.timeAllocated} hours</c:if></div>
	<div class="box" style="width: 20%"><div class="label">9. SIZE OF ASSIGNMENT</div>${assignment.formattedSize}</div>
	<div class="box" style="width: 64%"><div class="label">10. EXPECTED P.O.D.</div><span style="text-transform: capitalize; font-size: 80%">Responsive: ${fn:toLowerCase(assignment.responsivePOD)}&nbsp;&nbsp;&nbsp;Unresponsive: ${fn:toLowerCase(assignment.unresponsivePOD)}&nbsp;&nbsp;&nbsp;Clue: ${fn:toLowerCase(assignment.cluePOD)}</span></div>
</div>

<div style="width: 100%; height: 60pt; border-bottom: 1px solid black">
	<div class="lbox" style="width: 100%; text-align: left"><div class="label">11. DROP OFF AND PICKUP INSTRUCTIONS</div>
	<div>${assignment.transportation}</div>
	</div>
</div>

<div style="width: 100%; height: 16pt; border-bottom: 1px solid #CCCCCC">
	<div class="lbox" style="width: 30%"><div class="label">12. COMMUNICATIONS</div></div>
</div>
<table style="width: 100%; border-bottom: 1px solid black cellspacing="0" class="comms">
<tr><td class="label" style="width: 25%">COMMAND (TEAM -- BASE)</td><td>${assignment.primaryFrequency}</td></tr>
<tr><td class="label">COMMAND (TEAM -- TEAM)</td><td>${assignment.secondaryFrequency}</td></tr>
</table>

<div style="width: 100%; height: 24pt; border-bottom: 1px solid black">
	<div class="lbox" style="width: 65%"><div class="label">13. PREPARED BY</div>${assignment.preparedBy}</div>
	<div class="box" style="width: 34%"><div class="label">14 AND 15. DATE PREPARED</div><fmt:formatDate value="${assignment.preparedOn}" type="both" timeStyle="short" dateStyle="short"/></div>
</div>

<div style="width: 100%; height: 36pt; border-bottom: 1px solid black">
	<div class="lbox" style="width: 100%; text-align: left"><div class="label">16. EQUIPMENT ISSUED</div>
	
<c:forEach var="equip" items="${assignment.equipment}" varStatus="estatus">
<c:if test="${varStatus.index gt 0}">, </c:if>${equip.name} <c:if test="${equip.agency ne null}">(${equip.agency})</c:if>
</c:forEach>
</div>
</div>

<div style="width: 100%; height: 36pt; border-bottom: 1px solid black">
	<div class="lbox" style="width: 33%"><div class="label">17. BRIEFER</div>&nbsp;</div>
	<div class="box" style="width: 22%"><div class="label">18. TIME BRIEFED</div>&nbsp;</div>
	<div class="box" style="width: 22%"><div class="label">19. TIME OUT</div>&nbsp;</div>
	<div class="box" style="width: 22%"><div class="label">20. TIME RETURNED</div>&nbsp;</div>
</div>

<div style="width: 100%;">
SAR 104<span style="font-size: 50%; padding-left: 40px">USE CARBON SHEETS WHEN FILLING IN MISSING DATA.  PRESS HARD 4 COPIES.</span></div>
</div>


</div>

</c:forEach>