document.addEventListener('DOMContentLoaded', function() {
    // Profile form submission
    document.getElementById('profileForm').addEventListener('submit', function(e) {
        e.preventDefault();
        updateProfile();
    });

    // Password form submission
    document.getElementById('passwordForm').addEventListener('submit', function(e) {
        e.preventDefault();
        updatePassword();
    });
});

function updateProfile() {
    const profileData = {
        firstName: document.getElementById('firstName').value,
        lastName: document.getElementById('lastName').value,
        email: document.getElementById('email').value,
        phoneNumber: document.getElementById('phoneNumber').value,
        address: document.getElementById('address').value
    };

    fetch('/profile/api', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData)
    })
    .then(response => {
        if (response.ok) {
            showAlert('Profile updated successfully', 'success');
        } else {
            showAlert('Failed to update profile', 'danger');
        }
    })
    .catch(error => {
        showAlert('Error updating profile', 'danger');
        console.error('Error:', error);
    });
}

function updatePassword() {
    const passwordData = {
        currentPassword: document.getElementById('currentPassword').value,
        newPassword: document.getElementById('newPassword').value
    };

    fetch('/profile/api/password', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(passwordData)
    })
    .then(response => {
        if (response.ok) {
            showAlert('Password updated successfully', 'success');
            document.getElementById('passwordForm').reset();
        } else {
            showAlert('Failed to update password', 'danger');
        }
    })
    .catch(error => {
        showAlert('Error updating password', 'danger');
        console.error('Error:', error);
    });
}

function addPaymentCard() {
    const cardNumber = document.getElementById('cardNumber').value;
    const cardType = document.getElementById('cardType').value;
    const expiryDate = document.getElementById('expiryDate').value;

    const paymentCard = {
        cardType: cardType,
        lastFourDigits: cardNumber.slice(-4),
        expiryDate: expiryDate,
        isDefault: false
    };

    fetch('/profile/api/payment-cards', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentCard)
    })
    .then(response => {
        if (response.ok) {
            showAlert('Payment card added successfully', 'success');
            location.reload();
        } else {
            showAlert('Failed to add payment card', 'danger');
        }
    })
    .catch(error => {
        showAlert('Error adding payment card', 'danger');
        console.error('Error:', error);
    });
}

function removePaymentCard(id) {
    if (confirm('Are you sure you want to remove this payment card?')) {
        fetch(`/profile/api/payment-cards/${id}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (response.ok) {
                showAlert('Payment card removed successfully', 'success');
                location.reload();
            } else {
                showAlert('Failed to remove payment card', 'danger');
            }
        })
        .catch(error => {
            showAlert('Error removing payment card', 'danger');
            console.error('Error:', error);
        });
    }
}

function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.role = 'alert';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    const container = document.querySelector('.container');
    container.insertBefore(alertDiv, container.firstChild);

    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
	
	
	
	document.addEventListener("DOMContentLoaded", () => {
	    const token = localStorage.getItem("token");

	    if (!token) {
	        alert("User is not authenticated.");
	        window.location.href = "/login"; // Redirect if no token
	        return;
	    }

	    fetch("http://localhost:8080/profile", {
	        method: "GET",
	        headers: {
	            "Authorization": `Bearer ${token}`,
	            "Content-Type": "application/json"
	        }
	    })
	    .then(response => {
	        if (!response.ok) {
	            throw new Error("Failed to fetch profile");
	        }
	        return response.json();
	    })
	    .then(data => {
	        console.log("User Profile:", data);
	        // Update DOM elements with user profile data
	        document.getElementById("userName").textContent = data.name;
	        document.getElementById("userEmail").textContent = data.email;
	    })
	    .catch(error => {
	        console.error("Error:", error);
	    });
	});



	
	
	const token = localStorage.getItem("token");

	fetch("http://localhost:8080/profile", {
	    method: "GET",
	    headers: {
	        "Content-Type": "application/json",
	        "Authorization": `Bearer ${token}`
	    }
	})
	.then(response => {
	    if (!response.ok) throw new Error("Unauthorized or failed");
	    return response.json();
	})
	.then(data => {
	    console.log("Profile Data:", data);
	})
	.catch(error => {
	    console.error("Error fetching profile:", error);
	});

	
} 