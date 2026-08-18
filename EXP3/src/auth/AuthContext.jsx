import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api } from "../api/axiosInstance.js";
import { isTokenExpired } from "./jwt.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    const token = localStorage.getItem("accessToken");
    if (stored && token && !isTokenExpired(localStorage.getItem("refreshToken"))) {
      return JSON.parse(stored);
    }
    return null;
  });
  const [authError, setAuthError] = useState("");

  const logout = useCallback(() => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    setUser(null);
  }, []);

  useEffect(() => {
    function handleSessionExpired() {
      logout();
      setAuthError("Your session expired. Please log in again.");
    }
    window.addEventListener("session-expired", handleSessionExpired);
    return () => window.removeEventListener("session-expired", handleSessionExpired);
  }, [logout]);

  async function login(username, password) {
    setAuthError("");
    const { data } = await api.post("/login", { username, password });
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }

  const value = {
    user,
    isAuthenticated: !!user,
    login,
    logout,
    authError,
    setAuthError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
