import { Link } from "react-router-dom";
import { useAuth } from "../AuthContext";

export default function Home() {
  const { user } = useAuth();

  return (
    <main className="home-page">
      <section className="hero-grid">
        <div className="hero-copy">
          <span className="eyebrow">AI-powered poultry health screening</span>
          <h1>Detect poultry disease early. Protect the whole flock.</h1>
          <p>
            Upload a clear fecal image and FlockCheck screens it for Healthy,
            Coccidiosis, Salmonella, and Newcastle patterns using transfer learning.
          </p>

          <div className="hero-actions">
            <Link to={user ? "/predict" : "/register"} className="btn btn-large">
              {user ? "Scan a sample" : "Start free screening"}
            </Link>
            <Link to={user ? "/history" : "/login"} className="btn btn-secondary btn-large">
              {user ? "View history" : "I already have an account"}
            </Link>
          </div>

          <div className="trust-row">
            <span>✓ 4 health classes</span>
            <span>✓ Image-based screening</span>
            <span>✓ Scan history</span>
          </div>
        </div>

        <div className="diagnostic-card">
          <div className="diagnostic-head">
            <div>
              <span className="mini-label">Sample analysis</span>
              <h3>Flock health scan</h3>
            </div>
            <span className="live-badge">AI Ready</span>
          </div>

          <div className="sample-panel">
            <div className="sample-icon" aria-hidden="true">
              <svg viewBox="0 0 64 64" role="img">
                <path d="M46 17c-8-7-22-4-27 7-5 10 2 22 14 24 12 2 22-8 20-20-1-4-3-8-7-11Z" fill="currentColor" opacity=".14"/>
                <path d="M19 37c9-1 18-7 25-18M25 43c5-7 11-13 19-18M31 48c2-7 7-13 13-18" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
              </svg>
            </div>
            <p>Upload a poultry fecal image to begin screening</p>
            <span>JPG or PNG • up to 8 MB</span>
          </div>

          <div className="disease-grid">
            <span className="disease-pill healthy">Healthy</span>
            <span className="disease-pill">Coccidiosis</span>
            <span className="disease-pill">Salmonella</span>
            <span className="disease-pill">Newcastle</span>
          </div>
        </div>
      </section>

      <section className="feature-strip">
        <div className="feature-item"><strong>01</strong><div><h3>Upload</h3><p>Take a clear image of the sample.</p></div></div>
        <div className="feature-item"><strong>02</strong><div><h3>Analyze</h3><p>The model compares learned disease patterns.</p></div></div>
        <div className="feature-item"><strong>03</strong><div><h3>Act</h3><p>Review confidence and suggested next steps.</p></div></div>
      </section>

      <section className="info-banner">
        <div>
          <span className="eyebrow">Built for academic demonstration</span>
          <h2>Simple enough for farmers. Structured enough for a real ML project.</h2>
        </div>
        <p>
          FlockCheck combines a React interface, secure user accounts, prediction history,
          a Node/Express API and a transfer-learning based image classifier.
        </p>
      </section>
    </main>
  );
}
