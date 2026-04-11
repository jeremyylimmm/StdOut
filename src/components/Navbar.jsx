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
      <Link to="/interview/setup" className="brand">St<span className="brand-sub">an</span>dOut</Link>
      <nav className="nav-links">
      </nav>
      <div className="nav-user">
        <button type="button" onClick={toggleTheme} className="theme-toggle-btn" aria-label="Toggle theme">
          {theme === "dark" ? "[light]" : "[dark]"}
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
