package org.sarsoft.ops.service.location;

import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.hibernate.FlushMode;
import org.hibernate.Session;
import org.hibernate.SessionFactory;
import org.sarsoft.common.dao.GenericHibernateDAO;
import org.sarsoft.common.model.Waypoint;
import org.sarsoft.common.util.RuntimeProperties;
import org.sarsoft.ops.model.APRSDevice;
import org.sarsoft.ops.model.Resource;
import org.sarsoft.ops.model.SpotDevice;
import org.sarsoft.plans.model.SearchAssignment;
import org.springframework.orm.hibernate3.SessionFactoryUtils;
import org.springframework.orm.hibernate3.SessionHolder;
import org.springframework.transaction.support.TransactionSynchronizationManager;

public class LocationEngine extends Thread {

	public GenericHibernateDAO dao;
	private String search;
	private Map<Long, Long> lastRefreshed = new HashMap<Long, Long>();
	private long aprsRefreshInterval = 240000;
	private long spotRefreshInterval = 120000;
	private boolean enabled = true;

	private void checkResource(Resource resource) {
		try {
			long time = new Date().getTime();
			Long lastUpdate = lastRefreshed.get(resource.getPk());
			if(resource.getCallsign() != null && (lastUpdate == null || lastUpdate < time - aprsRefreshInterval)) {
				Waypoint fresh = APRSDevice.checkLocation(resource.getCallsign());
				Waypoint stale = resource.getPosition();
				if(fresh != null && (stale == null || stale.getTime() == null || fresh.getTime().after(stale.getTime()))) {
					resource.setPosition(fresh);
					dao.save(resource);
				}
				lastRefreshed.put(resource.getPk(), new Date().getTime());
			}
			if(resource.getSpotId() != null && (lastUpdate == null || lastUpdate < time - spotRefreshInterval)) {
				Waypoint fresh = SpotDevice.checkLocation(resource.getSpotId(), resource.getSpotPassword());
				Waypoint stale = resource.getPosition();
				if(fresh != null && (stale == null || stale.getTime() == null || fresh.getTime().after(stale.getTime()))) {
					resource.setPosition(fresh);
					dao.save(resource);
				}
				lastRefreshed.put(resource.getPk(), new Date().getTime());
			}
		} catch (Exception e) {
			e.printStackTrace();
		}
	}

	@SuppressWarnings("unchecked")
	private void checkLocations() {
		Session session = null;
		SessionFactory sessionFactory = null;
		try {
			sessionFactory = dao.getSessionFactory();
			session = SessionFactoryUtils.getNewSession(sessionFactory);
			session.setFlushMode(FlushMode.NEVER);
			TransactionSynchronizationManager.bindResource(sessionFactory, new SessionHolder(session));

			List<SearchAssignment> assignments = dao.loadAll(SearchAssignment.class);

			long time = new Date().getTime();

			List<Resource> resources = (List<Resource>) dao.loadAll(Resource.class);
			for(Resource resource : resources) {
				checkResource(resource);
			}
		} finally {
			SessionHolder sessionHolder = (SessionHolder) TransactionSynchronizationManager.unbindResource(sessionFactory);
			SessionFactoryUtils.closeSession(sessionHolder.getSession());
		}
	}

	public void run() {
		RuntimeProperties.setSearch(search);
		while(true) {
			if(!enabled) return;
			checkLocations();
			try {
				sleep(15000);
			} catch (InterruptedException e) {
			}
		}
	}

	public void setSearch(String search) {
		this.search = search;
	}

	public void setAPRSRefreshInterval(String refreshInterval) {
		if(refreshInterval == null || "".equals(aprsRefreshInterval)) return;
		this.aprsRefreshInterval = Long.parseLong(refreshInterval);
	}

	public void setSpotRefreshInterval(String refreshInterval) {
		if(refreshInterval == null || "".equals(aprsRefreshInterval)) return;
		this.spotRefreshInterval = Long.parseLong(refreshInterval);
	}

	public void quit() {
		enabled = false;
	}

}
