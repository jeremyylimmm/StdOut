import { Link, useNavigate } from "react-router-dom";
import { useAppState } from "../lib/AppStateContext";
import { FaSun, FaMoon } from "react-icons/fa";

function Navbar() {
  const navigate = useNavigate();
  const { user, logout, theme, toggleTheme } = useAppState();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="navbar">
      <Link to="/interview/setup" className="brand">St<span className="brand-sub">&#123;an&#125;</span>dOut</Link>
      <nav className="nav-links">
      </nav>
      <div className="nav-user">
        <button
          type="button"
          onClick={toggleTheme}
          className={`theme-toggle ${theme === "dark" ? "theme-toggle--dark" : ""}`}
          aria-label="Toggle theme"
        >
          <FaSun className="theme-toggle-icon theme-toggle-sun" />
          <FaMoon className="theme-toggle-icon theme-toggle-moon" />
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
