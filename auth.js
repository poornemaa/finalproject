// Forgot Password
if (document.getElementById('forgotPasswordForm')) {
    document.getElementById('forgotPasswordForm').addEventListener('submit', async function (e) {
      e.preventDefault();
  
      const email = document.getElementById('email').value;
  
      try {
        const response = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
  
        const data = await response.json();
        document.getElementById('message').innerHTML = response.ok 
          ? `<div class="alert alert-success">${data.message}</div>`
          : `<div class="alert alert-danger">${data.error}</div>`;
  
      } catch (error) {
        console.error('Error:', error);
      }
    });
  }
  
  // Reset Password
  if (document.getElementById('resetPasswordForm')) {
    document.getElementById('resetPasswordForm').addEventListener('submit', async function (e) {
      e.preventDefault();
  
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      const newPassword = document.getElementById('newPassword').value;
  
      try {
        const response = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, newPassword })
        });
  
        const data = await response.json();
        document.getElementById('message').innerHTML = response.ok
          ? `<div class="alert alert-success">${data.message}</div>`
          : `<div class="alert alert-danger">${data.error}</div>`;
  
        if (response.ok) {
          setTimeout(() => {
            window.location.href = '/';
          }, 2000);
        }
  
      } catch (error) {
        console.error('Error:', error);
      }
    });
  }
  //register
  const registerForm = document.getElementById('registerForm');
  if (registerForm) { 
    document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();  // ✨ Prevent page refresh

    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const user_type= document.getElementById('user_type').value;

    try {
        const res = await fetch('/api/auth/register', {

            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password, user_type })
        });

        const data = await res.json();

        if (res.ok) {
            alert('Registered successfully!');
            // Optionally redirect
            window.location.href = '/index.html';
        } else {
            alert('Registration failed: ' + data.error);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred.');
    }
});
  }
//login  


document.getElementById('userLoginForm').addEventListener('submit', async function(e) {
  e.preventDefault();

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });

    const result = await response.json();

    if (response.ok) {
      // 🔥 Save token and user info in localStorage
      localStorage.setItem('token', result.token);
      localStorage.setItem('user_id', result.user_id);
      localStorage.setItem('username', result.username);
      localStorage.setItem('user_type', result.user_type);

      alert('Login successful!');
      window.location.href = 'dashboard.html'; // Go to dashboard
    } else {
      alert(result.error || 'Login failed!');
    }
  } catch (error) {
    console.error('Login error:', error);
    alert('Login error. Check console.');
  }
});

//admin login
document.getElementById('adminLoginForm').addEventListener('submit', async function(e) {
  e.preventDefault();

  const username = document.getElementById('adminUsername').value.trim();
  const password = document.getElementById('adminPassword').value.trim();

  try {
    const response = await fetch('/api/auth/admin-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const text = await response.text(); // get raw text first

    let result;
    try {
      result = JSON.parse(text); // safely parse JSON
    } catch (err) {
      console.error('Admin Login - Response is not JSON:', text);
      alert('Invalid response from server.');
      return;
    }

    if (response.ok) {
      localStorage.setItem('admin_token', result.token);
      localStorage.setItem('admin_id', result.admin_id);
      localStorage.setItem('admin_username', result.username);

      alert('Admin login successful!');
      window.location.href = 'admin-panel.html';
    } else {
      alert(result.error || 'Admin Login failed!');
    }
  } catch (error) {
    console.error('Admin Login error:', error);
    alert('Login error.');
  }
});





