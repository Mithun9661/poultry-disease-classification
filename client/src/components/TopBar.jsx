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
      <div className="nav-container">
        <Link to="/" className="brand" aria-label="FlockCheck home">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M5.5 13.5c0-4.1 2.9-7 6.6-7 2.9 0 5.3 1.7 6.2 4.2-1.1-.5-2.4-.7-3.6-.4-2.7.5-4.8 2.7-5.2 5.4-.2 1.1 0 2.2.4 3.2-2.6-.8-4.4-2.8-4.4-5.4Z" fill="currentColor" opacity=".22"/>
              <path d="M8 15.5c2.6-.3 5.1-2.2 7-5.2M11.1 18c.6-2.1 2-4.1 4.1-5.7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </span>
          <span className="brand-name">FlockCheck</span>
        </Link>

        <nav className="nav-links">
          {user ? (
            <>
              <Link to="/predict">Scan</Link>
              <Link to="/history">History</Link>
              <span className="user-chip">{user.name}</span>
              <button className="link-btn" onClick={handleLogout}>Log out</button>
            </>
          ) : (
            <>
              <Link to="/login">Log in</Link>
              <Link to="/register" className="nav-cta">Create account</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
