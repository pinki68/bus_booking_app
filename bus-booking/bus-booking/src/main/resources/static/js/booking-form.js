/**
 * Booking Form JavaScript - Handles booking form functionality
 * - Manages passenger information
 * - Handles seat selection
 * - Processes booking requests to backend API
 */

// Global variables
let busId = null;
let busDetails = null;
let passengers = [];
let selectedSeats = [];
let bookedSeats = [];
let perSeatFare = 0;

// Initialize the page when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Booking form initialized');
    console.log('Current URL:', window.location.href);
    console.log('Path:', window.location.pathname);
    console.log('Search params:', window.location.search);
    
    // Extract busId from URL - try both path variable and query parameter
    const urlParams = new URLSearchParams(window.location.search);
    let busId = urlParams.get('busId');
    
    // If busId not found in query parameter, try to get it from path
    if (!busId) {
        const pathSegments = window.location.pathname.split('/');
        console.log('Path segments:', pathSegments);
        const lastSegment = pathSegments[pathSegments.length - 1];
        console.log('Last segment:', lastSegment);
        if (!isNaN(lastSegment)) {
            busId = lastSegment;
            console.log('Using path variable for busId:', busId);
        }
    }
    
    console.log('Bus ID from URL:', busId);
    
    if (!busId) {
        showError('No bus selected. Please select a bus first.');
        setTimeout(() => {
            window.location.href = '/buses';
        }, 2000);
        return;
    }
    
    // Set global busId variable
    window.busId = busId;
    
    // Check authentication
    checkAuthentication();
    
    // Load bus details
    loadBusDetails(busId);
    
    // Initialize listeners
    initializeEventListeners();
    
    // Load saved passengers from localStorage
    loadSavedPassengers(busId);
});

// Check if user is authenticated
function checkAuthentication() {
    const token = localStorage.getItem('authToken');
    
    if (token) {
        // User is logged in, update UI
        document.getElementById('loginBtn').style.display = 'none';
        document.getElementById('registerBtn').style.display = 'none';
        document.getElementById('logoutBtn').style.display = 'inline-block';
        
        // Add logout functionality
        document.getElementById('logoutBtn').addEventListener('click', function(e) {
            e.preventDefault();
            localStorage.removeItem('authToken');
            window.location.href = '/';
        });
    } else {
        // User is not logged in, prompt to login
        showError('You must be logged in to book tickets. Redirecting to login...');
        setTimeout(() => {
            window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname + window.location.search);
        }, 2000);
    }
}

// Initialize all event listeners
function initializeEventListeners() {
    console.log('Initializing event listeners');
    
    // Add passenger button
    const addPassengerBtn = document.getElementById('addPassengerBtn');
    if (addPassengerBtn) {
        addPassengerBtn.addEventListener('click', function() {
            console.log('Add passenger button clicked');
            // Get the modal element
            const modalElement = document.getElementById('passengerFormModal');
            
            if (!modalElement) {
                console.error('Passenger form modal not found in the DOM');
                return;
            }
            
            try {
                // Show passenger form modal
                const passengerModal = new bootstrap.Modal(modalElement);
                passengerModal.show();
                
                // Clear previous form data
                document.getElementById('passengerForm').reset();
                
                // Populate seat dropdown with available seats
                populateAvailableSeats();
            } catch (error) {
                console.error('Error showing modal:', error);
                alert('Unable to open passenger form. Please try again.');
            }
        });
    } else {
        console.error('Add passenger button not found');
    }
    
    // Save passenger button in modal
    const savePassengerBtn = document.getElementById('savePassengerBtn');
    if (savePassengerBtn) {
        savePassengerBtn.addEventListener('click', savePassengerFromModal);
    } else {
        console.error('Save passenger button not found');
    }
    
    // Back button
    const backBtn = document.getElementById('backBtn');
    if (backBtn) {
        backBtn.addEventListener('click', function() {
            window.location.href = '/buses';
        });
    }
    
    // Proceed button
    const proceedBtn = document.getElementById('proceedBtn');
    if (proceedBtn) {
        proceedBtn.addEventListener('click', showConfirmationModal);
    }
    
    // Confirm booking button in modal
    const confirmBookingBtn = document.getElementById('confirmBookingBtn');
    if (confirmBookingBtn) {
        confirmBookingBtn.addEventListener('click', processBooking);
    }
    
    console.log('Event listeners initialized');
}

// Load bus details from API
function loadBusDetails(busId) {
    console.log('Loading bus details for ID:', busId);
    
    // Get auth token
    const token = localStorage.getItem('authToken');
    const headers = token ? { 'Authorization': 'Bearer ' + token } : {};
    headers['Content-Type'] = 'application/json';
    
    // Fetch bus details
    fetch(`/api/buses/${busId}`, {
        method: 'GET',
        headers: headers
    })
    .then(response => {
        console.log('Bus API response status:', response.status);
        if (!response.ok) {
            return response.text().then(text => {
                console.error('API Error:', text);
                throw new Error('Failed to load bus details. Status: ' + response.status);
            });
        }
        return response.json();
    })
    .then(data => {
        console.log('Bus details loaded:', data);
        busDetails = data;
        displayBusDetails(data);
        updateBookingSummary();
    })
    .catch(error => {
        console.error('Error loading bus details:', error);
        
        // Try to load mock data as fallback with multiple paths
        loadMockBusData(busId);
    });
}

// Helper function to load mock data with multiple fallback options
function loadMockBusData(busId) {
    console.log('Attempting to load mock data for bus ID:', busId);
    
    // Try different paths for mock data
    const mockPaths = [
        `/mock-bus-${busId}.json`,
        `/static/mock-bus-${busId}.json`,
        `/test-static/mock-bus-${busId}.json`
    ];
    
    let mockDataLoaded = false;
    let pathIndex = 0;
    
    function tryNextPath() {
        if (pathIndex >= mockPaths.length) {
            if (!mockDataLoaded) {
                // Show hardcoded fallback data if nothing else works
                console.log('Using hardcoded fallback data');
                const fallbackData = {
                    "id": busId,
                    "busName": "Express Deluxe",
                    "busNumber": "EXP-101",
                    "source": "New Delhi",
                    "destination": "Mumbai",
                    "departureTime": "2023-09-15T08:30:00",
                    "arrivalTime": "2023-09-15T20:45:00",
                    "duration": "12h 15m",
                    "busType": "AC Sleeper",
                    "totalSeats": 40,
                    "availableSeats": 28,
                    "bookedSeats": [1, 2, 5, 9, 15, 18, 22, 23, 25, 30, 35, 38],
                    "price": 1500.00,
                    "rating": 4.5,
                    "amenities": ["WiFi", "Charging Point", "Water Bottle", "Blanket"]
                };
                busDetails = fallbackData;
                displayBusDetails(fallbackData);
                updateBookingSummary();
            }
            return;
        }
        
        const currentPath = mockPaths[pathIndex];
        console.log(`Trying mock data path (${pathIndex + 1}/${mockPaths.length}):`, currentPath);
        
        fetch(currentPath)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Mock data not available at ${currentPath}`);
                }
                return response.json();
            })
            .then(mockData => {
                console.log('Mock data loaded successfully from:', currentPath);
                busDetails = mockData;
                displayBusDetails(mockData);
                updateBookingSummary();
                mockDataLoaded = true;
            })
            .catch(mockError => {
                console.error(`Failed to load mock data from ${currentPath}:`, mockError);
                pathIndex++;
                tryNextPath();
            });
    }
    
    // Start trying paths
    tryNextPath();
}

// Display bus details in the UI
function displayBusDetails(bus) {
    // Format dates
    const departDate = new Date(bus.departureTime);
    const arrivalDate = new Date(bus.arrivalTime);
    
    const formattedDepartDate = formatDateTime(departDate);
    const formattedArrivalDate = formatDateTime(arrivalDate);
    
    // Set price
    perSeatFare = bus.price;
    
    // Update bus details container
    document.getElementById('busDetailsContainer').innerHTML = `
        <div class="bus-details card">
            <div class="card-body">
                <h4 class="card-title">${bus.busName} (${bus.busNumber})</h4>
                <div class="row mt-3">
                    <div class="col-md-6">
                        <div class="d-flex align-items-center mb-3">
                            <i class="fas fa-map-marker-alt text-danger me-2"></i>
                            <div>
                                <div class="text-muted">From</div>
                                <div class="fw-bold">${bus.source}</div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="d-flex align-items-center mb-3">
                            <i class="fas fa-map-marker-alt text-success me-2"></i>
                            <div>
                                <div class="text-muted">To</div>
                                <div class="fw-bold">${bus.destination}</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="row">
                    <div class="col-md-6">
                        <div class="d-flex align-items-center mb-3">
                            <i class="fas fa-clock text-primary me-2"></i>
                            <div>
                                <div class="text-muted">Departure</div>
                                <div class="fw-bold">${formattedDepartDate}</div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="d-flex align-items-center mb-3">
                            <i class="fas fa-clock text-primary me-2"></i>
                            <div>
                                <div class="text-muted">Arrival</div>
                                <div class="fw-bold">${formattedArrivalDate}</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="row">
                    <div class="col-md-4">
                        <div class="d-flex align-items-center">
                            <i class="fas fa-bus text-secondary me-2"></i>
                            <div>
                                <div class="text-muted">Bus Type</div>
                                <div class="fw-bold">${bus.busType}</div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="d-flex align-items-center">
                            <i class="fas fa-chair text-secondary me-2"></i>
                            <div>
                                <div class="text-muted">Available Seats</div>
                                <div class="fw-bold">${bus.availableSeats}</div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="d-flex align-items-center">
                            <i class="fas fa-tag text-success me-2"></i>
                            <div>
                                <div class="text-muted">Fare</div>
                                <div class="fw-bold price">₹${bus.price.toFixed(2)}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Update booked seats
    if (bus.bookedSeats) {
        bookedSeats = bus.bookedSeats;
    }
    
    // Generate seat map
    generateSeatMap();
}

// Format date and time
function formatDateTime(date) {
    if (!date || !(date instanceof Date) || isNaN(date)) {
        return 'Invalid Date';
    }
    
    return date.toLocaleString('en-US', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
}

// Generate the seat map
function generateSeatMap() {
    const seatMap = document.getElementById('seatMap');
    seatMap.innerHTML = '';
    
    // Default total seats (can be adjusted based on bus details)
    const totalSeats = 40;
    
    for (let i = 1; i <= totalSeats; i++) {
        const seatElement = document.createElement('div');
        seatElement.className = 'seat';
        seatElement.textContent = i;
        seatElement.dataset.seatNumber = i;
        
        // Set seat status
        if (bookedSeats.includes(i)) {
            seatElement.classList.add('booked');
        } else if (selectedSeats.includes(i)) {
            seatElement.classList.add('selected');
        } else {
            seatElement.classList.add('available');
            
            // Add click event only for available seats
            seatElement.addEventListener('click', function() {
                toggleSeatSelection(i);
            });
        }
        
        seatMap.appendChild(seatElement);
    }
}

// Toggle seat selection
function toggleSeatSelection(seatNumber) {
    const index = selectedSeats.indexOf(seatNumber);
    
    if (index === -1) {
        // If passengers are already added, assign the seat to the next passenger without a seat
        if (passengers.length > selectedSeats.length) {
            selectedSeats.push(seatNumber);
            
            // Find the first passenger without a seat and assign this seat
            for (let i = 0; i < passengers.length; i++) {
                if (!passengers[i].seatNumber) {
                    passengers[i].seatNumber = seatNumber;
                    break;
                }
            }
        } else {
            showError('Please add a passenger before selecting seats.');
            return;
        }
    } else {
        // Deselect the seat
        selectedSeats.splice(index, 1);
        
        // Remove seat assignment from passenger
        for (let i = 0; i < passengers.length; i++) {
            if (passengers[i].seatNumber === seatNumber) {
                passengers[i].seatNumber = null;
                break;
            }
        }
    }
    
    // Regenerate seat map and update summary
    generateSeatMap();
    updatePassengerCards();
    updateBookingSummary();
    savePassengers(busId);
}

// Populate available seats in the dropdown
function populateAvailableSeats() {
    const seatSelect = document.getElementById('seatNumber');
    seatSelect.innerHTML = '<option value="">Select Seat</option>';
    
    if (!busDetails) {
        console.error('Bus details not loaded yet');
        return;
    }
    
    // Get total seats from bus details
    const totalSeats = busDetails.totalSeats || 40; // Default to 40 if not specified
    
    // Get already booked seats from bus details and already selected seats
    const unavailableSeats = [...(busDetails.bookedSeats || []), ...selectedSeats];
    
    // Add available seats to dropdown
    for (let i = 1; i <= totalSeats; i++) {
        if (!unavailableSeats.includes(i)) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = `Seat ${i}`;
            seatSelect.appendChild(option);
        }
    }
}

// Save passenger data from modal form
function savePassengerFromModal() {
    console.log('savePassengerFromModal called');
    
    try {
        // Get form values
        const name = document.getElementById('passengerName').value.trim();
        const age = document.getElementById('passengerAge').value;
        const gender = document.getElementById('passengerGender').value;
        const seatNumber = document.getElementById('seatNumber').value;
        const idType = document.getElementById('idType').value;
        const idNumber = document.getElementById('idNumber').value;
        
        console.log('Form data collected:', { name, age, gender, seatNumber });
        
        // Validation
        if (!name || !age || !gender || !seatNumber) {
            console.error('Missing required fields');
            alert('Please fill all required fields (Name, Age, Gender, and Seat Number)');
            return;
        }
        
        // Get preferences
        const preferences = [];
        if (document.getElementById('prefWindow').checked) preferences.push('Window');
        if (document.getElementById('prefAisle').checked) preferences.push('Aisle');
        if (document.getElementById('prefLower').checked) preferences.push('Lower Deck');
        if (document.getElementById('prefLegroom').checked) preferences.push('Extra Legroom');
        
        // Get special requests
        const specialRequests = document.getElementById('specialRequests').value.trim();
        
        // Create passenger object
        const passenger = {
            name: name,
            age: parseInt(age),
            gender: gender,
            seatNumber: seatNumber,
            idType: idType || null,
            idNumber: idNumber || null,
            preferences: preferences,
            specialRequests: specialRequests || null
        };
        
        console.log('Created passenger object:', passenger);
        
        // Check if we're editing an existing passenger or adding a new one
        const editIndex = document.getElementById('passengerForm').getAttribute('data-edit-index');
        
        if (editIndex && editIndex !== 'null' && editIndex !== 'undefined') {
            // Edit existing passenger
            const index = parseInt(editIndex);
            passengers[index] = passenger;
            console.log(`Updated passenger at index ${index}:`, passenger);
        } else {
            // Add new passenger
            passengers.push(passenger);
            console.log('Added new passenger:', passenger);
            
            // Add this seat to selected seats
            if (!selectedSeats.includes(seatNumber)) {
                selectedSeats.push(seatNumber);
                console.log('Selected seats updated:', selectedSeats);
                
                // Update the seat in the UI
                const seatElement = document.querySelector(`.seat[data-seat="${seatNumber}"]`);
                if (seatElement) {
                    seatElement.classList.remove('available');
                    seatElement.classList.add('selected');
                }
            }
        }
        
        // Reset form and close modal
        document.getElementById('passengerForm').reset();
        document.getElementById('passengerForm').removeAttribute('data-edit-index');
        
        try {
            // Close the modal
            const modalElement = document.getElementById('passengerFormModal');
            const modal = bootstrap.Modal.getInstance(modalElement);
            if (modal) {
                modal.hide();
            } else {
                console.warn('No instance found, trying to create a new one');
                const newModal = new bootstrap.Modal(modalElement);
                newModal.hide();
            }
        } catch (error) {
            console.error('Error hiding modal:', error);
        }
        
        // Update UI
        updatePassengerCards();
        updateBookingSummary();
        
        // Save to localStorage
        savePassengers(busId);
        
        // Check if we can enable the proceed button
        document.getElementById('proceedBtn').disabled = passengers.length === 0;
        
    } catch (error) {
        console.error('Error in savePassengerFromModal:', error);
        alert('An error occurred while saving passenger data. Please try again.');
    }
}

// Update passenger cards in UI
function updatePassengerCards() {
    console.log('Updating passenger cards for', passengers.length, 'passengers');
    
    const passengerCardsContainer = document.getElementById('passengerCards');
    if (!passengerCardsContainer) {
        console.error('Passenger cards container not found');
        return;
    }
    
    // Clear existing cards
    passengerCardsContainer.innerHTML = '';
    
    // Check if we have any passengers
    if (passengers.length === 0) {
        passengerCardsContainer.innerHTML = `
            <div class="alert alert-info">
                <i class="fas fa-info-circle me-2"></i> No passengers added yet. Click "Add Passenger" to start.
            </div>
        `;
        return;
    }
    
    // Add cards for each passenger
    passengers.forEach((passenger, index) => {
        console.log('Creating card for passenger', index, passenger);
        
        try {
            // Create card element
            const card = document.createElement('div');
            card.className = 'passenger-card';
            card.dataset.index = index;
            
            // Create preference badges if any
            let preferencesHtml = '';
            if (passenger.preferences && passenger.preferences.length > 0) {
                preferencesHtml = '<div class="passenger-preferences mt-2">';
                passenger.preferences.forEach(pref => {
                    preferencesHtml += `<span class="badge bg-light text-primary me-1">${pref}</span>`;
                });
                preferencesHtml += '</div>';
            }
            
            // Create special requests section if any
            let requestsHtml = '';
            if (passenger.specialRequests) {
                requestsHtml = `
                    <div class="special-request mt-2">
                        <small><i class="fas fa-comment-dots me-1"></i> ${passenger.specialRequests}</small>
                    </div>
                `;
            }
            
            // Set inner HTML for card
            card.innerHTML = `
                <div class="row">
                    <div class="col-md-8">
                        <h5 class="mb-1">${passenger.name}</h5>
                        <p class="mb-1">
                            <span class="text-muted">Age:</span> ${passenger.age} | 
                            <span class="text-muted">Gender:</span> ${passenger.gender} | 
                            <span class="text-muted">Seat:</span> <strong>${passenger.seatNumber}</strong>
                        </p>
                        ${passenger.idType ? `<p class="mb-1 small"><span class="text-muted">${passenger.idType}:</span> ${passenger.idNumber}</p>` : ''}
                        ${preferencesHtml}
                        ${requestsHtml}
                    </div>
                    <div class="col-md-4 text-end">
                        <button class="btn btn-sm btn-outline-primary edit-passenger-btn me-2" data-index="${index}">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-sm btn-outline-danger remove-passenger-btn" data-index="${index}">
                            <i class="fas fa-trash"></i> Remove
                        </button>
                    </div>
                </div>
            `;
            
            // Add to container
            passengerCardsContainer.appendChild(card);
            
            // Add event listeners for buttons
            const editBtn = card.querySelector('.edit-passenger-btn');
            if (editBtn) {
                editBtn.addEventListener('click', function() {
                    editPassenger(index);
                });
            }
            
            const removeBtn = card.querySelector('.remove-passenger-btn');
            if (removeBtn) {
                removeBtn.addEventListener('click', function() {
                    removePassenger(index);
                });
            }
        } catch (error) {
            console.error('Error creating passenger card:', error);
        }
    });
    
    // Enable the proceed button if we have passengers
    document.getElementById('proceedBtn').disabled = passengers.length === 0;
}

// Edit passenger details
function editPassenger(index) {
    console.log('Editing passenger at index', index);
    
    try {
        const passenger = passengers[index];
        if (!passenger) {
            console.error('Passenger not found at index', index);
            return;
        }
        
        // Set form values
        document.getElementById('passengerName').value = passenger.name;
        document.getElementById('passengerAge').value = passenger.age;
        document.getElementById('passengerGender').value = passenger.gender;
        document.getElementById('seatNumber').value = passenger.seatNumber;
        document.getElementById('idType').value = passenger.idType || '';
        document.getElementById('idNumber').value = passenger.idNumber || '';
        document.getElementById('specialRequests').value = passenger.specialRequests || '';
        
        // Set preferences checkboxes
        document.getElementById('prefWindow').checked = passenger.preferences && passenger.preferences.includes('Window');
        document.getElementById('prefAisle').checked = passenger.preferences && passenger.preferences.includes('Aisle');
        document.getElementById('prefLower').checked = passenger.preferences && passenger.preferences.includes('Lower Deck');
        document.getElementById('prefLegroom').checked = passenger.preferences && passenger.preferences.includes('Extra Legroom');
        
        // Set the edit index attribute
        document.getElementById('passengerForm').setAttribute('data-edit-index', index);
        
        // Show the modal
        const modalElement = document.getElementById('passengerFormModal');
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
    } catch (error) {
        console.error('Error editing passenger:', error);
        alert('An error occurred while trying to edit passenger details.');
    }
}

// Remove a passenger
function removePassenger(index) {
    console.log('Removing passenger at index', index);
    
    try {
        // Confirm deletion
        if (!confirm('Are you sure you want to remove this passenger?')) {
            return;
        }
        
        // Get the passenger's seat
        const passenger = passengers[index];
        if (!passenger) {
            console.error('No passenger found at index', index);
            return;
        }
        
        const seatNumber = passenger.seatNumber;
        console.log('Removing passenger with seat', seatNumber);
        
        // Remove from passengers array
        passengers.splice(index, 1);
        
        // Remove from selected seats
        const seatIndex = selectedSeats.indexOf(seatNumber);
        if (seatIndex !== -1) {
            selectedSeats.splice(seatIndex, 1);
            console.log('Updated selected seats:', selectedSeats);
            
            // Update seat UI
            const seatElement = document.querySelector(`.seat[data-seat="${seatNumber}"]`);
            if (seatElement) {
                seatElement.classList.remove('selected');
                seatElement.classList.add('available');
            }
        }
        
        // Update UI
        updatePassengerCards();
        updateBookingSummary();
        
        // Save to localStorage
        savePassengers(busId);
        
        // Show feedback
        showSuccess('Passenger removed successfully');
        
        // Disable proceed button if no passengers
        document.getElementById('proceedBtn').disabled = passengers.length === 0;
    } catch (error) {
        console.error('Error removing passenger:', error);
        alert('An error occurred while removing the passenger.');
    }
}

// Update booking summary
function updateBookingSummary() {
    if (!busDetails) return;
    
    document.getElementById('summaryBusName').textContent = `${busDetails.busName} (${busDetails.busNumber})`;
    document.getElementById('summaryJourney').textContent = `${busDetails.source} to ${busDetails.destination}`;
    
    const departDate = new Date(busDetails.departureTime);
    document.getElementById('summaryDateTime').textContent = formatDateTime(departDate);
    
    document.getElementById('summaryPassengers').textContent = passengers.length;
    document.getElementById('summarySeats').textContent = selectedSeats.length > 0 ? selectedSeats.join(', ') : '-';
    document.getElementById('summaryFare').textContent = `₹${perSeatFare.toFixed(2)}`;
    
    // Calculate total
    const total = passengers.length * perSeatFare;
    document.getElementById('summaryTotal').textContent = `₹${total.toFixed(2)}`;
}

// Show confirmation modal
function showConfirmationModal() {
    // Validate contact information
    const contactName = document.getElementById('contactName').value.trim();
    const contactPhone = document.getElementById('contactPhone').value.trim();
    const contactEmail = document.getElementById('contactEmail').value.trim();
    
    if (!contactName || !contactPhone || !contactEmail) {
        showError('Please complete all contact information fields.');
        return;
    }
    
    // Validate passengers
    if (passengers.length === 0) {
        showError('Please add at least one passenger to proceed.');
        return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactEmail)) {
        showError('Please enter a valid email address.');
        return;
    }
    
    // Validate phone format (simple check)
    if (contactPhone.length < 10) {
        showError('Please enter a valid phone number.');
        return;
    }
    
    // Populate confirmation modal
    
    // 1. Bus Details
    const confirmBusDetails = document.getElementById('confirmBusDetails');
    confirmBusDetails.innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <p><strong>Bus Name:</strong> ${busDetails.busName || busDetails.busNumber}</p>
                <p><strong>Bus Type:</strong> ${busDetails.busType}</p>
                <p><strong>Journey:</strong> ${busDetails.source} to ${busDetails.destination}</p>
            </div>
            <div class="col-md-6">
                <p><strong>Departure:</strong> ${formatDateTime(new Date(busDetails.departureTime))}</p>
                <p><strong>Arrival:</strong> ${formatDateTime(new Date(busDetails.arrivalTime))}</p>
                <p><strong>Duration:</strong> ${busDetails.duration || calculateDuration(busDetails.departureTime, busDetails.arrivalTime)}</p>
            </div>
        </div>
    `;
    
    // 2. Passenger Details
    const confirmPassengerDetails = document.getElementById('confirmPassengerDetails');
    confirmPassengerDetails.innerHTML = '';
    
    passengers.forEach((passenger, index) => {
        confirmPassengerDetails.innerHTML += `
            <div class="passenger-summary ${index < passengers.length - 1 ? 'border-bottom pb-3 mb-3' : ''}">
                <div class="row">
                    <div class="col-md-6">
                        <p class="mb-1"><strong>Passenger ${index + 1}:</strong> ${passenger.name}</p>
                        <p class="mb-1"><strong>Age/Gender:</strong> ${passenger.age} years / ${passenger.gender}</p>
                        ${passenger.idType ? `<p class="mb-1"><strong>ID:</strong> ${passenger.idType} - ${passenger.idNumber}</p>` : ''}
                    </div>
                    <div class="col-md-6">
                        <p class="mb-1"><strong>Seat Number:</strong> ${passenger.seatNumber}</p>
                        ${passenger.seatPreferences && passenger.seatPreferences.length > 0 ? 
                          `<p class="mb-1"><strong>Preferences:</strong> ${passenger.seatPreferences.join(', ')}</p>` : ''}
                        ${passenger.specialRequests ? 
                          `<p class="mb-1"><strong>Special Requests:</strong> ${passenger.specialRequests}</p>` : ''}
                    </div>
                </div>
            </div>
        `;
    });
    
    // 3. Contact Details
    const confirmContactDetails = document.getElementById('confirmContactDetails');
    confirmContactDetails.innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <p><strong>Name:</strong> ${contactName}</p>
                <p><strong>Email:</strong> ${contactEmail}</p>
            </div>
            <div class="col-md-6">
                <p><strong>Phone:</strong> ${contactPhone}</p>
            </div>
        </div>
    `;
    
    // 4. Payment Summary
    const confirmPaymentDetails = document.getElementById('confirmPaymentDetails');
    confirmPaymentDetails.innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <p><strong>Ticket Price:</strong> ₹${perSeatFare} × ${passengers.length} passenger(s)</p>
            </div>
            <div class="col-md-6">
                <p><strong>Total Amount:</strong> <span class="text-primary fw-bold">₹${perSeatFare * passengers.length}</span></p>
            </div>
        </div>
    `;
    
    // Show the modal
    const modal = new bootstrap.Modal(document.getElementById('confirmationModal'));
    modal.show();
}

// Calculate duration between two datetime strings
function calculateDuration(departureTime, arrivalTime) {
    const departDateTime = new Date(departureTime);
    const arrivalDateTime = new Date(arrivalTime);
    
    // Calculate duration in milliseconds
    const durationMs = arrivalDateTime - departDateTime;
    
    // Convert to hours and minutes
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
}

// Process the booking
function processBooking() {
    console.log('Processing booking...');
    
    // Validate form first
    if (!validateBookingForm()) {
        return;
    }
    
    // Get the auth token
    const token = localStorage.getItem('authToken');
    if (!token) {
        showError('You must be logged in to complete this booking. Please login and try again.');
        setTimeout(() => {
            window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname + window.location.search);
        }, 2000);
        return;
    }
    
    // Show loading state
    const confirmBookingBtn = document.getElementById('confirmBookingBtn');
    confirmBookingBtn.disabled = true;
    confirmBookingBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Processing...';
    
    // Build the booking request object
    const bookingRequest = buildBookingRequest();
    console.log('Booking request:', bookingRequest);
    
    // Make the API call
    fetch(`/api/bookings/${busId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify(bookingRequest)
    })
    .then(response => {
        console.log('API response status:', response.status);
        
        if (response.status === 401) {
            throw new Error('UNAUTHORIZED');
        }
        
        if (!response.ok) {
            return response.text().then(text => {
                console.error('API Error:', text);
                throw new Error(text || 'Failed to create booking');
            });
        }
        
        return response.json();
    })
    .then(bookingResponse => {
        console.log('Booking created successfully:', bookingResponse);
        
        // Hide the confirmation modal
        const confirmationModal = bootstrap.Modal.getInstance(document.getElementById('confirmationModal'));
        confirmationModal.hide();
        
        // Show success message
        showSuccess('Booking created successfully! Redirecting to payment page...');
        
        // Save the booking response to local storage (for easy retrieval on payment page)
        saveBookingToLocalStorage(bookingResponse, bookingRequest);
        
        // Redirect to payment page after 2 seconds
        setTimeout(() => {
            window.location.href = `/payment/${bookingResponse.id}`;
        }, 2000);
    })
    .catch(error => {
        console.error('Error creating booking:', error);
        
        // Re-enable button
        confirmBookingBtn.disabled = false;
        confirmBookingBtn.innerHTML = '<i class="fas fa-check"></i> Confirm and Pay';
        
        // Handle specific errors
        if (error.message === 'UNAUTHORIZED') {
            showError('Your session has expired. Please login again.');
            setTimeout(() => {
                window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname + window.location.search);
            }, 2000);
            return;
        }
        
        // Show error message
        showError('Failed to create booking: ' + error.message);
    });
}

// Build the booking request object from form data
function buildBookingRequest() {
    // Get contact info
    const contactEmail = document.getElementById('contactEmail').value;
    const contactPhone = document.getElementById('contactPhone').value;
    
    // Build passenger list
    const passengerRequests = passengers.map(passenger => {
        // Get seat preferences as an array
        const seatPreferences = [];
        if (passenger.prefWindow) seatPreferences.push('Window');
        if (passenger.prefAisle) seatPreferences.push('Aisle');
        if (passenger.prefLower) seatPreferences.push('Lower Deck');
        if (passenger.prefUpper) seatPreferences.push('Upper Deck');
        
        return {
            name: passenger.name,
            age: passenger.age,
            gender: passenger.gender,
            seatNumber: passenger.seatNumber,
            documentType: passenger.documentType || null,
            documentNumber: passenger.documentNumber || null,
            seatPreferences: seatPreferences,
            specialRequests: passenger.specialRequests || null
        };
    });
    
    // Calculate total amount
    const totalAmount = perSeatFare * passengers.length;
    
    // Build the complete request
    return {
        busId: busId,
        numberOfSeats: passengers.length,
        passengers: passengerRequests,
        contactEmail: contactEmail,
        contactPhone: contactPhone,
        totalAmount: totalAmount
    };
}

// Validate the booking form before submission
function validateBookingForm() {
    // Check if passengers were added
    if (passengers.length === 0) {
        showError('You must add at least one passenger to proceed.');
        return false;
    }
    
    // Check if the number of passengers matches the number of selected seats
    if (passengers.length !== selectedSeats.length) {
        showError('The number of passengers must match the number of selected seats.');
        return false;
    }
    
    // Validate contact information
    const contactEmail = document.getElementById('contactEmail').value;
    const contactPhone = document.getElementById('contactPhone').value;
    
    if (!contactEmail) {
        showError('Please provide a contact email address.');
        document.getElementById('contactEmail').focus();
        return false;
    }
    
    if (!isValidEmail(contactEmail)) {
        showError('Please provide a valid email address.');
        document.getElementById('contactEmail').focus();
        return false;
    }
    
    if (!contactPhone) {
        showError('Please provide a contact phone number.');
        document.getElementById('contactPhone').focus();
        return false;
    }
    
    if (!isValidPhoneNumber(contactPhone)) {
        showError('Please provide a valid phone number.');
        document.getElementById('contactPhone').focus();
        return false;
    }
    
    return true;
}

// Email validation helper
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Phone number validation helper
function isValidPhoneNumber(phone) {
    // Simple validation: at least 10 digits
    const phoneRegex = /^\d{10,15}$/;
    return phoneRegex.test(phone.replace(/\D/g, ''));
}

// Show the confirmation modal with booking details
function showConfirmationModal() {
    console.log('Showing confirmation modal');
    
    // Validate form first
    if (!validateBookingForm()) {
        return;
    }
    
    // Update confirmation modal with booking details
    document.getElementById('confirmBusName').textContent = busDetails ? busDetails.busName : '--';
    document.getElementById('confirmJourney').textContent = busDetails ? 
        `${busDetails.source} to ${busDetails.destination}` : '--';
    document.getElementById('confirmDateTime').textContent = busDetails ? 
        formatDateTime(busDetails.departureTime) : '--';
    document.getElementById('confirmSeats').textContent = selectedSeats.join(', ');
    document.getElementById('confirmPassengerCount').textContent = passengers.length;
    document.getElementById('confirmTotal').textContent = perSeatFare * passengers.length;
    
    // Show the modal
    const confirmationModal = new bootstrap.Modal(document.getElementById('confirmationModal'));
    confirmationModal.show();
}

// Save passenger information from modal
function savePassengerFromModal() {
    console.log('Saving passenger from modal');
    
    // Get form data
    const passengerIndex = parseInt(document.getElementById('passengerIndex').value);
    const name = document.getElementById('passengerName').value;
    const age = parseInt(document.getElementById('passengerAge').value);
    const gender = document.getElementById('passengerGender').value;
    const seatNumber = document.getElementById('passengerSeat').value;
    const documentType = document.getElementById('documentType').value;
    const documentNumber = document.getElementById('documentNumber').value;
    const specialRequests = document.getElementById('specialRequests').value;
    
    // Get preferences
    const prefWindow = document.getElementById('prefWindow').checked;
    const prefAisle = document.getElementById('prefAisle').checked;
    const prefLower = document.getElementById('prefLower').checked;
    const prefUpper = document.getElementById('prefUpper').checked;
    
    // Validate required fields
    if (!name) {
        alert('Please enter passenger name');
        return;
    }
    
    if (!age || isNaN(age) || age < 1) {
        alert('Please enter a valid age');
        return;
    }
    
    if (!gender) {
        alert('Please select passenger gender');
        return;
    }
    
    if (!seatNumber) {
        alert('Please select a seat number');
        return;
    }
    
    // Create passenger object
    const passenger = {
        name,
        age,
        gender,
        seatNumber,
        documentType,
        documentNumber,
        specialRequests,
        prefWindow,
        prefAisle,
        prefLower,
        prefUpper
    };
    
    // If editing existing passenger
    if (passengerIndex >= 0 && passengerIndex < passengers.length) {
        // Get the old seat number to mark it as available
        const oldSeatNumber = passengers[passengerIndex].seatNumber;
        if (oldSeatNumber !== seatNumber && selectedSeats.includes(oldSeatNumber)) {
            // Remove the old seat from selected seats
            const oldSeatIndex = selectedSeats.indexOf(oldSeatNumber);
            if (oldSeatIndex !== -1) {
                selectedSeats.splice(oldSeatIndex, 1);
            }
            
            // Add the new seat to selected seats if not already there
            if (!selectedSeats.includes(seatNumber)) {
                selectedSeats.push(seatNumber);
            }
        }
        
        // Update passenger
        passengers[passengerIndex] = passenger;
    } else {
        // Add new passenger
        passengers.push(passenger);
        
        // Add seat to selected seats if not already there
        if (!selectedSeats.includes(seatNumber)) {
            selectedSeats.push(seatNumber);
        }
    }
    
    // Update UI
    updatePassengerCards();
    updateBookingSummary();
    
    // Hide modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('passengerFormModal'));
    modal.hide();
    
    // Save passengers to localStorage
    savePassengers(busId);
    
    console.log('Passenger saved successfully. Current passengers:', passengers);
}

// Populate available seats in the modal dropdown
function populateAvailableSeats() {
    console.log('Populating available seats');
    
    const seatSelect = document.getElementById('passengerSeat');
    seatSelect.innerHTML = '<option value="">Select a seat</option>';
    
    // Get current editing index
    const editingIndex = parseInt(document.getElementById('passengerIndex').value);
    
    // Get all seats
    const totalSeats = busDetails ? busDetails.totalSeats : 40;
    
    for (let i = 1; i <= totalSeats; i++) {
        const seatNumber = i.toString();
        const isBooked = busDetails && busDetails.bookedSeats && busDetails.bookedSeats.includes(i);
        const isSelected = selectedSeats.includes(seatNumber);
        
        // Skip if seat is booked or selected by another passenger
        if (isBooked || (isSelected && (!editingIndex || editingIndex < 0 || passengers[editingIndex].seatNumber !== seatNumber))) {
            continue;
        }
        
        const option = document.createElement('option');
        option.value = seatNumber;
        option.textContent = `Seat ${seatNumber}`;
        seatSelect.appendChild(option);
    }
}

// Generate the seat map based on bus details
function generateSeatMap() {
    console.log('Generating seat map');
    
    const seatMapContainer = document.getElementById('seatMap');
    if (!seatMapContainer) return;
    
    // Clear existing content
    seatMapContainer.innerHTML = '';
    
    // Check if bus details are available
    if (!busDetails) {
        seatMapContainer.innerHTML = '<div class="text-center p-4"><p>Seat information not available.</p></div>';
        return;
    }
    
    // Get the total number of seats
    const totalSeats = busDetails.totalSeats || 40;
    
    // Get booked seats
    const bookedSeats = busDetails.bookedSeats || [];
    
    // Create the seat map grid
    for (let i = 1; i <= totalSeats; i++) {
        const seatNumber = i.toString();
        const seatElement = document.createElement('div');
        seatElement.className = 'seat';
        seatElement.id = `seat-${seatNumber}`;
        seatElement.textContent = seatNumber;
        
        // Determine seat status
        if (bookedSeats.includes(i)) {
            seatElement.classList.add('booked');
            seatElement.title = 'Seat already booked';
        } else if (selectedSeats.includes(seatNumber)) {
            seatElement.classList.add('selected');
            seatElement.title = 'Your selected seat';
        } else {
            seatElement.classList.add('available');
            seatElement.title = 'Available seat';
            
            // Add click handler for available seats
            seatElement.addEventListener('click', () => toggleSeatSelection(seatNumber));
        }
        
        // Add to seat map
        seatMapContainer.appendChild(seatElement);
    }
    
    // Update seat count display
    document.getElementById('availableSeatsCount').textContent = busDetails.availableSeats || (totalSeats - bookedSeats.length);
    document.getElementById('selectedSeatsCount').textContent = selectedSeats.length;
    document.getElementById('perSeatFare').textContent = busDetails.fare || 0;
    
    // Store the per seat fare for calculations
    perSeatFare = busDetails.fare || 0;
}

// Toggle seat selection when clicked
function toggleSeatSelection(seatNumber) {
    console.log('Toggling seat selection for seat:', seatNumber);
    
    const seatElement = document.getElementById(`seat-${seatNumber}`);
    if (!seatElement) return;
    
    // Check if the seat is already selected
    const seatIndex = selectedSeats.indexOf(seatNumber);
    
    if (seatIndex === -1) {
        // Check if this passenger has another seat selected
        const existingPassengerWithSeat = passengers.find(p => !selectedSeats.includes(p.seatNumber));
        
        if (existingPassengerWithSeat) {
            // Update the existing passenger's seat
            existingPassengerWithSeat.seatNumber = seatNumber;
            selectedSeats.push(seatNumber);
            seatElement.classList.remove('available');
            seatElement.classList.add('selected');
            
            // Update UI
            updatePassengerCards();
            updateBookingSummary();
            
            console.log('Updated existing passenger seat to:', seatNumber);
        } else {
            // Show passenger form to add a new passenger for this seat
            selectedSeats.push(seatNumber);
            seatElement.classList.remove('available');
            seatElement.classList.add('selected');
            
            // Set the modal to add new passenger
            document.getElementById('passengerIndex').value = '-1';
            document.getElementById('passengerForm').reset();
            
            // Pre-select the seat in the form
            populateAvailableSeats();
            const seatSelect = document.getElementById('passengerSeat');
            seatSelect.value = seatNumber;
            
            // Show modal to collect passenger details
            const passengerModal = new bootstrap.Modal(document.getElementById('passengerFormModal'));
            passengerModal.show();
            
            console.log('Showing passenger form for new seat:', seatNumber);
        }
    } else {
        // Find the passenger with this seat
        const passengerIndex = passengers.findIndex(p => p.seatNumber === seatNumber);
        
        if (passengerIndex !== -1) {
            // Ask for confirmation before removing
            if (confirm(`Remove passenger ${passengers[passengerIndex].name} and unselect seat ${seatNumber}?`)) {
                // Remove passenger
                passengers.splice(passengerIndex, 1);
                
                // Unselect seat
                selectedSeats.splice(seatIndex, 1);
                seatElement.classList.remove('selected');
                seatElement.classList.add('available');
                
                // Update UI
                updatePassengerCards();
                updateBookingSummary();
                
                console.log('Removed passenger and unselected seat:', seatNumber);
            }
        } else {
            // Just unselect the seat
            selectedSeats.splice(seatIndex, 1);
            seatElement.classList.remove('selected');
            seatElement.classList.add('available');
            
            console.log('Unselected seat:', seatNumber);
        }
    }
    
    // Update seat count display
    document.getElementById('selectedSeatsCount').textContent = selectedSeats.length;
    
    // Save passengers to localStorage
    savePassengers(busId);
}

// Save passengers to localStorage
function savePassengers(busId) {
    try {
        const currentBusId = busId || window.busId;
        if (!currentBusId) {
            console.error('Cannot save passengers: Bus ID not found');
            return;
        }
        
        const data = {
            passengers: passengers,
            selectedSeats: selectedSeats
        };
        
        localStorage.setItem(`passengers_${currentBusId}`, JSON.stringify(data));
        console.log('Saved passenger data to localStorage for bus:', currentBusId);
    } catch (error) {
        console.error('Error saving passenger data:', error);
    }
}

// Load saved passengers from localStorage
function loadSavedPassengers(busId) {
    try {
        const currentBusId = busId || window.busId;
        if (!currentBusId) {
            console.error('Cannot load passengers: Bus ID not found');
            return;
        }
        
        const savedData = localStorage.getItem(`passengers_${currentBusId}`);
        
        if (savedData) {
            const data = JSON.parse(savedData);
            passengers = data.passengers || [];
            selectedSeats = data.selectedSeats || [];
            
            if (passengers.length > 0) {
                updatePassengerCards();
                document.getElementById('passengerList').style.display = 'block';
            }
        }
    } catch (error) {
        console.error('Error loading saved passengers:', error);
    }
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

// Show success message
function showSuccess(message) {
    const successElement = document.getElementById('successMessage');
    successElement.textContent = message;
    successElement.style.display = 'block';
    
    // Hide after 5 seconds
    setTimeout(() => {
        successElement.style.display = 'none';
    }, 3000);
}

// Save booking data to localStorage for MyBookings page
function saveBookingToLocalStorage(bookingResponse, bookingRequest) {
    try {
        // Get existing bookings
        let myBookings = JSON.parse(localStorage.getItem('myBookings')) || [];
        
        // Create booking summary
        const bookingSummary = {
            id: bookingResponse.id,
            bookingDate: new Date().toISOString(),
            busId: window.busId,
            busName: busDetails.busName,
            busNumber: busDetails.busNumber,
            source: busDetails.source,
            destination: busDetails.destination,
            departureTime: busDetails.departureTime,
            arrivalTime: busDetails.arrivalTime,
            passengerCount: passengers.length,
            seatNumbers: selectedSeats,
            totalFare: passengers.length * perSeatFare,
            status: bookingResponse.status || 'PENDING',
            contactName: bookingRequest.contactName,
            contactPhone: bookingRequest.contactPhone,
            contactEmail: bookingRequest.contactEmail,
            passengers: passengers.map(p => ({
                name: p.name,
                age: p.age,
                gender: p.gender,
                seatNumber: p.seatNumber
            }))
        };
        
        // Add to bookings array
        myBookings.push(bookingSummary);
        
        // Limit to last 20 bookings to avoid localStorage size limits
        if (myBookings.length > 20) {
            myBookings = myBookings.slice(-20);
        }
        
        // Save to localStorage
        localStorage.setItem('myBookings', JSON.stringify(myBookings));
        console.log('Booking data saved to localStorage for My Bookings page');
    } catch (error) {
        console.error('Error saving booking data to localStorage:', error);
    }
} 