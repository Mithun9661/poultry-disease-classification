import { useState, useRef } from "react";
import api from "../api/client";

export default function Predict() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);

  function handleFile(selected) {
    if (!selected) return;
    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
    setResult(null);
    setError("");
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files?.[0];
    handleFile(dropped);
  }

  async function handleSubmit() {
    if (!file) return;
    setLoading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await api.post("/predict", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(res.data.prediction);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not analyze this image. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError("");
  }

  const isHealthy = result?.predictedClass === "Healthy";

  return (
    <div className="page">
      <h1>Scan a fecal sample</h1>
      <p className="subtitle">
        Upload a clear photo of chicken droppings to check for signs of Coccidiosis, Salmonella, or Newcastle disease.
      </p>

      {error && <div className="error-banner">{error}</div>}

      {!result && (
        <>
          {previewUrl ? (
            <div className="card">
              <img src={previewUrl} alt="Selected sample" className="preview-image" />
              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn" onClick={handleSubmit} disabled={loading}>
                  {loading ? "Analyzing…" : "Analyze image"}
                </button>
                <button className="btn btn-secondary" onClick={reset} disabled={loading}>
                  Choose a different photo
                </button>
              </div>
            </div>
          ) : (
            <div
              className={`dropzone ${dragOver ? "drag-over" : ""}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <p style={{ margin: 0, fontWeight: 600 }}>Drop a photo here, or click to browse</p>
              <p style={{ margin: "6px 0 0", color: "var(--text-muted)", fontSize: "0.9rem" }}>
                JPG or PNG, up to 8MB
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
            </div>
          )}
        </>
      )}

      {result && (
        <div>
          <img src={previewUrl} alt="Analyzed sample" className="preview-image" />

          <div className={`result-banner ${isHealthy ? "healthy" : "disease"}`}>
            <h3>{isHealthy ? "No disease signs detected" : result.predictedClass}</h3>
            <p style={{ margin: 0, color: "var(--text-muted)" }}>{result.description}</p>
            <div className="confidence-bar-track">
              <div
                className="confidence-bar-fill"
                style={{ width: `${Math.round(result.confidence * 100)}%` }}
              />
            </div>
            <p style={{ margin: "8px 0 0", fontSize: "0.85rem", color: "var(--text-muted)" }}>
              Confidence: {Math.round(result.confidence * 100)}%
            </p>
          </div>

          <div className="card" style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: "1rem" }}>Suggested next step</h3>
            <p style={{ margin: 0 }}>{result.treatmentSuggestion}</p>
          </div>

          <div className="card" style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: "1rem" }}>Full breakdown</h3>
            {Object.entries(result.probabilities || {}).map(([cls, prob]) => (
              <div className="prob-row" key={cls}>
                <span>{cls}</span>
                <span>{Math.round(prob * 100)}%</span>
              </div>
            ))}
          </div>

          <button className="btn" onClick={reset}>
            Scan another sample
          </button>
        </div>
      )}
    </div>
  );
}
