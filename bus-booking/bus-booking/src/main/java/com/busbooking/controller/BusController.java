package com.busbooking.controller;

import com.busbooking.dto.BusResponse;
import com.busbooking.service.BusService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/buses")
public class BusController {
    
    private static final Logger logger = LoggerFactory.getLogger(BusController.class);

    @Autowired
    private BusService busService;

    @GetMapping("/search")
    public ResponseEntity<List<BusResponse>> searchBuses(
            @RequestParam(required = false) String source,
            @RequestParam(required = false) String destination,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        
        logger.info("Searching buses with source={}, destination={}, date={}", source, destination, date);
        
        List<BusResponse> buses = busService.searchBuses(source, destination, date);
        
        logger.info("Found {} buses matching the search criteria", buses.size());
        
        return ResponseEntity.ok(buses);
    }

    @GetMapping("/advanced-search")
    public ResponseEntity<List<BusResponse>> advancedSearchBuses(
            @RequestParam(required = false) String source,
            @RequestParam(required = false) String destination,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) String busType,
            @RequestParam(required = false) Double minFare,
            @RequestParam(required = false) Double maxFare,
            @RequestParam(required = false) Integer minAvailableSeats,
            @RequestParam(required = false, defaultValue = "id") String sortBy,
            @RequestParam(required = false, defaultValue = "asc") String sortDirection) {
        
        logger.info("Advanced search with filters: source={}, destination={}, date={}, busType={}, " +
                "minFare={}, maxFare={}, minAvailableSeats={}, sortBy={}, sortDirection={}",
                source, destination, date, busType, minFare, maxFare, minAvailableSeats, sortBy, sortDirection);
        
        List<BusResponse> buses = busService.searchBusesWithFilters(
                source, destination, date, busType, minFare, maxFare, 
                minAvailableSeats, sortBy, sortDirection);
        
        logger.info("Found {} buses matching the advanced search criteria", buses.size());
        
        return ResponseEntity.ok(buses);
    }

    @GetMapping("/{id}")
    public ResponseEntity<BusResponse> getBusById(@PathVariable Long id) {
        logger.info("Fetching bus with id={}", id);
        BusResponse bus = busService.getBusById(id);
        return ResponseEntity.ok(bus);
    }
    
    @GetMapping("/filter-options")
    public ResponseEntity<Map<String, List<String>>> getFilterOptions() {
        logger.info("Fetching filter options for bus search");
        
        Map<String, List<String>> filterOptions = Map.of(
            "sources", busService.getAllSources(),
            "destinations", busService.getAllDestinations(),
            "busTypes", busService.getAllBusTypes()
        );
        
        return ResponseEntity.ok(filterOptions);
    }
} 