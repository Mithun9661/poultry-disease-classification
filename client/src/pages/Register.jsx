import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../AuthContext";

export default function Register() {
  const [name, setName] = useState("");
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
      const res = await api.post("/auth/register", { name, email, password });
      login(res.data.token, res.data.user);
      navigate("/predict");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page-new">
      <section className="auth-layout">
        <div className="auth-promo">
          <Link to="/" className="auth-back">← Back to home</Link>
          <div className="auth-promo-content">
            <span className="auth-pill">AI-assisted poultry screening</span>
            <h1>Build a clearer picture of your flock health.</h1>
            <p>Save every screening result in one secure account and return to your history whenever you need it.</p>
            <div className="promo-preview">
              <div className="promo-preview-head"><span>Recent screening</span><span className="success-chip">Completed</span></div>
              <div className="promo-preview-body">
                <div className="promo-score"><span>H</span><div><small>Example result</small><strong>Healthy</strong></div></div>
                <div className="promo-bars"><i style={{width:"86%"}} /><i style={{width:"58%"}} /><i style={{width:"34%"}} /></div>
              </div>
            </div>
          </div>
          <p className="auth-note">Academic poultry disease classification project</p>
        </div>

        <div className="auth-panel">
          <div className="auth-card-new">
            <div className="auth-title"><span>Create account</span><h2>Get started with FlockCheck</h2><p>It only takes a moment to set up your account.</p></div>
            {error && <div className="error-banner">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="field"><label htmlFor="name">Full name</label><input id="name" autoComplete="name" value={name} onChange={(e)=>setName(e.target.value)} placeholder="Enter your full name" required /></div>
              <div className="field"><label htmlFor="email">Email address</label><input id="email" type="email" autoComplete="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="name@example.com" required /></div>
              <div className="field"><div className="label-row"><label htmlFor="password">Password</label><small>Minimum 6 characters</small></div><input id="password" type="password" autoComplete="new-password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="Create a password" minLength={6} required /></div>
              <button className="btn btn-primary btn-block btn-xl" type="submit" disabled={loading}>{loading ? "Creating account…" : "Create account"}<span>→</span></button>
            </form>
            <p className="auth-switch">Already have an account? <Link to="/login">Log in</Link></p>
          </div>
        </div>
      </section>
    </main>
  );
}
