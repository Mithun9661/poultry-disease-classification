import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanName = name.trim();

      const { data: registerData, error: registerError } = await supabase.functions.invoke("register-user", {
        body: { name: cleanName, email: cleanEmail, password },
      });

      if (registerError) {
        throw new Error(registerData?.message || registerError.message || "Registration failed.");
      }

      if (registerData?.message) {
        throw new Error(registerData.message);
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (signInError) throw signInError;
      navigate("/predict", { replace: true });
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
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
            <span className="auth-pill">Secure cloud account</span>
            <h1>Create your FlockCheck account.</h1>
            <p>Register once and use the same account on any device to access the poultry detector.</p>
            <div className="promo-preview">
              <div className="promo-preview-head"><span>Cloud authentication</span><span className="success-chip">Enabled</span></div>
              <div className="promo-preview-body">
                <div className="promo-score"><span>AI</span><div><small>After registration</small><strong>Open Detector</strong></div></div>
                <div className="promo-bars"><i style={{width:"90%"}} /><i style={{width:"68%"}} /><i style={{width:"46%"}} /></div>
              </div>
            </div>
          </div>
          <p className="auth-note">FlockCheck · Powered by Supabase Auth</p>
        </div>

        <div className="auth-panel">
          <div className="auth-card-new">
            <div className="auth-title">
              <span>Create account</span>
              <h2>Start with FlockCheck</h2>
              <p>Your account will be created securely and logged in automatically.</p>
            </div>

            {error && <div className="error-banner">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="field">
                <label htmlFor="name">Full name</label>
                <input id="name" autoComplete="name" value={name} onChange={(e)=>setName(e.target.value)} placeholder="Enter your full name" required />
              </div>

              <div className="field">
                <label htmlFor="email">Email address</label>
                <input id="email" type="email" autoComplete="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="name@example.com" required />
              </div>

              <div className="field">
                <div className="label-row"><label htmlFor="password">Password</label><small>Minimum 6 characters</small></div>
                <input id="password" type="password" autoComplete="new-password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="Create a password" minLength={6} required />
              </div>

              <div className="field">
                <label htmlFor="confirm-password">Confirm password</label>
                <input id="confirm-password" type="password" autoComplete="new-password" value={confirmPassword} onChange={(e)=>setConfirmPassword(e.target.value)} placeholder="Enter the same password again" minLength={6} required />
              </div>

              <button className="btn btn-primary btn-block btn-xl" type="submit" disabled={loading}>
                {loading ? "Creating account…" : "Create account"}<span>→</span>
              </button>
            </form>

            <p className="auth-switch">Already have an account? <Link to="/login">Log in</Link></p>
          </div>
        </div>
      </section>
    </main>
  );
}
