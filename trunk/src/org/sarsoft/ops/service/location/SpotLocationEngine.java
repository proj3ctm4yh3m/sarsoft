package org.sarsoft.ops.service.location;

import java.io.IOException;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import net.sf.ezmorph.bean.MorphDynaBean;
import net.sf.json.JSONObject;
import net.sf.json.JSONSerializer;

import org.apache.log4j.Logger;
import org.sarsoft.common.model.Waypoint;
import org.sarsoft.common.util.RuntimeProperties;
import org.sarsoft.ops.model.Resource;

import com.google.api.client.googleapis.GoogleTransport;
import com.google.api.client.googleapis.json.JsonCParser;
import com.google.api.client.http.HttpRequest;
import com.google.api.client.http.HttpTransport;

public class SpotLocationEngine extends AsyncTransactionalEngine {

	private Map<Long, Long> lastRefreshed = new HashMap<Long, Long>();
	private long refreshInterval = 120000;	
	protected static HttpTransport transport = GoogleTransport.create();
	private int counter = 0;
	private Logger logger = Logger.getLogger(SpotLocationEngine.class);

	static {
		transport.addParser(new JsonCParser());
	}
	
	public void checkSpot(Resource resource) {
		long time = new Date().getTime();
		Long lastUpdate = lastRefreshed.get(resource.getPk());
		Waypoint fresh = null;
		if(resource.getSpotId() != null && resource.getSpotId().length() > 0 && (lastUpdate == null || lastUpdate < time - refreshInterval)) {
			logger.debug("Checking SPOT ID " + resource.getSpotId());
			HttpRequest request = transport.buildGetRequest();
			String url = "http://share.findmespot.com/spot-adventures/rest-api/1.0/public/feed/" + resource.getSpotId() + "/message?&sort=timeInMili&dir=DESC";
			if(resource.getSpotPassword() != null) url += "&feedPassword=" + resource.getSpotPassword();
			request.setUrl(url);
			String json;
			try {
				json = request.execute().parseAsString();
				MorphDynaBean bean = (MorphDynaBean) JSONObject.toBean((JSONObject) JSONSerializer.toJSON(json));
				List messages = (List) ((MorphDynaBean) ((MorphDynaBean) ((MorphDynaBean) bean.get("response")).get("feedMessageResponse")).get("messages")).get("message");
				MorphDynaBean message = (MorphDynaBean) messages.get(0);

				fresh = new Waypoint();
				fresh.setLat((Double) message.get("latitude"));
				fresh.setLng((Double) message.get("longitude"));
				fresh.setTime(new Date(((long) ((Integer) message.get("timeInSec"))*1000)));
			} catch (Exception e) {
				logger.error("Error checking SPOT ID " + resource.getSpotId(), e);
			}
			counter++;

			Waypoint stale = resource.getPosition();
			if(fresh != null && (stale == null || stale.getTime() == null || fresh.getTime().after(stale.getTime()))) {
				resource.setPosition(fresh);
				dao.save(resource);
			}
			lastRefreshed.put(resource.getPk(), new Date().getTime());
		}
		
	}
	
	public void doRun() {
		logger.info("Starting SPOT beacon checks for " + RuntimeProperties.getSearch() + " every " + Math.round(refreshInterval/1000) + " seconds");
		statusMessage = "Checking SPOT server every " + Math.round(refreshInterval/1000) + " seconds";

		while(enabled && !timedout()) {
			try {
				beginTransaction();
				List<Resource> resources = dao.loadAll(Resource.class);
				for(Resource resource : resources) {
					checkSpot(resource);
				}
				statusMessage = "Checking SPOT server every " + Math.round(refreshInterval/1000) + " seconds.\n";
				statusMessage += "Last check: " + counter + " beacons at " + new Date();
				counter = 0;
			} finally {
				closeTransaction();
			}
			try {
				sleep(30000);
			} catch (InterruptedException e) {
			}
		}
		
		if(timedout()) {
			logger.info("SPOT beacon checks for " + RuntimeProperties.getSearch() + " idled due to inactivity");
		} else {
			logger.info("SPOT beacon checks for " + RuntimeProperties.getSearch() + " stopped by user");
		}
	}

	public void setRefreshInterval(String refreshInterval) {
		if(refreshInterval == null || "".equals(refreshInterval)) return;
		this.refreshInterval = Long.parseLong(refreshInterval);
	}
	
}
