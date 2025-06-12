package com.busbooking.controller;



import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import com.busbooking.service.UserProfileService;
import com.busbooking.dto.PasswordUpdateRequest;
import com.busbooking.entity.PaymentCard;
import com.busbooking.entity.UserAccount;
import com.busbooking.entity.UserProfile;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;


@Controller
@RequestMapping("/profile")
public class UserProfileController {
    @Autowired
    private UserProfileService userProfileService;

    @GetMapping
    public String showProfilePage(@AuthenticationPrincipal UserDetails userDetails, Model model) {
        try {
            Long userId = Long.parseLong(userDetails.getUsername());
            UserProfile profile = userProfileService.getUserProfile(userId);
            if (profile != null) {
                model.addAttribute("profile", profile);
                return "profile";
            } else {
                // If profile doesn't exist, create a new one
                UserProfile newProfile = new UserProfile();
                newProfile.setUser(new UserAccount());
                newProfile.getUser().setId(userId);
                newProfile.getUser().setUsername(userDetails.getUsername());
                model.addAttribute("profile", newProfile);
                return "profile";
            }
        } catch (Exception e) {
            // Log the error and redirect to home page
            e.printStackTrace();
            return "redirect:/";
        }
    }

    @GetMapping("/api")
    @ResponseBody
    public ResponseEntity<UserProfile> getProfile(@AuthenticationPrincipal UserDetails userDetails) {
        Long userId = Long.parseLong(userDetails.getUsername());
        return ResponseEntity.ok(userProfileService.getUserProfile(userId));
    }

    @PutMapping("/api")
    @ResponseBody
    public ResponseEntity<UserProfile> updateProfile(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody UserProfile profile) {
        Long userId = Long.parseLong(userDetails.getUsername());
        profile.setUser(userProfileService.getUserProfile(userId).getUser());
        return ResponseEntity.ok(userProfileService.updateProfile(profile));
    }

    @PutMapping("/api/password")
    @ResponseBody
    public ResponseEntity<?> updatePassword(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody PasswordUpdateRequest request) {
        Long userId = Long.parseLong(userDetails.getUsername());
        userProfileService.updatePassword(userId, request.getCurrentPassword(), request.getNewPassword());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/api/payment-cards")
    @ResponseBody
    public ResponseEntity<PaymentCard> addPaymentCard(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody PaymentCard paymentCard) {
        Long userId = Long.parseLong(userDetails.getUsername());
        return ResponseEntity.ok(userProfileService.addPaymentCard(userId, paymentCard));
    }

    @DeleteMapping("/api/payment-cards/{id}")
    @ResponseBody
    public ResponseEntity<?> removePaymentCard(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        Long userId = Long.parseLong(userDetails.getUsername());
        userProfileService.removePaymentCard(userId, id);
        return ResponseEntity.ok().build();
    }
} 