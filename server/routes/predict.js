const express = require("express");
const multer = require("multer");
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");

const requireAuth = require("../middleware/auth");
const Prediction = require("../models/Prediction");
const diseaseInfo = require("../config/diseaseInfo");

const router = express.Router();

const upload = multer({
  dest: path.join(__dirname, "..", "uploads"),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/jpg"];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Only JPG/PNG images are allowed."));
    }
    cb(null, true);
  },
});

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";

router.post("/", requireAuth, upload.single("image"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No image uploaded. Field name must be 'image'." });
  }

  let keepUploadedImage = false;

  try {
    const form = new FormData();
    form.append("file", fs.createReadStream(req.file.path), req.file.originalname);

    const startedAt = Date.now();
    const mlResponse = await axios.post(`${ML_SERVICE_URL}/predict`, form, {
      headers: form.getHeaders(),
      timeout: 20000,
      maxContentLength: 2 * 1024 * 1024,
    });

    const { predicted_class, confidence, probabilities, model_name, model_version } = mlResponse.data || {};
    const allowedClasses = new Set(["Healthy", "Coccidiosis", "Salmonella", "Newcastle"]);
    if (!allowedClasses.has(predicted_class)) {
      throw new Error("ML service returned an invalid class.");
    }

    const confidenceNumber = Number(confidence);
    if (!Number.isFinite(confidenceNumber) || confidenceNumber < 0 || confidenceNumber > 1) {
      throw new Error("ML service returned an invalid confidence score.");
    }

    const info = diseaseInfo[predicted_class] || {};
    const imageUrl = `/uploads/${req.file.filename}`;
    const inferenceMs = Math.max(1, Date.now() - startedAt);

    const prediction = await Prediction.create({
      user: req.userId,
      imageUrl,
      predictedClass: predicted_class,
      confidence: confidenceNumber,
      allProbabilities: probabilities && typeof probabilities === "object" ? probabilities : {},
      treatmentSuggestion: info.treatmentSuggestion || "No suggestion available.",
      modelName: String(model_name || "External ML Service").slice(0, 120),
      modelVersion: String(model_version || "").slice(0, 120),
      inferenceMs,
      source: "ml-service",
    });

    keepUploadedImage = true;
    res.status(201).json({
      prediction: {
        id: prediction._id,
        predictedClass: predicted_class,
        confidence: confidenceNumber,
        probabilities: prediction.allProbabilities,
        description: info.description,
        treatmentSuggestion: prediction.treatmentSuggestion,
        imageUrl,
        modelName: prediction.modelName,
        modelVersion: prediction.modelVersion,
        inferenceMs,
        createdAt: prediction.createdAt,
      },
    });
  } catch (err) {
    console.error("Prediction error:", err.message);
    res.status(502).json({
      message: "Prediction service failed. Check the ML service configuration and try again.",
    });
  } finally {
    if (!keepUploadedImage && req.file?.path) fs.unlink(req.file.path, () => {});
  }
});

module.exports = router;
