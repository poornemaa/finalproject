document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('addRecipientForm');
  const messageDiv = document.getElementById('message');
  const token = localStorage.getItem('token');
  const user_id = localStorage.getItem('user_id');
  const user_type = localStorage.getItem('user_type');

  if (!token || !user_id || !user_type) {
    alert('Please login first.');
    window.location.href = '/index.html';
    return;
  }
    
      // Additional code for your form or page functionality
    
    

  // Block access if user is not a recipient
  if (user_type.toLowerCase() !== 'recipient') {
    alert('Access Denied! Only recipients can access this form.');
    window.location.href = 'dashboard.html';
    return;
  }

  // Check if recipient already submitted their details
  try {
    const checkRes = await fetch(`/api/recipients/check?user_id=${user_id}`, {
      headers: {
        Authorization: 'Bearer ' + token
      }
    });

    const checkData = await checkRes.json();

    if (checkRes.ok && checkData.exists) {
      form.style.display = 'none';
      messageDiv.innerHTML = `<div class="alert alert-info text-center">You have already submitted your recipient information.</div>`;
      return;
    }
  } catch (error) {
    console.error('Error checking recipient existence:', error);
    messageDiv.innerHTML = `<div class="alert alert-danger">Error checking recipient status.</div>`;
    return;
  }

  // Submit Recipient Form
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const organization_name = document.getElementById('organization_name').value.trim();
      const contact_person = document.getElementById('contact_person').value.trim();
      const email = document.getElementById('email').value.trim();
      const phone = document.getElementById('phone').value.trim();
      const address = document.getElementById('address').value.trim();

      if (!organization_name || !contact_person || !email || !phone || !address) {
        messageDiv.innerHTML = `<div class="alert alert-warning">Please fill in all fields.</div>`;
        return;
      }

      const recipientData = {
        user_id,
        organization_name,
        contact_person,
        email,
        phone,
        address
      };

      try {
        const response = await fetch('/api/recipients', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(recipientData)
        });

        const result = await response.json();

        if (response.ok) {
          messageDiv.innerHTML =
            `<div class="alert alert-success">${result.message || 'Recipient added successfully!'}</div>`;
          form.reset();
          form.style.display = 'none';
        } else {
          messageDiv.innerHTML =
            `<div class="alert alert-danger">${result.error || 'Failed to add recipient.'}</div>`;
        }

      } catch (err) {
        console.error('Error:', err);
        messageDiv.innerHTML =
          `<div class="alert alert-danger">An error occurred. Please try again.</div>`;
      }
    });
  }
});
