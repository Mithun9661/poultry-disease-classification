import { createContext, useContext, useEffect, useState } from "react";
import {
  clearSession,
  fetchCurrentUser,
  getStoredUser,
  getToken,
  loginWithMongo,
  registerWithMongo,
} from "./apiClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      const token = getToken();
      if (!token) {
        if (active) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      try {
        const currentUser = await fetchCurrentUser();
        if (active) setUser(currentUser || null);
      } catch {
        clearSession();
        if (active) setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    }

    restoreSession();
    return () => { active = false; };
  }, []);

  async function login(email, password) {
    const nextUser = await loginWithMongo(email, password);
    setUser(nextUser);
    return nextUser;
  }

  async function register(name, email, password) {
    const nextUser = await registerWithMongo(name, email, password);
    setUser(nextUser);
    return nextUser;
  }

  async function logout() {
    clearSession();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
