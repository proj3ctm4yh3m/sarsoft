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
import java.io.IOException;
import java.io.InputStream;
import java.net.URL;
import java.util.zip.ZipEntry;
import java.util.zip.ZipFile;

import javax.imageio.ImageIO;

import org.sarsoft.common.model.MapSource;

import net.sf.ehcache.Cache;
import net.sf.ehcache.CacheManager;
import net.sf.ehcache.Element;

public class TileService {
	
	private String localTileStore = null;
	
	public TileService() {
		this(null);
	}
	
	public TileService(String localTileStore) {
		if(localTileStore == null) localTileStore = RuntimeProperties.getProperty("sarsoft.map.localTileStore");
		this.localTileStore = localTileStore;
	}
	
	private InputStream getRemoteImageStream(String url) {
		try {
			return new URL(url).openConnection().getInputStream();
		} catch (Exception e) {
			return null;
		}
	}
	
	private InputStream getLocalImageStream(String url) {
		InputStream in = null;
		File file = new File(localTileStore + "/" + url);
		if(file.exists()) {
			try {
				in = new FileInputStream(file);
			} catch (Exception e) {
				in = null;
			}
		}
		String parentDir = localTileStore;
		while(in == null && url.contains("/")) {
			parentDir = parentDir + "/" + url.substring(0, url.indexOf("/"));
			url = url.substring(url.indexOf("/") + 1);
			try {
				ZipFile zipFile = new ZipFile(parentDir + ".zip");
				ZipEntry entry = zipFile.getEntry(url);
				in = zipFile.getInputStream(entry);
			} catch (Exception e) {
				in = null;
			}
		}
		return in;
	}
	
	public BufferedImage getTile(MapSource source, String cfg, int z, int x, int y) {
		return getTile(source, cfg, z, x, y, true);
	}
	
	public BufferedImage getTile(MapSource source, String cfg, int z, int x, int y, boolean cache) {
		if(z > source.getMaxresolution()) {
			int dz = z - source.getMaxresolution();
			int pow = (int) Math.pow(2, dz);
			BufferedImage img = getTile(source, cfg, source.getMaxresolution(), (int) Math.floor(x/pow), (int) Math.floor(y/pow), cache);
			int dx = (x - pow * (int) Math.floor(x/pow));
			int dy = (y - pow * (int) Math.floor(y/pow));
			return zoom(img, dz, dx, dy);
		}
		
		String url = source.getTemplate().replaceAll("\\{Z\\}", Integer.toString(z)).replaceAll("\\{X\\}", Integer.toString(x)).replaceAll("\\{Y\\}", Integer.toString(y)).replaceAll("\\{V\\}", cfg);
		return getImage(url, cache);
	}
	
	public BufferedImage getImage(String url) {
		return getImage(url, true);
	}
	
	public BufferedImage getImage(String url, boolean cache) {
		Cache tilecache = CacheManager.getInstance().getCache("image");
		Element element = tilecache.get(url);
		if(element != null) return streamToImage(new ByteArrayInputStream((byte[]) element.getObjectValue()));
		
		InputStream stream = null;
		if(url.indexOf("/resource/imagery/tiles/") == 0) {
			stream = getLocalImageStream(url.substring(24, url.length() - 16));
		} else if(url.indexOf("/") == 0) {
			stream = getRemoteImageStream("http://localhost:" + RuntimeProperties.getServerPort() + url);
		} else {
			stream = getRemoteImageStream(url);
		}
		if(stream == null) return null;

		ByteArrayOutputStream out = new ByteArrayOutputStream();
		try {
			byte[] bytes = new byte[512];
			while(true) {
				int len = stream.read(bytes);
				if(len == -1) break;
				out.write(bytes, 0, len);
			}
			stream.close();
		} catch (IOException e) {
			return null;
		}
		 
		byte[] data = out.toByteArray();
		tilecache.put(new Element(url, data));
		return streamToImage(new ByteArrayInputStream(data));
	}

	private BufferedImage streamToImage(InputStream stream) {
		try {
			return ImageIO.read(stream);
		} catch (Exception e) {
			return null;
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
