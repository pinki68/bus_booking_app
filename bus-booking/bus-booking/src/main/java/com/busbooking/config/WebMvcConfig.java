package com.busbooking.config;

import java.time.Duration;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.CacheControl;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.resource.VersionResourceResolver;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {
    
    private static final Logger logger = LoggerFactory.getLogger(WebMvcConfig.class);

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        logger.info("Configuring resource handlers with cache control");
        
        // Add version resolver to handle cache busting
        VersionResourceResolver versionResolver = new VersionResourceResolver()
            .addContentVersionStrategy("/**");
            
        // Configure static resources with proper cache control
        registry.addResourceHandler("/**")
                .addResourceLocations("classpath:/static/")
                .setCacheControl(CacheControl.noCache().mustRevalidate())
                .resourceChain(false)
                .addResolver(versionResolver);
        
        // Specific handler for JavaScript files with proper cache control
        registry.addResourceHandler("/js/**")
                .addResourceLocations("classpath:/static/js/")
                .setCacheControl(CacheControl.noCache().mustRevalidate())
                .resourceChain(false)
                .addResolver(versionResolver);
                
        // Specific handler for CSS files
        registry.addResourceHandler("/css/**")
                .addResourceLocations("classpath:/static/css/")
                .setCacheControl(CacheControl.noCache().mustRevalidate())
                .resourceChain(false)
                .addResolver(versionResolver);
                
        // Specific handler for images if any
        registry.addResourceHandler("/images/**")
                .addResourceLocations("classpath:/static/images/")
                .setCacheControl(CacheControl.noCache().mustRevalidate())
                .resourceChain(false)
                .addResolver(versionResolver);
                
        logger.info("Resource handlers configured with proper caching and versioning");
    }
} 