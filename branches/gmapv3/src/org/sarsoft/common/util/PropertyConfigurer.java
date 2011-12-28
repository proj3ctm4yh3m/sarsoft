package org.sarsoft.common.util;

import java.util.Properties;

import javax.servlet.ServletContext;

import org.springframework.beans.factory.config.PropertyPlaceholderConfigurer;

public class PropertyConfigurer extends PropertyPlaceholderConfigurer {

	private ServletContext context;

	public void setServletContext(ServletContext context) {
		this.context = context;
	}

	protected String resolvePlaceholder(String placeholder, Properties props) {
		if(!RuntimeProperties.isInitialized()) RuntimeProperties.initialize(this.context);

		return RuntimeProperties.getProperty(placeholder);
	}

}
