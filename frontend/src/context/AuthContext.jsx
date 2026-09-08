import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem("token") || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verifyAuth() {
      if (token) {
        try {
          const res = await api.get("/api/auth/me");
          if (res.data.success) {
            setUser(res.data.data);
            localStorage.setItem("user", JSON.stringify(res.data.data));
          }
        } catch (err) {
          logout();
        }
      }
      setLoading(false);
    }
    verifyAuth();
  }, [token]);

  const login = async (phoneOrEmail, password) => {
    const res = await api.post("/api/auth/login", {
      phone_or_email: phoneOrEmail,
      password,
    });
    if (res.data.success) {
      const { access_token, user: userData } = res.data.data;
      setToken(access_token);
      setUser(userData);
      localStorage.setItem("token", access_token);
      localStorage.setItem("user", JSON.stringify(userData));
      return userData;
    }
    throw new Error(res.data.message || "Login failed");
  };

  const register = async (userData) => {
    const res = await api.post("/api/auth/register", userData);
    if (res.data.success) {
      const { access_token, user: newUser } = res.data.data;
      setToken(access_token);
      setUser(newUser);
      localStorage.setItem("token", access_token);
      localStorage.setItem("user", JSON.stringify(newUser));
      return newUser;
    }
    throw new Error(res.data.message || "Registration failed");
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isAdmin: user?.role === "admin",
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
