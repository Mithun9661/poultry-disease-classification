const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Prediction = require("../models/Prediction");
const LegacyPrediction = require("../models/LegacyPrediction");
const requireAuth = require("../middleware/auth");

const router = express.Router();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function validateEmail(email) {
  return email.length <= 254 && EMAIL_RE.test(email);
}

function validatePassword(password) {
  return typeof password === "string" && password.length >= 6 && password.length <= 128;
}

async function claimLegacyPredictions(user) {
  const email = normalizeEmail(user.email);
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
    const { name, email, password } = req.body || {};
    const cleanEmail = normalizeEmail(email);
    const cleanName = String(name || "").trim();

    if (cleanName.length < 2 || cleanName.length > 80) {
      return res.status(400).json({ message: "Name must be between 2 and 80 characters." });
    }
    if (!validateEmail(cleanEmail)) {
      return res.status(400).json({ message: "Please enter a valid email address." });
    }
    if (!validatePassword(password)) {
      return res.status(400).json({ message: "Password must be between 6 and 128 characters." });
    }

    const existingUser = await User.findOne({ email: cleanEmail }).select("_id").lean();
    if (existingUser) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name: cleanName, email: cleanEmail, password: hashedPassword });
    const migratedHistory = await claimLegacyPredictions(user);
    const token = signToken(user._id);

    return res.status(201).json({
      token,
      migratedHistory,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }
    console.error("Registration error:", err.message);
    return res.status(500).json({ message: "Server error during registration." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const cleanEmail = normalizeEmail(email);

    if (!validateEmail(cleanEmail) || !validatePassword(password)) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const user = await User.findOne({ email: cleanEmail }).select("+password name email");
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const migratedHistory = await claimLegacyPredictions(user);
    const token = signToken(user._id);
    return res.json({
      token,
      migratedHistory,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error("Login error:", err.message);
    return res.status(500).json({ message: "Server error during login." });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("name email");
    if (!user) {
      return res.status(401).json({ message: "Account no longer exists." });
    }
    const migratedHistory = await claimLegacyPredictions(user);
    return res.json({
      migratedHistory,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error("Session error:", err.message);
    return res.status(500).json({ message: "Could not load account session." });
  }
});

module.exports = router;
