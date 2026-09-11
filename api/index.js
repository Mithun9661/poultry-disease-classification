const app = require("../server/app");
const connectDB = require("../server/config/db");

let databaseReadyPromise = null;

function routeFromRequest(req) {
  const raw = req.query?.path;
  const pathValue = Array.isArray(raw) ? raw.join("/") : String(raw || "");
  return pathValue.replace(/^\/+|\/+$/g, "");
}

async function ensureDatabase() {
  if (!process.env.MONGO_URI) {
    const error = new Error("Production MongoDB is not configured.");
    error.code = "MONGO_NOT_CONFIGURED";
    throw error;
  }

  if (!databaseReadyPromise) {
    databaseReadyPromise = connectDB().catch((error) => {
      databaseReadyPromise = null;
      throw error;
    });
  }

  return databaseReadyPromise;
}

module.exports = async function handler(req, res) {
  const route = routeFromRequest(req);
  req.url = route ? `/api/${route}` : "/api";

  if (route === "health") {
    return app(req, res);
  }

  try {
    await ensureDatabase();
    return app(req, res);
  } catch (error) {
    console.error("Vercel API database error:", error.message);
    if (error.code === "MONGO_NOT_CONFIGURED") {
      return res.status(503).json({
        message: "MongoDB persistence is not configured for this deployment.",
        code: "MONGO_NOT_CONFIGURED",
      });
    }
    return res.status(503).json({
      message: "MongoDB is temporarily unavailable.",
      code: "MONGO_UNAVAILABLE",
    });
  }
};
