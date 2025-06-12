package com.busbooking.service;

import com.busbooking.dto.PassengerRequest;
import com.busbooking.dto.PassengerResponse;
import com.busbooking.entity.Booking;
import com.busbooking.entity.Passenger;
import com.busbooking.repository.PassengerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class PassengerService {

    @Autowired
    private PassengerRepository passengerRepository;

    /**
     * Creates a new passenger
     *
     * @param request The passenger request data
     * @param booking The booking associated with the passenger
     * @return PassengerResponse with passenger details
     */
    @Transactional
    public PassengerResponse createPassenger(PassengerRequest request, Booking booking) {
        Passenger passenger = new Passenger();
        passenger.setName(request.getName());
        passenger.setAge(request.getAge());
        passenger.setGender(request.getGender());
        passenger.setSeatNumber(request.getSeatNumber());
        passenger.setBooking(booking);
        
        passenger = passengerRepository.save(passenger);
        return convertToPassengerResponse(passenger);
    }

    /**
     * Retrieves all passengers for a specific booking
     *
     * @param booking The booking to get passengers for
     * @return List of PassengerResponse objects
     */
    public List<PassengerResponse> getPassengersByBooking(Booking booking) {
        List<Passenger> passengers = passengerRepository.findByBooking(booking);
        return passengers.stream()
                .map(this::convertToPassengerResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get a passenger by ID
     *
     * @param id The passenger ID to retrieve
     * @return PassengerResponse with passenger details
     */
    public PassengerResponse getPassengerById(Long id) {
        Passenger passenger = passengerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Passenger not found with id: " + id));
        return convertToPassengerResponse(passenger);
    }

    /**
     * Update an existing passenger
     *
     * @param id The passenger ID to update
     * @param request The updated passenger data
     * @return PassengerResponse with updated passenger details
     */
    @Transactional
    public PassengerResponse updatePassenger(Long id, PassengerRequest request) {
        Passenger passenger = passengerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Passenger not found with id: " + id));
        
        passenger.setName(request.getName());
        passenger.setAge(request.getAge());
        passenger.setGender(request.getGender());
        passenger.setSeatNumber(request.getSeatNumber());
        
        passenger = passengerRepository.save(passenger);
        return convertToPassengerResponse(passenger);
    }

    /**
     * Delete a passenger by ID
     *
     * @param id The passenger ID to delete
     */
    @Transactional
    public void deletePassenger(Long id) {
        if (!passengerRepository.existsById(id)) {
            throw new RuntimeException("Passenger not found with id: " + id);
        }
        passengerRepository.deleteById(id);
    }

    /**
     * Converts a Passenger entity to a PassengerResponse DTO
     *
     * @param passenger The passenger entity to convert
     * @return PassengerResponse with passenger details
     */
    private PassengerResponse convertToPassengerResponse(Passenger passenger) {
        PassengerResponse response = new PassengerResponse();
        response.setId(passenger.getId());
        response.setName(passenger.getName());
        response.setAge(passenger.getAge());
        response.setGender(passenger.getGender());
        response.setSeatNumber(passenger.getSeatNumber());
        return response;
    }
} 