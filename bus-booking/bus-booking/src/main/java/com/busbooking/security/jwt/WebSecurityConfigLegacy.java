/*package com.busbooking.security.jwt;





/*
 * This WebSecurityConfigLegacy class is replaced by SecurityConfig in the config package.
 * It is completely disabled and kept only for reference purposes.
 * DO NOT USE THIS CLASS - Use SecurityConfig instead.
 */
/*
import com.busbooking.security.jwt.AuthTokenFilter;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import jakarta.servlet.http.HttpServletResponse;

@Configuration
@EnableWebSecurity
@Profile("never") // This profile will never be active
public class WebSecurityConfigLegacy {
    @Autowired
    UserDetailsServiceImpl userDetailsService;

    @Bean
    public AuthTokenFilter authenticationJwtTokenFilter() {
        return new AuthTokenFilter();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        org.slf4j.LoggerFactory.getLogger(WebSecurityConfigLegacy.class).info("Configuring security filter chain");
        
        http.csrf(csrf -> {
            csrf.disable();
            org.slf4j.LoggerFactory.getLogger(WebSecurityConfigLegacy.class).debug("CSRF protection disabled");
        })
        .headers(headers -> headers.frameOptions().sameOrigin())
        .sessionManagement(session -> {
            session.sessionCreationPolicy(SessionCreationPolicy.STATELESS);
            org.slf4j.LoggerFactory.getLogger(WebSecurityConfigLegacy.class).debug("Session management set to STATELESS");
        })
        .authorizeHttpRequests(auth -> {
            org.slf4j.LoggerFactory.getLogger(WebSecurityConfigLegacy.class).debug("Configuring authorization rules");
            auth
                // Static resources
                .requestMatchers("/css/**", "/js/**", "/images/**", "/favicon.ico").permitAll()
                
                // Public API endpoints
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/buses/**").permitAll()
                
                // Public pages
                .requestMatchers("/", "/register", "/login", "/buses", 
                         "/booking/**", "/bookings", "/payment/**").permitAll()
                .requestMatchers("/error/**").permitAll()
                
                // Everything else requires authentication
                .anyRequest().authenticated();
            org.slf4j.LoggerFactory.getLogger(WebSecurityConfigLegacy.class).debug("Authorization rules configured");
        })
        .exceptionHandling(eh -> {
            eh.authenticationEntryPoint((request, response, authException) -> {
                // Ignore favicon and static resource requests
                String path = request.getRequestURI();
                if (path.contains("favicon.ico") || path.startsWith("/js/") || 
                    path.startsWith("/css/") || path.startsWith("/images/")) {
                    response.setStatus(HttpServletResponse.SC_OK);
                    return;
                }
                
                // For API requests, return 401 status code
                if (request.getRequestURI().startsWith("/api/")) {
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.setContentType("application/json");
                    response.getWriter().write("{\"error\":\"Unauthorized\",\"message\":\"" + authException.getMessage() + "\"}");
                } else {
                    // For web pages, redirect to login (but not for static resources)
                    String redirectUri = request.getRequestURI();
                    response.sendRedirect("/login?redirect=" + redirectUri);
                }
            });
        });
        
        http.authenticationProvider(authenticationProvider());
        http.addFilterBefore(authenticationJwtTokenFilter(), UsernamePasswordAuthenticationFilter.class);
        
        org.slf4j.LoggerFactory.getLogger(WebSecurityConfigLegacy.class).info("Security configuration completed");
        return http.build();
    }
} */