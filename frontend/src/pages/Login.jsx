import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../Login.css";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showRegister, setShowRegister] = useState(false);
  const [language, setLanguage] = useState("en");  
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

  const translations = {
    en: {
      signIn: "Sign in",
      continue: "to continue to HomeVault",
      emailOrPhone: "Email or phone",
      enterEmail: "Enter an email or phone number",
      password: "Password",
      forgotEmail: "Forgot email?",
      createAccount: "Create account",
      next: "Next",
      register: "Register",
      email: "Email",
      firstName: "First Name",
      lastName: "Last Name",
      username: "Username",
      usernameInvalid:
        "Username may only contain letters, numbers, dashes and underscores.",
      submit: "Submit",
      close: "Close",
      userCreated: "User created! You can now log in.",
      registrationFailed: "Registration failed",
    },
    es: {
      signIn: "Iniciar sesi\u00f3n",
      continue: "para continuar a HomeVault",
      emailOrPhone: "Correo electr\u00f3nico o tel\u00e9fono",
      enterEmail: "Ingrese un correo electr\u00f3nico o n\u00famero de tel\u00e9fono",
      password: "Contrase\u00f1a",
      forgotEmail: "\u00bfOlvidaste el correo electr\u00f3nico?",
      createAccount: "Crear cuenta",
      next: "Siguiente",
      register: "Registrarse",
      email: "Correo electr\u00f3nico",
      firstName: "Nombre",
      lastName: "Apellido",
      username: "Nombre de usuario",
      usernameInvalid:
        "El nombre de usuario solo puede contener letras, n\u00fameros, guiones y guiones bajos.",
      submit: "Enviar",
      close: "Cerrar",
      userCreated: "\u00a1Usuario creado! Ahora puedes iniciar sesi\u00f3n.",
      registrationFailed: "El registro fall\u00f3",
    },
  };

  const t = translations[language];

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
        setRegMessage(t.userCreated);
      } else {
        setRegMessage(data.message || t.registrationFailed);
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
        <h1 className="title">{t.signIn}</h1>
        <p className="subtitle">{t.continue}</p>
        <form className="login-form" onSubmit={handleLogin}>
          <input
            className={error ? "error" : ""}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder={t.emailOrPhone}
          />
          {error && (
            <div className="error-msg">{t.enterEmail}</div>
          )}
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t.password}
          />
          <div className="link" style={{ marginBottom: "16px" }}>{t.forgotEmail}</div>
          <div className="actions">
            <button
              type="button"
              className="link"
              onClick={() => setShowRegister(true)}
            >
              {t.createAccount}
            </button>
            <button type="submit" className="next-btn">
              {t.next}
            </button>
          </div>
        </form>
        <select
          className="language-selector"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
        >
          <option value="en">English</option>
          <option value="es">Espa\u00f1ol</option>
        </select>
      </div>
      
      {showRegister && (
        <div className="register-modal">
          <form className="register-form" onSubmit={handleRegister}>
            <h2>{t.register}</h2>
            <input
              value={regData.email}
              onChange={(e) => handleRegChange("email", e.target.value)}
              placeholder={t.email}
            />
            <input
              value={regData.firstName}
              onChange={(e) => handleRegChange("firstName", e.target.value)}
              placeholder={t.firstName}
            />
            <input
              value={regData.lastName}
              onChange={(e) => handleRegChange("lastName", e.target.value)}
              placeholder={t.lastName}
            />
            <input
              className={usernameError ? "invalid" : ""}
              value={regData.username}
              onChange={(e) => handleRegChange("username", e.target.value)}
              placeholder={t.username}
            />
            {usernameError && (
              <div className="error-msg">
                {t.usernameInvalid}
              </div>
            )}
            <input
              type="password"
              value={regData.password}
              onChange={(e) => handleRegChange("password", e.target.value)}
              placeholder={t.password}
            />
            <button type="submit">{t.submit}</button>
            <button type="button" onClick={() => {setShowRegister(false); setRegMessage("");}}>
              {t.close}
            </button>
            {regMessage && <div className="success-msg">{regMessage}</div>}
          </form>
        </div>
      )}
    </div>
  );
}