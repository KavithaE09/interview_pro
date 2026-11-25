import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('interviewpro_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('interviewpro_token'));
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem('interviewpro_token');
    localStorage.removeItem('interviewpro_user');
    setToken(null);
    setUser(null);
  }, []);

  const login = useCallback((authToken, userData) => {
    localStorage.setItem('interviewpro_token', authToken);
    localStorage.setItem('interviewpro_user', JSON.stringify(userData));
    setToken(authToken);
    setUser(userData);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const verifyUser = async () => {
      if (token) {
        try {
          const res = await api.get('/auth/profile');
          if (!cancelled && res.data.success) {
            setUser(res.data.user);
            localStorage.setItem('interviewpro_user', JSON.stringify(res.data.user));
          }
        } catch (err) {
          if (cancelled) return;
          // Only logout on 401/403 — NOT on network errors (ECONNRESET, 500, etc.)
          const status = err?.response?.status;
          if (status === 401 || status === 403) {
            console.warn('Token invalid or expired — logging out.');
            logout();
          } else {
            console.warn('Profile check skipped (network/server error), keeping session:', err?.message);
          }
        }
      }
      if (!cancelled) setLoading(false);
    };

    verifyUser();
    return () => { cancelled = true; };
  }, [token, logout]);

  const value = {
    user,
    token,
    isAuthenticated: Boolean(token && user),
    isAdmin: user?.role === 'admin',
    login,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
