// Initialize page on document load
document.addEventListener('DOMContentLoaded', function() {
    console.log('Booking page initialized');
    
    // Initialize the booking page
    initBookingPage();
    
    // Check authentication and load bus details
    checkAuth()
    .then(() => {
        loadBusDetails();
    })
    .catch(err => {
        console.error('Authentication check failed:', err);
        showError('You must be logged in to book tickets. Redirecting to login page...');
        setTimeout(() => {
            window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname + window.location.search);
        }, 2000);
    });
});

// Initialize the booking page with event listeners
function initBookingPage() {
    // Add event listener for Add Passenger button
    document.getElementById('addPassengerBtn').addEventListener('click', addPassenger);
    
    // Add event listener for Cancel button
    document.getElementById('cancelBtn').addEventListener('click', function() {
        if (confirm('Are you sure you want to cancel this booking?')) {
            window.location.href = '/buses';
        }
    });
    
    // Add event listener for Proceed button
    document.getElementById('proceedBtn').addEventListener('click', function() {
        proceedToPayment();
    });
}

// Check if user is authenticated
function checkAuth() {
    return new Promise((resolve, reject) => {
        // Use the validateToken function from auth.js
        if (typeof validateToken === 'function') {
            validateToken()
                .then(userData => {
                    console.log('User authenticated:', userData.username);
                    resolve(userData);
                })
                .catch(err => {
                    console.error('Authentication check failed:', err);
                    reject(err);
                });
        } else {
            console.error('validateToken function is not available. Check if auth.js is loaded correctly.');
            
            // Fallback to basic token check if validateToken is not available
            const token = localStorage.getItem('authToken');
            if (!token) {
                reject(new Error('No authentication token found'));
                return;
            }
            
            fetch('/api/auth/validate-token', {
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            })
            .then(response => {
                if (response.ok) {
                    resolve();
                } else {
                    localStorage.removeItem('authToken');
                    reject(new Error('Invalid or expired token'));
                }
            })
            .catch(err => {
                console.error('Error validating token:', err);
                reject(err);
            });
        }
    });
}

// Load bus details from the API
function loadBusDetails() {
    // Get busId from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const busId = urlParams.get('busId');
    
    if (!busId) {
        showError('No bus selected. Please select a bus first.');
        setTimeout(() => {
            window.location.href = '/buses';
        }, 2000);
        return;
    }
    
    // Show loading state
    document.getElementById('busDetailsContainer').innerHTML = `
        <div class="text-center">
            <div class="spinner-border" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p>Loading bus details...</p>
        </div>
    `;
    
    // Use the apiRequest utility function if available
    if (typeof apiRequest === 'function') {
        apiRequest(`/api/buses/${busId}`, {}, false)
            .then(handleBusDetailsResponse)
            .catch(handleBusDetailsError);
    } else {
        // Fallback to regular fetch if apiRequest is not available
        fetch(`/api/buses/${busId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to load bus details');
                }
                return response.json();
            })
            .then(handleBusDetailsResponse)
            .catch(handleBusDetailsError);
    }
}

// Handle bus details API response
function handleBusDetailsResponse(bus) {
    console.log('Bus details loaded:', bus);
    
    // Format departure and arrival times
    const departureDateTime = formatDateTime(bus.departureTime);
    const arrivalDateTime = formatDateTime(bus.arrivalTime);
    
    // Update bus details in UI
    document.getElementById('busDetailsContainer').innerHTML = `
        <div class="bus-details">
            <h3 id="busNumber">${bus.busName} (${bus.busNumber})</h3>
            <div class="detail-row">
                <div class="detail-item">
                    <strong>From:</strong> <span id="source">${bus.source}</span>
                </div>
                <div class="detail-item">
                    <strong>To:</strong> <span id="destination">${bus.destination}</span>
                </div>
            </div>
            <div class="detail-row">
                <div class="detail-item">
                    <strong>Departure:</strong> <span id="departureTime">${departureDateTime}</span>
                </div>
                <div class="detail-item">
                    <strong>Arrival:</strong> <span id="arrivalTime">${arrivalDateTime}</span>
                </div>
            </div>
            <div class="detail-row">
                <div class="detail-item">
                    <strong>Bus Type:</strong> <span id="busType">${bus.busType}</span>
                </div>
                <div class="detail-item">
                    <strong>Available Seats:</strong> <span id="availableSeats">${bus.availableSeats}</span>
                </div>
                <div class="detail-item fare-box">
                    <h3>$<span id="fare">${bus.price.toFixed(2)}</span> per seat</h3>
                </div>
            </div>
        </div>
    `;
    
    // Set price in the booking form
    document.getElementById('pricePerSeat').value = bus.price.toFixed(2);
    document.getElementById('perSeatFare').textContent = bus.price.toFixed(2);
    
    // Calculate seat map data
    const totalSeats = 40; // Assuming a standard bus with 40 seats
    const bookedSeatNumbers = [];
    
    // Get booked seats (simulated for now - would come from API in production)
    if (bus.bookedSeats) {
        bookedSeatNumbers.push(...bus.bookedSeats);
    }
    
    // Generate seat map
    generateSeatMap(totalSeats, bookedSeatNumbers);
    
    // Populate seat dropdown
    populateSeatDropdown(totalSeats, bookedSeatNumbers);
    
    // Show booking form
    document.getElementById('bookingForm').classList.remove('d-none');
}

// Handle bus details API error
function handleBusDetailsError(err) {
    console.error('Error loading bus details:', err);
    showError('Failed to load bus details. Please try again later.');
    
    // Add a refresh button
    document.getElementById('busDetailsContainer').innerHTML = `
        <div class="text-center">
            <p class="text-danger">Failed to load bus details. Please try again.</p>
            <button class="btn btn-primary" onclick="location.reload()">Refresh</button>
        </div>
    `;
}

// Format date and time from ISO string
function formatDateTime(isoString) {
    try {
        if (!isoString) return 'N/A';
        
        const date = new Date(isoString);
        
        if (isNaN(date.getTime())) {
            return 'Invalid date';
        }
        
        // Format date as DD MMM YYYY
        const dateOptions = { day: '2-digit', month: 'short', year: 'numeric' };
        const formattedDate = date.toLocaleDateString('en-US', dateOptions);
        
        // Format time as HH:MM AM/PM
        const timeOptions = { hour: '2-digit', minute: '2-digit', hour12: true };
        const formattedTime = date.toLocaleTimeString('en-US', timeOptions);
        
        return `${formattedDate}, ${formattedTime}`;
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'Date error';
    }
}

// Generate seat map in the UI
function generateSeatMap(totalSeats, bookedSeats) {
    const seatMapContainer = document.getElementById('seatMapContainer');
    seatMapContainer.innerHTML = '';
    
    // Create bus layout container
    const busLayout = document.createElement('div');
    busLayout.className = 'bus-layout';
    
    // Add driver cabin
    const driverCabin = document.createElement('div');
    driverCabin.className = 'driver-cabin';
    driverCabin.textContent = 'Driver';
    busLayout.appendChild(driverCabin);
    
    // Calculate rows and seats per row
    const seatsPerRow = 4; // 2 seats on each side with an aisle
    const rows = Math.ceil(totalSeats / seatsPerRow);
    
    // Generate seat rows
    for (let row = 0; row < rows; row++) {
        const seatRow = document.createElement('div');
        seatRow.className = 'seat-row';
        
        // Left side seats (seats 0 and 1 in each row)
        for (let i = 0; i < 2; i++) {
            const seatNum = row * seatsPerRow + i + 1;
            if (seatNum <= totalSeats) {
                const seat = createSeat(seatNum, bookedSeats);
                seatRow.appendChild(seat);
            } else {
                // Empty space if we've reached total seats
                const emptySpace = document.createElement('div');
                emptySpace.className = 'seat';
                emptySpace.style.visibility = 'hidden';
                seatRow.appendChild(emptySpace);
            }
        }
        
        // Aisle
        const aisle = document.createElement('div');
        aisle.className = 'aisle';
        seatRow.appendChild(aisle);
        
        // Right side seats (seats 2 and 3 in each row)
        for (let i = 2; i < 4; i++) {
            const seatNum = row * seatsPerRow + i + 1;
            if (seatNum <= totalSeats) {
                const seat = createSeat(seatNum, bookedSeats);
                seatRow.appendChild(seat);
            } else {
                // Empty space if we've reached total seats
                const emptySpace = document.createElement('div');
                emptySpace.className = 'seat';
                emptySpace.style.visibility = 'hidden';
                seatRow.appendChild(emptySpace);
            }
        }
        
        busLayout.appendChild(seatRow);
    }
    
    seatMapContainer.appendChild(busLayout);
    
    // Add event listeners to seats
    document.querySelectorAll('.seat.available').forEach(seat => {
        seat.addEventListener('click', function() {
            const seatNum = this.getAttribute('data-seat');
            selectSeat(seatNum);
        });
    });
}

// Create a seat element
function createSeat(seatNum, bookedSeats) {
    const seat = document.createElement('div');
    seat.className = bookedSeats.includes(seatNum) ? 'seat booked' : 'seat available';
    seat.textContent = seatNum;
    seat.setAttribute('data-seat', seatNum);
    return seat;
}

// Populate seat dropdown with available seats
function populateSeatDropdown(totalSeats, bookedSeats) {
    const seatDropdown = document.getElementById('seatNumber');
    seatDropdown.innerHTML = '<option value="">Select Seat</option>';
    
    for (let i = 1; i <= totalSeats; i++) {
        if (!bookedSeats.includes(i) && !isSelectedBySomeone(i)) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = `Seat ${i}`;
            seatDropdown.appendChild(option);
        }
    }
}

// Select a seat (when clicked on the seat map)
function selectSeat(seatNum) {
    const seatDropdown = document.getElementById('seatNumber');
    seatDropdown.value = seatNum;
    
    // Highlight selected seat on the map
    document.querySelectorAll('.seat.selected').forEach(seat => {
        seat.classList.remove('selected');
        seat.classList.add('available');
    });
    
    const selectedSeat = document.querySelector(`.seat[data-seat="${seatNum}"]`);
    if (selectedSeat) {
        selectedSeat.classList.remove('available');
        selectedSeat.classList.add('selected');
    }
}

// Check if a seat is already selected by someone in the current booking
function isSelectedBySomeone(seatNum) {
    const passengerList = document.querySelectorAll('.passenger-card');
    for (const passenger of passengerList) {
        const selectedSeat = passenger.getAttribute('data-seat');
        if (selectedSeat === seatNum.toString()) {
            return true;
        }
    }
    return false;
}

// Add a passenger to the booking
function addPassenger() {
    // Get form values
    const name = document.getElementById('passengerName').value;
    const age = document.getElementById('passengerAge').value;
    const gender = document.getElementById('passengerGender').value;
    const seatNumber = document.getElementById('seatNumber').value;
    
    // Get new form values
    const documentType = document.getElementById('documentType').value;
    const documentNumber = document.getElementById('documentNumber').value;
    const specialRequests = document.getElementById('specialRequests').value;
    
    // Get seat preferences
    const prefWindow = document.getElementById('prefWindow').checked;
    const prefAisle = document.getElementById('prefAisle').checked;
    const prefFront = document.getElementById('prefFront').checked;
    const prefBack = document.getElementById('prefBack').checked;
    
    // Create an array of selected preferences
    const seatPreferences = [];
    if (prefWindow) seatPreferences.push('Window');
    if (prefAisle) seatPreferences.push('Aisle');
    if (prefFront) seatPreferences.push('Front');
    if (prefBack) seatPreferences.push('Back');
    
    // Validate required fields
    if (!name || !age || !gender || !seatNumber) {
        showError('Please fill in all required passenger details and select a seat.');
        return;
    }
    
    // Check if seat is already selected by another passenger
    if (isSelectedBySomeone(seatNumber)) {
        showError(`Seat ${seatNumber} is already selected by another passenger.`);
        return;
    }
    
    // Create passenger object
    const passenger = {
        name: name,
        age: parseInt(age),
        gender: gender,
        seatNumber: seatNumber,
        documentType: documentType,
        documentNumber: documentNumber,
        seatPreferences: seatPreferences,
        specialRequests: specialRequests
    };
    
    // Add passenger to list
    addPassengerToList(passenger);
    
    // Clear form
    document.getElementById('passengerName').value = '';
    document.getElementById('passengerAge').value = '';
    document.getElementById('passengerGender').value = '';
    document.getElementById('seatNumber').value = '';
    document.getElementById('documentType').value = '';
    document.getElementById('documentNumber').value = '';
    document.getElementById('specialRequests').value = '';
    
    // Reset seat preferences
    document.getElementById('prefWindow').checked = false;
    document.getElementById('prefAisle').checked = false;
    document.getElementById('prefFront').checked = false;
    document.getElementById('prefBack').checked = false;
    
    // Update booking summary
    updateBookingSummary();
    
    // Enable proceed button if at least one passenger is added
    document.getElementById('proceedBtn').disabled = getBookedSeats().length === 0;
    
    // Show success message
    clearError();
    
    // Return focus to passenger name field
    document.getElementById('passengerName').focus();
}

// Add passenger to the list in UI
function addPassengerToList(passenger) {
    // Hide "no passengers" message
    document.getElementById('noPassengersMessage').style.display = 'none';
    
    // Get passenger list
    const passengerList = document.getElementById('passengerList');
    
    // Create passenger card
    const passengerCard = document.createElement('div');
    passengerCard.className = 'passenger-card';
    passengerCard.setAttribute('data-seat', passenger.seatNumber);
    passengerCard.setAttribute('data-passenger', JSON.stringify(passenger));
    
    // Format seat preferences
    const preferencesText = passenger.seatPreferences && passenger.seatPreferences.length > 0 
        ? passenger.seatPreferences.join(', ') 
        : 'None specified';
        
    // Create card content
    let cardContent = `
        <div class="row">
            <div class="col-md-9">
                <h5><i class="fas fa-user"></i> ${passenger.name}</h5>
                <div class="passenger-details">
                    <p><strong>Age:</strong> ${passenger.age} | <strong>Gender:</strong> ${passenger.gender} | <strong>Seat:</strong> ${passenger.seatNumber}</p>
    `;
    
    // Add document information if available
    if (passenger.documentType) {
        cardContent += `
                    <p><strong>ID Document:</strong> ${passenger.documentType} ${passenger.documentNumber ? '- ' + passenger.documentNumber : ''}</p>
        `;
    }
    
    // Add seat preferences
    cardContent += `
                    <p><strong>Seat Preferences:</strong> ${preferencesText}</p>
    `;
    
    // Add special requests if available
    if (passenger.specialRequests) {
        cardContent += `
                    <p><strong>Special Requests:</strong> ${passenger.specialRequests}</p>
        `;
    }
    
    cardContent += `
                </div>
            </div>
            <div class="col-md-3 text-end">
                <span class="badge bg-success">Seat ${passenger.seatNumber}</span>
            </div>
        </div>
        <button class="remove-passenger" onclick="removePassenger(this)">
            <i class="fas fa-times-circle"></i>
        </button>
    `;
    
    passengerCard.innerHTML = cardContent;
    
    // Add to passenger list
    passengerList.appendChild(passengerCard);
    
    // Update seat map
    const seatElement = document.querySelector(`.seat[data-seat="${passenger.seatNumber}"]`);
    if (seatElement) {
        seatElement.classList.remove('available');
        seatElement.classList.add('selected');
    }
    
    // Show booking summary
    document.getElementById('bookingSummary').style.display = 'block';
    
    // Enable proceed button
    document.getElementById('proceedBtn').disabled = false;
    
    // Update booking summary
    updateBookingSummary();
}

// Get array of all currently booked seats
function getBookedSeats() {
    const bookedSeats = [];
    
    // Get seats that are marked as "booked" in the seat map
    document.querySelectorAll('.seat.booked').forEach(seat => {
        bookedSeats.push(parseInt(seat.getAttribute('data-seat')));
    });
    
    return bookedSeats;
}

// Remove a passenger from the booking
function removePassenger(button) {
    const passengerCard = button.closest('.passenger-card');
    const seatNumber = passengerCard.getAttribute('data-seat');
    
    // Remove passenger card
    passengerCard.remove();
    
    // Update seat status in the map
    const seatElement = document.querySelector(`.seat[data-seat="${seatNumber}"]`);
    if (seatElement && seatElement.classList.contains('selected')) {
        seatElement.classList.remove('selected');
        seatElement.classList.add('available');
    }
    
    // Show "no passengers" message if no passengers are left
    const passengerCards = document.querySelectorAll('.passenger-card');
    if (passengerCards.length === 0) {
        document.getElementById('noPassengersMessage').style.display = 'block';
        document.getElementById('bookingSummary').style.display = 'none';
        document.getElementById('proceedBtn').disabled = true;
    }
    
    // Update booking summary
    updateBookingSummary();
    
    // Update seat dropdown
    const bookedSeats = getBookedSeats();
    populateSeatDropdown(40, bookedSeats);
}

// Update booking summary with current information
function updateBookingSummary() {
    const passengerCards = document.querySelectorAll('.passenger-card');
    const numPassengers = passengerCards.length;
    const pricePerSeat = parseFloat(document.getElementById('pricePerSeat').value);
    const totalAmount = numPassengers * pricePerSeat;
    
    document.getElementById('totalSeats').textContent = numPassengers;
    document.getElementById('totalFare').textContent = totalAmount.toFixed(2);
}

// Proceed to payment with the current booking
function proceedToPayment() {
    // Get all passengers
    const passengerCards = document.querySelectorAll('.passenger-card');
    
    if (passengerCards.length === 0) {
        showError('Please add at least one passenger to proceed.');
        return;
    }
    
    // Get contact information
    const contactEmail = document.getElementById('contactEmail').value.trim();
    const contactPhone = document.getElementById('contactPhone').value.trim();
    
    // Validate contact information
    if (!contactEmail) {
        showError('Please enter a contact email address.');
        document.getElementById('contactEmail').focus();
        return;
    }
    
    if (!contactPhone) {
        showError('Please enter a contact phone number.');
        document.getElementById('contactPhone').focus();
        return;
    }
    
    // Get bus ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const busId = urlParams.get('busId');
    
    if (!busId) {
        showError('Invalid bus selection. Please try again.');
        return;
    }
    
    // Calculate total amount
    const pricePerSeat = parseFloat(document.getElementById('pricePerSeat').value);
    const totalAmount = pricePerSeat * passengerCards.length;
    
    // Prepare passenger list
    const passengers = [];
    
    passengerCards.forEach(card => {
        const passengerData = JSON.parse(card.getAttribute('data-passenger'));
        
        // Create basic passenger object required by API
        const passenger = {
            name: passengerData.name,
            age: passengerData.age,
            gender: passengerData.gender,
            seatNumber: passengerData.seatNumber
        };
        
        // Add new optional fields if they exist
        if (passengerData.documentType) {
            passenger.documentType = passengerData.documentType;
            passenger.documentNumber = passengerData.documentNumber;
        }
        
        if (passengerData.seatPreferences && passengerData.seatPreferences.length > 0) {
            passenger.seatPreferences = passengerData.seatPreferences;
        }
        
        if (passengerData.specialRequests) {
            passenger.specialRequests = passengerData.specialRequests;
        }
        
        passengers.push(passenger);
    });
    
    // Prepare request data
    const bookingData = {
        busId: busId,
        numberOfSeats: passengers.length,
        totalAmount: totalAmount,
        contactEmail: contactEmail,
        contactPhone: contactPhone,
        passengers: passengers
    };
    
    // Store booking data in session storage for payment page
    sessionStorage.setItem('bookingData', JSON.stringify(bookingData));
    
    // Redirect to payment page
    window.location.href = `/payment?busId=${busId}&amount=${totalAmount}`;
}

// Show error message
function showError(message) {
    const errorElement = document.getElementById('errorMessage');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    
    // Hide after 5 seconds
    setTimeout(() => {
        errorElement.style.display = 'none';
    }, 5000);
}

// Clear error message
function clearError() {
    document.getElementById('errorMessage').style.display = 'none';
} 