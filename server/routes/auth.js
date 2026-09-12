const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Prediction = require("../models/Prediction");
const LegacyPrediction = require("../models/LegacyPrediction");
const requireAuth = require("../middleware/auth");

const router = express.Router();

async function claimLegacyPredictions(user) {
  const email = String(user.email || "").trim().toLowerCase();
  if (!email) return 0;

  const legacyRows = await LegacyPrediction.find({ email }).lean();
  if (!legacyRows.length) return 0;

  const operations = legacyRows.map((row) => ({
    updateOne: {
      filter: { legacySourceId: row.legacySourceId },
      update: {
        $setOnInsert: {
          user: user._id,
          imageUrl: "",
          predictedClass: row.predictedClass,
          confidence: row.confidence,
          allProbabilities: row.allProbabilities || {},
          treatmentSuggestion: "",
          reportedSymptoms: row.reportedSymptoms || [],
          environment: row.environment || {},
          modelName: row.modelName || "",
          modelVersion: row.modelVersion || "",
          inferenceMs: row.inferenceMs == null ? null : row.inferenceMs,
          source: "legacy-supabase",
          legacySourceId: row.legacySourceId,
          legacyImagePath: row.legacyImagePath || "",
          createdAt: row.originalCreatedAt,
          updatedAt: row.originalCreatedAt,
        },
      },
      upsert: true,
    },
  }));

  await Prediction.collection.bulkWrite(operations, { ordered: false });
  await LegacyPrediction.deleteMany({
    email,
    legacySourceId: { $in: legacyRows.map((row) => row.legacySourceId) },
  });

  return legacyRows.length;
}

router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are all required." });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanName = String(name).trim();
    if (!cleanName) {
      return res.status(400).json({ message: "Name is required." });
    }

    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const user = await User.create({ name: cleanName, email: cleanEmail, password: hashedPassword });
    const migratedHistory = await claimLegacyPredictions(user);
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.status(201).json({
      token,
      migratedHistory,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error during registration." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const user = await User.findOne({ email: String(email).trim().toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const migratedHistory = await claimLegacyPredictions(user);
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({
      token,
      migratedHistory,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error during login." });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("name email");
    if (!user) {
      return res.status(401).json({ message: "Account no longer exists." });
    }
    const migratedHistory = await claimLegacyPredictions(user);
    res.json({
      migratedHistory,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not load account session." });
  }
});

module.exports = router;
