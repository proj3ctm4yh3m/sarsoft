package org.sarsoft.common.util;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

public class Hash {

	private static byte[] sha1(String str) {
		try {
			MessageDigest d = MessageDigest.getInstance("SHA-1");
			d.reset();
			d.update(str.getBytes());
			return d.digest();
		} catch (NoSuchAlgorithmException e) {
			return null;
		}
	}
	
	public static String hash32(String str) {
		if(str == null) return null;
		byte[] bytes = sha1(str);
		if(bytes == null) return str;
		StringBuffer sb = new StringBuffer();
		for(byte b : bytes) {
			int i = b & 0xFF;
			if(i < 32) sb.append("0");
			sb.append(Integer.toString(i, 32));
		}
		return sb.toString().toUpperCase();
	}
	
	public static String hash(String password) {
		if(password == null) return null;
		StringBuffer sb = new StringBuffer();
		byte[] bytes = sha1(password);
		if(bytes == null) return password;
		for(byte b : bytes) {
			int i = b & 0xFF;
			if(i < 16) sb.append("0");
			sb.append(Integer.toHexString(i));
		}
		return sb.toString().toUpperCase();
	}	
	
}
