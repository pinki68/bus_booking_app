// Form validation
function validateForm(formId) {
    const form = document.getElementById(formId);
    const formFields = form.querySelectorAll('.form-control');
    let isValid = true;

    formFields.forEach(field => {
        if (field.hasAttribute('required') && !field.value.trim()) {
            displayError(field, 'This field is required');
            isValid = false;
        } else {
            clearError(field);

            // Email validation
            if (field.type === 'email') {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(field.value)) {
                    displayError(field, 'Please enter a valid email address');
                    isValid = false;
                }
            }

            // Password validation (minimum 6 characters)
            if (field.name === 'password') {
                if (field.value.length < 6) {
                    displayError(field, 'Password must be at least 6 characters');
                    isValid = false;
                }
            }

            // Confirm password validation (if exists)
            if (field.name === 'confirmPassword') {
                const password = form.querySelector('[name="password"]');
                if (field.value !== password.value) {
                    displayError(field, 'Passwords do not match');
                    isValid = false;
                }
            }
        }
    });

    return isValid;
}

function displayError(field, message) {
    field.classList.add('invalid');
    
    // Remove existing error message if any
    const existingError = field.parentElement.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.textContent = message;
    field.parentElement.appendChild(errorElement);
}

function clearError(field) {
    field.classList.remove('invalid');
    const errorElement = field.parentElement.querySelector('.error-message');
    if (errorElement) {
        errorElement.remove();
    }
}

function displayResponseMessage(form, message, isSuccess = false) {
    // Remove any existing message
    const existingMessage = form.querySelector('.response-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    const messageElement = document.createElement('div');
    messageElement.className = isSuccess ? 'success-message response-message' : 'error-message response-message';
    messageElement.textContent = message;
    form.appendChild(messageElement);
}

// Registration form handling
document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            if (validateForm('registerForm')) {
                registerUser();
            }
        });
    }

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            if (validateForm('loginForm')) {
                loginUser();
            }
        });
    }
});

function registerUser() {
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const fullName = document.getElementById('fullName').value;
    const phoneNumber = document.getElementById('phoneNumber').value;

    const signupRequest = {
        username: username,
        email: email,
        password: password,
        fullName: fullName,
        phoneNumber: phoneNumber
    };

    console.log('Sending registration request:', {...signupRequest, password: '******'});

    // Display a loading message
    const form = document.getElementById('registerForm');
    displayResponseMessage(form, 'Processing your registration...', true);

    fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(signupRequest)
    })
    .then(response => {
        // Log the entire response for debugging
        console.log("Registration response status:", response.status);
        
        // Check if response is ok before parsing JSON
        if (!response.ok) {
            if (response.status === 400) {
                return response.json().then(errorData => {
                    throw new Error(errorData.message || 'Registration failed. Please try again.');
                });
            }
            throw new Error('Registration failed with status: ' + response.status);
        }
        
        return response.json();
    })
    .then(data => {
        console.log("Registration response data:", data);
        
        // Clear all form fields
        form.reset();
        
        // Show success message
        displayResponseMessage(form, 'Registration successful! Redirecting to login page...', true);
        
        // Redirect to login page after 2 seconds
        setTimeout(() => {
            window.location.href = '/login';
        }, 2000);
    })
    .catch(error => {
        console.error('Registration error:', error);
        displayResponseMessage(form, error.message || 'Registration failed. Please try again.');
    });
}

function loginUser() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const loginRequest = {
        username: username,
        password: password
    };

    fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(loginRequest)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Invalid credentials');
        }
        return response.json();
    })
    .then(data => {
        // Store the JWT token
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify({
            id: data.id,
            username: data.username,
            email: data.email
        }));
        
        // Check for redirect parameter in URL
        const urlParams = new URLSearchParams(window.location.search);
        const redirectUrl = urlParams.get('redirect') || localStorage.getItem('redirectAfterLogin');
        
        if (redirectUrl) {
            // Clear stored redirect
            localStorage.removeItem('redirectAfterLogin');
            console.log('Redirecting to:', redirectUrl);
            window.location.href = redirectUrl;
        } else {
            // Default redirect to home page
            window.location.href = '/';
        }
    })
    .catch(error => {
        const form = document.getElementById('loginForm');
        displayResponseMessage(form, 'Invalid username or password. Please try again.');
        console.error('Error:', error);
    });
}

// Check if user is logged in when page loads
document.addEventListener('DOMContentLoaded', function() {
    checkUserLoggedIn();
});

// Update UI based on login status
function checkUserLoggedIn() {
    const token = localStorage.getItem('authToken');
    const userInfo = document.querySelector('.user-info');
    const authButtons = document.querySelector('.auth-buttons');
    
    if (token) {
        // User is logged in
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            if (user && user.username) {
                if (document.getElementById('userUsername')) {
                    document.getElementById('userUsername').textContent = user.username;
                }
                
                if (userInfo) {
                    userInfo.style.display = 'flex';
                    console.log('User info section displayed');
                }
                if (authButtons) {
                    authButtons.style.display = 'none';
                    console.log('Auth buttons hidden');
                }
                
                console.log('User is logged in:', user.username);
                return true;
            }
        } catch (e) {
            console.error('Error parsing user info:', e);
        }
    }
    
    // User is not logged in or info is incomplete
    if (userInfo) {
        userInfo.style.display = 'none';
        console.log('User info section hidden');
    }
    if (authButtons) {
        authButtons.style.display = 'flex';
        console.log('Auth buttons displayed');
    }
    
    console.log('User is not logged in');
    return false;
}

// Check if user is authorized - returns true if user has valid token
function isUserAuthorized() {
    const token = localStorage.getItem('authToken');
    if (!token) {
        return false;
    }
    
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        return user && user.username;
    } catch (e) {
        console.error('Error checking authorization:', e);
        return false;
    }
}

// Logout function
function logout() {
    // Save current path before logout to redirect back later if needed
    const currentPath = window.location.pathname;
    // Only store non-sensitive pages like buses or home
    if (currentPath !== '/login' && currentPath !== '/register') {
        localStorage.setItem('lastPageBeforeLogout', currentPath);
    }
    
    // Clear authentication data
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    
    // Redirect to home page
    window.location.href = '/';
}

// Add event listener for logout button
document.addEventListener('DOMContentLoaded', function() {
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }
});

// Check if there's a redirect after login
function checkRedirectAfterLogin() {
    const redirectUrl = localStorage.getItem('redirectAfterLogin');
    
    // Don't redirect to favicon.ico
    if (redirectUrl && redirectUrl.includes('favicon.ico')) {
        localStorage.removeItem('redirectAfterLogin');
        return false;
    }
    
    if (redirectUrl) {
        localStorage.removeItem('redirectAfterLogin');
        window.location.href = redirectUrl;
        return true;
    }
    return false;
}

// Store auth token and user info
function storeAuthInfo(token, userId, username, email) {
    // Don't store if no token is provided
    if (!token) {
        console.error('No token provided to storeAuthInfo');
        return;
    }
    
    // Ensure token has proper format
    const formattedToken = token.startsWith('Bearer ') ? token : 'Bearer ' + token;
    console.log('Storing auth token (first few chars):', formattedToken.substring(0, 15) + '...');
    
    // Store token directly - do not use localStorage.setItem again as it might be called elsewhere
    localStorage.setItem('authToken', formattedToken);
    
    // Store user info
    localStorage.setItem('user', JSON.stringify({
        id: userId,
        username: username,
        email: email
    }));
    
    console.log('Auth info stored successfully for user:', username);
}

// Get auth headers for API requests
function getAuthHeaders() {
    const token = localStorage.getItem('authToken');
    
    // Log the token for debugging (only first few characters)
    console.log('Token retrieved from localStorage:', token ? 
                (token.length > 10 ? token.substring(0, 10) + '...' : token) : 'null');
    
    if (!token) {
        console.warn('No auth token found!');
        return {
            'Content-Type': 'application/json'
        };
    }
    
    // Check if token is in correct format (starts with "Bearer" or not)
    let authToken = token;
    if (token && !token.startsWith('Bearer ')) {
        authToken = 'Bearer ' + token;
    }
    
    console.log('Using auth token with format:', 
                authToken.length > 15 ? authToken.substring(0, 15) + '...' : authToken);
    
    return {
        'Content-Type': 'application/json',
        'Authorization': authToken
    };
}

// Validate token using the validate-token endpoint
function validateToken() {
    return new Promise((resolve, reject) => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            console.warn('No token found to validate');
            reject(new Error('No authentication token found'));
            return;
        }
        
        fetch('/api/auth/validate-token', {
            method: 'GET',
            headers: getAuthHeaders()
        })
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                // If token is invalid, clear it
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                throw new Error('Invalid or expired token');
            }
        })
        .then(data => {
            // Update user info in localStorage with the latest data
            if (data) {
                localStorage.setItem('user', JSON.stringify({
                    id: data.id,
                    username: data.username,
                    email: data.email
                }));
            }
            resolve(data);
        })
        .catch(err => {
            console.error('Error validating token:', err);
            reject(err);
        });
    });
} 