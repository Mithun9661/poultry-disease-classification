const mongoose = require("mongoose");

const PredictionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    imageUrl: { type: String, default: "" },
    predictedClass: {
      type: String,
      enum: ["Healthy", "Coccidiosis", "Salmonella", "Newcastle"],
      required: true,
      index: true,
    },
    confidence: { type: Number, required: true, min: 0, max: 1 },
    allProbabilities: { type: mongoose.Schema.Types.Mixed, default: {} },
    treatmentSuggestion: { type: String, default: "" },
    reportedSymptoms: { type: [String], default: [] },
    environment: { type: mongoose.Schema.Types.Mixed, default: {} },
    modelName: { type: String, default: "" },
    modelVersion: { type: String, default: "" },
    inferenceMs: { type: Number, min: 0, default: null },
    source: {
      type: String,
      enum: ["browser", "ml-service", "legacy-supabase"],
      default: "browser",
    },
    legacySourceId: { type: String, default: undefined },
    legacyImagePath: { type: String, default: "" },
  },
  { timestamps: true }
);

PredictionSchema.index({ user: 1, createdAt: -1 });
PredictionSchema.index({ legacySourceId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("Prediction", PredictionSchema);
