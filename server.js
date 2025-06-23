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

app.use(express.static(path.join(__dirname, "frontend", "build")));
// Express 5 with path-to-regexp >=8 rejects the bare "*" pattern.
// Use a catch-all path to serve the React build for any unknown route.
app.get("/*", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "build", "index.html"));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
