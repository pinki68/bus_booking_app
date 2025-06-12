package com.busbooking.dto;


import lombok.Data;
import java.util.Map;

@Data
public class PaymentRequest {
    private Long bookingId;
    private Double amount;
    private String method; // card, upi, netbanking, wallet, saved
    
    // For card payments
    private Map<String, String> card;
    
    // For UPI payments
    private Map<String, String> upi;
    
    // For net banking
    private Map<String, String> netbanking;
    
    // For wallet payments
    private Map<String, String> wallet;
    
    // For saved payment methods
    private Long savedMethodId;

	public Long getBookingId() {
		return bookingId;
	}

	public void setBookingId(Long bookingId) {
		this.bookingId = bookingId;
	}

	public Double getAmount() {
		return amount;
	}

	public void setAmount(Double amount) {
		this.amount = amount;
	}

	public String getMethod() {
		return method;
	}

	public void setMethod(String method) {
		this.method = method;
	}

	public Map<String, String> getCard() {
		return card;
	}

	public void setCard(Map<String, String> card) {
		this.card = card;
	}

	public Map<String, String> getUpi() {
		return upi;
	}

	public void setUpi(Map<String, String> upi) {
		this.upi = upi;
	}

	public Map<String, String> getNetbanking() {
		return netbanking;
	}

	public void setNetbanking(Map<String, String> netbanking) {
		this.netbanking = netbanking;
	}

	public Map<String, String> getWallet() {
		return wallet;
	}

	public void setWallet(Map<String, String> wallet) {
		this.wallet = wallet;
	}

	public Long getSavedMethodId() {
		return savedMethodId;
	}

	public void setSavedMethodId(Long savedMethodId) {
		this.savedMethodId = savedMethodId;
	}
    
    
    
    
    
    
    
    
    
} 
