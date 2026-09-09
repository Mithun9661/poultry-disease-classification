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
    <main className="auth-page">
      <section className="auth-shell">
        <div className="auth-aside">
          <span className="eyebrow light">Flock intelligence, simplified</span>
          <h1>Start monitoring poultry health in minutes.</h1>
          <p>Create an account to run image-based screenings and keep a record of previous scans.</p>
          <div className="auth-benefits">
            <span>✓ Secure personal scan history</span>
            <span>✓ Four-class disease screening</span>
            <span>✓ Confidence-based results</span>
          </div>
        </div>

        <div className="auth-form-wrap">
          <div className="auth-heading">
            <span className="eyebrow">Create your account</span>
            <h2>Welcome to FlockCheck</h2>
            <p>Enter your details to begin screening your flock.</p>
          </div>

          {error && <div className="error-banner">{error}</div>}

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="name">Full name</label>
              <input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" required />
            </div>
            <div className="field">
              <label htmlFor="email">Email address</label>
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimum 6 characters" minLength={6} required />
            </div>
            <button className="btn btn-block btn-large" type="submit" disabled={loading}>
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="auth-switch">Already registered? <Link to="/login">Log in</Link></p>
        </div>
      </section>
    </main>
  );
}
