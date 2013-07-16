package sarsoft;

import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
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

		String tmpname = System.getProperty("java.io.tmpdir") + "winstoneEmbeddedWAR/";
		File tmpdir = new File(tmpname);
		if(tmpdir.exists()) {
			delete(tmpdir);
		}
		
		File script = new File(".sarsoft/hsqldb/searches.script");
		if(script.exists()) {
			System.out.println("\n*****\nDatabase file from an old (0.9 and lower) version found at .sarsoft/hsqldb/.\nYou will need to back these maps up to GPX using sarsoft 0.9 and then reimport them.\n*****\n");
		}

		for(String suffix : new String[] { "script", "properties", "log" } ) {
			File file = new File("sardata/db." + suffix);
			if(file.exists()) {
				file.setReadable(true, false);
				file.setWritable(true, false);
			}
		}
		
		try {
			BufferedReader in = new BufferedReader(new InputStreamReader(Loader.class.getClassLoader().getResourceAsStream("welcome.txt")));
			String line;
			while((line = in.readLine()) != null) System.out.println(line);
			in.close();
		} catch (Exception e) {
		}
		
		System.out.println("All good, launching server.  Unless you've specified a different port, point your browser at http://" + host.getHostName() + ":8080/ or http://" + host.getHostAddress() + ":8080/\n\n");
		
		Launcher.main(args);
	}
}
