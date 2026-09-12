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

async function postJson(url, body, headers = {}) {
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
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

    await expectJson(await fetch(`${base}/history`), 401);
    await expectJson(
      await postJson(`${base}/auth/register`, { name: "X", email: "bad-email", password: "123" }),
      400
    );

    const registerData = await expectJson(
      await postJson(`${base}/auth/register`, {
        name: "Test Farmer",
        email: "farmer@test.com",
        password: "password123",
      }),
      201
    );
    if (!registerData.token) throw new Error("Registration did not return a token.");

    await expectJson(
      await postJson(`${base}/auth/register`, {
        name: "Duplicate Farmer",
        email: "farmer@test.com",
        password: "password123",
      }),
      409
    );

    await expectJson(
      await postJson(`${base}/auth/login`, { email: "farmer@test.com", password: "wrongpass" }),
      401
    );

    const loginData = await expectJson(
      await postJson(`${base}/auth/login`, { email: "farmer@test.com", password: "password123" }),
      200
    );
    if (!loginData.token) throw new Error("Login did not return a token.");

    const headers = {
      Authorization: `Bearer ${loginData.token}`,
      "Content-Type": "application/json",
    };

    const me = await expectJson(await fetch(`${base}/auth/me`, { headers }), 200);
    if (me.user?.email !== "farmer@test.com") throw new Error("Session endpoint returned the wrong user.");

    await expectJson(
      await postJson(`${base}/history`, { predictedClass: "NotAClass", confidence: 0.5 }, headers),
      400
    );

    const saved = await expectJson(
      await postJson(
        `${base}/history`,
        {
          predictedClass: "Coccidiosis",
          confidence: 0.91,
          probabilities: { Coccidiosis: 0.91, Healthy: 0.04, Newcastle: 0.02, Salmonella: 0.03 },
          reportedSymptoms: ["bloody_droppings", "weakness"],
          environment: {
            age_group: "grower",
            litter_condition: "wet",
            water_quality: "clean",
            housing_hygiene: "fair",
            vaccination_status: "unknown",
          },
          modelName: "MobileNetV2 Transfer Learning",
          modelVersion: "reference-mobilenetv2-tl-v1",
          inferenceMs: 143,
        },
        headers
      ),
      201
    );

    const predictionId = saved.prediction?._id;
    if (!predictionId) throw new Error("History POST did not return a prediction id.");

    const history = await expectJson(await fetch(`${base}/history`, { headers }), 200);
    if (history.predictions.length !== 1) throw new Error("History GET did not return the saved prediction.");
    if (history.predictions[0].modelName !== "MobileNetV2 Transfer Learning") throw new Error("Model metadata was not stored.");

    const secondUser = await expectJson(
      await postJson(`${base}/auth/register`, {
        name: "Second Farmer",
        email: "second@test.com",
        password: "password123",
      }),
      201
    );
    const secondHeaders = {
      Authorization: `Bearer ${secondUser.token}`,
      "Content-Type": "application/json",
    };

    await expectJson(
      await fetch(`${base}/history/${predictionId}`, { method: "DELETE", headers: secondHeaders }),
      404
    );

    await expectJson(await fetch(`${base}/history/${predictionId}`, { method: "DELETE", headers }), 200);
    const emptyHistory = await expectJson(await fetch(`${base}/history`, { headers }), 200);
    if (emptyHistory.predictions.length !== 0) throw new Error("History DELETE did not remove the prediction.");

    console.log("SMOKE TEST PASSED: health, validation, register/login/session, auth protection, history CRUD, user isolation");
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
