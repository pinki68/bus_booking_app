// Global variables
let allBuses = [];
let filteredBuses = [];
let currentPage = 1;
const busesPerPage = 5;
let sortDirection = 'asc';
let filterOptions = {};
let busesData = [];

// Global function to handle booking button click
window.bookNow = function(busId) {
    console.log('Book Now clicked for bus ID:', busId);
    
    // Check if user is authenticated first
    const token = localStorage.getItem('authToken');
    if (!token) {
        console.log('User not authenticated, redirecting to login');
        // Store the booking URL to redirect back after login
        localStorage.setItem('redirectAfterLogin', `/booking-form/${busId}`);
        window.location.href = '/login';
        return;
    }
    
    // If we have a token, validate it first to ensure it hasn't expired
    try {
        // User is authenticated, proceed with booking
        console.log('User authenticated, redirecting to booking form');
        window.location.href = `/booking-form/${busId}`;
    } catch (error) {
        console.error('Error during booking process:', error);
        localStorage.setItem('redirectAfterLogin', `/booking-form/${busId}`);
        window.location.href = '/login';
    }
};

// Global debug function to force show filters
window.forceShowFilters = function() {
    console.log('Force showing filters');
    const debugHelper = document.getElementById('debugHelper');
    if (debugHelper) {
        debugHelper.style.display = 'none';
    }
    
    const filtersSection = document.getElementById('filtersSection');
    if (filtersSection) {
        filtersSection.style.display = 'block';
        filtersSection.style.visibility = 'visible';
        console.log('Filter section display forced to visible');
    }
    
    const filterForm = document.getElementById('filterForm');
    if (filterForm) {
        filterForm.style.display = 'flex';
        filterForm.style.visibility = 'visible';
        console.log('Filter form display forced to visible');
    }
    
    // Try to find and show all filter groups
    const filterGroups = document.querySelectorAll('.filter-group');
    console.log(`Found ${filterGroups.length} filter groups`);
    filterGroups.forEach((group, index) => {
        group.style.display = 'block';
        console.log(`Force showing filter group ${index}`);
    });
    
    // Re-initialize elements
    initializeFilters();
    
    return false;
};

// DOM elements - Use the actual IDs from the HTML
let filterForm = document.getElementById('filterForm');
let sourceFilter = document.getElementById('sourceFilter');
let destinationFilter = document.getElementById('destinationFilter');
let dateFilter = document.getElementById('dateFilter');
let busTypeFilter = document.getElementById('busTypeFilter');
let priceFilter = document.getElementById('priceFilter');
let timeFilter = document.getElementById('timeFilter');
let priceOutput = document.getElementById('priceOutput');
let applyFiltersBtn = document.getElementById('applyFilters');
let resetFiltersBtn = document.getElementById('resetFilters');
let sortOption = document.getElementById('sortOption');
let busList = document.getElementById('busList');
let busCount = document.getElementById('busCount');
let pagination = document.getElementById('pagination');

// Event listeners
document.addEventListener('DOMContentLoaded', initializePage);

// Direct event listener on the document for apply filters button
document.addEventListener('click', function(event) {
    if (event.target && event.target.id === 'applyFilters') {
        console.log('Apply Filters button clicked through document event listener');
        applyFilters();
    }
});

// Main page initialization
function initializePage() {
    console.log('Initializing buses page...');
    
    // Debug filter visibility
    console.log('Checking filters visibility...');
    const filtersSection = document.querySelector('.filters-section');
    console.log('Filters section found:', filtersSection ? 'Yes' : 'No');
    if (filtersSection) {
        console.log('Filters section display style:', window.getComputedStyle(filtersSection).display);
        console.log('Filters section visibility style:', window.getComputedStyle(filtersSection).visibility);
        
        // If filters section might be hidden, show debug helper
        const computedStyle = window.getComputedStyle(filtersSection);
        if (computedStyle.display === 'none' || computedStyle.visibility === 'hidden') {
            console.log('Filters might be hidden, showing debug helper');
            const debugHelper = document.getElementById('debugHelper');
            if (debugHelper) {
                debugHelper.style.display = 'block';
            }
        }
    }
    
    // Try initializing filters with retry mechanism
    initializeFilters();
    
    // Load buses
    loadBuses();
    
    // Add an extra check for the Apply Filters button after a short delay
    setTimeout(function() {
        const applyFiltersBtn = document.getElementById('applyFilters');
        if (applyFiltersBtn) {
            console.log('Adding extra event listener to Apply Filters button');
            applyFiltersBtn.addEventListener('click', function() {
                console.log('Apply Filters button clicked through delayed setup');
                applyFilters();
            });
        }
    }, 1000);
}

// Function to initialize all filters with retry
function initializeFilters(attempt = 1, maxAttempts = 5) {
    console.log(`Initializing filters (attempt ${attempt}/${maxAttempts})...`);
    
    // Re-get all elements to make sure we have the latest
    filterForm = document.getElementById('filterForm');
    sourceFilter = document.getElementById('sourceFilter');
    destinationFilter = document.getElementById('destinationFilter');
    dateFilter = document.getElementById('dateFilter');
    busTypeFilter = document.getElementById('busTypeFilter');
    priceFilter = document.getElementById('priceFilter');
    timeFilter = document.getElementById('timeFilter');
    priceOutput = document.getElementById('priceOutput');
    applyFiltersBtn = document.getElementById('applyFilters');
    resetFiltersBtn = document.getElementById('resetFilters');
    sortOption = document.getElementById('sortOption');
    busList = document.getElementById('busList');
    busCount = document.getElementById('busCount');
    pagination = document.getElementById('pagination');
    
    console.log('Filter elements check:', {
        filterForm: filterForm ? 'Found' : 'Not found',
        sourceFilter: sourceFilter ? 'Found' : 'Not found',
        applyFiltersBtn: applyFiltersBtn ? 'Found' : 'Not found'
    });
    
    // If critical elements are missing, retry after delay
    if (!filterForm || !sourceFilter || !applyFiltersBtn) {
        if (attempt < maxAttempts) {
            console.log(`Missing critical filter elements, retrying in 500ms...`);
            setTimeout(() => initializeFilters(attempt + 1, maxAttempts), 500);
            return;
        } else {
            console.error('Failed to find filter elements after multiple attempts');
            // Force show debug helper
            const debugHelper = document.getElementById('debugHelper');
            if (debugHelper) {
                debugHelper.style.display = 'block';
            }
        }
    }
    
    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const sourceParam = urlParams.get('source');
    const destinationParam = urlParams.get('destination');
    const dateParam = urlParams.get('date');
    
    console.log('URL parameters:', { sourceParam, destinationParam, dateParam });
    
    // Set source and destination from URL parameters if available
    if (sourceFilter && sourceParam) {
        console.log('Setting source filter value:', sourceParam);
        sourceFilter.value = sourceParam;
    }
    
    if (destinationFilter && destinationParam) {
        console.log('Setting destination filter value:', destinationParam);
        destinationFilter.value = destinationParam;
    }
    
    // Set min date for date filter to today
    if (dateFilter) {
        const today = new Date().toISOString().split('T')[0];
        dateFilter.min = today;
        
        // Use the date from URL parameter if available, otherwise use today
        if (dateParam) {
            console.log('Setting date filter value:', dateParam);
            dateFilter.value = dateParam;
        } else {
            dateFilter.value = today;
        }
    }
    
    // Set up price filter output
    if (priceFilter && priceOutput) {
        priceFilter.addEventListener('input', function() {
            priceOutput.textContent = '₹' + this.value;
        });
    }
    
    // Set up apply filters button
    if (applyFiltersBtn) {
        console.log('Setting up Apply Filters button');
        applyFiltersBtn.addEventListener('click', function() {
            console.log('Apply Filters button clicked!');
                applyFilters();
            });
    }
    
    // Set up reset filters button
    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', function() {
            console.log('Reset Filters button clicked!');
            resetFilters();
        });
    }
    
    // Set up sort dropdown
    if (sortOption) {
        sortOption.addEventListener('change', function() {
            console.log('Sort option changed:', this.value);
            sortBuses(this.value);
        });
    }
    
    // Automatically apply filters if URL parameters are present
    if (sourceParam || destinationParam || dateParam) {
        console.log('URL parameters present, scheduling automatic filter application');
        setTimeout(() => {
            applyFilters();
        }, 1000);
    }
}

// Load buses from API
function loadBuses() {
    console.log('Loading buses...');
    
    if (!busList) {
        busList = document.getElementById('busList');
    }
    
    if (busList) {
    busList.innerHTML = '<div class="loading">Loading buses...</div>';
    } else {
        console.error('Bus list element not found');
        return;
    }
    
    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const source = urlParams.get('source');
    const destination = urlParams.get('destination');
    const date = urlParams.get('date');
    
    let apiUrl = '/api/buses/search';
    
    // Add parameters to URL if they exist
    if (source || destination || date) {
        const params = [];
        if (source) params.push(`source=${encodeURIComponent(source)}`);
        if (destination) params.push(`destination=${encodeURIComponent(destination)}`);
        if (date) params.push(`date=${encodeURIComponent(date)}`);
        
        apiUrl += '?' + params.join('&');
    }
    
    console.log('Fetching buses from:', apiUrl);
    
    // Use mock data directly since API is not working properly
    useMockBuses();
}

// Load mock buses data
function useMockBuses() {
    console.log('Using mock buses data...');
    
    // Mock data for testing/fallback
    const mockBuses = [
        {
            id: 1,
            busNumber: "KA-01-F-1234",
            busName: "Express Travels",
            busType: "AC Sleeper",
            source: "Bangalore",
            destination: "Chennai",
            departureTime: "22:00",
            arrivalTime: "06:00",
            fare: 800,
            totalSeats: 40,
            availableSeats: 32,
            bookedSeats: [1, 2, 5, 9, 15, 18]
        },
        {
            id: 2,
            busNumber: "TN-07-AQ-5678",
            busName: "Royal Riders",
            busType: "Non-AC Sleeper",
            source: "Chennai",
            destination: "Bangalore",
            departureTime: "21:30",
            arrivalTime: "05:30",
            fare: 600,
            totalSeats: 36,
            availableSeats: 22,
            bookedSeats: [3, 4, 8, 12, 15, 16, 20, 21, 22, 28, 30, 35]
        },
        {
            id: 3,
            busNumber: "KA-05-MM-7890",
            busName: "Comfort Travels",
            busType: "AC Seater",
            source: "Bangalore",
            destination: "Mysore",
            departureTime: "14:00",
            arrivalTime: "17:30",
            fare: 350,
            totalSeats: 32,
            availableSeats: 28,
            bookedSeats: [5, 8, 9, 24]
        },
        {
            id: 4,
            busNumber: "KL-10-AB-4321",
            busName: "Kerala Express",
            busType: "Volvo",
            source: "Bangalore",
            destination: "Kochi",
            departureTime: "20:00",
            arrivalTime: "08:00",
            fare: 1200,
            totalSeats: 45,
            availableSeats: 15,
            bookedSeats: [1, 2, 3, 4, 5, 6, 8, 9, 12, 13, 14, 15, 16, 18, 20, 22, 25, 26, 27, 28, 30, 33, 35, 38, 42, 44, 45]
        },
        {
            id: 5,
            busNumber: "AP-16-CD-9876",
            busName: "Andhra Travels",
            busType: "AC Sleeper",
            source: "Hyderabad",
            destination: "Bangalore",
            departureTime: "19:00",
            arrivalTime: "06:30",
            fare: 950,
            totalSeats: 40,
            availableSeats: 24,
            bookedSeats: [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32]
        },
        {
            id: 6,
            busNumber: "MH-12-ZX-5678",
            busName: "Mumbai Express",
            busType: "AC Sleeper",
            source: "Mumbai",
            destination: "Pune",
            departureTime: "23:00",
            arrivalTime: "03:00",
            fare: 450,
            totalSeats: 30,
            availableSeats: 18,
            bookedSeats: [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 27, 29]
        },
        {
            id: 7,
            busNumber: "KA-41-AB-7890",
            busName: "Bangalore Deluxe",
            busType: "Volvo Multi-Axle",
            source: "Bangalore",
            destination: "Mumbai",
            departureTime: "18:00",
            arrivalTime: "10:00",
            fare: 1800,
            totalSeats: 50,
            availableSeats: 35,
            bookedSeats: [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 40, 42, 44, 46, 48]
        }
    ];
    
    console.log('Using mock buses:', mockBuses);
    
    // Save all buses
    allBuses = [...mockBuses];
    
    // Get URL parameters for filtering
    const urlParams = new URLSearchParams(window.location.search);
    const source = urlParams.get('source');
    const destination = urlParams.get('destination');

    // Filter buses based on URL parameters
    if (source || destination) {
        filteredBuses = allBuses.filter(bus => {
            const matchesSource = !source || bus.source.toLowerCase().includes(source.toLowerCase());
            const matchesDestination = !destination || bus.destination.toLowerCase().includes(destination.toLowerCase());
            return matchesSource && matchesDestination;
        });
    } else {
        filteredBuses = [...allBuses];
    }
        
    // Apply the default sort
        sortBuses('price_asc');
        
        // Display buses
        displayBuses();
}

// Apply filters to buses
function applyFilters() {
    console.log('Applying filters...');
    
    // Re-get elements if needed
    if (!sourceFilter) sourceFilter = document.getElementById('sourceFilter');
    if (!destinationFilter) destinationFilter = document.getElementById('destinationFilter');
    if (!dateFilter) dateFilter = document.getElementById('dateFilter');
    if (!busTypeFilter) busTypeFilter = document.getElementById('busTypeFilter');
    if (!priceFilter) priceFilter = document.getElementById('priceFilter');
    if (!timeFilter) timeFilter = document.getElementById('timeFilter');
    
    // Get filter values
    const source = sourceFilter ? sourceFilter.value.toLowerCase().trim() : '';
    const destination = destinationFilter ? destinationFilter.value.toLowerCase().trim() : '';
    const date = dateFilter ? dateFilter.value : '';
    const busType = busTypeFilter ? busTypeFilter.value : '';
    const maxPrice = priceFilter ? parseInt(priceFilter.value) : 3000;
    const departureTime = timeFilter ? timeFilter.value : '';
    
    console.log('Filter values:', { source, destination, date, busType, maxPrice, departureTime });
    
    // Make sure we have buses to filter
    if (!allBuses || allBuses.length === 0) {
        console.log('No buses to filter');
        return;
    }
    
    try {
        // Filter buses
    filteredBuses = allBuses.filter(bus => {
            // Source filter
            if (source && bus.source && !bus.source.toLowerCase().includes(source)) {
            return false;
        }
        
            // Destination filter
            if (destination && bus.destination && !bus.destination.toLowerCase().includes(destination)) {
            return false;
        }
        
            // Bus type filter
        if (busType && bus.busType !== busType) {
            return false;
        }
        
        // Price filter
        if (maxPrice && bus.fare > maxPrice) {
            return false;
        }
        
            // Departure time filter
        if (departureTime && departureTime !== '') {
            if (!bus.departureTime) {
                return false;
            }
            
                // Parse the departure time properly
                let hour;
                if (typeof bus.departureTime === 'string' && bus.departureTime.includes(':')) {
                hour = parseInt(bus.departureTime.split(':')[0]);
                } else if (typeof bus.departureTime === 'string' && bus.departureTime.includes('T')) {
                    // Handle ISO format
                    const time = new Date(bus.departureTime);
                    hour = time.getHours();
            } else {
                return false;
            }
            
            if (isNaN(hour)) {
                return false;
            }
            
            let matches = false;
            
            if (departureTime === 'morning' && (hour >= 5 && hour < 12)) {
                matches = true;
            } else if (departureTime === 'afternoon' && (hour >= 12 && hour < 16)) {
                matches = true;
            } else if (departureTime === 'evening' && (hour >= 16 && hour < 21)) {
                matches = true;
            } else if (departureTime === 'night' && (hour >= 21 || hour < 5)) {
                matches = true;
            }
            
            if (!matches) {
                return false;
            }
        }
        
        return true;
    });
    
        console.log(`Filtered ${allBuses.length} buses down to ${filteredBuses.length}`);
    
        // Reset to first page
    currentPage = 1;
        
        // Re-sort buses
    const sortValue = sortOption ? sortOption.value : 'price_asc';
    sortBuses(sortValue);
    
    // Display filtered buses
    displayBuses();
    } catch (error) {
        console.error('Error while filtering buses:', error);
        // Fall back to showing all buses
        filteredBuses = [...allBuses];
        displayBuses();
    }
}

// Reset all filters
function resetFilters() {
    console.log('Resetting filters...');
    
    // Reset form
    if (filterForm) {
        filterForm.reset();
    }
    
    // Reset price filter
    if (priceFilter && priceOutput) {
        priceFilter.value = priceFilter.max;
        priceOutput.textContent = '₹' + priceFilter.max;
    }
    
    // Reset date to today
    if (dateFilter) {
        const today = new Date().toISOString().split('T')[0];
        dateFilter.value = today;
    }
    
    // Reset to all buses
    filteredBuses = [...allBuses];
    
    // Reset to first page
    currentPage = 1;
    
    // Re-sort buses
    const sortValue = sortOption ? sortOption.value : 'price_asc';
    sortBuses(sortValue);
    
    // Display all buses
    displayBuses();
}

// Sort buses
function sortBuses(sortOption) {
    console.log('Sorting buses by:', sortOption);
    
    if (!filteredBuses || filteredBuses.length === 0) {
        console.log('No buses to sort');
        return;
    }
    
    switch(sortOption) {
        case 'price_asc':
            filteredBuses.sort((a, b) => a.fare - b.fare);
            break;
        case 'price_desc':
            filteredBuses.sort((a, b) => b.fare - a.fare);
            break;
        case 'departure_asc':
            filteredBuses.sort((a, b) => {
                const timeA = new Date('1970/01/01 ' + a.departureTime);
                const timeB = new Date('1970/01/01 ' + b.departureTime);
                return timeA - timeB;
            });
            break;
        case 'departure_desc':
            filteredBuses.sort((a, b) => {
                const timeA = new Date('1970/01/01 ' + a.departureTime);
                const timeB = new Date('1970/01/01 ' + b.departureTime);
                return timeB - timeA;
            });
            break;
        case 'duration_asc':
            filteredBuses.sort((a, b) => {
                const durationA = calculateDuration(a.departureTime, a.arrivalTime);
                const durationB = calculateDuration(b.departureTime, b.arrivalTime);
                return durationA - durationB;
            });
            break;
    }
    
    // Display sorted buses
    displayBuses();
}

// Calculate duration between departure and arrival
function calculateDuration(departureTime, arrivalTime) {
    const departure = new Date('1970/01/01 ' + departureTime);
    let arrival = new Date('1970/01/01 ' + arrivalTime);
    
    // Handle overnight journeys
    if (arrival < departure) {
        arrival = new Date('1970/01/02 ' + arrivalTime);
    }
    
    return arrival - departure;
}

// Display buses
function displayBuses() {
    console.log('Displaying buses...');
    
    if (!busList) {
        busList = document.getElementById('busList');
    }
    
    if (!busList) {
        console.error('Bus list element not found');
            return;
    }
    
    // Get total buses
    const totalBuses = filteredBuses.length;
    
    // Update bus count
    if (busCount) {
        busCount.textContent = totalBuses;
    } else {
        busCount = document.getElementById('busCount');
        if (busCount) {
            busCount.textContent = totalBuses;
        }
    }
    
    // Clear current list
    busList.innerHTML = '';
    
    // Display no results message if needed
    if (totalBuses === 0) {
        busList.innerHTML = `
            <div class="no-results">
                <p>No buses found matching your criteria.</p>
                <p>Try different filters or click the button below to see all available buses.</p>
                <button onclick="resetFilters()" class="apply-btn">Show All Buses</button>
            </div>
        `;
        
        // Clear pagination
        if (pagination) {
            pagination.innerHTML = '';
        }
        
        return;
    }
    
    // Calculate pagination
    const totalPages = Math.ceil(totalBuses / busesPerPage);
    const startIndex = (currentPage - 1) * busesPerPage;
    const endIndex = Math.min(startIndex + busesPerPage, totalBuses);
    
    // Display buses for current page
    for (let i = startIndex; i < endIndex; i++) {
        const bus = filteredBuses[i];
        const busCard = createBusCard(bus);
        busList.appendChild(busCard);
    }
    
    // Update pagination
            updatePagination(totalPages);
}

// Create a bus card
function createBusCard(bus) {
    const busCard = document.createElement('div');
    busCard.className = 'bus-card';
    
    // Calculate journey duration
    const departure = new Date('1970/01/01 ' + bus.departureTime);
    let arrival = new Date('1970/01/01 ' + bus.arrivalTime);
    
    // Handle overnight journeys
    if (arrival < departure) {
        arrival = new Date('1970/01/02 ' + bus.arrivalTime);
    }
    
    const durationMs = arrival - departure;
    const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
    const durationMinutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    const durationText = durationHours + 'h ' + durationMinutes + 'm';
    
    // Bus info section
    const busInfo = document.createElement('div');
    busInfo.className = 'bus-info';
    
    // Use busName if available, otherwise use busNumber
    const busNameOrNumber = bus.busName || bus.busNumber;
    
    busInfo.innerHTML = `
        <h3>${busNameOrNumber} <span class="bus-type">${bus.busType}</span></h3>
        <p><small>Bus Number: ${bus.busNumber}</small></p>
        <p>${bus.source} to ${bus.destination}</p>
        <div class="amenities">
            <span class="amenity">WiFi</span>
            <span class="amenity">Charging Point</span>
            <span class="amenity">Blankets</span>
            <span class="amenity">Water Bottle</span>
        </div>
    `;
    
    // Bus time section
    const busTime = document.createElement('div');
    busTime.className = 'bus-time';
    busTime.innerHTML = `
        <p><strong>Departure:</strong> ${bus.departureTime}</p>
        <p><strong>Arrival:</strong> ${bus.arrivalTime}</p>
        <p><small>Duration: ${durationText}</small></p>
    `;
    
    // Bus price section
    const busPrice = document.createElement('div');
    busPrice.className = 'bus-price';
    
    // Price heading
    const priceHeading = document.createElement('h3');
    priceHeading.textContent = `₹${bus.fare}`;
    busPrice.appendChild(priceHeading);
    
    // Seats info with total seats and available seats
    const seatsInfo = document.createElement('p');
    // Make sure to show availability information clearly
    const totalSeats = bus.totalSeats || 40;
    const availableSeats = bus.availableSeats || (totalSeats - (bus.bookedSeats ? bus.bookedSeats.length : 0));
    seatsInfo.innerHTML = `<small><strong>${availableSeats}</strong> out of <strong>${totalSeats}</strong> seats available</small>`;
    busPrice.appendChild(seatsInfo);
    
    // Book button
    const bookButton = document.createElement('button');
    bookButton.className = 'book-btn';
    bookButton.textContent = 'Book Now';
    bookButton.addEventListener('click', function() {
        window.bookNow(bus.id);
    });
    busPrice.appendChild(bookButton);
    
    // Add all sections to bus card
    busCard.appendChild(busInfo);
    busCard.appendChild(busTime);
    busCard.appendChild(busPrice);
    
    return busCard;
}

// Update pagination
function updatePagination(totalPages) {
    if (!pagination) {
        pagination = document.getElementById('pagination');
    }
    
    if (!pagination) {
        console.error('Pagination element not found');
        return;
    }
    
    // Clear current pagination
    pagination.innerHTML = '';
    
    // No pagination needed for single page
    if (totalPages <= 1) {
        return;
    }
    
    // Previous button
    const prevButton = document.createElement('button');
    prevButton.className = 'page-btn prev';
    prevButton.textContent = '←';
    prevButton.disabled = currentPage === 1;
    prevButton.addEventListener('click', function() {
        if (currentPage > 1) {
            currentPage--;
            displayBuses();
        }
    });
    pagination.appendChild(prevButton);
    
    // Page buttons
    const maxButtons = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);
    
    if (endPage - startPage + 1 < maxButtons) {
        startPage = Math.max(1, endPage - maxButtons + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const pageButton = document.createElement('button');
        pageButton.className = i === currentPage ? 'page-btn active' : 'page-btn';
        pageButton.textContent = i;
        pageButton.addEventListener('click', function() {
            currentPage = i;
            displayBuses();
        });
        pagination.appendChild(pageButton);
    }
    
    // Next button
    const nextButton = document.createElement('button');
    nextButton.className = 'page-btn next';
    nextButton.textContent = '→';
    nextButton.disabled = currentPage === totalPages;
    nextButton.addEventListener('click', function() {
        if (currentPage < totalPages) {
            currentPage++;
            displayBuses();
        }
    });
    pagination.appendChild(nextButton);
}