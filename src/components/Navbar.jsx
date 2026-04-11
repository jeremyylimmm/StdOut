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
      <div className="brand">StdOut Interview Simulator</div>
      <nav className="nav-links">
        <Link to="/interview/setup">New Interview</Link>
        <Link to="/interviews/old">Previous Interviews</Link>
      </nav>
      <div className="nav-user">
        <button type="button" className="ghost-btn" onClick={toggleTheme}>
          {theme === "light" ? "Dark Mode" : "Light Mode"}
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
