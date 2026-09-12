import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { fetchHistory, normalizePrediction } from "../apiClient";

const classes = ["Healthy", "Coccidiosis", "Salmonella", "Newcastle"];

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      try {
        const rows = await fetchHistory();
        if (active) setScans(rows.map(normalizePrediction));
      } catch (err) {
        console.error(err);
        if (active) setError("Dashboard data could not be loaded right now.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDashboard();
    return () => { active = false; };
  }, []);

  const stats = useMemo(() => {
    const total = scans.length;
    const healthy = scans.filter((scan) => scan.predicted_class === "Healthy").length;
    const flagged = total - healthy;
    const avg = total
      ? Math.round(scans.reduce((sum, scan) => sum + Number(scan.confidence || 0), 0) / total * 100)
      : 0;
    const distribution = classes.map((label) => ({
      label,
      count: scans.filter((scan) => scan.predicted_class === label).length,
    }));
    return { total, healthy, flagged, avg, distribution };
  }, [scans]);

  return (
    <main className="dashboard-page">
      <section className="dashboard-shell">
        <div className="dashboard-hero">
          <div>
            <span className="dashboard-eyebrow">POULTRY HEALTH WORKSPACE</span>
            <h1>Welcome back, {user?.name || "User"}</h1>
            <p>Run a new screening, review recent results and track your MongoDB-backed flock-health checks in one place.</p>
          </div>
          <button className="dashboard-primary-action" onClick={() => navigate("/predict")}>+ New AI scan</button>
        </div>

        {error && <div className="dashboard-error">{error}</div>}

        <div className="dashboard-stat-grid">
          <article><span>Total scans</span><strong>{loading ? "—" : stats.total}</strong><small>Saved screenings</small></article>
          <article className="good"><span>Healthy results</span><strong>{loading ? "—" : stats.healthy}</strong><small>Healthy-class predictions</small></article>
          <article className="alert"><span>Disease flags</span><strong>{loading ? "—" : stats.flagged}</strong><small>Results needing attention</small></article>
          <article className="confidence"><span>Avg. confidence</span><strong>{loading ? "—" : `${stats.avg}%`}</strong><small>Across saved scans</small></article>
        </div>

        <div className="dashboard-main-grid">
          <section className="dashboard-panel dashboard-recent">
            <div className="dashboard-panel-head">
              <div><span>RECENT ACTIVITY</span><h2>Latest screenings</h2></div>
              <button onClick={() => navigate("/history")}>View all →</button>
            </div>

            {loading ? (
              <div className="dashboard-empty">Loading recent screenings…</div>
            ) : scans.length === 0 ? (
              <div className="dashboard-empty"><strong>No screenings yet</strong><p>Your first AI scan will appear here.</p><button onClick={() => navigate("/predict")}>Start first scan</button></div>
            ) : (
              <div className="dashboard-recent-list">
                {scans.slice(0, 3).map((scan) => {
                  const confidence = Math.round(Number(scan.confidence || 0) * 100);
                  return (
                    <button className="dashboard-recent-item" key={scan.id} onClick={() => navigate("/history")}>
                      <div className="dashboard-recent-image">{scan.imageUrl ? <img src={scan.imageUrl} alt="Poultry screening sample" /> : <span>AI</span>}</div>
                      <div className="dashboard-recent-copy"><strong>{scan.predicted_class}</strong><small>{new Date(scan.created_at).toLocaleString()}</small></div>
                      <div className="dashboard-recent-score"><strong>{confidence}%</strong><span>confidence</span></div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <section className="dashboard-panel dashboard-distribution">
            <div className="dashboard-panel-head"><div><span>MODEL OUTPUT</span><h2>Class distribution</h2></div></div>
            <div className="dashboard-bars">
              {stats.distribution.map((item) => {
                const percent = stats.total ? Math.round(item.count / stats.total * 100) : 0;
                return (
                  <div key={item.label} className="dashboard-bar-row">
                    <div><span>{item.label}</span><strong>{item.count}</strong></div>
                    <div className="dashboard-bar-track"><i style={{ width: `${percent}%` }} /></div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <div className="dashboard-quick-grid">
          <button onClick={() => navigate("/predict")}><span>◎</span><div><strong>Detect disease</strong><small>Upload or capture a poultry sample</small></div><b>→</b></button>
          <button onClick={() => navigate("/history")}><span>▤</span><div><strong>Scan history</strong><small>Review saved screening results</small></div><b>→</b></button>
          <article><span>✓</span><div><strong>MongoDB sync active</strong><small>Results secured through your Express API account</small></div></article>
        </div>

        <p className="dashboard-disclaimer">PoultryDetect is an academic screening aid and not a substitute for veterinary diagnosis.</p>
      </section>
    </main>
  );
}
