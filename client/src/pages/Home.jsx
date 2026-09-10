import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../AuthContext";

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  function chooseFile(selected) {
    if (!selected) return;
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setResult(null);
    setError("");
  }

  async function analyze() {
    if (!file) return;
    if (!user) {
      navigate("/login");
      return;
    }

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
      setError(err.response?.data?.message || "Unable to analyze this image right now.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="reference-stage">
      <div className="reference-overlay" />

      <section className="reference-panel">
        <div className="reference-kicker">AI + DEEP LEARNING</div>
        <h1>POULTRY DISEASE DETECTION</h1>
        <p className="reference-subtitle">PLEASE SELECT IMAGE SAMPLE</p>

        {error && <div className="reference-error">{error}</div>}

        {!result && (
          <>
            {preview && (
              <div className="reference-preview-wrap">
                <img src={preview} alt="Selected poultry sample" className="reference-preview" />
              </div>
            )}

            <label className="reference-upload" onClick={() => inputRef.current?.click()}>
              <span className="reference-upload-button">Choose file</span>
              <span className={`reference-file-name ${file ? "has-file" : ""}`}>
                {file ? file.name : "No file chosen"}
              </span>
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png"
                onChange={(e) => chooseFile(e.target.files?.[0])}
              />
            </label>

            <button
              className="reference-analyze"
              type="button"
              disabled={!file || loading}
              onClick={analyze}
            >
              {loading ? "ANALYZING..." : user ? "DETECT DISEASE" : "LOG IN TO DETECT"}
            </button>
          </>
        )}

        {result && (
          <div className={`reference-result ${result.predictedClass === "Healthy" ? "healthy" : "disease"}`}>
            <span className="result-label">PREDICTION RESULT</span>
            <h2>{result.predictedClass}</h2>
            <p>Confidence: {Math.round(result.confidence * 100)}%</p>
            {result.description && <small>{result.description}</small>}
            <button type="button" onClick={() => { setResult(null); setFile(null); setPreview(""); }}>
              CHECK ANOTHER IMAGE
            </button>
          </div>
        )}

        <div className="reference-classes">
          <span>HEALTHY</span><i />
          <span>COCCIDIOSIS</span><i />
          <span>SALMONELLA</span><i />
          <span>NEWCASTLE</span>
        </div>
      </section>

      <div className="reference-credit">AI-assisted poultry health screening • Academic project</div>
    </main>
  );
}
