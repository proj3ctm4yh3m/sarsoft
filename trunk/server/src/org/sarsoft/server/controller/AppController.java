package org.sarsoft.server.controller;

import java.util.List;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;

import org.sarsoft.common.controller.JSONBaseController;
import org.sarsoft.common.model.Tenant;
import org.sarsoft.common.model.UserAccount;
import org.sarsoft.common.model.Tenant.Permission;
import org.sarsoft.common.util.RuntimeProperties;
import org.sarsoft.markup.model.CollaborativeMap;
import org.sarsoft.markup.model.Marker;
import org.sarsoft.markup.model.Shape;
import org.sarsoft.plans.model.OperationalPeriod;
import org.sarsoft.plans.model.Search;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
public class AppController extends JSONBaseController {

	@RequestMapping(value="/login", method = RequestMethod.GET)
	public String login(Model model) {
		model.addAttribute("welcomeMessage", getProperty("sarsoft.welcomeMessage"));
		return app(model, "Pages.Splash");
	}

	@RequestMapping(value="/account.html", method = RequestMethod.GET)
	public String getAccount(Model model) {
		UserAccount account = dao.getByAttr(UserAccount.class, "name", RuntimeProperties.getUsername());
		if(account == null) {
			model.addAttribute("message", "Account not found");
			return bounce(model);
		}
		model.addAttribute("account", account);
		return app(model, "Pages.Account");
	}
	
	@RequestMapping(value="/account.html", method = RequestMethod.POST)
	public String updateAccount(Model model, @RequestParam(value="alias", required=false) String alias, @RequestParam(value="dest", required=false) String dest) {
		UserAccount account = dao.getByAttr(UserAccount.class, "name", RuntimeProperties.getUsername());
		if(account == null) {
			model.addAttribute("message", "Account not found");
			return bounce(model);
		}
		if(alias != null && alias.length() == 0) alias = null;
		if(alias != null && !alias.equalsIgnoreCase(account.getAlias())) {
			alias = alias.trim().replaceAll("\\s+", " ");
			alias = alias.replaceAll("[^a-zA-Z0-9_ ]", "");
			Object obj = dao.getByCaselessAttr(UserAccount.class, "alias", alias);
			if(obj != null) {
				model.addAttribute("message", "Username already taken");
				return getAccount(model);
			}
		}
		account.setAlias(alias);
		dao.superSave(account);
		model.addAttribute("account", account);
		if(dest != null) return "redirect:" + dest;
		return app(model, "Pages.Account");
	}
	
	@RequestMapping(value="/admin/delete", method = RequestMethod.GET)
	public String delete(Model model, @RequestParam("id") String id, HttpServletRequest request) {
		if(RuntimeProperties.getUserPermission() != Permission.ADMIN) {
			model.addAttribute("message", "You don't own this object, and therefore can't delete it.");
			return "redirect:/admin.html";
		}
		
		if(!id.equals(RuntimeProperties.getTenant())) {
			model.addAttribute("message", "Something seems to have gone wrong - it looks like you're trying to delete a different object than the one you're currently viewing.");
			return "redirect:/admin.html";
		}

		List<OperationalPeriod> l = dao.loadAll(OperationalPeriod.class);
		if(l != null && l.size() > 0) {
			model.addAttribute("message", "You must delete all operational periods before deleting this search.");
			return "redirect:/admin.html";
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

		String dest = request.getParameter("dest");
		if(dest != null) return "redirect:" + dest;
		
		if("org.sarsoft.plans.model.Search".equals(tenant.getClass().getName())) return "redirect:/searches";
		return "redirect:/maps";
	}
	
	@RequestMapping(value="/admin.html", method = RequestMethod.GET)
	public String getAdmin(Model model) {
		Tenant tenant = dao.getByAttr(Tenant.class, "name", RuntimeProperties.getTenant());

		if(RuntimeProperties.getUserPermission() != Permission.ADMIN) {
			model.addAttribute("message", "You don't own this object, and therefore can't edit it.");
			return "error";
		}

		model.addAttribute("tenant", tenant);
		model.addAttribute("hosted", isHosted());
		model.addAttribute("server", RuntimeProperties.getServerUrl());
		List<OperationalPeriod> l = dao.loadAll(OperationalPeriod.class);
		model.addAttribute("deleteable", (l == null || l.size() == 0) ? true : false);
		return app(model, "Pages.Admin");
	}

	@RequestMapping(value="/admin.html", method = RequestMethod.POST)
	public String updateAdmin(Model model, HttpServletRequest request) {
		Tenant tenant = null;
		if("map".equals(request.getParameter("type"))) {
			tenant = dao.getByAttr(CollaborativeMap.class, "name", RuntimeProperties.getTenant());
		} else {
			tenant = dao.getByAttr(Search.class, "name", RuntimeProperties.getTenant());
		}

		if(RuntimeProperties.getUserPermission() != Permission.ADMIN) {
			model.addAttribute("message", "You don't own this object, and therefore can't edit it.");
			return "error";
		}

		if(request.getParameter("description") != null && request.getParameter("description").length() > 0) {
			tenant.setDescription(request.getParameter("description"));
		}
		if(request.getParameter("comments") != null && request.getParameter("comments").length() > 0) {
			tenant.setComments(request.getParameter("comments"));
			dao.save(tenant);
		} else if(request.getParameter("allUsers") == null || request.getParameter("allUsers").length() == 0){
			tenant.setComments("");
		}
		dao.save(tenant);
		if(tenant.getAccount() != null && request.getParameter("allUsers") != null && request.getParameter("allUsers").length() > 0) {
			tenant.setShared(Boolean.valueOf(request.getParameter("shared")));
			tenant.setAllUserPermission(Permission.valueOf(request.getParameter("allUsers")));
			tenant.setPasswordProtectedUserPermission(Permission.valueOf(request.getParameter("passwordUsers")));
			if(request.getParameter("password") != null && request.getParameter("password").length() > 0) {
				tenant.setPassword(hash(request.getParameter("password")));
			}
			dao.save(tenant);
		}
		
		return "redirect:/" + ((tenant.getClass().getName() == "org.sarsoft.plans.model.Search") ? "setup" : "map?id=" + tenant.getName());
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

	@SuppressWarnings("unused")
	@RequestMapping(value="/maps", method = RequestMethod.GET)
	public String homePage(Model model, HttpServletRequest request) {
		String tenant = RuntimeProperties.getTenant();
		if(tenant != null) {
			// Pre-load map object so that it gets instantiated as a CollaborativeMap and not as a Tenant
			CollaborativeMap map = dao.getByAttr(CollaborativeMap.class, "name", tenant);
		}
		return app(model, "Pages.Maps");
	}

}
