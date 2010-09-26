package org.sarsoft.ops.service.location;

import java.util.List;

import org.hibernate.FlushMode;
import org.hibernate.Session;
import org.hibernate.SessionFactory;
import org.sarsoft.common.dao.GenericHibernateDAO;
import org.sarsoft.common.model.Waypoint;
import org.sarsoft.common.util.RuntimeProperties;
import org.sarsoft.ops.model.LocationEnabledDevice;
import org.sarsoft.ops.model.Resource;
import org.sarsoft.plans.model.SearchAssignment;
import org.springframework.orm.hibernate3.SessionFactoryUtils;
import org.springframework.orm.hibernate3.SessionHolder;
import org.springframework.transaction.support.TransactionSynchronizationManager;

public class LocationEngine extends Thread {

	public GenericHibernateDAO dao;
	private String search;

	@SuppressWarnings("unchecked")
	private void checkLocations() {
		System.out.println("Checking locations . . .");
		Session session = null;
		SessionFactory sessionFactory = null;
		try {
			sessionFactory = dao.getSessionFactory();
			session = SessionFactoryUtils.getNewSession(sessionFactory);
			session.setFlushMode(FlushMode.NEVER);
			TransactionSynchronizationManager.bindResource(sessionFactory, new SessionHolder(session));

			List<SearchAssignment> assignments = dao.loadAll(SearchAssignment.class);

			for(SearchAssignment assignment : assignments) {
				if(assignment.getStatus() == SearchAssignment.Status.INPROGRESS) {
					for(Resource resource : assignment.getResources()) {
						for(LocationEnabledDevice device : resource.getLocators()) {
							try {
								Waypoint wpt = device.checkLocation();
								if(wpt != null) {
									resource.setPlk(wpt);
									resource.setUpdated(wpt.getTime());
									dao.save(resource);
								}
							} catch (Exception e) {
								e.printStackTrace();
							}
						}
					}
				}
			}

		} finally {
			SessionHolder sessionHolder = (SessionHolder) TransactionSynchronizationManager.unbindResource(sessionFactory);
			SessionFactoryUtils.closeSession(sessionHolder.getSession());
		}
	}

	public void run() {
		System.out.println("Thread Running");
		RuntimeProperties.setSearch(search);
		while(true) {
			try {
				sleep(10000);
			} catch (InterruptedException e) {
			}
			try {
				checkLocations();
			} catch (Throwable t) {
				t.printStackTrace();
			}
		}
	}

	public void setSearch(String search) {
		this.search = search;
	}

}
