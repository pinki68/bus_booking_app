package com.busbooking.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
//@NoArgsConstructor
@AllArgsConstructor
public class MessageResponse {
    
	private String message;

	
	 // Explicit constructor for the message parameter
    public MessageResponse(String message) {
        this.message = message;
    }
	public String getMessage() {
		return message;
	}

	public void setMessage(String message) {
		this.message = message;
	}
    
    
    
} 
