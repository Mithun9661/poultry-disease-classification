import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { supabase } from "../supabaseClient";
import { predictPoultryDisease } from "../ml/browserModel";

const diseaseInfo = {
  Healthy: {
    description: "The uploaded sample is most consistent with the healthy class in the training dataset.",
    nextStep: "Continue routine flock monitoring, hygiene, clean water and balanced feed.",
  },
  Coccidiosis: {
    description: "The sample shows visual patterns associated with coccidiosis in the training dataset.",
    nextStep: "Isolate suspicious birds where practical and contact a poultry veterinarian for confirmation and treatment guidance.",
  },
  Salmonella: {
    description: "The sample shows visual patterns associated with Salmonella in the training dataset.",
    nextStep: "Strengthen biosecurity and hygiene, limit cross-contamination and seek veterinary/laboratory confirmation.",
  },
  Newcastle: {
    description: "The sample shows visual patterns associated with Newcastle disease in the training dataset.",
    nextStep: "Treat this as a potentially serious flock-health signal and contact a qualified poultry veterinarian promptly.",
  },
};

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
    if (!selected.type.startsWith("image/")) {
      setError("Please choose a JPG or PNG image.");
      return;
    }
    if (selected.size > 5 * 1024 * 1024) {
      setError("Image is too large. Please choose a file under 5 MB.");
      return;
    }
    if (preview) URL.revokeObjectURL(preview);
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setResult(null);
    setError("");
  }

  async function saveHistory(prediction) {
    if (!user?.id || !file) return;

    const ext = (file.name.split(".").pop() || "jpg").replace(/[^a-z0-9]/gi, "").toLowerCase() || "jpg";
    const imagePath = `${user.id}/${Date.now()}-${crypto.randomUUID?.() || Math.random().toString(36).slice(2)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("prediction-images")
      .upload(imagePath, file, { contentType: file.type || "image/jpeg", upsert: false });

    if (uploadError) throw uploadError;

    const { error: insertError } = await supabase.from("predictions").insert({
      user_id: user.id,
      predicted_class: prediction.predictedClass,
      confidence: prediction.confidence,
      probabilities: prediction.probabilities,
      image_path: imagePath,
    });

    if (insertError) throw insertError;
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
      const prediction = await predictPoultryDisease(file);
      const info = diseaseInfo[prediction.predictedClass] || {};
      const finalResult = { ...prediction, ...info };
      setResult(finalResult);

      try {
        await saveHistory(prediction);
      } catch (historyError) {
        console.error("History save failed:", historyError);
      }
    } catch (err) {
      console.error(err);
      setError("Unable to analyze this image. Please try another clear poultry sample image.");
    } finally {
      setLoading(false);
    }
  }

  function resetScan() {
    if (preview) URL.revokeObjectURL(preview);
    setResult(null);
    setFile(null);
    setPreview("");
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <main className="reference-stage">
      <div className="reference-overlay" />

      <section className="reference-panel">
        <div className="reference-kicker">AI + MACHINE LEARNING</div>
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
            <small>{result.description}</small>
            <small style={{ marginTop: 8 }}><strong>Suggested next step:</strong> {result.nextStep}</small>
            <div style={{ marginTop: 12 }}>
              {Object.entries(result.probabilities).map(([cls, prob]) => (
                <div key={cls} style={{ display: "flex", justifyContent: "space-between", gap: 16, padding: "3px 0", fontSize: ".82rem" }}>
                  <span>{cls}</span><strong>{Math.round(prob * 100)}%</strong>
                </div>
              ))}
            </div>
            <small style={{ marginTop: 12, opacity: .8 }}>Academic screening aid only — not a veterinary diagnosis.</small>
            <button type="button" onClick={resetScan}>CHECK ANOTHER IMAGE</button>
          </div>
        )}

        <div className="reference-classes">
          <span>HEALTHY</span><i />
          <span>COCCIDIOSIS</span><i />
          <span>SALMONELLA</span><i />
          <span>NEWCASTLE</span>
        </div>
      </section>

      <div className="reference-credit">Trained on the project dataset • Validation accuracy ≈ 87.4% • Academic project</div>
    </main>
  );
}
