package org.sarsoft.common.util;

import java.awt.AlphaComposite;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.net.URL;
import java.net.URLConnection;
import java.util.zip.ZipEntry;
import java.util.zip.ZipFile;

import javax.imageio.ImageIO;

import net.sf.ehcache.Cache;
import net.sf.ehcache.CacheManager;
import net.sf.ehcache.Element;

public class TileService {
	
	private String localTileStore = null;
	
	public TileService(String localTileStore) {
		if(localTileStore == null) localTileStore = RuntimeProperties.getProperty("sarsoft.map.localTileStore");
		this.localTileStore = localTileStore;
	}
	
	public InputStream getRemoteImageStream(String url) {
		Cache cache = CacheManager.getInstance().getCache("tileCache");

		byte[] array = null;
		Element element = cache.get(url);
		if(element != null) {
			return new ByteArrayInputStream((byte[]) element.getValue()); 
		}
		try {
			URLConnection connection = new URL(url).openConnection();
			InputStream in = connection.getInputStream();
			ByteArrayOutputStream out = new ByteArrayOutputStream(connection.getContentLength() == -1 ? 40000 : connection.getContentLength());
			byte[] bytes = new byte[512];
			while(true) {
				int len = in.read(bytes);
				if(len == -1) break;
				out.write(bytes, 0, len);
			}
			in.close();
			array = out.toByteArray();
			element = new Element(url, array);
			cache.put(element);
			return new ByteArrayInputStream(array);
		} catch (Exception e) {
		}
		return null;		
	}
	
	public InputStream getRemoteTileInputStream(String url, int z, int x, int y) {
		url = url.replaceAll("\\{Z\\}", Integer.toString(z));
		url = url.replaceAll("\\{X\\}", Integer.toString(x));
		url = url.replaceAll("\\{Y\\}", Integer.toString(y));
		url = url.replaceAll("\\{V\\}", "a-11111111");
		
		return getRemoteImageStream(url);
	}
	
	public InputStream getLocalTileInputStream(String layer, int z, int x, int y) {
		InputStream in = null;
		String tile =  layer + "/" + z + "/" + x + "/" + y + ".png";
		File file = new File(localTileStore + "/" + tile);
		if(file.exists()) {
			try {
				in = new FileInputStream(file);
			} catch (Exception e) {
				in = null;
			}
		}
		String parentDir = localTileStore;
		while(in == null && tile.contains("/")) {
			parentDir = parentDir + "/" + tile.substring(0, tile.indexOf("/"));
			tile = tile.substring(tile.indexOf("/") + 1);
			try {
				ZipFile zipFile = new ZipFile(parentDir + ".zip");
				ZipEntry entry = zipFile.getEntry(tile);
				in = zipFile.getInputStream(entry);
			} catch (Exception e) {
				in = null;
			}
		}
		return in;
	}

	public BufferedImage streamToImage(InputStream stream) {
		try {
			return ImageIO.read(stream);
		} catch (Exception e) {
			// missing overzoom tiles clutter the system log
		}
		return null;
	}

	public BufferedImage getTile(String url, int z, int x, int y) {
		if(url.indexOf("/resource/imagery/tiles/") == 0) {
			url = url.substring(24, url.length() - 16);
			return streamToImage(getLocalTileInputStream(url, z, x, y));
		} else if(url.indexOf("/") == 0) {
			url = "http://localhost:" + RuntimeProperties.getServerPort() + url;
			return streamToImage(getRemoteTileInputStream(url, z, x, y));
		} else {
			return streamToImage(getRemoteTileInputStream(url, z, x, y));
		}
	}

	public BufferedImage getTile(String url, int z, int x, int y, int max_z) {
		if(z <= max_z) {
			return getTile(url, z, x, y);
		} else {
			int dz = z - max_z;
			int pow = (int) Math.pow(2, dz);
			BufferedImage img = getTile(url, max_z, (int) Math.floor(x/pow), (int) Math.floor(y/pow));
			int dx = (x - pow * (int) Math.floor(x/pow));
			int dy = (y - pow * (int) Math.floor(y/pow));
			return zoom(img, dz, dx, dy);
		}
	}

	public BufferedImage zoom(BufferedImage original, int dz, int dx, int dy) {
		int tilesize = 256 / ((int) Math.pow(2, dz));
		BufferedImage zoomed = new BufferedImage(256, 256, BufferedImage.TYPE_4BYTE_ABGR);
		Graphics2D g = zoomed.createGraphics();
		g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_NEAREST_NEIGHBOR);
		g.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_SPEED);
		g.setBackground(new Color(255, 255, 255, 0));
		g.clearRect(0, 0, 256, 256);

		g.drawImage(original, 0, 0, 256, 256, dx*tilesize, dy*tilesize, (dx+1)*tilesize, (dy+1)*tilesize, null);
		return zoomed;
	}
	
	public BufferedImage composite(BufferedImage[] images, float[] opacity, int width, int height) {
		BufferedImage composited = new BufferedImage(width, height, BufferedImage.TRANSLUCENT);
		Graphics2D graphics = composited.createGraphics();
		graphics.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
		graphics.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
		graphics.setBackground(new Color(255, 255, 255, 0));
		graphics.clearRect(0, 0, width, height);
		for(int i = 0; i < images.length; i++) {
			graphics.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, opacity[i])); 
			graphics.drawImage(images[i], 0, 0, width, height, 0, 0, width, height, null);
		}
		return composited;
	}
	
}
