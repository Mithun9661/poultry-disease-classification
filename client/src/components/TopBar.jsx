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
    <div className="topbar">
      <Link to="/" className="brand">
        FlockCheck <small>poultry health scanner</small>
      </Link>
      <div className="nav-links">
        {user ? (
          <>
            <Link to="/predict">Scan</Link>
            <Link to="/history">History</Link>
            <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
              {user.name}
            </span>
            <button className="link-btn" onClick={handleLogout}>
              Log out
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Log in</Link>
            <Link to="/register">Sign up</Link>
          </>
        )}
      </div>
    </div>
  );
}
