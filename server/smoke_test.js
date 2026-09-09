const { MongoMemoryServer } = require("mongodb-memory-server");

process.env.JWT_SECRET = "test_secret";
process.env.PORT = "5055";

async function main() {
  const mongod = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongod.getUri();
  require("./server.js");
  await new Promise((r) => setTimeout(r, 1500));

  const base = "http://localhost:5055/api";
  const health = await fetch(`${base}/health`);
  console.log("Health:", await health.json());

  const registerRes = await fetch(`${base}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Test Farmer", email: "farmer@test.com", password: "password123" }),
  });
  const registerData = await registerRes.json();
  console.log("Register status:", registerRes.status, registerData.user);

  const loginRes = await fetch(`${base}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "farmer@test.com", password: "password123" }),
  });
  const loginData = await loginRes.json();
  console.log("Login status:", loginRes.status, "token received:", !!loginData.token);

  const historyRes = await fetch(`${base}/history`, {
    headers: { Authorization: `Bearer ${loginData.token}` },
  });
  console.log("History status:", historyRes.status, await historyRes.json());

  console.log("SMOKE TEST PASSED");
  await mongod.stop();
  process.exit(0);
}

main().catch((err) => {
  console.error("SMOKE TEST FAILED:", err);
  process.exit(1);
});
