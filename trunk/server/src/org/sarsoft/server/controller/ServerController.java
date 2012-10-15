package org.sarsoft.server.controller;

import java.io.BufferedReader;
import java.io.FileReader;
import java.util.ArrayList;
import java.util.List;

import javax.servlet.ServletContext;

import org.sarsoft.common.controller.IServerController;
import org.sarsoft.common.controller.JSONBaseController;
import org.sarsoft.common.dao.GenericHibernateDAO;
import org.sarsoft.common.model.Tenant;
import org.sarsoft.common.model.UserAccount;
import org.sarsoft.common.util.RuntimeProperties;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;

@Controller
public class ServerController implements IServerController {

	protected String welcomeHTML;

	@Autowired
	protected ServletContext context;

	@Autowired
	@Qualifier("genericDAO")
	protected GenericHibernateDAO dao;

	@Value("${sarsoft.hosted}")
	String hosted;

	public String getHeader() {
		return "<script src=\"/static/js/common.js\"></script>\n" +
		"<script src=\"/static/js/maps.js\"></script>\n" +
		"<script src=\"/static/js/plans.js\"></script>\n" +
		"<script src=\"/static/js/ops.js\"></script>\n" +
		"<script src=\"/static/js/markup.js\"></script>\n" +
		"<link rel=\"stylesheet\" type=\"text/css\" href=\"/static/css/yui.css\"/>\n" +
		"<link rel=\"stylesheet\" type=\"text/css\" href=\"/static/css/AppBase.css\"/>\n";
	}
	
	public boolean isTenantRestrictedPage(String view) {
		return !("/map".equals(view) || "Pages.Maps".equals(view) || "Pages.Searches".equals(view) || "Pages.Tools".equals(view) || "Pages.Splash".equals(view) || "Pages.Account".equals(view) || "Pages.Find".equals(view));
	}

	public boolean isLoginRestrictedPage(String view) {
		return ("Pages.Maps".equals(view) || "Pages.Searches".equals(view));
	}

	public String bounce(Model model) {
		boolean isHosted = "true".equalsIgnoreCase(hosted);
		String user = RuntimeProperties.getUsername();
		UserAccount account = null;
		if(user != null) account = dao.getByPk(UserAccount.class, user);
		List<Tenant> tenants = new ArrayList<Tenant>();
		if(isHosted) {
			if(account != null) {
				model.addAttribute("account", account);
				if(account.getTenants() != null) tenants.addAll(account.getTenants());
			}
		} else {
			tenants = dao.getAllTenants();
		}
		model.addAttribute("tenants", tenants);
		model.addAttribute("welcomeMessage", getProperty("sarsoft.welcomeMessage"));

		String objects = getProperty("sarsoft.objects");
		if(objects == null) objects = "map,search";
		model.addAttribute("objects", objects);
		
		if(model.asMap().containsKey("targetDest")) return "Pages.Password";
		if(isHosted && account == null) return splash(model);
		
		return "Pages.Maps";
	}

	public String splash(Model model) {
		if(RuntimeProperties.getProperty("sarsoft.ui.welcome.html") != null) {
			if(welcomeHTML == null) synchronized(this) {
				try {
					StringBuffer fileData = new StringBuffer(1000);
					BufferedReader reader = new BufferedReader(new FileReader(RuntimeProperties.getProperty("sarsoft.ui.welcome.html")));
					char[] buf = new char[1024];
					int numRead=0;
					while((numRead=reader.read(buf)) != -1){
						String readData = String.valueOf(buf, 0, numRead);
						fileData.append(readData);
						buf = new char[1024];
					}
					reader.close();
					welcomeHTML = fileData.toString();
		        	} catch (Exception e) {}
			}
			model.addAttribute("welcomeHTML", welcomeHTML);
		}
		model.addAttribute("welcomeMessage", getProperty("sarsoft.welcomeMessage"));
		return "Pages.Splash";
	}
	
	protected String getProperty(String name) {
		if(!RuntimeProperties.isInitialized()) RuntimeProperties.initialize(context);
		return RuntimeProperties.getProperty(name);
	}

	
}
