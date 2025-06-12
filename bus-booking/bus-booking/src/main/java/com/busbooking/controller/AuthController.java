package com.busbooking.controller;

import com.busbooking.dto.JwtResponse;
import com.busbooking.dto.LoginRequest;
import com.busbooking.dto.MessageResponse;
import com.busbooking.dto.SignupRequest;
import com.busbooking.entity.User;
import com.busbooking.entity.Role;
import com.busbooking.repository.UserRepository;
import com.busbooking.repository.RoleRepository;
import com.busbooking.security.jwt.JwtUtils;
import com.busbooking.security.jwt.UserDetailsImpl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import java.util.HashSet;
import java.util.Set;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;


@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    @Autowired
    AuthenticationManager authenticationManager;

    @Autowired
    UserRepository userRepository;

    @Autowired
    PasswordEncoder encoder;

    @Autowired
    JwtUtils jwtUtils;

    @Autowired
    RoleRepository roleRepository;

    @PostMapping("/signin")
    public ResponseEntity<?> authenticateUser(@RequestBody LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(authentication);
        
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

        return ResponseEntity.ok(new JwtResponse(jwt,
                                                 userDetails.getId(),
                                                 userDetails.getUsername(),
                                                 userDetails.getEmail()));
    }

    @PostMapping("/signup")
    @Transactional
    public ResponseEntity<?> registerUser(@RequestBody SignupRequest signUpRequest) {
        logger.info("Processing registration request for username: {}", signUpRequest.getUsername());
        
        try {
            // Validate required fields
            if (signUpRequest.getUsername() == null || signUpRequest.getUsername().trim().isEmpty()) {
                logger.error("Registration failed: Username is required");
                return ResponseEntity.badRequest().body(new MessageResponse("Error: Username is required"));
            }
            
            if (signUpRequest.getEmail() == null || signUpRequest.getEmail().trim().isEmpty()) {
                logger.error("Registration failed: Email is required");
                return ResponseEntity.badRequest().body(new MessageResponse("Error: Email is required"));
            }
            
            if (signUpRequest.getPassword() == null || signUpRequest.getPassword().trim().isEmpty()) {
                logger.error("Registration failed: Password is required");
                return ResponseEntity.badRequest().body(new MessageResponse("Error: Password is required"));
            }
            
            // Check for existing username/email
            if (userRepository.existsByUsername(signUpRequest.getUsername())) {
                logger.error("Registration failed: Username {} is already taken", signUpRequest.getUsername());
                return ResponseEntity
                        .badRequest()
                        .body(new MessageResponse("Error: Username is already taken!"));
            }

            if (userRepository.existsByEmail(signUpRequest.getEmail())) {
                logger.error("Registration failed: Email {} is already in use", signUpRequest.getEmail());
                return ResponseEntity
                        .badRequest()
                        .body(new MessageResponse("Error: Email is already in use!"));
            }

            // Get or create ROLE_USER first - separate transaction
            Role userRole = getOrCreateUserRole();
            
            if (userRole == null) {
                logger.error("Failed to find or create ROLE_USER");
                return ResponseEntity
                        .internalServerError()
                        .body(new MessageResponse("Registration failed: Unable to assign user role"));
            }
            
            // Create new user's account
            User user = new User();
            user.setUsername(signUpRequest.getUsername());
            user.setEmail(signUpRequest.getEmail());
            user.setPassword(encoder.encode(signUpRequest.getPassword()));
            user.setFullName(signUpRequest.getFullName());
            user.setPhoneNumber(signUpRequest.getPhoneNumber());
            
            // Add the role to the user - no need to check if roles is null as it's initialized in the User entity
            user.addRole(userRole);
            logger.info("Added ROLE_USER to user: {}", user.getUsername());
            
            try {
                // Save the user with the role
                User savedUser = userRepository.save(user);
                logger.info("User saved to database with ID: {}", savedUser.getId());
                
                // Ensure changes are written to the database
                userRepository.flush();
                
                return ResponseEntity.ok(new MessageResponse("User registered successfully!"));
            } catch (Exception e) {
                logger.error("Error saving user to database: {}", e.getMessage(), e);
                return ResponseEntity
                        .internalServerError()
                        .body(new MessageResponse("Registration failed: Error saving user - " + e.getMessage()));
            }
        } catch (Exception e) {
            logger.error("Registration failed with exception: {}", e.getMessage(), e);
            return ResponseEntity
                    .internalServerError()
                    .body(new MessageResponse("Registration failed: " + e.getMessage()));
        }
    }
    
    /**
     * Helper method to get or create the ROLE_USER
     * Extracted to a separate method with its own transaction
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    private Role getOrCreateUserRole() {
        try {
            logger.info("Attempting to find ROLE_USER in database");
            
            // Try case insensitive match first
            Optional<Role> caseInsensitiveRole = roleRepository.findByNameCaseInsensitive("ROLE_USER");
            if (caseInsensitiveRole.isPresent()) {
                Role userRole = caseInsensitiveRole.get();
                logger.info("Found existing ROLE_USER with ID: {} using case insensitive match", userRole.getId());
                return userRole;
            }
            
            // Then check if role exists directly using SQL query
            boolean roleExists = roleRepository.existsByName("ROLE_USER");
            logger.info("Does ROLE_USER exist in database? {}", roleExists);
            
            if (roleExists) {
                Optional<Role> userRoleOpt = roleRepository.findByName("ROLE_USER");
                
                if (userRoleOpt.isPresent()) {
                    Role userRole = userRoleOpt.get();
                    logger.info("Found existing ROLE_USER with ID: {}", userRole.getId());
                    return userRole;
                } else {
                    logger.warn("Role exists but could not be retrieved - inconsistent state");
                }
            }
            
            // Create the role if it doesn't exist or couldn't be retrieved
            logger.warn("ROLE_USER not found in database. Creating it now.");
            
            // Create a fresh Role object
            Role newRole = new Role();
            newRole.setName("ROLE_USER");
            newRole.setUsers(new HashSet<>());
            
            // Save the role
            try {
                Role savedRole = roleRepository.saveAndFlush(newRole);
                logger.info("Created new ROLE_USER with ID: {}", savedRole.getId());
                return savedRole;
            } catch (Exception e) {
                logger.error("Failed to save new ROLE_USER: {}", e.getMessage(), e);
                
                // Try one more time to find it - maybe it was created in another transaction
                Optional<Role> retryRoleOpt = roleRepository.findByNameCaseInsensitive("ROLE_USER");
                if (retryRoleOpt.isPresent()) {
                    Role existingRole = retryRoleOpt.get();
                    logger.info("Found ROLE_USER on retry with ID: {}", existingRole.getId());
                    return existingRole;
                }
                
                throw e; // Re-throw if we still can't find it
            }
        } catch (Exception e) {
            logger.error("Error getting or creating ROLE_USER: {}", e.getMessage(), e);
            return null;
        }
    }

    @GetMapping("/user")
    public ResponseEntity<?> getCurrentUser(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(401).body(new MessageResponse("User not authenticated"));
        }
        
        return ResponseEntity.ok(new JwtResponse(null,
                                                userDetails.getId(),
                                                userDetails.getUsername(),
                                                userDetails.getEmail()));
    }
    
    /**
     * Validates if a JWT token is valid and returns user information
     * The token is extracted from the Authorization header by the filter
     */
    @GetMapping("/validate-token")
    public ResponseEntity<?> validateToken(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(401).body(new MessageResponse("Invalid or expired token"));
        }
        
        return ResponseEntity.ok(new JwtResponse(null,
                                               userDetails.getId(),
                                               userDetails.getUsername(),
                                               userDetails.getEmail()));
    }
    
    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody User user) {
        try {
            user.setEnabled(true); // 💥 This line is critical
            userRepository.save(user);
            return ResponseEntity.ok("User registered successfully");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error saving user to database: " + e.getMessage());
        }
    
    
    }
    
    
    
    
    
} 