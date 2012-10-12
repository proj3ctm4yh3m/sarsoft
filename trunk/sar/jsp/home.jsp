<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn" %>
<%@ taglib uri="http://tiles.apache.org/tags-tiles" prefix="tiles" %>

<c:if test="${message ne null}">
<div style="font-weight: bold; color: red">Error: ${message}</div>
</c:if>

<tiles:importAttribute name="pane"/>

<div style="padding-left: 11em; padding-right: 1em; padding-top: 15px;">

<div style="position: relative; float: left; width: 10em; margin-left: -11em; border-right: 1px solid #5a8ed7; height: 15em">
<div class="lmenu"<c:choose><c:when test="${pane eq 'plans'}"> style="color: #945e3b"><span style="padding-right: 5px">&#x25B8;</span></c:when><c:otherwise>><span style="padding-right: 5px; visibility: hidden">&#x25B8;</span></c:otherwise></c:choose><a href="/plans">Plans</a></div>
<div class="lmenu"<c:choose><c:when test="${pane eq 'resources'}"> style="color: #945e3b"><span style="padding-right: 5px">&#x25B8;</span></c:when><c:otherwise>><span style="padding-right: 5px; visibility: hidden">&#x25B8;</span></c:otherwise></c:choose><a href="/resource">Resources</a></div>
<div class="lmenu"<c:choose><c:when test="${pane eq 'clues'}"> style="color: #945e3b"><span style="padding-right: 5px">&#x25B8;</span></c:when><c:otherwise>><span style="padding-right: 5px; visibility: hidden">&#x25B8;</span></c:otherwise></c:choose><a href="/clue">Clues</a></div>
<div class="lmenu"<c:choose><c:when test="${pane eq 'setup'}"> style="color: #945e3b"><span style="padding-right: 5px">&#x25B8;</span></c:when><c:otherwise>><span style="padding-right: 5px; visibility: hidden">&#x25B8;</span></c:otherwise></c:choose><a href="/setup">Setup</a></div>
</div>

<div style="position: relative; float: left; width: 100%">
<tiles:insertAttribute name="subcontent"/>
</div>

</div>