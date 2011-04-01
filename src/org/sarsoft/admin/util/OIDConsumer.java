package org.sarsoft.admin.util;

import org.openid4java.consumer.ConsumerException;
import org.openid4java.consumer.ConsumerManager;
import org.openid4java.consumer.VerificationResult;
import org.openid4java.discovery.Identifier;
import org.openid4java.discovery.DiscoveryInformation;
import org.openid4java.message.ax.FetchRequest;
import org.openid4java.message.ax.FetchResponse;
import org.openid4java.message.ax.AxMessage;
import org.openid4java.message.*;
import org.openid4java.OpenIDException;

import javax.servlet.RequestDispatcher;
import javax.servlet.ServletException;
import javax.servlet.http.HttpSession;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.util.List;
import java.io.IOException;

public class OIDConsumer
{
    public ConsumerManager manager;
    public String server;

    public OIDConsumer(String server) throws ConsumerException
    {
        manager = new ConsumerManager();
        this.server = server;
    }

    // --- placing the authentication request ---
    public String authRequest(String userSuppliedString,
                              HttpServletRequest httpReq,
                              HttpServletResponse httpResp)
            throws Exception
    {
            String returnToUrl = server + "app/openidresponse";

            List discoveries = manager.discover(userSuppliedString);
            DiscoveryInformation discovered = manager.associate(discoveries);
            httpReq.getSession().setAttribute("openid-disc", discovered);
            AuthRequest authReq = manager.authenticate(discovered, returnToUrl);
            FetchRequest fetch = FetchRequest.createFetchRequest();
            fetch.addAttribute("email", "http://axschema.org/contact/email", true);
            authReq.addExtension(fetch);

        httpResp.sendRedirect(authReq.getDestinationUrl(true));
        return null;
    }

    public Identifier verifyResponse(HttpServletRequest httpReq) throws Exception {
            ParameterList response =
                    new ParameterList(httpReq.getParameterMap());

            DiscoveryInformation discovered = (DiscoveryInformation)
                    httpReq.getSession().getAttribute("openid-disc");

            // extract the receiving URL from the HTTP request
            StringBuffer receivingURL = httpReq.getRequestURL();
            String queryString = httpReq.getQueryString();
            if (queryString != null && queryString.length() > 0)
                receivingURL.append("?").append(httpReq.getQueryString());

            VerificationResult verification = manager.verify(
                    receivingURL.toString(),
                    response, discovered);

            Identifier verified = verification.getVerifiedId();
            if (verified != null)
            {
                AuthSuccess authSuccess =
                        (AuthSuccess) verification.getAuthResponse();

                if (authSuccess.hasExtension(AxMessage.OPENID_NS_AX))
                {
                    FetchResponse fetchResp = (FetchResponse) authSuccess
                            .getExtension(AxMessage.OPENID_NS_AX);

                    List emails = fetchResp.getAttributeValues("email");
                    String email = (String) emails.get(0);
                }

                return verified;
            }
        return null;
    }
}