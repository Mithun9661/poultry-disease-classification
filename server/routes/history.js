const express = require("express");
const requireAuth = require("../middleware/auth");
const Prediction = require("../models/Prediction");

const router = express.Router();

router.get("/", requireAuth, async (req, res) => {
  try {
    const predictions = await Prediction.find({ user: req.userId })
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ predictions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not fetch history." });
  }
});

module.exports = router;
