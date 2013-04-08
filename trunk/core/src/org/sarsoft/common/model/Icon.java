package org.sarsoft.common.model;

import java.util.HashMap;
import java.util.Map;

public class Icon {
	
	public static Map<String, Icon> byname = new HashMap<String, Icon>();
	private static int max_offset = 0;
	
	private String name;
	private int[] size;
	private double[] anchor;
	private int offset;
	
	static void build(String name) {
		byname.put(name, new Icon(name, max_offset));
		max_offset++;
	}
	
	static void build(String name, int width, int height, double anchor_x, double anchor_y) {
		byname.put(name, new Icon(name, width, height, max_offset, anchor_x, anchor_y));
		max_offset++;
	}

	static {
		build("arr-sw");
		build("arr-w");
		build("arr-nw");
		build("arr-n");
		build("arr-ne");
		build("arr-e");
		build("arr-se");
		build("arr-s");
		build("nps-ski");
		build("nps-xc");
		build("nps-skate");
		build("nps-climbing");
		build("nps-scramble");
		build("nps-caving");
		build("nps-diving");
		build("nps-canoe");
		build("nps-roadbike");
		build("nps-dirtbike");
		build("nps-4wd");
		build("nps-snowmobile");
		build("nps-camera");
		build("nps-parking");
		build("nps-lookout");
		build("nps-lighthouse");
		build("nps-info");
		build("nps-phone");
		build("nps-gas");
		build("nps-firstaid");
		build("nps-fire");
		build("nps-shower");
		build("nps-anchor");
		build("nps-rockfall");
		build("nps-slip");
		build("nps-shelter");
		build("nps-picnic");
		build("nps-water");
		build("skiing");
		build("xc");
		build("walking");
		build("snowshoe");
		build("climbing");
		build("spelunking");
		build("windsurf");
		build("snorkel");
		build("hunting");
		build("mountainbike");
		build("bike");
		build("motorbike");
		build("car");
		build("snowmobile");
		build("camera");
		build("cp");
		build("clue");
		build("warning");
		build("crossbones");
		build("antenna");
		build("avy1");
		build("binoculars");
		build("fire");
		build("flag", 20, 20, 0.2, 1);
		build("plus");
		build("rescue");
		build("tent");
		build("waterfall");
		build("wetland");
		build("harbor");
		build("rocks");
		build("shelter");
		build("picnic");
		build("drinkingwater");
		build("target");
		build("circle");
	}
	
	public Icon(String name, int offset) {
		this(name, 20, 20, offset, 0.5, 0.5);
	}
	
	public Icon(String name, int width, int height, int offset, double anchor_x, double anchor_y) {
		this.name = name;
		this.size = new int[] { width, height };
		this.offset = offset;
		this.anchor = new double[] { anchor_x, anchor_y };
	}
	
	public int[] getSize() {
		return size;
	}
	
	public double[] getAnchor() {
		return anchor;
	}
	
	public int getOffset() {
		return offset;
	}
	
	public String getName() { 
		return name;
	}
	
}
