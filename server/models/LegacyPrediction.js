const mongoose = require("mongoose");

const LegacyPredictionSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    legacySourceId: { type: String, required: true, unique: true, index: true },
    legacyImagePath: { type: String, default: "" },
    predictedClass: {
      type: String,
      enum: ["Healthy", "Coccidiosis", "Salmonella", "Newcastle"],
      required: true,
    },
    confidence: { type: Number, required: true, min: 0, max: 1 },
    allProbabilities: { type: mongoose.Schema.Types.Mixed, default: {} },
    reportedSymptoms: { type: [String], default: [] },
    environment: { type: mongoose.Schema.Types.Mixed, default: {} },
    modelName: { type: String, default: "" },
    modelVersion: { type: String, default: "" },
    inferenceMs: { type: Number, min: 0, default: null },
    originalCreatedAt: { type: Date, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("LegacyPrediction", LegacyPredictionSchema);
