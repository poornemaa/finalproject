document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  if (!token) {
    alert("Not logged in");
    window.location.href = '/index.html';
    return;
  }

  fetch('/api/profile', {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer ' + token
    }
  })
  .then(response => {
    if (!response.ok) throw new Error("Failed to fetch profile");
    return response.json();
  })
  .then(data => {
    if (data.success) {
      const profile = data.profile;
      document.getElementById('orgName').textContent = profile.organization_name;
      document.getElementById('contactPerson').textContent = profile.contact_person;
      document.getElementById('email').textContent = profile.email;
      document.getElementById('phone').textContent = profile.phone;
      document.getElementById('address').textContent = profile.address;
      document.getElementById('createdAt').textContent = new Date(profile.created_at).toLocaleString();
    } else {
      alert("Profile not found.");
    }
  })
  .catch(err => {
    console.error("Error loading profile:", err);
    alert("An error occurred while fetching profile.");
  });
});
