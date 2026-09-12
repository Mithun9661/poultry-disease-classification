const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");
const fs = require("fs");

const authRoutes = require("./routes/auth");
const predictRoutes = require("./routes/predict");
const historyRoutes = require("./routes/history");

const app = express();
const uploadsDir = process.env.VERCEL ? "/tmp/poultry-uploads" : path.join(__dirname, "uploads");
fs.mkdirSync(uploadsDir, { recursive: true });

const defaultOrigins = [
  "https://poultry-disease-classification.vercel.app",
  "https://poultry-disease-classification-mithun9661s-projects.vercel.app",
  "https://poultry-disease-classification-git-main-mithun9661s-projects.vercel.app",
  "http://localhost:5173",
];

const configuredOrigins = String(process.env.CORS_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedOrigins = new Set([...defaultOrigins, ...configuredOrigins]);

app.set("trust proxy", 1);
app.disable("x-powered-by");
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: false,
  })
);
app.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || configuredOrigins.includes("*") || allowedOrigins.has(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Origin is not allowed by CORS."));
    },
    methods: ["GET", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    maxAge: 600,
  })
);

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests. Please try again shortly." },
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { message: "Too many authentication attempts. Please wait before trying again." },
});

app.use("/api", apiLimiter);
app.use(express.json({ limit: "1mb", strict: true }));
app.use("/uploads", express.static(uploadsDir, { dotfiles: "deny", fallthrough: false }));

app.get("/api/health", (_req, res) => {
  const mongoConfigured = Boolean(process.env.MONGO_URI);
  const jwtConfigured = Boolean(process.env.JWT_SECRET);
  res.json({
    status: "ok",
    service: "PoultryDetect API",
    database: "MongoDB",
    mongoConfigured,
    jwtConfigured,
    persistentApiReady: mongoConfigured && jwtConfigured,
    runtime: process.env.VERCEL ? "vercel-function" : "node",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/auth/register", authLimiter);
app.use("/api/auth/login", authLimiter);
app.use("/api/auth", authRoutes);
app.use("/api/predict", predictRoutes);
app.use("/api/history", historyRoutes);

app.use("/api", (_req, res) => res.status(404).json({ message: "API route not found." }));

app.use((err, _req, res, _next) => {
  console.error("API error:", err.message);
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ message: "Image is too large." });
  }
  if (err.type === "entity.too.large") {
    return res.status(413).json({ message: "Request body is too large." });
  }
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Invalid JSON request body." });
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
