// Load navbar dynamically
fetch('navbar.html')
  .then(res => res.text())
  .then(data => {
    document.getElementById('navbarContainer').innerHTML = data;

     // Attach logout logic after navbar is loaded
     const logoutBtn = document.getElementById('logoutBtn');
     if (logoutBtn) {
       logoutBtn.addEventListener('click', () => {
         localStorage.clear();
         alert('Logged out successfully!');
         window.location.href = '/index.html'; // adjust if needed
       });
     }
  });

// Fetch and display recipient data from backend
document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');

  if (!token) {
    alert('You must be logged in!');
    window.location.href = '/';
    return;
  }
    
  fetch('/api/recipients', {
    headers: {
      'Authorization': 'Bearer ' + token
    }
  })
  .then(res => res.json())
  .then(data => {
    const tbody = document.querySelector('#recipientTable tbody');
    if (Array.isArray(data) && data.length > 0) {
      data.forEach(recipient => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${recipient.recipient_id}</td>
          <td>${recipient.organization_name}</td>
          <td>${recipient.contact_person}</td>
          <td>${recipient.email}</td>
          <td>${recipient.phone}</td>
          <td>${recipient.address}</td>
        `;
        tbody.appendChild(row);
      });
    } else {
      document.getElementById('message').innerHTML =
        `<div class="alert alert-warning text-center">No recipients found.</div>`;
    }
  })
  .catch(error => {
    console.error('Fetch error:', error);
    document.getElementById('message').innerHTML =
      `<div class="alert alert-danger">Error loading recipient data.</div>`;
  });
});
