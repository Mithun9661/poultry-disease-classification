import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { savePrediction } from "../apiClient";
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

const symptomOptions = [
  ["bloody_droppings", "Bloody droppings"],
  ["watery_diarrhea", "Watery / green diarrhea"],
  ["reduced_appetite", "Reduced appetite"],
  ["weakness", "Weakness / low activity"],
  ["ruffled_feathers", "Ruffled feathers"],
  ["respiratory_signs", "Coughing / respiratory signs"],
  ["nervous_signs", "Twisted neck / nervous signs"],
  ["reduced_egg_production", "Reduced egg production"],
];

const symptomLabelMap = Object.fromEntries(symptomOptions);
const defaultEnvironment = {
  age_group: "unknown",
  litter_condition: "dry",
  water_quality: "clean",
  housing_hygiene: "good",
  vaccination_status: "unknown",
};

function confidenceLabel(value) {
  if (value >= 0.8) return "High confidence";
  if (value >= 0.6) return "Moderate confidence";
  return "Low confidence";
}

function pretty(value) {
  return String(value || "unknown").replaceAll("_", " ");
}

async function makeThumbnail(file) {
  try {
    const bitmap = await createImageBitmap(file);
    const maxSide = 360;
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext("2d");
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();
    return canvas.toDataURL("image/jpeg", 0.68);
  } catch {
    return "";
  }
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
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [environment, setEnvironment] = useState(defaultEnvironment);
  const [contextOpen, setContextOpen] = useState(true);

  async function chooseFile(selected) {
    if (!selected) return;
    if (!selected.type.startsWith("image/")) return setError("Please choose a JPG or PNG image.");
    if (selected.size > 5 * 1024 * 1024) return setError("Image is too large. Please choose a file under 5 MB.");

    let note = "";
    try {
      const bitmap = await createImageBitmap(selected);
      if (bitmap.width < 160 || bitmap.height < 160) note = "This image is quite small. A clearer, higher-resolution sample may give a more reliable result.";
      else if (Math.max(bitmap.width / bitmap.height, bitmap.height / bitmap.width) > 3) note = "This image is very narrow. Use a sample where the relevant poultry area fills most of the frame.";
      bitmap.close?.();
    } catch {}

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

  function toggleSymptom(symptom) {
    setSelectedSymptoms((items) => items.includes(symptom) ? items.filter((item) => item !== symptom) : [...items, symptom]);
  }

  async function persistHistory(prediction, info) {
    const imageUrl = await makeThumbnail(file);
    await savePrediction({
      predictedClass: prediction.predictedClass,
      confidence: prediction.confidence,
      probabilities: prediction.probabilities,
      imageUrl,
      reportedSymptoms: selectedSymptoms,
      environment,
      modelName: prediction.modelName || "",
      modelVersion: prediction.modelVersion || "",
      inferenceMs: Number.isFinite(prediction.inferenceMs) ? prediction.inferenceMs : null,
      treatmentSuggestion: info.nextStep || "",
    });
  }

  async function analyze() {
    if (!file) return;
    if (!user) return navigate("/login");

    setLoading(true);
    setHistoryStatus("");
    setError("");
    try {
      const prediction = await predictPoultryDisease(file);
      const info = diseaseInfo[prediction.predictedClass] || {};
      const finalResult = { ...prediction, ...info, reportedSymptoms: [...selectedSymptoms], environment: { ...environment } };
      setResult(finalResult);
      setHistoryStatus("saving");
      try {
        await persistHistory(prediction, info);
        setHistoryStatus("saved");
      } catch (historyError) {
        console.error("MongoDB history save failed:", historyError);
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
    setSelectedSymptoms([]);
    setEnvironment(defaultEnvironment);
    setContextOpen(true);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
    if (cameraRef.current) cameraRef.current.value = "";
  }

  function downloadReport() {
    if (!result) return;
    const probabilityRows = Object.entries(result.probabilities || {}).map(([cls, prob]) => `<tr><td>${cls}</td><td>${Math.round(prob * 100)}%</td></tr>`).join("");
    const symptoms = (result.symptoms || []).map((item) => `<li>${item}</li>`).join("");
    const prevention = (result.prevention || []).map((item) => `<li>${item}</li>`).join("");
    const reported = result.reportedSymptoms?.length ? result.reportedSymptoms.map((item) => `<li>${symptomLabelMap[item] || item}</li>`).join("") : "<li>No symptoms selected</li>";
    const envRows = Object.entries(result.environment || {}).map(([key, value]) => `<tr><td>${pretty(key)}</td><td>${pretty(value)}</td></tr>`).join("");
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>PoultryDetect Report</title><style>body{font-family:Arial,sans-serif;max-width:760px;margin:40px auto;color:#172033;line-height:1.55}h1{color:#087b5b}.badge{display:inline-block;padding:6px 10px;border-radius:20px;background:#e9f8f2;color:#087b5b;font-weight:700}table{width:100%;border-collapse:collapse;margin:18px 0}td{padding:9px;border-bottom:1px solid #ddd}.note{margin-top:30px;padding:14px;background:#f5f7f9;border-radius:10px}</style></head><body><span class="badge">PoultryDetect AI Screening Report</span><h1>${result.predictedClass}</h1><h2>Confidence: ${Math.round(result.confidence * 100)}% — ${confidenceLabel(result.confidence)}</h2><p><strong>Model:</strong> ${result.modelName || "Classifier"}${result.modelVersion ? ` (${result.modelVersion})` : ""}<br><strong>Inference:</strong> ${Number.isFinite(result.inferenceMs) ? `${result.inferenceMs} ms` : "Not recorded"}</p><p>${result.description}</p><h3>Class probabilities</h3><table>${probabilityRows}</table><h3>Reported symptoms</h3><ul>${reported}</ul><h3>Environment</h3><table>${envRows}</table><h3>Possible signs</h3><ul>${symptoms}</ul><h3>Prevention / management</h3><ul>${prevention}</ul><h3>Suggested next step</h3><p>${result.nextStep}</p><div class="note">Academic screening aid only. This is not a veterinary diagnosis.</div></body></html>`;
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

        {!result && <>
          <div className={`smart-upload-zone ${dragActive ? "drag-active" : ""} ${preview ? "has-preview" : ""}`} onDragOver={(e) => { e.preventDefault(); setDragActive(true); }} onDragLeave={() => setDragActive(false)} onDrop={handleDrop}>
            {preview ? <div className="smart-preview-wrap"><img src={preview} alt="Selected poultry sample" className="smart-preview-image" /><div className="smart-preview-meta"><strong>{file?.name}</strong><small>{file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : ""}</small></div></div> : <div className="smart-upload-copy"><span className="smart-upload-icon">◎</span><strong>Drop a poultry sample image here</strong><small>JPG or PNG · maximum 5 MB · clear, well-lit image recommended</small></div>}
            <div className="smart-upload-actions"><button type="button" onClick={() => inputRef.current?.click()}>{preview ? "Change image" : "Browse files"}</button><button type="button" className="camera-button" onClick={() => cameraRef.current?.click()}>◉ Use camera</button></div>
            <input ref={inputRef} className="smart-hidden-input" type="file" accept="image/jpeg,image/png" onChange={(e) => chooseFile(e.target.files?.[0])} />
            <input ref={cameraRef} className="smart-hidden-input" type="file" accept="image/*" capture="environment" onChange={(e) => chooseFile(e.target.files?.[0])} />
          </div>

          {qualityNote && <div className="image-quality-note">ⓘ {qualityNote}</div>}

          <section className="screening-context-card">
            <button type="button" className="context-toggle" onClick={() => setContextOpen((open) => !open)}><span><strong>Flock symptoms & environment</strong><small>Optional screening context</small></span><b>{contextOpen ? "−" : "+"}</b></button>
            {contextOpen && <div className="context-body">
              <div className="context-group"><div className="context-heading"><strong>Observed symptoms</strong><small>Select all that apply</small></div><div className="symptom-chip-grid">{symptomOptions.map(([value, label]) => <button type="button" key={value} className={selectedSymptoms.includes(value) ? "selected" : ""} onClick={() => toggleSymptom(value)}><span>{selectedSymptoms.includes(value) ? "✓" : "+"}</span>{label}</button>)}</div></div>
              <div className="environment-grid">
                <label><span>Bird age group</span><select value={environment.age_group} onChange={(e) => setEnvironment({ ...environment, age_group: e.target.value })}><option value="unknown">Unknown</option><option value="chick">Chick</option><option value="grower">Grower</option><option value="adult">Adult</option></select></label>
                <label><span>Litter condition</span><select value={environment.litter_condition} onChange={(e) => setEnvironment({ ...environment, litter_condition: e.target.value })}><option value="dry">Dry</option><option value="damp">Damp</option><option value="wet">Wet</option></select></label>
                <label><span>Water quality</span><select value={environment.water_quality} onChange={(e) => setEnvironment({ ...environment, water_quality: e.target.value })}><option value="clean">Clean</option><option value="uncertain">Uncertain</option><option value="dirty">Dirty</option></select></label>
                <label><span>Housing hygiene</span><select value={environment.housing_hygiene} onChange={(e) => setEnvironment({ ...environment, housing_hygiene: e.target.value })}><option value="good">Good</option><option value="fair">Fair</option><option value="poor">Poor</option></select></label>
                <label><span>Vaccination status</span><select value={environment.vaccination_status} onChange={(e) => setEnvironment({ ...environment, vaccination_status: e.target.value })}><option value="unknown">Unknown</option><option value="up_to_date">Up to date</option><option value="partial">Partial</option><option value="not_vaccinated">Not vaccinated</option></select></label>
              </div>
              <p className="context-note">This context is saved with the scan in MongoDB. It does not alter the image classifier score.</p>
            </div>}
          </section>

          <div className="detector-tips"><span>✓ Good lighting</span><span>✓ Relevant area visible</span><span>✓ Avoid heavy blur</span></div>
          <button className="reference-analyze smart-analyze-button" type="button" disabled={!file || loading} onClick={analyze}>{loading ? <><span className="analyze-spinner" /> ANALYZING SAMPLE...</> : user ? "DETECT DISEASE →" : "LOG IN TO DETECT"}</button>
        </>}

        {result && <div className={`result-dashboard ${result.predictedClass === "Healthy" ? "healthy" : "disease"}`}>
          <div className="result-topline"><span className="result-live-dot" /><span>AI SCREENING COMPLETE</span><span className={`history-save-status ${historyStatus}`}>{historyStatus === "saving" && "Saving to MongoDB..."}{historyStatus === "saved" && "✓ Saved to History"}{historyStatus === "failed" && "History save failed"}</span></div>
          <div className={`model-runtime-strip ${result.usedFallback ? "fallback" : "transfer"}`}><span>{result.usedFallback ? "Fallback model" : "Transfer learning active"}</span><strong>{result.modelName || "Classifier"}</strong><small>{result.inferenceEngine || "Browser"}{Number.isFinite(result.inferenceMs) ? ` · ${result.inferenceMs} ms` : ""}</small></div>
          {result.usedFallback && <div className="model-fallback-warning">MobileNetV2 could not be loaded, so the lightweight backup classifier was used.</div>}
          {lowConfidence && <div className="low-confidence-warning"><span>!</span><div><strong>Low-confidence result</strong><p>Try a clearer image or another angle before relying on this screening result.</p></div></div>}

          <div className="result-summary-grid">
            <div className="result-image-card"><img src={preview} alt="Analyzed poultry sample" /><div className="scan-corners"><i /><i /><i /><i /></div><span>ANALYZED SAMPLE</span></div>
            <div className="result-primary-card"><span className="result-label">PREDICTION RESULT</span><div className="result-title-row"><div><h2>{result.predictedClass}</h2><span className={`confidence-quality ${result.confidence >= .8 ? "high" : result.confidence >= .6 ? "medium" : "low"}`}>{confidenceLabel(result.confidence)}</span><p>{result.description}</p></div><div className="confidence-ring" style={{ "--score": `${confidencePercent}%` }}><div><strong>{confidencePercent}%</strong><span>confidence</span></div></div></div><div className="result-recommendation"><span>RECOMMENDED ACTION</span><p>{result.nextStep}</p></div></div>
          </div>

          <div className="result-content-grid">
            <section className="result-section probability-section"><div className="result-section-head"><div><span>MODEL OUTPUT</span><h3>Class probabilities</h3></div><small>4-class classifier</small></div><div className="probability-list">{Object.entries(result.probabilities || {}).sort((a, b) => b[1] - a[1]).map(([cls, prob]) => <div className="probability-item" key={cls}><div className="probability-meta"><span>{cls}</span><strong>{Math.round(prob * 100)}%</strong></div><div className="probability-track"><i style={{ width: `${Math.max(2, Math.round(prob * 100))}%` }} /></div></div>)}</div></section>
            <section className="result-section info-section"><div className="result-section-head"><div><span>OBSERVATION GUIDE</span><h3>Possible associated signs</h3></div></div><ul className="result-bullet-list">{(result.symptoms || []).map((item) => <li key={item}><span>•</span>{item}</li>)}</ul></section>
            <section className="result-section info-section prevention-section"><div className="result-section-head"><div><span>FLOCK CARE</span><h3>Prevention & management</h3></div></div><ul className="result-bullet-list">{(result.prevention || []).map((item) => <li key={item}><span>✓</span>{item}</li>)}</ul></section>
            <section className="result-section screening-context-result"><div className="result-section-head"><div><span>REPORTED CONTEXT</span><h3>Symptoms & farm conditions</h3></div><small>Supplementary</small></div><div className="reported-context-grid"><div><strong>Observed symptoms</strong>{result.reportedSymptoms?.length ? <div className="reported-symptoms">{result.reportedSymptoms.map((item) => <span key={item}>{symptomLabelMap[item] || item}</span>)}</div> : <p>No symptoms selected.</p>}</div><div className="reported-environment">{Object.entries(result.environment || {}).map(([key, value]) => <p key={key}><span>{pretty(key)}</span><strong>{pretty(value)}</strong></p>)}</div></div></section>
          </div>

          <div className="result-disclaimer"><span>ⓘ</span><p><strong>Academic screening aid only.</strong> This model result is not a veterinary diagnosis. Consult a qualified poultry veterinarian for confirmation and treatment decisions.</p></div>
          <div className="result-actions"><button className="result-action-primary" type="button" onClick={resetScan}>↻ SCAN ANOTHER IMAGE</button><button className="result-action-secondary" type="button" onClick={() => navigate("/history")}>▤ VIEW HISTORY</button><button className="result-action-secondary" type="button" onClick={downloadReport}>⇩ DOWNLOAD REPORT</button></div>
        </div>}

        {!result && <div className="reference-classes"><span>HEALTHY</span><i /><span>COCCIDIOSIS</span><i /><span>SALMONELLA</span><i /><span>NEWCASTLE</span></div>}
      </section>
      <div className="reference-credit">MobileNetV2 transfer-learning screening · Express + MongoDB history · Academic project</div>
    </main>
  );
}
