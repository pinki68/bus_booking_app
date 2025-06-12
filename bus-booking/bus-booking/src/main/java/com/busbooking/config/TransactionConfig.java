package com.busbooking.config;





import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;

@Configuration
public class TransactionConfig {

    /**
     * Creates a TransactionTemplate that can be used for programmatic transaction management
     * with consistent settings across the application.
     */
    @Bean
    @Primary
    public TransactionTemplate transactionTemplate(PlatformTransactionManager transactionManager) {
        TransactionTemplate template = new TransactionTemplate(transactionManager);
        // Set default isolation level
        template.setIsolationLevel(TransactionDefinition.ISOLATION_READ_COMMITTED);
        // Set timeout to 30 seconds
        template.setTimeout(30);
        return template;
    }
} 