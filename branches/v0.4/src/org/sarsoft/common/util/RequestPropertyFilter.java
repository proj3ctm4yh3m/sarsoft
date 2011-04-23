package org.sarsoft.common.util;

import java.io.IOException;

import javax.servlet.Filter;
import javax.servlet.FilterChain;
import javax.servlet.FilterConfig;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletRequest;

public class RequestPropertyFilter implements Filter {

	public void destroy() {
		// TODO Auto-generated method stub
	}

	public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {
		HttpServletRequest servletRequest = (HttpServletRequest) request;
		RuntimeProperties.setSearch((String) servletRequest.getSession(true).getAttribute("search"));
		RuntimeProperties.setUsername((String) servletRequest.getSession(true).getAttribute("username"));
		RuntimeProperties.setServerName(servletRequest.getServerName());
		RuntimeProperties.setServerPort(servletRequest.getServerPort());
		chain.doFilter(request, response);
	}

	public void init(FilterConfig arg0) throws ServletException {
		// TODO Auto-generated method stub
	}


}
