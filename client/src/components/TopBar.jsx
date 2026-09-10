import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

function LeafLogo() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 19c4.5-1 8-4.5 10.5-10.5M6.5 15.5C4 13 4.5 8.5 9 6c1.5 4.5-.2 8-2.5 9.5ZM12.5 11.5C12.2 7.7 15 4.2 20 4c.2 5-2.8 8.1-7.5 7.5Z" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function TopBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const overlay = location.pathname === "/" || location.pathname === "/predict";
  const active = (path) => location.pathname === path ? "active-nav-link" : "";

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <header className={`topbar ${overlay ? "topbar-overlay" : ""}`}>
      <div className="nav-container">
        <Link to={user ? "/dashboard" : "/"} className="brand" aria-label="PoultryDetect home">
          <span className="brand-mark premium-brand-mark"><LeafLogo /></span>
          <span className="brand-copy-premium">
            <strong>PoultryDetect</strong>
            <small>AI FOR HEALTHY FLOCKS</small>
          </span>
        </Link>

        <nav className="nav-links">
          {user ? (
            <>
              <Link className={active("/dashboard")} to="/dashboard">Dashboard</Link>
              <Link className={active("/predict")} to="/predict">Detect</Link>
              <Link className={active("/history")} to="/history">History</Link>
              <span className="user-chip">{user.name}</span>
              <button className="link-btn" onClick={handleLogout}>Log out</button>
            </>
          ) : (
            <>
              <Link className={active("/login")} to="/login">Log in</Link>
              <Link to="/register" className={`nav-cta ${active("/register")}`}>Sign up</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
