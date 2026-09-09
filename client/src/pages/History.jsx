import { useEffect, useState } from "react";
import api from "../api/client";

const apiBase = import.meta.env.VITE_API_URL || "";
const backendBase = apiBase.replace(/\/api\/?$/, "");

export default function History() {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/history")
      .then((res) => setPredictions(res.data.predictions))
      .catch(() => setError("Could not load your scan history."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-wide">
      <h1>Scan history</h1>
      <p className="subtitle">Every sample you've analyzed, most recent first.</p>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <p style={{ color: "var(--text-muted)" }}>Loading…</p>
      ) : predictions.length === 0 ? (
        <div className="empty-state">
          <p>No scans yet. Go to Scan to analyze your first sample.</p>
        </div>
      ) : (
        <div className="history-grid">
          {predictions.map((p) => {
            const isHealthy = p.predictedClass === "Healthy";
            const imageSrc = p.imageUrl?.startsWith("http") ? p.imageUrl : `${backendBase}${p.imageUrl || ""}`;
            return (
              <div className="history-card" key={p._id}>
                <img src={imageSrc} alt={p.predictedClass} />
                <div className="history-card-body">
                  <span className={`tag ${isHealthy ? "healthy" : "disease"}`}>
                    {p.predictedClass}
                  </span>
                  <p style={{ margin: "10px 0 0", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                    {Math.round(p.confidence * 100)}% confidence ·{" "}
                    {new Date(p.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
