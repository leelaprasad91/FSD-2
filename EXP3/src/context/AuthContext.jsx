import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import * as authService from '../services/authService';
import { authRef } from '../services/api';
import { decodeToken, isTokenExpired } from '../services/fakeJwt';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [accessToken, setAccessTokenState] = useState(null);
  const [refreshToken, setRefreshTokenState] = useState(null);
  const [user, setUser] = useState(null);
  const [sessionMessage, setSessionMessage] = useState(null);
  const [log, setLog] = useState([]);

  const pushLog = useCallback((entry) => {
    setLog((prev) => [{ time: new Date().toLocaleTimeString(), ...entry }, ...prev].slice(0, 30));
  }, []);

  const setAccessToken = useCallback((token) => {
    setAccessTokenState(token);
    setUser(decodeToken(token));
    pushLog({ type: 'refresh', message: 'Access token refreshed after 401 (interceptor auto-retried the request)' });
  }, [pushLog]);

  const login = useCallback(async (username, password) => {
    const result = await authService.login(username, password);
    setAccessTokenState(result.accessToken);
    setRefreshTokenState(result.refreshToken);
    setUser(result.user);
    setSessionMessage(null);
    pushLog({ type: 'login', message: `Logged in as ${result.user.username} (${result.user.role})` });
    return result;
  }, [pushLog]);

  const logout = useCallback((message) => {
    setAccessTokenState(null);
    setRefreshTokenState(null);
    setUser(null);
    setSessionMessage(message || null);
    pushLog({ type: 'logout', message: message || 'Logged out' });
  }, [pushLog]);

  // Keep the module-level ref (read by axios interceptors) in sync with state.
  useEffect(() => {
    authRef.current = { accessToken, refreshToken, setAccessToken, logout };
  }, [accessToken, refreshToken, setAccessToken, logout]);

  // Client-side watchdog: if the access token expires and there is no
  // valid refresh token either, force logout (defense in depth — the
  // interceptor already handles the normal 401 -> refresh -> retry path).
  useEffect(() => {
    if (!accessToken) return;
    const id = setInterval(() => {
      if (isTokenExpired(accessToken) && (!refreshToken || isTokenExpired(refreshToken))) {
        logout('Session fully expired — please log in again.');
      }
    }, 1000);
    return () => clearInterval(id);
  }, [accessToken, refreshToken, logout]);

  const value = useMemo(
    () => ({ accessToken, refreshToken, user, login, logout, sessionMessage, setSessionMessage, log, pushLog }),
    [accessToken, refreshToken, user, login, logout, sessionMessage, log, pushLog]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
