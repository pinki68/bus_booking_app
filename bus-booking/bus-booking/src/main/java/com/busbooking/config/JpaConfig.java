package com.busbooking.config;




import org.springframework.boot.autoconfigure.orm.jpa.HibernatePropertiesCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.EnableTransactionManagement;

import jakarta.persistence.EntityManagerFactory;
import java.util.Map;

@Configuration
@EnableTransactionManagement
public class JpaConfig {

    @Bean
    public HibernatePropertiesCustomizer hibernatePropertiesCustomizer() {
        return hibernateProperties -> {
            // Enable JPA transaction compliance
            hibernateProperties.put("hibernate.jpa_compliance.transaction", "true");
            
            // Additional Hibernate settings for better performance and stability
            hibernateProperties.put("hibernate.connection.provider_disables_autocommit", "true");
            hibernateProperties.put("hibernate.order_inserts", "true");
            hibernateProperties.put("hibernate.order_updates", "true");
            hibernateProperties.put("hibernate.query.fail_on_pagination_over_collection_fetch", "true");
            
            // Transaction settings
            hibernateProperties.put("hibernate.transaction.jta.platform", 
                    "org.hibernate.engine.transaction.jta.platform.internal.NoJtaPlatform");
            hibernateProperties.put("hibernate.allow_update_outside_transaction", "false");
        };
    }
    
    @Bean
    public PlatformTransactionManager transactionManager(EntityManagerFactory entityManagerFactory) {
        JpaTransactionManager txManager = new JpaTransactionManager();
        txManager.setEntityManagerFactory(entityManagerFactory);
        return txManager;
    }
} 