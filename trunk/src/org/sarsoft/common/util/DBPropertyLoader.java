package org.sarsoft.common.util;

import java.util.Enumeration;
import java.util.NoSuchElementException;
import java.util.Properties;

import org.sarsoft.common.dao.GenericHibernateDAO;
import org.sarsoft.common.model.Config;

import org.springframework.beans.factory.InitializingBean;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;

@SuppressWarnings("serial")
public class DBPropertyLoader implements InitializingBean {

	@Autowired
	protected GenericHibernateDAO dao;

	@Autowired
	@Qualifier("dbProperties")
	protected Properties dbProperties;

	public void setGenericDao(GenericHibernateDAO dao) {
		this.dao = dao;
	}

	public void afterPropertiesSet() throws Exception {
		for(Enumeration e = dbProperties.keys(); e.hasMoreElements(); ) {
			String key = (String) e.nextElement();
			String value = dbProperties.getProperty(key);
			Config config = (Config) dao.getByAttr(Config.class, "name", key);
			if(config == null) {
				config = new Config(key, value);
				dao.save(config);
			}
		}
	}
}
