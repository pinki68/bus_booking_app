package com.busbooking.dto;

import lombok.Data;

@Data
public class BusSearchRequest {
    private String source;
    private String destination;
    private String date; // Format: YYYY-MM-DD
	public String getSource() {
		return source;
	}
	public void setSource(String source) {
		this.source = source;
	}
	public String getDestination() {
		return destination;
	}
	public void setDestination(String destination) {
		this.destination = destination;
	}
	public String getDate() {
		return date;
	}
	public void setDate(String date) {
		this.date = date;
	}
    
    
    
    
    
    
} 