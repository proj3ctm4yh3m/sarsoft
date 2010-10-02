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
import org.sarsoft.ops.model.LatitudeDevice;
import org.sarsoft.ops.model.LocationEnabledDevice;
import org.sarsoft.ops.model.Resource;
import org.sarsoft.plans.model.SearchAssignment;
import org.springframework.orm.hibernate3.SessionFactoryUtils;
import org.springframework.orm.hibernate3.SessionHolder;
import org.springframework.transaction.support.TransactionSynchronizationManager;

public class LocationEngine extends Thread {

	public GenericHibernateDAO dao;
	private String search;
	private Map<Long, Long> tracks = new HashMap<Long, Long>();
	private Map<Long, Long> lastRefreshed = new HashMap<Long, Long>();
	private long refreshInterval = 30000;
	private boolean enabled = true;

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

			for(SearchAssignment assignment : assignments) {
				if(assignment.getStatus() == SearchAssignment.Status.INPROGRESS) {
					for(Resource resource : assignment.getResources()) {
						for(LocationEnabledDevice device : resource.getLocators()) {
							try {
								if(!lastRefreshed.containsKey(device.getPk()) || lastRefreshed.get(device.getPk()) < time - refreshInterval) {
									Waypoint wpt = device.checkLocation();
									if(wpt != null) {
										// Update resource PLK
										resource.setPlk(wpt);
										resource.setUpdated(wpt.getTime());
										dao.save(resource);

										lastRefreshed.put(device.getPk(), time);

										// Update the track associated with this device
										boolean createNewTrack = false;
										boolean addWaypointToTrack = true;
										Way track = null;
										if(!tracks.containsKey(device.getPk())) {
											createNewTrack = true;
										} else {
											track = (Way) dao.loadByPk(Way.class, tracks.get(device.getPk()));
											List<Waypoint> waypoints = track.getWaypoints();
											if(waypoints.size() > 0) {
												Waypoint lastWaypoint = waypoints.get(waypoints.size() - 1);
												if(lastWaypoint.distanceFrom(wpt) > 500) createNewTrack = true;
												if(lastWaypoint.distanceFrom(wpt) == 0) addWaypointToTrack = false;
											}
										}

										if(createNewTrack) {
											track = new Way();
											track.setName("Position track for " + resource.getName());
											track.setType(WayType.TRACK);
											track.setPolygon(false);
											track.setWaypoints(new ArrayList<Waypoint>());
											assignment.getWays().add(track);
											dao.save(assignment);
											tracks.put(device.getPk(), track.getPk());
										}

										if(addWaypointToTrack) {
											track.getWaypoints().add(wpt);
											dao.save(track);
										}
									}
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
		RuntimeProperties.setSearch(search);
		while(true) {
			try {
				sleep(15000);
			} catch (InterruptedException e) {
			}
			if(!enabled) return;
			checkLocations();
		}
	}

	public void setSearch(String search) {
		this.search = search;
	}

	public void setRefreshInterval(String refreshInterval) {
		if(refreshInterval == null || "".equals(refreshInterval)) refreshInterval = "30000";
		this.refreshInterval = Long.parseLong(refreshInterval);
	}

	public void quit() {
		enabled = false;
	}

}
