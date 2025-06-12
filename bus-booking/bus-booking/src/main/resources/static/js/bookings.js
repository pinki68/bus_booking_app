// Initialize page when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Bookings page loaded');
    
    // Check if user is authenticated
    if (!checkAuth()) {
        console.log('Auth check failed - redirecting to login');
        return; // Stop execution if not authenticated
    }
    
    // Setup UI interactions
    setupUIInteractions();
    
    // Load user's bookings
    loadBookings();
});

// Check authentication
function checkAuth() {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
        console.log('No auth token found - redirecting to login');
        localStorage.setItem('redirectAfterLogin', window.location.pathname);
        window.location.href = '/login';
        return false;
    }
    
    // Setup logout button
    setupAuthUI();
    
    return true;
}

// Setup authentication-related UI elements
function setupAuthUI() {
    // Hide login/register buttons, show logout
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (loginBtn) loginBtn.style.display = 'none';
    if (registerBtn) registerBtn.style.display = 'none';
    if (logoutBtn) {
        logoutBtn.style.display = 'inline-block';
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            localStorage.removeItem('authToken');
            window.location.href = '/login';
        });
    }
}

// Setup UI interactions for tab navigation, filters, etc.
function setupUIInteractions() {
    // Tab navigation
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            tabButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');
            
            // Filter bookings based on tab
            const tabType = this.getAttribute('data-tab');
            console.log('Tab changed to:', tabType);
            filterBookingsByTab(tabType);
        });
    });
    
    // Status filters - mobile view
    const statusFilters = document.querySelectorAll('.status-filter');
    statusFilters.forEach(filter => {
        filter.addEventListener('click', function() {
            statusFilters.forEach(f => f.classList.remove('active'));
            this.classList.add('active');
            
            const status = this.getAttribute('data-status');
            console.log('Status filter changed to:', status);
            filterBookingsByStatus(status);
        });
    });
    
    // Search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(function() {
            const searchText = this.value.toLowerCase();
            console.log('Search text:', searchText);
            filterBookingsBySearch(searchText);
        }, 300));
    }
}

// Debounce function to limit how often a function can fire
function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this, args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(function() {
            func.apply(context, args);
        }, wait);
    };
}

// Get auth headers for API requests
function getAuthHeaders() {
    const token = localStorage.getItem('authToken');
    return {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
    };
}

// Load and display user's bookings
function loadBookings() {
    const bookingsList = document.getElementById('bookingsList');
    if (!bookingsList) {
        console.error('Bookings list container not found in DOM');
        return;
    }
    
    bookingsList.innerHTML = `
        <div class="loading">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-3">Loading your bookings...</p>
        </div>
    `;
    
    console.log('Loading bookings from API and local storage');
    
    // Load bookings from both API and localStorage
    Promise.all([
        loadApiBookings(),
        loadLocalBookings()
    ])
    .then(([apiBookings, localBookings]) => {
        // Combine both sources
        const allBookings = [...apiBookings, ...localBookings];
        console.log('All bookings loaded:', allBookings);
        
        if (!allBookings || allBookings.length === 0) {
            showNoBookings();
            return;
        }
        
        displayBookings(allBookings);
    })
    .catch(error => {
        console.error('Error loading bookings:', error);
        bookingsList.innerHTML = `
            <div class="error-message">
                <p>${error.message}</p>
                <button onclick="loadBookings()" class="btn btn-primary mt-3">Try Again</button>
            </div>
        `;
    });
}

// Load bookings from API
function loadApiBookings() {
    return new Promise((resolve, reject) => {
        console.log('Fetching bookings from API...');
        
        // Get auth token
        const token = localStorage.getItem('authToken');
        if (!token) {
            console.warn('No auth token available for API bookings');
            resolve([]);
            return;
        }
        
        // Get current hostname and port
        const currentHostname = window.location.hostname;
        const apiPort = '8081'; // Match the port in application.properties
        
        // Build the correct API URL
        // For local development, use the full URL with port
        // For production, use a relative URL to avoid CORS issues
        let apiUrl;
        if (currentHostname === 'localhost') {
            // Local development
            apiUrl = `http://${currentHostname}:${apiPort}/api/bookings`;
        } else {
            // Production environment - use relative URL
            apiUrl = '/api/bookings';
        }
        
        console.log('Sending API request to:', apiUrl);
        
        fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token,
                'Accept': 'application/json'
            },
            credentials: 'include' // Include cookies for cross-origin requests
        })
        .then(response => {
            console.log('API response status:', response.status);
            
            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    console.error('Authentication error:', response.status);
                    // Handle token expiry - redirect to login
                    localStorage.removeItem('authToken');
                    localStorage.setItem('redirectAfterLogin', window.location.pathname);
                    window.location.href = '/login';
                    throw new Error('Authentication error. Please login again.');
                }
                
                return response.text().then(text => {
                    console.error('API Error Response:', text);
                    throw new Error('Failed to load bookings. Status: ' + response.status);
                });
            }
            return response.json();
        })
        .then(bookings => {
            console.log('API Bookings loaded successfully:', bookings);
            
            // If bookings is null or undefined, use an empty array
            const validBookings = bookings || [];
            
            // Convert to correct format if needed
            const processedBookings = validBookings.map(booking => {
                // Make sure critical fields have fallback values
                return {
                    ...booking,
                    id: booking.id || 'N/A',
                    status: booking.status || 'PENDING',
                    totalAmount: booking.totalAmount || 0,
                    numberOfSeats: booking.numberOfSeats || 0,
                    bookingDate: booking.bookingDate || new Date().toISOString(),
                    source: booking.source || 'N/A',
                    destination: booking.destination || 'N/A',
                    passengers: booking.passengers || []
                };
            });
            
            resolve(processedBookings);
        })
        .catch(error => {
            console.error('Error loading API bookings:', error);
            
            // Try loading fallback data
            tryLoadFallbackData()
                .then(fallbackData => {
                    console.log('Loaded fallback booking data:', fallbackData);
                    resolve(fallbackData);
                })
                .catch(() => {
                    // Don't reject, just return empty array to allow local bookings to show
                    resolve([]);
                });
        });
    });
}

// Try to load fallback data from a static JSON file
function tryLoadFallbackData() {
    return new Promise((resolve, reject) => {
        fetch('/static/data/sample-bookings.json')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to load fallback data');
                }
                return response.json();
            })
            .then(data => {
                resolve(data);
            })
            .catch(error => {
                console.error('Error loading fallback data:', error);
                // Create some sample data
                const sampleData = [
                    {
                        id: 'SAMPLE-1',
                        status: 'CONFIRMED',
                        totalAmount: 1500,
                        numberOfSeats: 2,
                        bookingDate: new Date().toISOString(),
                        source: 'Mumbai',
                        destination: 'Delhi',
                        busName: 'Express Deluxe',
                        busNumber: 'EXP-101',
                        departureTime: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
                        passengers: [
                            {
                                name: 'John Doe',
                                age: 30,
                                gender: 'Male',
                                seatNumber: 'A1'
                            },
                            {
                                name: 'Jane Doe',
                                age: 28,
                                gender: 'Female',
                                seatNumber: 'A2'
                            }
                        ],
                        source_type: 'sample'
                    }
                ];
                resolve(sampleData);
            });
    });
}

// Load bookings from localStorage
function loadLocalBookings() {
    return new Promise((resolve) => {
        try {
            // Get bookings from localStorage
            const localBookings = JSON.parse(localStorage.getItem('myBookings')) || [];
            console.log('Local bookings loaded:', localBookings);
            
            // Add source field to differentiate from API bookings
            localBookings.forEach(booking => {
                booking.source_type = 'local';
            });
            
            resolve(localBookings);
        } catch (error) {
            console.error('Error loading local bookings:', error);
            resolve([]);
        }
    });
}

// Display no bookings message
function showNoBookings() {
    const bookingsList = document.getElementById('bookingsList');
    bookingsList.innerHTML = `
        <div class="no-bookings">
            <h3>You don't have any bookings yet</h3>
            <p>Book your first bus journey today!</p>
            <a href="/buses" class="cta-button">Find Buses</a>
        </div>
    `;
}

// Display bookings in UI
function displayBookings(bookings) {
    const bookingsList = document.getElementById('bookingsList');
    bookingsList.innerHTML = '';
    
    // Sort bookings by date (newest first)
    bookings.sort((a, b) => new Date(b.bookingDate) - new Date(a.bookingDate));
    
    bookings.forEach(booking => {
        const bookingCard = createBookingCard(booking);
        bookingsList.appendChild(bookingCard);
    });
}

// Create booking card element
function createBookingCard(booking) {
    console.log('Creating booking card for:', booking);
    
    const bookingCard = document.createElement('div');
    bookingCard.className = 'booking-card';
    bookingCard.setAttribute('data-booking-id', booking.id || 'local');
    
    // Add a class if it's a local booking
    if (booking.source_type === 'local') {
        bookingCard.classList.add('local-booking');
    }
    
    // Format booking date
    const bookingDate = booking.bookingDate ? new Date(booking.bookingDate) : new Date();
    const formattedBookingDate = bookingDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
    
    // Format journey date (if available)
    let departureDate = 'N/A';
    let departureTime = 'N/A';
    if (booking.departureTime) {
        const depDate = new Date(booking.departureTime);
        if (!isNaN(depDate.getTime())) {
            departureDate = depDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
            departureTime = depDate.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    }
    
    // Get status - with fallbacks
    const status = booking.status || 'PENDING';
    
    // Create header
    const header = document.createElement('div');
    header.className = 'booking-header';
    header.innerHTML = `
        <div>
            <h3>Booking #${booking.id || 'N/A'}</h3>
            <small>${formattedBookingDate}</small>
        </div>
        <div class="booking-status status-${status.toLowerCase()}">${status}</div>
    `;
    bookingCard.appendChild(header);
    
    // Create details section
    const details = document.createElement('div');
    details.className = 'booking-details';
    
    // Bus details
    const busDetails = document.createElement('div');
    busDetails.className = 'bus-details';
    busDetails.innerHTML = `
        <h4>Bus Details</h4>
        <div class="detail-row">
            <div class="detail-label">Bus:</div>
            <div>${booking.busName || ''} ${booking.busNumber ? `(${booking.busNumber})` : ''}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Route:</div>
            <div>${booking.source || 'N/A'} to ${booking.destination || 'N/A'}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Journey Date:</div>
            <div>${departureDate}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Departure Time:</div>
            <div>${departureTime}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Bus Type:</div>
            <div>${booking.busType || 'Standard'}</div>
        </div>
    `;
    details.appendChild(busDetails);
    
    // Booking info
    const bookingInfo = document.createElement('div');
    bookingInfo.className = 'booking-info';
    
    // Calculate total amount and passengers differently for API vs local bookings
    const totalAmount = booking.totalFare || booking.totalAmount || 0;
    const numPassengers = booking.passengerCount || booking.numberOfSeats || 
                         (booking.passengers ? booking.passengers.length : 0);
                         
    // Extract seat numbers from passengers if available
    let seatNumbers = 'N/A';
    if (booking.passengers && booking.passengers.length > 0) {
        const seatNums = booking.passengers
            .filter(p => p && p.seatNumber)
            .map(p => p.seatNumber);
        if (seatNums.length > 0) {
            seatNumbers = seatNums.join(', ');
        }
    } else if (booking.seatNumbers && booking.seatNumbers.length > 0) {
        seatNumbers = booking.seatNumbers.join(', ');
    }
    
    bookingInfo.innerHTML = `
        <h4>Booking Details</h4>
        <div class="detail-row">
            <div class="detail-label">Booking ID:</div>
            <div>${booking.id || 'Local Booking'}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Status:</div>
            <div>${status}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Total Seats:</div>
            <div>${numPassengers}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Seat Numbers:</div>
            <div>${seatNumbers}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Amount:</div>
            <div>₹${Number(totalAmount).toFixed(2)}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Payment Status:</div>
            <div>${booking.paymentStatus || (status === 'CONFIRMED' ? 'PAID' : 'PENDING')}</div>
        </div>
    `;
    details.appendChild(bookingInfo);
    bookingCard.appendChild(details);
    
    // Add passenger section if available
    if (booking.passengers && booking.passengers.length > 0) {
        console.log('Adding passenger details:', booking.passengers);
        const passengersSection = document.createElement('div');
        passengersSection.className = 'booking-passengers';
        
        let passengersHTML = '<h4>Passengers</h4><div class="passengers-list">';
        
        booking.passengers.forEach((passenger, index) => {
            if (!passenger) {
                console.warn('Null passenger at index', index);
                return;
            }
            
            passengersHTML += `
                <div class="passenger-item">
                    <div class="passenger-name">${passenger.name || 'Passenger ' + (index + 1)}</div>
                    <div class="passenger-details">
                        ${passenger.age ? `Age: ${passenger.age}` : ''}
                        ${passenger.gender ? `, ${passenger.gender}` : ''}
                    </div>
                    <div class="passenger-seat">Seat: ${passenger.seatNumber || 'N/A'}</div>
                </div>
            `;
        });
        
        passengersHTML += '</div>';
        passengersSection.innerHTML = passengersHTML;
        bookingCard.appendChild(passengersSection);
    } else {
        console.log('No passenger details available for booking:', booking.id);
    }
    
    // Add action buttons
    const actionsSection = document.createElement('div');
    actionsSection.className = 'booking-actions';
    
    // Only show cancel button for non-completed bookings
    if (status.toUpperCase() !== 'COMPLETED' && status.toUpperCase() !== 'CANCELLED') {
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'action-btn cancel-btn';
        cancelBtn.textContent = 'Cancel Booking';
        cancelBtn.addEventListener('click', () => cancelBooking(booking.id));
        actionsSection.appendChild(cancelBtn);
    }
    
    // Always show e-ticket option for confirmed bookings
    if (status.toUpperCase() === 'CONFIRMED' || status.toUpperCase() === 'COMPLETED') {
        const eticketBtn = document.createElement('button');
        eticketBtn.className = 'action-btn eticket-btn';
        eticketBtn.textContent = 'View E-Ticket';
        eticketBtn.addEventListener('click', () => generateETicket(booking));
        actionsSection.appendChild(eticketBtn);
    }
    
    bookingCard.appendChild(actionsSection);
    
    // Add view details button that expands the card with all passenger details
    const expandButton = document.createElement('button');
    expandButton.className = 'expand-btn';
    expandButton.innerHTML = `<i class="fas fa-chevron-down"></i> View Details`;
    expandButton.addEventListener('click', function() {
        bookingCard.classList.toggle('expanded');
        if (bookingCard.classList.contains('expanded')) {
            expandButton.innerHTML = `<i class="fas fa-chevron-up"></i> Hide Details`;
        } else {
            expandButton.innerHTML = `<i class="fas fa-chevron-down"></i> View Details`;
        }
    });
    bookingCard.appendChild(expandButton);
    
    return bookingCard;
}

// Cancel a booking
function cancelBooking(bookingId) {
    if (!bookingId) {
        alert('Invalid booking ID');
        return;
    }
    
    const confirmation = confirm('Are you sure you want to cancel this booking?');
    if (!confirmation) return;
    
    // First check if it's a local booking
    let localBookings = JSON.parse(localStorage.getItem('myBookings')) || [];
    const localBookingIndex = localBookings.findIndex(b => b.id === bookingId);
    
    if (localBookingIndex !== -1) {
        // It's a local booking - cancel it locally
        localBookings[localBookingIndex].status = 'CANCELLED';
        localStorage.setItem('myBookings', JSON.stringify(localBookings));
        alert('Your booking has been cancelled.');
        loadBookings(); // Refresh the page
        return;
    }
    
    // Otherwise it's an API booking
    fetch(`/api/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: getAuthHeaders()
    })
    .then(response => {
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                throw new Error('Authentication error. Please login again.');
            }
            throw new Error('Failed to cancel booking. Status: ' + response.status);
        }
        return response.json();
    })
    .then(data => {
        console.log('Booking cancelled:', data);
        alert('Your booking has been cancelled.');
        loadBookings(); // Refresh the bookings list
    })
    .catch(error => {
        console.error('Error cancelling booking:', error);
        alert('Failed to cancel booking: ' + error.message);
    });
}

// Generate e-ticket
function generateETicket(booking) {
    if (!booking) {
        alert('Booking information not found');
        return;
    }
    
    console.log('Generating e-ticket for booking:', booking);
    
    // Format departure time
    let departureDate = 'N/A';
    let departureTime = 'N/A';
    if (booking.departureTime) {
        const depDate = new Date(booking.departureTime);
        if (!isNaN(depDate.getTime())) {
            departureDate = depDate.toLocaleDateString('en-US', {
                year: 'numeric', 
                month: 'short', 
                day: 'numeric'
            });
            departureTime = depDate.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    }
    
    // Format booking date
    const bookingDate = booking.bookingDate ? new Date(booking.bookingDate) : new Date();
    const formattedBookingDate = bookingDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
    
    // Create passenger list
    let passengersList = '';
    if (booking.passengers && booking.passengers.length > 0) {
        booking.passengers.forEach((passenger, index) => {
            passengersList += `
                <tr>
                    <td>${index + 1}</td>
                    <td>${passenger.name || 'N/A'}</td>
                    <td>${passenger.age || 'N/A'}</td>
                    <td>${passenger.gender || 'N/A'}</td>
                    <td>${passenger.seatNumber || 'N/A'}</td>
                </tr>
            `;
        });
    } else {
        passengersList = `
            <tr>
                <td colspan="5">No passenger information available</td>
            </tr>
        `;
    }
    
    // Create e-ticket HTML content
    const ticketHtml = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>E-Ticket #${booking.id || 'N/A'}</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    margin: 0;
                    padding: 0;
                    background-color: #f9f9f9;
                }
                .ticket-container {
                    max-width: 800px;
                    margin: 20px auto;
                    padding: 20px;
                    background-color: white;
                    box-shadow: 0 0 10px rgba(0,0,0,0.1);
                    border-radius: 5px;
                }
                .ticket-header {
                    background-color: #4285f4;
                    color: white;
                    padding: 10px 20px;
                    border-radius: 5px 5px 0 0;
                    margin: -20px -20px 20px;
                }
                .ticket-header h1 {
                    margin: 0;
                    font-size: 24px;
                }
                .ticket-section {
                    margin-bottom: 20px;
                    padding-bottom: 20px;
                    border-bottom: 1px solid #eee;
                }
                .ticket-section:last-child {
                    border-bottom: none;
                }
                .ticket-row {
                    display: flex;
                    margin-bottom: 10px;
                }
                .ticket-label {
                    width: 150px;
                    font-weight: bold;
                }
                .ticket-value {
                    flex: 1;
                }
                .journey-details {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background-color: #f5f5f5;
                    padding: 15px;
                    border-radius: 5px;
                    margin-bottom: 20px;
                }
                .location {
                    text-align: center;
                    flex: 1;
                }
                .location h3 {
                    margin: 0;
                    font-size: 18px;
                }
                .location p {
                    margin: 5px 0;
                    color: #666;
                }
                .divider {
                    border-bottom: 2px dashed #ccc;
                    position: relative;
                    flex: 2;
                    height: 1px;
                    margin: 0 15px;
                }
                .divider::before, .divider::after {
                    content: '';
                    position: absolute;
                    width: 20px;
                    height: 20px;
                    background-color: white;
                    border: 2px solid #ccc;
                    border-radius: 50%;
                    top: -10px;
                }
                .divider::before {
                    left: 0;
                }
                .divider::after {
                    right: 0;
                }
                .passenger-table {
                    width: 100%;
                    border-collapse: collapse;
                }
                .passenger-table th, .passenger-table td {
                    border: 1px solid #ddd;
                    padding: 8px;
                    text-align: left;
                }
                .passenger-table th {
                    background-color: #f2f2f2;
                }
                .barcode {
                    text-align: center;
                    margin-top: 20px;
                }
                .barcode img {
                    max-width: 300px;
                }
                .ticket-footer {
                    text-align: center;
                    margin-top: 30px;
                    font-size: 14px;
                    color: #666;
                }
                @media print {
                    body {
                        background-color: white;
                    }
                    .ticket-container {
                        box-shadow: none;
                        margin: 0;
                        padding: 0;
                    }
                    .print-button {
                        display: none;
                    }
                }
            </style>
        </head>
        <body>
            <div class="ticket-container">
                <div class="ticket-header">
                    <h1>BusBooker E-Ticket</h1>
                </div>
                
                <div class="ticket-section">
                    <h2>Booking Information</h2>
                    <div class="ticket-row">
                        <div class="ticket-label">Booking ID:</div>
                        <div class="ticket-value">${booking.id || 'N/A'}</div>
                    </div>
                    <div class="ticket-row">
                        <div class="ticket-label">Booking Date:</div>
                        <div class="ticket-value">${formattedBookingDate}</div>
                    </div>
                    <div class="ticket-row">
                        <div class="ticket-label">Status:</div>
                        <div class="ticket-value">${booking.status || 'CONFIRMED'}</div>
                    </div>
                </div>
                
                <div class="ticket-section">
                    <h2>Journey Details</h2>
                    <div class="journey-details">
                        <div class="location">
                            <h3>${booking.source || 'N/A'}</h3>
                            <p>${departureDate}</p>
                            <p>${departureTime}</p>
                        </div>
                        <div class="divider"></div>
                        <div class="location">
                            <h3>${booking.destination || 'N/A'}</h3>
                        </div>
                    </div>
                    
                    <div class="ticket-row">
                        <div class="ticket-label">Bus:</div>
                        <div class="ticket-value">${booking.busName || ''} ${booking.busNumber ? `(${booking.busNumber})` : ''}</div>
                    </div>
                    <div class="ticket-row">
                        <div class="ticket-label">Bus Type:</div>
                        <div class="ticket-value">${booking.busType || 'Standard'}</div>
                    </div>
                    <div class="ticket-row">
                        <div class="ticket-label">Total Seats:</div>
                        <div class="ticket-value">${booking.passengerCount || booking.numberOfSeats || 
                        (booking.passengers ? booking.passengers.length : 0)}</div>
                    </div>
                    <div class="ticket-row">
                        <div class="ticket-label">Seat Numbers:</div>
                        <div class="ticket-value">${booking.seatNumbers && booking.seatNumbers.length > 0 ? 
                        booking.seatNumbers.join(', ') : 'N/A'}</div>
                    </div>
                    <div class="ticket-row">
                        <div class="ticket-label">Total Fare:</div>
                        <div class="ticket-value">₹${(booking.totalFare || booking.totalAmount || 0).toFixed(2)}</div>
                    </div>
                </div>
                
                <div class="ticket-section">
                    <h2>Passenger Details</h2>
                    <table class="passenger-table">
                        <thead>
                            <tr>
                                <th>No.</th>
                                <th>Name</th>
                                <th>Age</th>
                                <th>Gender</th>
                                <th>Seat</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${passengersList}
                        </tbody>
                    </table>
                </div>
                
                <div class="barcode">
                    <p>Scan QR code to verify ticket</p>
                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=BUSBOOKER-TICKET-${booking.id || 'LOCAL'}" alt="QR Code">
                </div>
                
                <div class="ticket-footer">
                    <p>This is a computer-generated e-ticket and does not require a physical signature.</p>
                    <p>Please be at the boarding point at least 15 minutes before departure time.</p>
                    <p>For any assistance, contact our helpline: 1800-123-4567</p>
                </div>
                
                <button class="print-button" onclick="window.print()">Print Ticket</button>
            </div>
            
            <script>
                // Automatically trigger print dialog when page loads
                window.onload = function() {
                    // Slight delay to ensure everything loads
                    setTimeout(function() {
                        window.print();
                    }, 500);
                };
            </script>
        </body>
        </html>
    `;
    
    // Open a new window and write the ticket HTML
    const ticketWindow = window.open('', '_blank', 'width=800,height=600');
    ticketWindow.document.open();
    ticketWindow.document.write(ticketHtml);
    ticketWindow.document.close();
}

// Filter bookings by tab (all, upcoming, completed, cancelled)
function filterBookingsByTab(tabType) {
    if (!tabType) return;
    
    // Get all booking cards
    const bookingCards = document.querySelectorAll('.booking-card');
    if (!bookingCards || bookingCards.length === 0) return;
    
    bookingCards.forEach(card => {
        // Default to showing the card
        card.style.display = 'block';
        
        // Get the status from the card
        const statusElement = card.querySelector('.booking-status');
        if (!statusElement) return;
        
        const status = statusElement.textContent.trim().toLowerCase();
        
        // Filter based on tab type
        if (tabType === 'all') {
            // Show all
            card.style.display = 'block';
        } else if (tabType === 'upcoming' && status === 'pending') {
            // Show pending bookings as upcoming
            card.style.display = 'block';
        } else if (tabType === 'completed' && status === 'completed') {
            // Show completed bookings
            card.style.display = 'block';
        } else if (tabType === 'cancelled' && status === 'cancelled') {
            // Show cancelled bookings
            card.style.display = 'block';
        } else {
            // Hide other cards that don't match the filter
            card.style.display = 'none';
        }
    });
    
    // Update booking count
    updateBookingCount();
}

// Filter bookings by status (all, confirmed, pending, cancelled, etc.)
function filterBookingsByStatus(status) {
    if (!status) return;
    
    // Get all booking cards
    const bookingCards = document.querySelectorAll('.booking-card');
    if (!bookingCards || bookingCards.length === 0) return;
    
    bookingCards.forEach(card => {
        // Default to showing the card
        card.style.display = 'block';
        
        // If status is 'all', show all cards
        if (status === 'all') {
            card.style.display = 'block';
            return;
        }
        
        // Get the status from the card
        const statusElement = card.querySelector('.booking-status');
        if (!statusElement) return;
        
        const cardStatus = statusElement.textContent.trim().toLowerCase();
        
        // Show/hide based on status match
        if (cardStatus === status.toLowerCase()) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
    
    // Update booking count
    updateBookingCount();
}

// Filter bookings by search text
function filterBookingsBySearch(searchText) {
    if (searchText === undefined || searchText === null) return;
    
    // Get all booking cards
    const bookingCards = document.querySelectorAll('.booking-card');
    if (!bookingCards || bookingCards.length === 0) return;
    
    // If search text is empty, show all
    if (!searchText.trim()) {
        bookingCards.forEach(card => card.style.display = 'block');
        updateBookingCount();
        return;
    }
    
    bookingCards.forEach(card => {
        // Get text content of the card
        const cardText = card.textContent.toLowerCase();
        
        // Show/hide based on search text match
        if (cardText.includes(searchText)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
    
    // Update booking count
    updateBookingCount();
}

// Update the count of displayed bookings
function updateBookingCount() {
    const bookingCount = document.getElementById('bookingCount');
    if (!bookingCount) return;
    
    // Count visible booking cards
    const visibleCards = document.querySelectorAll('.booking-card[style*="display: block"]').length;
    bookingCount.textContent = visibleCards;
}

// Add a test function to load sample data directly
function testLoadSampleData() {
    console.log('Loading sample booking data directly...');
    
    // Clear current bookings
    const bookingsList = document.getElementById('bookingsList');
    if (!bookingsList) return;
    
    // Show loading indicator
    bookingsList.innerHTML = `
        <div class="loading">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-3">Loading sample bookings...</p>
        </div>
    `;
    
    // Load the sample data directly
    fetch('/static/data/sample-bookings.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load sample data');
            }
            return response.json();
        })
        .then(bookings => {
            console.log('Sample bookings loaded:', bookings);
            displayBookings(bookings);
        })
        .catch(error => {
            console.error('Error loading sample bookings:', error);
            bookingsList.innerHTML = `
                <div class="error-message">
                    <p>Error loading sample data: ${error.message}</p>
                </div>
            `;
        });
}

// Add this after document loaded - just for testing purposes
setTimeout(() => {
    if (document.getElementById('bookingsList') && 
        document.getElementById('bookingsList').children.length === 0) {
        console.log('No bookings loaded after timeout - trying sample data');
        testLoadSampleData();
    }
}, 5000); // 5 second timeout 