import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (signInError) throw signInError;
      navigate("/predict", { replace: true });
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page-new">
      <section className="auth-layout">
        <div className="auth-promo auth-promo-login">
          <Link to="/" className="auth-back">← Back to home</Link>
          <div className="auth-promo-content">
            <span className="auth-pill">Welcome back</span>
            <h1>Continue your poultry disease screening.</h1>
            <p>Use your registered email and password to open the detector from any device.</p>
            <div className="promo-preview login-preview">
              <div className="promo-preview-head"><span>Cloud account</span><span className="success-chip">Secure</span></div>
              <div className="mini-history-row"><span className="mini-history-icon">✓</span><div><strong>Persistent login</strong><small>Your account is stored in Supabase Auth</small></div><span>→</span></div>
              <div className="mini-history-row"><span className="mini-history-icon purple-bg">◎</span><div><strong>Cross-device access</strong><small>Use the same account on laptop or mobile</small></div><span>→</span></div>
            </div>
          </div>
          <p className="auth-note">FlockCheck · Secure cloud authentication</p>
        </div>

        <div className="auth-panel">
          <div className="auth-card-new">
            <div className="auth-title">
              <span>Account access</span>
              <h2>Log in to FlockCheck</h2>
              <p>Enter the credentials linked to your cloud account.</p>
            </div>

            {error && <div className="error-banner">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="field">
                <label htmlFor="email">Email address</label>
                <input id="email" type="email" autoComplete="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="name@example.com" required />
              </div>

              <div className="field">
                <label htmlFor="password">Password</label>
                <input id="password" type="password" autoComplete="current-password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="Enter your password" required />
              </div>

              <button className="btn btn-primary btn-block btn-xl" type="submit" disabled={loading}>
                {loading ? "Logging in…" : "Log in"}<span>→</span>
              </button>
            </form>

            <p className="auth-switch">Don't have an account? <Link to="/register">Create an account</Link></p>
          </div>
        </div>
      </section>
    </main>
  );
}
