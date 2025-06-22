import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../Login.css";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showRegister, setShowRegister] = useState(false);
  const [regData, setRegData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    username: "",
    password: "",
  });
  const [regMessage, setRegMessage] = useState("");
  const [usernameError, setUsernameError] = useState(false);  
  const navigate = useNavigate();

    const usernameRegex = /^[A-Za-z0-9_-]+$/;

  function handleRegChange(field, value) {
    setRegData((prev) => ({ ...prev, [field]: value }));
    if (field === "username") {
      if (value === "" || usernameRegex.test(value)) {
        setUsernameError(false);
      } else {
        setUsernameError(true);
      }
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    if (usernameError || !usernameRegex.test(regData.username)) {
      setUsernameError(true);
      return;
    }
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(regData),
      });
      const data = await res.json();
      if (res.ok) {
        setRegMessage("User created! You can now log in.");
      } else {
        setRegMessage(data.message || "Registration failed");
      }
    } catch (err) {
      console.error(err);
      setRegMessage("Registration failed");
    }
  }
const [error, setError] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    if (!username) {
      setError(true);
      return;
    }
    setError(false);    
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.token) {
        localStorage.setItem("token", data.token);
        navigate("/dashboard");
      }
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <h1 className="title">Sign in</h1>
        <p className="subtitle">to continue to HomeVault</p>
        <form className="login-form" onSubmit={handleLogin}>
          <input
            className={error ? "error" : ""}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Email or phone"
          />
          {error && (
            <div className="error-msg">Enter an email or phone number</div>
          )}
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
          />
          <div className="link" style={{ marginBottom: "16px" }}>Forgot email?</div>
          <div className="actions">
            <button
              type="button"
              className="link"
              onClick={() => setShowRegister(true)}
            >
              Create account
            </button>
            <button type="submit" className="next-btn">
              Next
            </button>
          </div>
        </form>
        <div className="language-selector">English (United States)</div>
      </div>
      
      {showRegister && (
        <div className="register-modal">
          <form className="register-form" onSubmit={handleRegister}>
            <h2>Register</h2>
            <input
              value={regData.email}
              onChange={(e) => handleRegChange("email", e.target.value)}
              placeholder="Email"
            />
            <input
              value={regData.firstName}
              onChange={(e) => handleRegChange("firstName", e.target.value)}
              placeholder="First Name"
            />
            <input
              value={regData.lastName}
              onChange={(e) => handleRegChange("lastName", e.target.value)}
              placeholder="Last Name"
            />
            <input
              className={usernameError ? "invalid" : ""}
              value={regData.username}
              onChange={(e) => handleRegChange("username", e.target.value)}
              placeholder="Username"
            />
            {usernameError && (
              <div className="error-msg">
                Username may only contain letters, numbers, dashes and underscores.
              </div>
            )}
            <input
              type="password"
              value={regData.password}
              onChange={(e) => handleRegChange("password", e.target.value)}
              placeholder="Password"
            />
            <button type="submit">Submit</button>
            <button type="button" onClick={() => {setShowRegister(false); setRegMessage("");}}>
              Close
            </button>
            {regMessage && <div className="success-msg">{regMessage}</div>}
          </form>
        </div>
      )}
    </div>
  );
}