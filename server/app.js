const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const authRoutes = require("./routes/auth");
const predictRoutes = require("./routes/predict");
const historyRoutes = require("./routes/history");

const app = express();
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const configuredOrigins = String(process.env.CORS_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.disable("x-powered-by");
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || configuredOrigins.length === 0 || configuredOrigins.includes("*") || configuredOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Origin is not allowed by CORS."));
    },
  })
);
app.use(express.json({ limit: "1mb" }));
app.use("/uploads", express.static(uploadsDir));

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "PoultryDetect API",
    database: "MongoDB",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/predict", predictRoutes);
app.use("/api/history", historyRoutes);

app.use("/api", (_req, res) => res.status(404).json({ message: "API route not found." }));

app.use((err, _req, res, _next) => {
  console.error("API error:", err.message);
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ message: "Image is too large." });
  }
  if (err.message?.includes("JPG/PNG")) {
    return res.status(400).json({ message: err.message });
  }
  if (err.message?.includes("CORS")) {
    return res.status(403).json({ message: "Origin is not allowed." });
  }
  return res.status(500).json({ message: "Unexpected server error." });
});

module.exports = app;
