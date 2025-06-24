require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const User = require("./models/User");
const bcrypt = require("bcryptjs");
const path = require("path");

// Connect to MongoDB
connectDB();

// Create default admin user when it doesn't exist
async function ensureAdmin() {
  const existing = await User.findOne({ username: "admin" });
  if (!existing) {
    const hashed = await bcrypt.hash("password", 10);
    await User.create({
      email: "admin@example.com",
      firstName: "Admin",
      lastName: "User",
      username: "admin",
      password: hashed,
    });
    console.log("Default admin user created");
  }
}
ensureAdmin();

const app = express();
const corsOptions = {
  origin: process.env.CLIENT_ORIGIN || "http://localhost:3000",
};
app.use(cors(corsOptions));
app.use(express.json());

// Static uploads folder
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/photos", require("./routes/photos"));

// Start the server
// Allow BACKEND_PORT to override PORT so the frontend proxy can be configured
// independently. Default to 5000 if neither is set.
const PORT = process.env.BACKEND_PORT || process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
