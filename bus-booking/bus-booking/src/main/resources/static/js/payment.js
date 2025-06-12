// Global variables
let selectedPaymentMethod = null;
let selectedBank = null;
let bookingDetails = null;
let savedPaymentMethods = [];

// DOM elements
const paymentMethods = document.querySelectorAll('.payment-method');
const cardForm = document.getElementById('cardForm');
const upiForm = document.getElementById('upiForm');
const netbankingForm = document.getElementById('netbankingForm');
const walletForm = document.getElementById('walletForm');
const paymentForms = document.querySelectorAll('.payment-form');
const payButton = document.getElementById('payButton');
const backButton = document.getElementById('backButton');
const paymentSuccess = document.getElementById('paymentSuccess');
const paymentError = document.getElementById('paymentError');
const savedPaymentMethodsContainer = document.getElementById('savedPaymentMethods');

// Credit card form elements
const cardNumber = document.getElementById('cardNumber');
const cardName = document.getElementById('cardName');
const cardExpiry = document.getElementById('cardExpiry');
const cardCvv = document.getElementById('cardCvv');
const saveCardCheckbox = document.getElementById('saveCard');
const creditCard = document.getElementById('creditCard');
const cardPreviewNumber = document.getElementById('cardPreviewNumber');
const cardPreviewName = document.getElementById('cardPreviewName');
const cardPreviewExpiry = document.getElementById('cardPreviewExpiry');
const cardPreviewCvv = document.getElementById('cardPreviewCvv');

// UPI form elements
const upiId = document.getElementById('upiId');

// Net Banking elements
const bankOptions = document.querySelectorAll('.bank-option');

// Wallet elements
const walletOptions = document.querySelectorAll('.wallet-option');

// Booking summary elements
const busNumberEl = document.getElementById('busNumber');
const busRouteEl = document.getElementById('busRoute');
const busDepartureEl = document.getElementById('busDeparture');
const totalSeatsEl = document.getElementById('totalSeats');
const perSeatFareEl = document.getElementById('perSeatFare');
const totalFareEl = document.getElementById('totalFare');
const buttonAmountEl = document.getElementById('buttonAmount');

// Add event listeners after DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM content loaded for payment page');
    console.log('BookingId:', bookingId);
    
    // Debug all DOM elements to verify they're found
    console.log('DOM elements found:', {
        paymentMethods: paymentMethods ? paymentMethods.length : 0,
        cardForm: !!cardForm,
        upiForm: !!upiForm,
        netbankingForm: !!netbankingForm,
        walletForm: !!walletForm,
        payButton: !!payButton,
        backButton: !!backButton
    });
    
    // Make sure the button is manually found and enabled for direct payments
    const directPayButton = document.getElementById('payButton');
    if (directPayButton) {
        console.log('Pay button found, enabling direct payment');
    } else {
        console.error('Pay button not found!');
    }
    
    // Enable debug mode by default to help troubleshoot
    if (typeof toggleDebug === 'function') {
        console.log('Enabling debug mode automatically');
        setTimeout(toggleDebug, 500);
    }
    
    // Verify authentication first
    const authOk = checkAuth();
    console.log('Authentication status:', authOk);
    
    if (authOk) {
        // Load booking details if authenticated
        loadBookingDetails();
        
        // Load saved payment methods
        loadSavedPaymentMethods();
        
        // Payment method selection
        document.querySelectorAll('.payment-method').forEach(method => {
            console.log('Adding click listener to payment method:', method.dataset.method);
            method.addEventListener('click', function() {
                console.log('Payment method clicked:', this.dataset.method);
                selectPaymentMethod(this.dataset.method);
            });
        });
    } else {
        console.warn('User not authenticated, adding login listener');
        // Add login button functionality
        const loginBtn = document.getElementById('loginButton');
        if (loginBtn) {
            loginBtn.addEventListener('click', function() {
                localStorage.setItem('redirectAfterLogin', window.location.pathname);
                window.location.href = '/login';
            });
        }
    }
    
    // Credit card form interactions
    if (cardNumber) {
        cardNumber.addEventListener('input', function() {
            formatCardNumber(this);
            updateCardPreview();
        });
    }
    
    if (cardName) {
        cardName.addEventListener('input', updateCardPreview);
    }
    
    if (cardExpiry) {
        cardExpiry.addEventListener('input', function() {
            formatCardExpiry(this);
            updateCardPreview();
        });
    }
    
    if (cardCvv) {
        cardCvv.addEventListener('focus', function() {
            creditCard.classList.add('flipped');
        });
        
        cardCvv.addEventListener('blur', function() {
            creditCard.classList.remove('flipped');
        });
        
        cardCvv.addEventListener('input', updateCardPreview);
    }
    
    // Bank selection
    bankOptions.forEach(bank => {
        bank.addEventListener('click', function() {
            selectBank(this);
        });
    });
    
    // Wallet selection
    walletOptions.forEach(wallet => {
        wallet.addEventListener('click', function() {
            selectWallet(this);
        });
    });
    
    // Button handlers - explicitly ensure they're added
    if (payButton) {
        console.log('Adding click listener to Pay button');
        // Remove existing listeners
        payButton.replaceWith(payButton.cloneNode(true));
        // Get the new button reference
        const freshPayButton = document.getElementById('payButton');
        // Add the listener
        freshPayButton.addEventListener('click', function(e) {
            console.log('Pay button clicked');
            e.preventDefault();
            processPayment();
        });
        // Also set an onclick attribute as backup
        freshPayButton.setAttribute('onclick', 'processPayment()');
    } else {
        console.error('Pay button not found!');
    }
    
    if (backButton) {
        backButton.addEventListener('click', function() {
            window.history.back();
        });
    }
});

// Check if user is authenticated
function checkAuth() {
    const token = localStorage.getItem('authToken');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    // Update UI based on authentication status
    const authButtons = document.querySelector('.auth-buttons');
    const userInfo = document.querySelector('.user-info');
    const userUsername = document.getElementById('userUsername');
    const authError = document.getElementById('authError');
    
    if (token && user && user.username) {
        // User is logged in
        if (authButtons) authButtons.style.display = 'none';
        if (userInfo) {
            userInfo.style.display = 'block';
            if (userUsername) userUsername.textContent = user.username;
        }
        if (authError) authError.style.display = 'none';
        return true;
    } else {
        // User is not logged in
        if (authButtons) authButtons.style.display = 'block';
        if (userInfo) userInfo.style.display = 'none';
        
        // Store the current URL for redirection after login
        localStorage.setItem('redirectAfterLogin', window.location.pathname);
        
        // Show auth error
        if (authError) authError.style.display = 'block';
        
        // Disable the payment button
        if (payButton) payButton.disabled = true;
        
        return false;
    }
}

// Add a helper function to get authentication headers
function getAuthHeaders() {
    const token = localStorage.getItem('authToken');
    if (!token) {
        console.error('No authentication token found');
        return { 'Content-Type': 'application/json' };
    }
    return { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

// Update the loadBookingDetails function to use the helper and handle auth errors
function loadBookingDetails() {
    if (!bookingId) {
        displayError('Booking ID not found');
        return;
    }
    
    const headers = getAuthHeaders();
    
    fetch(`/api/bookings/${bookingId}`, {
        headers: headers
    })
    .then(response => {
        console.log('Booking details API response status:', response.status);
        
        if (response.status === 401 || response.status === 403) {
            // Authentication issue
            throw new Error('Authentication error');
        }
        
        if (!response.ok) {
            throw new Error('Failed to load booking details');
        }
        
        return response.json();
    })
    .then(data => {
        console.log('Booking details loaded:', data);
        bookingDetails = data;
        updateBookingSummary();
        
        // Select default payment method after booking details are loaded
        selectDefaultPaymentMethod();
    })
    .catch(error => {
        console.error('Error loading booking details:', error);
        
        if (error.message === 'Authentication error') {
            alert('Authentication error. Please login again.');
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            window.location.href = '/login?redirect=/payment/' + bookingId;
            return;
        }
        
        displayError('Failed to load booking details. Please try again.');
    });
}

// Load saved payment methods
function loadSavedPaymentMethods() {
    const headers = getAuthHeaders();
    
    fetch('/api/payment-methods', {
        headers: headers
    })
    .then(response => {
        console.log('Payment methods API response status:', response.status);
        
        if (response.status === 401 || response.status === 403) {
            console.warn('Authentication issue when loading payment methods');
            return []; // Return empty array instead of throwing
        }
        
        if (!response.ok) {
            throw new Error('Failed to load payment methods');
        }
        
        return response.json();
    })
    .then(data => {
        if (Array.isArray(data)) {
            savedPaymentMethods = data;
            displaySavedPaymentMethods();
        }
    })
    .catch(error => {
        console.error('Error loading payment methods:', error);
        // Don't show error to user - just continue without saved methods
    });
}

// Display saved payment methods
function displaySavedPaymentMethods() {
    if (!savedPaymentMethodsContainer || savedPaymentMethods.length === 0) return;
    
    let html = '<h3>Saved Payment Methods</h3>';
    
    savedPaymentMethods.forEach(method => {
        html += `
        <div class="payment-method" data-method="saved" data-id="${method.id}">
            <div class="payment-method-icon">💳</div>
            <div class="payment-method-details">
                <div class="payment-method-title">${method.nickname || 'Card'} - ${method.maskedCardNumber}</div>
                <div class="payment-method-info">Expires: ${method.expiryDate} ${method.isDefault ? '(Default)' : ''}</div>
            </div>
        </div>
        `;
    });
    
    savedPaymentMethodsContainer.innerHTML = html;
    
    // Add event listeners for saved methods
    document.querySelectorAll('.payment-method[data-method="saved"]').forEach(method => {
        method.addEventListener('click', function() {
            selectSavedPaymentMethod(this.dataset.id);
        });
    });
}

// Update booking summary
function updateBookingSummary() {
    if (!bookingDetails) return;
    
    // Update summary elements
    if (busNumberEl) busNumberEl.textContent = bookingDetails.busNumber || '--';
    if (busRouteEl) busRouteEl.textContent = `${bookingDetails.source} to ${bookingDetails.destination}`;
    if (busDepartureEl) busDepartureEl.textContent = bookingDetails.departureTime || '--';
    if (totalSeatsEl) totalSeatsEl.textContent = bookingDetails.numberOfSeats || '--';
    if (perSeatFareEl) perSeatFareEl.textContent = bookingDetails.totalAmount / bookingDetails.numberOfSeats || '--';
    if (totalFareEl) totalFareEl.textContent = bookingDetails.totalAmount || '--';
    if (buttonAmountEl) buttonAmountEl.textContent = bookingDetails.totalAmount || '0';
}

// Select payment method
function selectPaymentMethod(method) {
    console.log('Payment method selected:', method);
    selectedPaymentMethod = method;
    
    // Hide all payment forms first
    document.querySelectorAll('.payment-form').forEach(form => {
        form.style.display = 'none';
    });
    
    // Show the selected payment form
    const selectedForm = document.getElementById(method + 'Form');
    if (selectedForm) {
        selectedForm.style.display = 'block';
    }
    
    // Reset bank selection if changing payment method
    if (method !== 'netbanking') {
        selectedBank = null;
    }
    
    // For card payments, enable the pay button immediately
    if (method === 'creditcard' || method === 'debitcard') {
        enablePayButton();
    } else if (method === 'netbanking') {
        // For net banking, we need a bank to be selected first
        updatePayButtonState();
    }
    
    // Update selected class in UI
    document.querySelectorAll('.payment-method').forEach(elem => {
        elem.classList.remove('selected');
    });
    const methodElement = document.querySelector(`.payment-method[data-method="${method}"]`);
    if (methodElement) {
        methodElement.classList.add('selected');
    }
    
    // Log the event
    if (typeof addDebugLog === 'function') {
        addDebugLog('Payment method selected: ' + method);
    }
}

// Select saved payment method
function selectSavedPaymentMethod(id) {
    // Reset all methods
    paymentMethods.forEach(m => m.classList.remove('selected'));
    paymentForms.forEach(form => form.classList.remove('active'));
    
    // Select current method
    document.querySelector(`.payment-method[data-id="${id}"]`).classList.add('selected');
    selectedPaymentMethod = 'saved';
    
    // Enable pay button since we're using a saved method
    enablePayButton();
}

// Select bank
function selectBank(bankElement) {
    // Reset all banks
    bankOptions.forEach(b => b.classList.remove('selected'));
    
    // Select current bank
    bankElement.classList.add('selected');
    
    // Enable pay button
    enablePayButton();
}

// Select wallet
function selectWallet(walletElement) {
    // Reset all wallets
    walletOptions.forEach(w => w.classList.remove('selected'));
    
    // Select current wallet
    walletElement.classList.add('selected');
    
    // Enable pay button
    enablePayButton();
}

// Format card number input (add spaces every 4 digits)
function formatCardNumber(input) {
    let value = input.value.replace(/\D/g, '');
    let formattedValue = '';
    
    for (let i = 0; i < value.length; i++) {
        if (i > 0 && i % 4 === 0) {
            formattedValue += ' ';
        }
        formattedValue += value[i];
    }
    
    input.value = formattedValue;
}

// Format card expiry (MM/YY)
function formatCardExpiry(input) {
    let value = input.value.replace(/\D/g, '');
    
    if (value.length > 2) {
        input.value = value.substring(0, 2) + '/' + value.substring(2, 4);
    } else {
        input.value = value;
    }
}

// Update credit card preview
function updateCardPreview() {
    // Update card number preview
    if (cardNumber.value) {
        let value = cardNumber.value;
        cardPreviewNumber.textContent = value;
    } else {
        cardPreviewNumber.textContent = '**** **** **** ****';
    }
    
    // Update card holder name
    if (cardName.value) {
        cardPreviewName.textContent = cardName.value.toUpperCase();
    } else {
        cardPreviewName.textContent = 'CARD HOLDER';
    }
    
    // Update expiry
    if (cardExpiry.value) {
        cardPreviewExpiry.textContent = cardExpiry.value;
    } else {
        cardPreviewExpiry.textContent = 'MM/YY';
    }
    
    // Update CVV
    if (cardCvv.value) {
        cardPreviewCvv.textContent = cardCvv.value;
    } else {
        cardPreviewCvv.textContent = '***';
    }
    
    // Validate form
    validateCardForm();
}

// Validate card form
function validateCardForm() {
    const isValid = 
        cardNumber.value.replace(/\s/g, '').length >= 16 && 
        cardName.value.length > 3 && 
        cardExpiry.value.length === 5 && 
        cardCvv.value.length === 3;
    
    if (isValid) {
        enablePayButton();
    } else {
        disablePayButton();
    }
    
    return isValid;
}

// Validate UPI form
function validateUpiForm() {
    const isValid = upiId.value.includes('@');
    
    if (isValid) {
        enablePayButton();
    } else {
        disablePayButton();
    }
    
    return isValid;
}

// Validate netbanking form
function validateNetbankingForm() {
    const selectedBank = document.querySelector('.bank-option.selected');
    
    if (selectedBank) {
        enablePayButton();
        return true;
    } else {
        disablePayButton();
        return false;
    }
}

// Validate wallet form
function validateWalletForm() {
    const selectedWallet = document.querySelector('.wallet-option.selected');
    
    if (selectedWallet) {
        enablePayButton();
        return true;
    } else {
        disablePayButton();
        return false;
    }
}

// Enable pay button
function enablePayButton() {
    const payButton = document.getElementById('payButton');
    if (payButton) {
        payButton.disabled = false;
        console.log('Pay button enabled');
    }
}

// Disable pay button
function disablePayButton() {
    const payButton = document.getElementById('payButton');
    if (payButton) {
        payButton.disabled = true;
        console.log('Pay button disabled');
    }
}

// Update the processPayment function to use the helper and handle auth errors
function processPayment() {
    console.log('Processing payment...');
    
    if (typeof addDebugLog === 'function') {
        addDebugLog('Payment process started');
    }
    
    if (!checkAuth()) {
        return;
    }
    
    // Get payment details based on selected method
    let paymentData = {
        bookingId: bookingId,
        method: selectedPaymentMethod,
        amount: bookingDetails ? bookingDetails.totalAmount : 0
    };
    
    if (selectedPaymentMethod === 'netbanking' && selectedBank) {
        paymentData.bankCode = selectedBank;
    } else if (selectedPaymentMethod === 'creditcard' || selectedPaymentMethod === 'debitcard') {
        // For demo, we're not collecting actual card details
        paymentData.cardNumber = '************1234';
    }
    
    // For debugging, just simulate a successful payment
    console.log('Payment data:', paymentData);
    
    if (typeof addDebugLog === 'function') {
        addDebugLog('Payment data prepared: ' + JSON.stringify(paymentData));
    }
    
    // Show processing feedback
    const payButton = document.getElementById('payButton');
    if (payButton) {
        payButton.textContent = 'Processing...';
        payButton.disabled = true;
    }
    
    // First make payment request to process the payment
    fetch('/api/payments', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(paymentData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Payment processing failed');
        }
        return response.json();
    })
    .then(paymentResponse => {
        console.log('Payment processed:', paymentResponse);
        
        if (paymentResponse.status === 'SUCCESS') {
            // Now confirm the booking
            return fetch(`/api/bookings/${bookingId}/confirm`, {
                method: 'POST',
                headers: getAuthHeaders()
            });
        } else {
            throw new Error('Payment was not successful');
        }
    })
    .then(response => {
        if (!response.ok) {
            // Try to get the error message from the response
            return response.text().then(text => {
                throw new Error(text || 'Booking confirmation failed');
            });
        }
        return response.json();
    })
    .then(confirmedBooking => {
        console.log('Booking confirmed:', confirmedBooking);
        
        // Hide payment UI
        document.querySelectorAll('.payment-form').forEach(form => {
            form.style.display = 'none';
        });
        
        const methods = document.querySelector('.payment-methods');
        if (methods) methods.style.display = 'none';
        
        const buttons = document.getElementById('paymentButtons');
        if (buttons) buttons.style.display = 'none';
        
        // Show success message
        const success = document.getElementById('paymentSuccess');
        if (success) {
            success.style.display = 'block';
            success.scrollIntoView({ behavior: 'smooth' });
        }
        
        if (typeof addDebugLog === 'function') {
            addDebugLog('Payment and booking confirmation successful');
        }
        
        // Save booking information to localStorage for success page
        try {
            const myBookings = JSON.parse(localStorage.getItem('myBookings') || '[]');
            myBookings.push(confirmedBooking);
            localStorage.setItem('myBookings', JSON.stringify(myBookings));
            
            // Redirect to success page with booking ID
            window.location.href = `/booking-success?id=${confirmedBooking.id || bookingId}`;
        } catch (err) {
            console.error('Error saving booking to localStorage:', err);
            // Redirect anyway
            window.location.href = '/booking-success?id=' + (confirmedBooking.id || bookingId);
        }
    })
    .catch(error => {
        console.error('Payment error:', error);
        if (typeof addDebugLog === 'function') {
            addDebugLog('Payment error: ' + error.message);
        }
        displayPaymentError(error.message);
    });
}

// Display payment success
function displayPaymentSuccess() {
    // Hide processing UI
    document.getElementById('paymentProcessing').style.display = 'none';
    
    // Show success message
    document.getElementById('paymentSuccess').style.display = 'block';
    
    // Scroll to success message
    document.getElementById('paymentSuccess').scrollIntoView({ behavior: 'smooth' });
    
    // Redirect to success page immediately, skip the delay
    window.location.href = '/booking-success';
}

// Display payment error
function displayPaymentError(message) {
    paymentError.textContent = message;
    paymentError.style.display = 'block';
    
    // Reset pay button
    payButton.disabled = false;
    payButton.textContent = `Pay ₹${bookingDetails.totalAmount}`;
    
    // Scroll to error message
    paymentError.scrollIntoView({ behavior: 'smooth' });
    
    // Hide error after 5 seconds
    setTimeout(() => {
        paymentError.style.display = 'none';
    }, 5000);
}

// Display general error
function displayError(message, showLoginButton = false) {
    paymentError.textContent = message;
    
    // Show login button if requested
    const loginButtonContainer = document.getElementById('loginButtonContainer');
    if (loginButtonContainer) {
        loginButtonContainer.style.display = showLoginButton ? 'block' : 'none';
    }
    
    paymentError.style.display = 'block';
    
    // Scroll to error message
    paymentError.scrollIntoView({ behavior: 'smooth' });
}

// Add processPayment to the global scope
window.processPayment = function() {
    console.log('Global process payment function called');
    processPayment();
};

// At the end of the file
console.log('Payment.js loaded successfully');

// Add this function to select a default payment method and enable the pay button
function selectDefaultPaymentMethod() {
    console.log('Selecting default payment method');
    
    // Select the first payment method by default (credit card)
    const firstMethod = document.querySelector('.payment-method');
    if (firstMethod) {
        selectedPaymentMethod = firstMethod.dataset.method || 'creditcard';
        firstMethod.classList.add('selected');
        
        // Show the corresponding form
        if (cardForm && selectedPaymentMethod === 'creditcard') {
            cardForm.classList.add('active');
        }
        
        // Enable the pay button
        if (payButton) {
            payButton.disabled = false;
        }
        
        console.log('Default payment method selected:', selectedPaymentMethod);
    } else {
        console.error('No payment methods found');
    }
}

function updatePayButtonState() {
    const payButton = document.getElementById('payButton');
    if (!payButton) return;
    
    // For netbanking, we need a bank to be selected
    if (selectedPaymentMethod === 'netbanking') {
        payButton.disabled = !selectedBank;
    } else {
        // For other methods, we just need a payment method
        payButton.disabled = !selectedPaymentMethod;
    }
    
    console.log('Pay button state updated:', !payButton.disabled);
}

// Select a bank directly
function selectBankDirect(bankCode) {
    console.log('Bank selected directly:', bankCode);
    selectedBank = bankCode;
    
    // Update UI
    document.querySelectorAll('.bank-option').forEach(bank => {
        bank.classList.remove('selected');
        if (bank.getAttribute('data-bank') === bankCode) {
            bank.classList.add('selected');
        }
    });
    
    // Enable pay button if we're in netbanking method
    if (selectedPaymentMethod === 'netbanking') {
        enablePayButton();
    }
    
    if (typeof addDebugLog === 'function') {
        addDebugLog('Bank selected directly: ' + bankCode);
    }
}

function selectDefaultPaymentMethod() {
    // Default to credit card
    selectPaymentMethod('creditcard');
    enablePayButton();
    
    if (typeof addDebugLog === 'function') {
        addDebugLog('Default payment method selected: creditcard');
    }
}

// Check authentication
function checkAuth() {
    const token = localStorage.getItem('authToken');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!token || !user.id) {
        console.error('No valid authentication token found for payment');
        alert('Authentication error. Please login again.');
        
        if (typeof addDebugLog === 'function') {
            addDebugLog('Authentication error: Token not found or user ID missing');
        }
        
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        window.location.href = '/login?redirect=/payment/' + bookingId;
        return false;
    }
    
    console.log('Authentication verified');
    return true;
} 