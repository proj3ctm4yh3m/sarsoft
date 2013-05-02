package org.sarsoft.common.util;

public class WebMercator {

	private static int tilesize = 256;
	private static double initialresolution = 2 * Math.PI * 6378137 / tilesize;
	private static double originshift = 2 * Math.PI * 6378137 / 2;
	
    public static double Resolution(int zoom) {
        return initialresolution / Math.pow(2, zoom);
    }
    
    public static int Zoom(double resolution) {
    	return (int) Math.round(Math.log(initialresolution / resolution) / Math.log(2));
    }

    public static double[] LatLngToMeters(double lat, double lng) {
        double mx = lng * originshift / 180;
        double my = Math.log(Math.tan((90 + lat) * Math.PI / 360)) / (Math.PI / 180);
        my = my * originshift / 180;
        return new double[] {mx, my};
	}
	
    public static double[] MetersToLatLng(double mx, double my) {
        double lng = (mx / originshift) * 180;
        double lat = (my / originshift) * 180;

        lat = 180 / Math.PI * (2 * Math.atan(Math.exp(lat * Math.PI / 180)) - Math.PI / 2);
        return new double[] {lat, lng};
	}
	
    public static double[] PixelsToMeters(double px, double py, int zoom) {
        double res = Resolution(zoom);
        double mx = px * res - originshift;
        double my = py * res - originshift;
        return new double[] {mx, my};
	}
	
    public static double[] MetersToPixels(double mx, double my, int zoom) {
        double res = Resolution(zoom);
        double px = (mx + originshift) / res;
        double py = (my + originshift) / res;
        return new double[] {px, py};
	}
	
    public static int[] PixelsToTile(double px, double py) {
        int tx = (int) Math.ceil(px / tilesize) - 1;
        int ty = (int) Math.ceil(py / tilesize) - 1;
        return new int[] {tx, ty};
	}
    
    public static double[] PixelsToDecimalTile(double px, double py) {
        double tx = (px / tilesize);
        double ty = (py / tilesize) - 1;
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
