document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  const tableBody = document.getElementById('ordersTableBody'); // This targets <tbody>
  const messageBox = document.getElementById('message');

  if (!token) {
    alert('Please log in.');
    window.location.href = '/index.html';
    return;
  }

  
  fetch('/api/orders', {
    headers: {
      'Authorization': 'Bearer ' + token
    }
  })
    .then(res => res.json())
    .then(data => {
      if (Array.isArray(data) && data.length > 0) {
        data.forEach(order => {
          const row = document.createElement('tr');
          row.innerHTML = `
            <td>${order.food_name}</td>
            <td>${order.quantity}</td>
            <td>${order.donor_name} (${order.donor_email})</td>
            <td>${order.donor_address}</td>
            <td>${order.recipient_name}</td>
            <td>${new Date(order.order_date).toLocaleString()}</td>
          `;
          tableBody.appendChild(row);
        });
      } else {
        messageBox.innerHTML = `<div class="alert alert-warning text-center">No orders found.Only recipients can view their orders.</div>`;
      }
    })
    .catch(err => {
      console.error(err);
      messageBox.innerHTML = `<div class="alert alert-danger">Error loading orders.</div>`;
    });
});
