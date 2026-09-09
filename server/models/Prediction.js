const mongoose = require("mongoose");

const PredictionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    imageUrl: { type: String, required: true },
    predictedClass: { type: String, required: true },
    confidence: { type: Number, required: true },
    allProbabilities: { type: Object },
    treatmentSuggestion: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Prediction", PredictionSchema);
