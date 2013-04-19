package sarsoft;

import java.io.File;
import java.io.IOException;
import java.net.Inet4Address;
import java.net.InetAddress;

import winstone.Launcher;

public class Loader {

	public static void delete(File file) throws IOException {
		if(file.isDirectory() && file.list().length > 0){
			String files[] = file.list();
			for (String name : files) {
				delete(new File(name));
			}
		}
		file.delete();
	}
	
	public static void main(String[] args) throws IOException {
		InetAddress host = Inet4Address.getLocalHost();
		System.out.println("Launching Sarsoft on " + host.getHostName() + " / " + host.getHostAddress() + " . . .");

		String tmpname = System.getProperty("java.io.tmpdir") + "winstoneEmbeddedWAR/";
		File tmpdir = new File(tmpname);
		if(tmpdir.exists()) {
			System.out.println("Clearing Winstone TMP directory " + tmpname + " . . .");
			delete(tmpdir);
		}
				
		System.out.println("Checking HSQLDB permissions for default location of .sarsoft/hsqldb/ . . .");
		for(String suffix : new String[] { "script", "properties", "log" } ) {
			File file = new File(".sarsoft/hsqldb/searches." + suffix);
			if(file.exists()) {
				file.setReadable(true, false);
				file.setWritable(true, false);
			}
		}
		
		System.out.println("All Good.  Handing things over to Winstone.");
		
		Launcher.main(args);
	}
}
