import { Link, useNavigate } from "react-router-dom";
import { useAppState } from "../lib/AppStateContext";

function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAppState();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="navbar">
      <div className="brand">AI Interview Sim</div>
      <nav className="nav-links">
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/interview/setup">Setup</Link>
        <Link to="/interview/session">Session</Link>
        <Link to="/results">Results</Link>
      </nav>
      <div className="nav-user">
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
