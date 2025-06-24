import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  auth,
  googleProvider,
  facebookProvider,
  twitterProvider,
} from "../firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import "../Login.css";

function FirebaseLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      let userCredential;
      if (isRegistering) {
        userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        setSuccess("Account created! You can now log in.");
      } else {
        userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
      }
      // Get Firebase ID token and store in localStorage
      const token = await userCredential.user.getIdToken();
      localStorage.setItem("token", token);
      // Redirect to dashboard
      navigate("/dashboard");
    } catch (error) {
      setError(error.message);
      setSuccess("");
      console.error("Auth Error:", error.message);
    }
  };

  const handleProviderSignIn = async (provider) => {
    setError("");
    setSuccess("");
    try {
      const result = await signInWithPopup(auth, provider);
      const token = await result.user.getIdToken();
      localStorage.setItem("token", token);
      navigate("/dashboard");
    } catch (error) {
      setError(error.message);
      setSuccess("");
      console.error("Provider Auth Error:", error.message);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1 className="title">{isRegistering ? "Sign Up" : "Sign in"}</h1>
        <p className="subtitle">to continue to HomeVault</p>
        <form className="login-form" onSubmit={handleSubmit}>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            type="email"
            required
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="Password"
            required
          />
          <div className="actions">
            <button
              type="button"
              className="link"
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError("");
                setSuccess("");
              }}
            >
              {isRegistering ? "Have an account?" : "Create account"}
            </button>
            <button type="submit" className="next-btn">
              {isRegistering ? "Sign Up" : "Next"}
            </button>
          </div>
        </form>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            marginTop: 24,
          }}
        >
          <button
            type="button"
            className="next-btn"
            style={{
              backgroundColor: "#4285F4",
              color: "#fff",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
            onClick={() => handleProviderSignIn(googleProvider)}
          >
            <img
              src="/assets/google-logo.png"
              alt="Google"
              style={{
                width: 24,
                height: 24,
                background: "white",
                borderRadius: "50%",
              }}
            />{" "}
            Sign in with Google
          </button>
          <button
            type="button"
            className="next-btn"
            style={{
              backgroundColor: "#4267B2",
              color: "#fff",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
            onClick={() => handleProviderSignIn(facebookProvider)}
          >
            <img
              src="/assets/facebook-logo.png"
              alt="Facebook"
              style={{
                width: 24,
                height: 24,
                background: "white",
                borderRadius: "50%",
              }}
            />{" "}
            Sign in with Facebook
          </button>
          <button
            type="button"
            className="next-btn"
            style={{
              backgroundColor: "#1DA1F2",
              color: "#fff",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
            onClick={() => handleProviderSignIn(twitterProvider)}
          >
            <img
              src="/assets/twitter-logo.png"
              alt="Twitter"
              style={{
                width: 24,
                height: 24,
                background: "white",
                borderRadius: "50%",
              }}
            />{" "}
            Sign in with Twitter
          </button>
        </div>
        {error && <div className="error-msg">{error}</div>}
        {success && <div className="success-msg">{success}</div>}
      </div>
    </div>
  );
}

export default FirebaseLogin;
