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
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
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

  try {
    const form = new FormData();
    form.append("file", fs.createReadStream(req.file.path), req.file.originalname);

    const mlResponse = await axios.post(`${ML_SERVICE_URL}/predict`, form, {
      headers: form.getHeaders(),
      timeout: 15000,
    });

    const { predicted_class, confidence, probabilities } = mlResponse.data;
    const info = diseaseInfo[predicted_class] || {};

    const prediction = await Prediction.create({
      user: req.userId,
      imageUrl: `/uploads/${req.file.filename}`,
      predictedClass: predicted_class,
      confidence,
      allProbabilities: probabilities,
      treatmentSuggestion: info.treatmentSuggestion || "No suggestion available.",
    });

    res.status(201).json({
      prediction: {
        id: prediction._id,
        predictedClass: predicted_class,
        confidence,
        probabilities,
        description: info.description,
        treatmentSuggestion: info.treatmentSuggestion,
        imageUrl: prediction.imageUrl,
        createdAt: prediction.createdAt,
      },
    });
  } catch (err) {
    console.error("Prediction error:", err.message);
    res.status(502).json({
      message: "Could not reach the ML prediction service. Make sure it is running.",
    });
  } finally {
    if (req.file?.path) fs.unlink(req.file.path, () => {});
  }
});

module.exports = router;
