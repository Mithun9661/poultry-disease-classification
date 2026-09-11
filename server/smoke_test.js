const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

process.env.JWT_SECRET = "test_secret_for_poultry_detect_ci";
process.env.PORT = "5055";
process.env.CORS_ORIGIN = "*";

async function expectJson(response, expectedStatus) {
  const data = await response.json();
  if (response.status !== expectedStatus) {
    throw new Error(`Expected ${expectedStatus}, got ${response.status}: ${JSON.stringify(data)}`);
  }
  return data;
}

async function main() {
  const mongod = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongod.getUri("poultry_disease_test");

  const { startServer } = require("./server");
  const server = await startServer();
  const base = "http://localhost:5055/api";

  try {
    const health = await expectJson(await fetch(`${base}/health`), 200);
    if (health.status !== "ok" || health.database !== "MongoDB") throw new Error("Health response is invalid.");

    const registerData = await expectJson(
      await fetch(`${base}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Test Farmer", email: "farmer@test.com", password: "password123" }),
      }),
      201
    );
    if (!registerData.token) throw new Error("Registration did not return a token.");

    const loginData = await expectJson(
      await fetch(`${base}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "farmer@test.com", password: "password123" }),
      }),
      200
    );
    if (!loginData.token) throw new Error("Login did not return a token.");

    const headers = {
      Authorization: `Bearer ${loginData.token}`,
      "Content-Type": "application/json",
    };

    const saved = await expectJson(
      await fetch(`${base}/history`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          predictedClass: "Coccidiosis",
          confidence: 0.91,
          probabilities: { Coccidiosis: 0.91, Healthy: 0.04, Newcastle: 0.02, Salmonella: 0.03 },
          reportedSymptoms: ["bloody_droppings", "weakness"],
          environment: { litter_condition: "wet", water_quality: "clean" },
          modelName: "MobileNetV2 Transfer Learning",
          modelVersion: "reference-mobilenetv2-tl-v1",
          inferenceMs: 143,
        }),
      }),
      201
    );

    const predictionId = saved.prediction?._id;
    if (!predictionId) throw new Error("History POST did not return a prediction id.");

    const history = await expectJson(await fetch(`${base}/history`, { headers }), 200);
    if (history.predictions.length !== 1) throw new Error("History GET did not return the saved prediction.");
    if (history.predictions[0].modelName !== "MobileNetV2 Transfer Learning") throw new Error("Model metadata was not stored.");

    await expectJson(await fetch(`${base}/history/${predictionId}`, { method: "DELETE", headers }), 200);
    const emptyHistory = await expectJson(await fetch(`${base}/history`, { headers }), 200);
    if (emptyHistory.predictions.length !== 0) throw new Error("History DELETE did not remove the prediction.");

    console.log("SMOKE TEST PASSED: health, register, login, history create/read/delete");
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await mongoose.disconnect();
    await mongod.stop();
  }
}

main().catch((err) => {
  console.error("SMOKE TEST FAILED:", err);
  process.exit(1);
});
