<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn" %>
<%@ taglib uri="http://tiles.apache.org/tags-tiles" prefix="tiles" %>

<c:if test="${message ne null}">
<div style="font-weight: bold; color: red">Error: ${message}</div>
</c:if>

<div style="padding-left: 11em; padding-right: 1em; padding-top: 15px;">

<div style="position: relative; float: left; width: 10em; margin-left: -11em; border-right: 1px solid #5a8ed7; height: 15em">
<div id="allLink" class="lmenu"><span style="padding-right: 5px" id="allArrow">&#x25B8;</span><a href="/find">All</a></div>
<div id="keyLink" class="lmenu"><span style="padding-right: 5px" id="keyArrow">&#x25B8;</span><a href="javascript:setPane('key')">By Keyword</a></div>
<div id="userLink" class="lmenu"><span style="padding-right: 5px" id="userArrow">&#x25B8;</span><a href="javascript:setPane('user')">By User</a></div>
</div>

<div style="position: relative; float: left; width: 100%">

<div id="allContent">
<div style="color: #5a8ed7; font-size: 1.5em; font-weight: bold">All Maps</div>
<div style="padding-top: 1ex">Share your own maps with other ${version} users by checking the Share box on the map's admin page.</div>
<c:if test="${pane eq 'all'}">
<div id="tenantContainer" class="growYUITable">
<table id="tenantTable">
<thead>
<tr><th>Name</th><th>name</th><th>type</th><th>Owner</th><th>Comments</th></tr>
</thead>
<tbody>
<c:forEach var="tenant" items="${tenants}">
<c:set var="comments" value="${tenant.comments}"/>
<c:if test="${fn:length(comments) gt 120}"><c:set var="comments" value="${fn:substring(comments, 0, 120)}..."/></c:if>
<tr><td><c:out value="${tenant.description}"/></td><td>${tenant.name}</td><td>${tenant.class.name}</td><td><c:out value="${tenant.account.handle}"/></td><td><c:out value="${comments}"/></td></tr>
</c:forEach>
</tbody>
</table>
</div>
</c:if>

</div>

<div id="keyContent" style="display: none;">

<div style="color: #5a8ed7; font-size: 1.5em; font-weight: bold">Find By Keyword</div>
<form action="/find" method="get" id="bykeywordform" style="padding-top: 1ex">
<label for="key" style="padding-right: 8ex">Keyword</label>
<input type="text" size="15" name="key" value="${keyword}"/>
<input type="submit" value="GO" style="margin-left: 2px"/>
</form>

<c:if test="${pane eq 'key'}">
<div id="tenantContainer" class="growYUITable">
<table id="tenantTable">
<thead>
<tr><th>Name</th><th>name</th><th>type</th><th>Owner</th><th>Comments</th></tr>
</thead>
<tbody>
<c:forEach var="tenant" items="${tenants}">
<c:set var="comments" value="${tenant.comments}"/>
<c:if test="${fn:length(comments) gt 120}"><c:set var="comments" value="${fn:substring(comments, 0, 120)}..."/></c:if>
<tr><td><c:out value="${tenant.description}"/></td><td>${tenant.name}</td><td>${tenant.class.name}</td><td><c:out value="${tenant.account.handle}"/></td><td><c:out value="${comments}"/></td></tr>
</c:forEach>
</tbody>
</table>
</div>
</c:if>

</div>

<div id="userContent" style="display: none;">

<div style="color: #5a8ed7; font-size: 1.5em; font-weight: bold">Find By User</div>
<form action="/find" method="get" id="byuserform" style="padding-top: 1ex">
<label for="user" style="padding-right: 8ex">User</label>
<input type="text" size="15" name="user" value="${user}"/>
<input type="submit" value="GO" style="margin-left: 2px"/>
</form>

<c:if test="${pane eq 'user'}">
<div>
<div id="tenantContainer" class="growYUITable">
<table id="tenantTable">
<thead>
<tr><th>Name</th><th>name</th><th>type</th><th>Owner</th><th>Comments</th></tr>
</thead>
<tbody>
<c:forEach var="tenant" items="${tenants}">
<c:set var="comments" value="${tenant.comments}"/>
<c:if test="${fn:length(comments) gt 120}"><c:set var="comments" value="${fn:substring(comments, 0, 120)}..."/></c:if>
<tr><td><c:out value="${tenant.description}"/></td><td>${tenant.name}</td><td>${tenant.class.name}</td><td><c:out value="${tenant.account.handle}"/></td><td><c:out value="${comments}"/></td></tr>
</c:forEach>
</tbody>
</table>
</div>
</div>
</c:if>

</div>

</div>

</div>

<script>

org.sarsoft.Loader.queue(function() { 
    var coldefs = [ 
        {key:"publicName",label:"Name",sortable:true, 
         	formatter : function(cell, record, column, data) { $(cell).css({"white-space": "nowrap"}); cell.innerHTML = '<a href="/' + ((record.getData().type == "org.sarsoft.plans.model.Search") ? "search" : "map") + '?id=' + record.getData().name + '">' + data + '</a>' },
			sortOptions: {sortFunction: function(a, b, desc) { 
				return YAHOO.util.Sort.compare(a.getData("publicName"), b.getData("publicName"), desc); 
				}} },
		{key:"owner",label:"Created By",sortable:true, formatter : function(cell, record, column, data) { cell.innerHTML = '<a href="/find?user=' + data + '">' + data + '</a>';}},
		{ key : "comments", label: "Comments", formatter : function(cell, record, column, data) { $(cell).css({overflow: "hidden", "max-height": "4em", "max-width": "30em"}); cell.innerHTML = data;}},
		{ key : "type", label: "Actions", formatter : function(cell, record, column, data) {
			if(record.getData().type == "org.sarsoft.markup.model.CollaborativeMap") {
				var guide = jQuery('<span><a href="/guide?id=' + record.getData().name + '">View Guide</a>,  &nbsp;</span>').appendTo(cell);
			}
			var share = jQuery('<a href="javascript:return false;">Share</a>').appendTo(cell);
			share.click(function() { var rooturl = window.location.href.replace(window.location.pathname, "") + "/"; var html = 'You can share this ';
				if(record.getData().type == "org.sarsoft.plans.model.Search") {
					html += 'search by giving people the following URL:<br/><br/>';
					var surl = rooturl + 'search?id=' + record.getData().name;
					html += '<a href="' + surl + '">' + surl + '</a>';
				} else {
					html += 'map by giving people the following URL:<br/><br/>';
					var murl = rooturl + 'map?id=' + record.getData().name;
					html += '<a href="' + murl + '">' + murl + '</a><br/><br/>';
					html += 'Embed it in a webpage or forum:<br/><br/><textarea rows="3" cols="45">&lt;iframe width="500px" height="500px" src="' + murl + '"&gt;&lt;/iframe&gt;</textarea>';
				}
				alertBody.innerHTML = html; alertDlg.show();});
		}}
		]
    var ds = new YAHOO.util.DataSource(YAHOO.util.Dom.get("tenantTable"));
    ds.responseType = YAHOO.util.DataSource.TYPE_HTMLTABLE;
    ds.responseSchema = {fields: [{key:"publicName"},{key:"name"},{key:"type"},{key:"owner"},{key:"comments"}]};

    var dt = new YAHOO.widget.DataTable("tenantContainer", coldefs, ds);
});

panes = ["all","key","user"];
var alertBody = document.createElement('div');
var alertDlg = org.sarsoft.view.AlertDialog("Sharing", alertBody);	

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

setPane('${pane}');

</script>

