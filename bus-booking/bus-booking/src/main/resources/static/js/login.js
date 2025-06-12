document.addEventListener('DOMContentLoaded', function() {
    console.log('Login page loaded');
    
    // Add event listener to login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        console.log('Login form found, adding submit handler');
        loginForm.addEventListener('submit', handleLogin);
    } else {
        console.error('Login form not found');
    }
    
    // Check if there's a redirect parameter in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const redirectParam = urlParams.get('redirect');
    if (redirectParam) {
        console.log('Redirect parameter found:', redirectParam);
        // Store it in localStorage for after login
        localStorage.setItem('redirectAfterLogin', redirectParam);
    }
});

function handleLogin(e) {
    e.preventDefault();
    console.log('Login form submitted');
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    // Validate form inputs
    if (!username || !password) {
        showError('Please fill in all fields');
        return;
    }
    
    // Clear previous error messages
    clearError();
    
    // Show loading state
    const submitBtn = document.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Logging in...';
    
    console.log('Sending login request for username:', username);
    
    // Send login request
    fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            username: username,
            password: password
        })
    })
    .then(response => {
        console.log('Login response status:', response.status);
        if (!response.ok) {
            throw new Error(response.status === 401 ? 'Invalid username or password' : 'Login failed');
        }
        return response.json();
    })
    .then(data => {
        console.log('Login successful, token received');
        
        // Check if the token was received
        if (!data.token) {
            console.error('No token received from server');
            showError('Authentication failed: No token received');
            return;
        }

        // Store token and user info
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify({
            id: data.id,
            username: data.username,
            email: data.email
        }));
        
        console.log('User data stored in localStorage');
        
        // Check for redirect parameter in hidden field
        const redirectParam = document.getElementById('redirectParam');
        if (redirectParam && redirectParam.value) {
            console.log('Redirecting to:', redirectParam.value);
            window.location.href = redirectParam.value;
            return;
        }
        
        // Check if there's a redirect URL stored in localStorage
        const redirect = localStorage.getItem('redirectAfterLogin');
        if (redirect) {
            console.log('Redirecting to stored path:', redirect);
            localStorage.removeItem('redirectAfterLogin');
            window.location.href = redirect;
        } else {
            // Default redirect to home page
            window.location.href = '/';
        }
    })
    .catch(error => {
        console.error('Login error:', error);
        showError(error.message);
        
        // Reset button state
        submitBtn.disabled = false;
        submitBtn.textContent = 'Login';
    });
}

function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        console.error('Login error:', message);
    }
}

function clearError() {
    const errorDiv = document.getElementById('errorMessage');
    if (errorDiv) {
        errorDiv.textContent = '';
        errorDiv.style.display = 'none';
    }
} 