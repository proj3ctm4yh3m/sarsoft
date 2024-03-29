package org.sarsoft.common.util;

public class WebMercator {
	
	private static int tilesize = 256;
	private static double initialresolution = 2 * Math.PI * 6378137 / tilesize;
	private static double originshift = 2 * Math.PI * 6378137 / 2;
	private static double deg_originshift = originshift / 180;
	private static double[] resolutions = new double[32];
	
	static {
		for(int i = 0; i < 32; i++) {
			resolutions[i] = initialresolution / Math.pow(2, i);
		}
	}
	
    public static double Resolution(int zoom) {
    	return resolutions[zoom];
    }
    
    public static int Zoom(double resolution) {
//    	for(int i = 0; i < 31; i++) {
//    		if(resolution >= resolutions[i]) return (resolution/resolutions[i]) < 1.5 ? i : i+1;
//    	}
    	return (int) Math.round(Math.log(initialresolution / resolution) / Math.log(2));
    }

    public static double[] LatLngToMeters(double lat, double lng) {
        double mx = lng * deg_originshift;
        double my = Math.log(Math.tan((90 + lat) * Math.PI / 360)) / (Math.PI / 180);
        my = my * originshift / 180;
        return new double[] {mx, my};
	}
	
    public static double[] MetersToLatLng(double mx, double my) {
        double lng = mx / deg_originshift;
        double lat = my / deg_originshift;

        lat = 180 / Math.PI * (2 * Math.atan(Math.exp(lat * Math.PI / 180)) - Math.PI / 2);
        return new double[] {lat, lng};
	}
	
    public static double[] PixelsToMeters(double px, double py, int zoom) {
        return new double[] {px * resolutions[zoom] - originshift, py * resolutions[zoom] - originshift};
	}
	
    public static double[] MetersToPixels(double mx, double my, int zoom) {
        return new double[] {(mx + originshift) / resolutions[zoom], (my + originshift) / resolutions[zoom]};
	}
	
    public static int[] PixelsToTile(double px, double py) {
        int tx = (int) Math.floor(px / tilesize);
        int ty = (int) Math.floor(py / tilesize);
        return new int[] {tx, ty};
	}
    
    public static double[] PixelsToDecimalTile(double px, double py) {
        double tx = (px / tilesize);
        double ty = (py / tilesize);
        return new double[] {tx, ty};
    }
	
    public static double[] TileBounds(int tx, int ty, int zoom) {
        double[] min = PixelsToMeters(tx*tilesize, ty*tilesize, zoom);
        double[] max = PixelsToMeters((tx+1)*tilesize, (ty+1)*tilesize, zoom);
        return new double[] {min[0], min[1], max[0], max[1]};
	}
	
    public static double[] TileLatLngBounds(int tx, int ty, int zoom) {
		double[] bounds = TileBounds(tx, ty, zoom);
		double[] min = MetersToLatLng(bounds[0], bounds[1]);
		double[] max = MetersToLatLng(bounds[2], bounds[3]);
		return new double[] { min[0], min[1], max[0], max[1]};
	}
	
    public static int[] GoogleTile(int tx, int ty, int zoom) {
		return new int[] {tx, ((int) Math.pow(2, zoom)) - 1 - ty};
	}
    
    public static int GoogleY(int y, int z) {
    	return ((int) Math.pow(2, z)) - 1 - y;
    }
    
    public static int[] MetersToTile(double mx, double my, int zoom) {
    	double[] pixels = MetersToPixels(mx, my, zoom);
    	int[] tile = PixelsToTile(pixels[0], pixels[1]);
    	return new int[] {tile[0], tile[1], (int) pixels[0] - (tile[0] * tilesize), (int) pixels[1] - (tile[1] * tilesize)};
    }
    
    public static int[] getParentTile(int tx, int ty, int dz) {
		int pow = (int) Math.pow(2, dz);
		int px = (int) Math.floor(tx/pow);
		int py = (int) Math.floor(ty/pow);
		int dx = (tx - pow * px);
		int dy = (ty - pow * py);
    	return new int[] { px, py, dx, dy };
    }
    
    public static double getScaleFactor(double my) {
        double lat = (my / originshift) * Math.PI;
        lat = (2 * Math.atan(Math.exp(lat)) - Math.PI / 2);
        return Math.cos(lat);
    }
}


/*

    def PixelsToRaster(self, px, py, zoom):
        "Move the origin of pixel coordinates to top-left corner"
        
        mapSize = self.tileSize << zoom
        return px, mapSize - py
        
    def MetersToTile(self, mx, my, zoom):
        "Returns tile for given mercator coordinates"
        
        px, py = self.MetersToPixels( mx, my, zoom)
        return self.PixelsToTile( px, py)
        
        
    def ZoomForPixelSize(self, pixelSize ):
        "Maximal scaledown zoom of the pyramid closest to the pixelSize."
        
        for i in range(MAXZOOMLEVEL):
            if pixelSize > self.Resolution(i):
                if i!=0:
                    return i-1
                else:
                    return 0 # We don't want to scale up
        
    def GoogleTile(self, tx, ty, zoom):
        "Converts TMS tile coordinates to Google Tile coordinates"
        
        # coordinate origin is moved from bottom-left to top-left corner of the extent
        return tx, (2**zoom - 1) - ty
        */
