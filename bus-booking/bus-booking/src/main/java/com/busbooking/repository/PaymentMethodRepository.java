package com.busbooking.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.busbooking.entity.PaymentMethod;
import com.busbooking.entity.User;

@Repository
public interface PaymentMethodRepository extends JpaRepository<PaymentMethod, Long> {
    List<PaymentMethod> findByUserAndIsActiveTrue(User user);
    PaymentMethod findByUserAndIsDefaultTrue(User user);
} 