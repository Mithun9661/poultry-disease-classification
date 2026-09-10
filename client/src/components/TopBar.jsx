import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

export default function TopBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const overlay = location.pathname === "/" || location.pathname === "/predict";

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <header className={`topbar ${overlay ? "topbar-overlay" : ""}`}>
      <div className="nav-container">
        <Link to="/" className="brand" aria-label="FlockCheck home">
          <span className="brand-mark">AI</span>
          <span className="brand-name">PoultryDetect</span>
        </Link>

        <nav className="nav-links">
          {user ? (
            <>
              <Link to="/predict">Detect</Link>
              <Link to="/history">History</Link>
              <span className="user-chip">{user.name}</span>
              <button className="link-btn" onClick={handleLogout}>Log out</button>
            </>
          ) : (
            <>
              <Link to="/login">Log in</Link>
              <Link to="/register" className="nav-cta">Sign up</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
