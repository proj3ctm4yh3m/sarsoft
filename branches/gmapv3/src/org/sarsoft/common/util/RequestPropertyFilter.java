package org.sarsoft.common.util;

import java.io.IOException;

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
		RuntimeProperties.setTenant((String) servletRequest.getSession(true).getAttribute("tenantid"));
		RuntimeProperties.setUsername((String) servletRequest.getSession(true).getAttribute("username"));
		RuntimeProperties.setUserPermission((Permission) servletRequest.getSession(true).getAttribute("userPermission"));
		RuntimeProperties.setServerName(servletRequest.getServerName());
		RuntimeProperties.setServerPort(servletRequest.getServerPort());
		chain.doFilter(request, response);
	}

	public void init(FilterConfig arg0) throws ServletException {
		// TODO Auto-generated method stub
	}


}
