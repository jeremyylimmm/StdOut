import { Link, useNavigate } from "react-router-dom";
import { useAppState } from "../lib/AppStateContext";

function Navbar() {
  const navigate = useNavigate();
  const { user, logout, theme, toggleTheme } = useAppState();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="navbar">
      <div className="brand">StdOut</div>
      <nav className="nav-links">
        <Link to="/interview/setup">New Interview</Link>
        <Link to="/interviews/old">Previous Interviews</Link>
      </nav>
      <div className="nav-user">
        {/* Smooth sliding theme toggle with sun/moon */}
        <button
          type="button"
          onClick={toggleTheme}
          style={{
            background: theme === "light" ? "#e0e0e0" : "#333",
            border: "none",
            outline: "none",
            boxShadow: "none",
            WebkitAppearance: "none",
            borderRadius: "24px",
            width: "50px",
            height: "28px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0",
            transition: "background-color 0.8s ease-in-out",
            fontSize: "16px",
            position: "relative",
            overflow: "hidden",
          }}
          aria-label="Toggle theme"
        >
          <span
            style={{
              position: "absolute",
              left: "4px",
              transition: "transform 0.8s ease-in-out, opacity 0.8s ease-in-out",
              transform: theme === "light" ? "translateX(0)" : "translateX(30px)",
              opacity: theme === "light" ? 1 : 0,
            }}
          >
            ☀️
          </span>
          <span
            style={{
              position: "absolute",
              right: "4px",
              transition: "transform 0.8s ease-in-out, opacity 0.8s ease-in-out",
              transform: theme === "light" ? "translateX(30px)" : "translateX(0)",
              opacity: theme === "light" ? 0 : 1,
            }}
          >
            🌙
          </span>
        </button>

        {user ? <span>{user.name}</span> : <span>Guest</span>}
        {user && (
          <button type="button" onClick={handleLogout} className="ghost-btn">
            Logout
          </button>
        )}
      </div>
    </header>
  );
}

export default Navbar;
