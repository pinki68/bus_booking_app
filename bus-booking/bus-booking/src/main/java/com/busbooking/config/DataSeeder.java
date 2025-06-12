package com.busbooking.config;


import com.busbooking.entity.Bus;
import com.busbooking.repository.BusRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;


import java.util.Arrays;
import java.util.List;

@Configuration
public class DataSeeder {
    
    private static final Logger logger = LoggerFactory.getLogger(DataSeeder.class);
    
    @Autowired
    private BusRepository busRepository;
    
    @Bean
    public CommandLineRunner seedData() {
        return args -> {
            // Only seed data if the bus table is empty
            if (busRepository.count() == 0) {
                logger.info("Seeding bus data...");
                
                List<Bus> buses = Arrays.asList(
                    createBus("KL01AB1234", "AC Sleeper", 40, "Bangalore", "Chennai", "10:00", "16:00", 800.0),
                    createBus("KL02CD5678", "AC Seater", 50, "Bangalore", "Hyderabad", "08:30", "17:30", 1200.0),
                    createBus("KL03EF9012", "Non-AC Sleeper", 35, "Chennai", "Coimbatore", "22:00", "06:00", 600.0),
                    createBus("KL04GH3456", "Volvo", 45, "Mumbai", "Pune", "07:00", "11:00", 500.0),
                    createBus("KL05IJ7890", "AC Sleeper", 38, "Delhi", "Jaipur", "10:00", "16:00", 900.0),
                    createBus("KL06KL1234", "Non-AC Seater", 55, "Kolkata", "Bhubaneswar", "06:30", "14:30", 700.0),
                    createBus("KL07MN5678", "AC Sleeper", 42, "Hyderabad", "Bangalore", "21:00", "06:00", 1100.0),
                    createBus("KL08OP9012", "Volvo", 48, "Chennai", "Bangalore", "16:00", "22:00", 850.0),
                    createBus("KL09QR3456", "AC Seater", 52, "Pune", "Mumbai", "15:30", "19:30", 550.0),
                    createBus("KL10ST7890", "Non-AC Sleeper", 36, "Jaipur", "Delhi", "20:00", "02:00", 750.0)
                );
                
                busRepository.saveAll(buses);
                
                logger.info("Successfully seeded {} buses", buses.size());
            } else {
                logger.info("Bus data already exists. Skipping seeding.");
            }
        };
    }
    
    private Bus createBus(String busNumber, String busType, int totalSeats, 
                         String source, String destination, String departureTime, 
                         String arrivalTime, Double fare) {
        Bus bus = new Bus();
        bus.setBusNumber(busNumber);
        bus.setBusType(busType);
        bus.setTotalSeats(totalSeats);
        bus.setAvailableSeats(totalSeats);
        bus.setSource(source);
        bus.setDestination(destination);
        bus.setDepartureTime(departureTime);
        bus.setArrivalTime(arrivalTime);
        bus.setFare(fare);
        return bus;
    }
} 