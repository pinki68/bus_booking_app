package com.busbooking.config;





import com.busbooking.entity.Role;
import com.busbooking.repository.RoleRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

/**
 * Initialize necessary data on application startup
 */
@Component
public class DataInitializer implements CommandLineRunner {
    
    private static final Logger logger = LoggerFactory.getLogger(DataInitializer.class);
    
    @Autowired
    private RoleRepository roleRepository;
    
    @Override
    public void run(String... args) {
        logger.info("Initializing default roles...");
        initRoles();
        logger.info("Data initialization completed");
    }
    
    private void initRoles() {
        // Define default roles
        List<String> defaultRoles = Arrays.asList("ROLE_USER", "ROLE_ADMIN");
        
        // Check if roles exist and create them if they don't
        for (String roleName : defaultRoles) {
            if (!roleRepository.existsByName(roleName)) {
                Role role = new Role(roleName);
                roleRepository.save(role);
                logger.info("Created role: {}", roleName);
            } else {
                logger.info("Role already exists: {}", roleName);
            }
        }
    }
} 