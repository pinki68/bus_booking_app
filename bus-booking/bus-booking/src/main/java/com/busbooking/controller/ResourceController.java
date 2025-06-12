package com.busbooking.controller;

import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import java.io.IOException;
import java.nio.file.Files;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Controller
@RequestMapping("/resources")
public class ResourceController {
    
    private static final Logger logger = LoggerFactory.getLogger(ResourceController.class);
    
    /**
     * Explicitly serves JavaScript files when the standard resource handler fails
     */
    @GetMapping("/js/{filename:.+}")
    @ResponseBody
    public ResponseEntity<byte[]> getJavaScript(@PathVariable String filename) {
        logger.info("Explicitly serving JavaScript file: {}", filename);
        return serveResource("static/js/" + filename, MediaType.parseMediaType("application/javascript"));
    }
    
    /**
     * Explicitly serves CSS files when the standard resource handler fails
     */
    @GetMapping("/css/{filename:.+}")
    @ResponseBody
    public ResponseEntity<byte[]> getStylesheet(@PathVariable String filename) {
        logger.info("Explicitly serving CSS file: {}", filename);
        return serveResource("static/css/" + filename, MediaType.parseMediaType("text/css"));
    }
    
    /**
     * Explicitly serves image files when the standard resource handler fails
     */
    @GetMapping("/images/{filename:.+}")
    @ResponseBody
    public ResponseEntity<byte[]> getImage(@PathVariable String filename) {
        logger.info("Explicitly serving image file: {}", filename);
        String contentType = determineContentType(filename);
        return serveResource("static/images/" + filename, MediaType.parseMediaType(contentType));
    }
    
    /**
     * Helper method to serve a resource with the appropriate content type
     */
    private ResponseEntity<byte[]> serveResource(String path, MediaType contentType) {
        try {
            Resource resource = new ClassPathResource(path);
            byte[] content = Files.readAllBytes(resource.getFile().toPath());
            return ResponseEntity.ok()
                    .contentType(contentType)
                    .body(content);
        } catch (IOException e) {
            logger.error("Error serving resource {}: {}", path, e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * Determine the content type based on file extension
     */
    private String determineContentType(String filename) {
        if (filename.endsWith(".png")) {
            return "image/png";
        } else if (filename.endsWith(".jpg") || filename.endsWith(".jpeg")) {
            return "image/jpeg";
        } else if (filename.endsWith(".gif")) {
            return "image/gif";
        } else if (filename.endsWith(".svg")) {
            return "image/svg+xml";
        } else if (filename.endsWith(".ico")) {
            return "image/x-icon";
        } else {
            return "application/octet-stream";
        }
    }
} 