// This file contains common JavaScript functionality for all pages

// Initialize common elements when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('Common JS loaded - initializing shared features');
    
    // Add event listener to logout button in the header
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        console.log('Logout button found - attaching event listener');
        logoutButton.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Logout button clicked');
            
            // Clear authentication data
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            localStorage.removeItem('redirectAfterLogin');
            
            console.log('User data cleared from localStorage');
            
            // Redirect to home page
            window.location.href = '/';
        });
    } else {
        console.log('Logout button not found in the DOM');
    }
}); 