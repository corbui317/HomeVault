require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const bcrypt = require('bcryptjs');
const path = require('path');
const User = require('./models/User');

// Connect to MongoDB
connectDB();

// Create default admin user when it doesn't exist
async function ensureAdmin() {
  const existing = await User.findOne({ username: 'admin' });
  if (!existing) {
    const hashed = await bcrypt.hash('password', 10);
    await User.create({
      email: 'admin@example.com',
      firstName: 'Admin',
      lastName: 'User',
      username: 'admin',
      password: hashed,
    });
    console.log('Default admin user created');
  }
}
ensureAdmin();

const app = express();
const corsOptions = {
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
};
app.use(cors(corsOptions));
app.use(express.json());

// Static uploads folder
// Serve uploaded images from the project root rather than the backend folder
// When running the backend directly (e.g. via `npm start` in development)
// the current working directory is `backend`, so `express.static('uploads')`
// would incorrectly look for `backend/uploads`. Use an absolute path so the
// uploads directory at the project root is always served correctly.
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/photos', require('./routes/photos'));

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));