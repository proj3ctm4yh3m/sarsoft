package org.sarsoft.ops.service.location;

import org.hibernate.FlushMode;
import org.hibernate.Session;
import org.hibernate.SessionFactory;
import org.sarsoft.common.dao.GenericHibernateDAO;
import org.sarsoft.common.util.RuntimeProperties;
import org.springframework.orm.hibernate3.SessionFactoryUtils;
import org.springframework.orm.hibernate3.SessionHolder;
import org.springframework.transaction.support.TransactionSynchronizationManager;

public abstract class AsyncTransactionalEngine extends Thread {

	public enum Status {
		RUNNING, ERROR, EXPIRED
	}
	protected GenericHibernateDAO dao;
	protected String search = null;
	private SessionFactory sessionFactory = null;
	private Session session = null;
	protected boolean enabled = true;
	protected String statusMessage = "";
	protected long timeout = 60000;
	protected long keepAlive;

	@SuppressWarnings("deprecation")
	protected void beginTransaction() {
		sessionFactory = dao.getSessionFactory();
		session = SessionFactoryUtils.getNewSession(sessionFactory);
		session.setFlushMode(FlushMode.NEVER);
		TransactionSynchronizationManager.bindResource(sessionFactory, new SessionHolder(session));
	}
	
	protected void closeTransaction() {
		SessionHolder sessionHolder = (SessionHolder) TransactionSynchronizationManager.unbindResource(sessionFactory);
		SessionFactoryUtils.closeSession(sessionHolder.getSession());
	}
	
	public void setSearch(String search) {
		this.search = search;
	}
	
	public void setDao(GenericHibernateDAO dao) {
		this.dao = dao;
	}
	
	protected abstract void doRun();

	public void run() {
		keepAlive();
		RuntimeProperties.setSearch(search);
		doRun();
	}

	public void quit() {
		enabled = false;
	}
	
	public String getStatusMessage() {
		return statusMessage;
	}
	
	public void setTimeout(long timeout) {
		this.timeout = timeout;
	}
	
	public void keepAlive() {
		keepAlive = System.currentTimeMillis();
	}
	
	protected boolean timedout() {
		return System.currentTimeMillis() - keepAlive > timeout;
	}
}
