package org.sarsoft.common.controller;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.OutputStream;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.ServletRequestDataBinder;
import org.springframework.web.bind.annotation.InitBinder;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.multipart.support.ByteArrayMultipartFileEditor;
import org.springframework.web.multipart.support.StringMultipartFileEditor;

@Controller
public class StaticUserContentController extends JSONBaseController {
	
	private static String USER_CONTENT_DIR = "sardata/usercontent/";

	@InitBinder
	public void initBinder(HttpServletRequest request, ServletRequestDataBinder binder) throws ServletException {
		binder.registerCustomEditor(String.class, new StringMultipartFileEditor());
		binder.registerCustomEditor(byte[].class, new ByteArrayMultipartFileEditor());
	}

	@RequestMapping(value="/resource/usercontent/{name}.{ext}", method=RequestMethod.GET)
	public void getUserContent(@PathVariable("name") String name, @PathVariable("ext") String ext, HttpServletResponse response) throws Exception {
		if(!Boolean.parseBoolean(getProperty("sarsoft.image.upload"))) return;
		name = name.replaceAll("\\.\\.", "").replaceAll("\\\\", "").replaceAll("/", "");
		
		if("png".equalsIgnoreCase(ext)) response.setContentType("image/png");
		if("jpg".equalsIgnoreCase(ext)) response.setContentType("image/jpeg");
		if("jpeg".equalsIgnoreCase(ext)) response.setContentType("image/jpeg");
		if("pdf".equalsIgnoreCase(ext)) response.setContentType("application/pdf");
		OutputStream out = response.getOutputStream();
		FileInputStream in = new FileInputStream(USER_CONTENT_DIR + name + (ext == null ? "" : "." + ext));
		byte[] bytes = new byte[512];
		while(true) {
			int len = in.read(bytes);
			if(len == -1) break;
			out.write(bytes, 0, len);
		}
	}
	
	@RequestMapping(value="/resource/usercontent", method=RequestMethod.POST)
	public String setUserContent(StaticUserContentForm params, HttpServletRequest request, HttpServletResponse response) throws Exception {
		if(!Boolean.parseBoolean(getProperty("sarsoft.image.upload"))) return null;

		File file = new File(USER_CONTENT_DIR);
		file.mkdirs();

		String name = params.getName().replaceAll("\\.\\.", "").replaceAll("\\\\", "").replaceAll("/", "");
		
		if(name.indexOf(".") == -1) name = name + ".txt";
		FileOutputStream out = new FileOutputStream(USER_CONTENT_DIR + name);
		
		ByteArrayInputStream in = new ByteArrayInputStream(params.getBinaryData());
		byte[] bytes = new byte[512];
		while(true) {
			int len = in.read(bytes);
			if(len == -1) break;
			out.write(bytes, 0, len);
		}
		
		out.close();
		
		return "redirect:/resource/usercontent/" + name;
	}
	
	@RequestMapping(value="/content", method = RequestMethod.GET)
	public String uploadContent(Model model) {
		if(!Boolean.parseBoolean(getProperty("sarsoft.image.upload"))) return null;
		
		File file = new File(USER_CONTENT_DIR);
		file.mkdirs();
		String[] files = file.list();
		model.addAttribute("files", files);
		return app(model, "Pages.Content");
	}

}
