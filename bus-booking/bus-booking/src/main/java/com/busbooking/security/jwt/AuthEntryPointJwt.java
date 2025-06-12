package com.busbooking.security.jwt;

import java.io.IOException;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

@Component
public class AuthEntryPointJwt implements AuthenticationEntryPoint {

    private static final Logger logger = LoggerFactory.getLogger(AuthEntryPointJwt.class);

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response,
                         AuthenticationException authException) throws IOException, ServletException {
        
        // Log the error
        logger.error("Unauthorized error: {}", authException.getMessage());
        
        // Check if it's an API request
        String path = request.getRequestURI();
        if (path.startsWith("/api/")) {
            // For API requests, return 401 status
            response.setContentType("application/json");
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("{\"error\":\"Unauthorized\",\"message\":\"" + 
                                      authException.getMessage() + "\"}");
        } else {
            // For web requests, redirect to login page
            response.sendRedirect("/login?error=unauthorized");
        }
    }
} 