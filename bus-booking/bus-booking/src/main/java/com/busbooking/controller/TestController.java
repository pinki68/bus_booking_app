package com.busbooking.controller;




import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/test")
public class TestController {
    
    private static final Logger logger = LoggerFactory.getLogger(TestController.class);
    
    @GetMapping("/public")
    public ResponseEntity<Map<String, Object>> publicEndpoint() {
        logger.info("Public endpoint accessed");
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Public endpoint working");
        response.put("status", "success");
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/protected")
    public ResponseEntity<Map<String, Object>> protectedEndpoint() {
        logger.info("Protected endpoint accessed");
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Protected endpoint working - authentication successful");
        response.put("status", "success");
        return ResponseEntity.ok(response);
    }
} 