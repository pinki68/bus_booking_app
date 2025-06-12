package com.busbooking.controller;

import com.busbooking.dto.BookingRequest;
import com.busbooking.dto.BookingResponse;
import com.busbooking.dto.PassengerRequest;
import com.busbooking.entity.User;
import com.busbooking.entity.Role;
import com.busbooking.service.BookingService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;
import java.util.Set;
import java.util.Objects;
import java.lang.reflect.Field;
import java.util.HashSet;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {
    
    private static final Logger logger = LoggerFactory.getLogger(BookingController.class);

    @Autowired
    private BookingService bookingService;

    @PostMapping("/{busId}")
    public ResponseEntity<?> createBooking(
            @AuthenticationPrincipal User user,
            @PathVariable Long busId,
            @RequestBody BookingRequest bookingRequest) {
        
        logger.debug("Creating booking for busId: {}, user: {}, with {} passengers", 
                busId, user != null ? user.getUsername() : "null", 
                bookingRequest != null && bookingRequest.getPassengers() != null ? 
                        bookingRequest.getPassengers().size() : 0);
        
        if (user == null) {
            logger.error("Unauthorized attempt to create booking - user is null");
            return ResponseEntity.status(401)
                    .body("Authentication required. Please login to continue.");
        }
        
        try {
            // Set the busId from the path variable
            bookingRequest.setBusId(busId);
            
            // Ensure passenger requests are not null
            if (bookingRequest.getPassengers() == null || bookingRequest.getPassengers().isEmpty()) {
                logger.error("Invalid request - no passengers provided");
                return ResponseEntity.badRequest().body("Passenger information is required");
            }
            
            // Validate passenger data
            for (PassengerRequest passenger : bookingRequest.getPassengers()) {
                if (passenger.getName() == null || passenger.getName().trim().isEmpty()) {
                    logger.error("Invalid passenger data: name is required");
                    return ResponseEntity.badRequest().body("Passenger name is required");
                }
            }
            
            // Validate contact information
            if (bookingRequest.getContactEmail() == null || bookingRequest.getContactEmail().trim().isEmpty()) {
                logger.error("Invalid request - contact email is required");
                return ResponseEntity.badRequest().body("Contact email is required");
            }
            
            if (bookingRequest.getContactPhone() == null || bookingRequest.getContactPhone().trim().isEmpty()) {
                logger.error("Invalid request - contact phone is required");
                return ResponseEntity.badRequest().body("Contact phone is required");
            }
            
            logger.debug("Creating booking with {} seats for bus {}", 
                    bookingRequest.getNumberOfSeats(), bookingRequest.getBusId());
            
            BookingResponse booking = bookingService.createBooking(user, bookingRequest);
            logger.info("Successfully created booking with ID: {}", booking.getId());
            return ResponseEntity.ok(booking);
        } catch (RuntimeException e) {
            logger.error("Error creating booking: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            logger.error("Unexpected error creating booking: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body("An unexpected error occurred");
        }
    }

    @GetMapping
    public ResponseEntity<List<BookingResponse>> getUserBookings(@AuthenticationPrincipal User user) {
        logger.info("Fetching bookings for user: {}", user != null ? user.getId() : "null");
        
        if (user == null) {
            logger.error("Unauthorized attempt to access bookings - user is null");
            return ResponseEntity.status(401).build();
        }
        
        List<BookingResponse> bookings = bookingService.getUserBookings(user);
        logger.info("Found {} bookings for user {}", bookings.size(), user.getId());
        
        return ResponseEntity.ok(bookings);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<BookingResponse> getBookingById(
            @AuthenticationPrincipal User user,
            @PathVariable Long id) {
        logger.info("Fetching booking details for booking ID: {}", id);
        
        BookingResponse booking = bookingService.getBookingById(id);
        
        // Add security check to ensure the user owns the booking or has admin rights
        if (user != null && (user.getId().equals(booking.getUserId()) || userHasAdminRole(user))) {
            return ResponseEntity.ok(booking);
        } else {
            logger.error("Unauthorized attempt to access booking {}", id);
            return ResponseEntity.status(403).build();
        }
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<BookingResponse> cancelBooking(
            @AuthenticationPrincipal User user,
            @PathVariable Long id) {
        logger.info("Cancelling booking {} for user {}", id, user.getId());
        BookingResponse booking = bookingService.cancelBooking(id);
        return ResponseEntity.ok(booking);
    }
    
    // Helper method to check if a user has admin role
    private boolean userHasAdminRole(User user) {
        // Check if user is not null
        if (user == null) {
            return false;
        }
        
        try {
            // Get user roles directly
            Set<Role> roles = getUserRoles(user);
            
            // Check if roles is not null and contains ROLE_ADMIN
            if (roles != null) {
                return roles.stream()
                        .filter(Objects::nonNull)
                        .anyMatch(role -> {
                            // Access role name using reflection since getName() might not be available
                            try {
                                Field nameField = Role.class.getDeclaredField("name");
                                nameField.setAccessible(true);
                                String roleName = (String) nameField.get(role);
                                return roleName != null && "ROLE_ADMIN".equals(roleName);
                            } catch (Exception ex) {
                                logger.error("Error accessing role name: {}", ex.getMessage());
                                return false;
                            }
                        });
            }
        } catch (Exception e) {
            logger.error("Error checking admin role: {}", e.getMessage(), e);
        }
        
        return false;
    }
    
    /**
     * Helper method to access user roles directly
     * This avoids the need to call getRoles() which may not be available
     */
    private Set<Role> getUserRoles(User user) {
        // Try using direct field access first
        try {
            Field rolesField = User.class.getDeclaredField("roles");
            rolesField.setAccessible(true);
            @SuppressWarnings("unchecked")
            Set<Role> roles = (Set<Role>) rolesField.get(user);
            return roles;
        } catch (Exception e) {
            logger.error("Error accessing roles directly: {}", e.getMessage());
            // Return empty set as fallback
            return new HashSet<>();
        }
    }

    // Add this endpoint for confirming a booking after payment
    @PostMapping("/{id}/confirm")
    public ResponseEntity<?> confirmBooking(
            @AuthenticationPrincipal User user,
            @PathVariable Long id) {
        logger.info("Confirming booking {} after payment", id);
        
        if (user == null) {
            logger.error("Unauthorized attempt to confirm booking {}", id);
            return ResponseEntity.status(401).build();
        }
        
        try {
            // Call the service method directly to confirm the booking
            BookingResponse booking = bookingService.confirmBooking(id);
            
            // Validate that the user owns this booking
            if (!booking.getUserId().equals(user.getId())) {
                logger.error("User {} attempted to confirm booking {} which belongs to user {}", 
                    user.getId(), id, booking.getUserId());
                return ResponseEntity.status(403).build();
            }
            
            logger.info("Successfully confirmed booking {}", id);
            return ResponseEntity.ok(booking);
        } catch (RuntimeException e) {
            logger.error("Error confirming booking {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            logger.error("Unexpected error confirming booking {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(500).body("An unexpected error occurred");
        }
    }
    
    /**
     * Admin endpoint to get all bookings with pagination and sorting
     */
    @GetMapping("/admin/all")
    public ResponseEntity<List<BookingResponse>> getAllBookings(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String direction) {
        
        logger.info("Admin request to get all bookings with pagination");
        
        if (user == null || !userHasAdminRole(user)) {
            logger.error("Unauthorized attempt to access all bookings");
            return ResponseEntity.status(403).build();
        }
        
        List<BookingResponse> bookings = bookingService.getAllBookings(page, size, sortBy, direction);
        logger.info("Returning {} bookings", bookings.size());
        
        return ResponseEntity.ok(bookings);
    }
    
    /**
     * Admin endpoint to get bookings by date range
     */
    @GetMapping("/admin/date-range")
    public ResponseEntity<List<BookingResponse>> getBookingsByDateRange(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String status) {
        
        logger.info("Admin request to filter bookings by date range");
        
        if (user == null || !userHasAdminRole(user)) {
            logger.error("Unauthorized attempt to access filtered bookings");
            return ResponseEntity.status(403).build();
        }
        
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");
        LocalDateTime start = startDate != null ? LocalDateTime.parse(startDate, formatter) : null;
        LocalDateTime end = endDate != null ? LocalDateTime.parse(endDate, formatter) : null;
        
        List<BookingResponse> bookings = bookingService.getBookingsByDateRange(start, end, status);
        logger.info("Found {} bookings in date range", bookings.size());
        
        return ResponseEntity.ok(bookings);
    }

    @PostMapping
    public ResponseEntity<?> createBookingWithoutPathParam(
            @AuthenticationPrincipal User user,
            @RequestBody BookingRequest bookingRequest) {
        
        logger.debug("Creating booking without path param for user: {}, with {} passengers", 
                user != null ? user.getUsername() : "null", 
                bookingRequest != null && bookingRequest.getPassengers() != null ? 
                        bookingRequest.getPassengers().size() : 0);
        
        if (user == null) {
            logger.error("Unauthorized attempt to create booking - user is null");
            return ResponseEntity.status(401)
                    .body("Authentication required. Please login to continue.");
        }
        
        try {
            // Ensure busId is provided in the request body
            if (bookingRequest.getBusId() == null) {
                logger.error("Invalid request - busId is required");
                return ResponseEntity.badRequest().body("Bus ID is required");
            }
            
            // Ensure passenger requests are not null
            if (bookingRequest.getPassengers() == null || bookingRequest.getPassengers().isEmpty()) {
                logger.error("Invalid request - no passengers provided");
                return ResponseEntity.badRequest().body("Passenger information is required");
            }
            
            // Validate passenger data
            for (PassengerRequest passenger : bookingRequest.getPassengers()) {
                if (passenger.getName() == null || passenger.getName().trim().isEmpty()) {
                    logger.error("Invalid passenger data: name is required");
                    return ResponseEntity.badRequest().body("Passenger name is required");
                }
            }
            
            // Validate contact information
            if (bookingRequest.getContactEmail() == null || bookingRequest.getContactEmail().trim().isEmpty()) {
                logger.error("Invalid request - contact email is required");
                return ResponseEntity.badRequest().body("Contact email is required");
            }
            
            if (bookingRequest.getContactPhone() == null || bookingRequest.getContactPhone().trim().isEmpty()) {
                logger.error("Invalid request - contact phone is required");
                return ResponseEntity.badRequest().body("Contact phone is required");
            }
            
            logger.debug("Creating booking with {} seats for bus {}", 
                    bookingRequest.getNumberOfSeats(), bookingRequest.getBusId());
            
            BookingResponse booking = bookingService.createBooking(user, bookingRequest);
            logger.info("Successfully created booking with ID: {}", booking.getId());
            return ResponseEntity.ok(booking);
        } catch (RuntimeException e) {
            logger.error("Error creating booking: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            logger.error("Unexpected error creating booking: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body("An unexpected error occurred");
        }
    }
} 