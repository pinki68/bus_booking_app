// passenger-form.js - Handles the passenger form functionality

// Global passengers array to store all added passengers
let passengers = [];

document.addEventListener('DOMContentLoaded', function() {
    console.log('Passenger form loaded - DOM Content Loaded');
    
    // Check if we have a busId in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const busId = urlParams.get('busId');
    
    console.log('URL Parameters:', Object.fromEntries(urlParams.entries()));
    console.log('Bus ID from URL:', busId);
    
    // Load passengers from localStorage if they exist for this busId
    loadSavedPassengers(busId);
    
    if (busId) {
        // Try to load bus details
        loadBusDetails(busId);
    } else {
        // Check if there's a busId in the path instead
        const pathParts = window.location.pathname.split('/');
        const pathBusId = pathParts[pathParts.length - 1];
        
        if (pathBusId && !isNaN(pathBusId)) {
            console.log('Found Bus ID in path:', pathBusId);
            loadBusDetails(pathBusId);
        } else {
            // Show error message if no busId is provided
            console.error('No busId found in URL parameters or path');
            document.querySelector('.passenger-form-container').innerHTML = `
                <div class="alert alert-danger">
                    <h4><i class="fas fa-exclamation-triangle"></i> No Bus Selected</h4>
                    <p>Please select a bus first to continue with booking.</p>
                    <a href="/buses" class="btn btn-primary">
                        <i class="fas fa-bus"></i> View Available Buses
                    </a>
                </div>
            `;
        }
    }
    
    // Initialize form event listeners
    initFormListeners();
});

// Load saved passengers from localStorage
function loadSavedPassengers(busId) {
    try {
        const savedData = localStorage.getItem(`passengers_${busId}`);
        if (savedData) {
            passengers = JSON.parse(savedData);
            console.log('Loaded saved passengers:', passengers);
            
            // Display the saved passengers
            if (passengers.length > 0) {
                document.getElementById('passengerSummary').style.display = 'block';
                passengers.forEach(passenger => {
                    addPassengerToList(passenger, false); // false = don't save again
                });
                updatePassengerSummary();
            }
        }
    } catch (e) {
        console.error('Error loading saved passengers:', e);
    }
}

// Save passengers to localStorage
function savePassengers(busId) {
    try {
        localStorage.setItem(`passengers_${busId}`, JSON.stringify(passengers));
        console.log('Saved passengers to localStorage:', passengers);
    } catch (e) {
        console.error('Error saving passengers:', e);
    }
}

// Get all passengers data
function getAllPassengerData() {
    return passengers;
}

// Load bus details from the API
function loadBusDetails(busId) {
    // Show loading indicator
    document.getElementById('sourceCity').innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    document.getElementById('destinationCity').innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    document.getElementById('journeyDate').innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    document.getElementById('ticketFare').innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    
    console.log('Attempting to load bus details for busId:', busId);
    
    // Get auth token if available
    const token = localStorage.getItem('authToken');
    const headers = token ? { 'Authorization': 'Bearer ' + token } : {};
    
    // Add Content-Type header
    headers['Content-Type'] = 'application/json';
    
    // Fetch bus details from API
    fetch(`/api/buses/${busId}`, {
        method: 'GET',
        headers: headers
    })
    .then(response => {
        console.log('Bus API response status:', response.status);
        if (!response.ok) {
            return response.text().then(text => {
                console.error('API Error Response:', text);
                throw new Error('Failed to load bus details. Status: ' + response.status);
            });
        }
        return response.json();
    })
    .then(bus => {
        console.log('Bus details loaded successfully:', bus);
        displayBusDetails(bus);
    })
    .catch(error => {
        console.error('Error loading bus details:', error);
        
        // Try to fetch mock data instead
        console.log('Attempting to use mock data instead');
        fetch(`/test-static/mock-bus-${busId}.json`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('No mock data available');
                }
                return response.json();
            })
            .then(mockBus => {
                console.log('Using mock data:', mockBus);
                displayBusDetails(mockBus);
            })
            .catch(mockError => {
                console.error('Mock data fetch failed:', mockError);
                // Show error message with retry button
                showErrorMessage(error.message);
            });
    });
    
    // Fallback if fetch times out (after 10 seconds)
    setTimeout(() => {
        const sourceElement = document.getElementById('sourceCity');
        if (sourceElement && sourceElement.innerHTML.includes('fa-spinner')) {
            console.error('Bus details fetch timed out');
            showTimeoutMessage();
        }
    }, 10000);
}

// Display bus details in the UI
function displayBusDetails(bus) {
    // Update the trip details section
    document.getElementById('sourceCity').textContent = bus.source || 'N/A';
    document.getElementById('destinationCity').textContent = bus.destination || 'N/A';
    
    // Format the departure date
    let formattedDate = 'N/A';
    if (bus.departureTime) {
        try {
            const departureDate = new Date(bus.departureTime);
            formattedDate = departureDate.toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });
        } catch (e) {
            console.error('Error formatting date:', e);
            formattedDate = 'Invalid Date';
        }
    }
    document.getElementById('journeyDate').textContent = formattedDate;
    
    // Set the fare
    document.getElementById('ticketFare').textContent = bus.price ? `₹${bus.price}` : 'N/A';
    
    // Initialize the seat map with booked seats if available
    const bookedSeats = bus.bookedSeats || [];
    console.log('Booked seats:', bookedSeats);
    generateSeatMap(bookedSeats);
}

// Show error message
function showErrorMessage(message) {
    document.querySelector('.passenger-form-container').innerHTML = `
        <div class="alert alert-danger">
            <h4><i class="fas fa-exclamation-triangle"></i> Error Loading Bus Details</h4>
            <p>We couldn't load the details for this bus. Error: ${message}</p>
            <div class="mt-3">
                <button class="btn btn-primary me-2" onclick="location.reload()">
                    <i class="fas fa-sync"></i> Retry
                </button>
                <a href="/buses" class="btn btn-outline-secondary">
                    <i class="fas fa-arrow-left"></i> Return to Bus List
                </a>
            </div>
        </div>
    `;
}

// Show timeout message
function showTimeoutMessage() {
    document.querySelector('.passenger-form-container').innerHTML = `
        <div class="alert alert-warning">
            <h4><i class="fas fa-clock"></i> Request Timed Out</h4>
            <p>We couldn't load the bus details in a reasonable time. The server might be busy.</p>
            <div class="mt-3">
                <button class="btn btn-primary me-2" onclick="location.reload()">
                    <i class="fas fa-sync"></i> Retry
                </button>
                <a href="/buses" class="btn btn-outline-secondary">
                    <i class="fas fa-arrow-left"></i> Return to Bus List
                </a>
            </div>
        </div>
    `;
}

// Initialize all form event listeners
function initFormListeners() {
    // Form submission
    document.getElementById('passengerForm').addEventListener('submit', function(e) {
        e.preventDefault();
        addPassenger();
    });
    
    // Proceed button
    document.getElementById('proceedBtn').addEventListener('click', proceedToPayment);
    
    // Cancel button
    document.getElementById('cancelBtn').addEventListener('click', function() {
        if (confirm('Are you sure you want to cancel this booking?')) {
            window.location.href = '/buses';
        }
    });
    
    // Checkbox handling for seat preferences
    const preferenceCheckboxes = document.querySelectorAll('#passengerForm input[type="checkbox"]');
    preferenceCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            // If window and aisle are mutually exclusive
            if (this.id === 'prefWindow' && this.checked) {
                document.getElementById('prefAisle').checked = false;
            } else if (this.id === 'prefAisle' && this.checked) {
                document.getElementById('prefWindow').checked = false;
            }
            
            // If front and back are mutually exclusive
            if (this.id === 'prefFront' && this.checked) {
                document.getElementById('prefBack').checked = false;
            } else if (this.id === 'prefBack' && this.checked) {
                document.getElementById('prefFront').checked = false;
            }
        });
    });
}

// Generate the seat map
function generateSeatMap(bookedSeats = []) {
    const seatMap = document.getElementById('seatMap');
    seatMap.innerHTML = '';
    
    // Number of seats in each row
    const seatsPerRow = 4;
    
    // Total number of seats
    const totalSeats = 40;
    
    // Generate the seat map
    for (let i = 1; i <= totalSeats; i++) {
        const seat = document.createElement('div');
        seat.className = 'seat';
        seat.textContent = i;
        seat.dataset.seatNumber = i;
        
        if (bookedSeats.includes(i)) {
            seat.classList.add('booked');
        } else {
            seat.classList.add('available');
            seat.addEventListener('click', function() {
                selectSeat(i);
            });
        }
        
        seatMap.appendChild(seat);
        
        // Add an aisle after the 2nd seat in each row
        if (i % seatsPerRow === 2) {
            const aisle = document.createElement('div');
            aisle.className = 'aisle';
            seatMap.appendChild(aisle);
        }
    }
}

// Handle seat selection
function selectSeat(seatNumber) {
    // Clear previous selections
    document.querySelectorAll('.seat.selected').forEach(seat => {
        seat.classList.remove('selected');
        seat.classList.add('available');
    });
    
    // Select the new seat
    const seatElement = document.querySelector(`.seat[data-seat-number="${seatNumber}"]`);
    if (seatElement) {
        seatElement.classList.remove('available');
        seatElement.classList.add('selected');
    }
    
    // Update the seat number input
    document.getElementById('seatNumber').value = seatNumber;
}

// Add a new passenger
function addPassenger() {
    // Get form values
    const name = document.getElementById('passengerName').value;
    const age = document.getElementById('passengerAge').value;
    const gender = document.getElementById('passengerGender').value;
    const seatNumber = document.getElementById('seatNumber').value;
    const idType = document.getElementById('idType').value;
    const idNumber = document.getElementById('idNumber').value;
    const specialRequests = document.getElementById('specialRequests').value;
    
    // Get preferences
    const preferences = [];
    if (document.getElementById('prefWindow').checked) preferences.push('Window');
    if (document.getElementById('prefAisle').checked) preferences.push('Aisle');
    if (document.getElementById('prefFront').checked) preferences.push('Front');
    if (document.getElementById('prefBack').checked) preferences.push('Back');
    
    // Validate required fields
    if (!name || !age || !gender || !seatNumber) {
        alert('Please fill all required fields and select a seat.');
        return;
    }
    
    // Check for duplicate seat selection
    const existingPassengerWithSeat = passengers.find(p => p.seatNumber === seatNumber);
    if (existingPassengerWithSeat) {
        alert(`Seat ${seatNumber} is already assigned to ${existingPassengerWithSeat.name}. Please select a different seat.`);
        return;
    }
    
    // Create passenger object
    const passenger = {
        name,
        age: parseInt(age),
        gender,
        seatNumber,
        idType,
        idNumber,
        preferences,
        specialRequests
    };
    
    // Add to global passengers array
    passengers.push(passenger);
    
    // Add passenger to the list
    addPassengerToList(passenger, true);
    
    // Clear form
    document.getElementById('passengerForm').reset();
    document.getElementById('seatNumber').value = '';
    
    // Mark seat as booked
    const seatElement = document.querySelector(`.seat[data-seat-number="${seatNumber}"]`);
    if (seatElement) {
        seatElement.classList.remove('selected');
        seatElement.classList.add('booked');
        
        // Remove event listener more safely
        const newElement = seatElement.cloneNode(true);
        seatElement.parentNode.replaceChild(newElement, seatElement);
    }
    
    // Update UI
    updatePassengerSummary();
    
    // Show feedback
    alert(`Passenger ${name} added successfully with seat ${seatNumber}!`);
}

// Add passenger to the list in the UI
function addPassengerToList(passenger, saveToStorage = true) {
    // Show the passenger summary section
    document.getElementById('passengerSummary').style.display = 'block';
    
    // Get the passengers list
    const passengersList = document.getElementById('passengersList');
    
    // Create a passenger card
    const card = document.createElement('div');
    card.className = 'passenger-card';
    card.dataset.seatNumber = passenger.seatNumber;
    
    // Create preference tags HTML
    const preferenceTags = passenger.preferences && passenger.preferences.length > 0 
        ? passenger.preferences.map(pref => `<span class="preference-tag">${pref}</span>`).join('') 
        : 'None';
    
    // Create special requests HTML
    const specialRequestsHtml = passenger.specialRequests 
        ? `<div class="special-request">${passenger.specialRequests}</div>` 
        : '';
    
    // Set the card content
    card.innerHTML = `
        <button type="button" class="remove-btn" onclick="removePassenger('${passenger.seatNumber}')">
            <i class="fas fa-times-circle"></i>
        </button>
        <h5>${passenger.name} - Seat ${passenger.seatNumber}</h5>
        <div class="row">
            <div class="col-md-6">
                <p><strong>Age:</strong> ${passenger.age}</p>
                <p><strong>Gender:</strong> ${passenger.gender}</p>
            </div>
            <div class="col-md-6">
                ${passenger.idType ? `<p><strong>${passenger.idType}:</strong> ${passenger.idNumber}</p>` : ''}
                <p><strong>Preferences:</strong> ${preferenceTags}</p>
            </div>
        </div>
        ${specialRequestsHtml}
    `;
    
    // Add the card to the list
    passengersList.appendChild(card);
    
    // Enable the proceed button
    document.getElementById('proceedBtn').disabled = false;
    
    // Save to localStorage if needed
    if (saveToStorage) {
        const urlParams = new URLSearchParams(window.location.search);
        const busId = urlParams.get('busId') || window.location.pathname.split('/').pop();
        savePassengers(busId);
    }
}

// Remove a passenger
function removePassenger(seatNumber) {
    // Remove from the global array
    const index = passengers.findIndex(p => p.seatNumber === seatNumber);
    if (index !== -1) {
        passengers.splice(index, 1);
        
        // Save the updated list
        const urlParams = new URLSearchParams(window.location.search);
        const busId = urlParams.get('busId') || window.location.pathname.split('/').pop();
        savePassengers(busId);
    }
    
    // Find and remove the passenger card
    const card = document.querySelector(`.passenger-card[data-seat-number="${seatNumber}"]`);
    if (card) {
        card.remove();
    }
    
    // Mark the seat as available again
    const seatElement = document.querySelector(`.seat[data-seat-number="${seatNumber}"]`);
    if (seatElement) {
        seatElement.classList.remove('booked');
        seatElement.classList.add('available');
        
        // Add click event listener back
        seatElement.addEventListener('click', function() {
            selectSeat(seatNumber);
        });
    }
    
    // Update the UI
    updatePassengerSummary();
}

// Update the passenger summary
function updatePassengerSummary() {
    const passengerCards = document.querySelectorAll('.passenger-card');
    const totalPassengers = passengerCards.length;
    
    // Update the total passengers count
    document.getElementById('totalPassengers').textContent = totalPassengers;
    
    // Update the total amount (fare per person * number of passengers)
    const farePerPerson = parseInt(document.getElementById('ticketFare').textContent.replace('₹', ''));
    const totalAmount = farePerPerson * totalPassengers;
    document.getElementById('totalAmount').textContent = `₹${totalAmount}`;
    
    // Hide the summary if no passengers
    if (totalPassengers === 0) {
        document.getElementById('passengerSummary').style.display = 'none';
        document.getElementById('proceedBtn').disabled = true;
    }
}

// Proceed to payment
function proceedToPayment() {
    // Get contact information
    const email = document.getElementById('contactEmail').value;
    const phone = document.getElementById('contactPhone').value;
    
    // Validate contact information
    if (!email || !phone) {
        alert('Please provide contact email and phone number.');
        return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('Please enter a valid email address.');
        return;
    }
    
    // Check if we have passengers
    if (passengers.length === 0) {
        alert('Please add at least one passenger to proceed.');
        return;
    }
    
    // Get busId from URL
    const urlParams = new URLSearchParams(window.location.search);
    const busId = urlParams.get('busId') || window.location.pathname.split('/').pop();
    
    if (!busId) {
        alert('Bus ID is missing. Please start over.');
        window.location.href = '/buses';
        return;
    }
    
    // Create booking data
    const bookingData = {
        busId: parseInt(busId),
        contactEmail: email,
        contactPhone: phone,
        passengers: passengers,
        numberOfSeats: passengers.length,
        totalAmount: parseFloat(document.getElementById('totalAmount').textContent.replace('₹', ''))
    };
    
    // Show a confirmation with passenger details
    let confirmMessage = `Confirm booking with the following details:\n\n`;
    confirmMessage += `Bus: ${document.getElementById('sourceCity').textContent} to ${document.getElementById('destinationCity').textContent}\n`;
    confirmMessage += `Date: ${document.getElementById('journeyDate').textContent}\n`;
    confirmMessage += `Passengers: ${passengers.length}\n\n`;
    
    passengers.forEach((passenger, idx) => {
        confirmMessage += `${idx + 1}. ${passenger.name} - Seat ${passenger.seatNumber}\n`;
    });
    
    confirmMessage += `\nTotal Amount: ${document.getElementById('totalAmount').textContent}\n\n`;
    confirmMessage += `Proceed to payment?`;
    
    if (!confirm(confirmMessage)) {
        return;
    }
    
    // Store booking data for use on other pages
    sessionStorage.setItem('bookingData', JSON.stringify(bookingData));
    localStorage.setItem('currentBookingData', JSON.stringify(bookingData));
    
    // Show loading state
    document.getElementById('proceedBtn').disabled = true;
    document.getElementById('proceedBtn').innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    
    // Redirect to payment page with data
    window.location.href = `/payment?busId=${busId}&seats=${passengers.length}&amount=${bookingData.totalAmount}`;
} 