import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { supabase } from "../supabaseClient";
import { predictPoultryDisease } from "../ml/browserModel";

const diseaseInfo = {
  Healthy: {
    description: "The uploaded sample is most consistent with the healthy class in the training dataset.",
    nextStep: "Continue routine flock monitoring, hygiene, clean water and balanced feed.",
    symptoms: ["No strong disease-class visual pattern", "Continue observing droppings and bird activity", "Watch for sudden changes in appetite or behavior"],
    prevention: ["Maintain clean drinking water", "Keep litter and housing dry", "Continue routine biosecurity and vaccination practices"],
  },
  Coccidiosis: {
    description: "The sample shows visual patterns associated with coccidiosis in the training dataset.",
    nextStep: "Isolate suspicious birds where practical and contact a poultry veterinarian for confirmation and treatment guidance.",
    symptoms: ["Bloody or watery droppings may occur", "Reduced appetite, growth or activity", "Weakness and ruffled feathers can be seen"],
    prevention: ["Keep litter dry and reduce moisture", "Clean feeders and drinkers regularly", "Use vet-guided coccidiosis prevention programs"],
  },
  Salmonella: {
    description: "The sample shows visual patterns associated with Salmonella in the training dataset.",
    nextStep: "Strengthen biosecurity and hygiene, limit cross-contamination and seek veterinary/laboratory confirmation.",
    symptoms: ["Diarrhea and dehydration may occur", "Reduced appetite and poor growth", "Young birds may appear weak or inactive"],
    prevention: ["Disinfect housing and equipment", "Control rodents and contamination sources", "Use clean feed, water and strict farm hygiene"],
  },
  Newcastle: {
    description: "The sample shows visual patterns associated with Newcastle disease in the training dataset.",
    nextStep: "Treat this as a potentially serious flock-health signal and contact a qualified poultry veterinarian promptly.",
    symptoms: ["Respiratory or nervous signs may occur", "Reduced feed intake and egg production", "Greenish diarrhea can occur in affected birds"],
    prevention: ["Follow recommended vaccination schedules", "Limit movement of birds and visitors", "Use strict cleaning, isolation and biosecurity"],
  },
};

function confidenceLabel(value) {
  if (value >= 0.8) return "High confidence";
  if (value >= 0.6) return "Moderate confidence";
  return "Low confidence";
}

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const cameraRef = useRef(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [qualityNote, setQualityNote] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [result, setResult] = useState(null);
  const [historyStatus, setHistoryStatus] = useState("");

  async function chooseFile(selected) {
    if (!selected) return;
    if (!selected.type.startsWith("image/")) {
      setError("Please choose a JPG or PNG image.");
      return;
    }
    if (selected.size > 5 * 1024 * 1024) {
      setError("Image is too large. Please choose a file under 5 MB.");
      return;
    }

    let note = "";
    try {
      const bitmap = await createImageBitmap(selected);
      if (bitmap.width < 160 || bitmap.height < 160) {
        note = "This image is quite small. A clearer, higher-resolution sample may give a more reliable result.";
      } else if (Math.max(bitmap.width / bitmap.height, bitmap.height / bitmap.width) > 3) {
        note = "This image is very narrow. For best results, use a sample where the relevant poultry area fills most of the frame.";
      }
      bitmap.close?.();
    } catch {
      // The classifier will still validate whether the browser can decode the image.
    }

    if (preview) URL.revokeObjectURL(preview);
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setResult(null);
    setHistoryStatus("");
    setQualityNote(note);
    setError("");
  }

  function handleDrop(event) {
    event.preventDefault();
    setDragActive(false);
    chooseFile(event.dataTransfer.files?.[0]);
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
    setHistoryStatus("");
    setError("");
    try {
      const prediction = await predictPoultryDisease(file);
      const info = diseaseInfo[prediction.predictedClass] || {};
      const finalResult = { ...prediction, ...info };
      setResult(finalResult);
      setHistoryStatus("saving");

      try {
        await saveHistory(prediction);
        setHistoryStatus("saved");
      } catch (historyError) {
        console.error("History save failed:", historyError);
        setHistoryStatus("failed");
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
    setHistoryStatus("");
    setQualityNote("");
    setError("");
    if (inputRef.current) inputRef.current.value = "";
    if (cameraRef.current) cameraRef.current.value = "";
  }

  function downloadReport() {
    if (!result) return;
    const generatedAt = new Date().toLocaleString();
    const probabilityRows = Object.entries(result.probabilities || {})
      .map(([cls, prob]) => `<tr><td>${cls}</td><td>${Math.round(prob * 100)}%</td></tr>`)
      .join("");
    const symptoms = (result.symptoms || []).map((item) => `<li>${item}</li>`).join("");
    const prevention = (result.prevention || []).map((item) => `<li>${item}</li>`).join("");

    const html = `<!doctype html><html><head><meta charset="utf-8"><title>PoultryDetect Report</title><style>body{font-family:Arial,sans-serif;max-width:760px;margin:40px auto;color:#172033;line-height:1.55}h1{color:#087b5b}h2{margin-bottom:4px}.badge{display:inline-block;padding:6px 10px;border-radius:20px;background:#e9f8f2;color:#087b5b;font-weight:700}table{width:100%;border-collapse:collapse;margin:18px 0}td{padding:9px;border-bottom:1px solid #ddd}td:last-child{text-align:right;font-weight:700}.note{margin-top:30px;padding:14px;background:#f5f7f9;border-radius:10px;color:#596579}</style></head><body><span class="badge">PoultryDetect AI Screening Report</span><h1>${result.predictedClass}</h1><h2>Confidence: ${Math.round(result.confidence * 100)}% — ${confidenceLabel(result.confidence)}</h2><p>${result.description}</p><h3>Class probabilities</h3><table>${probabilityRows}</table><h3>Possible associated signs</h3><ul>${symptoms}</ul><h3>Prevention / management</h3><ul>${prevention}</ul><h3>Suggested next step</h3><p>${result.nextStep}</p><p><strong>Generated:</strong> ${generatedAt}</p><div class="note">Academic screening aid only. This result is not a veterinary diagnosis. Consult a qualified poultry veterinarian for diagnosis and treatment decisions.</div></body></html>`;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `PoultryDetect-${result.predictedClass}-${Date.now()}.html`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  const confidencePercent = result ? Math.round(result.confidence * 100) : 0;
  const lowConfidence = result && result.confidence < 0.6;

  return (
    <main className="reference-stage">
      <div className="reference-overlay" />

      <section className={`reference-panel ${result ? "reference-panel-result" : ""}`}>
        <div className="reference-kicker">AI + MACHINE LEARNING</div>
        <h1>POULTRY DISEASE DETECTION</h1>
        {!result && <p className="reference-subtitle">UPLOAD OR CAPTURE A SAMPLE</p>}

        {error && <div className="reference-error">{error}</div>}

        {!result && (
          <>
            <div
              className={`smart-upload-zone ${dragActive ? "drag-active" : ""} ${preview ? "has-preview" : ""}`}
              onDragOver={(event) => { event.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
            >
              {preview ? (
                <div className="smart-preview-wrap">
                  <img src={preview} alt="Selected poultry sample" className="smart-preview-image" />
                  <div className="smart-preview-meta">
                    <strong>{file?.name}</strong>
                    <small>{file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : ""}</small>
                  </div>
                </div>
              ) : (
                <div className="smart-upload-copy">
                  <span className="smart-upload-icon">◎</span>
                  <strong>Drop a poultry sample image here</strong>
                  <small>JPG or PNG · maximum 5 MB · clear, well-lit image recommended</small>
                </div>
              )}

              <div className="smart-upload-actions">
                <button type="button" onClick={() => inputRef.current?.click()}>{preview ? "Change image" : "Browse files"}</button>
                <button type="button" className="camera-button" onClick={() => cameraRef.current?.click()}>◉ Use camera</button>
              </div>

              <input ref={inputRef} className="smart-hidden-input" type="file" accept="image/jpeg,image/png" onChange={(e) => chooseFile(e.target.files?.[0])} />
              <input ref={cameraRef} className="smart-hidden-input" type="file" accept="image/*" capture="environment" onChange={(e) => chooseFile(e.target.files?.[0])} />
            </div>

            {qualityNote && <div className="image-quality-note">ⓘ {qualityNote}</div>}

            <div className="detector-tips">
              <span>✓ Good lighting</span><span>✓ Relevant area visible</span><span>✓ Avoid heavy blur</span>
            </div>

            <button
              className="reference-analyze smart-analyze-button"
              type="button"
              disabled={!file || loading}
              onClick={analyze}
            >
              {loading ? <><span className="analyze-spinner" /> ANALYZING SAMPLE...</> : user ? "DETECT DISEASE →" : "LOG IN TO DETECT"}
            </button>
          </>
        )}

        {result && (
          <div className={`result-dashboard ${result.predictedClass === "Healthy" ? "healthy" : "disease"}`}>
            <div className="result-topline">
              <span className="result-live-dot" />
              <span>AI SCREENING COMPLETE</span>
              <span className={`history-save-status ${historyStatus}`}>
                {historyStatus === "saving" && "Saving to history..."}
                {historyStatus === "saved" && "✓ Saved to History"}
                {historyStatus === "failed" && "History save failed"}
              </span>
            </div>

            {lowConfidence && (
              <div className="low-confidence-warning">
                <span>!</span>
                <div><strong>Low-confidence result</strong><p>The model is uncertain about this sample. Try a clearer image or another angle before relying on this screening result.</p></div>
              </div>
            )}

            <div className="result-summary-grid">
              <div className="result-image-card">
                <img src={preview} alt="Analyzed poultry sample" />
                <div className="scan-corners"><i /><i /><i /><i /></div>
                <span>ANALYZED SAMPLE</span>
              </div>

              <div className="result-primary-card">
                <span className="result-label">PREDICTION RESULT</span>
                <div className="result-title-row">
                  <div>
                    <h2>{result.predictedClass}</h2>
                    <span className={`confidence-quality ${result.confidence >= .8 ? "high" : result.confidence >= .6 ? "medium" : "low"}`}>{confidenceLabel(result.confidence)}</span>
                    <p>{result.description}</p>
                  </div>
                  <div className="confidence-ring" style={{ "--score": `${confidencePercent}%` }}>
                    <div><strong>{confidencePercent}%</strong><span>confidence</span></div>
                  </div>
                </div>
                <div className="result-recommendation">
                  <span>RECOMMENDED ACTION</span>
                  <p>{result.nextStep}</p>
                </div>
              </div>
            </div>

            <div className="result-content-grid">
              <section className="result-section probability-section">
                <div className="result-section-head">
                  <div><span>MODEL OUTPUT</span><h3>Class probabilities</h3></div>
                  <small>4-class classifier</small>
                </div>
                <div className="probability-list">
                  {Object.entries(result.probabilities || {})
                    .sort((a, b) => b[1] - a[1])
                    .map(([cls, prob]) => (
                      <div className="probability-item" key={cls}>
                        <div className="probability-meta"><span>{cls}</span><strong>{Math.round(prob * 100)}%</strong></div>
                        <div className="probability-track"><i style={{ width: `${Math.max(2, Math.round(prob * 100))}%` }} /></div>
                      </div>
                    ))}
                </div>
              </section>

              <section className="result-section info-section">
                <div className="result-section-head"><div><span>OBSERVATION GUIDE</span><h3>Possible associated signs</h3></div></div>
                <ul className="result-bullet-list">
                  {(result.symptoms || []).map((item) => <li key={item}><span>•</span>{item}</li>)}
                </ul>
              </section>

              <section className="result-section info-section prevention-section">
                <div className="result-section-head"><div><span>FLOCK CARE</span><h3>Prevention & management</h3></div></div>
                <ul className="result-bullet-list">
                  {(result.prevention || []).map((item) => <li key={item}><span>✓</span>{item}</li>)}
                </ul>
              </section>
            </div>

            <div className="result-disclaimer">
              <span>ⓘ</span>
              <p><strong>Academic screening aid only.</strong> This model result is not a veterinary diagnosis. Consult a qualified poultry veterinarian for confirmation and treatment decisions.</p>
            </div>

            <div className="result-actions">
              <button className="result-action-primary" type="button" onClick={resetScan}>↻ SCAN ANOTHER IMAGE</button>
              <button className="result-action-secondary" type="button" onClick={() => navigate("/history")}>▤ VIEW HISTORY</button>
              <button className="result-action-secondary" type="button" onClick={downloadReport}>⇩ DOWNLOAD REPORT</button>
            </div>
          </div>
        )}

        {!result && (
          <div className="reference-classes">
            <span>HEALTHY</span><i />
            <span>COCCIDIOSIS</span><i />
            <span>SALMONELLA</span><i />
            <span>NEWCASTLE</span>
          </div>
        )}
      </section>

      <div className="reference-credit">Trained on the project dataset • Validation accuracy ≈ 87.4% • Academic project</div>
    </main>
  );
}
