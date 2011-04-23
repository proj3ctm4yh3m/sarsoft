<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn" %>

<a href="/app/operationalperiod">Home</a>&nbsp;
<c:forEach var="bc" items="${breadcrumb}">
  &nbsp; | <a href="${bc.url}">${bc.label}</a>
</c:forEach>