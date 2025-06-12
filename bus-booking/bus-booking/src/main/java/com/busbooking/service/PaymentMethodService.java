package com.busbooking.service;

import com.busbooking.dto.PaymentMethodRequest;
import com.busbooking.dto.PaymentMethodResponse;
import com.busbooking.entity.PaymentMethod;
import com.busbooking.entity.User;
import com.busbooking.repository.PaymentMethodRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class PaymentMethodService {

    @Autowired
    private PaymentMethodRepository paymentMethodRepository;

    public List<PaymentMethodResponse> getUserPaymentMethods(User user) {
        List<PaymentMethod> paymentMethods = paymentMethodRepository.findByUserAndIsActiveTrue(user);
        return paymentMethods.stream()
                .map(this::convertToPaymentMethodResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public PaymentMethodResponse addPaymentMethod(User user, PaymentMethodRequest request) {
        // Validate required fields
        validatePaymentMethodRequest(request);
        
        PaymentMethod paymentMethod = new PaymentMethod();
        paymentMethod.setUser(user);
        paymentMethod.setType(request.getType());
        paymentMethod.setCardNumber(maskCardNumber(request.getCardNumber()));
        paymentMethod.setCardHolderName(request.getCardHolderName());
        paymentMethod.setExpiryDate(request.getExpiryDate());
        paymentMethod.setNickname(request.getNickname() != null ? request.getNickname() : "");
        paymentMethod.setActive(true);
        
        // If this is set as default, unset any existing default
        if (request.isDefault()) {
            setAsDefault(user, paymentMethod);
        } else {
            paymentMethod.setDefault(false);
        }
        
        paymentMethod = paymentMethodRepository.save(paymentMethod);
        return convertToPaymentMethodResponse(paymentMethod);
    }

    @Transactional
    public PaymentMethodResponse updatePaymentMethod(User user, Long paymentMethodId, PaymentMethodRequest request) {
        if (paymentMethodId == null) {
            throw new IllegalArgumentException("Payment method ID is required");
        }
        
        // Validate required fields
        validatePaymentMethodRequest(request);
        
        PaymentMethod paymentMethod = getPaymentMethodById(paymentMethodId);
        
        // Verify ownership
        if (!paymentMethod.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Payment method does not belong to user");
        }
        
        paymentMethod.setType(request.getType());
        paymentMethod.setCardHolderName(request.getCardHolderName());
        paymentMethod.setExpiryDate(request.getExpiryDate());
        paymentMethod.setNickname(request.getNickname() != null ? request.getNickname() : "");
        
        // If this is set as default, unset any existing default
        if (request.isDefault() && !paymentMethod.isDefault()) {
            setAsDefault(user, paymentMethod);
        } else if (!request.isDefault() && paymentMethod.isDefault()) {
            // Cannot unset the default payment method if it's the only one
            List<PaymentMethod> activeMethods = paymentMethodRepository.findByUserAndIsActiveTrue(user);
            if (activeMethods.size() > 1) {
                paymentMethod.setDefault(false);
            }
        }
        
        paymentMethod = paymentMethodRepository.save(paymentMethod);
        return convertToPaymentMethodResponse(paymentMethod);
    }

    @Transactional
    public void deletePaymentMethod(User user, Long paymentMethodId) {
        PaymentMethod paymentMethod = getPaymentMethodById(paymentMethodId);
        
        // Verify ownership
        if (!paymentMethod.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Payment method does not belong to user");
        }
        
        // If this is the default payment method and there are others, set another one as default
        if (paymentMethod.isDefault()) {
            List<PaymentMethod> activeMethods = paymentMethodRepository.findByUserAndIsActiveTrue(user);
            if (activeMethods.size() > 1) {
                for (PaymentMethod otherMethod : activeMethods) {
                    if (!otherMethod.getId().equals(paymentMethodId)) {
                        otherMethod.setDefault(true);
                        paymentMethodRepository.save(otherMethod);
                        break;
                    }
                }
            }
        }
        
        // Soft delete
        paymentMethod.setActive(false);
        paymentMethodRepository.save(paymentMethod);
    }

    @Transactional
    public PaymentMethodResponse setDefaultPaymentMethod(User user, Long paymentMethodId) {
        PaymentMethod paymentMethod = getPaymentMethodById(paymentMethodId);
        
        // Verify ownership
        if (!paymentMethod.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Payment method does not belong to user");
        }
        
        setAsDefault(user, paymentMethod);
        paymentMethod = paymentMethodRepository.save(paymentMethod);
        return convertToPaymentMethodResponse(paymentMethod);
    }

    private PaymentMethod getPaymentMethodById(Long id) {
        return paymentMethodRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Payment method not found with id: " + id));
    }

    private void setAsDefault(User user, PaymentMethod newDefault) {
        // Find current default and unset it
        PaymentMethod currentDefault = paymentMethodRepository.findByUserAndIsDefaultTrue(user);
        if (currentDefault != null && !currentDefault.getId().equals(newDefault.getId())) {
            currentDefault.setDefault(false);
            paymentMethodRepository.save(currentDefault);
        }
        
        // Set new default
        newDefault.setDefault(true);
    }

    private String maskCardNumber(String cardNumber) {
        // Handle null or empty card numbers
        if (cardNumber == null || cardNumber.trim().isEmpty()) {
            return "";
        }
        
        // Remove any non-digit characters
        String digitsOnly = cardNumber.replaceAll("\\D", "");
        
        // If no digits found, return empty string
        if (digitsOnly.isEmpty()) {
            return "";
        }
        
        // Keep first 6 and last 4 digits visible, mask the rest
        if (digitsOnly.length() > 10) {
            String firstSix = digitsOnly.substring(0, 6);
            String lastFour = digitsOnly.substring(digitsOnly.length() - 4);
            String masked = "X".repeat(digitsOnly.length() - 10);
            return firstSix + masked + lastFour;
        } else if (digitsOnly.length() > 4) {
            // If length is between 5 and 10, keep first digit and last 4
            String firstDigit = digitsOnly.substring(0, 1);
            String lastFour = digitsOnly.substring(digitsOnly.length() - 4);
            String masked = "X".repeat(digitsOnly.length() - 5);
            return firstDigit + masked + lastFour;
        } else {
            // If card number is too short, just mask everything
            return "X".repeat(digitsOnly.length());
        }
    }

    private PaymentMethodResponse convertToPaymentMethodResponse(PaymentMethod paymentMethod) {
        PaymentMethodResponse response = new PaymentMethodResponse();
        response.setId(paymentMethod.getId());
        response.setType(paymentMethod.getType());
        response.setMaskedCardNumber(paymentMethod.getCardNumber());
        response.setCardHolderName(paymentMethod.getCardHolderName());
        response.setExpiryDate(paymentMethod.getExpiryDate());
        response.setNickname(paymentMethod.getNickname());
        response.setDefault(paymentMethod.isDefault());
        return response;
    }

    /**
     * Validates that required fields in PaymentMethodRequest are present
     */
    private void validatePaymentMethodRequest(PaymentMethodRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Payment method request cannot be null");
        }
        
        if (request.getType() == null || request.getType().trim().isEmpty()) {
            throw new IllegalArgumentException("Payment method type is required");
        }
        
        if (request.getCardHolderName() == null || request.getCardHolderName().trim().isEmpty()) {
            throw new IllegalArgumentException("Card holder name is required");
        }
        
        if (request.getExpiryDate() == null || request.getExpiryDate().trim().isEmpty()) {
            throw new IllegalArgumentException("Expiry date is required");
        }
        
        // Card number validation happens in the maskCardNumber method
    }
} 