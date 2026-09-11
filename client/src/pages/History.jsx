import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

const filters = ["All", "Healthy", "Coccidiosis", "Salmonella", "Newcastle"];
const symptomLabels = {
  bloody_droppings: "Bloody droppings",
  watery_diarrhea: "Watery / green diarrhea",
  reduced_appetite: "Reduced appetite",
  weakness: "Weakness / low activity",
  ruffled_feathers: "Ruffled feathers",
  respiratory_signs: "Respiratory signs",
  nervous_signs: "Nervous signs",
  reduced_egg_production: "Reduced egg production",
};

function pretty(value) {
  return String(value || "unknown").replaceAll("_", " ");
}

export default function History() {
  const navigate = useNavigate();
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [deletingId, setDeletingId] = useState("");

  useEffect(() => {
    let active = true;

    async function loadHistory() {
      try {
        setLoading(true);
        const { data, error: queryError } = await supabase
          .from("predictions")
          .select("id,predicted_class,confidence,probabilities,image_path,reported_symptoms,environment,created_at")
          .order("created_at", { ascending: false });

        if (queryError) throw queryError;

        const rows = data || [];
        const paths = rows.map((row) => row.image_path).filter(Boolean);
        const urlMap = {};

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

  const filteredPredictions = useMemo(() => {
    const text = query.trim().toLowerCase();
    return predictions.filter((item) => {
      const filterMatch = filter === "All" || item.predicted_class === filter;
      const symptomText = (item.reported_symptoms || []).map((value) => symptomLabels[value] || value).join(" ").toLowerCase();
      const searchMatch = !text || item.predicted_class.toLowerCase().includes(text) || symptomText.includes(text);
      return filterMatch && searchMatch;
    });
  }, [predictions, filter, query]);

  const stats = useMemo(() => {
    const total = predictions.length;
    const healthy = predictions.filter((item) => item.predicted_class === "Healthy").length;
    const disease = total - healthy;
    const avgConfidence = total
      ? Math.round((predictions.reduce((sum, item) => sum + Number(item.confidence || 0), 0) / total) * 100)
      : 0;
    return { total, healthy, disease, avgConfidence };
  }, [predictions]);

  async function deletePrediction(item) {
    const confirmed = window.confirm("Delete this scan from your history?");
    if (!confirmed) return;

    try {
      setDeletingId(item.id);
      if (item.image_path) {
        const { error: storageError } = await supabase.storage
          .from("prediction-images")
          .remove([item.image_path]);
        if (storageError) throw storageError;
      }

      const { error: deleteError } = await supabase
        .from("predictions")
        .delete()
        .eq("id", item.id);

      if (deleteError) throw deleteError;
      setPredictions((current) => current.filter((row) => row.id !== item.id));
      if (selected?.id === item.id) setSelected(null);
    } catch (err) {
      console.error(err);
      setError("Could not delete this scan. Please try again.");
    } finally {
      setDeletingId("");
    }
  }

  function formatDate(value) {
    return new Date(value).toLocaleString([], {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <main className="history-dashboard-page">
      <section className="history-dashboard-shell">
        <div className="history-hero-row">
          <div>
            <span className="history-eyebrow">AI SCREENING RECORDS</span>
            <h1>Scan history</h1>
            <p>Review your saved poultry disease screening results, confidence scores, symptoms and farm context.</p>
          </div>
          <button className="history-new-scan" onClick={() => navigate("/predict")}>+ New scan</button>
        </div>

        <div className="history-stats-grid">
          <article className="history-stat-card">
            <span>Total scans</span>
            <strong>{stats.total}</strong>
            <small>All saved screenings</small>
          </article>
          <article className="history-stat-card healthy-stat">
            <span>Healthy</span>
            <strong>{stats.healthy}</strong>
            <small>Healthy-class results</small>
          </article>
          <article className="history-stat-card disease-stat">
            <span>Disease flags</span>
            <strong>{stats.disease}</strong>
            <small>Non-healthy results</small>
          </article>
          <article className="history-stat-card confidence-stat">
            <span>Avg. confidence</span>
            <strong>{stats.avgConfidence}%</strong>
            <small>Across your scans</small>
          </article>
        </div>

        <div className="history-toolbar">
          <div className="history-search-wrap">
            <span>⌕</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search disease or symptom..."
              aria-label="Search scan history"
            />
          </div>

          <div className="history-filter-row">
            {filters.map((item) => (
              <button
                key={item}
                className={filter === item ? "active" : ""}
                onClick={() => setFilter(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {error && <div className="history-error">{error}</div>}

        {loading ? (
          <div className="history-loading-card">Loading your scan history…</div>
        ) : predictions.length === 0 ? (
          <div className="history-empty-card">
            <div className="history-empty-icon">AI</div>
            <h2>No scans yet</h2>
            <p>Analyze your first poultry sample and it will appear here automatically.</p>
            <button onClick={() => navigate("/predict")}>Start first scan</button>
          </div>
        ) : filteredPredictions.length === 0 ? (
          <div className="history-empty-card compact">
            <h2>No matching scans</h2>
            <p>Try another filter or search term.</p>
          </div>
        ) : (
          <div className="history-premium-grid">
            {filteredPredictions.map((item) => {
              const isHealthy = item.predicted_class === "Healthy";
              const confidence = Math.round(item.confidence * 100);
              const contextCount = (item.reported_symptoms || []).length;
              return (
                <article className="history-premium-card" key={item.id}>
                  <button className="history-image-button" onClick={() => setSelected(item)}>
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={`${item.predicted_class} poultry sample`} />
                    ) : (
                      <div className="history-image-placeholder">Image unavailable</div>
                    )}
                    <span className="history-image-overlay">View details</span>
                  </button>

                  <div className="history-premium-body">
                    <div className="history-card-topline">
                      <span className={`history-status-badge ${isHealthy ? "healthy" : "disease"}`}>
                        {item.predicted_class}
                      </span>
                      <span className="history-confidence-pill">{confidence}%</span>
                    </div>

                    <div className="history-confidence-track">
                      <i style={{ width: `${confidence}%` }} />
                    </div>

                    <p className="history-card-date">{formatDate(item.created_at)}</p>
                    {contextCount > 0 && <p className="history-card-date">{contextCount} reported symptom{contextCount === 1 ? "" : "s"}</p>}

                    <div className="history-card-actions">
                      <button onClick={() => setSelected(item)}>Details</button>
                      <button
                        className="delete"
                        onClick={() => deletePrediction(item)}
                        disabled={deletingId === item.id}
                      >
                        {deletingId === item.id ? "Deleting…" : "Delete"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {selected && (
        <div className="history-modal-backdrop" onClick={() => setSelected(null)}>
          <div className="history-modal" onClick={(e) => e.stopPropagation()}>
            <button className="history-modal-close" onClick={() => setSelected(null)}>×</button>
            <div className="history-modal-image">
              {selected.imageUrl ? <img src={selected.imageUrl} alt="Selected poultry sample" /> : <div>Image unavailable</div>}
            </div>
            <div className="history-modal-content">
              <span className={`history-status-badge ${selected.predicted_class === "Healthy" ? "healthy" : "disease"}`}>
                {selected.predicted_class}
              </span>
              <h2>{selected.predicted_class}</h2>
              <p className="history-modal-date">{formatDate(selected.created_at)}</p>
              <div className="history-modal-confidence">
                <span>Prediction confidence</span>
                <strong>{Math.round(selected.confidence * 100)}%</strong>
              </div>
              <div className="history-modal-probabilities">
                {Object.entries(selected.probabilities || {})
                  .sort((a, b) => b[1] - a[1])
                  .map(([label, probability]) => (
                    <div key={label}>
                      <span>{label}</span>
                      <strong>{Math.round(probability * 100)}%</strong>
                    </div>
                  ))}
              </div>

              <div className="history-context-block">
                <h3>Reported symptoms</h3>
                {(selected.reported_symptoms || []).length ? (
                  <div className="history-context-chips">
                    {selected.reported_symptoms.map((value) => <span key={value}>{symptomLabels[value] || value}</span>)}
                  </div>
                ) : <p className="history-modal-date">No symptoms were selected for this scan.</p>}

                {selected.environment && Object.keys(selected.environment).length > 0 && (
                  <div className="history-context-env">
                    {Object.entries(selected.environment).map(([key, value]) => (
                      <p key={key}><span>{pretty(key)}</span><strong>{pretty(value)}</strong></p>
                    ))}
                  </div>
                )}
              </div>

              <p className="history-modal-note">Reported context is supplementary. The saved confidence score comes from the image classifier. Academic screening result only — not a veterinary diagnosis.</p>
              <button className="history-modal-delete" onClick={() => deletePrediction(selected)} disabled={deletingId === selected.id}>
                {deletingId === selected.id ? "Deleting…" : "Delete this scan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
