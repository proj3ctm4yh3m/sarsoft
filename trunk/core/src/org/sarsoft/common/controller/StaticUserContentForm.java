package org.sarsoft.common.controller;

public class StaticUserContentForm {

	private byte[] binaryData;
	private String name;

	public void setBinaryData(byte[] binaryData) {
		this.binaryData = binaryData;
	}
	
	public byte[] getBinaryData() {
		return binaryData;
	}
	
	public String getName() {
		return name;
	}
	
	public void setName(String name) {
		this.name = name;
	}

}
