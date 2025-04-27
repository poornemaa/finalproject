document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');

  if (!token) {
    alert('Please login first.');
    window.location.href = '/index.html';
    return;
  }
    
    

  const form = document.getElementById('donationForm');
  const message = document.getElementById('message');

  // CREATE donation
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('food_name', document.getElementById('food_name').value);
    formData.append('food_description', document.getElementById('food_description').value);
    formData.append('quantity', document.getElementById('quantity').value);
    formData.append('food_image', document.getElementById('food_image').files[0]);

    try {
      const res = await fetch('/api/donations', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token },
        body: formData
      });
      const data = await res.json();
      message.innerHTML = `<div class="alert alert-${res.ok ? 'success' : 'danger'}">${data.message}</div>`;
      
      form.reset();
      loadDonations();
    } catch (err) {
      message.innerHTML = `<div class="alert alert-danger">Failed to submit donation.</div>`;
    }
  });

  // READ all donations
  async function loadDonations() {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/donations', {
      headers: { Authorization: 'Bearer ' + token }
    });
    const donations = await res.json();
    const tbody = document.getElementById('donationList');
    tbody.innerHTML = '';

    donations.forEach(d => {
      const row = document.createElement('tr');
row.innerHTML = `
<td><input value="${d.food_name}" class="form-control food_name" /></td>
<td><input value="${d.food_description}" class="form-control food_description" /></td>
<td><input value="${d.quantity}" type="number" class="form-control quantity" /></td>
<td><img src="${d.food_image}" height="50" /></td>
<td>${d.phone || 'N/A'}</td>
<td>${new Date(d.created_at).toLocaleString()}</td> <!-- ✅ Date/Time Column -->
<td>
  <button class="btn btn-sm btn-success update-btn" data-id="${d.donation_id}">Update</button>
  <button class="btn btn-sm btn-danger delete-btn" data-id="${d.donation_id}">Delete</button>
</td>
`;


      tbody.appendChild(row);
    });
  }

  // UPDATE & DELETE
  document.addEventListener('click', async (e) => {
    const id = e.target.dataset.id;

   if (e.target.classList.contains('update-btn')) {
      const row = e.target.closest('tr');
      const updatedData = {
        food_name: row.querySelector('.food_name').value,
        food_description: row.querySelector('.food_description').value,
        quantity: row.querySelector('.quantity').value
      };

      const res = await fetch(`/api/donations/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token
        },
        body: JSON.stringify(updatedData)
      });

      const data = await res.json();
      alert(data.message || 'Updated!');
      loadDonations();
    }

    if (e.target.classList.contains('delete-btn')) {
      if (confirm('Are you sure you want to delete this donation?')) {
        const res = await fetch(`/api/donations/${id}`, {
          method: 'DELETE',
          headers: { Authorization: 'Bearer ' + token }
        });
        const data = await res.json();
        alert(data.message || 'Deleted!');
        loadDonations();
      }
    }
  });

  // Initial load
  loadDonations();
});

