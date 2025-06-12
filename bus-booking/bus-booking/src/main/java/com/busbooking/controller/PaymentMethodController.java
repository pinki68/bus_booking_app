package com.busbooking.controller;

import com.busbooking.dto.PaymentMethodRequest;
import com.busbooking.dto.PaymentMethodResponse;
import com.busbooking.entity.User;
import com.busbooking.service.PaymentMethodService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payment-methods")
public class PaymentMethodController {
    
    private static final Logger logger = LoggerFactory.getLogger(PaymentMethodController.class);

    @Autowired
    private PaymentMethodService paymentMethodService;

    @GetMapping
    public ResponseEntity<List<PaymentMethodResponse>> getUserPaymentMethods(@AuthenticationPrincipal User user) {
        if (user == null) {
            logger.error("Unauthorized access attempt to payment methods");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Collections.emptyList());
        }
        
        try {
            List<PaymentMethodResponse> paymentMethods = paymentMethodService.getUserPaymentMethods(user);
            return ResponseEntity.ok(paymentMethods);
        } catch (Exception e) {
            logger.error("Error fetching payment methods: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Collections.emptyList());
        }
    }

    @PostMapping
    public ResponseEntity<?> addPaymentMethod(
            @AuthenticationPrincipal User user,
            @RequestBody PaymentMethodRequest request) {
        if (user == null) {
            logger.error("Unauthorized access attempt to add payment method");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        try {
            PaymentMethodResponse paymentMethod = paymentMethodService.addPaymentMethod(user, request);
            return ResponseEntity.ok(paymentMethod);
        } catch (IllegalArgumentException e) {
            logger.error("Invalid payment method data: {}", e.getMessage());
            Map<String, String> response = new HashMap<>();
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        } catch (Exception e) {
            logger.error("Error adding payment method: {}", e.getMessage());
            Map<String, String> response = new HashMap<>();
            response.put("error", "Failed to add payment method. Please try again.");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updatePaymentMethod(
            @AuthenticationPrincipal User user,
            @PathVariable("id") Long paymentMethodId,
            @RequestBody PaymentMethodRequest request) {
        if (user == null) {
            logger.error("Unauthorized access attempt to update payment method");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        try {
            PaymentMethodResponse updated = paymentMethodService.updatePaymentMethod(user, paymentMethodId, request);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            logger.error("Invalid payment method data for update: {}", e.getMessage());
            Map<String, String> response = new HashMap<>();
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        } catch (RuntimeException e) {
            logger.error("Payment method update error: {}", e.getMessage());
            Map<String, String> response = new HashMap<>();
            response.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        } catch (Exception e) {
            logger.error("Error updating payment method: {}", e.getMessage());
            Map<String, String> response = new HashMap<>();
            response.put("error", "Failed to update payment method. Please try again.");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePaymentMethod(
            @AuthenticationPrincipal User user,
            @PathVariable("id") Long paymentMethodId) {
        if (user == null) {
            logger.error("Unauthorized access attempt to delete payment method");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        try {
            paymentMethodService.deletePaymentMethod(user, paymentMethodId);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            logger.error("Payment method deletion error: {}", e.getMessage());
            Map<String, String> response = new HashMap<>();
            response.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        } catch (Exception e) {
            logger.error("Error deleting payment method: {}", e.getMessage());
            Map<String, String> response = new HashMap<>();
            response.put("error", "Failed to delete payment method. Please try again.");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @PostMapping("/{id}/default")
    public ResponseEntity<?> setDefaultPaymentMethod(
            @AuthenticationPrincipal User user,
            @PathVariable("id") Long paymentMethodId) {
        if (user == null) {
            logger.error("Unauthorized access attempt to set default payment method");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        try {
            PaymentMethodResponse updated = paymentMethodService.setDefaultPaymentMethod(user, paymentMethodId);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            logger.error("Set default payment method error: {}", e.getMessage());
            Map<String, String> response = new HashMap<>();
            response.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        } catch (Exception e) {
            logger.error("Error setting default payment method: {}", e.getMessage());
            Map<String, String> response = new HashMap<>();
            response.put("error", "Failed to set default payment method. Please try again.");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
} 