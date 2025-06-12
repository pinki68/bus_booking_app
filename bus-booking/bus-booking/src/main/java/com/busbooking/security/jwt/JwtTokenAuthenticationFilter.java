package com.busbooking.security.jwt;

import java.io.IOException;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * JWT Token based authentication filter
 * Validates the JWT token in the request and sets the authentication in the security context
 */
@Component
public class JwtTokenAuthenticationFilter extends OncePerRequestFilter {
    private final JwtUtils jwtUtils;
    private final UserDetailsService userDetailsService;
    
    private static final Logger logger = LoggerFactory.getLogger(JwtTokenAuthenticationFilter.class);
    
    public JwtTokenAuthenticationFilter(JwtUtils jwtUtils, UserDetailsService userDetailsService) {
        this.jwtUtils = jwtUtils;
        this.userDetailsService = userDetailsService;
        logger.info("JWT token authentication filter initialized with dependencies");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        
        // Skip filter for static resources
        String requestPath = request.getRequestURI();
        if (requestPath.startsWith("/css/") || 
            requestPath.startsWith("/js/") || 
            requestPath.startsWith("/images/") || 
            requestPath.startsWith("/data/") ||
            requestPath.startsWith("/static/") || 
            requestPath.equals("/favicon.ico")) {
            
            filterChain.doFilter(request, response);
            return;
        }
            
        try {
            String jwt = parseJwt(request);
            
            if (jwt != null && jwtUtils.validateJwtToken(jwt)) {
                String username = jwtUtils.getUserNameFromJwtToken(jwt);
                logger.debug("Valid JWT for user: {}", username);

                UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                userDetails,
                                null,
                                userDetails.getAuthorities());
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                SecurityContextHolder.getContext().setAuthentication(authentication);
            } else if (jwt != null) {
                logger.warn("Invalid JWT token");
                if (requestPath.startsWith("/api/")) {
                    SecurityContextHolder.clearContext();
                }
            }
        } catch (Exception e) {
            logger.error("Cannot set user authentication: {}", e.getMessage());
            if (requestPath.startsWith("/api/")) {
                SecurityContextHolder.clearContext();
            }
        }

        filterChain.doFilter(request, response);
    }

    private String parseJwt(HttpServletRequest request) {
        String headerAuth = request.getHeader("Authorization");
        
        // Log the authorization header (without showing full token for security)
        if (headerAuth != null) {
            if (headerAuth.length() > 20) {
                logger.debug("Authorization header received: {}...", headerAuth.substring(0, 15));
            } else {
                logger.debug("Authorization header received but may be malformed");
            }
        } else {
            logger.debug("No Authorization header found for: {}", request.getRequestURI());
        }

        // Extract token from header
        if (StringUtils.hasText(headerAuth) && headerAuth.startsWith("Bearer ")) {
            return headerAuth.substring(7);
        }
        
        // Check for token in parameters (for WebSocket connections)
        String paramToken = request.getParameter("token");
        if (StringUtils.hasText(paramToken)) {
            logger.debug("Found token in request parameter");
            return paramToken;
        }

        return null;
    }
    
    
    
    
    
    
    
    
    
} 