import { Link } from "react-router-dom";
import { useAuth } from "../AuthContext";

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m7.5 12.5 3 3 6-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default function Home() {
  const { user } = useAuth();

  return (
    <main className="landing-page">
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge"><span className="badge-dot" /> Transfer-learning poultry screening</div>
          <h1>Poultry health screening, made <span>clear and simple.</span></h1>
          <p className="hero-lead">
            Upload a poultry fecal image and review an AI-assisted screening result for
            Healthy, Coccidiosis, Salmonella, or Newcastle patterns in one clean workflow.
          </p>

          <div className="hero-actions">
            <Link to={user ? "/predict" : "/register"} className="btn btn-primary btn-xl">
              {user ? "Start a new scan" : "Start screening"}
              <span aria-hidden="true">→</span>
            </Link>
            <Link to={user ? "/history" : "/login"} className="btn btn-ghost btn-xl">
              {user ? "View scan history" : "Log in"}
            </Link>
          </div>

          <div className="hero-points">
            <span><CheckIcon /> 4-class screening</span>
            <span><CheckIcon /> Confidence breakdown</span>
            <span><CheckIcon /> Scan history</span>
          </div>
        </div>

        <div className="product-preview" aria-label="FlockCheck product preview">
          <div className="preview-glow preview-glow-one" />
          <div className="preview-glow preview-glow-two" />
          <div className="preview-window">
            <div className="preview-topbar">
              <div className="preview-brand"><span className="preview-logo">F</span><strong>FlockCheck</strong></div>
              <span className="preview-status"><i /> Model workspace</span>
            </div>

            <div className="preview-body">
              <div className="preview-title-row">
                <div><small>NEW ANALYSIS</small><h3>Analyze a sample</h3></div>
                <span className="preview-date">Image screening</span>
              </div>

              <div className="upload-mock">
                <div className="upload-icon">
                  <svg viewBox="0 0 24 24" fill="none"><path d="M12 16V7m0 0-3.5 3.5M12 7l3.5 3.5M5.5 16.5v1A1.5 1.5 0 0 0 7 19h10a1.5 1.5 0 0 0 1.5-1.5v-1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <strong>Drop sample image here</strong>
                <span>JPG or PNG, up to 8 MB</span>
                <button type="button">Choose image</button>
              </div>

              <div className="preview-result-row">
                <div className="result-mini-card">
                  <span className="result-icon good"><CheckIcon /></span>
                  <div><small>Supported classes</small><strong>4 conditions</strong></div>
                </div>
                <div className="result-mini-card">
                  <span className="result-icon purple">◎</span>
                  <div><small>Output</small><strong>Confidence score</strong></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="stats-row">
        <div><strong>4</strong><span>classification classes</span></div>
        <div><strong>8K+</strong><span>organized image samples</span></div>
        <div><strong>1</strong><span>simple screening workflow</span></div>
        <div><strong>24/7</strong><span>web access after deployment</span></div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <span className="section-kicker">HOW IT WORKS</span>
          <h2>From image to insight in three steps.</h2>
          <p>Designed to keep the ML workflow understandable instead of overwhelming.</p>
        </div>

        <div className="steps-grid">
          <article className="step-card"><span className="step-number">01</span><div className="step-icon">↑</div><h3>Upload a sample</h3><p>Select a clear poultry fecal image from your device.</p></article>
          <article className="step-card"><span className="step-number">02</span><div className="step-icon">⌁</div><h3>Run screening</h3><p>The inference service processes the image through the trained classifier.</p></article>
          <article className="step-card"><span className="step-number">03</span><div className="step-icon">✓</div><h3>Review the result</h3><p>See the predicted class, confidence breakdown, and suggested next step.</p></article>
        </div>
      </section>

      <section className="classes-section">
        <div className="classes-copy">
          <span className="section-kicker">SCREENING CLASSES</span>
          <h2>Focused on four poultry health outcomes.</h2>
          <p>The project is structured around four labeled classes from the organized image dataset.</p>
        </div>
        <div className="class-list">
          <div className="class-row"><span className="class-dot healthy-dot" /><div><strong>Healthy</strong><small>No target disease pattern detected</small></div></div>
          <div className="class-row"><span className="class-dot coccidiosis-dot" /><div><strong>Coccidiosis</strong><small>Parasitic intestinal disease pattern</small></div></div>
          <div className="class-row"><span className="class-dot salmonella-dot" /><div><strong>Salmonella</strong><small>Bacterial infection pattern</small></div></div>
          <div className="class-row"><span className="class-dot newcastle-dot" /><div><strong>Newcastle</strong><small>Viral disease pattern</small></div></div>
        </div>
      </section>

      <section className="final-cta">
        <div><span className="section-kicker light-kicker">FLOCKCHECK</span><h2>Ready to screen your first sample?</h2><p>Create an account and keep your scans organized in one place.</p></div>
        <Link to={user ? "/predict" : "/register"} className="btn btn-light btn-xl">{user ? "Open scanner" : "Create account"} <span>→</span></Link>
      </section>
    </main>
  );
}
