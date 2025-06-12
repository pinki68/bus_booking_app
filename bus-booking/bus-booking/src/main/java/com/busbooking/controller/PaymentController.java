package com.busbooking.controller;

import com.busbooking.dto.PaymentRequest;
import com.busbooking.dto.PaymentResponse;
import com.busbooking.entity.User;
import com.busbooking.service.BookingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Controller
public class PaymentController {
    
    private static final Logger logger = LoggerFactory.getLogger(PaymentController.class);
    
    @Autowired
    private BookingService bookingService;

    /**
     * Shows the payment page for a specific booking
     */
    @GetMapping("/payment/{bookingId}")
    public String showPaymentPage(@PathVariable Long bookingId, Model model) {
        logger.info("Showing payment page for booking ID: {}", bookingId);
        model.addAttribute("bookingId", bookingId);
        return "payment";
    }

    /**
     * REST endpoint for processing payments
     */
    @PostMapping("/api/payments")
    @ResponseBody
    public ResponseEntity<PaymentResponse> processPayment(
            @AuthenticationPrincipal User user,
            @RequestBody PaymentRequest paymentRequest) {
        
        logger.info("Processing payment for booking ID: {}", paymentRequest.getBookingId());
        
        if (user == null) {
            logger.error("Payment attempt without authentication");
            return ResponseEntity.status(401).build();
        }
        
        // In a real application, this would integrate with a payment gateway
        // Here we'll just simulate a successful payment
        
        try {
            // Verify the booking belongs to the user
            Long bookingId = paymentRequest.getBookingId();
            
            // Optional: validate that the booking exists and belongs to this user
            // This could throw exceptions if validation fails
            validateBookingOwnership(user, bookingId);
            
            // Create a response
            PaymentResponse response = new PaymentResponse();
            response.setTransactionId("TXN" + System.currentTimeMillis());
            response.setBookingId(paymentRequest.getBookingId());
            response.setAmount(paymentRequest.getAmount());
            response.setStatus("SUCCESS");
            response.setPaymentMethod(paymentRequest.getMethod());
            response.setTimestamp(System.currentTimeMillis());
            
            logger.info("Payment successful for booking ID: {}", bookingId);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Payment processing error: {}", e.getMessage());
            PaymentResponse errorResponse = new PaymentResponse();
            errorResponse.setStatus("FAILED");
            errorResponse.setErrorMessage(e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
    
    /**
     * Validates that a booking belongs to the authenticated user
     */
    private void validateBookingOwnership(User user, Long bookingId) {
        try {
            // Get the booking and check if it belongs to this user
            // This is a simplified version - you would typically call a service method
            // to do the actual validation
            boolean isValidBooking = bookingService.getBookingById(bookingId).getUserId().equals(user.getId());
            
            if (!isValidBooking) {
                throw new RuntimeException("Booking does not belong to the authenticated user");
            }
        } catch (Exception e) {
            throw new RuntimeException("Invalid booking ID or unauthorized access");
        }
    }
} 