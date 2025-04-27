document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');

  if (!token) {
    alert('Please log in to view donations.');
    window.location.href = '/index.html';
    return;
  }

  let currentUserType = null;

  
  

  // ✅ Step 1: Fetch current user info
  fetch('/api/users/me', {
    headers: {
      'Authorization': 'Bearer ' + token
    }
  })
    .then(res => res.json())
    .then(user => {
      currentUserType = user.user_type;
      loadDonations(currentUserType);
    })
    .catch(() => {
      alert('Unable to fetch user details.');
      window.location.href = '/index.html';
    });

  // ✅ Step 2: Load donations
  function loadDonations(userType) {
    const tableBody = document.getElementById('donationsTable');
    const messageBox = document.getElementById('message');

    fetch('/api/donations/available')
      .then(res => res.json())
      .then(donations => {
        tableBody.innerHTML = '';

        donations.forEach(d => {
          const row = document.createElement('tr');
          row.innerHTML = `
  <td>${d.food_name}</td>
  <td>${d.food_description}</td>
  <td>${d.quantity}</td>
  <td><img src="${d.food_image}" alt="Food Image" width="60"></td>
  <td>${d.donor_name}</td>
  <td>${d.donor_address}</td>
  <td>${d.phone || 'Not Provided'}</td>
  <td>${d.donor_email || 'Not Provided'}</td>
  <td>${new Date(d.created_at).toLocaleString()}</td> <!-- ✅ Created At column -->
  <td>
    <button class="btn btn-sm btn-info me-1 info-btn"
      data-id="${d.donation_id}"
      data-food="${d.food_name}"
      data-desc="${d.food_description}"
      data-qty="${d.quantity}"
      data-img="${d.food_image}"
      data-donor="${d.donor_name}"
      data-address="${d.donor_address}"
      data-phone="${d.phone || 'Not Provided'}"
      data-email="${d.donor_email || 'Not Provided'}"
      data-created="${new Date(d.created_at).toLocaleString()}"> <!-- ✅ Pass created_at in View Info -->
      View Info
    </button>
    ${
      userType?.toLowerCase() === 'recipient'
        ? `<button class="btn btn-sm btn-success order-btn" data-id="${d.donation_id}">Order</button>`
        : `<button class="btn btn-sm btn-secondary" disabled>Only recipients can order</button>`
    }
  </td>
`;

          tableBody.appendChild(row);
        });
        
      })
      .catch(() => {
        messageBox.innerHTML = `<div class="alert alert-danger">Failed to load donations.</div>`;
      });
  }


// ✅ Step 3: Handle order button click
document.addEventListener('click', async (e) => {
  if (e.target.classList.contains('order-btn')) {
    const donation_id = e.target.dataset.id;
    const row = e.target.closest('tr');
    const messageBox = document.getElementById('message');

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ donation_id })
      });
    
      const result = await res.json();
      console.log('Order API response:', res.status, result); // 🧪 LOG RESPONSE
    
      const messageBox = document.getElementById('message');
      messageBox.innerHTML = `<div class="alert alert-${res.ok ? 'success' : 'danger'}">${result.message}</div>`;
    
      if (res.ok) {
        row.style.display = 'none';
      }
    } catch (err) {
      console.error('Error placing order:', err);
      const messageBox = document.getElementById('message');
      messageBox.innerHTML = `<div class="alert alert-danger">Error placing order (network or unexpected error).</div>`;
    }
  }
}); 


  // Modal Info Viewer
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('info-btn')) {
      const btn = e.target;

      const content = `
  <div class="row">
    <div class="col-md-4">
      <img src="${btn.dataset.img}" class="img-fluid rounded border" alt="Food Image">
    </div>
    <div class="col-md-8">
      <h5>${btn.dataset.food}</h5>
      <p><strong>Description:</strong> ${btn.dataset.desc}</p>
      <p><strong>Quantity:</strong> ${btn.dataset.qty}</p>
      <hr>
      <h6>Donor Details</h6>
      <p><strong>Organization:</strong> ${btn.dataset.donor}</p>
      <p><strong>Address:</strong> ${btn.dataset.address}</p>
      <p><strong>Phone:</strong> ${btn.dataset.phone}</p>
      <p><strong>Email:</strong> ${btn.dataset.email}</p> <!-- ✅ NEW -->
    </div>
  </div>
`;


      document.getElementById('modalBodyContent').innerHTML = content;

      const modal = new bootstrap.Modal(document.getElementById('infoModal'));
      modal.show();
    }
  });
});