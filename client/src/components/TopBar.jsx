import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

export default function TopBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <header className="topbar">
      <Link to="/" className="brand">
        <span className="brand-mark">F</span>
        <span className="brand-copy">
          FlockCheck
          <small>AI poultry health</small>
        </span>
      </Link>

      <nav className="nav-links">
        {user ? (
          <>
            <Link to="/predict">Disease Scan</Link>
            <Link to="/history">History</Link>
            <span className="user-chip">{user.name}</span>
            <button className="link-btn" onClick={handleLogout}>Log out</button>
          </>
        ) : (
          <>
            <Link to="/login">Log in</Link>
            <Link to="/register" className="nav-cta">Get started</Link>
          </>
        )}
      </nav>
    </header>
  );
}
