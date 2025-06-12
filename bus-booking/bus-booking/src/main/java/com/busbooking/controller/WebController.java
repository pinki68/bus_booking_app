package com.busbooking.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
public class WebController {
    
    @GetMapping("/")
    public String home() {
        return "index";
    }
    
    @GetMapping("/register")
    public String register() {
        return "register";
    }
    
    @GetMapping("/login")
    public String login(@RequestParam(required = false) String redirect, 
    @RequestParam(required = false) String error,Model model) {
    	if (redirect != null) {
    		model.addAttribute("redirect", redirect);
    	}
    	if (error != null) {
    		model.addAttribute("error", error);
    	}
 
    
    
    
    
    
        return "login";
    }
    
    @GetMapping("/buses")
    public String buses() {
        return "buses";
    }
    
    @GetMapping("/bookings")
    public String bookings() {
        return "bookings";
    }
    
    @GetMapping("/booking/{busId}")
    public String booking(@PathVariable Long busId, Model model) {
        model.addAttribute("busId", busId);
        return "booking";
    }
    
    @GetMapping("/payment")
    public String payment() {
        return "payment";
    }
    
    
    @GetMapping("/booking-success")
    public String bookingSuccess() {
        return "booking-success";
    }
    


    
    
    
    
    @GetMapping("/test-static")
    public String testStatic() {
        return "forward:/test.html";
    }
    
    @GetMapping("/api/static/{resource}")
    public String resourceForward(@PathVariable String resource) {
        return "forward:/" + resource;
    }
    
    @GetMapping("/passenger-form")
    public String passengerForm() {
        return "passenger-form";
    }
    
    @GetMapping("/passenger-form/{busId}")
    public String passengerFormWithBusId(@PathVariable Long busId, Model model) {
        model.addAttribute("busId", busId);
        return "passenger-form";
    }
    
    // New booking form routes
    @GetMapping("/booking-form")
    public String bookingForm() {
        return "booking-form";
    }
    
    @GetMapping("/booking-form/{busId}")
    public String bookingFormWithBusId(@PathVariable Long busId, Model model) {
        model.addAttribute("busId", busId);
        return "booking-form";
    }
    
    // For mock data testing - multiple patterns for flexibility
    @GetMapping("/test-static/mock-bus-{id}.json")
    public String mockBusData(@PathVariable String id) {
        return "forward:/mock-bus-" + id + ".json";
    }
    
    @GetMapping("/mock-bus-{id}.json")
    public String directMockBusData(@PathVariable String id) {
        return "forward:/mock-bus-" + id + ".json";
    }
    
    @GetMapping("/static/mock-bus-{id}.json")
    public String staticMockBusData(@PathVariable String id) {
        return "forward:/mock-bus-" + id + ".json";
    }
} 