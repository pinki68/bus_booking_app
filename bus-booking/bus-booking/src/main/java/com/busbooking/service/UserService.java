package com.busbooking.service;

import com.busbooking.dto.BookingResponse;
import com.busbooking.dto.PasswordChangeRequest;
import com.busbooking.dto.UserProfileRequest;
import com.busbooking.dto.UserProfileResponse;
import com.busbooking.entity.User;
import com.busbooking.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class UserService {

    private final UserRepository userRepository;
    
    @Autowired
    private BookingService bookingService;
    
    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public UserProfileResponse getUserByUsername(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found with username: " + username));
        return convertToUserProfileResponse(user);
    }

    public UserProfileResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
        return convertToUserProfileResponse(user);
    }

    public UserProfileResponse getUserByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));
        return convertToUserProfileResponse(user);
    }

    public boolean existsByUsername(String username) {
        return userRepository.existsByUsername(username);
    }

    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    public UserProfileResponse updateUserProfile(String username, UserProfileRequest userProfileRequest) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found with username: " + username));
        
        user.setFullName(userProfileRequest.getName());
        user.setEmail(userProfileRequest.getEmail());
        user.setPhoneNumber(userProfileRequest.getPhone());
        
        User updatedUser = userRepository.save(user);
        return convertToUserProfileResponse(updatedUser);
    }
    
    @Transactional
    public void changePassword(Long userId, PasswordChangeRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        
        // Verify current password
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new RuntimeException("Current password is incorrect");
        }
        
        // Update password
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }
    
    public List<BookingResponse> getBookingHistory(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        return bookingService.getUserBookings(user);
    }
    
    private UserProfileResponse convertToUserProfileResponse(User user) {
        UserProfileResponse response = new UserProfileResponse();
        response.setId(user.getId());
        response.setUsername(user.getUsername());
        response.setName(user.getFullName());
        response.setEmail(user.getEmail());
        response.setPhone(user.getPhoneNumber());
        return response;
    }
    
    
 /*   public void registerUser(User user) {
        user.setRole("USER");
        userRepository.save(user);
    } */
    
    
    public void registerUser(User user) {
        user.setEnabled(true); // Enable user before saving
        userRepository.save(user);
    }
} 