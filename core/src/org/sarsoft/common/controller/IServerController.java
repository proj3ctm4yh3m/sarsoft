package org.sarsoft.common.controller;

import org.springframework.ui.Model;

public interface IServerController {

	public String getHeader();
	
	public boolean isTenantRestrictedPage(String view);
	
	public boolean isLoginRestrictedPage(String view);
	
	public String splash(Model model);
	
	public String bounce(Model model);
	
}
