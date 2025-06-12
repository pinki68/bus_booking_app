package com.busbooking.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.busbooking.entity.Booking;
import com.busbooking.entity.User;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {
    
	List<Booking> findByUser(User user);
	List<Booking> findByUserOrderByBookingDateDesc(User user);
} 