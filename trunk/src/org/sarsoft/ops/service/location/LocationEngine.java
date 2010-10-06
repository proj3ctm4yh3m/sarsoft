package org.sarsoft.ops.service.location;

import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.hibernate.FlushMode;
import org.hibernate.Session;
import org.hibernate.SessionFactory;
import org.sarsoft.admin.model.Config;
import org.sarsoft.common.dao.GenericHibernateDAO;
import org.sarsoft.common.model.Way;
import org.sarsoft.common.model.WayType;
import org.sarsoft.common.model.Waypoint;
import org.sarsoft.common.util.RuntimeProperties;
import org.sarsoft.ops.model.APRSDevice;
import org.sarsoft.ops.model.LatitudeDevice;
import org.sarsoft.ops.model.LocationEnabledDevice;
import org.sarsoft.ops.model.Resource;
import org.sarsoft.ops.model.SpotDevice;
import org.sarsoft.plans.model.SearchAssignment;
import org.springframework.orm.hibernate3.SessionFactoryUtils;
import org.springframework.orm.hibernate3.SessionHolder;
import org.springframework.transaction.support.TransactionSynchronizationManager;

public class LocationEngine extends Thread {

	public GenericHibernateDAO dao;
	private String search;
	private Map<Long, Long> tracks = new HashMap<Long, Long>();
	private Map<Long, Long> lastRefreshed = new HashMap<Long, Long>();
	private long latitudeRefreshInterval = 30000;
	private long aprsRefreshInterval = 240000;
	private long spotRefreshInterval = 120000;
	private boolean enabled = true;

	private void updateTrack(Resource resource, LocationEnabledDevice device, Waypoint wpt) {
		Way track = tracks.get(device.getPk()) == null ? null : (Way) dao.getByPk(Way.class, tracks.get(device.getPk()));

		if(track == null) {
			track = new Way();
			track.setName("Position track for " + resource.getName());
			track.setType(WayType.TRACK);
			track.setPolygon(false);
			track.setWaypoints(new ArrayList<Waypoint>());
			resource.getAssignment().getWays().add(track);
			dao.save(resource.getAssignment());
			tracks.put(device.getPk(), track.getPk());
		}

		int size = track.getWaypoints().size();
		if(size == 0 || track.getWaypoints().get(size - 1).distanceFrom(wpt) > 0) {
			track.getWaypoints().add(wpt);
			dao.save(track);
		}
	}

	private void checkResource(Resource resource) {
		try {
			long time = new Date().getTime();
			for(LocationEnabledDevice device : resource.getLocators()) {
				try {
					if(!lastRefreshed.containsKey(device.getPk()) ||
							(device instanceof LatitudeDevice && lastRefreshed.get(device.getPk()) < time - latitudeRefreshInterval) ||
							(device instanceof SpotDevice && lastRefreshed.get(device.getPk()) < time - spotRefreshInterval) ||
							(device instanceof APRSDevice && lastRefreshed.get(device.getPk()) < time - aprsRefreshInterval)) {
						Waypoint wpt = device.checkLocation();
						if(wpt != null) {
							// Update resource PLK
							resource.setPlk(wpt);
							resource.setUpdated(wpt.getTime());
							dao.save(resource);

							lastRefreshed.put(device.getPk(), time);

							if(resource.getAssignment() != null && resource.getAssignment().getStatus() == SearchAssignment.Status.INPROGRESS)
								updateTrack(resource, device, wpt);
						}
					}
				} catch (Exception e) {
					e.printStackTrace();
				}
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

			List<Resource> enroute = (List<Resource>) dao.getAllByAttr(Resource.class, "section", Resource.Section.ENROUTE);
			for(Resource enrouteResource : enroute) {
				checkResource(enrouteResource);
			}

			for(SearchAssignment assignment : assignments) {
				if(assignment.getStatus() == SearchAssignment.Status.INPROGRESS) {
					for(Resource resource : assignment.getResources()) {
						checkResource(resource);
					}
				}
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

	public void setLatitudeRefreshInterval(String refreshInterval) {
		if(refreshInterval == null || "".equals(latitudeRefreshInterval)) return;
		this.latitudeRefreshInterval = Long.parseLong(refreshInterval);
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
