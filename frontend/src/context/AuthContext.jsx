import { createContext, useContext, useEffect, useState } from "react";
import { authApi, setToken } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem("buselink_token");
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await authApi.me();
        setUser(res.user);
      } catch {
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const login = async (email, password) => {
    const res = await authApi.login({ email, password });
    setToken(res.token);
    setUser(res.user);
    return res;
  };

  const register = async (payload) => {
    const res = await authApi.register(payload);
    setToken(res.token);
    setUser(res.user);
    return res;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore network errors on logout, still clear local state
    }
    setToken(null);
    setUser(null);
  };

  const loginWithToken = async (token) => {
    setToken(token);
    try {
      const res = await authApi.me();
      setUser(res.user);
    } catch {
      setToken(null);
      setUser(null);
      throw new Error("Invalid Google session");
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, logout, loginWithToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
