package org.sarsoft.ops.model;

import java.io.IOException;
import java.util.Date;
import java.util.List;

import javax.persistence.Entity;
import javax.persistence.Transient;

import net.sf.ezmorph.bean.MorphDynaBean;
import net.sf.json.JSONObject;
import net.sf.json.JSONSerializer;

import org.sarsoft.common.model.Waypoint;

import com.google.api.client.auth.oauth.OAuthAuthorizeTemporaryTokenUrl;
import com.google.api.client.auth.oauth.OAuthCredentialsResponse;
import com.google.api.client.auth.oauth.OAuthHmacSigner;
import com.google.api.client.auth.oauth.OAuthParameters;
import com.google.api.client.googleapis.GoogleTransport;
import com.google.api.client.googleapis.auth.oauth.GoogleOAuthGetAccessToken;
import com.google.api.client.googleapis.auth.oauth.GoogleOAuthGetTemporaryToken;
import com.google.api.client.googleapis.json.JsonCParser;
import com.google.api.client.http.HttpRequest;
import com.google.api.client.http.HttpTransport;

@Entity
public class LatitudeDevice extends LocationEnabledDevice {

	  public OAuthHmacSigner signer = new OAuthHmacSigner();
	  public OAuthCredentialsResponse credentials;
	  public HttpTransport transport = GoogleTransport.create();
	  public boolean authed = false;
	  private String domain;
	  public static String clientSharedSecret = null;

	  public LatitudeDevice() {
		  transport.addParser(new JsonCParser());
		  signer.clientSharedSecret = clientSharedSecret;
	  }

	public String getDomain() {
		return domain;
	}

	public void setDomain(String domain) {
		this.domain = domain;
	}

	public String createAuthUrl(String callbackUrl, String domain, String appName) throws Exception {
		setDomain(domain);

		GoogleOAuthGetTemporaryToken temporaryToken = new GoogleOAuthGetTemporaryToken();
		temporaryToken.signer = signer;
		temporaryToken.consumerKey = domain;
		temporaryToken.scope = "https://www.googleapis.com/auth/latitude";
		temporaryToken.displayName = appName;
		temporaryToken.callback = callbackUrl;
		OAuthCredentialsResponse tempCredentials = temporaryToken.execute();
		setDeviceKey(tempCredentials.tokenSecret);
		signer.tokenSharedSecret = getDeviceKey();

		OAuthAuthorizeTemporaryTokenUrl authorizeUrl = new OAuthAuthorizeTemporaryTokenUrl("https://www.google.com/latitude/apps/OAuthAuthorizeToken");
		authorizeUrl.put("domain", domain);
		authorizeUrl.put("location", "all");
		authorizeUrl.put("granularity", "best");
		authorizeUrl.temporaryToken = tempCredentials.token;
		return authorizeUrl.build();
	}

	public void handleAuthRequest(String requestToken, String verifier) throws IOException {

		GoogleOAuthGetAccessToken accessToken = new GoogleOAuthGetAccessToken();
		signer.tokenSharedSecret = getDeviceKey();
		accessToken.temporaryToken = requestToken;
		accessToken.signer = signer;
		accessToken.consumerKey = getDomain();
		accessToken.verifier = verifier;
		OAuthCredentialsResponse credentials = accessToken.execute();
		setDeviceId(credentials.token);
		setDeviceKey(credentials.tokenSecret);

		initialize();
		checkLocation();
	}

	protected void initialize() {
		authed = false;
		try {
			signer.tokenSharedSecret = getDeviceKey();

			OAuthParameters authorizer = new OAuthParameters();
			authorizer.consumerKey = "http://mattj.net/";
			authorizer.signer = signer;
			authorizer.token = getDeviceId();
			authorizer.signRequestsUsingAuthorizationHeader(transport);

			authed = true;
		} catch (Throwable t) {
			// authed already false
			t.printStackTrace();
		}
	}

	public Waypoint checkLocation() {
		try {
		if(!authed) initialize();
		HttpRequest request = transport.buildGetRequest();
		request.setUrl("https://www.googleapis.com/latitude/v1/location?granularity=best");
		String json = request.execute().parseAsString();

		MorphDynaBean bean = (MorphDynaBean) JSONObject.toBean((JSONObject) JSONSerializer.toJSON(json));
		bean = (MorphDynaBean) bean.get("data");
		List beans = (List) bean.get("items");
		bean = (MorphDynaBean) beans.get(0);

		Waypoint wpt = new Waypoint();
		wpt.setLat((Double) bean.get("latitude"));
		wpt.setLng((Double) bean.get("longitude"));
		wpt.setTime(new Date(Long.parseLong((String) bean.get("timestampMs"))));

		return wpt;
		} catch (Exception e) {
			e.printStackTrace();
			return null;
		}
	}

}
