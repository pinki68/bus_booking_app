package com.busbooking.controller;

import com.busbooking.dto.BookingResponse;
import com.busbooking.dto.PasswordChangeRequest;
import com.busbooking.dto.UserProfileRequest;
import com.busbooking.dto.UserProfileResponse;
import com.busbooking.entity.User;
import com.busbooking.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {
	
	 @Autowired
	    private UserService userService;

	    @GetMapping("/profile")
	    public ResponseEntity<UserProfileResponse> getUserProfile(@AuthenticationPrincipal User user) {
	        //UserProfileResponse profile = userService.getUserProfile(user.getId());
	        
	    	UserProfileResponse profile = userService.getUserById(user.getId());
	    	
	    	return ResponseEntity.ok(profile);
	    }

	    @PutMapping("/profile")
	    public ResponseEntity<UserProfileResponse> updateUserProfile(
	            @AuthenticationPrincipal User user,
	            @RequestBody UserProfileRequest request) {
	    	
	        //UserProfileResponse updatedProfile = userService.updateUserProfile(user.getId(), request);
	    	 UserProfileResponse updatedProfile = userService.updateUserProfile(user.getUsername(), request);
	    	
	    	return ResponseEntity.ok(updatedProfile);
	    }

	    @PostMapping("/change-password")
	    public ResponseEntity<Void> changePassword(
	            @AuthenticationPrincipal User user,
	            @RequestBody PasswordChangeRequest request) {
	        userService.changePassword(user.getId(), request);
	        return ResponseEntity.ok().build();
	    }

	    @GetMapping("/bookings")
	    public ResponseEntity<List<BookingResponse>> getBookingHistory(@AuthenticationPrincipal User user) {
	        List<BookingResponse> bookings = userService.getBookingHistory(user.getId());
	        return ResponseEntity.ok(bookings);
	    }
	
	    @PostMapping("/register")
	    public ResponseEntity<?> registerUser(@RequestBody User user) {
	        userService.registerUser(user);
	        return ResponseEntity.ok("User registered successfully");
	    }

}
