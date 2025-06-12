package com.busbooking.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * A filter that logs CORS-related headers for debugging purposes
 */
@Component
public class CorsLoggingFilter extends OncePerRequestFilter {
    private static final Logger logger = LoggerFactory.getLogger(CorsLoggingFilter.class);

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, 
                                    FilterChain filterChain) throws ServletException, IOException {
        // Only log CORS details for API requests to avoid too much noise
        String path = request.getRequestURI();
        if (path.startsWith("/api/") && !path.contains("/static/")) {
            logCorsDetails(request);
        }
        
        filterChain.doFilter(request, response);
        
        // Log the response CORS headers
        if (path.startsWith("/api/") && !path.contains("/static/")) {
            logCorsResponseHeaders(response);
        }
    }
    
    private void logCorsDetails(HttpServletRequest request) {
        String origin = request.getHeader("Origin");
        String method = request.getMethod();
        
        if (origin != null) {
            logger.debug("CORS Request - Origin: {}, Method: {}, Path: {}", 
                      origin, method, request.getRequestURI());
            
            // Log additional CORS headers
            String corsHeaders = request.getHeader("Access-Control-Request-Headers");
            if (corsHeaders != null) {
                logger.debug("CORS Request Headers: {}", corsHeaders);
            }
            
            String corsMethod = request.getHeader("Access-Control-Request-Method");
            if (corsMethod != null) {
                logger.debug("CORS Request Method: {}", corsMethod);
            }
        }
    }
    
    private void logCorsResponseHeaders(HttpServletResponse response) {
        String allowOrigin = response.getHeader("Access-Control-Allow-Origin");
        String allowMethods = response.getHeader("Access-Control-Allow-Methods");
        String allowHeaders = response.getHeader("Access-Control-Allow-Headers");
        String allowCredentials = response.getHeader("Access-Control-Allow-Credentials");
        
        if (allowOrigin != null) {
            logger.debug("CORS Response - Allow-Origin: {}", allowOrigin);
            logger.debug("CORS Response - Allow-Methods: {}", allowMethods);
            logger.debug("CORS Response - Allow-Headers: {}", allowHeaders);
            logger.debug("CORS Response - Allow-Credentials: {}", allowCredentials);
        }
    }
} 