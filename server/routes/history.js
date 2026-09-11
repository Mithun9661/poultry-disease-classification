const express = require("express");
const mongoose = require("mongoose");
const requireAuth = require("../middleware/auth");
const Prediction = require("../models/Prediction");

const router = express.Router();
const allowedClasses = new Set(["Healthy", "Coccidiosis", "Salmonella", "Newcastle"]);

router.get("/", requireAuth, async (req, res) => {
  try {
    const predictions = await Prediction.find({ user: req.userId })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    res.json({ predictions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not fetch history." });
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

    const prediction = await Prediction.create({
      user: req.userId,
      imageUrl: String(imageUrl || ""),
      predictedClass,
      confidence: confidenceNumber,
      allProbabilities: probabilities && typeof probabilities === "object" ? probabilities : {},
      treatmentSuggestion: String(treatmentSuggestion || ""),
      reportedSymptoms: Array.isArray(reportedSymptoms) ? reportedSymptoms.slice(0, 20) : [],
      environment: environment && typeof environment === "object" ? environment : {},
      modelName: String(modelName || "").slice(0, 120),
      modelVersion: String(modelVersion || "").slice(0, 120),
      inferenceMs: inferenceMs == null ? null : Math.max(0, Number(inferenceMs) || 0),
      source: "browser",
    });

    res.status(201).json({ prediction });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not save prediction history." });
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

    res.json({ message: "Prediction deleted." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not delete prediction." });
  }
});

module.exports = router;
