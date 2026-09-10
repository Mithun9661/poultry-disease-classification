import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function History() {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadHistory() {
      try {
        setLoading(true);
        const { data, error: queryError } = await supabase
          .from("predictions")
          .select("id,predicted_class,confidence,probabilities,image_path,created_at")
          .order("created_at", { ascending: false });

        if (queryError) throw queryError;

        const rows = data || [];
        const paths = rows.map((row) => row.image_path).filter(Boolean);
        let urlMap = {};

        if (paths.length) {
          const { data: signed, error: signedError } = await supabase.storage
            .from("prediction-images")
            .createSignedUrls(paths, 60 * 60);

          if (!signedError && signed) {
            signed.forEach((item, index) => {
              if (item?.signedUrl) urlMap[paths[index]] = item.signedUrl;
            });
          }
        }

        if (active) {
          setPredictions(rows.map((row) => ({ ...row, imageUrl: urlMap[row.image_path] || "" })));
        }
      } catch (err) {
        console.error(err);
        if (active) setError("Could not load your scan history.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadHistory();
    return () => { active = false; };
  }, []);

  return (
    <div className="page-wide">
      <h1>Scan history</h1>
      <p className="subtitle">Your saved poultry screening results, newest first.</p>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <p style={{ color: "var(--muted)" }}>Loading…</p>
      ) : predictions.length === 0 ? (
        <div className="empty-state">
          <p>No scans yet. Open Detect and analyze your first poultry sample.</p>
        </div>
      ) : (
        <div className="history-grid">
          {predictions.map((p) => {
            const isHealthy = p.predicted_class === "Healthy";
            return (
              <div className="history-card" key={p.id}>
                {p.imageUrl ? (
                  <img src={p.imageUrl} alt={p.predicted_class} />
                ) : (
                  <div style={{ height: 160, display: "grid", placeItems: "center", background: "#eef6f3", color: "#64748b" }}>
                    Image unavailable
                  </div>
                )}
                <div className="history-card-body">
                  <span className={`tag ${isHealthy ? "healthy" : "disease"}`}>
                    {p.predicted_class}
                  </span>
                  <p style={{ margin: "10px 0 0", fontSize: "0.85rem", color: "var(--muted)" }}>
                    {Math.round(p.confidence * 100)}% confidence · {new Date(p.created_at).toLocaleString()}
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
