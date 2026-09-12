const express = require("express");
const mongoose = require("mongoose");
const requireAuth = require("../middleware/auth");
const Prediction = require("../models/Prediction");

const router = express.Router();
const allowedClasses = new Set(["Healthy", "Coccidiosis", "Salmonella", "Newcastle"]);
const allowedSymptoms = new Set([
  "bloody_droppings",
  "watery_diarrhea",
  "reduced_appetite",
  "weakness",
  "ruffled_feathers",
  "respiratory_signs",
  "nervous_signs",
  "reduced_egg_production",
]);
const allowedEnvironment = {
  age_group: new Set(["unknown", "chick", "grower", "adult"]),
  litter_condition: new Set(["dry", "damp", "wet"]),
  water_quality: new Set(["clean", "uncertain", "dirty"]),
  housing_hygiene: new Set(["good", "fair", "poor"]),
  vaccination_status: new Set(["unknown", "up_to_date", "partial", "not_vaccinated"]),
};

function sanitizeProbabilities(probabilities) {
  if (!probabilities || typeof probabilities !== "object" || Array.isArray(probabilities)) return {};
  const clean = {};
  for (const label of allowedClasses) {
    if (!(label in probabilities)) continue;
    const value = Number(probabilities[label]);
    if (!Number.isFinite(value) || value < 0 || value > 1) return null;
    clean[label] = value;
  }
  return clean;
}

function sanitizeEnvironment(environment) {
  if (!environment || typeof environment !== "object" || Array.isArray(environment)) return {};
  const clean = {};
  for (const [key, values] of Object.entries(allowedEnvironment)) {
    if (environment[key] == null) continue;
    const value = String(environment[key]);
    if (!values.has(value)) return null;
    clean[key] = value;
  }
  return clean;
}

router.get("/", requireAuth, async (req, res) => {
  try {
    const predictions = await Prediction.find({ user: req.userId })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return res.json({ predictions });
  } catch (err) {
    console.error("History fetch error:", err.message);
    return res.status(500).json({ message: "Could not fetch history." });
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const {
      predictedClass,
      confidence,
      probabilities = {},
      imageUrl = "",
      reportedSymptoms = [],
      environment = {},
      modelName = "",
      modelVersion = "",
      inferenceMs = null,
      treatmentSuggestion = "",
    } = req.body || {};

    if (!allowedClasses.has(predictedClass)) {
      return res.status(400).json({ message: "Invalid predicted class." });
    }

    const confidenceNumber = Number(confidence);
    if (!Number.isFinite(confidenceNumber) || confidenceNumber < 0 || confidenceNumber > 1) {
      return res.status(400).json({ message: "Confidence must be a number between 0 and 1." });
    }

    const cleanProbabilities = sanitizeProbabilities(probabilities);
    if (cleanProbabilities === null) {
      return res.status(400).json({ message: "Probabilities contain invalid values." });
    }

    if (!Array.isArray(reportedSymptoms) || reportedSymptoms.some((item) => !allowedSymptoms.has(String(item)))) {
      return res.status(400).json({ message: "Reported symptoms contain an invalid value." });
    }
    const cleanSymptoms = [...new Set(reportedSymptoms.map(String))].slice(0, allowedSymptoms.size);

    const cleanEnvironment = sanitizeEnvironment(environment);
    if (cleanEnvironment === null) {
      return res.status(400).json({ message: "Environment contains an invalid value." });
    }

    const cleanImageUrl = String(imageUrl || "");
    if (cleanImageUrl.length > 400000) {
      return res.status(413).json({ message: "Preview image is too large." });
    }
    if (cleanImageUrl && !/^data:image\/(jpeg|png);base64,[A-Za-z0-9+/=]+$/.test(cleanImageUrl)) {
      return res.status(400).json({ message: "Preview image format is invalid." });
    }

    let cleanInferenceMs = null;
    if (inferenceMs != null) {
      cleanInferenceMs = Number(inferenceMs);
      if (!Number.isFinite(cleanInferenceMs) || cleanInferenceMs < 0 || cleanInferenceMs > 600000) {
        return res.status(400).json({ message: "Inference time is invalid." });
      }
    }

    const prediction = await Prediction.create({
      user: req.userId,
      imageUrl: cleanImageUrl,
      predictedClass,
      confidence: confidenceNumber,
      allProbabilities: cleanProbabilities,
      treatmentSuggestion: String(treatmentSuggestion || "").slice(0, 1000),
      reportedSymptoms: cleanSymptoms,
      environment: cleanEnvironment,
      modelName: String(modelName || "").slice(0, 120),
      modelVersion: String(modelVersion || "").slice(0, 120),
      inferenceMs: cleanInferenceMs,
      source: "browser",
    });

    return res.status(201).json({ prediction });
  } catch (err) {
    console.error("History save error:", err.message);
    return res.status(500).json({ message: "Could not save prediction history." });
  }
});

router.delete("/:id", requireAuth, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid prediction id." });
    }

    const deleted = await Prediction.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!deleted) {
      return res.status(404).json({ message: "Prediction not found." });
    }

    return res.json({ message: "Prediction deleted." });
  } catch (err) {
    console.error("History delete error:", err.message);
    return res.status(500).json({ message: "Could not delete prediction." });
  }
});

module.exports = router;
