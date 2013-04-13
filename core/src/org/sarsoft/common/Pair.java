package org.sarsoft.common;

public class Pair <T, U> {

	private final T first;
	private final U second;
	
	public Pair(T f, U s) {
		this.first = f;
		this.second = s;
	}
	
	public T getFirst() {
		return first;
	}
	
	public U getSecond() {
		return second;
	}

}

