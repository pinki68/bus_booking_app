package com.busbooking.dto;

import lombok.Data;
import java.util.List;

@Data
public class PassengerRequest {
	
    private String name;
    private Integer age;
    private String gender;
    private String seatNumber;
    private String documentType;
    private String documentNumber;
    private List<String> seatPreferences;
    private String specialRequests;
    
	public String getName() {
		return name;
	}
	public void setName(String name) {
		this.name = name;
	}
	public Integer getAge() {
		return age;
	}
	public void setAge(Integer age) {
		this.age = age;
	}
	public String getGender() {
		return gender;
	}
	public void setGender(String gender) {
		this.gender = gender;
	}
	public String getSeatNumber() {
		return seatNumber;
	}
	public void setSeatNumber(String seatNumber) {
		this.seatNumber = seatNumber;
	}
	public String getDocumentType() {
		return documentType;
	}
	public void setDocumentType(String documentType) {
		this.documentType = documentType;
	}
	public String getDocumentNumber() {
		return documentNumber;
	}
	public void setDocumentNumber(String documentNumber) {
		this.documentNumber = documentNumber;
	}
	public List<String> getSeatPreferences() {
		return seatPreferences;
	}
	public void setSeatPreferences(List<String> seatPreferences) {
		this.seatPreferences = seatPreferences;
	}
	public String getSpecialRequests() {
		return specialRequests;
	}
	public void setSpecialRequests(String specialRequests) {
		this.specialRequests = specialRequests;
	}
    
    
    
    
    
    
    
    
    
    
    
    
    
    
} 