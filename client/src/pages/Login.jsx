import { useState } from "react";
import { Navigate, Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useAuth } from "../AuthContext";

function Icon({ type }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" };
  if (type === "mail") return <svg viewBox="0 0 24 24" {...common}><path d="M4 6h16v12H4z"/><path d="m4 7 8 6 8-6"/></svg>;
  if (type === "lock") return <svg viewBox="0 0 24 24" {...common}><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>;
  if (type === "eye") return <svg viewBox="0 0 24 24" {...common}><path d="M2.5 12s3.5-5 9.5-5 9.5 5 9.5 5-3.5 5-9.5 5-9.5-5-9.5-5Z"/><circle cx="12" cy="12" r="2.3"/></svg>;
  if (type === "cloud") return <svg viewBox="0 0 24 24" {...common}><path d="M6 18h11a4 4 0 0 0 .5-8 6 6 0 0 0-11.2 1.5A3.3 3.3 0 0 0 6 18Z"/></svg>;
  if (type === "shield") return <svg viewBox="0 0 24 24" {...common}><path d="M12 3 5 6v5c0 4.8 2.8 8 7 10 4.2-2 7-5.2 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-4"/></svg>;
  if (type === "devices") return <svg viewBox="0 0 24 24" {...common}><rect x="3" y="5" width="13" height="10" rx="2"/><path d="M7 19h5"/><rect x="17" y="9" width="4" height="9" rx="1"/></svg>;
  return <svg viewBox="0 0 24 24" {...common}><path d="M5 19c4.5-1 8-4.5 10.5-10.5M6.5 15.5C4 13 4.5 8.5 9 6c1.5 4.5-.2 8-2.5 9.5ZM12.5 11.5C12.2 7.7 15 4.2 20 4c.2 5-2.8 8.1-7.5 7.5Z"/></svg>;
}

export default function Login() {
  const { user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  if (authLoading) return <div className="auth-session-loader">Checking secure session…</div>;
  if (user) return <Navigate to="/dashboard" replace />;

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
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const message = err?.message || "Login failed. Please try again.";
      setError(message.toLowerCase().includes("invalid login") ? "Incorrect email or password. Please try again." : message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-premium-page">
      <section className="auth-premium-shell">
        <div className="auth-story">
          <div className="auth-story-copy">
            <div className="auth-kicker">WELCOME BACK</div>
            <h1>Continue your poultry disease screening.</h1>
            <p className="auth-story-lead">
              Use your registered email and password to open the detector from any device. Your cloud account keeps access secure and available wherever you work.
            </p>

            <div className="auth-feature-list">
              <div className="auth-feature">
                <span className="auth-feature-icon"><Icon type="cloud" /></span>
                <div><strong>Cloud account</strong><small>Your account stays securely available online.</small></div>
              </div>
              <div className="auth-feature">
                <span className="auth-feature-icon gold"><Icon type="shield" /></span>
                <div><strong>Secure access</strong><small>Protected with Supabase authentication.</small></div>
              </div>
              <div className="auth-feature">
                <span className="auth-feature-icon teal"><Icon type="devices" /></span>
                <div><strong>Cross-device login</strong><small>Use the same account on laptop or mobile.</small></div>
              </div>
            </div>

            <div className="auth-slogan">Healthier Birds · Brighter Tomorrows</div>
          </div>

          <div className="auth-visual" aria-hidden="true">
            <div className="scan-brackets" />
            <div className="scan-line" />
            <div className="analysis-hud">
              <div className="analysis-hud-title">AI ANALYSIS</div>
              <ul>
                <li>Healthy</li>
                <li>Coccidiosis</li>
                <li>Salmonella</li>
                <li>Newcastle</li>
              </ul>
            </div>
            <div className="scan-caption">SCAN · ANALYZE · PROTECT</div>
          </div>
        </div>

        <div className="auth-panel-premium">
          <div className="auth-card-premium">
            <div className="auth-card-brand">
              <span className="auth-card-brand-mark"><Icon /></span>
              <span className="auth-card-brand-copy">
                <strong>PoultryDetect</strong>
                <small>POULTRY HEALTH · SMARTER TOMORROWS</small>
              </span>
            </div>

            <h2>Log in to PoultryDetect</h2>
            <p className="auth-card-subtitle">Enter the credentials linked to your cloud account to access your poultry health workspace.</p>

            {error && <div className="auth-error-premium">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="premium-field">
                <label htmlFor="email">Email address</label>
                <div className="premium-input-wrap">
                  <Icon type="mail" />
                  <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" required />
                </div>
              </div>

              <div className="premium-field">
                <label htmlFor="password">Password</label>
                <div className="premium-input-wrap">
                  <Icon type="lock" />
                  <input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" required />
                  <button type="button" className="password-toggle" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? "Hide password" : "Show password"}>
                    <Icon type="eye" />
                  </button>
                </div>
              </div>

              <button className="premium-auth-button" type="submit" disabled={loading}>
                <span>{loading ? "Logging in…" : "Log in"}</span><span>→</span>
              </button>
            </form>

            <div className="auth-security-note">🔒 Secure cloud authentication with Supabase</div>
            <p className="auth-switch-premium">Don't have an account? <Link to="/register">Create an account</Link></p>
          </div>
        </div>
      </section>
    </main>
  );
}
