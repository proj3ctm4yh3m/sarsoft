<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"><%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn" %>
<%@ taglib uri="http://tiles.apache.org/tags-tiles" prefix="tiles" %>
<%@ taglib uri="http://java.sun.com/jsp/jstl/fmt" prefix="fmt" %>

<%@page import="org.sarsoft.plans.model.SearchAssignment"%>
<html>
<head>
<title>${search.publicName} - Assignment ${assignment.id}</title>
${head}
<style tyle="text/css">
.box {
	border-left: 1px solid black; float: left; height: 100%; overflow: hidden;
	text-align: center;
}
.lbox {
	float: left; height: 100%;
	text-align: center;
}
.label {
	font-size: 50%;
	text-align: left;
	padding-left: 4pt;
}
TABLE.personnel {
	border: 1px solid #AAAAAA;
}

TABLE.personnel TR {
	height: 20pt;
}

TABLE.personnel TD,TH {
	border-left: 1px solid #AAAAAA;
	border-bottom: 1px solid #AAAAAA;
	font-weight: normal;
}

TABLE.comms TR {
	height: 20pt;
}

TABLE.comms TD,TH {
	border-left: 1px solid #AAAAAA;
	border-bottom: 1px solid #AAAAAA;
	font-weight: normal;
}
@page {
	size: 8.5in 11in;
	margin: 0.25in;
	border: 0pt;
	padding: 0pt;
}
</style>
<style type="text/css" media="print">
.page {
	page-break-before: always;
	border: 1px solid white;
}
</style>
</head>
<body>

<c:set var="assignment" scope="request" value="${assignment}"/>
<jsp:include page="assignment-printbody.jsp"/>

</body>
</html>