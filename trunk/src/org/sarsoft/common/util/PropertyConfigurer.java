package org.sarsoft.common.util;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Properties;

import javax.servlet.ServletContext;

import org.apache.log4j.Logger;
import org.springframework.beans.factory.config.PropertyPlaceholderConfigurer;

public class PropertyConfigurer extends PropertyPlaceholderConfigurer {

	private Properties springProperties;
	private ServletContext context;

	public void setServletContext(ServletContext context) {
		this.context = context;
	}

	protected String resolvePlaceholder(String placeholder, Properties props) {
		if(springProperties == null || springProperties.isEmpty()) {
			loadSpringProperties();
		}

		if(System.getProperty(placeholder) != null) return System.getProperty(placeholder);
		return springProperties.getProperty(placeholder);
	}

	private void loadSpringProperties() {
		springProperties = new Properties();
		String prop = System.getProperty("config");
		if(prop == null) prop ="local";
		String propertiesFileName = "/WEB-INF/" + prop + ".spring-config.properties";
		try {
			InputStream inputStream = context.getResourceAsStream(propertiesFileName);
			springProperties.load(inputStream);
			if(new File("sarsoft.properties").exists()) {
				FileInputStream fis = new FileInputStream("sarsoft.properties");
				springProperties.load(fis);
			}
		} catch (IOException e) {
			Logger logger = Logger.getLogger(PropertyConfigurer.class);
			logger.error("IOException encountered reading from " + propertiesFileName + " or sarsoft.properties", e);
		}
	}

}
