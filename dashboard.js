
document.addEventListener('DOMContentLoaded', () => {
  const username = localStorage.getItem('username');
  const userType = localStorage.getItem('user_type');
  const userId = localStorage.getItem('user_id');
  const token = localStorage.getItem('token');

  if (!token) {
    alert('You must be logged in!');
    window.location.href = '/';
  }

  document.getElementById('welcomeText').innerText = `Welcome, ${username}! You are logged in as ${userType}.`;
});


// Load navbar then attach logout logic
fetch('navbar.html')
  .then(response => response.text())
  .then(data => {
    document.getElementById('navbarContainer').innerHTML = data;

    // ✅ Attach logout button after navbar is loaded
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        localStorage.clear();
        alert('Logged out successfully!');
        window.location.href = '/index.html'; // Change this if needed
      });
    }
  });

  document.addEventListener('DOMContentLoaded', () => {
    fetch('/api/dashboard-stats', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`

      }
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard stats');
        }
        return response.json();
      })
      .then(data => {
        document.getElementById('totalDonations').textContent = data.totalDonations;
        document.getElementById('totalOrders').textContent = data.totalOrders;
      })
      .catch(error => {
        console.error('Error loading stats:', error);
      });
  });
  
  
  