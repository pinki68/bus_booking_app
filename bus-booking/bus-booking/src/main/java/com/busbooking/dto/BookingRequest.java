package com.busbooking.dto;

import java.util.List;

import lombok.Data;

@Data
public class BookingRequest {
	
    private Long busId;
    private Integer numberOfSeats;
    private List<PassengerRequest> passengers;
    private String contactEmail;
    private String contactPhone;
    
	public Long getBusId() {
		return busId;
	}
	public void setBusId(Long busId) {
		this.busId = busId;
	}
	public Integer getNumberOfSeats() {
		return numberOfSeats;
	}
	public void setNumberOfSeats(Integer numberOfSeats) {
		this.numberOfSeats = numberOfSeats;
	}
	public List<PassengerRequest> getPassengers() {
		return passengers;
	}
	public void setPassengers(List<PassengerRequest> passengers) {
		this.passengers = passengers;
	}
	public String getContactEmail() {
		return contactEmail;
	}
	public void setContactEmail(String contactEmail) {
		this.contactEmail = contactEmail;
	}
	public String getContactPhone() {
		return contactPhone;
	}
	public void setContactPhone(String contactPhone) {
		this.contactPhone = contactPhone;
	}
    
    
    
    
    
} 