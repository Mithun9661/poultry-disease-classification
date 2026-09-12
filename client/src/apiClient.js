const TOKEN_KEY = "poultrydetect_token";
const USER_KEY = "poultrydetect_user";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || "";
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export async function apiRequest(path, options = {}) {
  const headers = new Headers(options.headers || {});
  if (options.body && !headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(path, { ...options, headers });
  let data = null;
  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    const error = new Error(data?.message || `Request failed (${response.status})`);
    error.status = response.status;
    error.code = data?.code;
    throw error;
  }

  return data;
}

export async function loginWithMongo(email, password) {
  const data = await apiRequest("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
  });
  saveSession(data.token, data.user);
  return data.user;
}

export async function registerWithMongo(name, email, password) {
  const data = await apiRequest("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase(), password }),
  });
  saveSession(data.token, data.user);
  return data.user;
}

export async function fetchCurrentUser() {
  const data = await apiRequest("/api/auth/me");
  if (data?.user) {
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  }
  return data.user;
}

export async function fetchHistory() {
  const data = await apiRequest("/api/history");
  return data.predictions || [];
}

export async function savePrediction(payload) {
  const data = await apiRequest("/api/history", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return data.prediction;
}

export async function deletePrediction(id) {
  return apiRequest(`/api/history/${id}`, { method: "DELETE" });
}

export function normalizePrediction(row) {
  return {
    ...row,
    id: row._id || row.id,
    predicted_class: row.predictedClass ?? row.predicted_class,
    confidence: Number(row.confidence || 0),
    probabilities: row.allProbabilities ?? row.probabilities ?? {},
    image_path: "",
    imageUrl: row.imageUrl || "",
    reported_symptoms: row.reportedSymptoms ?? row.reported_symptoms ?? [],
    environment: row.environment || {},
    model_name: row.modelName ?? row.model_name ?? "",
    model_version: row.modelVersion ?? row.model_version ?? "",
    inference_ms: row.inferenceMs ?? row.inference_ms ?? null,
    created_at: row.createdAt ?? row.created_at,
  };
}
