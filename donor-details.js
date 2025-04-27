// Load navbar
fetch('navbar.html')
  .then(res => res.text())
  .then(data => {
    document.getElementById('navbarContainer').innerHTML = data;

    // Attach logout after navbar loads
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        localStorage.clear();
        alert('Logged out successfully!');
        window.location.href = '/index.html'; // adjust path if needed
      });
    }
  })
  .catch(err => {
    console.error('Failed to load navbar:', err);
  });

// Fetch donor data and populate table
document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  if (!token) {
    alert('You must be logged in!');
    window.location.href = '/';
    return;
  }


  fetch('/api/donors', {
    headers: {
      'Authorization': 'Bearer ' + token
    }
  })
  .then(res => res.json())
  .then(data => {
    const tbody = document.querySelector('#donorTable tbody');
    if (Array.isArray(data) && data.length > 0) {
      data.forEach(donor => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${donor.donor_id}</td>
          <td>${donor.organization_name}</td>
          <td>${donor.contact_person}</td>
          <td>${donor.email}</td>
          <td>${donor.phone}</td>
          <td>${donor.address}</td>
        `;
        tbody.appendChild(row);
      });
    } else {
      document.getElementById('message').innerHTML =
        `<div class="alert alert-warning text-center">No donors found.</div>`;
    }
  })
  .catch(error => {
    console.error('Fetch error:', error);
    document.getElementById('message').innerHTML =
      `<div class="alert alert-danger">Error loading donor data.</div>`;
  });
});
