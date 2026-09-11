require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/db");

const PORT = Number(process.env.PORT || 5000);

async function startServer() {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is required.");
  }

  await connectDB();
  return app.listen(PORT, () => {
    console.log(`PoultryDetect API running on port ${PORT}`);
  });
}

if (require.main === module) {
  startServer().catch((err) => {
    console.error("Server startup failed:", err.message);
    process.exit(1);
  });
}

module.exports = { app, startServer };
