// Set min date for the travel date input to today
document.addEventListener('DOMContentLoaded', function() {
    console.log('[SEARCH.JS] Initializing search form - ' + new Date().toISOString());
    
    try {
        const today = new Date().toISOString().split('T')[0];
        const travelDateInput = document.getElementById('travelDate');
        
        if (travelDateInput) {
            travelDateInput.min = today;
            travelDateInput.value = today;
            console.log('[SEARCH.JS] Date input initialized with:', today);
        } else {
            console.error('[SEARCH.JS] Travel date input not found');
        }
        
        // Add event listener to search form
        const searchForm = document.getElementById('busSearchForm');
        if (searchForm) {
            console.log('[SEARCH.JS] Search form found, adding submit event listener');
            
            searchForm.addEventListener('submit', function(e) {
                e.preventDefault();
                console.log('[SEARCH.JS] Search form submitted');
                searchBuses();
            });
        } else {
            console.error('[SEARCH.JS] Search form not found on this page');
        }
    } catch (error) {
        console.error('[SEARCH.JS] Error during initialization:', error);
    }
});

// Function to search for buses
function searchBuses() {
    try {
        console.log('[SEARCH.JS] searchBuses function called');
        const source = document.getElementById('source').value;
        const destination = document.getElementById('destination').value;
        const travelDate = document.getElementById('travelDate').value;
        
        if (!source || !destination || !travelDate) {
            alert('Please fill in all fields: From, To, and Date');
            return;
        }
        
        console.log('[SEARCH.JS] Search parameters:', { source, destination, travelDate });
        
        // Create the query string for navigation
        const queryString = `source=${encodeURIComponent(source)}&destination=${encodeURIComponent(destination)}&date=${encodeURIComponent(travelDate)}`;
        
        const redirectUrl = `/buses?${queryString}`;
        console.log('[SEARCH.JS] Redirecting to:', redirectUrl);
        
        // Use direct window.location.href assignment instead of timeout
        window.location.href = redirectUrl;
    } catch (error) {
        console.error('[SEARCH.JS] Error during search:', error);
        alert('An error occurred while searching for buses. Please try again.');
    }
}

// Function to display search results
function displaySearchResults(buses) {
    const busList = document.getElementById('busList');
    
    // Clear previous results
    busList.innerHTML = '';
    
    if (buses.length === 0) {
        busList.innerHTML = '<div class="no-results">No buses found for the selected route and date.</div>';
        return;
    }
    
    // Sort buses by departure time
    buses.sort((a, b) => {
        return new Date('1970/01/01 ' + a.departureTime) - new Date('1970/01/01 ' + b.departureTime);
    });
    
    // Create bus cards
    buses.forEach(bus => {
        const busCard = document.createElement('div');
        busCard.className = 'bus-card';
        
        const busInfo = document.createElement('div');
        busInfo.className = 'bus-info';
        busInfo.innerHTML = `
            <h3>${bus.busNumber} - ${bus.busType}</h3>
            <p>${bus.source} to ${bus.destination}</p>
            <p><small>Available Seats: ${bus.availableSeats}</small></p>
        `;
        
        const busTime = document.createElement('div');
        busTime.className = 'bus-time';
        busTime.innerHTML = `
            <p><strong>Departure</strong>: ${bus.departureTime}</p>
            <p><strong>Arrival</strong>: ${bus.arrivalTime}</p>
        `;
        
        const busPrice = document.createElement('div');
        busPrice.className = 'bus-price';
        busPrice.innerHTML = `
            <h3>₹${bus.fare}</h3>
            <button onclick="bookNow(${bus.id})" class="book-btn">Book Now</button>
        `;
        
        busCard.appendChild(busInfo);
        busCard.appendChild(busTime);
        busCard.appendChild(busPrice);
        
        busList.appendChild(busCard);
    });
}

// Function to check if user is logged in before booking
function bookNow(busId) {
    // Check if user is logged in
    const token = localStorage.getItem('authToken');
    
    if (!token) {
        // Save the redirect URL for after login
        localStorage.setItem('redirectAfterLogin', `/booking/${busId}`);
        
        // Alert the user
        alert('Please log in to book tickets');
        
        // Redirect to login page
        window.location.href = '/login';
        return;
    }
    
    // If logged in, redirect to booking page
    window.location.href = `/booking/${busId}`;
} 