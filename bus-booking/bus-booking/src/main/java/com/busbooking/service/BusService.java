package com.busbooking.service;

import com.busbooking.dto.BusResponse;
import com.busbooking.entity.Bus;
import com.busbooking.repository.BusRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class BusService {

    @Autowired
    private BusRepository busRepository;

    public List<BusResponse> searchBuses(String source, String destination, LocalDate date) {
        List<Bus> buses;
        
        if (source != null && destination != null) {
            buses = busRepository.findBySourceAndDestination(source, destination);
        } else if (source != null) {
            buses = busRepository.findBySource(source);
        } else if (destination != null) {
            buses = busRepository.findByDestination(destination);
        } else {
            buses = busRepository.findAll();
        }
        
        // We're ignoring date filtering for now as our bus data only contains time without date
        // In a real application, you would store full datetime and filter properly
        
        return buses.stream()
                .map(this::convertToBusResponse)
                .collect(Collectors.toList());
    }

    public List<BusResponse> searchBusesWithFilters(
            String source, 
            String destination, 
            LocalDate date,
            String busType,
            Double minFare,
            Double maxFare,
            Integer minAvailableSeats,
            String sortBy,
            String sortDirection) {
        
        List<Bus> buses;
        
        if (source != null && destination != null) {
            buses = busRepository.findBySourceAndDestination(source, destination);
        } else if (source != null) {
            buses = busRepository.findBySource(source);
        } else if (destination != null) {
            buses = busRepository.findByDestination(destination);
        } else {
            buses = busRepository.findAll();
        }
        
        // Apply additional filters
        List<BusResponse> result = buses.stream()
                .filter(bus -> busType == null || bus.getBusType().equalsIgnoreCase(busType))
                .filter(bus -> minFare == null || bus.getFare() >= minFare)
                .filter(bus -> maxFare == null || bus.getFare() <= maxFare)
                .filter(bus -> minAvailableSeats == null || bus.getAvailableSeats() >= minAvailableSeats)
                .map(this::convertToBusResponse)
                .collect(Collectors.toList());
        
        // Apply sorting
        if (sortBy != null) {
            Comparator<BusResponse> comparator = getComparator(sortBy);
            if ("desc".equalsIgnoreCase(sortDirection)) {
                comparator = comparator.reversed();
            }
            result.sort(comparator);
        }
        
        return result;
    }
    
    private Comparator<BusResponse> getComparator(String sortBy) {
        switch (sortBy.toLowerCase()) {
            case "fare":
                return Comparator.comparing(BusResponse::getFare);
            case "departuretime":
                return Comparator.comparing(bus -> {
                    try {
                        // Assuming departure time is stored as HH:mm format
                        return LocalTime.parse(bus.getDepartureTime(), DateTimeFormatter.ofPattern("HH:mm"));
                    } catch (Exception e) {
                        return LocalTime.MIDNIGHT; // Default value for comparison
                    }
                });
            case "arrivaltime":
                return Comparator.comparing(bus -> {
                    try {
                        return LocalTime.parse(bus.getArrivalTime(), DateTimeFormatter.ofPattern("HH:mm"));
                    } catch (Exception e) {
                        return LocalTime.MIDNIGHT;
                    }
                });
            case "availableseats":
                return Comparator.comparing(BusResponse::getAvailableSeats);
            case "bustype":
                return Comparator.comparing(BusResponse::getBusType);
            default:
                return Comparator.comparing(BusResponse::getId);
        }
    }
    
    public BusResponse getBusById(Long id) {
        Bus bus = busRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Bus not found with id: " + id));
        return convertToBusResponse(bus);
    }
    
    // Method for internal use when we need the actual Bus entity
    public Bus getBusEntityById(Long id) {
        return busRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Bus not found with id: " + id));
    }
    
    @Transactional
    public void updateBusAvailableSeats(Long busId, int seatChange) {
        Bus bus = busRepository.findById(busId)
                .orElseThrow(() -> new RuntimeException("Bus not found with id: " + busId));
        bus.setAvailableSeats(bus.getAvailableSeats() + seatChange);
        busRepository.save(bus);
    }
    
    /**
     * Checks and updates seat availability in a synchronized way to prevent race conditions
     * @param busId the ID of the bus
     * @param seatsNeeded the number of seats being requested
     * @return true if seats were successfully reserved, false otherwise
     */
    @Transactional
    public boolean checkAndReserveSeats(Long busId, int seatsNeeded) {
        try {
            // Use pessimistic locking to ensure only one transaction can modify the bus at a time
            Bus bus = busRepository.findByIdWithLock(busId)
                    .orElseThrow(() -> new RuntimeException("Bus not found with id: " + busId));
            
            org.slf4j.LoggerFactory.getLogger(BusService.class).debug(
                "Checking seat availability for bus {}: available={}, needed={}",
                busId, bus.getAvailableSeats(), seatsNeeded);
                    
            // Check if enough seats are available
            if (bus.getAvailableSeats() < seatsNeeded) {
                org.slf4j.LoggerFactory.getLogger(BusService.class).warn(
                    "Not enough seats available for bus {}: available={}, requested={}",
                    busId, bus.getAvailableSeats(), seatsNeeded);
                return false;
            }
            
            // Update available seats in bus
            int newAvailableSeats = bus.getAvailableSeats() - seatsNeeded;
            bus.setAvailableSeats(newAvailableSeats);
            busRepository.save(bus);
            
            org.slf4j.LoggerFactory.getLogger(BusService.class).debug(
                "Successfully reserved {} seats for bus {}. New available seats: {}",
                seatsNeeded, busId, newAvailableSeats);
            
            return true;
        } catch (Exception e) {
            org.slf4j.LoggerFactory.getLogger(BusService.class).error(
                "Error reserving seats for bus {}: {}", busId, e.getMessage(), e);
            return false;
        }
    }
    
    public List<String> getAllSources() {
        return busRepository.findAll().stream()
                .map(Bus::getSource)
                .distinct()
                .sorted()
                .collect(Collectors.toList());
    }
    
    public List<String> getAllDestinations() {
        return busRepository.findAll().stream()
                .map(Bus::getDestination)
                .distinct()
                .sorted()
                .collect(Collectors.toList());
    }
    
    public List<String> getAllBusTypes() {
        return busRepository.findAll().stream()
                .map(Bus::getBusType)
                .distinct()
                .sorted()
                .collect(Collectors.toList());
    }
    
    private BusResponse convertToBusResponse(Bus bus) {
        BusResponse response = new BusResponse();
        response.setId(bus.getId());
        response.setBusNumber(bus.getBusNumber());
        response.setBusType(bus.getBusType());
        response.setTotalSeats(bus.getTotalSeats());
        response.setSource(bus.getSource());
        response.setDestination(bus.getDestination());
        response.setDepartureTime(bus.getDepartureTime());
        response.setArrivalTime(bus.getArrivalTime());
        response.setFare(bus.getFare());
        response.setAvailableSeats(bus.getAvailableSeats());
        
        
        // Generate a bus name based on the bus number and type if needed
        String generatedBusName;
        if (bus.getBusNumber().startsWith("KA")) {
            generatedBusName = "Karnataka Express";
        } else if (bus.getBusNumber().startsWith("TN")) {
            generatedBusName = "Tamil Nadu Express";
        } else if (bus.getBusNumber().startsWith("KL")) {
            generatedBusName = "Kerala Express";
        } else if (bus.getBusNumber().startsWith("AP")) {
            generatedBusName = "Andhra Pradesh Express";
        } else {
            generatedBusName = bus.getBusType() + " Express";
        }
        response.setBusName(generatedBusName);
        
        
        
        
        
        
        
        
        
        
        return response;
    }
} 