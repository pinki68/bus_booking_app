package com.busbooking.service;

import com.busbooking.dto.BookingRequest;
import com.busbooking.dto.BookingResponse;
import com.busbooking.dto.PassengerRequest;
import com.busbooking.dto.PassengerResponse;
import com.busbooking.entity.Booking;
import com.busbooking.entity.Bus;
import com.busbooking.entity.Passenger;
import com.busbooking.entity.User;
import com.busbooking.repository.BookingRepository;
import com.busbooking.repository.BusRepository;
import com.busbooking.repository.PassengerRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.interceptor.TransactionAspectSupport;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class BookingService {

    private final BookingRepository bookingRepository;
    private final BusRepository busRepository;
    private final BusService busService;
    private final PassengerRepository passengerRepository;
    private final PassengerService passengerService;
    private static final Logger logger = LoggerFactory.getLogger(BookingService.class);

    @Autowired
    public BookingService(
            BookingRepository bookingRepository, 
            BusRepository busRepository, 
            BusService busService,
            PassengerRepository passengerRepository,
            PassengerService passengerService) {
        this.bookingRepository = bookingRepository;
        this.busRepository = busRepository;
        this.busService = busService;
        this.passengerRepository = passengerRepository;
        this.passengerService = passengerService;
    }

    public List<BookingResponse> getUserBookings(User user) {
        List<Booking> bookings = bookingRepository.findByUserOrderByBookingDateDesc(user);
        return bookings.stream()
                .map(this::convertToDetailedBookingResponse)
                .collect(Collectors.toList());
    }

    public BookingResponse getBookingById(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found with id: " + bookingId));
        return convertToDetailedBookingResponse(booking);
    }

    /**
     * Creates a booking with complete passenger information
     */
    @Transactional
    public BookingResponse createBooking(User user, BookingRequest bookingRequest) {
        Long busId = bookingRequest.getBusId();
        int seatCount = bookingRequest.getNumberOfSeats();
        List<PassengerRequest> passengerRequests = bookingRequest.getPassengers();
        
        // Validate passenger count matches seat count
        if (passengerRequests.size() != seatCount) {
            throw new RuntimeException("Number of passengers must match number of seats");
        }
        
        Bus bus = busRepository.findById(busId)
                .orElseThrow(() -> new RuntimeException("Bus not found with id: " + busId));
        
        // Try to reserve seats with limited retries in case of concurrent reservations
        int maxRetries = 3;
        boolean seatsReserved = false;
        
        for (int attempt = 0; attempt < maxRetries && !seatsReserved; attempt++) {
            try {
                seatsReserved = busService.checkAndReserveSeats(busId, seatCount);
                if (!seatsReserved) {
                    // Check if seats are still available before giving up
                    Bus currentBus = busRepository.findById(busId).orElse(null);
                    if (currentBus == null || currentBus.getAvailableSeats() < seatCount) {
                        throw new RuntimeException("Not enough seats available");
                    }
                    // Small delay before retry
                    Thread.sleep(100);
                }
            } catch (Exception e) {
                // If it's the last attempt, rethrow the exception
                if (attempt == maxRetries - 1) {
                    throw new RuntimeException("Failed to reserve seats: " + e.getMessage());
                }
                // Otherwise, try again
                try {
                    Thread.sleep(100); // Small delay before retry
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    throw new RuntimeException("Booking process was interrupted");
                }
            }
        }
        
        // If we couldn't reserve seats after all retries
        if (!seatsReserved) {
            throw new RuntimeException("Not enough seats available");
        }
        
        // Create booking
        Booking booking = new Booking();
        booking.setUser(user);
        booking.setBus(bus);
        booking.setNumberOfSeats(seatCount);
        booking.setTotalAmount(bus.getFare() * seatCount);
        booking.setBookingDate(LocalDateTime.now());
        booking.setStatus("PENDING"); // Initially set as pending until payment is confirmed
        
        // Save booking first to get an ID
        Booking savedBooking = bookingRepository.save(booking);
        
        // Create passengers from the request
        for (PassengerRequest passengerRequest : passengerRequests) {
            passengerService.createPassenger(passengerRequest, savedBooking);
        }
        
        return convertToDetailedBookingResponse(savedBooking);
    }

    @Transactional
    public BookingResponse createBooking(User user, Long busId, int seatCount, List<String> passengerNames) {
        if (user == null) {
            throw new RuntimeException("User cannot be null");
        }
        
        if (passengerNames == null || passengerNames.isEmpty()) {
            throw new RuntimeException("Passenger information is required");
        }
        
        if (passengerNames.size() != seatCount) {
            throw new RuntimeException("Number of passengers must match seat count");
        }
        
        Bus bus = busRepository.findById(busId)
                .orElseThrow(() -> new RuntimeException("Bus not found with id: " + busId));
        
        // Log bus status before attempting to reserve seats
        logger.debug("Bus status before reservation: ID={}, Available seats={}, Required seats={}",
                busId, bus.getAvailableSeats(), seatCount);
                
        if (bus.getAvailableSeats() < seatCount) {
            throw new RuntimeException("Not enough seats available: requested " + seatCount + 
                    ", but only " + bus.getAvailableSeats() + " are available");
        }
        
        // Try to reserve seats
        boolean seatsReserved = busService.checkAndReserveSeats(busId, seatCount);
        if (!seatsReserved) {
            throw new RuntimeException("Failed to reserve seats. Please try again.");
        }
        
        try {
            // Create booking
            Booking booking = new Booking();
            booking.setUser(user);
            booking.setBus(bus);
            booking.setNumberOfSeats(seatCount);
            booking.setTotalAmount(bus.getFare() * seatCount);
            booking.setBookingDate(LocalDateTime.now());
            booking.setStatus("PENDING"); // Initially set as pending until payment is confirmed
            
            // Save booking first to get an ID
            Booking savedBooking = bookingRepository.save(booking);
            logger.debug("Created booking with ID: {}", savedBooking.getId());
            
            // Create passengers
            List<Passenger> passengers = new ArrayList<>();
            for (int i = 0; i < passengerNames.size(); i++) {
                String passengerName = passengerNames.get(i);
                if (passengerName == null || passengerName.trim().isEmpty()) {
                    throw new RuntimeException("Passenger name cannot be empty");
                }
                
                Passenger passenger = new Passenger();
                passenger.setName(passengerName);
                // Default values for demo - in a real app these would come from request
                passenger.setAge(30);
                passenger.setGender("Not specified");
                passenger.setSeatNumber(String.valueOf(i + 1)); // Assign sequential seat numbers
                passenger.setBooking(savedBooking);
                passengers.add(passengerRepository.save(passenger));
            }
            
            logger.debug("Created {} passengers for booking {}", passengers.size(), savedBooking.getId());
            return convertToDetailedBookingResponse(savedBooking);
        } catch (Exception e) {
            // If anything goes wrong after reserving seats, release them
            logger.error("Error occurred after seat reservation: {}", e.getMessage());
            try {
                busService.updateBusAvailableSeats(busId, seatCount);
                logger.debug("Seats were released after error");
            } catch (Exception ex) {
                logger.error("Failed to release seats after error: {}", ex.getMessage());
            }
            throw e;
        }
    }
    
    @Transactional
    public BookingResponse cancelBooking(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found with id: " + bookingId));
        
        // Check if booking can be cancelled (e.g., not already cancelled)
        if ("CANCELLED".equals(booking.getStatus())) {
            throw new RuntimeException("Booking is already cancelled");
        }
        
        // Update booking status
        booking.setStatus("CANCELLED");
        
        // Restore available seats
        busService.updateBusAvailableSeats(booking.getBus().getId(), booking.getNumberOfSeats());
        
        Booking updatedBooking = bookingRepository.save(booking);
        return convertToDetailedBookingResponse(updatedBooking);
    }
    
    /**
     * Confirm a booking after successful payment
     */
    @Transactional
    public BookingResponse confirmBooking(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found with id: " + bookingId));
        
        // Check if booking can be confirmed (e.g., currently pending)
        if (!"PENDING".equals(booking.getStatus())) {
            throw new RuntimeException("Booking is not in PENDING state and cannot be confirmed");
        }
        
        // Update booking status to confirmed
        booking.setStatus("CONFIRMED");
        
        Booking updatedBooking = bookingRepository.save(booking);
        return convertToDetailedBookingResponse(updatedBooking);
    }
    
    /**
     * Update booking status
     */
    @Transactional
    public BookingResponse updateBookingStatus(Long bookingId, String status) {
        if (!isValidStatus(status)) {
            throw new RuntimeException("Invalid booking status: " + status);
        }
        
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found with id: " + bookingId));
        
        // If changing from a status other than CANCELLED to CANCELLED, restore seats
        if ("CANCELLED".equals(status) && !"CANCELLED".equals(booking.getStatus())) {
            busService.updateBusAvailableSeats(booking.getBus().getId(), booking.getNumberOfSeats());
        }
        
        booking.setStatus(status);
        Booking updatedBooking = bookingRepository.save(booking);
        return convertToDetailedBookingResponse(updatedBooking);
    }
    
    /**
     * Check if a booking status is valid
     */
    private boolean isValidStatus(String status) {
        return "PENDING".equals(status) || 
               "CONFIRMED".equals(status) || 
               "CANCELLED".equals(status);
    }
    
    // Basic booking response without passenger details
    private BookingResponse convertToBookingResponse(Booking booking) {
        BookingResponse response = new BookingResponse();
        response.setId(booking.getId());
        response.setUserId(booking.getUser().getId());
        response.setUsername(booking.getUser().getUsername());
        response.setBusId(booking.getBus().getId());
        response.setBusNumber(booking.getBus().getBusNumber());
        response.setSource(booking.getBus().getSource());
        response.setDestination(booking.getBus().getDestination());
        response.setDepartureTime(booking.getBus().getDepartureTime());
        response.setArrivalTime(booking.getBus().getArrivalTime());
        response.setNumberOfSeats(booking.getNumberOfSeats());
        response.setTotalAmount(booking.getTotalAmount());
        response.setBookingDate(booking.getBookingDate());
        response.setStatus(booking.getStatus());
        return response;
    }
    
    // Detailed booking response including passenger information
    private BookingResponse convertToDetailedBookingResponse(Booking booking) {
        BookingResponse response = convertToBookingResponse(booking);
        
        // Add passenger details
        List<Passenger> passengers = passengerRepository.findByBooking(booking);
        response.setPassengers(passengers.stream()
                .map(this::convertToPassengerResponse)
                .collect(Collectors.toList()));
        
        return response;
    }
    
    // Convert passenger entity to DTO
    private PassengerResponse convertToPassengerResponse(Passenger passenger) {
        PassengerResponse response = new PassengerResponse();
        response.setId(passenger.getId());
        response.setName(passenger.getName());
        response.setAge(passenger.getAge());
        response.setGender(passenger.getGender());
        response.setSeatNumber(passenger.getSeatNumber());
        return response;
    }

    /**
     * Get all bookings with pagination and sorting
     */
    public List<BookingResponse> getAllBookings(Integer page, Integer size, String sortBy, String direction) {
        int pageNumber = (page != null) ? page : 0;
        int pageSize = (size != null) ? size : 10;
        String sortField = (sortBy != null) ? sortBy : "bookingDate";
        String sortDirection = (direction != null && direction.equalsIgnoreCase("asc")) ? "asc" : "desc";
        
        List<Booking> bookings;
        if (sortDirection.equals("asc")) {
            bookings = bookingRepository.findAll().stream()
                .sorted(getComparator(sortField))
                .skip(pageNumber * pageSize)
                .limit(pageSize)
                .collect(Collectors.toList());
        } else {
            bookings = bookingRepository.findAll().stream()
                .sorted(getComparator(sortField).reversed())
                .skip(pageNumber * pageSize)
                .limit(pageSize)
                .collect(Collectors.toList());
        }
        
        return bookings.stream()
                .map(this::convertToDetailedBookingResponse)
                .collect(Collectors.toList());
    }
    
    /**
     * Get bookings by date range
     */
    public List<BookingResponse> getBookingsByDateRange(LocalDateTime startDate, LocalDateTime endDate, String status) {
        List<Booking> bookings = bookingRepository.findAll().stream()
                .filter(booking -> (startDate == null || !booking.getBookingDate().isBefore(startDate)))
                .filter(booking -> (endDate == null || !booking.getBookingDate().isAfter(endDate)))
                .filter(booking -> (status == null || status.isEmpty() || booking.getStatus().equalsIgnoreCase(status)))
                .collect(Collectors.toList());
                
        return bookings.stream()
                .map(this::convertToDetailedBookingResponse)
                .collect(Collectors.toList());
    }
    
    /**
     * Get comparator for booking sorting
     */
    private Comparator<Booking> getComparator(String sortBy) {
        switch (sortBy.toLowerCase()) {
            case "id":
                return Comparator.comparing(Booking::getId);
            case "bookingdate":
                return Comparator.comparing(Booking::getBookingDate);
            case "totalamount":
                return Comparator.comparing(Booking::getTotalAmount);
            case "numberofseats":
                return Comparator.comparing(Booking::getNumberOfSeats);
            case "status":
                return Comparator.comparing(Booking::getStatus);
            default:
                return Comparator.comparing(Booking::getBookingDate);
        }
    }
    

    @Transactional
    public void bookTicket(Booking booking) {
        try {
            bookingRepository.save(booking);

            // Some other logic that might throw exceptions
            // ...

        } catch (Exception ex) {
            // Mark transaction rollback if needed
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            throw new RuntimeException("Booking failed", ex);
        }
    }
    
    
    
    
    
} 