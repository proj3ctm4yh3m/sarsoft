package org.sarsoft.common.util;

import java.io.IOException;
import java.util.Map;

import javax.servlet.Filter;
import javax.servlet.FilterChain;
import javax.servlet.FilterConfig;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletRequest;

import org.sarsoft.common.model.Tenant.Permission;

public class RequestPropertyFilter implements Filter {

	public void destroy() {
		// TODO Auto-generated method stub
	}

	public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {
		HttpServletRequest servletRequest = (HttpServletRequest) request;
		if(!RuntimeProperties.isInitialized()) RuntimeProperties.initialize(servletRequest.getSession(true).getServletContext());

		String name = (String) servletRequest.getSession(true).getAttribute("tenantid");
		Permission permission = (Permission) servletRequest.getSession(true).getAttribute("userPermission");

		String tid = request.getParameter("tid");
		if(tid != null && !tid.equalsIgnoreCase(name)) {
			name = null;
			permission = null;
			@SuppressWarnings("unchecked")
			Map<String, Permission> authedTenants = (Map<String, Permission>) ((HttpServletRequest) request).getSession().getAttribute("authedTenants");
			if(authedTenants != null) {
				Permission p = null;
				synchronized(authedTenants) {
					p = authedTenants.get(tid);
				}
				if(p != null) {
					name = tid;
					permission = p;
				}
			}
		}
		
		RuntimeProperties.setTenant(name);
		RuntimeProperties.setUsername((String) servletRequest.getSession(true).getAttribute("username"));
		RuntimeProperties.setUserPermission(permission);
		RuntimeProperties.setServerName(servletRequest.getServerName());
		RuntimeProperties.setServerPort(servletRequest.getServerPort());
		chain.doFilter(request, response);
	}

	public void init(FilterConfig arg0) throws ServletException {
		// TODO Auto-generated method stub
	}


}
