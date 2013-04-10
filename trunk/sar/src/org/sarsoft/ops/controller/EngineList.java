package org.sarsoft.ops.controller;

import org.sarsoft.common.dao.GenericHibernateDAO;
import org.sarsoft.common.util.RuntimeProperties;
import org.sarsoft.ops.service.location.APRSLocalEngine;
import org.sarsoft.ops.service.location.APRSTier2Engine;
import org.sarsoft.ops.service.location.SpotLocationEngine;

public class EngineList {
	
	private GenericHibernateDAO dao;
	private APRSTier2Engine aprst2;
	private APRSLocalEngine aprsLocal;
	private SpotLocationEngine spot;
	private boolean t2Enabled = false;
	private boolean localEnabled = false;
	private boolean spotEnabled = false;
	
	public EngineList(GenericHibernateDAO dao, boolean t2Enabled, boolean localEnabled, boolean spotEnabled) {
		this.dao = dao;
		this.t2Enabled = t2Enabled;
		this.localEnabled = localEnabled;
		this.spotEnabled = spotEnabled;
	}

	public APRSTier2Engine getAprst2() {return aprst2;}
	public APRSLocalEngine getAprsLocal() {return aprsLocal;}
	public SpotLocationEngine getSpot() {return spot;}
	
	private APRSTier2Engine createAprst2() {
		APRSTier2Engine aprst2 = new APRSTier2Engine();
		aprst2.setDao(this.dao);
		aprst2.setSearch(RuntimeProperties.getTenant());
		aprst2.setAprsFiKey(RuntimeProperties.getProperty("sarsoft.location.aprs.fi.key"));
		aprst2.setUser(RuntimeProperties.getProperty("sarsoft.location.aprs.is.user"));
		aprst2.setServer(RuntimeProperties.getProperty("sarsoft.location.aprs.is.serverName"));
		aprst2.setPort(Integer.parseInt(RuntimeProperties.getProperty("sarsoft.location.aprs.is.serverPort")));
		aprst2.setTimeout(RuntimeProperties.getProperty("sarsoft.location.aprs.is.timeToIdle"));
		return aprst2;
	}
	
	private APRSLocalEngine createAprsLocal() {
		APRSLocalEngine aprsLocal = new APRSLocalEngine();
		if(RuntimeProperties.getProperty("sarsoft.location.aprs.local.deviceNames") != null) aprsLocal.setDeviceNames(RuntimeProperties.getProperty("sarsoft.location.aprs.local.deviceNames"));
		if(RuntimeProperties.getProperty("sarsoft.location.aprs.local.deviceNamePrefixes") != null) aprsLocal.setDeviceNamePrefixes(RuntimeProperties.getProperty("sarsoft.location.aprs.local.deviceNamePrefixes"));
		aprsLocal.setDao(this.dao);
		aprsLocal.setSearch(RuntimeProperties.getTenant());
		aprsLocal.setAprsFiKey(RuntimeProperties.getProperty("sarsoft.location.aprs.fi.key"));
		aprsLocal.setUser(RuntimeProperties.getProperty("sarsoft.location.aprs.is.user"));
		aprsLocal.setTimeout(RuntimeProperties.getProperty("sarsoft.location.aprs.local.timeToIdle"));
		return aprsLocal;
	}
	
	private SpotLocationEngine createSpot() {
		SpotLocationEngine spot = new SpotLocationEngine();
		spot.setDao(this.dao);
		spot.setSearch(RuntimeProperties.getTenant());
		spot.setRefreshInterval(RuntimeProperties.getProperty("sarsoft.location.spot.refreshInterval"));
		spot.setTimeout(RuntimeProperties.getProperty("sarsoft.location.spot.timeToIdle"));
		return spot;
	}
	
	private void checkAprst2() {
		if((this.aprst2 == null || !this.aprst2.isAlive()) && this.t2Enabled) {
			this.aprst2 = createAprst2();
			this.aprst2.start();
		} else if(this.aprst2 != null) {
			this.aprst2.keepAlive();
		}
	}

	private void checkAprsLocal() {
		if((this.aprsLocal == null || !this.aprsLocal.isAlive()) && this.localEnabled) {
			this.aprsLocal = createAprsLocal();
			this.aprsLocal.start();
		} else if(this.aprsLocal != null) {
			this.aprsLocal.keepAlive();
		}
	}

	private void checkSpot() {
		if((this.spot == null || !this.spot.isAlive()) && this.spotEnabled) {
			this.spot = createSpot();
			this.spot.start();
		} else if(this.spot != null) {
			this.spot.keepAlive();
		}
	}

	public void check() {
		checkAprst2();
		checkAprsLocal();
		checkSpot();
	}
	
	public void reset() {
		if(this.aprst2 != null) {
			this.aprst2.quit();
			this.aprst2 = null;
		}
		if(this.aprsLocal != null) {
			this.aprsLocal.quit();
			this.aprsLocal = null;
		}
		if(this.spot != null) {
			this.spot.quit();
			this.spot = null;
		}

		check();
	}
	
}
