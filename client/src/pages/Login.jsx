import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password });
      login(res.data.token, res.data.user);
      navigate("/predict");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-shell">
        <div className="auth-aside">
          <span className="eyebrow light">Poultry health, powered by AI</span>
          <h1>Welcome back to your flock health dashboard.</h1>
          <p>Continue screening samples and review previous disease predictions from one place.</p>
          <div className="auth-benefits">
            <span>✓ Fast image screening workflow</span>
            <span>✓ Saved prediction history</span>
            <span>✓ Clear confidence breakdown</span>
          </div>
        </div>

        <div className="auth-form-wrap">
          <div className="auth-heading">
            <span className="eyebrow">Account access</span>
            <h2>Log in to FlockCheck</h2>
            <p>Use your registered email and password.</p>
          </div>

          {error && <div className="error-banner">{error}</div>}

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="email">Email address</label>
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" required />
            </div>
            <button className="btn btn-block btn-large" type="submit" disabled={loading}>
              {loading ? "Logging in…" : "Log in"}
            </button>
          </form>

          <p className="auth-switch">New to FlockCheck? <Link to="/register">Create an account</Link></p>
        </div>
      </section>
    </main>
  );
}
