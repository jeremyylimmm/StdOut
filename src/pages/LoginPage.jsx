import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "../lib/AppStateContext";

function LoginPage() {
  const [mode, setMode] = useState("login"); // 'login' or 'signup'
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, user } = useAppState();

  const API_BASE = "http://localhost:3001/api/auth";

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/interview/setup");
    }
  }, [user, navigate]);

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

      // Store token in localStorage for 1 hour persistence
      localStorage.setItem("authToken", data.token);
      localStorage.setItem("userId", data.userId);
      localStorage.setItem("username", data.username);

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

      // Store token in localStorage for 1 hour persistence
      localStorage.setItem("authToken", data.token);
      localStorage.setItem("userId", data.userId);
      localStorage.setItem("username", username);

      navigate("/interview/setup");
    } catch (err) {
      setError("Failed to connect to server. Is it running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="page narrow">
      <div
        className="card"
        style={{
          maxWidth: "420px",
          margin: "0 auto",
          padding: "2.5rem 2rem",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1 style={{ margin: "0 0 0.5rem 0", fontSize: "1.8em" }}>
            {mode === "login" ? "Welcome Back" : "Create Account"}
          </h1>
          <p style={{ margin: "0", opacity: 0.7, fontSize: "0.95em" }}>
            {mode === "login"
              ? "Login to continue practicing interviews"
              : "Join to start practicing technical interviews"}
          </p>
        </div>

        {error && (
          <div
            style={{
              color: "#fff",
              backgroundColor: "#ff6b6b",
              padding: "0.75rem 1rem",
              borderRadius: "0.5rem",
              marginBottom: "1rem",
              fontSize: "0.9rem",
            }}
          >
            {error}
          </div>
        )}

        <form
          onSubmit={mode === "login" ? handleLogin : handleSignup}
          className="stack"
          style={{ gap: "1.25rem" }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <label
              htmlFor="username"
              style={{
                fontWeight: "600",
                fontSize: "0.9rem",
              }}
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Enter username"
              required
              disabled={loading}
              style={{
                padding: "0.8rem 1rem",
                border: "1.5px solid var(--color-border, #e0e0e0)",
                borderRadius: "0.6rem",
                fontSize: "1rem",
                transition: "border-color 0.2s",
                backgroundColor: "var(--color-input-bg, #fafafa)",
                color: "var(--color-text, #000)",
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--color-primary, #007bff)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--color-border, #e0e0e0)")}
            />
            {mode === "signup" && username && username.length < 3 && (
              <small style={{ color: "#ff6b6b", fontSize: "0.85rem" }}>
                ✗ Must be at least 3 characters ({username.length}/3)
              </small>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <label
              htmlFor="password"
              style={{
                fontWeight: "600",
                fontSize: "0.9rem",
              }}
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter password"
              required
              disabled={loading}
              style={{
                padding: "0.8rem 1rem",
                border: "1.5px solid var(--color-border, #e0e0e0)",
                borderRadius: "0.6rem",
                fontSize: "1rem",
                transition: "border-color 0.2s",
                backgroundColor: "var(--color-input-bg, #fafafa)",
                color: "var(--color-text, #000)",
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--color-primary, #007bff)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--color-border, #e0e0e0)")}
            />
            {mode === "signup" && password && password.length < 6 && (
              <small style={{ color: "#ff6b6b", fontSize: "0.85rem" }}>
                ✗ Must be at least 6 characters ({password.length}/6)
              </small>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "0.9rem 1rem",
              marginTop: "0.5rem",
              fontSize: "1rem",
              fontWeight: "600",
              backgroundColor: loading ? "var(--color-border, #ccc)" : "var(--color-primary, #007bff)",
              color: "#fff",
              border: "none",
              borderRadius: "0.6rem",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "background-color 0.2s",
              opacity: loading ? 0.7 : 1,
            }}
            onMouseOver={(e) => !loading && (e.target.style.backgroundColor = "var(--color-primary-hover, #0056b3)")}
            onMouseOut={(e) => !loading && (e.target.style.backgroundColor = "var(--color-primary, #007bff)")}
          >
            {loading ? "Loading..." : mode === "login" ? "Login" : "Sign Up"}
          </button>
        </form>

        <div style={{ marginTop: "1.5rem", textAlign: "center", borderTop: "1px solid var(--color-border, #e0e0e0)", paddingTop: "1.5rem" }}>
          <p style={{ margin: "0 0 0.5rem 0", fontSize: "0.9rem", opacity: 0.7 }}>
            {mode === "login" ? "Don't have an account?" : "Already have an account?"}
          </p>
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
              color: "var(--color-primary, #007bff)",
              cursor: "pointer",
              textDecoration: "underline",
              fontSize: "0.95rem",
              fontWeight: "600",
              padding: "0",
              transition: "color 0.2s"
            }}
            onMouseOver={(e) => (e.target.style.color = "var(--color-primary-hover, #0056b3)")}
            onMouseOut={(e) => (e.target.style.color = "var(--color-primary, #007bff)")}
          >
            {mode === "login" ? "Sign up" : "Login"}
          </button>
        </div>
      </div>
    </section>
  );
}

export default LoginPage;
