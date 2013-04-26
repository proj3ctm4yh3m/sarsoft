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
				delete(new File(file.getAbsolutePath() + "/" + name));
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
		
		File script = new File(".sarsoft/hsqldb/searches.script");
		if(script.exists()) {
			System.out.println("\n\n*****\nDatabase file from an old (0.9 and lower) version found at .sarsoft/hsqldb/.\nYou will need to back these maps up to GPX using sarsoft 0.9 and then reimport them.\n*****\n\n");
		}

		System.out.println("Checking HSQLDB permissions for default location of sardata/db.* . . .");
		for(String suffix : new String[] { "script", "properties", "log" } ) {
			File file = new File("sardata/db." + suffix);
			if(file.exists()) {
				file.setReadable(true, false);
				file.setWritable(true, false);
			}
		}
		
		System.out.println("All Good.  Handing things over to Winstone.");
		
		Launcher.main(args);
	}
}
