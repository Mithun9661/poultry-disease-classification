import api from "../api/client";

const ACCOUNTS_KEY = "flockcheck_accounts_v1";
const hasRemoteBackend = Boolean(import.meta.env.VITE_API_URL);

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function readAccounts() {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAccounts(accounts) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

function bytesToBase64(bytes) {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

async function hashPassword(password, saltBase64) {
  const data = new TextEncoder().encode(`${saltBase64}:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return bytesToBase64(new Uint8Array(digest));
}

function makeSalt() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return bytesToBase64(bytes);
}

function makeToken() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return `local.${bytesToBase64(bytes).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "")}`;
}

async function registerLocally({ name, email, password }) {
  const cleanName = String(name || "").trim();
  const cleanEmail = normalizeEmail(email);

  if (!cleanName || !cleanEmail || !password) {
    throw new Error("Name, email and password are required.");
  }
  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters.");
  }

  const accounts = readAccounts();
  if (accounts.some((account) => account.email === cleanEmail)) {
    throw new Error("An account with this email already exists. Please log in.");
  }

  const salt = makeSalt();
  const passwordHash = await hashPassword(password, salt);
  const user = {
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    name: cleanName,
    email: cleanEmail,
  };

  accounts.push({ ...user, salt, passwordHash, createdAt: new Date().toISOString() });
  writeAccounts(accounts);

  return { token: makeToken(), user };
}

async function loginLocally({ email, password }) {
  const cleanEmail = normalizeEmail(email);
  if (!cleanEmail || !password) {
    throw new Error("Email and password are required.");
  }

  const account = readAccounts().find((item) => item.email === cleanEmail);
  if (!account) {
    throw new Error("No account found with this email. Please create an account first.");
  }

  const passwordHash = await hashPassword(password, account.salt);
  if (passwordHash !== account.passwordHash) {
    throw new Error("Incorrect password. Please try again.");
  }

  return {
    token: makeToken(),
    user: { id: account.id, name: account.name, email: account.email },
  };
}

export async function registerAccount(payload) {
  if (hasRemoteBackend) {
    const res = await api.post("/auth/register", payload);
    return res.data;
  }
  return registerLocally(payload);
}

export async function loginAccount(payload) {
  if (hasRemoteBackend) {
    const res = await api.post("/auth/login", payload);
    return res.data;
  }
  return loginLocally(payload);
}

export const authMode = hasRemoteBackend ? "remote" : "local";
