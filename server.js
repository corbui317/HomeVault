require("dotenv").config({ path: "./backend/.env" });
const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./backend/config/db");
const bcrypt = require("bcryptjs");
const User = require("./backend/models/User");

const app = express();
connectDB();

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

const corsOptions = {
  origin: process.env.CLIENT_ORIGIN || "http://localhost:3000",
};
app.use(cors(corsOptions));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/auth", require("./backend/routes/auth"));
app.use("/api/photos", require("./backend/routes/photos"));
app.use("/api/albums", require("./backend/routes/albums"));

app.use(express.static(path.join(__dirname, "frontend", "build")));
// Express 5 with path-to-regexp >=8 rejects the bare "*" pattern.
// Use a catch-all path to serve the React build for any unknown route.
app.get("/*", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "build", "index.html"));
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    version: process.env.npm_package_version || "1.0.0"
  });
});

// Respect BACKEND_PORT for consistency with the frontend dev proxy. Fall back
// to PORT and then 5000.
const PORT = process.env.BACKEND_PORT || process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
