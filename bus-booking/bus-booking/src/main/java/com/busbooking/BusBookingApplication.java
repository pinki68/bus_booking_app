package com.busbooking;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.web.servlet.support.SpringBootServletInitializer;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
@ComponentScan(basePackages = {"com.busbooking"})
public class BusBookingApplication extends SpringBootServletInitializer {
    
	private static final Logger logger = LoggerFactory.getLogger(BusBookingApplication.class);

    
    public static void main(String[] args) {
        ConfigurableApplicationContext context = SpringApplication.run(BusBookingApplication.class, args);
        
        // Log important configuration details on startup
        logger.info("Bus Booking Application started successfully");
        logger.info("Active Spring profiles: {}", String.join(", ", context.getEnvironment().getActiveProfiles()));
        
        // Log security filters
        try {
            Object filterChainProxy = context.getBean("springSecurityFilterChain");
            if (filterChainProxy != null) {
                logger.info("Security filter chain loaded successfully");
            }
        } catch (Exception e) {
            logger.error("Error checking security filters: {}", e.getMessage());
        }
    }
}
