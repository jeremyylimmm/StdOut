import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "../lib/AppStateContext";

function LoginPage() {
  const [mode, setMode] = useState("login"); // 'login' or 'signup'
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAppState();

  const API_BASE = "http://localhost:3001/api/auth";

  const validateForm = () => {
    if (!username.trim()) {
      setError("Username is required");
      return false;
    }

    if (!password) {
      setError("Password is required");
      return false;
    }

    if (mode === "signup") {
      if (username.length < 3) {
        setError("Username must be at least 3 characters");
        return false;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters");
        return false;
      }
    }

    return true;
  };

  const handleLogin = async (event) => {
    event.preventDefault();

    if (!validateForm()) return;

    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Login failed");
        return;
      }

      // Login to app context
      login(data.username, data.userId);
      navigate("/interview/setup");
    } catch (err) {
      setError("Failed to connect to server. Is it running?");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (event) => {
    event.preventDefault();

    if (!validateForm()) return;

    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Signup failed");
        return;
      }

      // Auto-login after signup
      login(username, data.userId);
      navigate("/interview/setup");
    } catch (err) {
      setError("Failed to connect to server. Is it running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="page narrow">
      <div className="card">
        <h1>{mode === "login" ? "Login" : "Sign Up"}</h1>
        <p>
          {mode === "login"
            ? "Login with your credentials to enter the interview simulator."
            : "Create an account to get started with the interview simulator."}
        </p>

        {error && (
          <div style={{ color: "red", marginBottom: "1rem" }}>{error}</div>
        )}

        <form
          onSubmit={mode === "login" ? handleLogin : handleSignup}
          className="stack"
        >
          <div>
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Enter username"
              required
              disabled={loading}
            />
            {mode === "signup" && username && username.length < 3 && (
              <small style={{ color: "#ff6b6b", display: "block", marginTop: "0.25rem" }}>
                Username must be at least 3 characters ({username.length}/3)
              </small>
            )}
          </div>

          <div>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter password"
              required
              disabled={loading}
            />
            {mode === "signup" && password && password.length < 6 && (
              <small style={{ color: "#ff6b6b", display: "block", marginTop: "0.25rem" }}>
                Password must be at least 6 characters ({password.length}/6)
              </small>
            )}
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Loading..." : mode === "login" ? "Login" : "Sign Up"}
          </button>
        </form>

        <div style={{ marginTop: "1rem", textAlign: "center" }}>
          <p>
            {mode === "login"
              ? "Don't have an account? "
              : "Already have an account? "}
            <button
              type="button"
              onClick={() => {
                setMode(mode === "login" ? "signup" : "login");
                setError("");
                setUsername("");
                setPassword("");
              }}
              style={{
                background: "none",
                border: "none",
                color: "var(--color-primary, blue)",
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              {mode === "login" ? "Sign up" : "Login"}
            </button>
          </p>
        </div>
      </div>
    </section>
  );
}

export default LoginPage;
