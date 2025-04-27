document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('addDonorForm');
  const messageDiv = document.getElementById('message');
  const token = localStorage.getItem('token');
  const user_id = localStorage.getItem('user_id');
  const user_type = localStorage.getItem('user_type');

  if (!token || !user_id || !user_type) {
    alert('Please login first.');
    window.location.href = '/index.html';
    return;
  }
    
      // Additional code for handling the Add Donor form, like event listeners, form validation, etc.
    
    

  // Block access if user is not a donor
  if (user_type.toLowerCase() !== 'donor') {
    alert('Access Denied! Only donors can fill this form.');
    window.location.href = 'dashboard.html';
    return;
  }

  // Check if donor already submitted their details
  try {
    const checkRes = await fetch(`/api/donors/check?user_id=${user_id}`, {
      headers: {
        Authorization: 'Bearer ' + token
      }
    });

    const checkData = await checkRes.json();

    if (checkRes.ok && checkData.exists) {
      form.style.display = 'none';
      messageDiv.innerHTML = `<div class="alert alert-info text-center">You have already submitted your donor information.</div>`;
      return;
    }
  } catch (error) {
    console.error('Error checking donor existence:', error);
    messageDiv.innerHTML = `<div class="alert alert-danger">Error checking donor status.</div>`;
    return;
  }

  // Submit Donor Form
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const donorData = {
        user_id,
        organization_name: document.getElementById('organization_name').value.trim(),
        contact_person: document.getElementById('contact_person').value.trim(),
        email: document.getElementById('email').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        address: document.getElementById('address').value.trim()
      };

      // Basic validation
      if (Object.values(donorData).some(field => field === '')) {
        messageDiv.innerHTML = `<div class="alert alert-warning">Please fill in all fields.</div>`;
        return;
      }

      try {
        const response = await fetch('/api/donors', {
          method: 'POST',
          headers: {
            Authorization: 'Bearer ' + token,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(donorData)
        });

        const result = await response.json();

        if (response.ok) {
          messageDiv.innerHTML = `<div class="alert alert-success">${result.message || 'Donor added successfully!'}</div>`;
          form.reset();
          form.style.display = 'none'; // Hide form after submission
        } else {
          messageDiv.innerHTML = `<div class="alert alert-danger">${result.error || 'Failed to add donor.'}</div>`;
        }

      } catch (err) {
        console.error('Error:', err);
        messageDiv.innerHTML = `<div class="alert alert-danger">An error occurred. Please try again.</div>`;
      }
    });
  }
});

