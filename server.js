// Import modules
const express = require('express');
const mysql = require('mysql');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const multer = require('multer');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');


// Initialize app
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));



app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.use(express.static('public'));

// Database Connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Poorne@10_04',
  database: 'food_waste_management'
});

db.connect((err) => {
  if (err) throw err;
  console.log('MySQL Connected...');
});

// JWT Secret
const JWT_SECRET = 'your_secret_key';

// Verify Token Middleware
function verifyToken(req, res, next) {
  const token = req.headers['authorization'];

  if (!token) {
    return res.status(403).json({ error: 'Token is required.' });
  }

  const tokenWithoutBearer = token.split(' ')[1];

  jwt.verify(tokenWithoutBearer, JWT_SECRET, (err, decoded) => {
    if (err) {
      console.error('Token Error:', err);
      return res.status(401).json({ error: 'Invalid token.' });
    }

    req.user = decoded;
    next();
  });
}

// Multer setup for file uploads
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });



// Routes
const api = express.Router();

// ---------------- AUTH ----------------

// Register

api.post('/auth/register', (req, res) => {
  const { username, email, password, user_type } = req.body;

  console.log('Received registration data:', req.body);

  if (!username || !email || !password || !user_type) {
      return res.status(400).json({ error: 'Please provide all required fields.' });
  }

  // 🔥 Hash the password here
  const hashedPassword = bcrypt.hashSync(password, 8); // 8 is salt rounds (secure)

  const sql = 'INSERT INTO users (username, email, password, user_type) VALUES (?, ?, ?, ?)';
  db.query(sql, [username, email, hashedPassword, user_type], (err, result) => {
      if (err) {
          console.error('Error inserting user:', err);
          return res.status(500).json({ error: 'Database error' });
      }
      res.status(201).json({ message: 'User registered successfully' });
  });
});


// Login
api.post('/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  db.query('SELECT * FROM users WHERE username = ?', [username], (err, users) => {
    if (err) return res.status(500).json({ error: 'Login error.' });
    if (users.length === 0) return res.status(404).json({ error: 'User not found.' });

    const user = users[0];
    const isMatch = bcrypt.compareSync(password, user.password); // compare bcrypt hash

    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials.' });

    const token = jwt.sign({ id: user.user_id, username: user.username, user_type: user.user_type }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user_id: user.user_id, username: user.username, user_type: user.user_type });
  });
});

//admin login
api.post('/auth/admin-login', (req, res) => {
  const { username, password } = req.body;

  // Assuming your admins are stored in a separate "admins" table
  db.query('SELECT * FROM admins WHERE username = ?', [username], (err, admins) => {
    if (err) return res.status(500).json({ error: 'Admin login error.' });
    if (admins.length === 0) return res.status(404).json({ error: 'Admin not found.' });

    const admin = admins[0];
    const isMatch = bcrypt.compareSync(password, admin.password); // bcrypt check

    if (!isMatch) return res.status(401).json({ error: 'Invalid admin credentials.' });

    const token = jwt.sign({ id: admin.admin_id, username: admin.username, role: 'admin' }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, admin_id: admin.admin_id, username: admin.username, role: 'admin' });
  });
});

// Forgot Password
api.post('/auth/forgot-password', (req, res) => {
  const { email } = req.body;
  db.query('SELECT * FROM users WHERE email = ?', [email], (err, users) => {
    if (err || users.length === 0) return res.status(404).json({ error: 'User not found.' });

    const token = jwt.sign({ id: users[0].user_id }, JWT_SECRET, { expiresIn: '15m' });
    const resetLink = `http://localhost:8080/reset-password.html?token=${token}`;

    const mailOptions = {
      from: 'your-email@gmail.com',
      to: email,
      subject: 'Password Reset Request',
      text: `Click the link to reset your password: ${resetLink}`
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) return res.status(500).json({ error: 'Error sending email.' });
      res.json({ message: 'Password reset email sent.' });
    });
  });
});

// Reset Password
api.post('/auth/reset-password', (req, res) => {
  const { token, newPassword } = req.body;

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(400).json({ error: 'Invalid or expired token.' });

    const hashedPassword = bcrypt.hashSync(newPassword, 8);
    db.query('UPDATE users SET password = ? WHERE user_id = ?', [hashedPassword, decoded.id], (err, result) => {
      if (err) return res.status(500).json({ error: 'Database error.' });
      res.json({ message: 'Password updated successfully.' });
    });
  });
});

// Nodemailer Configuration
const transporter = nodemailer.createTransport({
  service: 'gmail', // Use your email service (e.g., Gmail, Outlook)
  auth: {
    user: process.env.EMAIL_USER || 'pavithra2744@gmail.com', // Your email
    pass: process.env.EMAIL_PASSWORD || 'kzrq blhi cprf sukt' // Your email password
  }
});


// ---------------- USERS ----------------
//user /me api code

api.get('/users/me', verifyToken, (req, res) => {
  const userId = req.user.id;

  const query = 'SELECT user_id, username, user_type FROM users WHERE user_id = ?';

  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Error fetching user info:', err);
      return res.status(500).json({ message: 'Server error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = results[0];
    res.json(user);
  });
});


// ---------------- DONORS ----------------

api.post('/donors', verifyToken, (req, res) => {
  const { user_id, organization_name, contact_person, email, phone, address } = req.body;

  // Validate input
  if (!user_id || !organization_name || !contact_person || !email || !phone || !address) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  const sql = `
    INSERT INTO donors (user_id, organization_name, contact_person, email, phone, address)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  const values = [user_id, organization_name, contact_person, email, phone, address];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error('Error inserting donor:', err);
      return res.status(500).json({ error: 'Database error while adding donor.' });
    }

    res.status(201).json({ message: 'Donor added successfully!' });
  });
});

api.get('/donors', verifyToken, (req, res) => {
  const sql = `SELECT donor_id, organization_name, contact_person, email, phone, address FROM donors`;

  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching donors:', err);
      return res.status(500).json({ error: 'Database error.' });
    }
    res.json(results);
  });
});
//another get method to check condition

// Check if donor already exists for current user
api.get('/donors/check', verifyToken, (req, res) => {
  const { user_id } = req.query;
  if (!user_id) {
    return res.status(400).json({ error: 'User ID is required.' });
  }

  const sql = 'SELECT donor_id FROM donors WHERE user_id = ?';
  db.query(sql, [user_id], (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });

    res.json({ exists: results.length > 0 });
  });
});

// Get donor details by user_id
api.get('/api/donor/user/:userId', (req, res) => {
  const userId = req.params.userId;
  const sql = `
    SELECT donor_id, organization_name, contact_person, email, phone, address
    FROM donors WHERE user_id = ?
  `;
  db.query(sql, [userId], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });
    if (results.length === 0) return res.status(404).json({ message: 'Donor not found' });
    res.json(results[0]);
  });
});

// ---------------- RECIPIENTS ----------------

api.post('/recipients', verifyToken, (req, res) => {
  const { user_id, organization_name, contact_person, email, phone, address } = req.body;

  if (!user_id || !organization_name || !contact_person || !email || !phone || !address) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  const sql = `
    INSERT INTO recipients (user_id, organization_name, contact_person, email, phone, address)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [user_id, organization_name, contact_person, email, phone, address], (err, result) => {
    if (err) {
      console.error('DB Error:', err);
      return res.status(500).json({ error: 'Database error while adding recipient.' });
    }

    res.status(201).json({ message: 'Recipient added successfully!' });
  });
});

//another get method for condition
api.get('/recipients', verifyToken, (req, res) => {
  const sql = `SELECT recipient_id, organization_name, contact_person, email, phone, address FROM recipients`;

  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching recipients:', err);
      return res.status(500).json({ error: 'Database error.' });
    }
    res.json(results);
  });
});

api.get('/recipients/check', verifyToken, (req, res) => {
  const { user_id } = req.query;

  if (!user_id) {
    return res.status(400).json({ error: 'User ID is required.' });
  }

  const sql = 'SELECT recipient_id FROM recipients WHERE user_id = ?';
  db.query(sql, [user_id], (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });

    res.json({ exists: results.length > 0 });
  });
});


// ---------------- FOOD DONATIONS ----------------

//post method
// Required: multer, db, verifyToken already configured

api.post('/donations', verifyToken, upload.single('food_image'), (req, res) => {
  const { food_name, food_description, quantity } = req.body;
  const user_id = req.user.id; // From JWT

  if (!food_name || !quantity || !req.file) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const food_image = `/uploads/${req.file.filename}`;

  // First: Get donor_id from user_id
  const getDonorQuery = `SELECT donor_id FROM donors WHERE user_id = ?`;
  db.query(getDonorQuery, [user_id], (err, donorResult) => {
    if (err) return res.status(500).json({ message: 'Error fetching donor ID' });

    if (donorResult.length === 0) {
      return res.status(400).json({ message: 'No donor profile found for this user' });
    }

    const donor_id = donorResult[0].donor_id;
    
    const user_type = req.user.user_type;
if (user_type !== 'donor') {
  return res.status(403).json({ message: 'Only donors can add donations.' });
}

    // Then: Insert donation
    const insertQuery = `
      INSERT INTO food_donations (donor_id, food_name, food_description, food_image, quantity)
      VALUES (?, ?, ?, ?, ?)
    `;

    db.query(insertQuery, [donor_id, food_name, food_description, food_image, quantity], (err, result) => {
      if (err) {
        console.error('Insert error:', err);
        return res.status(500).json({ message: 'Database insert failed' });
      }

      return res.status(201).json({ message: 'Donation submitted successfully!' });
    });
  });
});


// GET - Fetch all donations


api.get('/donations', verifyToken, (req, res) => {
  const user_id = req.user.id;

  const sql = `
    SELECT d.donation_id, d.food_name, d.food_description, d.quantity, d.food_image,
           d.created_at,   -- ✅ Added this line
           donors.organization_name AS donor_name,
           donors.address AS donor_address,
           donors.phone AS phone,
           donors.email AS donor_email
    FROM food_donations d
    JOIN donors ON d.donor_id = donors.donor_id
    WHERE donors.user_id = ?
    ORDER BY d.created_at DESC
  `;

  db.query(sql, [user_id], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Database error' });
    }
    res.json(results);
  });
});



//another get method

api.get('/donations/available', (req, res) => {
  const query = `
    SELECT d.donation_id, d.food_name, d.food_description, d.quantity, d.food_image,
           d.created_at,   -- Added created_at
           donors.organization_name AS donor_name,
           donors.address AS donor_address,
           donors.phone AS phone,
           donors.email AS donor_email
    FROM food_donations d
    JOIN donors ON d.donor_id = donors.donor_id
    WHERE d.status = 'available'
      AND d.created_at >= NOW() - INTERVAL 1 DAY  -- Filter donations older than 1 day
    ORDER BY d.created_at DESC   -- Optional: show latest available donations first
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Database error' });
    }
    res.json(results);  // Return only the donations created in the last 24 hours
  });
});

//delete food donations automatically after 1 day

// Schedule a cron job to run every hour
cron.schedule('0 * * * *', () => {
  console.log('Running scheduled task to delete expired donations...');
  
  const query = `
    DELETE FROM food_donations
    WHERE created_at < NOW() - INTERVAL 1 DAY
      AND status = 'available';  -- Optional: Only delete available ones (if needed)
  `;
  
  db.query(query, (err, result) => {
    if (err) {
      console.error('Error deleting expired donations:', err);
      return;
    }
    console.log('Expired donations deleted:', result.affectedRows);
  });
});


// PUT - Update donation
api.put('/donations/:id', verifyToken, (req, res) => {
  const { food_name, food_description, quantity } = req.body;
  const { id } = req.params;
  const sql = `UPDATE food_donations SET food_name=?, food_description=?, quantity=? WHERE donation_id=?`;
  db.query(sql, [food_name, food_description, quantity, id], (err) => {
    if (err) return res.status(500).json({ error: 'Failed to update' });
    res.json({ message: 'Donation updated' });
  });
});

// DELETE - Delete donation
api.delete('/donations/:id', verifyToken, (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM food_donations WHERE donation_id=?', [id], (err) => {
    if (err) return res.status(500).json({ error: 'Failed to delete' });
    res.json({ message: 'Donation deleted' });
  });
});


// ---------------- FOOD ORDERS ----------------

// API route to handle placing an order
api.post('/orders', verifyToken, (req, res) => {
  const { id: userId, user_type: userType } = req.user;
  const { donation_id } = req.body;

  if (userType !== 'recipient') {
    return res.status(403).json({ message: 'Only recipients can place orders.' });
  }

  // Step 1: Get recipient info
  db.query('SELECT * FROM recipients WHERE user_id = ?', [userId], (err, recipientResult) => {
    if (err) {
      console.error("Error fetching recipient:", err);
      return res.status(500).json({ message: 'Error fetching recipient details.' });
    }

    if (recipientResult.length === 0) {
      return res.status(404).json({ message: 'Recipient details not found.' });
    }

    const recipientInfo = recipientResult[0]; // Access the first recipient if it's available

    // Step 2: Get donation and donor info
    db.query(`
      SELECT fd.*, d.donor_id, d.organization_name, d.email AS donor_email
      FROM food_donations fd
      JOIN donors d ON fd.donor_id = d.donor_id
      WHERE fd.donation_id = ? AND fd.status = 'available'
    `, [donation_id], (err, donationResult) => {
      if (err) {
        console.error("Error fetching donation:", err);
        return res.status(500).json({ message: 'Error fetching donation details.' });
      }

      if (donationResult.length === 0) {
        return res.status(400).json({ message: 'Loading.....' });
      }

      const donationInfo = donationResult[0]; // Access the first donation

      // Step 3: Insert into food_orders table
      db.query(`
        INSERT INTO food_orders (donation_id, recipient_id, order_date)
        VALUES (?, ?, NOW())
      `, [donation_id, recipientInfo.recipient_id], (err) => {
        if (err) {
          console.error("Error inserting into food_orders:", err);
          return res.status(500).json({ message: 'Error placing order.' });
        }

        // Step 4: Mark donation as unavailable
        db.query('UPDATE food_donations SET status = "unavailable" WHERE donation_id = ?', [donation_id], (err) => {
          if (err) {
            console.error("Error updating donation status:", err);
            return res.status(500).json({ message: 'Error updating donation status.' });
          }

          // Step 5: Send email to donor
          const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: 'pavithra2744@gmail.com',
              pass: 'kzrq blhi cprf sukt' // Gmail App Password
            }
          });

          const mailOptions = {
            from: 'pavithra2744@gmail.com',
            to: donationInfo.donor_email,
            subject: `Your food donation "${donationInfo.food_name}" was ordered!`,
            html: `
              <h3>Hi ${donationInfo.organization_name},</h3>
              <p>Your food donation "<strong>${donationInfo.food_name}</strong>" has been ordered by a recipient. 🎉</p>
              <h4>Recipient Details:</h4>
              <ul>
                <li><strong>Name:</strong> ${recipientInfo.organization_name}</li>
                <li><strong>Email:</strong> ${recipientInfo.email}</li>
                <li><strong>Phone:</strong> ${recipientInfo.phone}</li>
                <li><strong>Address:</strong> ${recipientInfo.address}</li>
              </ul>
              <p>Thank you for contributing to reducing food waste! 🙌</p>
            `
          };

          transporter.sendMail(mailOptions, (err) => {
            if (err) {
              console.error("Error sending email:", err);
              return res.status(500).json({ message: 'Error sending email.' });
            }

            return res.status(200).json({ message: 'Order placed successfully. An email has been sent to the donor.' });
          });
        });
      });
    });
  });
});



module.exports = api;
// get method.
api.get('/orders', verifyToken, (req, res) => {
  const { id: userId, user_type: userType } = req.user;

  if (userType !== 'recipient') {
    return res.status(403).json({ message: 'Only recipients can view their orders.' });
  }

  // Get recipient ID first
  db.query('SELECT recipient_id FROM recipients WHERE user_id = ?', [userId], (err, recipientResult) => {
    if (err) {
      console.error("Error fetching recipient:", err);
      return res.status(500).json({ message: 'Error fetching recipient details.' });
    }

    if (recipientResult.length === 0) {
      return res.status(404).json({ message: 'Recipient details not found.' });
    }

    const recipientId = recipientResult[0].recipient_id;

    // Fetch orders for the recipient
    const sql = `
  SELECT 
    fo.order_id,
    fo.order_date,
    fd.food_name,
    fd.quantity,
    fd.food_description,
    fd.food_image,
    d.organization_name AS donor_name,
    d.email AS donor_email,
    d.address AS donor_address,
    r.organization_name AS recipient_name
  FROM food_orders fo
  JOIN food_donations fd ON fo.donation_id = fd.donation_id
  JOIN donors d ON fd.donor_id = d.donor_id
  JOIN recipients r ON fo.recipient_id = r.recipient_id
  WHERE fo.recipient_id = ?
  ORDER BY fo.order_date DESC
`;


    db.query(sql, [recipientId], (err, results) => {
      if (err) {
        console.error("Error fetching orders:", err);
        return res.status(500).json({ message: 'Error fetching orders.' });
      }

      return res.status(200).json(results);
    });
  });
});


// ---------------- profile api ----------------


// GET /api/profile - Get logged-in donor profile

api.get('/profile', verifyToken, (req, res) => {
  const userId = req.user.id;
  const userType = req.user.user_type;

  let sql = '';
  if (userType === 'donor') {
    sql = `SELECT donor_id AS id, organization_name, contact_person, email, phone, address, created_at 
           FROM donors WHERE user_id = ?`;
  } else if (userType === 'recipient') {
    sql = `SELECT recipient_id AS id, organization_name, contact_person, email, phone, address, created_at 
           FROM recipients WHERE user_id = ?`;
  } else {
    return res.status(400).json({ success: false, message: 'Invalid user type' });
  }

  db.query(sql, [userId], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Database error', error: err });

    if (results.length === 0) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    return res.json({
      success: true,
      user_type: userType,
      profile: results[0]
    });
  });
});

module.exports = api;

//delete account api

api.delete('/delete-account', verifyToken, (req, res) => {
  const userId = req.user.id;
  const userType = req.user.user_type;

  let childTable = '';
  if (userType === 'donor') {
    childTable = 'donors';
  } else if (userType === 'recipient') {
    childTable = 'recipients';
  } else {
    return res.status(400).json({ success: false, message: 'Invalid user type' });
  }

  // Step 1: Delete from child table
  db.query(`DELETE FROM ${childTable} WHERE user_id = ?`, [userId], (err, result1) => {
    if (err) {
      console.error('Error deleting from child table:', err); // 👈 log the actual error
      return res.status(500).json({ success: false, message: 'Error deleting from child table', error: err });
    }

    // Step 2: Delete from users table
    db.query(`DELETE FROM users WHERE user_id = ?`, [userId], (err, result2) => {
      if (err) {
        console.error('Error deleting from users table:', err); // 👈 log the actual error
        return res.status(500).json({ success: false, message: 'Error deleting from users table', error: err });
      }

      if (result2.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      return res.json({ success: true, message: 'Account deleted successfully' });
    });
  });
});


module.exports = api;

//total donations and total orders

api.get('/dashboard-stats', verifyToken, (req, res) => {
  const guestView = req.headers['guest_view'];  // Checking if it's a guest view

  // If it's a guest view (admin viewing as guest), allow access to stats
  if (guestView === 'true') {
    // Don't check for user_type as we don't care about user type in guest view
  } else {
    // Normal authenticated user check (donor or recipient)
    const { user_type } = req.user;
    if (user_type !== 'donor' && user_type !== 'recipient') {
      return res.status(403).json({ message: 'Unauthorized.' });
    }
  }

  // Query total donations and orders
  const donationQuery = 'SELECT COUNT(*) AS totalDonations FROM food_donations';
  const ordersQuery = 'SELECT COUNT(*) AS totalOrders FROM food_orders';

  db.query(donationQuery, (err, donationResult) => {
    if (err) {
      console.error('Error fetching donations count:', err);
      return res.status(500).json({ message: 'Error fetching donations count.' });
    }

    const stats = { totalDonations: donationResult[0].totalDonations };

    db.query(ordersQuery, (err, orderResult) => {
      if (err) {
        console.error('Error fetching orders count:', err);
        return res.status(500).json({ message: 'Error fetching orders count.' });
      }

      stats.totalOrders = orderResult[0].totalOrders;
      return res.status(200).json(stats); // Send stats back to frontend
    });
  });
});



//admin api view-users

api.get('/admin/users', (req, res) => {
  const sql = `
    SELECT
      u.user_id, 
      u.username, 
      u.user_type, 
      COALESCE(d.email, r.email) AS email,
      COALESCE(d.organization_name, r.organization_name) AS organization_name,
      COALESCE(d.phone, r.phone) AS phone,
      COALESCE(d.address, r.address) AS address
    FROM users u
    LEFT JOIN donors d ON u.user_id = d.user_id
    LEFT JOIN recipients r ON u.user_id = r.user_id
    WHERE u.user_type IN ('donor', 'recipient')
  `;

  db.query(sql, (err, result) => {
    if (err) {
      console.error('Error fetching user details:', err);
      return res.status(500).json({ error: 'Failed to fetch users' });
    }
    res.json(result);
  });
});

module.exports = api;

//admin api view-donations

// Get all food donations with organization names
api.get('/admin/food-donations', (req, res) => {
  const query = `
    SELECT 
      d.organization_name,
      fd.food_name,
      fd.food_description,
      fd.quantity,
      fd.status,
      fd.created_at
    FROM food_donations fd
    JOIN donors d ON fd.donor_id = d.donor_id
    ORDER BY fd.created_at DESC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching food donations:', err);
      return res.status(500).json({ error: 'Failed to fetch food donations' });
    }
    res.json(results);
  });
});

//admin view orders

api.get('/admin/food-orders', (req, res) => {
  const query = `
    SELECT 
      r.organization_name AS recipient_organization,
      d.organization_name AS donor_organization,
      fd.food_name,
      fd.quantity,
      fo.status,
      fo.order_date,
      fo.created_at
    FROM food_orders fo
    INNER JOIN food_donations fd ON fo.donation_id = fd.donation_id
    INNER JOIN donors d ON fd.donor_id = d.donor_id
    INNER JOIN recipients r ON fo.recipient_id = r.recipient_id
    ORDER BY fo.created_at DESC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching food orders:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});

//admin add user

api.post('/admin/add-user', async (req, res) => {
  const { username, email, password, user_type } = req.body;

  if (!username || !email || !password || !user_type) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const query = `
      INSERT INTO users (username, email, password, user_type)
      VALUES (?, ?, ?, ?)
    `;

    db.query(query, [username, email, hashedPassword, user_type], (err, result) => {
      if (err) {
        console.error('Error adding user:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ message: 'User added successfully' });
    });
  } catch (err) {
    console.error('Error hashing password:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

//admin delete user api

api.delete('/admin/delete-user/:userId', (req, res) => {
  const userId = req.params.userId;

  const query = `DELETE FROM users WHERE user_id = ?`;

  db.query(query, [userId], (err, result) => {
    if (err) {
      console.error('Error deleting user:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  });
});



// Socket.IO Real-time
io.on('connection', (socket) => {
  console.log('New WebSocket Connection...');

  socket.on('subscribe', (userId) => {
    socket.join(userId);
  });
});

app.get('/', (req, res) => {
  res.send('Server is running!');
});

module.exports = api;
app.use('/api', api);

// Start Server
const PORT = 8080;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
