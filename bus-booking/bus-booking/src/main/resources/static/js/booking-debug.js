// Debug version of booking.js
console.log('booking-debug.js loaded at:', new Date().toISOString());

// Report script loading success
function reportScriptLoaded() {
    console.log('booking-debug.js executed successfully');
    document.dispatchEvent(new CustomEvent('booking-debug-loaded'));
}

// Initialize page on document load
document.addEventListener('DOMContentLoaded', function() {
    console.log('Booking page initialized (debug version)');
    reportScriptLoaded();
    
    // Test auth.js availability
    if (typeof validateToken === 'function') {
        console.log('auth.js loaded correctly - validateToken function available');
    } else {
        console.error('auth.js not loaded correctly - validateToken function not available');
    }
    
    // Test common.js availability
    if (typeof apiRequest === 'function') {
        console.log('common.js loaded correctly - apiRequest function available');
    } else {
        console.error('common.js not loaded correctly - apiRequest function not available');
    }
    
    // Test jQuery availability (if used)
    if (typeof $ === 'function') {
        console.log('jQuery loaded correctly');
    } else {
        console.log('jQuery not loaded or not used in this project');
    }
    
    // Test Bootstrap availability (if used)
    if (typeof bootstrap !== 'undefined') {
        console.log('Bootstrap JS loaded correctly');
    } else {
        console.log('Bootstrap JS not loaded or not used in this project');
    }
    
    // Add a visual indicator to the page
    const debugBanner = document.createElement('div');
    debugBanner.style.position = 'fixed';
    debugBanner.style.top = '0';
    debugBanner.style.left = '0';
    debugBanner.style.width = '100%';
    debugBanner.style.padding = '10px';
    debugBanner.style.backgroundColor = '#ffeb3b';
    debugBanner.style.color = 'black';
    debugBanner.style.zIndex = '9999';
    debugBanner.style.textAlign = 'center';
    debugBanner.style.fontSize = '14px';
    debugBanner.innerHTML = 'Debug Mode: Static resources diagnostic active. Check console for details.';
    document.body.appendChild(debugBanner);
    
    // Initialize the booking page with debug info
    console.log('Initializing booking page with debug info...');
}); 