package org.sarsoft.server.controller;

import java.util.HashMap;
import java.util.List;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;

import org.sarsoft.common.controller.AdminController;
import org.sarsoft.common.controller.JSONBaseController;
import org.sarsoft.common.json.JSONForm;
import org.sarsoft.common.model.Tenant;
import org.sarsoft.common.model.UserAccount;
import org.sarsoft.common.model.Tenant.Permission;
import org.sarsoft.common.util.RuntimeProperties;
import org.sarsoft.markup.model.CollaborativeMap;
import org.sarsoft.markup.model.Marker;
import org.sarsoft.markup.model.Shape;
import org.sarsoft.plans.model.OperationalPeriod;
import org.sarsoft.plans.model.Search;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
public class AppController extends JSONBaseController {
	
	@Autowired
	AdminController adminController;

	@RequestMapping(value="/rest/account", method = RequestMethod.GET)
	public String getAccount(Model model) {
		UserAccount account = dao.getByAttr(UserAccount.class, "name", RuntimeProperties.getUsername());
		if(account == null) {
			return json(model, new HashMap());
		}
		return json(model, account);
	}
	
	@RequestMapping(value="/rest/account", method = RequestMethod.POST)
	public String updateAccount(Model model, @RequestParam(value="alias", required=false) String alias) {
		UserAccount account = dao.getByAttr(UserAccount.class, "name", RuntimeProperties.getUsername());
		if(alias != null && alias.length() == 0) alias = null;
		if(alias != null && !alias.equalsIgnoreCase(account.getAlias())) {
			alias = alias.trim().replaceAll("\\s+", " ");
			alias = alias.replaceAll("[^a-zA-Z0-9_ ]", "");
			Object obj = dao.getByCaselessAttr(UserAccount.class, "alias", alias);
			if(obj == null) {
				account.setAlias(alias);
				dao.superSave(account);
			}
		}
		account = dao.getByAttr(UserAccount.class, "name", RuntimeProperties.getUsername());
		return json(model, account);
	}
	
	@RequestMapping(value="/rest/tenant/{id}", method = RequestMethod.DELETE)
	public String delete(Model model, HttpServletRequest request, @PathVariable("id") String id) {		
		if(RuntimeProperties.getUserPermission() != Permission.ADMIN) {
			return json(model, new HashMap()); // TODO communicate error condition
		}
		
		if(!id.equals(RuntimeProperties.getTenant())) {
			return json(model, new HashMap());
		}

		List<OperationalPeriod> l = dao.loadAll(OperationalPeriod.class);
		if(l != null && l.size() > 0) {
			model.addAttribute("message", "You must delete all operational periods before deleting this search.");
			return json(model, new HashMap());
		}
		
		dao.deleteAll(Marker.class);
		dao.deleteAll(Shape.class);
		
		Tenant tenant = dao.getByAttr(Tenant.class, "name", RuntimeProperties.getTenant());
		if(tenant.getAccount() != null) {
			UserAccount account = tenant.getAccount();
			account.getTenants().remove(tenant);
			tenant.setAccount(null);
			// will delete tenant as well due to delete_orphan cascade
			dao.save(account);
		} else {
			dao.delete(tenant);
		}
		RuntimeProperties.setTenant(null);
		request.getSession(true).removeAttribute("tenantid");

		return json(model, new HashMap());
	}

	@RequestMapping(value="/rest/tenant/{id}", method = RequestMethod.POST)
	public String updateAdmin(Model model, JSONForm params, HttpServletRequest request, @PathVariable("id") String id) {
		Tenant tenant = dao.getByAttr(Tenant.class, "name", RuntimeProperties.getTenant());

		if(RuntimeProperties.getUserPermission() != Permission.ADMIN) {
			return json(model, new HashMap()); // TODO communicate error condition
		}

		if(!id.equals(RuntimeProperties.getTenant())) {
			return json(model, new HashMap());
		}

		Tenant updated = new CollaborativeMap(params.JSON());
		if(updated.getAllUserPermission() == null) {
			tenant.setDescription(updated.getDescription());
			tenant.setComments(updated.getComments());
		} else if(tenant.getAccount() != null) {
			tenant.setShared(updated.getShared());
			tenant.setAllUserPermission(updated.getAllUserPermission());
			tenant.setPasswordProtectedUserPermission(updated.getPasswordProtectedUserPermission());
			if(updated.getPassword() != null) tenant.setPassword(adminController.hash(updated.getPassword()));
		}

		dao.save(tenant);
		tenant = dao.getByAttr(Tenant.class, "name", RuntimeProperties.getTenant());
		
		return json(model, tenant);
	}
	
	@RequestMapping(value="/map.html", method = RequestMethod.GET)
	public String showMap(Model model, HttpServletRequest request) {
		RuntimeProperties.setTenant(null);		
		HttpSession session = request.getSession(true);
		session.removeAttribute("tenantid");
		String clientState = (String) session.getAttribute("client_state");
		if(clientState != null) {
			request.getSession().removeAttribute("client_state");
			model.addAttribute("clientState", clientState);
		}
		return app(model, "/map");
	}

}
